import { ObjectType } from 'typeorm/common/ObjectType'
import { EntitySchema } from 'typeorm/entity-schema/EntitySchema'
import {
    DataSource, EntityManager,
    EntityTarget, QueryRunner, Repository
} from 'typeorm'
import { DynamoDriver } from '../DynamoDriver'
import { commonUtils } from '../utils/common-utils'
import { DriverFactory } from 'typeorm/driver/DriverFactory'
import { DynamoRepository } from '../repository/DynamoRepository'
import { EntityManagerFactory } from 'typeorm/entity-manager/EntityManagerFactory'
import { DynamoEntityManager } from '../entity-manager/DynamoEntityManager'
import { PlatformTools } from 'typeorm/platform/PlatformTools'
import path from 'path'
import { ObjectLiteral } from 'typeorm/common/ObjectLiteral'

DriverFactory.prototype.create = (connection: DataSource) => {
    return new DynamoDriver(connection)
}
EntityManager.prototype.getRepository = <Entity extends ObjectLiteral>(target: EntityTarget<Entity>): Repository<Entity> => {
    const repository: any = new DynamoRepository(target, EntityManager.prototype, EntityManager.prototype.queryRunner)
    return repository
}
EntityManagerFactory.prototype.create = (connection: DataSource, queryRunner?: QueryRunner): EntityManager => {
    return new DynamoEntityManager(connection)
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
        case '@aws-sdk/client-dynamodb':
            return require('@aws-sdk/client-dynamodb')
        case '@aws-sdk/lib-dynamodb':
            return require('@aws-sdk/lib-dynamodb')
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

let connection: any = null

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
            connection = await new DataSource(connectionOptions).initialize()
        }

        if (options.synchronize) {
            console.log('synchronizing database ... ')
            await connection.synchronize()
        }

        return connection
    },

    getConnection (name?: string) {
        // maintaining a list of connections was deprecated by typeorm
        // we could maintain a map of all the names in the future
        // to recreate the original typeorm logic
        return connection
    },

    getCustomRepository<T, Entity> (customRepository: { new(a: any, b: any): T ;}, customEntity: ObjectType<Entity>, name?: string): T {
        return new customRepository(customEntity, connection.createEntityManager())
    },

    getRepository<Entity> (target: EntityTarget<Entity>, name?: string): Repository<Entity> {
        return this.getConnection(name).getRepository(target)
    },

    async close () {
        // does nothing in dynamodb.  Adding for compatability with other legal-nodejs-{database} libraries.
    }
}
