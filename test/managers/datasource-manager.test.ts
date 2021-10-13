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
    it('insertOne', async (): Promise<any> => {
        await datasourceManager.open({ entities: [DummyEntity] })
        const repository = await datasourceManager.getCustomRepository(DummyRepository)
        const dummyEntity: any = new DummyEntity()
        dummyEntity.id = '456'
        dummyEntity.bla = '456'
        await repository.insertOne(dummyEntity)
        const result = await repository.findOne('456')
        expect(result).not.toBe(undefined)
    })
})
