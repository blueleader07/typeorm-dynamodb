import { attributeHelper } from '../helpers/attribute-helper'

export class UpdateOptions {
    type: 'ADD' | 'DELETE' | 'REMOVE' | 'SET' // ADD,DELETE,REMOVE,SET
    values: any
    where: any

    static toAttributeNames (updateOptions: UpdateOptions) {
        const attributeNames: any = {}
        attributeHelper.toAttributeNames(updateOptions.values, attributeNames)
        attributeHelper.toAttributeNames(updateOptions.values, attributeNames)
        return attributeNames
    }

    static toExpressionAttributeValues (updateOptions: UpdateOptions) {
        const keys = Object.keys(updateOptions.values)
        const values: any = {}
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i]
            values[`:${key}`] = updateOptions.values[key]
        }
        return values
    }

    static toUpdateExpression (options: UpdateOptions) {
        const values = Object.keys(options.values).map(key => {
            return `#${key} :${key}`
        }).join(', ')
        return `${options.type} ${values}`
    }
}
