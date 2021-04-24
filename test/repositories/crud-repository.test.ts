import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
const expect = chai.expect

describe('crud-repository', () => {
    it('select', async (): Promise<any> => {
        expect(1).to.equal(1)
    })
})
