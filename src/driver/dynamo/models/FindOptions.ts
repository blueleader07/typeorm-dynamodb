import { dynamoAttributeHelper } from '../helpers/DynamoAttributeHelper'
import { poundToUnderscore } from '../helpers/DynamoTextHelper'
import { isNotEmpty } from '../helpers/DynamoObjectHelper'
import { marshall } from '@aws-sdk/util-dynamodb'
import { FindOperator } from 'typeorm'

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

export class FindOptions {
    index?: string
    where?: any
    limit?: number
    sort?: string
    exclusiveStartKey?: string

    static toAttributeNames (findOptions: FindOptions) {
        return dynamoAttributeHelper.toAttributeNames(findOptions.where)
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
        if (isNotEmpty(findOptions.where)) {
            const keys = Object.keys(findOptions.where)
            const values: any = {}
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
            return values
        }
        return undefined
    }
}
