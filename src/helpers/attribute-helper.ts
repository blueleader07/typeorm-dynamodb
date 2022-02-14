import { commonUtils } from '@lmig/legal-nodejs-utils'
import { BeginsWith } from '../models/find-options'

export const attributeHelper = {

    toAttributeNames (object: any, beginsWith?: BeginsWith, attributeNames?: any) {
        if (commonUtils.isNotEmpty(object)) {
            attributeNames = attributeNames || {}
            const keys = Object.keys(object)
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i]
                attributeNames[`#${key}`] = key
            }
        }
        if (beginsWith) {
            attributeNames[`#${beginsWith.attribute}`] = beginsWith.attribute
        }
        return attributeNames
    }

}
