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

    it('supports parenthesized OR group combined with AND in filters', () => {
        const options = new FindOptions()
        options.filter = "(formId = 'form-alpha' or formId = 'form-beta') and status = 'OPEN'"

        const filterExpression = FindOptions.toFilterExpression(options)
        const expressionAttributeValues = FindOptions.toExpressionAttributeValues(options)

        expect(filterExpression).toBe('(#formId = :formId or #formId = :formId_2) and #status = :status')
        expect(expressionAttributeValues).toEqual({
            ':formId': { S: 'form-alpha' },
            ':formId_2': { S: 'form-beta' },
            ':status': { S: 'OPEN' }
        })
    })

    it('supports multiple parenthesized OR groups joined by AND', () => {
        const options = new FindOptions()
        options.filter = "(formId = 'form-alpha' or formId = 'form-beta') and (status = 'OPEN' or status = 'REVIEW')"

        const filterExpression = FindOptions.toFilterExpression(options)
        const expressionAttributeValues = FindOptions.toExpressionAttributeValues(options)

        expect(filterExpression).toBe('(#formId = :formId or #formId = :formId_2) and (#status = :status or #status = :status_2)')
        expect(expressionAttributeValues).toEqual({
            ':formId': { S: 'form-alpha' },
            ':formId_2': { S: 'form-beta' },
            ':status': { S: 'OPEN' },
            ':status_2': { S: 'REVIEW' }
        })
    })
})
