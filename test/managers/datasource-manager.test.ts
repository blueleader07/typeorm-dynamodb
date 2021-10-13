import expect from 'expect'
import { datasourceManager } from '../../src/managers/datasource-manager'
import { BaseEntity, Entity, EntityRepository, PrimaryColumn } from 'typeorm'
import { PagingAndSortingRepository } from '../../src'
import AWS from 'aws-sdk'

@Entity({ name: 'dummy_t' })
class DummyEntity extends BaseEntity {
    @PrimaryColumn({ name: 'id', type: 'varchar' })
    id: string
}

@EntityRepository(DummyEntity)
class DummyRepository extends PagingAndSortingRepository<DummyEntity> {

}

AWS.config.update({
    region: 'us-east-1',
    // @ts-ignore
    endpoint: 'http://localhost:4566'
})

describe('datasource-manager', () => {
    it('create', async (): Promise<any> => {
        const connection = await datasourceManager.open({ entities: [DummyEntity] })
        await connection.synchronize()
        expect(true).toBe(true)
    })
    it('insert and delete', async (): Promise<any> => {
        await datasourceManager.open({ entities: [DummyEntity] })
        const repository = await datasourceManager.getCustomRepository(DummyRepository)
        const dummyEntity: any = new DummyEntity()
        dummyEntity.id = '456'
        dummyEntity.bla = '456'
        await repository.put(dummyEntity)
        const result = await repository.findOne('456')
        expect(result).not.toBe(undefined)
        await repository.deleteOne({ id: '456' })
        const result2 = await repository.findOne('456')
        expect(result2).toBe(undefined)
    })
    it('insert and delete many', async (): Promise<any> => {
        await datasourceManager.open({ entities: [DummyEntity] })
        const repository = await datasourceManager.getCustomRepository(DummyRepository)
        const dummyEntity1: any = new DummyEntity()
        dummyEntity1.id = '123'
        dummyEntity1.bla = '123'
        const dummyEntity2: any = new DummyEntity()
        dummyEntity2.id = '456'
        dummyEntity2.bla = '456'
        await repository.put([dummyEntity1, dummyEntity2])
        const result1 = await repository.findOne('123')
        expect(result1).not.toBe(undefined)
        const result2 = await repository.findOne('456')
        expect(result2).not.toBe(undefined)
        await repository.deleteMany([{ id: '123' }, { id: '456' }])
        // const result3 = await repository.findOne('123')
        // expect(result3).toBe(undefined)
        // const result4 = await repository.findOne('456')
        // expect(result4).toBe(undefined)
    })
})
