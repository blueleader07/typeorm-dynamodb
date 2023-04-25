import * as typeorm from 'typeorm'
import sinon from 'sinon'
import { datasourceManager } from '../../src'
import { DummyRepository } from '../repositories/dummy-repository'
import { DynamoDbEntityManager } from '../../src/driver/dynamo/entity-manager/dynamodb-entity-manager'
import { DynamodbSchemaBuilder } from '../../src/schema-builder/dynamodb-schema-builder'

const MockGetCustomRepository = (entityManager: DynamoDbEntityManager) => {
    // @ts-ignore
    entityManager.getCustomRepository = (type) => {
        if (type === DummyRepository) {
            return new DummyRepository()
        }
        throw Error(`Repository is not mocked: ${type}`)
    }
}

const MockConnection = (entityManager: typeorm.EntityManager) => {
    const connection: any = sinon.createStubInstance(typeorm.Connection)
    connection.manager = entityManager
    connection.logger = {
        log: (log: any, message: any) => {
            // not sure if this is really helpful ... you can see some logs
        }
    }
    connection.transaction = {}
    connection.synchronize = () => {}
    sinon.stub(typeorm, 'getConnection').returns(connection)
    return connection
}

const MockConnectionManager = (connection: typeorm.Connection) => {
    const connectionManager: any = sinon.createStubInstance(typeorm.ConnectionManager)
    connectionManager.get = () => {
        return connection
    }
    sinon.stub(typeorm, 'getConnectionManager').returns(connectionManager)
    sinon.stub(typeorm.ConnectionManager.prototype, 'get').returns(connectionManager)
}

const MockEntityManager = async () => {
    const entityManager: any = sinon.createStubInstance(DynamoDbEntityManager)
    entityManager.transaction = async (fn: any) => {
        return fn(entityManager)
    }
    sinon.stub(typeorm, 'getManager').returns(entityManager)
    sinon.stub(DynamodbSchemaBuilder.prototype, 'build').resolves()
    MockGetCustomRepository(entityManager)
    // @ts-ignore
    MockGetCustomRepository(datasourceManager)
    const connection = MockConnection(entityManager)
    MockConnectionManager(connection)
}

export {
    MockConnection,
    MockGetCustomRepository,
    MockEntityManager
}
