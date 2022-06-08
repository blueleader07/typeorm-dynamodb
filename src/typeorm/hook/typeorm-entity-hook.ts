import {
    buildIndexDetails,
    buildTableDetails,
    findColumnDetails, findPrimaryColumn,
    findTableName
} from '../helper/typeorm-table-metadata-helper'

export const typeormEntityHook = (entity: any) => {
    const tableName = findTableName(entity.name)
    Object.defineProperty(entity, 'tableDetails', {
        get (): any | undefined {
            return buildTableDetails(tableName)
        }
    })
    Object.defineProperty(entity, 'columnDetails', {
        get (): any[] | undefined {
            return findColumnDetails(tableName)
        }
    })
    Object.defineProperty(entity, 'indexDetails', {
        get (): any[] | undefined {
            return buildIndexDetails(tableName)
        }
    })
    Object.defineProperty(entity, 'primaryColumn', {
        get (): any | undefined {
            return findPrimaryColumn(entity.name)
        }
    })
}
