import expect from 'expect'
import { DummyRepository } from './dummy-repository'
import { datasourceManager, DynamoClient } from '../../src'
import { Dummy } from '../entities/dummy'
import sinon from 'sinon'

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
})
