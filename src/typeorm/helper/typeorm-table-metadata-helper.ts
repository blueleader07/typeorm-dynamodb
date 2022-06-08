import { MetadataArgsStorage } from 'typeorm/metadata-args/MetadataArgsStorage'
import { getMetadataArgsStorage } from 'typeorm'
import { TableMetadataArgs } from 'typeorm/metadata-args/TableMetadataArgs'
import { ColumnMetadataArgs } from 'typeorm/metadata-args/ColumnMetadataArgs'

export const metadataArgsStorage: MetadataArgsStorage = getMetadataArgsStorage()

function findColumnAttributeType (tableName: string, columnName: string): string {
    const column: any = findColumn(tableName, columnName)
    return column ? column.options.type : 'varchar'
}

export function findTableName (entityName: string): string {
    const tableArgs = getMetadataArgsStorage().tables.find((table:TableMetadataArgs) => (typeof table.target === 'string') ? table.target === entityName : table.target.name === entityName)
    return tableArgs ? tableArgs.name || entityName : entityName
}

export function findColumnDetails (tableName: string): ColumnMetadataArgs[] {
    return metadataArgsStorage.columns
        .filter((column: any) => column.target === tableName)
        .map((column: any) => { return column })
}

export function findColumn (tableName: string, columnName: string): ColumnMetadataArgs {
    return findColumnDetails(tableName)
        .filter((column: ColumnMetadataArgs) => column.propertyName === columnName)
        .map((column: ColumnMetadataArgs) => { return column })[0]
}

export function findPrimaryColumn (tableName: string): ColumnMetadataArgs {
    return findColumnDetails(tableName)
        .filter((column: ColumnMetadataArgs) => column.options.primary)
        .map((column: ColumnMetadataArgs) => { return column })[0]
}

export function findTable (tableName: string) : TableMetadataArgs {
    return <TableMetadataArgs>metadataArgsStorage.tables.find((table: any) => table.target === tableName)
}

export function buildTableDetails (tableName: string): any {
    const tableArgs = findTable(tableName)
    const primaryColumn: ColumnMetadataArgs = findPrimaryColumn(tableName)
    return {
        database: tableArgs.database,
        schema: tableArgs.schema,
        name: tableArgs.name,
        tableName: `${tableArgs.database}.${tableArgs.schema}.${tableArgs.name}`,
        partitionKey: {
            name: primaryColumn.propertyName,
            type: primaryColumn.options.type
        }
    }
}

export function buildIndexDetails (tableName: string): any[] {
    return metadataArgsStorage.indices
        .filter((index: any) => index.target === tableName)
        .map((index: any) => {
            const indexKey = Array.isArray(index.columns) ? index.columns.join('#') : ''
            return {
                indexName: index.name ? index.name : '',
                partitionKey: { name: indexKey, type: findColumnAttributeType(tableName, indexKey) },
                sortKey: index.where ? { name: index.where ? index.where : '', type: findColumnAttributeType(tableName, index.where) } : undefined
            }
        })
}
