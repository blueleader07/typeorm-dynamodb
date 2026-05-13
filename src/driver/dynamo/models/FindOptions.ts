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

const nextPlaceholder = (name: string, counters: Record<string, number>) => {
    const base = `:${poundToUnderscore(name)}`
    counters[base] = (counters[base] || 0) + 1
    return counters[base] === 1 ? base : `${base}_${counters[base]}`
}

const containsToFilterExpression = (expression: string, placeholder?: string) => {
    if (expression && expression.toLowerCase().includes('contains(')) {
        const haystack = expression.replace(/^contains\(/gi, '').replace(/\)$/, '')
        const parts = haystack.split(',')
        if (parts.length === 2) {
            const name = parts[0].trim()
            const value = parts[1].trim()
            const valuePlaceholder = placeholder || `:${poundToUnderscore(name)}`
            const re = new RegExp(`${name}(?=(?:(?:[^']*'){2})*[^']*$)`)
            let newExpression = haystack.replace(re, `#${poundToUnderscore(name)}`)
            newExpression = newExpression.replace(value, valuePlaceholder)
            return `contains(${newExpression})`
        } else {
            throw Error(`Failed to parse contains to ExpressionAttributeNames: ${expression}`)
        }
    }
    return expression
}

const containsToAttributeValues = (expression: string, values: any, placeholder?: string) => {
    if (expression && expression.toLowerCase().includes('contains(')) {
        const haystack = expression.replace(/^contains\(/gi, '').replace(/\)$/, '')
        const parts = haystack.split(',')
        if (parts.length === 2) {
            const name = parts[0].trim()
            const value = parts[1].trim().replace(/'/g, '')
            const valuePlaceholder = placeholder || `:${poundToUnderscore(name)}`
            values[valuePlaceholder] = marshall(removeLeadingAndTrailingQuotes(value))
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
            const filterPlaceholderCounters: Record<string, number> = {}
            const expressions = findOptions.filter.split(/ and | or /gi).map(expression => expression.trim())
            expressions.forEach(expression => {
                const placeholder = nextPlaceholder(
                    expression.toLowerCase().includes('contains(')
                        ? expression.replace(/^contains\(/i, '').split(',')[0].trim()
                        : splitOperators(expression)[0].trim(),
                    filterPlaceholderCounters
                )
                expression = containsToAttributeValues(expression, values, placeholder)
                if (!expression.toLowerCase().includes('contains(')) {
                    const parts = splitOperators(expression)
                    if (parts.length === 2) {
                        const value = parts[1].trim()
                        values[placeholder] = marshall(removeLeadingAndTrailingQuotes(value))
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
            const filterPlaceholderCounters: Record<string, number> = {}
            const expressions = options.filter.split(/ and | or /gi) // Split by AND/OR
            const connectors = options.filter.match(/ and | or /gi) || [] // Extract AND/OR operators
            const processedExpressions = expressions.map(expression => {
                const trimmedExpression = expression.trim()
                let placeholderName = ''
                if (trimmedExpression.toLowerCase().includes('contains(')) {
                    placeholderName = trimmedExpression.replace(/^contains\(/i, '').split(',')[0].trim()
                } else {
                    const parts = splitOperators(trimmedExpression)
                    if (parts.length === 2) {
                        placeholderName = parts[0].trim()
                    } else {
                        throw Error(`Failed to convert filter to ExpressionAttributeValues: ${options.filter}`)
                    }
                }
                const placeholder = nextPlaceholder(placeholderName, filterPlaceholderCounters)
                let processedExpression = containsToFilterExpression(trimmedExpression, placeholder)
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
                        processedExpression = processedExpression.replace(value, placeholder)
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
