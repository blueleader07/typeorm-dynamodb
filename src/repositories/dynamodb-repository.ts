import { FindOptions } from '../models/find-options'
import { paramHelper } from '../helpers/param-helper'
import AWS from 'aws-sdk'
import { batchHelper } from '../helpers/batch-helper'
import { ScanOptions } from '../models/scan-options'
import { BatchWriteItem } from '../models/batch-write-item'
import {
    DeepPartial,
    EntityMetadata, FindConditions, FindOneOptions,
    ObjectID,
    ObjectLiteral, Repository,
    SelectQueryBuilder
} from 'typeorm'
import { DynamodbReadStream } from '../streams/dynamodb-read-stream'
import { DynamoDbEntityManager } from '../entity-manager/dynamodb-entity-manager'
import { DynamodbQueryRunner } from '../driver/dynamodb-query-runner'
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity'

// todo: we should look at the @PrimaryKey on the entity
const DEFAULT_KEY_MAPPER = (item: any) => {
    return {
        id: item.id
    }
}

export class DynamodbRepository<Entity extends ObjectLiteral> extends Repository<Entity> {
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
        return this.findOne(key)
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

    async put (content: DeepPartial<Entity> | DeepPartial<Entity>[]) {
        if (Array.isArray(content)) {
            return this.putMany(content)
        }
        return this.manager.put(this.metadata.tableName, content)
    }

    async putMany (content: DeepPartial<Entity>[]) {
        return this.manager.putMany(this.metadata.tableName, content)
    }

    async putOne (content: DeepPartial<Entity | Entity[]>) {
        return this.manager.putOne(this.metadata.tableName, content)
    }

    async deleteOne (key: QueryDeepPartialEntity<Entity>) {
        return this.manager.deleteOne(this.metadata.tableName, key)
    }

    async deleteMany (keys: QueryDeepPartialEntity<Entity>[]) {
        return this.manager.deleteMany(this.metadata.tableName, keys)
    }

    async deleteAll (keyMapper?: any) {
        const items = await this.scan({ limit: 500 })
        if (items.length > 0) {
            const itemIds = items.map(keyMapper || DEFAULT_KEY_MAPPER)
            await this.deleteMany(itemIds)
            await this.deleteAll(keyMapper)
        }
    }

    async deleteAllBy (options: FindOptions, keyMapper?: any) {
        options.limit = options.limit || 500
        await this.deleteQueryBatch(options, keyMapper)
    }

    async deleteQueryBatch (options: FindOptions, keyMapper?: any) {
        const items: any[] = await this.find(options)
        if (items.length > 0) {
            keyMapper = keyMapper || DEFAULT_KEY_MAPPER
            const keys: any[] = items.map(keyMapper)
            await this.manager.deleteMany(this.metadata.tableName, keys)
            await this.deleteQueryBatch(options, keyMapper)
        }
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
