import expect from 'expect'
import { datasourceManager } from '../../src/managers/datasource-manager'
import { BaseEntity, Entity, EntityRepository, PrimaryColumn } from 'typeorm'
import { PagingAndSortingRepository } from '../../src'

@Entity({ name: 'dummy_t' })
class DummyEntity extends BaseEntity {
    @PrimaryColumn({ name: 'id', type: 'varchar' })
    id: string
}

@EntityRepository(DummyEntity)
class DummyRepository extends PagingAndSortingRepository<DummyEntity> {

}

describe('datasource-manager', () => {
    it('getCustomRepository', async (): Promise<any> => {
        await datasourceManager.open({ entities: [DummyEntity] })
        const repository = await datasourceManager.getCustomRepository(DummyRepository)
        expect(repository).not.toBe(undefined)
    })
})
