import { buildIndexDetails, buildTableDetails, findColumnDetails } from '../typeorm/helper/typeorm-table-metadata-helper'

/**
 * Adds database table metadata to entity.
 * Can be used on entity.
 */
export function DynamodbEntity (): ClassDecorator {
    return function (entity: any) {
        Object.defineProperty(entity, 'tableDetails', {
            get (): any | undefined {
                return buildTableDetails(entity.name)
            }
        })
        Object.defineProperty(entity, 'columnDetails', {
            get (): any[] | undefined {
                return findColumnDetails(entity.name)
            }
        })
        Object.defineProperty(entity, 'indexDetails', {
            get (): any[] | undefined {
                return buildIndexDetails(entity.name)
            }
        })
    }
}
