import { ObjectType } from 'typeorm/common/ObjectType'
import { EntitySchema } from 'typeorm/entity-schema/EntitySchema'
import {
    Connection, CustomRepositoryNotFoundError,
    EntityTarget, getMetadataArgsStorage, Repository
} from 'typeorm'
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
    },

    getCustomRepository<T> (customRepository: ObjectType<T>, name?: string): T {
        const connection = connectionManager.get(name)
        const entityRepositoryMetadataArgs = getMetadataArgsStorage().entityRepositories.find(repository => {
            return repository.target === (customRepository instanceof Function ? customRepository : (customRepository as any).constructor)
        })
        if (!entityRepositoryMetadataArgs) {
            throw new CustomRepositoryNotFoundError(customRepository)
        }
        const entityMetadata = entityRepositoryMetadataArgs.entity ? connection.getMetadata(entityRepositoryMetadataArgs.entity) : undefined
        const entityRepositoryInstance = new (entityRepositoryMetadataArgs.target as any)(this, entityMetadata);
        (entityRepositoryInstance as any).manager = this;
        (entityRepositoryInstance as any).metadata = entityMetadata
        return entityRepositoryInstance
    },

    getRepository<Entity> (target: EntityTarget<Entity>, name?: string): Repository<Entity> {
        const connection = connectionManager.get(name)
        return connection.getRepository(target)
    }
}
