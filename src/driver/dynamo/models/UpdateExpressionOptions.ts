import { dynamoAttributeHelper } from '../helpers/DynamoAttributeHelper'
import { mixin } from '../helpers/DynamoObjectHelper'

export enum UpdateExpressionType {
    // eslint-disable-next-line no-unused-vars
    ADD = 'ADD',
    // eslint-disable-next-line no-unused-vars
    DELETE = 'DELETE',
    // eslint-disable-next-line no-unused-vars
    REMOVE = 'REMOVE',
    // eslint-disable-next-line no-unused-vars
    SET = 'SET',
}

export class UpdateExpressionOptions {
    addValues?: any
    setValues?: any
    where: any

    static toAttributeNames (options: UpdateExpressionOptions) {
        const values = mixin(options.addValues || {}, options.setValues || {})
        return dynamoAttributeHelper.toAttributeNames(values)
    }

    static toExpressionAttributeValues (options: UpdateExpressionOptions) {
        const optionValues = mixin(
            options.addValues || {},
            options.setValues || {}
        )
        const keys = Object.keys(optionValues)
        const values: any = {}
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i]
            const value = optionValues[key]
            if (value !== undefined) {
                const attributeName = key.replace(/#/g, '_')
                values[`:${attributeName}`] = optionValues[key]
            }
        }
        return values
    }

    static toUpdateExpression (options: UpdateExpressionOptions) {
        const setExpression = this._toUpdateExpression(
            options.setValues,
            UpdateExpressionType.SET
        )
        const addExpression = this._toUpdateExpression(
            options.addValues,
            UpdateExpressionType.ADD
        )
        return `${setExpression} ${addExpression}`.trim()
    }

    static _toUpdateExpression (values: any, type: UpdateExpressionType) {
        if (values) {
            const commonSeparatedValues = Object.keys(values)
                .filter((key: string) => {
                    return values[key] !== undefined
                })
                .map((key) => {
                    const attributeName = key.replace(/#/g, '_')
                    switch (type) {
                    case UpdateExpressionType.ADD:
                        return `#${attributeName} :${attributeName}`
                    case UpdateExpressionType.SET:
                        return `#${attributeName} = :${attributeName}`
                    default:
                        throw new Error(
                            `update type is not supported yet: ${type}`
                        )
                    }
                })
                .join(', ')
            const commaSeparatedRemoves = Object.keys(values)
                .filter((key: string) => {
                    return values[key] === undefined
                })
                .map((key) => {
                    const attributeName = key.replace(/#/g, '_')
                    return `${attributeName}`
                })
                .join(', ')
            const removeStatement = commaSeparatedRemoves.length > 0 ? ` REMOVE ${commaSeparatedRemoves}` : ''
            return `${type} ${commonSeparatedValues}${removeStatement}`
        }
        return ''
    }
}
