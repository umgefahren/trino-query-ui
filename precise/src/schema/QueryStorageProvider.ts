import QueryInfo from './QueryInfo'
import QueryTemplate from './QueryTemplate'

/**
 * Abstraction for loading, saving, and deleting queries,
 * and for providing query templates.
 *
 * Implement this interface to plug in a custom persistence backend
 * (e.g. a REST API) or to supply query templates dynamically.
 * Pass your implementation to the QueryEditor component via the
 * `storageProvider` prop.
 */
interface QueryStorageProvider {
    /** Load all persisted queries. Called once during initialization. */
    loadQueries(): Promise<QueryInfo[]>
    /** Persist a single query (create or update). */
    saveQuery(query: QueryInfo): Promise<void>
    /** Delete a query by its id. */
    deleteQuery(queryId: string): Promise<void>
    /** Load available query templates. Return an empty array if none. */
    loadTemplates(): Promise<QueryTemplate[]>
}

export default QueryStorageProvider
