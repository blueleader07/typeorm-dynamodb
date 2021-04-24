import { FindOptions } from '../models/find-options'
import { tableHelper } from '../helpers/table-helper'
import { UpdateOptions } from '../models/update-options'
import { paramHelper } from '../helpers/param-helper'
import AWS from 'aws-sdk'
import { batchHelper } from '../helpers/batch-helper'
import { ScanOptions } from '../models/scan-options'
import { BatchWriteItem } from '../models/batch-write-item'
import { commonUtils, Page, Pageable } from '@lmig/legal-nodejs-utils'
import { DynamoPage } from '../models/dynamo-page'

const DEFAULT_KEY_MAPPER = (item: any) => {
    return {
        id: item.id
    }
}

export class CrudRepository {
    tableName: string

    constructor (tableName: string) {
        this.tableName = tableHelper.name(tableName)
    }

    async get (key: any) {
        const dbClient = new AWS.DynamoDB.DocumentClient()
        const params = {
            TableName: this.tableName,
            Key: key
        }
        const results = await dbClient.get(params).promise()
        return results.Item
    }

    async find (options: FindOptions) {
        const dbClient = new AWS.DynamoDB.DocumentClient()
        const params = paramHelper.find(this.tableName, options)
        const results = await dbClient.query(params).promise()
        const items: any = results.Items || []
        items.lastEvaluatedKey = results.LastEvaluatedKey
        return items
    }

    async findAll (options: FindOptions) {
        delete options.limit
        const dbClient = new AWS.DynamoDB.DocumentClient()
        const params = paramHelper.find(this.tableName, options)
        let items: any[] = []
        let results = await dbClient.query(params).promise()
        items = items.concat(results.Items || [])
        while (results.LastEvaluatedKey) {
            params.ExclusiveStartKey = results.LastEvaluatedKey
            results = await dbClient.query(params).promise()
            items = items.concat(results.Items || [])
        }
        return items
    }

    /**
     * Queries by page size and exclusiveStartKey
     */
    async findPage (options: FindOptions, pageable: Pageable) {
        options.limit = commonUtils.isEmpty(pageable.pageSize) ? 15 : pageable.pageSize
        options.exclusiveStartKey = pageable.exclusiveStartKey
        const items = await this.find(options)
        return new DynamoPage(items, pageable, items.lastEvaluatedKey)
    }

    /**
     * Queries ALL items then returns the desired subset
     * WARNING: This is NOT an efficient way of querying dynamodb.
     * Please only use this if you must, preferably on light use pages
     */
    async findPageWithCountExpensive (options: FindOptions, pageable: Pageable) {
        const pageSize = commonUtils.isEmpty(pageable.pageSize) ? 15 : pageable.pageSize
        const pageNumber = commonUtils.isEmpty(pageable.pageNumber) ? 0 : pageable.pageNumber
        const items = await this.findAll(options)
        const start = pageNumber * pageSize
        let count = (pageNumber + 1) * pageSize
        if (start + count > items.length) {
            count = items.length - start
        }
        const subset = items.splice(start, count)
        return new Page(subset, pageable, subset.length + items.length)
    }

    async findOne (options: FindOptions) {
        options.limit = 1
        const items = await this.find(options)
        return items.length > 0 ? items[0] : null
    }

    async scan (options: ScanOptions) {
        const dbClient = new AWS.DynamoDB.DocumentClient()
        const params: any = {
            TableName: this.tableName
            // IndexName: findOptions.index,
            // KeyConditionExpression: FindOptions.toKeyConditionExpression(findOptions.where),
            // ExpressionAttributeValues: FindOptions.toExpressionAttributeValues(findOptions.where)
        }
        if (options.limit) {
            params.Limit = options.limit
        }
        if (options.exclusiveStartKey) {
            params.ExclusiveStartKey = options.exclusiveStartKey
        }
        const results = await dbClient.scan(params).promise()
        return results.Items || []
    }

    async put (content: any) {
        const dbClient = new AWS.DynamoDB.DocumentClient()
        const params = {
            TableName: this.tableName,
            Item: content
        }
        await dbClient.put(params).promise()
        return content
    }

    async deleteById (id: string) {
        const dbClient = new AWS.DynamoDB.DocumentClient()
        const params = {
            TableName: this.tableName,
            Key: { id: id }
        }
        return dbClient.delete(params).promise()
    }

    async delete (key: any) {
        const dbClient = new AWS.DynamoDB.DocumentClient()
        const params = {
            TableName: this.tableName,
            Key: key
        }
        return dbClient.delete(params).promise()
    }

    async deleteAllBy (options: FindOptions, keyMapper?: any) {
        options.limit = options.limit || 500
        await this.deleteQueryBatch(options, keyMapper)
    }

    async deleteQueryBatch (options: FindOptions, keyMapper?: any) {
        const items: any[] = await this.find(options)
        if (items.length > 0) {
            keyMapper = keyMapper || DEFAULT_KEY_MAPPER
            const keys = items.map(keyMapper)
            await this.deleteAll(keys)
            await this.deleteQueryBatch(options, keyMapper)
        }
    }

    async deleteAll (keys: any[]) {
        if (keys.length > 0) {
            const dbClient = new AWS.DynamoDB.DocumentClient()
            const batches = batchHelper.batch(keys)
            const promises = batches.map((batch: any) => {
                const RequestItems: any = {}
                RequestItems[this.tableName] = batch.map((Key: any) => {
                    return {
                        DeleteRequest: {
                            Key
                        }
                    }
                })
                return dbClient.batchWrite({
                    RequestItems
                }).promise()
            })
            return Promise.all(promises)
        }
    }

    async putAll (items: any[]) {
        if (items.length > 0) {
            const dbClient = new AWS.DynamoDB.DocumentClient()
            const batches = batchHelper.batch(items)
            const promises = batches.map((batch: any) => {
                const RequestItems: any = {}
                RequestItems[this.tableName] = batch.map((Item: any) => {
                    return {
                        PutRequest: {
                            Item
                        }
                    }
                })
                return dbClient.batchWrite({
                    RequestItems
                }).promise()
            })
            return Promise.all(promises)
        }
    }

    async update (options: UpdateOptions) {
        const dbClient = new AWS.DynamoDB.DocumentClient()
        const params = paramHelper.update(this.tableName, options)
        return dbClient.update(params).promise()
    }

    async batchRead (keys: any[]) {
        const dbClient = new AWS.DynamoDB.DocumentClient()
        const batches = batchHelper.batch(keys, 100)
        let items: any[] = []
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i]
            const requestItems: any = {}
            requestItems[this.tableName] = {
                Keys: batch
            }
            const response = await dbClient.batchGet({
                RequestItems: requestItems
            }).promise()
            if (response.Responses !== undefined) {
                items = items.concat(response.Responses[this.tableName])
            }
        }
        return items
    }

    async batchWrite (writes: BatchWriteItem[]) {
        const dbClient = new AWS.DynamoDB.DocumentClient()
        const batches = batchHelper.batch(writes, 25)
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i]
            const requestItems: any = {}
            requestItems[this.tableName] = batch.map(write => {
                const request: any = {}
                request[write.type] = {
                    Item: write.item
                }
                return request
            })
            await dbClient.batchWrite({
                RequestItems: requestItems
            }).promise()
        }
    }
}
