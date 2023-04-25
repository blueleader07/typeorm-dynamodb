import { DataSource } from 'typeorm/data-source/DataSource'
import { DynamoDriver } from '../../driver/dynamo/DynamoDriver'

/**
 * Helps to create drivers.
 */
export class DriverFactory {
    /**
     * Creates a new driver depend on a given connection's driver type.
     */
    create (connection: DataSource): DynamoDriver {
        return new DynamoDriver(connection)
    }
}
