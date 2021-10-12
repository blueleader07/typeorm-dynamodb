import { FindOptions } from '../models/find-options'
import { UpdateOptions } from '../models/update-options'
import { paramHelper } from '../helpers/param-helper'
import AWS from 'aws-sdk'
import { batchHelper } from '../helpers/batch-helper'
import { ScanOptions } from '../models/scan-options'
import { BatchWriteItem } from '../models/batch-write-item'
import {
    DeepPartial,
    EntityMetadata, FindConditions, FindOneOptions,
    ObjectID,
    ObjectLiteral,
    SelectQueryBuilder
} from 'typeorm'
import { DynamodbReadStream } from '../streams/dynamodb-read-stream'
import { DynamoDbEntityManager } from '../entity-manager/dynamodb-entity-manager'
import { DynamodbQueryRunner } from '../driver/dynamodb-query-runner'

const DEFAULT_KEY_MAPPER = (item: any) => {
    return {
        id: item.id
    }
}

export class Repository<Entity extends ObjectLiteral> {
    /**
     * Entity Manager used by this repository.
     */
    readonly manager: DynamoDbEntityManager;

    /**
     * Entity metadata of the entity current repository manages.
     */
    readonly metadata: EntityMetadata;

    /**
     * Query runner provider used for this repository.
     */
    readonly queryRunner?: DynamodbQueryRunner;

    /**
     * Creates a new query builder that can be used to build a sql query.
     */
    createQueryBuilder (alias?: string, queryRunner?: DynamodbQueryRunner): SelectQueryBuilder<Entity> {
        return this.manager.createQueryBuilder<Entity>(this.metadata.target as any, alias || this.metadata.targetName, queryRunner || this.queryRunner)
    }

    async get (key: any) {
        const dbClient = new AWS.DynamoDB.DocumentClient()
        const params = {
            TableName: this.metadata.tableName,
            Key: key
        }
        const results = await dbClient.get(params).promise()
        return results.Item
    }

    async find (options: FindOptions) {
        const dbClient = new AWS.DynamoDB.DocumentClient()
        const params = paramHelper.find(this.metadata.tableName, options)
        const results = await dbClient.query(params).promise()
        const items: any = results.Items || []
        items.lastEvaluatedKey = results.LastEvaluatedKey
        return items
    }

    async findAll (options: FindOptions) {
        delete options.limit
        const dbClient = new AWS.DynamoDB.DocumentClient()
        const params = paramHelper.find(this.metadata.tableName, options)
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
     * Finds first entity that matches given conditions.
     */
    findOne (optionsOrConditions?: string|number|Date|ObjectID|FindOneOptions<Entity>|FindConditions<Entity>, maybeOptions?: FindOneOptions<Entity>) {
        return this.manager.findOne(this.metadata.target as any, optionsOrConditions as any, maybeOptions)
    }

    async scan (options: ScanOptions) {
        const dbClient = new AWS.DynamoDB.DocumentClient()
        const params: any = {
            TableName: this.metadata.tableName
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
        const results: any = await dbClient.scan(params).promise()
        const items = results.Items || []
        items.LastEvaluatedKey = results.LastEvaluatedKey
        return items
    }

    async put (content: DeepPartial<Entity>) {
        const dbClient = new AWS.DynamoDB.DocumentClient()
        const params = {
            TableName: this.metadata.tableName,
            Item: content
        }
        await dbClient.put(params).promise()
        return content
    }

    async insert (content: DeepPartial<Entity | Entity[]>) {
        if (Array.isArray(content)) {
            return this.putAll(content)
        }
        return this.put(content)
    }

    async deleteById (id: string) {
        const dbClient = new AWS.DynamoDB.DocumentClient()
        const params = {
            TableName: this.metadata.tableName,
            Key: { id: id }
        }
        return dbClient.delete(params).promise()
    }

    async deleteAll (keyMapper?: any) {
        const items = await this.scan({ limit: 500 })
        if (items.length > 0) {
            const itemIds = items.map(keyMapper || DEFAULT_KEY_MAPPER)
            await this.deleteBatch(itemIds)
            await this.deleteAll(keyMapper)
        }
    }

    async delete (key: any) {
        const dbClient = new AWS.DynamoDB.DocumentClient()
        const params = {
            TableName: this.metadata.tableName,
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
            await this.deleteBatch(keys)
            await this.deleteQueryBatch(options, keyMapper)
        }
    }

    async deleteBatch (keys: any[]) {
        if (keys.length > 0) {
            const dbClient = new AWS.DynamoDB.DocumentClient()
            const batches = batchHelper.batch(keys)
            const promises = batches.map((batch: any) => {
                const RequestItems: any = {}
                RequestItems[this.metadata.tableName] = batch.map((Key: any) => {
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
                RequestItems[this.metadata.tableName] = batch.map((Item: any) => {
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
        const params = paramHelper.update(this.metadata.tableName, options)
        return dbClient.update(params).promise()
    }

    async batchRead (keys: any[]) {
        const dbClient = new AWS.DynamoDB.DocumentClient()
        const batches = batchHelper.batch(keys, 100)
        let items: any[] = []
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i]
            const requestItems: any = {}
            requestItems[this.metadata.tableName] = {
                Keys: batch
            }
            const response = await dbClient.batchGet({
                RequestItems: requestItems
            }).promise()
            if (response.Responses !== undefined) {
                items = items.concat(response.Responses[this.metadata.tableName])
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
            requestItems[this.metadata.tableName] = batch.map(write => {
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

    async streamAll () {
        // const stream = new Stream.Readable({
        //     objectMode: true,
        //     read (size: number) {
        //         // todo
        //     }
        // })
        return new DynamodbReadStream<Entity>(this, { limit: 500 })
        // this._streamAll(stream, { limit: 500 }).then(() => {
        //     console.log('stream complete.')
        // }).catch((error: any) => {
        //     console.log('error streaming dynamodb data', error)
        // })
        // return stream
    }

    // async _streamAll (stream: Stream.Readable, options: ScanOptions) {
    //     let items = await this.scan(options)
    //     while (items.length > 0) {
    //         items.forEach((item: any) => stream.push(item))
    //         if (items.LastEvaluatedKey) {
    //             items = await this.scan(options)
    //         } else {
    //             break
    //         }
    //     }
    //     stream.push(null)
    // }
}
