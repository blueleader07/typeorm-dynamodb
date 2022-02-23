import { EntityMetadata, ObjectLiteral } from 'typeorm'
import { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata'

const buildPartitionKey = (columns: ColumnMetadata[]) => {
    return columns.map((column) => {
        return column.propertyName
    }).join('#')
}

const partitionKeyColumns = (columns: ColumnMetadata[], doc: ObjectLiteral) => {
    if (columns.length > 1) {
        const partitionKey = buildPartitionKey(columns)
        doc[partitionKey] = columns.map((column) => {
            return doc[column.propertyName]
        }).join('#')
    }
}

const buildSortKey = (sortKey: string) => {

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

export const buildGlobalSecondaryIndexes = (metadata: EntityMetadata) => {
    const globalSecondaryIndexes: any[] = []
    const indices = metadata.indices || []
    for (let i = 0; i < indices.length; i += 1) {
        const index = indices[i]
        const globalSecondaryIndex: any = {}
        globalSecondaryIndex.IndexName = index.name
        globalSecondaryIndex.KeySchema = []
        const columns = index.columns || []
        const partitionKey = buildPartitionKey(columns)
        globalSecondaryIndex.KeySchema.push({
            AttributeName: partitionKey,
            KeyType: 'HASH'
        })
        const sortKey = index.where || ''
        if (sortKey) {
            globalSecondaryIndex.KeySchema.push({
                AttributeName: sortKey,
                KeyType: 'RANGE'
            })
        }
        globalSecondaryIndex.Projection = {
            ProjectionType: 'ALL'
        }
        globalSecondaryIndexes.push(globalSecondaryIndex)
    }
    return globalSecondaryIndexes
}
