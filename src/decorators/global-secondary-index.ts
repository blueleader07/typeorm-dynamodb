import { getMetadataArgsStorage } from 'typeorm'
import { IndexMetadataArgs } from 'typeorm/metadata-args/IndexMetadataArgs'

export interface GlobalSecondaryIndexOptions {
    name: string
    partitionKey: string
    sortKey: string
}

/**
 * Creates a database index.
 * Can be used on entity.
 * Can create indices with composite columns when used on entity.
 */
export function GlobalSecondaryIndex (options: GlobalSecondaryIndexOptions): ClassDecorator {
    // normalize parameters
    options = options || {}
    const name = options.name
    const partitionColumns = options.partitionKey.split('#')
    // const fields = [options.partitionKey, options.sortKey]

    return function (clsOrObject: Function|Object, propertyName?: string | symbol) {
        getMetadataArgsStorage().indices.push({
            target: propertyName ? clsOrObject.constructor : clsOrObject as Function,
            name: name,
            columns: propertyName ? [propertyName] : partitionColumns,
            where: options.sortKey
        } as IndexMetadataArgs)
    }
}
