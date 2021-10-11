import { ObjectType } from 'typeorm/common/ObjectType'
import { EntitySchema } from 'typeorm/entity-schema/EntitySchema'
import {
    initializeTransactionalContext,
    patchTypeORMRepositoryWithBaseRepository
} from 'typeorm-transactional-cls-hooked'

initializeTransactionalContext()
patchTypeORMRepositoryWithBaseRepository()

export class DatasourceManagerOptions {
    entities?: ((Function | string | EntitySchema))[];
}

export const datasourceManager = {

    getCustomRepository<T> (customRepository: ObjectType<T>): T {
        return new (customRepository as any)()
    }

}
