import QueryInfo from './QueryInfo'
import QueryTemplate from './QueryTemplate'
import QueryStorageProvider from './QueryStorageProvider'

/** Options for the default localStorage-backed storage provider. */
interface LocalStorageProviderOptions {
    /** Static query templates to surface in the template menu. */
    templates?: QueryTemplate[]
}

/**
 * Default storage provider that persists queries in the browser's localStorage.
 *
 * This preserves the original behavior of the QueryEditor component.
 * Pass an instance to the `storageProvider` prop of QueryEditor, or omit the
 * prop entirely to use this provider with no templates.
 *
 * @example
 * ```tsx
 * // With static templates
 * const provider = new LocalStorageProvider({
 *     templates: [
 *         { id: '1', title: 'Count rows', query: 'SELECT count(*) FROM my_table' },
 *     ],
 * })
 * <QueryEditor storageProvider={provider} height={600} />
 * ```
 */
class LocalStorageProvider implements QueryStorageProvider {
    private templates: QueryTemplate[]

    constructor(options?: LocalStorageProviderOptions) {
        this.templates = options?.templates ?? []
    }

    async loadQueries(): Promise<QueryInfo[]> {
        const queryList: QueryInfo[] = []
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && key.startsWith('query_')) {
                const value = localStorage.getItem(key)
                if (value) {
                    try {
                        const queryInfo = JSON.parse(value)
                        queryList.push(
                            new QueryInfo(
                                queryInfo.title,
                                queryInfo.type,
                                queryInfo.query,
                                queryInfo.id,
                                queryInfo.isPinned,
                                queryInfo.catalog,
                                queryInfo.schema
                            )
                        )
                    } catch (e) {
                        console.error('Error parsing stored query:', e)
                        localStorage.removeItem(key)
                    }
                }
            }
        }
        return queryList
    }

    async saveQuery(query: QueryInfo): Promise<void> {
        localStorage.setItem(`query_${query.id}`, JSON.stringify(query))
    }

    async deleteQuery(queryId: string): Promise<void> {
        localStorage.removeItem(`query_${queryId}`)
    }

    async loadTemplates(): Promise<QueryTemplate[]> {
        return [...this.templates]
    }
}

export default LocalStorageProvider
