import {
    initializeTransactionalContext,
    addTransactionalDataSource
} from 'typeorm-transactional'
import { ObjectType } from 'typeorm/common/ObjectType'
import { EntitySchema } from 'typeorm/entity-schema/EntitySchema'
import {
    DataSource, EntityManager,
    EntityTarget, MissingDriverError, MongoEntityManager, QueryRunner
} from 'typeorm'
import { commonUtils } from '../utils/common-utils'
import { DriverFactory } from 'typeorm/driver/DriverFactory'
import { EntityManagerFactory } from 'typeorm/entity-manager/EntityManagerFactory'
import { DynamoEntityManager } from '../entity-manager/DynamoEntityManager'
import { PlatformTools } from 'typeorm/platform/PlatformTools'
import path from 'path'
import { PagingAndSortingRepository } from '../repository/PagingAndSortingRepository'
import { SqljsEntityManager } from 'typeorm/entity-manager/SqljsEntityManager'
import { MysqlDriver } from 'typeorm/driver/mysql/MysqlDriver'
import { PostgresDriver } from 'typeorm/driver/postgres/PostgresDriver'
import { CockroachDriver } from 'typeorm/driver/cockroachdb/CockroachDriver'
import { SapDriver } from 'typeorm/driver/sap/SapDriver'
import { SqliteDriver } from 'typeorm/driver/sqlite/SqliteDriver'
import { BetterSqlite3Driver } from 'typeorm/driver/better-sqlite3/BetterSqlite3Driver'
import { CordovaDriver } from 'typeorm/driver/cordova/CordovaDriver'
import { NativescriptDriver } from 'typeorm/driver/nativescript/NativescriptDriver'
import { ReactNativeDriver } from 'typeorm/driver/react-native/ReactNativeDriver'
import { SqljsDriver } from 'typeorm/driver/sqljs/SqljsDriver'
import { OracleDriver } from 'typeorm/driver/oracle/OracleDriver'
import { SqlServerDriver } from 'typeorm/driver/sqlserver/SqlServerDriver'
import { MongoDriver } from 'typeorm/driver/mongodb/MongoDriver'
import { DynamoDriver } from '../DynamoDriver'
import { ExpoDriver } from 'typeorm/driver/expo/ExpoDriver'
import { AuroraMysqlDriver } from 'typeorm/driver/aurora-mysql/AuroraMysqlDriver'
import { AuroraPostgresDriver } from 'typeorm/driver/aurora-postgres/AuroraPostgresDriver'
import { CapacitorDriver } from 'typeorm/driver/capacitor/CapacitorDriver'
import { SpannerDriver } from 'typeorm/driver/spanner/SpannerDriver'
import { DynamoDBClientConfigType } from '@aws-sdk/client-dynamodb'
import { DynamoClient } from '../DynamoClient'
import { environmentUtils } from '../utils/environment-utils'

let connection: any = null
let entityManager: any = null

DriverFactory.prototype.create = (connection: DataSource) => {
    const { type }: any = connection.options
    switch (type) {
    case 'mysql':
        return new MysqlDriver(connection)
    case 'postgres':
        return new PostgresDriver(connection)
    case 'cockroachdb':
        return new CockroachDriver(connection)
    case 'sap':
        return new SapDriver(connection)
    case 'mariadb':
        return new MysqlDriver(connection)
    case 'sqlite':
        return new SqliteDriver(connection)
    case 'better-sqlite3':
        return new BetterSqlite3Driver(connection)
    case 'cordova':
        return new CordovaDriver(connection)
    case 'nativescript':
        return new NativescriptDriver(connection)
    case 'react-native':
        return new ReactNativeDriver(connection)
    case 'sqljs':
        return new SqljsDriver(connection)
    case 'oracle':
        return new OracleDriver(connection)
    case 'mssql':
        return new SqlServerDriver(connection)
    case 'mongodb':
        return new MongoDriver(connection)
    case 'dynamodb':
        return new DynamoDriver(connection) as any
    case 'expo':
        return new ExpoDriver(connection)
    case 'aurora-mysql':
        return new AuroraMysqlDriver(connection)
    case 'aurora-postgres':
        return new AuroraPostgresDriver(connection)
    case 'capacitor':
        return new CapacitorDriver(connection)
    case 'spanner':
        return new SpannerDriver(connection)
    default:
        throw new MissingDriverError(type, [
            'aurora-mysql',
            'aurora-postgres',
            'better-sqlite3',
            'capacitor',
            'cockroachdb',
            'cordova',
            'expo',
            'mariadb',
            'mongodb',
            'dynamodb',
            'mssql',
            'mysql',
            'nativescript',
            'oracle',
            'postgres',
            'react-native',
            'sap',
            'sqlite',
            'sqljs',
            'spanner'
        ])
    }
}
EntityManagerFactory.prototype.create = (connection: DataSource, queryRunner?: QueryRunner): EntityManager => {
    const type: any = connection.driver.options.type
    if (type === 'dynamodb') {
        entityManager = new DynamoEntityManager(connection)
    } else if (type === 'mongodb') {
        entityManager = new MongoEntityManager(connection)
    } else if (type === 'sqljs') {
        entityManager = new SqljsEntityManager(connection, queryRunner)
    } else {
        entityManager = new EntityManager(connection, queryRunner)
    }
    return entityManager
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

export class DatasourceManagerOptions {
    entities?: ((Function | string | EntitySchema))[];
    clientConfig?: DynamoDBClientConfigType;
    synchronize?: boolean;
    disableTransactions?: boolean;
    /** The name to use for the transaction manager when registering with typeorm-transactional */
    transactionManagerName?: string;
}

const DEFAULT_OPTIONS: DatasourceManagerOptions = {
    entities: ['**/entities/**/*.{js,ts}'],
    synchronize: false
}

const TRANSACTIONS_INITIALIZED = 'TRANSACTIONS_INITIALIZED'

export const datasourceManager = {
    async open (options: DatasourceManagerOptions) {
        options = commonUtils.mixin({ ...DEFAULT_OPTIONS }, options)
        if (!connection) {
            if (!options?.disableTransactions) {
                const transactionsInitialized = environmentUtils.getVariable(TRANSACTIONS_INITIALIZED)
                if (!transactionsInitialized) {
                    environmentUtils.setVariable(TRANSACTIONS_INITIALIZED, true)
                    initializeTransactionalContext()
                }
            }
            const connectionOptions: any = {
                type: 'dynamodb',
                entities: options?.entities
            }
            connection = await new DataSource(connectionOptions).initialize()

            if (options.clientConfig) {
                new DynamoClient().getClient(options.clientConfig)
            }

            if (options.synchronize) {
                console.log('synchronizing database ... ')
                await connection.synchronize()
            }

            if (!options?.disableTransactions) {
                if (connection) {
                    addTransactionalDataSource({
                        name: options?.transactionManagerName,
                        dataSource: connection,
                        patch: true
                    })
                }
            }
        }

        return connection
    },

    getConnection (name?: string) {
        // maintaining a list of connections was deprecated by typeorm
        // we could maintain a map of all the names in the future
        // to recreate the original typeorm logic
        if (!connection) {
            throw new Error('connection is undefined.  Did you forget to call open()?')
        }
        return connection
    },

    getCustomRepository<T, Entity> (customRepository: { new(a: any, b: any): T ;}, customEntity: ObjectType<Entity>, name?: string): T {
        return new customRepository(customEntity, connection.createEntityManager())
    },

    getRepository<Entity> (target: EntityTarget<Entity>, name?: string): PagingAndSortingRepository<Entity> {
        return datasourceManager.getConnection(name).getRepository(target)
    },

    async close () {
        // does nothing in dynamodb.  Adding for compatability with other libraries.
    }
}

export const open = async (options: DatasourceManagerOptions) => {
    return datasourceManager.open(options)
}

export const getConnection = (name?: string) => {
    return datasourceManager.getConnection(name)
}

export const getCustomRepository = <T, Entity> (customRepository: { new(a: any, b: any): T ;}, customEntity: ObjectType<Entity>, name?: string): T => {
    return datasourceManager.getCustomRepository(customRepository, customEntity)
}

export const getRepository = <Entity> (target: EntityTarget<Entity>, name?: string): PagingAndSortingRepository<Entity> => {
    return datasourceManager.getRepository(target, name)
}

export const close = () => {
    return datasourceManager.close()
}
