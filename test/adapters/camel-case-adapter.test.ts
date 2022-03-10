import expect from 'expect'
import { camelCaseAdapter } from '../../src/adapters/camel-case-adapter'

describe('camel-case-adapter', () => {
    describe('convert', () => {
        it('empty', () => {
            /** Given: "" **/
            const input = ''

            /** When: convert is called **/
            const output = camelCaseAdapter.convert(input)

            /** Then: output = "" **/
            expect(output).toBe('')
        })

        it('CREATED_BY', () => {
            /** Given: "" **/
            const input = 'CREATED_BY'

            /** When: convert is called **/
            const output = camelCaseAdapter.convert(input)

            /** Then: output = "" **/
            expect(output).toBe('createdBy')
        })
    })
})
