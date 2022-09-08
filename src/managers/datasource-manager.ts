import { EntitySchema } from 'typeorm/entity-schema/EntitySchema'
import {
    DataSource,
    EntityManager,
    EntityTarget,
    ObjectLiteral,
    Repository
} from 'typeorm'
import { connectionManager } from './connection-manager'
import { commonUtils, environmentUtils } from '@lmig/legal-nodejs-utils'
import { PlatformTools } from 'typeorm/platform/PlatformTools'

let connection: DataSource

export class DatasourceManagerOptions {
    entities?: ((Function | string | EntitySchema))[];
    synchronize?: boolean
}

const DEFAULT_OPTIONS: DatasourceManagerOptions = {
    entities: ['**/entities/**/*.{js,ts}'],
    synchronize: false
}

export const datasourceManager = {
    async open (options: DatasourceManagerOptions) {
        options = commonUtils.mixin({ ...DEFAULT_OPTIONS }, options)
        if (!connection) {
            const connectionOptions: any = {
                type: 'dynamodb',
                entities: options?.entities
            }
            connection = await connectionManager.create(connectionOptions)
        }

        const endpoint = environmentUtils.getVariable('DYNAMO_ENDPOINT')
        if (endpoint) {
            const region = environmentUtils.getVariable('DYNAMO_REGION') || 'us-east-1'
            const AWS = PlatformTools.load('aws-sdk')
            AWS.config.update({
                region,
                endpoint
            })
        }

        if (options.synchronize) {
            console.log('synchronizing database ... ')
            await connection.synchronize()
        }

        return connection
    },

    async getConnection () {
        return connection
    },

    createEntityManager () {
        return connection.createEntityManager()
    },

    // getCustomRepository<T> (customRepository: ObjectType<T>): T {
    //     return new T()
    //     // return connection.getRepository(customRepository)
    // },

    getCustomRepository<CustomRepository, Entity extends ObjectLiteral> (customRepository: { new(target: EntityTarget<Entity>, entityManager: EntityManager): CustomRepository }, entityOrClassName: EntityTarget<Entity>): CustomRepository {
        // type repositoryType = { new(entityOrClass: ObjectLiteral, entityManager: EntityManager): T }
        // { new(entityOrClass: ObjectLiteral, entityManager: EntityManager): T }
        return new customRepository(entityOrClassName, connection.createEntityManager())
    },

    getRepository<Entity> (target: EntityTarget<Entity>): Repository<Entity> {
        return connection.getRepository(target)
    },

    async close () {
        // does nothing in dynamodb.  Adding for compatability with other legal-nodejs-{database} libraries.
    }
}
