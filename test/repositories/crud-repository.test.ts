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
    it('updateMany', async (): Promise<any> => {
        const AWS = PlatformTools.load('aws-sdk')
        const stub = sinon.stub(AWS.DynamoDB.DocumentClient.prototype, 'update').resolves()

        await datasourceManager.open({
            entities: [Dummy]
        })
        const repository = datasourceManager.getCustomRepository(DummyRepository)
        repository.updateMany({
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

        })).toBe(true)
    })
})
