import { ObjectType } from 'typeorm/common/ObjectType'
import { EntitySchema } from 'typeorm/entity-schema/EntitySchema'
import {
    Connection, EntityManager, EntityMetadata,
    EntityTarget, QueryRunner, Repository
} from 'typeorm'
import {
    initializeTransactionalContext,
    patchTypeORMRepositoryWithBaseRepository
} from 'typeorm-transactional-cls-hooked'
import { DynamodbDriver } from '../driver/dynamodb-driver'
import { connectionManager } from './connection-manager'
import { commonUtils } from '@lmig/legal-nodejs-utils'
import { DriverFactory } from 'typeorm/driver/DriverFactory'
import { RepositoryFactory } from 'typeorm/repository/RepositoryFactory'
import { DynamodbRepository } from '../repositories/dynamodb-repository'
import { EntityManagerFactory } from 'typeorm/entity-manager/EntityManagerFactory'
import { DynamoDbEntityManager } from '../entity-manager/dynamodb-entity-manager'
import { PlatformTools } from 'typeorm/platform/PlatformTools'
import path from 'path'

DriverFactory.prototype.create = (connection: Connection) => {
    return new DynamodbDriver(connection)
}
RepositoryFactory.prototype.create = (manager: EntityManager, metadata: EntityMetadata, queryRunner?: QueryRunner): Repository<any> => {
    const repository: any = new DynamodbRepository()
    Object.assign(repository, {
        manager: manager,
        metadata: metadata,
        queryRunner: queryRunner
    })
    return repository
}
EntityManagerFactory.prototype.create = (connection: Connection, queryRunner?: QueryRunner): EntityManager => {
    return new DynamoDbEntityManager(connection)
}
PlatformTools.load = function (name) {
    // if name is not absolute or relative, then try to load package from the node_modules of the directory we are currently in
    // this is useful when we are using typeorm package globally installed and it accesses drivers
    // that are not installed globally
    try {
        // switch case to explicit require statements for webpack compatibility.
        switch (name) {
        /**
             * aws-sdk
             */
        case 'aws-sdk':
            return require('aws-sdk')
        /**
             * mongodb
             */
        case 'mongodb':
            return require('mongodb')
            /**
             * hana
             */
        case '@sap/hana-client':
            return require('@sap/hana-client')
        case 'hdb-pool':
            return require('hdb-pool')
            /**
             * mysql
             */
        case 'mysql':
            return require('mysql')
        case 'mysql2':
            return require('mysql2')
            /**
             * oracle
             */
        case 'oracledb':
            return require('oracledb')
            /**
             * postgres
             */
        case 'pg':
            return require('pg')
        case 'pg-native':
            return require('pg-native')
        case 'pg-query-stream':
            return require('pg-query-stream')
        case 'typeorm-aurora-data-api-driver':
            return require('typeorm-aurora-data-api-driver')
            /**
             * redis
             */
        case 'redis':
            return require('redis')
        case 'ioredis':
            return require('ioredis')
            /**
             * better-sqlite3
             */
        case 'better-sqlite3':
            return require('better-sqlite3')
            /**
             * sqlite
             */
        case 'sqlite3':
            return require('sqlite3')
            /**
             * sql.js
             */
        case 'sql.js':
            return require('sql.js')
            /**
             * sqlserver
             */
        case 'mssql':
            return require('mssql')
            /**
             * react-native-sqlite
             */
        case 'react-native-sqlite-storage':
            return require('react-native-sqlite-storage')
        }
    } catch (err) {
        return require(path.resolve(process.cwd() + '/node_modules/' + name))
    }
    // If nothing above matched and we get here, the package was not listed within PlatformTools
    // and is an Invalid Package.  To make it explicit that this is NOT the intended use case for
    // PlatformTools.load - it's not just a way to replace `require` all willy-nilly - let's throw
    // an error.
    throw new TypeError('Invalid Package for PlatformTools.load: ' + name)
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
            const connectionOptions: any = {
                type: 'dynamodb',
                entities: options?.entities
            }
            connection = await connectionManager.create(connectionOptions)
        }
        return connection
    },

    async getConnection (name?: string) {
        return connectionManager.get(name)
    },

    getCustomRepository<T> (customRepository: ObjectType<T>, name?: string): T {
        const connection = connectionManager.get(name)
        return connection.getCustomRepository(customRepository)
        // const entityRepositoryMetadataArgs = getMetadataArgsStorage().entityRepositories.find(repository => {
        //     return repository.target === (customRepository instanceof Function ? customRepository : (customRepository as any).constructor)
        // })
        // if (!entityRepositoryMetadataArgs) {
        //     throw new CustomRepositoryNotFoundError(customRepository)
        // }
        // const entityMetadata = entityRepositoryMetadataArgs.entity ? connection.getMetadata(entityRepositoryMetadataArgs.entity) : undefined
        // const entityRepositoryInstance = new (entityRepositoryMetadataArgs.target as any)(this, entityMetadata);
        // (entityRepositoryInstance as any).manager = this;
        // (entityRepositoryInstance as any).metadata = entityMetadata
        // return entityRepositoryInstance
    },

    getRepository<Entity> (target: EntityTarget<Entity>, name?: string): Repository<Entity> {
        const connection = connectionManager.get(name)
        return connection.getRepository(target)
    },

    async close () {
        // does nothing in dynamodb.  Adding for compatability with other legal-nodejs-{database} libraries.
    }
}
