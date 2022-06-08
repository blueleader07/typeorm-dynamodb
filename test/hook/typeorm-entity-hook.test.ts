import expect from 'expect'
import { typeormEntityHook } from '../../src/typeorm/hook/typeorm-entity-hook'
import { Dummy } from '../entities/dummy'

describe('typeorm-entity-hook', () => {
    it('happy path', async (): Promise<any> => {
        const dummy: any = Dummy
        /** when: **/
        typeormEntityHook(dummy)
        /** then: **/
        expect(dummy.tableDetails).toBeDefined()
        expect(dummy.indexDetails.length).toBe(1)
    })
})
