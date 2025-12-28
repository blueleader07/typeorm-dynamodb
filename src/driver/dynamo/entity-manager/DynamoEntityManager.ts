/**
 * Entity manager supposed to work with any entity, automatically find its repository and call its methods,
 * whatever entity type are you passing.
 *
 * This implementation is used for DynamoDB driver which has some specifics in its EntityManager.
 */
import { EntityManager } from 'typeorm/entity-manager/EntityManager'
import { EntityTarget } from 'typeorm/common/EntityTarget'
import { ObjectId } from 'typeorm/driver/mongodb/typings'
import { ObjectLiteral } from 'typeorm/common/ObjectLiteral'
import { FindOptionsUtils } from 'typeorm/find-options/FindOptionsUtils'
import { FindOneOptions } from 'typeorm/find-options/FindOneOptions'
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity'
import { DeleteResult } from 'typeorm/query-builder/result/DeleteResult'
import { TypeORMError } from 'typeorm/error/TypeORMError'
import { DynamoQueryRunner } from '../DynamoQueryRunner'
import { DynamoDriver } from '../DynamoDriver'
import { UpdateExpressionOptions } from '../models/UpdateExpressionOptions'
import { paramHelper } from '../helpers/param-helper'
import {
    indexedColumns,
    populateGeneratedColumns
} from '../helpers/DynamoGlobalSecondaryIndexHelper'
import { FindOptions } from '../models/FindOptions'
import { FindOptionsWhere } from 'typeorm/find-options/FindOptionsWhere'
import { ScanOptions } from '../models/ScanOptions'
import { dynamoBatchHelper } from '../helpers/DynamoBatchHelper'
import { BatchWriteItem } from '../models/BatchWriteItem'
import { DataSource } from 'typeorm/data-source'
import { mixin, isEmpty } from '../helpers/DynamoObjectHelper'
import { getDocumentClient } from '../DynamoClient'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import { PagingAndSortingRepository } from '../repository/PagingAndSortingRepository'

/**
 * Function type that extracts key fields from an entity for DynamoDB operations.
 * Takes an entity object and returns an object containing only the key fields.
 */
export type KeyMapper = (entity: ObjectLiteral) => ObjectLiteral

// todo: we should look at the @PrimaryKey on the entity
const DEFAULT_KEY_MAPPER = (item: any) => {
    return {
        id: item.id
    }
}

const unmarshallAll = (items?: any[]) => {
    return (items || []).map(item => unmarshall(item))
}

export class DynamoEntityManager extends EntityManager {
    get dynamodbQueryRunner (): DynamoQueryRunner {
        return (this.connection.driver as unknown as DynamoDriver)
            .queryRunner as DynamoQueryRunner
    }

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor (connection: DataSource) {
        super(connection)
    }

    getRepository<Entity extends ObjectLiteral> (target: EntityTarget<Entity>): PagingAndSortingRepository<Entity> {
        return new PagingAndSortingRepository(target, this, this.queryRunner)
    }

    // -------------------------------------------------------------------------
    // Overridden Methods
    // -------------------------------------------------------------------------

    createDefaultKeyMapper<Entity> (target: EntityTarget<Entity>) {
        const metadata = this.connection.getMetadata(target)

        return (entity: ObjectLiteral) => {
            const keys: any = {}
            for (let i = 0; i < metadata.primaryColumns.length; i++) {
                const primaryColumn = metadata.primaryColumns[i]
                const propertyName = primaryColumn.propertyName
                keys[propertyName] = entity[propertyName]
            }
            return keys
        }
    }

    async update<Entity> (
        entityClassOrName: EntityTarget<Entity>,
        options: UpdateExpressionOptions
    ) {
        const metadata = this.connection.getMetadata(entityClassOrName)
        const changedValues = mixin(options.setValues || {}, options.where)
        indexedColumns(metadata, changedValues, true)
        mixin(options.setValues, changedValues)
        if (options.setValues && options.setValues.id !== undefined) {
            delete options.setValues.id
        }
        const params = paramHelper.update(metadata.tablePath, options)

        // Use the query runner's updateOne method to support transactions
        return this.dynamodbQueryRunner.updateOne(params)
    }

    /**
     * Finds entities that match given find options or conditions.
     */
    async find<Entity> (
        entityClassOrName: EntityTarget<Entity>,
        options?: FindOptions | any
    ): Promise<Entity[]> {
        options = options || {}
        const dbClient = getDocumentClient()
        const metadata = this.connection.getMetadata(entityClassOrName)
        const params = paramHelper.find(
            metadata.tablePath,
            options,
            metadata.indices
        )
        const results = isEmpty(options.where)
            ? await dbClient.scan(params)
            : await dbClient.query(params)
        const items: any = unmarshallAll(results.Items)
        items.lastEvaluatedKey = results.LastEvaluatedKey
        return items
    }

    /**
     * Finds entities that match given find options or conditions.
     */
    async findAll<Entity> (
        entityClassOrName: EntityTarget<Entity>,
        options?: FindOptions
    ): Promise<Entity[]> {
        options = options || {}
        delete options.limit
        const dbClient = getDocumentClient()
        const metadata = this.connection.getMetadata(entityClassOrName)
        const params = paramHelper.find(
            metadata.tablePath,
            options,
            metadata.indices
        )
        let items: any[] = []
        let results = isEmpty(options.where)
            ? await dbClient.scan(params)
            : await dbClient.query(params)
        items = items.concat(unmarshallAll(results.Items))
        while (results.LastEvaluatedKey) {
            params.ExclusiveStartKey = results.LastEvaluatedKey
            results = isEmpty(options.where)
                ? await dbClient.scan(params)
                : await dbClient.query(params)
            items = items.concat(unmarshallAll(results.Items || []))
        }
        return items
    }

    async scan<Entity> (
        entityClassOrName: EntityTarget<Entity>,
        options?: ScanOptions
    ) {
        options = options || {}
        const dbClient = getDocumentClient()
        const metadata = this.connection.getMetadata(entityClassOrName)
        const params: any = {
            TableName: metadata.tablePath
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
        const results: any = await dbClient.scan(params)
        const items: any = unmarshallAll(results.Items)
        items.LastEvaluatedKey = results.LastEvaluatedKey
        return items
    }

    /**
     * Finds first entity that matches given conditions and/or find options.
     */
    async findOne<Entity> (
        entityClass: EntityTarget<Entity>,
        options: FindOneOptions<Entity> | string
    ): Promise<Entity | null> {
        const dbClient = getDocumentClient()
        const metadata = this.connection.getMetadata(entityClass)
        const id = typeof options === 'string' ? options : undefined
        const findOneOptionsOrConditions = options as any
        let findOptions
        if (FindOptionsUtils.isFindOneOptions(findOneOptionsOrConditions)) {
            findOptions = new FindOptions()
            findOptions.where = findOneOptionsOrConditions.where
            findOptions.limit = 1
        } else {
            findOptions = new FindOptions()
            findOptions.where = { id }
            findOptions.limit = 1
        }
        const params = paramHelper.find(
            metadata.tablePath,
            findOptions,
            metadata.indices
        )
        const results = await dbClient.query(params)
        const items: any = unmarshallAll(results.Items)
        return items.length > 0 ? items[0] : null
    }

    /**
     * Finds first entity that matches given conditions and/or find options.
     */
    async findOneBy<Entity> (
        entityClass: EntityTarget<Entity>,
        options: FindOptionsWhere<Entity>
    ): Promise<Entity | null> {
        const dbClient = getDocumentClient()
        const metadata = this.connection.getMetadata(entityClass)
        const findOptions = new FindOptions()
        findOptions.where = options
        findOptions.limit = 1
        const params = paramHelper.find(
            metadata.tablePath,
            findOptions,
            metadata.indices
        )
        const results = await dbClient.query(params)
        const items: any = unmarshallAll(results.Items)
        return items.length > 0 ? items[0] : null
    }

    /**
     * Put a given entity into the database.
     * Unlike save method executes a primitive operation without cascades, relations and other operations included.
     * Executes fast and efficient INSERT query.
     * Does not check if entity exist in the database, so query will fail if duplicate entity is being inserted.
     * You can execute bulk inserts using this method.
     */
    async put<Entity> (
        target: EntityTarget<Entity>,
        entity: ObjectLiteral | ObjectLiteral[]
    ): Promise<any | any[]> {
        if (Array.isArray(entity)) {
            return this.putMany(target, entity)
        } else {
            return this.putOne(target, entity)
        }
    }

    async delete<Entity> (
        targetOrEntity: EntityTarget<Entity>,
        criteria:
            | string
            | string[]
            | number
            | number[]
            | Date
            | Date[]
            | ObjectId
            | ObjectId[]
            | any
    ): Promise<DeleteResult> {
        if (Array.isArray(criteria)) {
            await this.deleteMany(targetOrEntity, criteria)
        } else {
            await this.deleteOne(targetOrEntity, criteria)
        }
        return {
            raw: {}
        }
    }

    /**
     * Deletes all rows from the table, or rows matching the given options.
     * Alias for deleteAllBy with empty options when no options provided.
     * 
     * @param target - The entity class or table name
     * @param options - Optional FindOptions to filter which rows to delete (if omitted, deletes ALL rows)
     * @param keyMapper - Optional function to extract keys from items (defaults to using primary key columns)
     * @returns Promise<DeleteResult> with the count of deleted rows
     */
    override async deleteAll<Entity extends ObjectLiteral> (
        target: EntityTarget<Entity>,
        options?: FindOptions,
        keyMapper?: KeyMapper
    ): Promise<DeleteResult> {
        return this.deleteAllBy(target, options || {}, keyMapper)
    }

    /**
     * DynamoDB-specific method to delete all rows matching the given options.
     * Returns a DeleteResult with the count of deleted rows.
     */
    async deleteAllBy<Entity> (
        target: EntityTarget<Entity>,
        options: FindOptions,
        keyMapper?: KeyMapper
    ): Promise<DeleteResult> {
        options.limit = options.limit || 500
        const deletedCount = await this.deleteQueryBatch(target, options, keyMapper)
        return {
            raw: [],
            affected: deletedCount
        } as DeleteResult
    }

    async deleteQueryBatch<Entity> (
        target: EntityTarget<Entity>,
        options: FindOptions,
        keyMapper?: KeyMapper
    ): Promise<number> {
        const items: any[] = await this.find(target, options)
        if (items.length > 0) {
            const metadata = this.connection.getMetadata(target)
            keyMapper = keyMapper || DEFAULT_KEY_MAPPER
            const keys: any[] = items.map(keyMapper)
            await this.deleteMany(metadata.tablePath, keys)
            const nextCount = await this.deleteQueryBatch(target, options, keyMapper)
            return items.length + nextCount
        }
        return 0
    }

    /**
     * Delete multiple documents on DynamoDB.
     */
    deleteMany<Entity> (
        entityClassOrName: EntityTarget<Entity>,
        keys: QueryDeepPartialEntity<Entity>[]
    ): Promise<void> {
        const metadata = this.connection.getMetadata(entityClassOrName)
        return this.dynamodbQueryRunner.deleteMany(metadata.tablePath, keys)
    }

    /**
     * Delete a document on DynamoDB.
     */
    deleteOne<Entity> (
        entityClassOrName: EntityTarget<Entity>,
        key: ObjectLiteral
    ): Promise<void> {
        const metadata = this.connection.getMetadata(entityClassOrName)
        return this.dynamodbQueryRunner.deleteOne(metadata.tablePath, key)
    }

    /**
     * Put an array of documents into DynamoDB.
     */
    putMany<Entity> (
        entityClassOrName: EntityTarget<Entity>,
        docs: ObjectLiteral[]
    ): Promise<void> {
        const metadata = this.connection.getMetadata(entityClassOrName)
        docs.forEach((doc: ObjectLiteral) => {
            indexedColumns(metadata, doc)
        })
        return this.dynamodbQueryRunner.putMany(metadata.tablePath, docs)
    }

    /**
     * Put a single document into DynamoDB.
     */
    putOne<Entity> (
        entityClassOrName: EntityTarget<Entity>,
        doc: ObjectLiteral
    ): Promise<ObjectLiteral> {
        const metadata = this.connection.getMetadata(entityClassOrName)
        indexedColumns(metadata, doc)
        populateGeneratedColumns(metadata, doc)
        return this.dynamodbQueryRunner.putOne(metadata.tablePath, doc)
    }

    /**
     * Read from DynamoDB in batches.
     */
    async batchRead<Entity> (
        entityClassOrName: EntityTarget<Entity>,
        keys: ObjectLiteral[]
    ) {
        const dbClient = getDocumentClient()
        const metadata = this.connection.getMetadata(entityClassOrName)
        const batches = dynamoBatchHelper.batch(keys, 100)
        let items: any[] = []
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i]
            const requestItems: any = {}
            requestItems[metadata.tablePath] = {
                Keys: batch
            }
            const response = await dbClient
                .batchGet({
                    RequestItems: requestItems
                })
            if (response.Responses !== undefined) {
                items = items.concat(response.Responses[metadata.tablePath])
            }
        }
        return items
    }

    /**
     * Put an array of documents into DynamoDB in batches.
     */
    // TODO: ... how do we update the indexColumn values here ... ?
    async batchWrite<Entity> (
        entityClassOrName: EntityTarget<Entity>,
        writes: BatchWriteItem[]
    ) {
        const dbClient = getDocumentClient()
        const metadata = this.connection.getMetadata(entityClassOrName)
        const batches = dynamoBatchHelper.batch(writes, 25)
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i]
            const requestItems: any = {}
            requestItems[metadata.tablePath] = batch.map((write: any) => {
                const request: any = {}
                request[write.type] = {
                    Item: write.item
                }
                return request
            })
            await dbClient
                .batchWrite({
                    RequestItems: requestItems
                })
        }
    }

    /**
     * Execute a statement on DynamoDB.
     */
    async executeStatement (
        statement: string,
        params?: any[],
        nextToken?: string
    ) {
        const dbClient = getDocumentClient()
        return dbClient.executeStatement({
            Statement: statement,
            Parameters: params,
            NextToken: nextToken
        })
    }
}
