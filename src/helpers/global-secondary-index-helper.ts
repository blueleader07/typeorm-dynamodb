import { EntityMetadata, ObjectLiteral } from 'typeorm'
import { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata'

const partitionKeyColumns = (columns: ColumnMetadata[], doc: ObjectLiteral) => {
    if (columns.length > 1) {
        const partitionKey = columns.map((column) => {
            return column.propertyName
        }).join('#')
        doc[partitionKey] = columns.map((column) => {
            return doc[column.propertyName]
        }).join('#')
    }
}

const sortKeyColumns = (sortKey: string, doc: ObjectLiteral) => {
    const columns = sortKey.split('#')
    if (columns.length > 1) {
        doc[sortKey] = columns.map((column) => {
            return doc[column]
        }).join('#')
    }
}

export const indexedColumns = (metadata: EntityMetadata, doc: any) => {
    const indices = metadata.indices || []
    for (let i = 0; i < indices.length; i += 1) {
        const index = indices[i]
        const columns = index.columns || []
        partitionKeyColumns(columns, doc)
        sortKeyColumns(index.where || '', doc)
    }
}
