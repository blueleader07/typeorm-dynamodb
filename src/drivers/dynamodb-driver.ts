import {
    ColumnType, Connection,
    Driver,
    EntityMetadata,
    ObjectLiteral,
    QueryRunner,
    ReplicationMode,
    Table,
    TableColumn,
    TableForeignKey
} from 'typeorm'
import { BaseConnectionOptions } from 'typeorm/connection/BaseConnectionOptions'
import { DataTypeDefaults } from 'typeorm/driver/types/DataTypeDefaults'
import { MappedColumnTypes } from 'typeorm/driver/types/MappedColumnTypes'
import { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata'
import { SchemaBuilder } from 'typeorm/schema-builder/SchemaBuilder'
import { View } from 'typeorm/schema-builder/view/View'

/**
 * Organizes communication with MongoDB.
 */
export class DynamodbDriver implements Driver {
    /**
     * Connection used by driver.
     */
    connection: Connection;
    options: BaseConnectionOptions;
    database?: string | undefined;
    schema?: string | undefined;
    isReplicated: boolean;
    treeSupport: boolean;
    supportedDataTypes: ColumnType[] = [
        'string',
        'number',
        'binary'
    ];

    dataTypeDefaults: DataTypeDefaults = {};
    spatialTypes: ColumnType[] = [];

    /**
     * Gets list of column data types that support length by a driver.
     */
    withLengthColumnTypes: ColumnType[] = [
        'string'
    ];

    withPrecisionColumnTypes: ColumnType[] = [];
    withScaleColumnTypes: ColumnType[] = [];

    /**
     * Orm has special columns and we need to know what database column types should be for those types.
     * Column types are driver dependant.
     */
    mappedDataTypes: MappedColumnTypes = {
        createDate: 'varchar',
        createDateDefault: 'now()',
        updateDate: 'varchar',
        updateDateDefault: 'now()',
        deleteDate: 'varchar',
        deleteDateNullable: true,
        version: 'varchar',
        treeLevel: 'varchar',
        migrationId: 'varchar',
        migrationName: 'varchar',
        migrationTimestamp: 'varchar',
        cacheId: 'varchar',
        cacheIdentifier: 'varchar',
        cacheTime: 'varchar',
        cacheDuration: 'varchar',
        cacheQuery: 'varchar',
        cacheResult: 'varchar',
        metadataType: 'varchar',
        metadataDatabase: 'varchar',
        metadataSchema: 'varchar',
        metadataTable: 'varchar',
        metadataName: 'varchar',
        metadataValue: 'varchar'
    };

    maxAliasLength?: number | undefined;
    constructor (connection: Connection) {
        this.connection = connection
    }

    connect (): Promise<void> {
        return Promise.resolve()
    }

    afterConnect (): Promise<void> {
        return Promise.resolve()
    }

    disconnect (): Promise<void> {
        return Promise.resolve()
    }

    createSchemaBuilder (): SchemaBuilder {
        throw new Error('Method not implemented.')
    }

    createQueryRunner (mode: ReplicationMode): QueryRunner {
        throw new Error('Method not implemented.')
    }

    escapeQueryWithParameters (sql: string, parameters: ObjectLiteral, nativeParameters: ObjectLiteral): [string, any[]] {
        throw new Error('Method not implemented.')
    }

    escape (name: string): string {
        throw new Error('Method not implemented.')
    }

    buildTableName (tableName: string, schema?: string, database?: string): string {
        return tableName
    }

    parseTableName (target: string | EntityMetadata | Table | View | TableForeignKey): { tableName: string; schema?: string | undefined; database?: string | undefined; } {
        throw new Error('Method not implemented.')
    }

    preparePersistentValue (value: any, column: ColumnMetadata) {
        throw new Error('Method not implemented.')
    }

    prepareHydratedValue (value: any, column: ColumnMetadata) {
        throw new Error('Method not implemented.')
    }

    normalizeType (column: { type?: string | BooleanConstructor | DateConstructor | NumberConstructor | StringConstructor | undefined; length?: string | number | undefined; precision?: number | null | undefined; scale?: number | undefined; isArray?: boolean | undefined; }): string {
        if (column.type === Number || column.type === 'int' || column.type === 'int4') {
            return 'number'
        } else if (column.type === String || column.type === 'varchar' || column.type === 'varchar2') {
            return 'string'
        } else if (column.type === Date || column.type === 'timestamp' || column.type === 'date' || column.type === 'datetime') {
            return 'string'
        } else if (column.type === 'timestamptz') {
            return 'string'
        } else if (column.type === 'time') {
            return 'string'
        } else if (column.type === 'timetz') {
            return 'string'
        } else if (column.type === Boolean || column.type === 'bool') {
            return 'string'
        } else if (column.type === 'simple-array') {
            return 'string'
        } else if (column.type === 'simple-json') {
            return 'string'
        } else if (column.type === 'simple-enum') {
            return 'string'
        } else if (column.type === 'int2') {
            return 'number'
        } else if (column.type === 'int8') {
            return 'string'
        } else if (column.type === 'decimal') {
            return 'string'
        } else if (column.type === 'float8' || column.type === 'float') {
            return 'string'
        } else if (column.type === 'float4') {
            return 'string'
        } else if (column.type === 'char') {
            return 'string'
        } else if (column.type === 'varbit') {
            return 'string'
        } else {
            return column.type as string || ''
        }
    }

    normalizeDefault (columnMetadata: ColumnMetadata): string | undefined {
        throw new Error('Method not implemented.')
    }

    normalizeIsUnique (column: ColumnMetadata): boolean {
        throw new Error('Method not implemented.')
    }

    getColumnLength (column: ColumnMetadata): string {
        throw new Error('Method not implemented.')
    }

    createFullType (column: TableColumn): string {
        throw new Error('Method not implemented.')
    }

    obtainMasterConnection (): Promise<any> {
        throw new Error('Method not implemented.')
    }

    obtainSlaveConnection (): Promise<any> {
        throw new Error('Method not implemented.')
    }

    createGeneratedMap (metadata: EntityMetadata, insertResult: any, entityIndex?: number, entityNum?: number): ObjectLiteral | undefined {
        throw new Error('Method not implemented.')
    }

    findChangedColumns (tableColumns: TableColumn[], columnMetadatas: ColumnMetadata[]): ColumnMetadata[] {
        throw new Error('Method not implemented.')
    }

    isReturningSqlSupported (): boolean {
        throw new Error('Method not implemented.')
    }

    isUUIDGenerationSupported (): boolean {
        throw new Error('Method not implemented.')
    }

    isFullTextColumnTypeSupported (): boolean {
        throw new Error('Method not implemented.')
    }

    createParameter (parameterName: string, index: number): string {
        throw new Error('Method not implemented.')
    }
}
