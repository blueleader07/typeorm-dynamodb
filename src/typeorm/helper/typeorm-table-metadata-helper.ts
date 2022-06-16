import { MetadataArgsStorage } from 'typeorm/metadata-args/MetadataArgsStorage'
import { getMetadataArgsStorage } from 'typeorm'
import { TableMetadataArgs } from 'typeorm/metadata-args/TableMetadataArgs'
import { ColumnMetadataArgs } from 'typeorm/metadata-args/ColumnMetadataArgs'

export const metadataArgsStorage: MetadataArgsStorage = getMetadataArgsStorage()

function convertToAttributeType (columnType?: any) {
    if (columnType) {
        switch (columnType.toString()) {
        case 'int':
        case 'decimal':
            return 'N'
        default:
            return 'S'
        }
    } else {
        return 'S'
    }
}

function findColumnAttributeType (tableName: string, columnName: string): string {
    const column: any = findColumn(tableName, columnName)
    return column ? convertToAttributeType(column.options.type) : 'S'
}

function isMatch (target: Function | string, targetName: string) {
    return (typeof target === 'string') ? target === targetName : target.name === targetName
}

export function findColumnDetails (targetName: string): ColumnMetadataArgs[] {
    return metadataArgsStorage.columns
        .filter((column: any) => isMatch(column.target, targetName))
        .map((column: any) => { return column })
}

export function findColumn (tableName: string, columnName: string): ColumnMetadataArgs {
    return findColumnDetails(tableName)
        .filter((column: ColumnMetadataArgs) => column.propertyName === columnName)
        .map((column: ColumnMetadataArgs) => { return column })[0]
}

export function findPrimaryColumn (targetName: string): ColumnMetadataArgs {
    return findColumnDetails(targetName)
        .filter((column: ColumnMetadataArgs) => column.options.primary)
        .map((column: ColumnMetadataArgs) => { return column })[0]
}

export function findTable (targetName: string) : TableMetadataArgs {
    return <TableMetadataArgs>metadataArgsStorage.tables
        .find((table:TableMetadataArgs) => isMatch(table.target, targetName))
}

export function buildTableDetails (targetName: string): any {
    const tableArgs: TableMetadataArgs = findTable(targetName)
    const primaryColumn: ColumnMetadataArgs = findPrimaryColumn(targetName)
    return {
        database: tableArgs.database,
        schema: tableArgs.schema,
        name: tableArgs.name,
        tableName: `${tableArgs.database}.${tableArgs.schema}.${tableArgs.name}`,
        partitionKey: {
            name: primaryColumn.propertyName,
            type: convertToAttributeType(primaryColumn.options.type)
        }
    }
}

export function buildIndexDetails (tableName: string): any[] {
    return metadataArgsStorage.indices
        .filter((index: any) => isMatch(index.target, tableName))
        .map((index: any) => {
            const indexKey = Array.isArray(index.columns) ? index.columns.join('#') : ''
            return {
                indexName: index.name ? index.name : '',
                partitionKey: { name: indexKey, type: findColumnAttributeType(tableName, indexKey) },
                sortKey: index.where ? { name: index.where ? index.where : '', type: findColumnAttributeType(tableName, index.where) } : undefined
            }
        })
}
