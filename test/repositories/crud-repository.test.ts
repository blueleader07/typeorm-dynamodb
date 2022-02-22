import expect from 'expect'
import { DummyRepository } from './dummy-repository'
import { datasourceManager } from '../../src'
import { Dummy } from '../entities/dummy'
import { PlatformTools } from 'typeorm/platform/PlatformTools'
import sinon from 'sinon'

describe('crud-repository', () => {
    it('select', async (): Promise<any> => {
        expect(1).toBe(1)
    })
    it('updateExpression', async (): Promise<any> => {
        const AWS = PlatformTools.load('aws-sdk')
        const stub = sinon.stub(AWS.DynamoDB.DocumentClient.prototype, 'update').returns({
            promise: () => {
                return Promise.resolve()
            }
        })

        await datasourceManager.open({
            entities: [Dummy]
        })
        const repository = datasourceManager.getCustomRepository(DummyRepository)
        await repository.updateExpression({
            type: 'SET',
            where: {
                invoiceId: 123
            },
            values: {
                status: 'failed',
                error: 'some error occurred',
                invoiceIdAndStatus: '123-failed'
            }
        })

        expect(stub.calledWith({
            TableName: 'dummy_t',
            Key: { invoiceId: 123 },
            UpdateExpression: 'SET #status :status, #error :error, #invoiceIdAndStatus :invoiceIdAndStatus',
            ExpressionAttributeNames: {
                '#status': 'status',
                '#error': 'error',
                '#invoiceIdAndStatus': 'invoiceIdAndStatus'
            },
            ExpressionAttributeValues: {
                ':status': 'failed',
                ':error': 'some error occurred',
                ':invoiceIdAndStatus': '123-failed'
            }
        })).toBe(true)
    })
})
