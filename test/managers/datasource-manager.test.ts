import expect from 'expect'
import { datasourceManager } from '../../src'
import sinon from 'sinon'
import { PlatformTools } from 'typeorm/platform/PlatformTools'
import { Dummy } from '../entities/dummy'
import { DummyRepository } from '../repositories/dummy-repository'
import { AddOptions } from '../../src/models/add-options'
import { MockEntityManager } from '../mocks/mock-typeorm'
// import { environmentUtils } from '@lmig/legal-nodejs-utils'

describe('datasource-manager', () => {
    beforeEach(async () => {
        await MockEntityManager()
        const AWS = PlatformTools.load('aws-sdk')
        AWS.config.update({
            region: 'us-east-1',
            // @ts-ignore
            endpoint: 'http://localhost:4566'
        })
    })
    afterEach(() => {
        sinon.restore()
    })
    it('create', async (): Promise<any> => {
        // const connection = await datasourceManager.open({ entities: [Dummy] })
        // await connection.synchronize(true)
        // // let's make sure we don't choke when it already exists
        // await connection.synchronize()
        //
        // const repository = await datasourceManager.getCustomRepository(DummyRepository)
        // const dummy = new Dummy()
        // dummy.id = '456'
        // dummy.name = 'dummy'
        // dummy.adjustmentGroupId = '123'
        // dummy.adjustmentStatus = 'staged'
        // dummy.lineItemNumber = 7
        // await repository.put(dummy)
        //
        // environmentUtils.setVariable('DEBUG_DYNAMODB', 'true')
        //
        // const result = await repository.find({
        //     index: 'adjustmentGroupIdStatusIndex',
        //     where: {
        //         adjustmentGroupId: '123',
        //         adjustmentStatus: 'staged'
        //     }
        // })
        //
        // console.log('results', result)

        expect(true).toBe(true)
    }, 30000)

    it('insert and delete', async (): Promise<any> => {
        sinon.stub(DummyRepository.prototype, 'put').resolves()
        sinon.stub(DummyRepository.prototype, 'deleteOne').resolves()
        const findStub = sinon.stub(DummyRepository.prototype, 'findOne')
        findStub.onFirstCall().resolves({ id: '123', name: 'dummy' } as any)
        findStub.onSecondCall().resolves(undefined)
        const connection = await datasourceManager.open({ entities: [Dummy] })
        await connection.synchronize()
        const repository = await datasourceManager.getCustomRepository(DummyRepository)
        const dummy = new Dummy()
        dummy.id = '456'
        dummy.name = 'dummy'
        await repository.put(dummy)
        const result = await repository.findOne('456')
        expect(result).not.toBe(undefined)
        await repository.deleteOne({ id: '456' })
        const result2 = await repository.findOne('456')
        expect(result2).toBe(undefined)
    }, 30000)

    it('insert and delete many', async (): Promise<any> => {
        sinon.stub(DummyRepository.prototype, 'put').resolves()
        sinon.stub(DummyRepository.prototype, 'deleteMany').resolves()
        const findStub = sinon.stub(DummyRepository.prototype, 'findOne')
        findStub.onFirstCall().resolves({ id: '123', name: 'dummy1' } as any)
        findStub.onSecondCall().resolves({ id: '456', name: 'dummy2' } as any)
        const connection = await datasourceManager.open({ entities: [Dummy] })
        await connection.synchronize()
        const repository = await datasourceManager.getCustomRepository(DummyRepository)
        const dummy1 = new Dummy()
        dummy1.id = '123'
        dummy1.name = 'dummy1'
        const dummy2 = new Dummy()
        dummy2.id = '456'
        dummy2.name = 'dummy2'
        await repository.put([dummy1, dummy2])
        const result1 = await repository.findOne('123')
        expect(result1).not.toBe(undefined)
        const result2 = await repository.findOne('456')
        expect(result2).not.toBe(undefined)
        await repository.deleteMany([{ id: '123' }, { id: '456' }])
    }, 30000)

    it('add', async (): Promise<any> => {
        sinon.stub(DummyRepository.prototype, 'add').resolves()
        const connection = await datasourceManager.open({ entities: [Dummy] })
        await connection.synchronize()
        const repository = await datasourceManager.getCustomRepository(DummyRepository)
        const options = new AddOptions()
        options.values = {
            total: 100
        }
        options.where = {
            executionId: '123'
        }
        await repository.add(options)
    }, 30000)
})
