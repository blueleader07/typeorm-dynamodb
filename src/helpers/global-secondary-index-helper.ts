import { EntityMetadata, ObjectLiteral } from 'typeorm'
import { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata'
import { DynamodbDriver } from '../driver/dynamodb-driver'
import { PlatformTools } from 'typeorm/platform/PlatformTools'
import { waitUntilActive } from './table-helper'

export const buildPartitionKey = (columns: ColumnMetadata[]) => {
    return columns.map((column) => {
        return column.propertyName
    }).join('#')
}

const partitionKeyColumns = (columns: ColumnMetadata[], doc: ObjectLiteral) => {
    if (columns.length > 1) {
        const partitionKey = buildPartitionKey(columns)
        doc[partitionKey] = columns.map((column) => {
            const value = doc[column.propertyName]
            if (!value) {
                throw new Error(`value not provided for indexed column: ${column.propertyName}`)
            }
            return value
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

export const updateGlobalSecondaryIndexes = async (db: any, tableName: string, attributeDefinitions: any[], globalSecondaryIndexes: any[]) => {
    try {
        const existing = await db.describeTable({
            TableName: tableName
        }).promise()
        const existingGlobalSecondaryIndexes = existing.Table.GlobalSecondaryIndexes || []
        const map = new Map()
        existingGlobalSecondaryIndexes.forEach((existingGlobalSecondaryIndex: any) => {
            map.set(existingGlobalSecondaryIndex.IndexName, existingGlobalSecondaryIndex)
        })
        for (let i = 0; i < globalSecondaryIndexes.length; i += 1) {
            const globalSecondaryIndex = globalSecondaryIndexes[i]
            const existing = map.get(globalSecondaryIndex.IndexName)
            if (existing) {
                // has anything changed?
                const keySchemaChanged = JSON.stringify(existing.KeySchema) !== JSON.stringify(globalSecondaryIndex.KeySchema)
                const projectionChanged = JSON.stringify(existing.Projection) !== JSON.stringify(globalSecondaryIndex.Projection)
                if (keySchemaChanged || projectionChanged) {
                    await deleteGlobalSecondaryIndex(db, tableName, globalSecondaryIndex.IndexName)
                    await addGlobalSecondaryIndex(db, tableName, attributeDefinitions, globalSecondaryIndex)
                }
            } else {
                await addGlobalSecondaryIndex(db, tableName, attributeDefinitions, globalSecondaryIndex)
            }
            map.delete(globalSecondaryIndex.IndexName)
        }
        const deletedIndexes = Array.from(map.values())
        for (let i = 0; i < deletedIndexes.length; i += 1) {
            const deletedIndex = deletedIndexes[i]
            await deleteGlobalSecondaryIndex(db, tableName, deletedIndex.IndexName)
        }
    } catch (error) {
        const _error: any = error
        PlatformTools.logError('failed to update table indexes.', _error)
    }
}

export const deleteGlobalSecondaryIndex = async (db: any, tableName: string, indexName: string) => {
    try {
        PlatformTools.logInfo('deleting index:', indexName)
        await db.updateTable({
            TableName: tableName,
            GlobalSecondaryIndexUpdates: [
                {
                    Delete: { IndexName: indexName }
                }
            ]
        }).promise()
        await waitUntilActive(db, tableName)
    } catch (error) {
        const _error: any = error
        PlatformTools.logError(`failed to update table: ${tableName}`, _error)
    }
}

export const addGlobalSecondaryIndex = async (db: any, tableName: string, attributeDefinitions: any[], globalSecondaryIndex: any) => {
    try {
        PlatformTools.logInfo('creating index:', globalSecondaryIndex.IndexName)
        await db.updateTable({
            TableName: tableName,
            AttributeDefinitions: attributeDefinitions,
            GlobalSecondaryIndexUpdates: [
                {
                    Create: {
                        KeySchema: globalSecondaryIndex.KeySchema,
                        Projection: globalSecondaryIndex.Projection,
                        IndexName: globalSecondaryIndex.IndexName
                    }
                }
            ]
        }).promise()
        await waitUntilActive(db, tableName)
    } catch (error) {
        const _error: any = error
        PlatformTools.logError(`failed to create index: ${globalSecondaryIndex.IndexName}`, _error)
    }
}
