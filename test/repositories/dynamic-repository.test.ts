import expect from 'expect'
import { open, getRepository, DynamoClient } from '../../src'
import { Dummy } from '../entities/dummy'
import sinon from 'sinon'
import { marshall } from '@aws-sdk/util-dynamodb'

describe('dynamic-repository', () => {
    afterEach(() => {
        sinon.restore()
    })
    it('put undefined', async (): Promise<any> => {
        await open({
            entities: [Dummy],
            synchronize: true
        })
        const repository = getRepository(Dummy)

        const dummy: any = new Dummy()
        dummy.id = '123'
        dummy.name = 'some-dummy-name'
        dummy.adjustmentGroupId = '1'
        dummy.adjustmentStatus = 'processed'
        dummy.error = undefined

        const results: any = {
            Items: [marshall(dummy, { convertClassInstanceToMap: true, removeUndefinedValues: true })]
        }

        const getStub = sinon.stub(DynamoClient.prototype, 'query')
        getStub.resolves(results)
        const putStub = sinon.stub(DynamoClient.prototype, 'put')
        putStub.resolves()

        await repository.put(dummy)

        const item = await repository.get(dummy.id)

        expect(putStub.calledOnce).toBe(true)
        expect(getStub.calledOnce).toBe(true)
        expect(item).toBeDefined()
    })

    it('batchRead', async (): Promise<any> => {
        await open({
            entities: [Dummy],
            synchronize: true
        })
        const repository = getRepository(Dummy)

        const dummy: any = new Dummy()
        dummy.id = '123'
        dummy.name = 'some-dummy-name'
        dummy.adjustmentGroupId = '1'
        dummy.adjustmentStatus = 'processed'
        dummy.error = undefined

        const results: any = {
            Responses: {
                dummy_t: [marshall(dummy, { convertClassInstanceToMap: true, removeUndefinedValues: true })]
            }
        }

        const batchGetStub = sinon.stub(DynamoClient.prototype, 'batchGet')
        batchGetStub.resolves(results)
        const putStub = sinon.stub(DynamoClient.prototype, 'put')
        putStub.resolves()

        await repository.put(dummy)

        const items = await repository.batchRead([{ id: '123' }])

        expect(putStub.calledOnce).toBe(true)
        expect(batchGetStub.calledOnce).toBe(true)
        expect(items).toBeDefined()
    })

    it('executeStatement', async (): Promise<any> => {
        await open({
            entities: [Dummy],
            synchronize: true
        })
        const repository = getRepository(Dummy)

        const dummy: any = new Dummy()
        dummy.id = '123'
        dummy.name = 'some-dummy-name'
        dummy.adjustmentGroupId = '1'
        dummy.adjustmentStatus = 'processed'
        dummy.error = undefined

        const results: any = {
            Items: [dummy]
        }

        const executeStatementStub = sinon.stub(DynamoClient.prototype, 'executeStatement')
        executeStatementStub.resolves(results)
        const putStub = sinon.stub(DynamoClient.prototype, 'put')
        putStub.resolves()

        await repository.put(dummy)

        const items = await repository.executeStatement(
            'SELECT * FROM dummy_t WHERE "id#adjustmentStatus" IN [?]',
            ['123#processed']
        )

        expect(putStub.calledOnce).toBe(true)
        expect(executeStatementStub.calledOnce).toBe(true)
        expect(items).toBeDefined()
    })

    it('query', async (): Promise<any> => {
        await open({
            entities: [Dummy],
            synchronize: true
        })
        const repository = getRepository(Dummy)

        const dummy = new Dummy()
        dummy.id = '123'
        dummy.name = 'some-dummy-name'
        dummy.adjustmentGroupId = '1'
        dummy.adjustmentStatus = 'processed'

        const results: any = {
            Items: [marshall(dummy, { convertClassInstanceToMap: true })]
        }

        const getStub = sinon.stub(DynamoClient.prototype, 'query')
        getStub.resolves(results)
        const putStub = sinon.stub(DynamoClient.prototype, 'put')
        putStub.resolves()

        await repository.put(dummy)

        const item = await repository.get(dummy.id)

        expect(putStub.calledOnce).toBe(true)
        expect(getStub.calledOnce).toBe(true)
        expect(item).toBeDefined()
    })
    it('find', async (): Promise<any> => {
        await open({
            entities: [Dummy],
            synchronize: true
        })
        const repository = getRepository(Dummy)

        const dummy = new Dummy()
        dummy.id = '123'
        dummy.name = 'some-dummy-name'
        dummy.adjustmentGroupId = '1'
        dummy.adjustmentStatus = 'processed'

        const results: any = {
            Items: [marshall(dummy, { convertClassInstanceToMap: true })]
        }

        const getStub = sinon.stub(DynamoClient.prototype, 'scan')
        getStub.resolves(results)
        const putStub = sinon.stub(DynamoClient.prototype, 'put')
        putStub.resolves()

        await repository.put(dummy)

        const items = await repository.find()

        expect(putStub.calledOnce).toBe(true)
        expect(getStub.calledOnce).toBe(true)
        expect(items.length).toBe(1)
    })
    it('findAll', async (): Promise<any> => {
        await open({
            entities: [Dummy],
            synchronize: true
        })
        const repository = getRepository(Dummy)

        const dummy = new Dummy()
        dummy.id = '123'
        dummy.name = 'some-dummy-name'
        dummy.adjustmentGroupId = '1'
        dummy.adjustmentStatus = 'processed'

        const results: any = {
            Items: [marshall(dummy, { convertClassInstanceToMap: true })]
        }

        const scanStub = sinon.stub(DynamoClient.prototype, 'scan')
        scanStub.resolves(results)
        const putStub = sinon.stub(DynamoClient.prototype, 'put')
        putStub.resolves()

        await repository.put(dummy)

        const items = await repository.findAll()

        expect(putStub.calledOnce).toBe(true)
        expect(scanStub.calledOnce).toBe(true)
        expect(items.length).toBe(1)
    })
    it('findAll index', async (): Promise<any> => {
        await open({
            entities: [Dummy],
            synchronize: true
        })
        const repository = getRepository(Dummy)

        const dummy = new Dummy()
        dummy.id = '123'
        dummy.name = 'some-dummy-name'
        dummy.adjustmentGroupId = '1'
        dummy.adjustmentStatus = 'processed'
        dummy.lineItemNumber = 1

        const results: any = {
            Items: [marshall(dummy, { convertClassInstanceToMap: true })]
        }

        const queryStub = sinon.stub(DynamoClient.prototype, 'query')
        queryStub.resolves(results)
        const putStub = sinon.stub(DynamoClient.prototype, 'put')
        putStub.resolves()

        await repository.put(dummy)

        process.env.DEBUG_DYNAMODB = 'true'

        const items = await repository.findAll({
            index: 'adjustmentGroupIdStatusIndex',
            where: {
                adjustmentGroupId: '1',
                adjustmentStatus: 'processed'
            }
        })

        expect(putStub.calledOnce).toBe(true)
        expect(queryStub.calledOnce).toBe(true)
        expect(items.length).toBe(1)
    })
    it('findAll index with sort key', async (): Promise<any> => {
        await open({
            entities: [Dummy],
            synchronize: true
        })
        const repository = getRepository(Dummy)

        const dummy = new Dummy()
        dummy.id = '123'
        dummy.name = 'some-dummy-name'
        dummy.adjustmentGroupId = '1'
        dummy.adjustmentStatus = 'processed'
        dummy.lineItemNumber = 1

        const results: any = {
            Items: [marshall(dummy, { convertClassInstanceToMap: true })]
        }

        const queryStub = sinon.stub(DynamoClient.prototype, 'query')
        queryStub.resolves(results)
        const putStub = sinon.stub(DynamoClient.prototype, 'put')
        putStub.resolves()

        await repository.put(dummy)

        const items = await repository.findAll({
            index: 'adjustmentGroupIdStatusIndex',
            where: {
                adjustmentGroupId: '1',
                adjustmentStatus: 'processed',
                lineItemNumber: 1
            }
        })

        expect(putStub.calledOnce).toBe(true)
        expect(queryStub.calledOnce).toBe(true)
        expect(items.length).toBe(1)
    })
    it('findAll index with complex sort key', async (): Promise<any> => {
        await open({
            entities: [Dummy],
            synchronize: true
        })
        const repository = getRepository(Dummy)

        const dummy = new Dummy()
        dummy.id = '123'
        dummy.name = 'some-dummy-name'
        dummy.adjustmentGroupId = '1'
        dummy.adjustmentStatus = 'processed'
        dummy.lineItemNumber = 1
        dummy.lineItemName = 'hours-worked'

        const results: any = {
            Items: [marshall(dummy, { convertClassInstanceToMap: true })]
        }

        const queryStub = sinon.stub(DynamoClient.prototype, 'query')
        queryStub.resolves(results)
        const putStub = sinon.stub(DynamoClient.prototype, 'put')
        putStub.resolves()

        await repository.put(dummy)

        const items = await repository.findAll({
            index: 'adjustmentGroupIdStatusIndex2',
            where: {
                adjustmentGroupId: '1',
                adjustmentStatus: 'processed',
                lineItemNumber: 1,
                lineItemName: 'hours-worked'
            }
        })

        expect(putStub.calledOnce).toBe(true)
        expect(queryStub.calledOnce).toBe(true)
        expect(items.length).toBe(1)
    })
    it('findAll index with complex sort single value', async (): Promise<any> => {
        await open({
            entities: [Dummy],
            synchronize: true
        })
        const repository = getRepository(Dummy)

        const dummy = new Dummy()
        dummy.id = '123'
        dummy.name = 'some-dummy-name'
        dummy.adjustmentGroupId = '1'
        dummy.adjustmentStatus = 'processed'
        dummy.lineItemNumber = 1

        const results: any = {
            Items: [marshall(dummy, { convertClassInstanceToMap: true })]
        }

        const queryStub = sinon.stub(DynamoClient.prototype, 'query')
        queryStub.resolves(results)
        const putStub = sinon.stub(DynamoClient.prototype, 'put')
        putStub.resolves()

        await repository.put(dummy)

        const items = await repository.findAll({
            index: 'adjustmentGroupIdStatusIndex2',
            where: {
                adjustmentGroupId: '1',
                adjustmentStatus: 'processed',
                lineItemNumber: 1
            }
        })

        expect(putStub.calledOnce).toBe(true)
        expect(queryStub.calledOnce).toBe(true)
        expect(items.length).toBe(1)
    })
    it('findAll index with complex sort single value (second value only)', async (): Promise<any> => {
        await open({
            entities: [Dummy],
            synchronize: true
        })
        const repository = getRepository(Dummy)

        const dummy = new Dummy()
        dummy.id = '123'
        dummy.name = 'some-dummy-name'
        dummy.adjustmentGroupId = '1'
        dummy.adjustmentStatus = 'processed'
        dummy.lineItemName = 'hours-worked'

        const results: any = {
            Items: [marshall(dummy, { convertClassInstanceToMap: true })]
        }

        const queryStub = sinon.stub(DynamoClient.prototype, 'query')
        queryStub.resolves(results)
        const putStub = sinon.stub(DynamoClient.prototype, 'put')
        putStub.resolves()

        await repository.put(dummy)

        const items = await repository.findAll({
            index: 'adjustmentGroupIdStatusIndex2',
            where: {
                adjustmentGroupId: '1',
                adjustmentStatus: 'processed',
                lineItemName: 'hours-worked'
            }
        })

        expect(putStub.calledOnce).toBe(true)
        expect(queryStub.calledOnce).toBe(true)
        expect(items.length).toBe(1)
    })
    it('scan', async (): Promise<any> => {
        await open({
            entities: [Dummy],
            synchronize: true
        })
        const repository = getRepository(Dummy)

        const dummy = new Dummy()
        dummy.id = '123'
        dummy.name = 'some-dummy-name'
        dummy.adjustmentGroupId = '1'
        dummy.adjustmentStatus = 'processed'

        const results: any = {
            Items: [marshall(dummy, { convertClassInstanceToMap: true })]
        }

        const getStub = sinon.stub(DynamoClient.prototype, 'scan')
        getStub.resolves(results)
        const putStub = sinon.stub(DynamoClient.prototype, 'put')
        putStub.resolves()

        await repository.put(dummy)

        const items = await repository.scan()

        expect(putStub.calledOnce).toBe(true)
        expect(getStub.calledOnce).toBe(true)
        expect(items.length).toBe(1)
    })
    it('updateExpression', async (): Promise<any> => {
        const createTableStub = sinon.stub(DynamoClient.prototype, 'createTable').resolves()
        const updateStub = sinon.stub(DynamoClient.prototype, 'update').resolves()

        await open({
            entities: [Dummy],
            synchronize: true
        })
        await getRepository(Dummy).updateExpression({
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
        expect(updateStub.calledWith(expected)).toBe(true)
    })

    it('updateExpression 2', async () => {
        const updateStub = sinon.stub(DynamoClient.prototype, 'update').resolves()

        await open({
            entities: [Dummy]
        })
        await getRepository(Dummy).updateExpression({
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
})
