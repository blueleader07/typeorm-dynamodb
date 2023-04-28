import expect from 'expect'
import { parseAnnotations } from '../../src/driver/dynamo/parsers/annotation-parser'
import { readdirSync, readFileSync } from 'fs'

// TODO: Bob: this annotation-parser should be moved to a new library ... part of typeorm-cdk perhaps
// Just showing how it could work here.
// typeorm-cdk could be completely separate and responsible for parsing annotations
// and creating CDK tables and indexes
describe('annotation-parser', () => {
    it('parseAnnotations', async (): Promise<any> => {
        /** when: **/
        // Bob, does this get you what you need?  It's string parsing the annotations .. completely separate of Typeorm ...
        // I originally wrote it for the hibernate-to-typeorm-converter...
        // what if we put this in a typeorm-cdk library
        const path = './test/entities'
        const files = readdirSync(path)
        const tables = []
        const indexes = []
        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            const contents = readFileSync(`${path}/${file}`).toString('utf-8')
            const entityAnnotation = parseAnnotations(contents, 'Entity')
            const globalSecondaryIndexes = parseAnnotations(contents, 'GlobalSecondaryIndex')

            // TODO: this is where we would build the CDK tables and indexes ...
            tables.push(entityAnnotation)
            indexes.push(globalSecondaryIndexes)
        }

        /** then: annotations are parsed **/
        expect(tables.length).toBe(1)
        expect(indexes.length).toBe(1)
    })
})
