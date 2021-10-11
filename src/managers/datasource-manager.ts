import { ObjectType } from 'typeorm/common/ObjectType'
import { EntitySchema } from 'typeorm/entity-schema/EntitySchema'
import {
    initializeTransactionalContext,
    patchTypeORMRepositoryWithBaseRepository
} from 'typeorm-transactional-cls-hooked'

initializeTransactionalContext()
patchTypeORMRepositoryWithBaseRepository()

let entities: any[]

export class DatasourceManagerOptions {
    entities?: ((Function | string | EntitySchema))[];
}

export const datasourceManager = {
    async open (options: DatasourceManagerOptions) {
        // not necessary (yet).  perhaps when typeorm adds dynamodb.
        entities = options.entities || []
    },

    async getConnection () {
        return {
            async synchronize () {
                // should create tables from entities
                for (let i = 0; i < entities.length; i++) {
                    const entity = entities[i]
                    console.log('entity loaded', entity)
                }
            }
        }
    },

    getCustomRepository<T> (customRepository: ObjectType<T>): T {
        return new (customRepository as any)()
    }
}
