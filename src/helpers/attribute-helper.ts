import { commonUtils } from '@lmig/legal-nodejs-utils'

export const attributeHelper = {

    toAttributeNames (object: any, attributeNames?: any) {
        if (commonUtils.isNotEmpty(object)) {
            attributeNames = attributeNames || {}
            const keys = Object.keys(object)
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i]
                attributeNames[`#${key}`] = key
            }
            return attributeNames
        }
        return undefined
    }

}
