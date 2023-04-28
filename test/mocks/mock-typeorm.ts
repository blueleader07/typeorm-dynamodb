import * as typeorm from 'typeorm'
import sinon from 'sinon'
import { datasourceManager } from '../../src'
import { DummyRepository } from '../repositories/dummy-repository'
import { DynamoEntityManager } from '../../src/driver/dynamo/entity-manager/DynamoEntityManager'
import { DynamoSchemaBuilder } from '../../src/driver/dynamo/DynamoSchemaBuilder'

const MockGetCustomRepository = (entityManager: DynamoEntityManager) => {
    // @ts-ignore
    entityManager.getCustomRepository = (repositoryClass: any, entityClass: any) => {
        if (repositoryClass === DummyRepository) {
            return new DummyRepository(entityClass, entityManager)
        }
        throw Error(`Repository is not mocked: ${repositoryClass}`)
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
    const entityManager: any = sinon.createStubInstance(DynamoEntityManager)
    entityManager.transaction = async (fn: any) => {
        return fn(entityManager)
    }
    sinon.stub(typeorm, 'getManager').returns(entityManager)
    sinon.stub(DynamoSchemaBuilder.prototype, 'build').resolves()
    const connection = MockConnection(entityManager)
    MockGetCustomRepository(entityManager)
    // @ts-ignore
    MockGetCustomRepository(datasourceManager)
    MockConnectionManager(connection)
}

export {
    MockConnection,
    MockGetCustomRepository,
    MockEntityManager
}
