/**
 * Entity manager supposed to work with any entity, automatically find its repository and call its methods,
 * whatever entity type are you passing.
 *
 * This implementation is used for MongoDB driver which has some specifics in its EntityManager.
 */
import {
    Connection,
    DeepPartial,
    DeleteResult,
    EntityManager,
    EntityMetadata,
    EntityTarget,
    FindConditions,
    FindManyOptions,
    FindOneOptions,
    FindOptionsUtils,
    InsertResult,
    ObjectID,
    ObjectLiteral,
    UpdateResult
} from 'typeorm'
import { DynamodbQueryRunner } from '../driver/dynamodb-query-runner'
import { DynamodbDriver } from '../driver/dynamodb-driver'
import { PlatformTools } from 'typeorm/platform/PlatformTools'
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity'
import AWS from 'aws-sdk'
import { paramHelper } from '../helpers/param-helper'
import { FindOptions } from '../models/find-options'

export class DynamoDbEntityManager extends EntityManager {
    get dynamodbQueryRunner (): DynamodbQueryRunner {
        return (this.connection.driver as DynamodbDriver).queryRunner as DynamodbQueryRunner
    }

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor (connection: Connection) {
        super(connection)
    }

    // -------------------------------------------------------------------------
    // Overridden Methods
    // -------------------------------------------------------------------------

    // /**
    //  * Finds entities that match given find options or conditions.
    //  */
    // async find<Entity> (entityClassOrName: EntityTarget<Entity>, optionsOrConditions?: FindManyOptions<Entity> | Partial<Entity>): Promise<Entity[]> {
    //     const query = this.convertFindManyOptionsOrConditionsToDynamodbQuery(optionsOrConditions)
    //     const cursor = await this.createEntityCursor(entityClassOrName, query)
    //     if (FindOptionsUtils.isFindManyOptions(optionsOrConditions)) {
    //         if (optionsOrConditions.select) { cursor.project(this.convertFindOptionsSelectToProjectCriteria(optionsOrConditions.select)) }
    //         if (optionsOrConditions.skip) { cursor.skip(optionsOrConditions.skip) }
    //         if (optionsOrConditions.take) { cursor.limit(optionsOrConditions.take) }
    //         if (optionsOrConditions.order) { cursor.sort(this.convertFindOptionsOrderToOrderCriteria(optionsOrConditions.order)) }
    //     }
    //     return cursor.toArray()
    // }

    // /**
    //  * Finds entities that match given find options or conditions.
    //  * Also counts all entities that match given conditions,
    //  * but ignores pagination settings (from and take options).
    //  */
    // async findAndCount<Entity> (entityClassOrName: EntityTarget<Entity>, optionsOrConditions?: FindManyOptions<Entity> | Partial<Entity>): Promise<[Entity[], number]> {
    //     const query = this.convertFindManyOptionsOrConditionsToDynamodbQuery(optionsOrConditions)
    //     const cursor = await this.createEntityCursor(entityClassOrName, query)
    //     if (FindOptionsUtils.isFindManyOptions(optionsOrConditions)) {
    //         if (optionsOrConditions.select) { cursor.project(this.convertFindOptionsSelectToProjectCriteria(optionsOrConditions.select)) }
    //         if (optionsOrConditions.skip) { cursor.skip(optionsOrConditions.skip) }
    //         if (optionsOrConditions.take) { cursor.limit(optionsOrConditions.take) }
    //         if (optionsOrConditions.order) { cursor.sort(this.convertFindOptionsOrderToOrderCriteria(optionsOrConditions.order)) }
    //     }
    //     const [results, count] = await Promise.all<any>([
    //         cursor.toArray(),
    //         this.count(entityClassOrName, query)
    //     ])
    //     return [results, parseInt(count)]
    // }

    // /**
    //  * Finds entities by ids.
    //  * Optionally find options can be applied.
    //  */
    // async findByIds<Entity> (entityClassOrName: EntityTarget<Entity>, ids: any[], optionsOrConditions?: FindManyOptions<Entity> | Partial<Entity>): Promise<Entity[]> {
    //     const metadata = this.connection.getMetadata(entityClassOrName)
    //     const query = this.convertFindManyOptionsOrConditionsToMongodbQuery(optionsOrConditions) || {}
    //     const objectIdInstance = PlatformTools.load('mongodb').ObjectID
    //     query._id = {
    //         $in: ids.map(id => {
    //             if (typeof id === 'string') {
    //                 return new objectIdInstance(id)
    //             }
    //
    //             if (typeof id === 'object') {
    //                 if (id instanceof objectIdInstance) {
    //                     return id
    //                 }
    //
    //                 const propertyName = metadata.objectIdColumn!.propertyName
    //
    //                 if (id[propertyName] instanceof objectIdInstance) {
    //                     return id[propertyName]
    //                 }
    //             }
    //         })
    //     }
    //
    //     const cursor = await this.createEntityCursor(entityClassOrName, query)
    //     if (FindOptionsUtils.isFindManyOptions(optionsOrConditions)) {
    //         if (optionsOrConditions.select) { cursor.project(this.convertFindOptionsSelectToProjectCriteria(optionsOrConditions.select)) }
    //         if (optionsOrConditions.skip) { cursor.skip(optionsOrConditions.skip) }
    //         if (optionsOrConditions.take) { cursor.limit(optionsOrConditions.take) }
    //         if (optionsOrConditions.order) { cursor.sort(this.convertFindOptionsOrderToOrderCriteria(optionsOrConditions.order)) }
    //     }
    //     return await cursor.toArray()
    // }

    /**
     * Finds first entity that matches given conditions and/or find options.
     */
    async findOne<Entity> (entityClassOrName: EntityTarget<Entity>,
        optionsOrConditions?: string | string[] | number | number[] | Date | Date[] | ObjectID | ObjectID[] | FindOneOptions<Entity> | DeepPartial<Entity>,
        maybeOptions?: FindOneOptions<Entity>): Promise<Entity | undefined> {
        const dbClient = new AWS.DynamoDB.DocumentClient()
        const metadata = this.connection.getMetadata(entityClassOrName)
        const id = typeof optionsOrConditions === 'string' ? optionsOrConditions : undefined
        const findOneOptionsOrConditions = (id ? maybeOptions : optionsOrConditions) as any
        let options
        if (FindOptionsUtils.isFindOneOptions(findOneOptionsOrConditions)) {
            options = new FindOptions()
            options.where = findOneOptionsOrConditions.where
            options.limit = 1
        } else {
            options = new FindOptions()
            options.where = { id }
            options.limit = 1
        }
        const params = paramHelper.find(metadata.tableName, options)
        const results = await dbClient.query(params).promise()
        const items: any = results.Items || []
        return items.length > 0 ? items[0] : null
    }

    /**
     * Inserts a given entity into the database.
     * Unlike save method executes a primitive operation without cascades, relations and other operations included.
     * Executes fast and efficient INSERT query.
     * Does not check if entity exist in the database, so query will fail if duplicate entity is being inserted.
     * You can execute bulk inserts using this method.
     */
    async insert<Entity> (target: EntityTarget<Entity>, entity: QueryDeepPartialEntity<Entity> | QueryDeepPartialEntity<Entity>[]): Promise<InsertResult> {
        // todo: convert entity to its database name
        const result = new InsertResult()
        if (Array.isArray(entity)) {
            // result.raw = await this.insertMany(target, entity)
            // Object.keys(result.raw.insertedIds).forEach((key: any) => {
            //     const insertedId = result.raw.insertedIds[key]
            //     result.generatedMaps.push(this.connection.driver.createGeneratedMap(this.connection.getMetadata(target), insertedId)!)
            //     result.identifiers.push(this.connection.driver.createGeneratedMap(this.connection.getMetadata(target), insertedId)!)
            // })
        } else {
            result.raw = await this.insertOne(target, entity)
            result.generatedMaps.push(this.connection.driver.createGeneratedMap(this.connection.getMetadata(target), result.raw.insertedId)!)
            result.identifiers.push(this.connection.driver.createGeneratedMap(this.connection.getMetadata(target), result.raw.insertedId)!)
        }

        return result
    }

    /**
     * Updates entity partially. Entity can be found by a given conditions.
     * Unlike save method executes a primitive operation without cascades, relations and other operations included.
     * Executes fast and efficient UPDATE query.
     * Does not check if entity exist in the database.
     */
    async update<Entity> (target: EntityTarget<Entity>, criteria: string | string[] | number | number[] | Date | Date[] | ObjectID | ObjectID[] | FindConditions<Entity>, partialEntity: QueryDeepPartialEntity<Entity>): Promise<UpdateResult> {
        const result = new UpdateResult()

        if (Array.isArray(criteria)) {
            const updateResults = await Promise.all((criteria as any[]).map(criteriaItem => {
                return this.update(target, criteriaItem, partialEntity)
            }))

            result.raw = updateResults.map(r => r.raw)
            result.affected = updateResults.map(r => (r.affected || 0)).reduce((c, r) => c + r, 0)
            result.generatedMaps = updateResults.reduce((c, r) => c.concat(r.generatedMaps), [] as ObjectLiteral[])
        } else {
            // const metadata = this.connection.getMetadata(target)
            // const mongoResult = await this.updateMany(target, this.convertMixedCriteria(metadata, criteria), { $set: partialEntity })
            //
            // result.raw = mongoResult
            // result.affected = mongoResult.modifiedCount
        }

        return result
    }

    /**
     * Deletes entities by a given conditions.
     * Unlike save method executes a primitive operation without cascades, relations and other operations included.
     * Executes fast and efficient DELETE query.
     * Does not check if entity exist in the database.
     */
    async delete<Entity> (target: EntityTarget<Entity>, criteria: string | string[] | number | number[] | Date | Date[] | ObjectID | ObjectID[] | FindConditions<Entity>): Promise<DeleteResult> {
        const result = new DeleteResult()

        if (Array.isArray(criteria)) {
            const deleteResults = await Promise.all((criteria as any[]).map(criteriaItem => {
                return this.delete(target, criteriaItem)
            }))

            result.raw = deleteResults.map(r => r.raw)
            result.affected = deleteResults.map(r => (r.affected || 0)).reduce((c, r) => c + r, 0)
        } else {
            // const mongoResult = await this.deleteMany(target, this.convertMixedCriteria(this.connection.getMetadata(target), criteria))
            //
            // result.raw = mongoResult
            // result.affected = mongoResult.deletedCount
        }

        return result
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    // /**
    //  * Perform a bulkWrite operation without a fluent API.
    //  */
    // bulkWrite<Entity> (entityClassOrName: EntityTarget<Entity>, operations: ObjectLiteral[], options?: CollectionBulkWriteOptions): Promise<BulkWriteOpResultObject> {
    //     const metadata = this.connection.getMetadata(entityClassOrName)
    //     return this.dynamodbQueryRunner.bulkWrite(metadata.tableName, operations, options)
    // }

    // /**
    //  * Count number of matching documents in the db to a query.
    //  */
    // count<Entity> (entityClassOrName: EntityTarget<Entity>, query?: ObjectLiteral, options?: MongoCountPreferences): Promise<number> {
    //     const metadata = this.connection.getMetadata(entityClassOrName)
    //     return this.dynamodbQueryRunner.count(metadata.tableName, query, options)
    // }

    // /**
    //  * Delete multiple documents on MongoDB.
    //  */
    // deleteMany<Entity> (entityClassOrName: EntityTarget<Entity>, query: ObjectLiteral, options?: CollectionOptions): Promise<DeleteWriteOpResultObject> {
    //     const metadata = this.connection.getMetadata(entityClassOrName)
    //     return this.dynamodbQueryRunner.deleteMany(metadata.tableName, query, options)
    // }

    // /**
    //  * Delete a document on MongoDB.
    //  */
    // deleteOne<Entity> (entityClassOrName: EntityTarget<Entity>, query: ObjectLiteral, options?: CollectionOptions): Promise<DeleteWriteOpResultObject> {
    //     const metadata = this.connection.getMetadata(entityClassOrName)
    //     return this.dynamodbQueryRunner.deleteOne(metadata.tableName, query, options)
    // }

    // /**
    //  * Inserts an array of documents into MongoDB.
    //  */
    // insertMany<Entity> (entityClassOrName: EntityTarget<Entity>, docs: ObjectLiteral[], options?: CollectionInsertManyOptions): Promise<InsertWriteOpResult> {
    //     const metadata = this.connection.getMetadata(entityClassOrName)
    //     return this.dynamodbQueryRunner.insertMany(metadata.tableName, docs, options)
    // }

    /**
     * Inserts a single document into MongoDB.
     */
    insertOne<Entity> (entityClassOrName: EntityTarget<Entity>, doc: ObjectLiteral): Promise<ObjectLiteral> {
        const metadata = this.connection.getMetadata(entityClassOrName)
        return this.dynamodbQueryRunner.insertOne(metadata.tableName, doc)
    }

    // /**
    //  * Update multiple documents on MongoDB.
    //  */
    // updateMany<Entity> (entityClassOrName: EntityTarget<Entity>, query: ObjectLiteral, update: ObjectLiteral, options?: { upsert?: boolean, w?: any, wtimeout?: number, j?: boolean }): Promise<UpdateWriteOpResult> {
    //     const metadata = this.connection.getMetadata(entityClassOrName)
    //     return this.dynamodbQueryRunner.updateMany(metadata.tableName, query, update, options)
    // }

    // /**
    //  * Update a single document on MongoDB.
    //  */
    // updateOne<Entity> (entityClassOrName: EntityTarget<Entity>, query: ObjectLiteral, update: ObjectLiteral, options?: ReplaceOneOptions): Promise<UpdateWriteOpResult> {
    //     const metadata = this.connection.getMetadata(entityClassOrName)
    //     return this.dynamodbQueryRunner.updateOne(metadata.tableName, query, update, options)
    // }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Converts FindManyOptions to mongodb query.
     */
    protected convertFindManyOptionsOrConditionsToDynamodbQuery<Entity> (optionsOrConditions: FindManyOptions<Entity> | Partial<Entity> | undefined): ObjectLiteral | undefined {
        if (!optionsOrConditions) {
            return undefined
        }

        // If where condition is passed as a string which contains sql we have to ignore
        // as mongo is not a sql database
        if (FindOptionsUtils.isFindManyOptions<Entity>(optionsOrConditions)) {
            return typeof optionsOrConditions.where === 'string'
                ? {}
                : optionsOrConditions.where
        }

        return optionsOrConditions
    }

    /**
     * Converts FindOneOptions to mongodb query.
     */
    protected convertFindOneOptionsOrConditionsToDynamoDbQuery<Entity> (optionsOrConditions: FindOneOptions<Entity> | Partial<Entity> | undefined): ObjectLiteral | undefined {
        if (!optionsOrConditions) {
            return undefined
        }

        // If where condition is passed as a string which contains sql we have to ignore
        // as mongo is not a sql database
        if (FindOptionsUtils.isFindOneOptions<Entity>(optionsOrConditions)) {
            return typeof optionsOrConditions.where === 'string'
                ? {}
                : optionsOrConditions.where
        }

        return optionsOrConditions
    }

    /**
     * Converts FindOptions into mongodb order by criteria.
     */
    protected convertFindOptionsOrderToOrderCriteria (order: ObjectLiteral) {
        return Object.keys(order).reduce((orderCriteria, key) => {
            switch (order[key]) {
            case 'DESC':
                orderCriteria[key] = -1
                break
            case 'ASC':
                orderCriteria[key] = 1
                break
            default:
                orderCriteria[key] = order[key]
            }
            return orderCriteria
        }, {} as ObjectLiteral)
    }

    /**
     * Converts FindOptions into mongodb select by criteria.
     */
    protected convertFindOptionsSelectToProjectCriteria (selects: (keyof any)[]) {
        return selects.reduce((projectCriteria, key) => {
            projectCriteria[key] = 1
            return projectCriteria
        }, {} as any)
    }

    /**
     * Ensures given id is an id for query.
     */
    protected convertMixedCriteria (metadata: EntityMetadata, idMap: any): ObjectLiteral {
        const objectIdInstance = PlatformTools.load('mongodb').ObjectID

        // check first if it's ObjectId compatible:
        // string, number, Buffer, ObjectId or ObjectId-like
        if (objectIdInstance.isValid(idMap)) {
            return {
                _id: new objectIdInstance(idMap)
            }
        }

        // if it's some other type of object build a query from the columns
        // this check needs to be after the ObjectId check, because a valid ObjectId is also an Object instance
        if (idMap instanceof Object) {
            return metadata.columns.reduce((query, column) => {
                const columnValue = column.getEntityValue(idMap)
                if (columnValue !== undefined) {
                    query[column.databasePath] = columnValue
                }
                return query
            }, {} as any)
        }

        // last resort: try to convert it to an ObjectID anyway
        // most likely it will fail, but we want to be backwards compatible and keep the same thrown Errors.
        // it can still pass with null/undefined
        return {
            _id: new objectIdInstance(idMap)
        }
    }

    // /**
    //  * Overrides cursor's toArray and next methods to convert results to entity automatically.
    //  */
    // protected applyEntityTransformationToCursor<Entity> (metadata: EntityMetadata, cursor: Cursor<Entity> | AggregationCursor<Entity>) {
    //     const ParentCursor = PlatformTools.load('mongodb').Cursor
    //     const queryRunner = this.dynamodbQueryRunner
    //     cursor.toArray = function (callback?: MongoCallback<Entity[]>) {
    //         if (callback) {
    //             ParentCursor.prototype.toArray.call(this, (error: MongoError, results: Entity[]): void => {
    //                 if (error) {
    //                     callback(error, results)
    //                     return
    //                 }
    //
    //                 const transformer = new DocumentToEntityTransformer()
    //                 const entities = transformer.transformAll(results, metadata)
    //
    //                 // broadcast "load" events
    //                 queryRunner.broadcaster.broadcast('Load', metadata, entities)
    //                     .then(() => callback(error, entities))
    //             })
    //         } else {
    //             return ParentCursor.prototype.toArray.call(this).then((results: Entity[]) => {
    //                 const transformer = new DocumentToEntityTransformer()
    //                 const entities = transformer.transformAll(results, metadata)
    //
    //                 // broadcast "load" events
    //                 return queryRunner.broadcaster.broadcast('Load', metadata, entities)
    //                     .then(() => entities)
    //             })
    //         }
    //     }
    //     cursor.next = function (callback?: MongoCallback<CursorResult>) {
    //         if (callback) {
    //             ParentCursor.prototype.next.call(this, (error: MongoError, result: CursorResult): void => {
    //                 if (error || !result) {
    //                     callback(error, result)
    //                     return
    //                 }
    //
    //                 const transformer = new DocumentToEntityTransformer()
    //                 const entity = transformer.transform(result, metadata)
    //
    //                 // broadcast "load" events
    //
    //                 queryRunner.broadcaster.broadcast('Load', metadata, [entity])
    //                     .then(() => callback(error, entity))
    //             })
    //         } else {
    //             return ParentCursor.prototype.next.call(this).then((result: Entity) => {
    //                 if (!result) return result
    //
    //                 const transformer = new DocumentToEntityTransformer()
    //                 const entity = transformer.transform(result, metadata)
    //
    //                 // broadcast "load" events
    //                 return queryRunner.broadcaster.broadcast('Load', metadata, [entity])
    //                     .then(() => entity)
    //             })
    //         }
    //     }
    // }
}
