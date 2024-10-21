import { poundToUnderscore } from './DynamoTextHelper'
import { isNotEmpty } from './DynamoObjectHelper'
import { splitOperators } from '../parsers/property-parser'
import { isReservedKeyword } from './keyword-helper'

const containsToAttributeNames = (expression: string, attributeNames: any) => {
    if (expression && expression.toLowerCase().includes('contains(')) {
        const haystack = expression.replace(/^contains\(/gi, '').replace(/\)$/, '')
        const parts = haystack.split(',')
        if (parts.length === 2) {
            const name = parts[0].trim()
            attributeNames[`#${poundToUnderscore(name)}`] = name
        } else {
            throw Error(`Failed to parse contains to ExpressionAttributeNames: ${expression}`)
        }
    }
    return expression
}

export const dynamoAttributeHelper = {
    toAttributeNames (
        object: any,
        filter?: any,
        select?: any,
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
        if (filter) {
            attributeNames = attributeNames || {}
            const expressions = filter.split(/ and | or /gi).map((expression: string) => expression.trim())
            expressions.forEach((expression: string) => {
                expression = containsToAttributeNames(expression, attributeNames)
                if (!expression.toLowerCase().includes('contains(')) {
                    const parts = splitOperators(expression)
                    if (parts.length === 2) {
                        const name = parts[0].trim()
                        attributeNames[`#${poundToUnderscore(name)}`] = name
                    } else {
                        throw Error(`Failed to convert filter to ExpressionAttributeNames: ${filter}`)
                    }
                }
            })
        }
        if (select) {
            const names: string[] = select.split(',')
            names.forEach((name: string) => {
                const trimmedName = name.trim()
                if (isReservedKeyword(trimmedName)) {
                    attributeNames[`#${trimmedName}`] = trimmedName
                }
            })
        }
        return attributeNames
    }
}
