import { FindOptions } from '../models/find-options'
import { ScanOptions } from '../models/scan-options'
import { BatchWriteItem } from '../models/batch-write-item'
import {
    DeepPartial,
    EntityMetadata,
    FindConditions,
    FindOneOptions,
    ObjectID,
    ObjectLiteral,
    Repository,
    SelectQueryBuilder
} from 'typeorm'
import { DynamodbReadStream } from '../streams/dynamodb-read-stream'
import { DynamoDbEntityManager } from '../entity-manager/dynamodb-entity-manager'
import { DynamodbQueryRunner } from '../driver/dynamodb-query-runner'
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity'
import { AddOptions } from '../models/add-options'
import { DeleteResult } from 'typeorm/query-builder/result/DeleteResult'
import { UpdateResult } from 'typeorm/query-builder/result/UpdateResult'
import { UpdateOptions } from '../models/update-options'

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

    async find (options: FindOptions | any): Promise<Entity[]> {
        return this.manager.find(this.metadata.tableName, options)
    }

    async findAll (options?: FindOptions): Promise<Entity[]> {
        options = options || new FindOptions()
        return this.manager.findAll(this.metadata.tableName, options)
    }

    /**
     * Finds first entity that matches given conditions.
     */
    findOne (optionsOrConditions?: string|number|Date|ObjectID|FindOneOptions<Entity>|FindConditions<Entity>, maybeOptions?: FindOneOptions<Entity>) {
        return this.manager.findOne(this.metadata.target as any, optionsOrConditions as any, maybeOptions)
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

    delete (criteria: string | string[] | number | number[] | Date | Date[] | ObjectID | ObjectID[] | FindConditions<Entity>): Promise<DeleteResult> {
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
        return this.manager.deleteAllBy(this.metadata.tableName, options, keyMapper)
    }

    async deleteQueryBatch (options: FindOptions, keyMapper?: any) {
        return this.manager.deleteQueryBatch(this.metadata.tableName, options, keyMapper)
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
    update (criteria: string | string[] | number | number[] | Date | Date[] | ObjectID | ObjectID[] | FindConditions<Entity>, partialEntity: QueryDeepPartialEntity<Entity>): Promise<UpdateResult> {
        throw new Error('use repository.updateMany(...) for dynamodb.')
    }

    updateExpression (options: UpdateOptions): Promise<UpdateResult> {
        return this.manager.update(this.metadata.target as any, options)
    }

    async streamAll () {
        return new DynamodbReadStream<Entity>(this, { limit: 500 })
    }
}
