import { UpdateOptions } from '../models/update-options'
import { FindOptions } from '../models/find-options'
import { buildPartitionKey } from './global-secondary-index-helper'
import { IndexMetadata } from 'typeorm/metadata/IndexMetadata'
import { commonUtils } from '@lmig/legal-nodejs-utils'

const indexedWhere = (options: FindOptions, indices?: IndexMetadata[]) => {
    indices = indices || []
    const index = indices.find((index) => {
        return index.name === options.index
    })
    const where: any = {}
    if (index && options.where) {
        const columns = index.columns || []
        const partitionKey = buildPartitionKey(columns)
        const values = []
        for (let i = 0; i < columns.length; i += 1) {
            const column = columns[i]
            const value = options.where[column.propertyName]
            values.push(value)
        }
        where[partitionKey] = values.join('#')
    }
    return commonUtils.isNotEmpty(where) ? where : options.where
}

export const paramHelper = {

    find (tableName: string, options: FindOptions, indices?: IndexMetadata[]) {
        options.where = indexedWhere(options, indices)
        const params: any = {
            TableName: tableName,
            KeyConditionExpression: FindOptions.toKeyConditionExpression(options),
            ExpressionAttributeNames: FindOptions.toAttributeNames(options),
            ExpressionAttributeValues: FindOptions.toExpressionAttributeValues(options),
            ScanIndexForward: options.sort !== 'DESC'
        }
        if (options.index) {
            params.IndexName = options.index
        }
        if (options.limit) {
            params.Limit = options.limit
        }
        if (options.exclusiveStartKey) {
            params.ExclusiveStartKey = options.exclusiveStartKey
        }
        return params
    },
    update (tableName: string, options: UpdateOptions) {
        return {
            TableName: tableName,
            Key: options.where,
            UpdateExpression: UpdateOptions.toUpdateExpression(options),
            ExpressionAttributeNames: UpdateOptions.toAttributeNames(options),
            ExpressionAttributeValues: UpdateOptions.toExpressionAttributeValues(options)
        }
    }
}
