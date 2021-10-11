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
    async open () {
        // not necessary (yet).  perhaps when typeorm adds dynamodb.
    },

    async getConnection () {
        return {
            async synchronize () {
                // should create tables from entities
            }
        }
    },

    getCustomRepository<T> (customRepository: ObjectType<T>): T {
        return new (customRepository as any)()
    }
}
