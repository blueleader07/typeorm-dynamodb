import { dynamoAttributeHelper } from '../helpers/DynamoAttributeHelper'
import { poundToUnderscore } from '../helpers/DynamoTextHelper'
import { isNotEmpty } from '../helpers/DynamoObjectHelper'
import { marshall } from '@aws-sdk/util-dynamodb'
import { FindOperator } from 'typeorm'
import { splitOperators } from '../parsers/property-parser'
import { isReservedKeyword } from '../helpers/keyword-helper'
import { commonUtils } from '../utils/common-utils'

export const BeginsWith = (value: string) =>
    new FindOperator('beginsWith' as any, value)

const operators: Record<
    string,
    (property: string, value: string, operator: any) => string
> = {
    and: (property, value, operator) =>
        operator.value.map((operator: any, i: number) =>
            operators[operator.type](property, `${value}${i}`, operator)
        ).join(' and '),
    lessThan: (property, value) => `${property} < ${value}`,
    lessThanOrEqual: (property, value) => `${property} <= ${value}`,
    moreThan: (property, value) => `${property} > ${value}`,
    moreThanOrEqual: (property, value) => `${property} >= ${value}`,
    equal: (property, value) => `${property} = ${value}`,
    between: (property, value) => `${property} BETWEEN ${value[0]} AND ${value[1]}`,
    beginsWith: (property, value) => `begins_with(${property}, ${value})`
}

const removeLeadingAndTrailingQuotes = (text: string) => {
    return text.replace(/(^['"]|['"]$)/g, '')
}

const containsToFilterExpression = (expression: string) => {
    if (expression && expression.toLowerCase().includes('contains(')) {
        const haystack = expression.replace(/^contains\(/gi, '').replace(/\)$/, '')
        const parts = haystack.split(',')
        if (parts.length === 2) {
            const name = parts[0].trim()
            const value = parts[1].trim()
            const re = new RegExp(`${name}(?=(?:(?:[^']*'){2})*[^']*$)`)
            let newExpression = haystack.replace(re, `#${poundToUnderscore(name)}`)
            newExpression = newExpression.replace(value, `:${poundToUnderscore(name)}`)
            return `contains(${newExpression})`
        } else {
            throw Error(`Failed to parse contains to ExpressionAttributeNames: ${expression}`)
        }
    }
    return expression
}

const containsToAttributeValues = (expression: string, values: any) => {
    if (expression && expression.toLowerCase().includes('contains(')) {
        const haystack = expression.replace(/^contains\(/gi, '').replace(/\)$/, '')
        const parts = haystack.split(',')
        if (parts.length === 2) {
            const name = parts[0].trim()
            const value = parts[1].trim().replace(/'/g, '')
            values[`:${poundToUnderscore(name)}`] = marshall(removeLeadingAndTrailingQuotes(value))
        } else {
            throw Error(`Failed to parse contains to ExpressionAttributeNames: ${expression}`)
        }
    }
    return expression
}

export class FindOptions {
    index?: string
    where?: any
    limit?: number
    sort?: string
    exclusiveStartKey?: string
    filter?: string;
    select?: string;

    static toAttributeNames (findOptions: FindOptions) {
        return dynamoAttributeHelper.toAttributeNames(findOptions.where, findOptions.filter, findOptions.select)
    }

    static toKeyConditionExpression (findOptions: FindOptions) {
        if (isNotEmpty(findOptions.where)) {
            const keys = Object.keys(findOptions.where)
            const values = []
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i]
                const attribute = poundToUnderscore(key)
                if (findOptions.where[key] instanceof FindOperator) {
                    if (operators[findOptions.where[key].type]) {
                        values.push(
                            operators[findOptions.where[key].type](
                                `#${attribute}`,
                                `:${attribute}`,
                                findOptions.where[key]
                            )
                        )
                    } else {
                        throw new Error(
                            `Operator "${findOptions.where[key].type}" not supported`
                        )
                    }
                } else {
                    values.push(`#${attribute} = :${attribute}`)
                }
            }
            return values.join(' and ')
        }
        return undefined
    }

    static toExpressionAttributeValues (findOptions: FindOptions) {
        const values: any = {}
        if (isNotEmpty(findOptions.where)) {
            const keys = Object.keys(findOptions.where)
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i]
                if (findOptions.where[key] instanceof FindOperator) {
                    if (findOptions.where[key].type === 'and') {
                        findOptions.where[key].value.forEach(
                            (operator: any, i: number) => {
                                values[`:${poundToUnderscore(key)}${i}`] =
                                    marshall(operator.value)
                            }
                        )
                    } else {
                        values[`:${poundToUnderscore(key)}`] =
                            marshall(findOptions.where[key].value)
                    }
                } else {
                    values[`:${poundToUnderscore(key)}`] =
                        marshall(findOptions.where[key])
                }
            }
        }
        if (findOptions.filter) {
            const expressions = findOptions.filter.split(/ and | or /gi).map(expression => expression.trim())
            expressions.forEach(expression => {
                expression = containsToAttributeValues(expression, values)
                if (!expression.toLowerCase().includes('contains(')) {
                    const parts = splitOperators(expression)
                    if (parts.length === 2) {
                        const name = parts[0].trim()
                        const value = parts[1].trim()
                        values[`:${poundToUnderscore(name)}`] = marshall(removeLeadingAndTrailingQuotes(value))
                    } else {
                        throw Error(`Failed to convert filter to ExpressionAttributeValues: ${findOptions.filter}`)
                    }
                }
            })
        }
        return commonUtils.isNotEmpty(values) ? values : undefined
    }

    static toFilterExpression (options: FindOptions) {
        if (options.filter) {
            const expressions = options.filter.split(/ and | or /gi) // Split by AND/OR
            const connectors = options.filter.match(/ and | or /gi) || [] // Extract AND/OR operators
            const processedExpressions = expressions.map(expression => {
                let processedExpression = containsToFilterExpression(expression.trim())
                if (!expression.toLowerCase().includes('contains(')) {
                    const parts = splitOperators(expression.trim())
                    if (parts.length === 2) {
                        const name = parts[0].trim()
                        const value = parts[1].trim()
                        if (value.startsWith("'")) {
                            const re = new RegExp(`${name}(?=(?:(?:[^']*'){2})*[^']*$)`)
                            processedExpression = processedExpression.replace(re, `#${poundToUnderscore(name)}`)
                        } else if (value.startsWith('"')) {
                            const re = new RegExp(`${name}(?=(?:(?:[^"]*"){2})*[^"]*$)`)
                            processedExpression = processedExpression.replace(re, `#${poundToUnderscore(name)}`)
                        }
                        processedExpression = processedExpression.replace(value, `:${poundToUnderscore(name)}`)
                        processedExpression = processedExpression.replace(/['"]/g, '')
                    } else {
                        throw Error(`Failed to convert filter to ExpressionAttributeValues: ${options.filter}`)
                    }
                }
                return processedExpression
            })

            // Combine processed expressions
            let finalFilterExpression = processedExpressions[0]
            for (let i = 1; i < processedExpressions.length; i++) {
                finalFilterExpression += ` ${connectors[i - 1].trim()} ${processedExpressions[i]}`
            }

            return finalFilterExpression
        }
        return undefined
    }

    static toProjectionExpression (options: FindOptions) {
        if (options.select) {
            const names = options.select.split(',')
            const safeNames: string[] = []
            names.forEach((name) => {
                const trimmedName = name.trim()
                if (isReservedKeyword(trimmedName)) {
                    safeNames.push(`#${trimmedName}`)
                } else {
                    safeNames.push(trimmedName)
                }
            })
            return safeNames.join(',')
        }
        return undefined
    }
}
