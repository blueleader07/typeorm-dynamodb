import {
    buildIndexDetails,
    buildTableDetails,
    findColumnDetails,
    findPrimaryColumn
} from '../helper/typeorm-table-metadata-helper'

export const typeormEntityHook = (entity: any) => {
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
    Object.defineProperty(entity, 'primaryColumn', {
        get (): any | undefined {
            return findPrimaryColumn(entity.name)
        }
    })
}
