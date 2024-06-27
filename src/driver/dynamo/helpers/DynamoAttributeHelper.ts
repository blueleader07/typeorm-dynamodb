import { poundToUnderscore } from './DynamoTextHelper'
import { isNotEmpty } from './DynamoObjectHelper'

export const dynamoAttributeHelper = {
    toAttributeNames (
        object: any,
        attributeNames?: any
    ) {
        if (isNotEmpty(object)) {
            attributeNames = attributeNames || {}
            const keys = Object.keys(object)
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i]
                attributeNames[`#${poundToUnderscore(key)}`] = key
            }
        }
        return attributeNames
    }
}
