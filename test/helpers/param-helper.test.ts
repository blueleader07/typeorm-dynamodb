import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { FindOptions } from '../../src/models/find-options'
import { UpdateOptions } from '../../src/models/update-options'
import { paramHelper } from '../../src/helpers/param-helper';

chai.use(chaiAsPromised)
const expect = chai.expect
const MACHINE_ID = '9117e83c-6e58-424b-9650-6027c8b67386'
const MONTH_ID = `${MACHINE_ID}-2020-12`
const VARIANCE = 'WEEKDAY'
const DAY = '2020-11-27'

describe('param-helper', () => {
    it('find', async (): Promise<any> => {
        /** given: **/
        const options = new FindOptions()
        options.index = 'machineIdIndex'
        options.where = {
            machineId: MACHINE_ID
        }

        /** when: **/
        const params = paramHelper.find('local-toucan-scores', options)

        /** then: **/
        expect(params).to.deep.equal({
            ExpressionAttributeNames: {
                '#machineId': 'machineId'
            },
            ExpressionAttributeValues: {
                ':machineId': '9117e83c-6e58-424b-9650-6027c8b67386'
            },
            IndexName: 'machineIdIndex',
            KeyConditionExpression: '#machineId = :machineId',
            ScanIndexForward: true,
            TableName: 'local-toucan-scores'
        })
    })
    it('find with multiple where filters', async (): Promise<any> => {
        /** given: **/
        const options = new FindOptions()
        options.index = 'monthIdIndex'
        options.where = {
            monthId: MONTH_ID,
            variance: VARIANCE
        }

        /** when: **/
        const params = paramHelper.find('local-toucan-scores', options)

        /** then: **/
        expect(params).to.deep.equal({
            ExpressionAttributeNames: {
                '#monthId': 'monthId',
                '#variance': 'variance'
            },
            ExpressionAttributeValues: {
                ':monthId': MONTH_ID,
                ':variance': VARIANCE
            },
            IndexName: 'monthIdIndex',
            KeyConditionExpression: '#monthId = :monthId and #variance = :variance',
            ScanIndexForward: true,
            TableName: 'local-toucan-scores'
        })
    })
    it('update', async (): Promise<any> => {
        /** given: **/
        const options = new UpdateOptions()
        options.type = 'ADD'
        options.values = {
            total: 1,
            count: 1
        }
        options.where = {
            machineId: MACHINE_ID,
            day: DAY
        }

        /** when: **/
        const params = paramHelper.update('local-toucan-score-totals', options)

        /** then: **/
        expect(params).to.deep.equal({
            TableName: 'local-toucan-score-totals',
            Key: {
                machineId: MACHINE_ID,
                day: DAY
            },
            UpdateExpression: 'ADD #total :total, #count :count',
            ExpressionAttributeNames: {
                '#total': 'total',
                '#count': 'count'
            },
            ExpressionAttributeValues: {
                ':total': 1,
                ':count': 1
            }
        })
    })
})
