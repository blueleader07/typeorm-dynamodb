import { UpdateExpressionOptions } from '../models/UpdateExpressionOptions'
import { FindOptions } from '../models/FindOptions'
import { buildPartitionKey } from './DynamoGlobalSecondaryIndexHelper'
import { IndexMetadata } from 'typeorm/metadata/IndexMetadata'
import { isNotEmpty } from './DynamoObjectHelper'

const hasSortValue = (sortValues: any) => {
    if (sortValues && sortValues.length > 0) {
        for (const sortValue of sortValues) {
            if (sortValue !== '') {
                return true
            }
        }
    }
}

const indexedWhere = (
    options: FindOptions,
    indices?: IndexMetadata[]
) => {
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
        where[partitionKey] = values.length > 1 ? values.join('#') : values[0]
        if (index.where) {
            const sortColumns = index.where.split('#')
            const sortValues = []
            for (let i = 0; i < sortColumns.length; i += 1) {
                const sortValue = options.where[sortColumns[i]]
                if (sortValue) {
                    sortValues.push(options.where[sortColumns[i]])
                } else {
                    sortValues.push('')
                }
            }
            if (hasSortValue(sortValues)) {
                where[index.where] = sortValues.length > 1 ? sortValues.join('#') : sortValues[0]
            }
        }
    }
    return isNotEmpty(where) ? where : options.where
}

export const paramHelper = {
    find (
        tableName: string,
        options: FindOptions,
        indices?: IndexMetadata[]
    ) {
        options.where = indexedWhere(options, indices)
        const params: any = {
            TableName: tableName,
            KeyConditionExpression:
                FindOptions.toKeyConditionExpression(options),
            ExpressionAttributeNames:
                FindOptions.toAttributeNames(options),
            ExpressionAttributeValues:
                FindOptions.toExpressionAttributeValues(options),
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
    update (tableName: string, options: UpdateExpressionOptions) {
        return {
            TableName: tableName,
            Key: options.where,
            UpdateExpression:
                UpdateExpressionOptions.toUpdateExpression(options),
            ExpressionAttributeNames:
                UpdateExpressionOptions.toAttributeNames(options),
            ExpressionAttributeValues:
                UpdateExpressionOptions.toExpressionAttributeValues(
                    options
                )
        }
    }
}
