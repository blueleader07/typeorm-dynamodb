import expect from 'expect'
import { typeormEntityHook } from '../../src/typeorm/hook/typeorm-entity-hook'
import { Dummy } from '../entities/dummy'
import { parseAnnotations } from '../../src/parsers/annotation-parser'
import { readFileSync } from 'fs'

describe('typeorm-entity-hook', () => {
    it('happy path', async (): Promise<any> => {
        const dummy: any = Dummy
        /** when: **/
        typeormEntityHook(dummy)

        // Bob, does this get you what you need?  It's string parsing the annotations .. completely separate of Typeorm ...
        // I originally wrote it for the hibernate-to-typeorm-converter...
        // what if we put this in a typeorm-cdk library
        const file = readFileSync('./test/entities/dummy.ts').toString('utf-8')
        const entityAnnotation = parseAnnotations(file, 'Entity')
        const globalSecondaryIndexes = parseAnnotations(file, 'GlobalSecondaryIndex')

        /** then: **/
        expect(dummy.tableDetails).toBeDefined()
        expect(dummy.indexDetails.length).toBe(1)
    })
})
