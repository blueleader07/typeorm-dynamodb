import { EntityMetadata, ObjectLiteral } from 'typeorm'
import { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata'
import { DynamodbDriver } from '../driver/dynamodb-driver'

export const buildPartitionKey = (columns: ColumnMetadata[]) => {
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

const primaryKeyAttributes = (metadata: EntityMetadata, driver: DynamodbDriver, attributeMap: Map<string, any>) => {
    for (let i = 0; i < metadata.primaryColumns.length; i += 1) {
        const primaryColumn = metadata.primaryColumns[i]
        attributeMap.set(primaryColumn.propertyName, {
            AttributeName: primaryColumn.propertyName,
            AttributeType: driver.normalizeDynamodbType(primaryColumn)
        })
    }
}

const keyAttributes = (metadata: EntityMetadata, driver: DynamodbDriver, key: string, attributeMap: Map<string, any>) => {
    if (key.includes('#')) {
        attributeMap.set(key, {
            AttributeName: key,
            AttributeType: 'S'
        })
    } else {
        const column = metadata.columns.find((column) => {
            return column.propertyName === key
        })
        if (column) {
            attributeMap.set(key, {
                AttributeName: key,
                AttributeType: driver.normalizeDynamodbType(column)
            })
        }
    }
}

const partitionKeyAttributes = (metadata: EntityMetadata, driver: DynamodbDriver, attributeMap: Map<string, any>) => {
    const indices = metadata.indices || []
    for (let i = 0; i < indices.length; i += 1) {
        const index = indices[i]
        const columns = index.columns || []
        const partitionKey = buildPartitionKey(columns)
        keyAttributes(metadata, driver, partitionKey, attributeMap)
        const sortKey = index.where || ''
        keyAttributes(metadata, driver, sortKey, attributeMap)
    }
}

export const buildAttributeDefinitions = (metadata: EntityMetadata, driver: DynamodbDriver) => {
    const attributeMap = new Map()
    primaryKeyAttributes(metadata, driver, attributeMap)
    partitionKeyAttributes(metadata, driver, attributeMap)
    return Array.from(attributeMap.values())
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
    return globalSecondaryIndexes.length > 0 ? globalSecondaryIndexes : undefined
}
