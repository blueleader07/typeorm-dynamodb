import { FindOptions } from '../models/FindOptions'
import { ScanOptions } from '../models/ScanOptions'
import { BatchWriteItem } from '../models/BatchWriteItem'
import { ObjectId } from 'typeorm/driver/mongodb/typings'
import { ObjectLiteral } from 'typeorm/common/ObjectLiteral'
import { SelectQueryBuilder } from 'typeorm/query-builder/SelectQueryBuilder'
import { DeepPartial } from 'typeorm/common/DeepPartial'
import { FindOneOptions } from 'typeorm/find-options/FindOneOptions'
import { Repository } from 'typeorm/repository/Repository'
import { DynamoReadStream } from '../DynamoReadStream'
import { DynamoEntityManager } from '../entity-manager/DynamoEntityManager'
import { DynamoQueryRunner } from '../DynamoQueryRunner'
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity'
import { AddOptions } from '../models/AddOptions'
import { DeleteResult } from 'typeorm/query-builder/result/DeleteResult'
import { UpdateResult } from 'typeorm/query-builder/result/UpdateResult'
import { UpdateExpressionOptions } from '../models/UpdateExpressionOptions'
import { FindOptionsWhere } from 'typeorm/find-options/FindOptionsWhere'
import { SaveOptions } from 'typeorm/repository/SaveOptions'

export class DynamoRepository<
    Entity extends ObjectLiteral,
> extends Repository<Entity> {
    /**
     * Entity Manager used by this repository.
     */
    readonly manager: DynamoEntityManager

    /**
     * Entity metadata of the entity current repository manages.
     */
    get metadata () {
        return this.manager.connection.getMetadata(this.target)
    }

    /**
     * Query runner provider used for this repository.
     */
    readonly queryRunner?: DynamoQueryRunner

    /**
     * Creates a new query builder that can be used to build a sql query.
     */
    createQueryBuilder (
        alias?: string,
        queryRunner?: DynamoQueryRunner
    ): SelectQueryBuilder<Entity> {
        return this.manager.createQueryBuilder<Entity>(
            this.metadata.target as any,
            alias || this.metadata.targetName,
            queryRunner || this.queryRunner
        )
    }

    async get (key: any) {
        return this.findOne(key)
    }

    async find (options: FindOptions | any): Promise<Entity[]> {
        return this.manager.find(this.metadata.tableName, options)
    }

    async findAll (options: FindOptions): Promise<Entity[]> {
        return this.manager.findAll(this.metadata.tableName, options)
    }

    /**
     * Finds first entity by a given find options.
     * If entity was not found in the database - returns null.
     */
    async findOne (options: FindOneOptions<Entity>): Promise<Entity | null> {
        return this.manager.findOne(this.metadata.target, options)
    }

    /**
     * Finds first entity by a given find options.
     * If entity was not found in the database - returns null.
     */
    async findOneBy (where: FindOptionsWhere<Entity>): Promise<Entity | null> {
        return this.manager.findOneBy(this.metadata.target, where)
    }

    add (options: AddOptions) {
        return this.manager.update(this.metadata.target as any, {
            addValues: options.values,
            where: options.where
        })
    }

    scan (options: ScanOptions) {
        return this.manager.scan(this.metadata.tableName, options)
    }

    /**
     * Saves one or many given entities.
     */
    async save<T extends DeepPartial<Entity>> (
        entityOrEntities: T | T[],
        options?: SaveOptions
    ): Promise<T | T[]> {
        await this.manager.put(
            this.metadata.target as any,
            entityOrEntities as any
        )
        return entityOrEntities
    }

    put (content: DeepPartial<Entity> | DeepPartial<Entity>[]) {
        if (Array.isArray(content)) {
            return this.putMany(content)
        }
        return this.manager.put(this.metadata.tableName, content)
    }

    putMany (content: DeepPartial<Entity>[]) {
        return this.manager.putMany(this.metadata.tableName, content)
    }

    putOne (content: DeepPartial<Entity | Entity[]>) {
        return this.manager.putOne(this.metadata.tableName, content)
    }

    delete (
        criteria:
            | string
            | string[]
            | number
            | number[]
            | Date
            | Date[]
            | ObjectId
            | ObjectId[]
            | FindOptionsWhere<Entity>
    ): Promise<DeleteResult> {
        return this.manager.delete(this.metadata.tableName, criteria)
    }

    deleteOne (key: QueryDeepPartialEntity<Entity>) {
        return this.manager.deleteOne(this.metadata.tableName, key)
    }

    deleteMany (keys: QueryDeepPartialEntity<Entity>[]) {
        return this.manager.deleteMany(this.metadata.tableName, keys)
    }

    async deleteAll (keyMapper?: any) {
        return this.manager.deleteAll(this.metadata.tableName, keyMapper)
    }

    deleteAllBy (options: FindOptions, keyMapper?: any) {
        return this.manager.deleteAllBy(
            this.metadata.tableName,
            options,
            keyMapper
        )
    }

    async deleteQueryBatch (options: FindOptions, keyMapper?: any) {
        return this.manager.deleteQueryBatch(
            this.metadata.tableName,
            options,
            keyMapper
        )
    }

    batchRead (keys: any[]) {
        return this.manager.batchRead(this.metadata.tableName, keys)
    }

    batchWrite (writes: BatchWriteItem[]) {
        return this.manager.batchWrite(this.metadata.tableName, writes)
    }

    /**
     * @deprecated use put(...) or updateExpression(...) for dynamodb.
     */
    update (
        criteria:
            | string
            | string[]
            | number
            | number[]
            | Date
            | Date[]
            | ObjectId
            | ObjectId[]
            | FindOptionsWhere<Entity>,
        partialEntity: QueryDeepPartialEntity<Entity>
    ): Promise<UpdateResult> {
        throw new Error('use repository.updateExpression(...) for dynamodb.')
    }

    updateExpression (
        options: UpdateExpressionOptions
    ): Promise<UpdateResult> {
        return this.manager.update(this.metadata.target as any, options)
    }

    async streamAll () {
        return new DynamoReadStream<Entity>(this, { limit: 500 })
    }
}
