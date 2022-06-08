import { typeormEntityHook } from '../typeorm/hook/typeorm-entity-hook'

/**
 * Adds database table metadata to entity.
 * Can be used on entity.
 */
export function DynamoDbEntity (): ClassDecorator {
    return function (entity: any) {
        typeormEntityHook(entity)
    }
}
