import { EntityRepository } from 'typeorm'
import { PagingAndSortingRepository } from '../../src'
import { Dummy } from '../entities/dummy'

@EntityRepository(Dummy)
export class DummyRepository extends PagingAndSortingRepository<Dummy> {

}
