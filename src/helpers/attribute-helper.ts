import { commonUtils } from '@lmig/legal-nodejs-utils'

export const attributeHelper = {

    toAttributeNames (object: any, beginsWith?: any, attributeNames?: any) {
        attributeNames = attributeNames || {}
        const keys = Object.keys(object)
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i]
            attributeNames[`#${key}`] = key
        }
        if (commonUtils.isNotEmpty(beginsWith)) {
            attributeNames[`#${beginsWith.attribute}`] = beginsWith.attribute
        }
        return attributeNames
    }

}
