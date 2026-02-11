import React, { useState } from 'react'
import {
    Box,
    IconButton,
    Popover,
    TextField,
    List,
    ListItemButton,
    ListItemText,
    Typography,
    Tooltip,
} from '@mui/material'
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder'
import QueryTemplate from '../../schema/QueryTemplate'

interface TemplateMenuProps {
    templates: QueryTemplate[]
    onTemplateSelect: (template: QueryTemplate) => void
}

// Popover menu for selecting a query template. Follows the same pattern
// as TabsEllipsesMenu: icon button that opens a filterable list.
function TemplateMenu({ templates, onTemplateSelect }: TemplateMenuProps) {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
    const [filter, setFilter] = useState('')

    // Don't render anything when there are no templates
    if (templates.length === 0) {
        return null
    }

    const isOpen = Boolean(anchorEl)
    const lowerFilter = filter.toLowerCase()
    const filteredTemplates = templates.filter(
        (t) =>
            t.title.toLowerCase().includes(lowerFilter) ||
            (t.description && t.description.toLowerCase().includes(lowerFilter)) ||
            (t.category && t.category.toLowerCase().includes(lowerFilter))
    )

    // Group by category (uncategorized templates use '' as key)
    const grouped = new Map<string, QueryTemplate[]>()
    for (const t of filteredTemplates) {
        const cat = t.category ?? ''
        if (!grouped.has(cat)) grouped.set(cat, [])
        grouped.get(cat)!.push(t)
    }

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation()
        setAnchorEl(event.currentTarget)
    }

    const handleClose = () => {
        setAnchorEl(null)
        setFilter('')
    }

    return (
        <Box>
            <Tooltip title="Query templates">
                <IconButton size="small" aria-label="Query templates" onClick={handleClick}>
                    <BookmarkBorderIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            <Popover
                open={isOpen}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                slotProps={{ paper: { sx: { p: 1, width: 320 } } }}
            >
                <Box onMouseDown={(e) => e.stopPropagation()}>
                    <TextField
                        autoFocus
                        fullWidth
                        size="small"
                        type="search"
                        placeholder="Filter templates..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        sx={{ mb: 1 }}
                    />
                    <List dense disablePadding sx={{ maxHeight: 400, overflow: 'auto' }}>
                        {[...grouped.entries()].map(([category, items]) => (
                            <React.Fragment key={category}>
                                {category && (
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            px: 1,
                                            py: 0.5,
                                            display: 'block',
                                            color: 'text.secondary',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {category}
                                    </Typography>
                                )}
                                {items.map((template) => (
                                    <ListItemButton
                                        key={template.id}
                                        onClick={() => {
                                            onTemplateSelect(template)
                                            handleClose()
                                        }}
                                        sx={{ gap: 1 }}
                                    >
                                        <ListItemText
                                            primary={template.title}
                                            secondary={template.description}
                                            slotProps={{
                                                primary: { noWrap: true },
                                                secondary: { noWrap: true, sx: { fontSize: '0.75rem' } },
                                            }}
                                        />
                                    </ListItemButton>
                                ))}
                            </React.Fragment>
                        ))}
                    </List>
                </Box>
            </Popover>
        </Box>
    )
}

export default TemplateMenu
