/// <reference types="jest" />

import expect from 'expect'
import { FindOptions } from '../../src'
import { In } from 'typeorm'

describe('FindOptions', () => {
    it('uses distinct placeholders for repeated field values in OR filter expressions', () => {
        const options = new FindOptions()
        options.filter = "formId = 'licensing' or formId = 'els'"

        const filterExpression = FindOptions.toFilterExpression(options)
        const expressionAttributeValues = FindOptions.toExpressionAttributeValues(options)

        const placeholders = filterExpression?.match(/:[A-Za-z0-9_]+/g) || []
        const uniquePlaceholders = new Set(placeholders)
        const valueKeys = Object.keys(expressionAttributeValues || {})
        const marshalledValues = Object.values(expressionAttributeValues || {}).map((value: any) => value.S).sort()

        expect(placeholders.length).toBe(2)
        expect(uniquePlaceholders.size).toBe(2)
        expect(valueKeys.length).toBe(2)
        expect(marshalledValues).toEqual(['els', 'licensing'])
    })

    it('rejects TypeORM In operator in key condition expressions', () => {
        const options = new FindOptions()
        options.where = {
            formId: In(['licensing', 'els'])
        }

        expect(() => FindOptions.toKeyConditionExpression(options))
            .toThrow('Operator "in" not supported')
    })
})
