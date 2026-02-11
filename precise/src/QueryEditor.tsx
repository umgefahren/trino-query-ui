import React, { useEffect, useRef, useState } from 'react'
import { styled } from '@mui/material/styles'
import { Box, CircularProgress, Drawer, useMediaQuery } from '@mui/material'
import CssBaseline from '@mui/material/CssBaseline'
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar'
import { ThemeProvider } from '@mui/material/styles'
import { v4 as uuidv4 } from 'uuid'
import QueryCell from './QueryCell'
import { darkTheme, lightTheme } from './theme'
import Queries from './schema/Queries'
import QueryInfo from './schema/QueryInfo'
import QueryType from './schema/QueryType'
import QueryTemplate from './schema/QueryTemplate'
import QueryStorageProvider from './schema/QueryStorageProvider'
import LocalStorageProvider from './schema/LocalStorageProvider'
import CatalogViewer from './controls/catalog_viewer/CatalogViewer'

interface IQueryEditor {
    /** Height of the editor component in pixels. */
    height: number
    /** Color theme. Follows system preference when not set. */
    theme?: 'dark' | 'light'
    /** Enable column search in the catalog viewer sidebar. */
    enableCatalogSearchColumns?: boolean
    /**
     * Storage provider for query persistence and templates.
     *
     * Implement the {@link QueryStorageProvider} interface to plug in a
     * custom backend (e.g. a REST API). When omitted, a default
     * {@link LocalStorageProvider} is used which persists queries in the
     * browser's localStorage and surfaces no templates.
     */
    storageProvider?: QueryStorageProvider
}

const DRAWER_WIDTH = 260

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
    open?: boolean
}>(({ theme }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: 0,
    variants: [
        {
            props: ({ open }) => open,
            style: {
                transition: theme.transitions.create('margin', {
                    easing: theme.transitions.easing.easeOut,
                    duration: theme.transitions.duration.enteringScreen,
                }),
                marginLeft: `${DRAWER_WIDTH}px`,
            },
        },
    ],
}))

interface AppBarProps extends MuiAppBarProps {
    open?: boolean
}

const AppBar = styled(MuiAppBar, {
    shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme }) => ({
    position: 'absolute',
    boxShadow: 'none',
    borderBottom: `1px solid ${theme.palette.divider}`,
    transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    variants: [
        {
            props: ({ open }) => open,
            style: {
                width: `calc(100% - ${DRAWER_WIDTH}px)`,
                marginLeft: `${DRAWER_WIDTH}px`,
                transition: theme.transitions.create(['margin', 'width'], {
                    easing: theme.transitions.easing.easeOut,
                    duration: theme.transitions.duration.enteringScreen,
                }),
            },
        },
    ],
}))

export const QueryEditor = ({ height, theme, enableCatalogSearchColumns, storageProvider }: IQueryEditor) => {
    const [queries, setQueries] = useState<Queries | null>(null)
    const [templates, setTemplates] = useState<QueryTemplate[]>([])
    const [loading, setLoading] = useState(true)
    const [drawerOpen, setDrawerOpen] = useState<boolean>(true)
    const [currentQuery, setCurrentQuery] = useState<QueryInfo | null>(null)
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')
    const containerRef = useRef(null)

    // Load queries and templates from the provider asynchronously
    useEffect(() => {
        let cancelled = false
        const provider = storageProvider ?? new LocalStorageProvider()

        async function initialize() {
            try {
                const [loadedQueries, loadedTemplates] = await Promise.all([
                    provider.loadQueries(),
                    provider.loadTemplates(),
                ])

                if (cancelled) return

                // Handle query from URL (moved here because the provider is async)
                const urlParams = new URLSearchParams(window.location.search)
                const urlQuery = urlParams.get('q')
                const urlTitle = urlParams.get('n') ?? 'Imported Query'
                if (urlQuery) {
                    const imported = new QueryInfo(urlTitle, QueryType.FROM_QUERY_STRING, urlQuery, uuidv4(), false)
                    loadedQueries.push(imported)
                    provider.saveQuery(imported).catch((e) => console.error('Error saving imported query:', e))
                }

                const q = new Queries(provider, loadedQueries)
                setQueries(q)
                setTemplates(loadedTemplates)
                setCurrentQuery(q.getCurrentQuery())
                setLoading(false)
            } catch (e) {
                console.error('Error initializing query editor:', e)
                if (cancelled) return
                // Fallback: create an empty Queries instance so the editor remains usable
                const q = new Queries(provider)
                setQueries(q)
                setCurrentQuery(q.getCurrentQuery())
                setLoading(false)
            }
        }

        initialize()
        return () => {
            cancelled = true
        }
    }, [storageProvider])

    const muiThemeToUse = () => {
        if (theme === 'dark') {
            return darkTheme
        } else if (theme === 'light') {
            return lightTheme
        } else if (prefersDarkMode) {
            return darkTheme
        } else {
            return lightTheme
        }
    }

    // Show a spinner while the provider loads
    if (loading || !queries) {
        return (
            <ThemeProvider theme={muiThemeToUse()}>
                <CssBaseline />
                <Box
                    sx={{
                        border: 1,
                        borderColor: 'divider',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height,
                    }}
                >
                    <CircularProgress size={32} />
                </Box>
            </ThemeProvider>
        )
    }

    const applyQueryUpdates = (updates: Partial<QueryInfo>) => {
        const activeQuery = queries.getCurrentQuery()

        if (!activeQuery) {
            return
        }

        queries.updateQuery(activeQuery.id, updates)
        setCurrentQuery((prev) => (prev ? { ...prev, ...updates } : prev))
    }

    const setQueryContent = (query: string, catalog?: string, schema?: string) => {
        const updates: Partial<QueryInfo> = {}

        if (query) {
            updates.query = query
        }

        if (catalog) {
            updates.catalog = catalog
        }

        if (schema) {
            updates.schema = schema
        }

        applyQueryUpdates(updates)
    }

    const appendQueryContent = (query: string, catalog?: string, schema?: string) => {
        const activeQuery = queries.getCurrentQuery()
        const updates: Partial<QueryInfo> = {}

        if (query !== undefined) {
            const existingQuery = activeQuery.query || ''
            const separator = existingQuery.trim() === '' || query.trim() === '' ? '' : '\n\n'
            updates.query = existingQuery + separator + query
        }

        if (catalog !== undefined) {
            updates.catalog = catalog
        }

        if (schema !== undefined) {
            updates.schema = schema
        }

        applyQueryUpdates(updates)
    }

    return (
        <ThemeProvider theme={muiThemeToUse()}>
            <CssBaseline />
            <Box
                ref={containerRef}
                sx={{
                    border: 1,
                    borderColor: 'divider',
                    position: 'relative',
                    overflow: 'hidden',
                    height: height,
                }}
            >
                <AppBar color="transparent" open={drawerOpen} />

                <Drawer
                    sx={{
                        width: DRAWER_WIDTH,
                        flexShrink: 0,
                        '& .MuiDrawer-paper': {
                            width: DRAWER_WIDTH,
                            boxSizing: 'border-box',
                        },
                    }}
                    variant="persistent"
                    anchor="left"
                    open={drawerOpen}
                    ModalProps={{
                        container: containerRef.current,
                        disablePortal: true,
                    }}
                    slotProps={{
                        paper: {
                            sx: {
                                position: 'absolute',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',
                            },
                        },
                    }}
                >
                    <CatalogViewer
                        onGenerateQuery={setQueryContent}
                        onAppendQuery={appendQueryContent}
                        onDrawerToggle={() => setDrawerOpen(false)}
                        enableSearchColumns={enableCatalogSearchColumns}
                    />
                </Drawer>

                <Main open={drawerOpen} sx={{ p: 0 }}>
                    <QueryCell
                        queries={queries}
                        templates={templates}
                        drawerOpen={drawerOpen}
                        height={height}
                        onDrawerToggle={() => setDrawerOpen(true)}
                        theme={theme}
                    />
                </Main>
            </Box>
        </ThemeProvider>
    )
}

export default QueryEditor
