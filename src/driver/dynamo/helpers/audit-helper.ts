import { commonUtils } from '../utils/common-utils'
import { User } from '../models/User'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)

export const auditHelper = {

    audit (entity: any, user: any): any {
        user = User.parse({ user })
        const now = dayjs().utc().format()
        if (!entity.created) {
            entity.created = entity.created || now
        }
        if (!entity.createdBy) {
            entity.createdBy = user.id
        }
        if (!entity.createdByDisplayName) {
            entity.createdByDisplayName = user.name
        }
        entity.modifiedBy = user.id
        entity.modifiedByDisplayName = user.name
        entity.modified = now
        if (commonUtils.isEmpty(entity.deleted)) {
            entity.deleted = false
        }
        return entity
    },

    mixin (target: any, source: any) {
        if (!target.createdBy) {
            target.createdBy = source.createdBy
        }
        if (!target.createdByDisplayName) {
            target.createdByDisplayName = source.createdByDisplayName
        }
        if (!target.created) {
            target.created = source.created
        }
        target.modifiedBy = source.modifiedBy
        target.modifiedByDisplayName = source.modifiedByDisplayName
        target.modified = source.modified
        target.deleted = source.deleted
        return target
    },

    update (target: any, source: any) {
        target.modifiedBy = source.modifiedBy
        target.modifiedByDisplayName = source.modifiedByDisplayName
        target.modified = source.modified
        target.deleted = source.deleted
        target.deletedDate = source.deletedDate
        return target
    }

}
