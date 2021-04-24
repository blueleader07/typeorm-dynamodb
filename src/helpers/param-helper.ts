import { UpdateOptions } from '../models/update-options'
import { FindOptions } from '../models/find-options'

export const paramHelper = {
    find (tableName: string, options: FindOptions) {
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
