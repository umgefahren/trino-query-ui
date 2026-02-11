/** A reusable query template that can be loaded from a storage provider. */
interface QueryTemplate {
    /** Unique identifier for the template. */
    id: string
    /** Display name shown in the template menu. */
    title: string
    /** Optional longer description shown below the title in the template menu. */
    description?: string
    /** The SQL query text to populate when the template is selected. */
    query: string
    /** Optional default catalog for the query. */
    catalog?: string
    /** Optional default schema for the query. */
    schema?: string
    /** Optional category for grouping templates in the menu. */
    category?: string
}

export default QueryTemplate
