import { ObjectType } from 'typeorm/common/ObjectType'
import { EntitySchema } from 'typeorm/entity-schema/EntitySchema'
import { Connection, CustomRepositoryNotFoundError, getMetadataArgsStorage } from 'typeorm'
import {
    initializeTransactionalContext,
    patchTypeORMRepositoryWithBaseRepository
} from 'typeorm-transactional-cls-hooked'
import { DynamodbDriver } from '../drivers/dynamodb-driver'
import { connectionManager } from './connection-manager'
import { commonUtils } from '@lmig/legal-nodejs-utils'
import { DriverFactory } from 'typeorm/driver/DriverFactory'
DriverFactory.prototype.create = (connection: Connection) => {
    return new DynamodbDriver(connection)
}

initializeTransactionalContext()
patchTypeORMRepositoryWithBaseRepository()

let connection: any = null

export class DatasourceManagerOptions {
    entities?: ((Function | string | EntitySchema))[];
}

const DEFAULT_OPTIONS: DatasourceManagerOptions = {
    entities: ['**/entities/**/*.{js,ts}']
}

export const datasourceManager = {
    async open (options: DatasourceManagerOptions) {
        options = commonUtils.mixin(DEFAULT_OPTIONS, options)
        if (!connection) {
            const options2: any = {
                type: 'dynamodb',
                entities: options?.entities
            }
            connection = await connectionManager.create(options2)
        }
        return connection
    },

    async getConnection (name?: string) {
        return connectionManager.get(name)
        // return new DynamodbDriver()
        // return {
        // async synchronize () {
        //     // should create tables from entities
        //     for (let i = 0; i < entities.length; i++) {
        //         const entity = entities[i]
        //         console.log('entity loaded', entity)
        //     }
        // }
        // }
    },

    async getCustomRepository<T> (customRepository: ObjectType<T>): Promise<T> {
        const entityRepositoryMetadataArgs = getMetadataArgsStorage().entityRepositories.find(repository => {
            return repository.target === (customRepository instanceof Function ? customRepository : (customRepository as any).constructor)
        })
        if (!entityRepositoryMetadataArgs) { throw new CustomRepositoryNotFoundError(customRepository) }

        const connection = await connectionManager.get()

        const entityMetadata = entityRepositoryMetadataArgs.entity ? connection.getMetadata(entityRepositoryMetadataArgs.entity) : undefined
        const entityRepositoryInstance = new (entityRepositoryMetadataArgs.target as any)(this, entityMetadata)

        return entityRepositoryInstance
    }
}
