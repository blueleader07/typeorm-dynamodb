import expect from 'expect'
import { DummyRepository } from './dummy-repository'
import { datasourceManager, DynamoClient, getRepository } from '../../src'
import { Dummy } from '../entities/dummy'
import sinon from 'sinon'

const describeFloci = process.env.FLOCI_INTEGRATION === 'true' ? describe : describe.skip

const seedDummy = async (
    id: string,
    adjustmentGroupId: string,
    adjustmentStatus: string
) => {
    const repository = getRepository(Dummy)
    const entity = new Dummy()
    entity.id = id
    entity.adjustmentGroupId = adjustmentGroupId
    entity.adjustmentStatus = adjustmentStatus
    entity.lineItemNumber = 1
    entity.lineItemName = 'line-item'
    entity.error = 'none'
    entity.created = new Date().toISOString()
    await repository.put(entity)
}

describe('crud-repository', () => {
    afterEach(() => {
        sinon.restore()
    })
    it('select', async (): Promise<any> => {
        expect(1).toBe(1)
    })
    it('updateExpression', async (): Promise<any> => {
        const createTableStub = sinon.stub(DynamoClient.prototype, 'createTable').resolves()
        const updateStub = sinon.stub(DynamoClient.prototype, 'update').resolves()

        await datasourceManager.open({
            entities: [Dummy],
            synchronize: true
        })
        const repository = datasourceManager.getCustomRepository(DummyRepository, Dummy)
        await repository.updateExpression({
            where: {
                id: '111-222-333'
            },
            setValues: {
                adjustmentStatus: 'failed',
                adjustmentGroupId: '444-555-666',
                error: 'some error occurred'
            }
        })

        const expected: any = {
            TableName: 'dummy_t',
            Key: {
                id: '111-222-333'
            },
            UpdateExpression: 'SET #adjustmentStatus = :adjustmentStatus, #adjustmentGroupId = :adjustmentGroupId, #error = :error, #adjustmentGroupId_adjustmentStatus = :adjustmentGroupId_adjustmentStatus, #id_adjustmentStatus = :id_adjustmentStatus',
            ExpressionAttributeNames: {
                '#adjustmentStatus': 'adjustmentStatus',
                '#adjustmentGroupId': 'adjustmentGroupId',
                '#error': 'error',
                '#adjustmentGroupId_adjustmentStatus': 'adjustmentGroupId#adjustmentStatus',
                '#id_adjustmentStatus': 'id#adjustmentStatus'
            },
            ExpressionAttributeValues: {
                ':adjustmentStatus': 'failed',
                ':adjustmentGroupId': '444-555-666',
                ':error': 'some error occurred',
                ':adjustmentGroupId_adjustmentStatus': '444-555-666#failed',
                ':id_adjustmentStatus': '111-222-333#failed'
            }
        }

        expect(createTableStub.calledOnce).toBe(true)
        expect(updateStub.calledWith(expected)).toBe(true)
    })

    it('updateExpression 2', async () => {
        const updateStub = sinon.stub(DynamoClient.prototype, 'update').resolves()

        await datasourceManager.open({
            entities: [Dummy]
        })
        const repository = datasourceManager.getCustomRepository(DummyRepository, Dummy)
        await repository.updateExpression({
            where: {
                id: '111-222-333'
            },
            setValues: {
                adjustmentGroupId: '444-555-666',
                adjustmentStatus: 'failed'
            },
            addValues: {
                lineItemNumber: 1
            }
        })

        const expected: any = {
            TableName: 'dummy_t',
            Key: {
                id: '111-222-333'
            },
            UpdateExpression: 'SET #adjustmentGroupId = :adjustmentGroupId, #adjustmentStatus = :adjustmentStatus, #adjustmentGroupId_adjustmentStatus = :adjustmentGroupId_adjustmentStatus, #id_adjustmentStatus = :id_adjustmentStatus ADD #lineItemNumber :lineItemNumber',
            ExpressionAttributeNames: {
                '#lineItemNumber': 'lineItemNumber',
                '#adjustmentGroupId': 'adjustmentGroupId',
                '#adjustmentStatus': 'adjustmentStatus',
                '#adjustmentGroupId_adjustmentStatus': 'adjustmentGroupId#adjustmentStatus',
                '#id_adjustmentStatus': 'id#adjustmentStatus'
            },
            ExpressionAttributeValues: {
                ':lineItemNumber': 1,
                ':adjustmentGroupId': '444-555-666',
                ':adjustmentStatus': 'failed',
                ':adjustmentGroupId_adjustmentStatus': '444-555-666#failed',
                ':id_adjustmentStatus': '111-222-333#failed'
            }
        }

        expect(updateStub.calledWith(expected)).toBe(true)
    })

    it('filter', async () => {
        const putStub = sinon.stub(DynamoClient.prototype, 'put')
        putStub.resolves()
        const scanStub = sinon.stub(DynamoClient.prototype, 'scan')
        scanStub.resolves({
            Items: []
        } as any)
        await datasourceManager.open({
            entities: [Dummy]
        })
        const repository = datasourceManager.getCustomRepository(DummyRepository, Dummy)
        await repository.put({
            id: '123',
            adjustmentStatus: 'failed',
            adjustmentGroupId: '123'
        })
        const results = await repository.findAll({
            filter: "adjustmentStatus = 'failed'"
        })

        console.log('results', results)

        const expected: any = {
            TableName: 'dummy_t',
            KeyConditionExpression: undefined,
            ExpressionAttributeNames: {
                '#adjustmentStatus': 'adjustmentStatus'
            },
            ExpressionAttributeValues: {
                ':adjustmentStatus': {
                    S: 'failed'
                }
            },
            FilterExpression: '#adjustmentStatus = :adjustmentStatus',
            ProjectionExpression: undefined,
            ScanIndexForward: true
        }

        expect(scanStub.calledWith(expected)).toBe(true)
    })

    it('multiple filters OR', async () => {
        const putStub = sinon.stub(DynamoClient.prototype, 'put')
        putStub.resolves()
        const scanStub = sinon.stub(DynamoClient.prototype, 'scan')
        scanStub.resolves({
            Items: []
        } as any)
        await datasourceManager.open({
            entities: [Dummy]
        })
        const repository = datasourceManager.getCustomRepository(DummyRepository, Dummy)
        await repository.put({
            id: '123',
            adjustmentStatus: 'failed',
            adjustmentGroupId: '123'
        })
        const results = await repository.findAll({
            filter: "adjustmentStatus = 'failed' OR adjustmentGroupId = '123'"
        })

        console.log('results', results)

        const expected: any = {
            TableName: 'dummy_t',
            KeyConditionExpression: undefined,
            ExpressionAttributeNames: {
                '#adjustmentStatus': 'adjustmentStatus',
                '#adjustmentGroupId': 'adjustmentGroupId'
            },
            ExpressionAttributeValues: {
                ':adjustmentStatus': {
                    S: 'failed'
                },
                ':adjustmentGroupId': {
                    S: '123'
                }
            },
            FilterExpression: '#adjustmentStatus = :adjustmentStatus OR #adjustmentGroupId = :adjustmentGroupId',
            ProjectionExpression: undefined,
            ScanIndexForward: true
        }

        expect(scanStub.calledWith(expected)).toBe(true)
    })

    it('multiple filters AND', async () => {
        const putStub = sinon.stub(DynamoClient.prototype, 'put')
        putStub.resolves()
        const scanStub = sinon.stub(DynamoClient.prototype, 'scan')
        scanStub.resolves({
            Items: []
        } as any)
        await datasourceManager.open({
            entities: [Dummy]
        })
        const repository = datasourceManager.getCustomRepository(DummyRepository, Dummy)
        await repository.put({
            id: '123',
            adjustmentStatus: 'failed',
            adjustmentGroupId: '123'
        })
        const results = await repository.findAll({
            filter: "adjustmentStatus = 'failed' AND adjustmentGroupId = '123'"
        })

        console.log('results', results)

        const expected: any = {
            TableName: 'dummy_t',
            KeyConditionExpression: undefined,
            ExpressionAttributeNames: {
                '#adjustmentStatus': 'adjustmentStatus',
                '#adjustmentGroupId': 'adjustmentGroupId'
            },
            ExpressionAttributeValues: {
                ':adjustmentStatus': {
                    S: 'failed'
                },
                ':adjustmentGroupId': {
                    S: '123'
                }
            },
            FilterExpression: '#adjustmentStatus = :adjustmentStatus AND #adjustmentGroupId = :adjustmentGroupId',
            ProjectionExpression: undefined,
            ScanIndexForward: true
        }

        expect(scanStub.calledWith(expected)).toBe(true)
    })
})

describeFloci('crud-repository floci integration', () => {
    beforeAll(async () => {
        process.env.DYNAMO_ENDPOINT = process.env.DYNAMO_ENDPOINT || 'http://localhost:4566'
        process.env.DYNAMO_REGION = process.env.DYNAMO_REGION || 'us-east-1'
        process.env.AWS_REGION = process.env.AWS_REGION || 'us-east-1'
        process.env.AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || 'test'
        process.env.AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || 'test'

        await datasourceManager.open({
            entities: [Dummy],
            synchronize: true,
            clientConfig: {
                endpoint: process.env.DYNAMO_ENDPOINT,
                region: process.env.AWS_REGION,
                credentials: {
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
                }
            }
        })
    })

    it('executes real query path for findOne', async () => {
        const id = `floci-query-${Date.now()}`
        await seedDummy(id, 'floci-group-query', 'floci-status-query')

        const repository = getRepository(Dummy)
        const item = await repository.findOne(id)

        expect(item).toBeDefined()
        expect(item?.id).toBe(id)
    })

    it('returns both rows for same-field OR filter (bug repro against real DynamoDB)', async () => {
        const groupId = `floci-group-${Date.now()}`
        const statusA = `floci-status-a-${Date.now()}`
        const statusB = `floci-status-b-${Date.now()}`

        await seedDummy(`${groupId}-1`, groupId, statusA)
        await seedDummy(`${groupId}-2`, groupId, statusB)

        const repository = getRepository(Dummy)
        const items = await repository.findAll({
            filter: `adjustmentStatus = '${statusA}' or adjustmentStatus = '${statusB}'`
        })

        const statuses = items.map((item: any) => item.adjustmentStatus)
        expect(statuses).toContain(statusA)
        expect(statuses).toContain(statusB)
    })
})
