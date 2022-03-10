import expect from 'expect'
import { jsonResponseAdapter } from '../../src'

describe('json-response-adapter', () => {
    describe('convert', () => {
        it('empty', () => {
            /** When: convert is called **/
            const output = jsonResponseAdapter.convert()

            /** Then: output = "" **/
            expect(output).toEqual([])
        })

        it('Test convert method with real data', () => {
            /** Given: "" **/
            const input = [{
                ID: '116052326524154',
                CREATED: '2016-05-23T21:46:39.000Z',
                CREATED_BY: 'n0171597',
                DELETED_IND: 'N',
                DELETED_DATE: null,
                MODIFIED: '2016-05-23T21:46:39.000Z',
                MODIFIED_BY: 'n0171597',
                CHILD_CODE: 'NO',
                CHILD_TYPE_VALUE: 'LM_REFRNC_CVRG_LVL',
                PARENT_CODE: 'BT',
                PARENT_TYPE_VALUE: 'LM_REFRNC_PROD_TYPE'
            }]

            /** When: convert is called **/
            const output = jsonResponseAdapter.convert(input)

            /** Then: output = "" **/
            expect(output).toEqual([{
                id: '116052326524154',
                created: '2016-05-23T21:46:39.000Z',
                createdBy: 'n0171597',
                deleted: false,
                modified: '2016-05-23T21:46:39.000Z',
                modifiedBy: 'n0171597',
                childCode: 'NO',
                childTypeValue: 'LM_REFRNC_CVRG_LVL',
                parentCode: 'BT',
                parentTypeValue: 'LM_REFRNC_PROD_TYPE'
            }])
        })

        it('Test convert method return top1', () => {
            /** Given: "" **/
            const input = [{
                ID: '116052326524154',
                CREATED: '2016-05-23T21:46:39.000Z',
                CREATED_BY: 'n0171597',
                DELETED_IND: 'N',
                DELETED_DATE: null,
                MODIFIED: '2016-05-23T21:46:39.000Z',
                MODIFIED_BY: 'n0171597',
                CHILD_CODE: 'NO',
                CHILD_TYPE_VALUE: 'LM_REFRNC_CVRG_LVL',
                PARENT_CODE: 'BT',
                PARENT_TYPE_VALUE: 'LM_REFRNC_PROD_TYPE'
            }]

            /** When: convert is called **/
            const output = jsonResponseAdapter.convert(input, { top1: true })

            /** Then: output = "" **/
            expect(output).toEqual({
                id: '116052326524154',
                created: '2016-05-23T21:46:39.000Z',
                createdBy: 'n0171597',
                deleted: false,
                modified: '2016-05-23T21:46:39.000Z',
                modifiedBy: 'n0171597',
                childCode: 'NO',
                childTypeValue: 'LM_REFRNC_CVRG_LVL',
                parentCode: 'BT',
                parentTypeValue: 'LM_REFRNC_PROD_TYPE'
            })
        })

        // it('Test convert method top1 throws too many rows exception', async () => {
        //     /** Given: 1 row was expected ... 2 rows were found **/
        //     let input = [{
        //         ID: "116052326524154",
        //         CREATED: "2016-05-23T21:46:39.000Z",
        //         CREATED_BY: 'n0171597',
        //         DELETED_IND: 'N',
        //         DELETED_DATE: null,
        //         MODIFIED: "2016-05-23T21:46:39.000Z",
        //         MODIFIED_BY: 'n0171597',
        //         CHILD_CODE: 'NO',
        //         CHILD_TYPE_VALUE: 'LM_REFRNC_CVRG_LVL',
        //         PARENT_CODE: 'BT',
        //         PARENT_TYPE_VALUE: 'LM_REFRNC_PROD_TYPE'
        //     }, {
        //         ID: "116052326524154",
        //         CREATED: "2016-05-23T21:46:39.000Z",
        //         CREATED_BY: 'n0171597',
        //         DELETED_IND: 'N',
        //         DELETED_DATE: null,
        //         MODIFIED: "2016-05-23T21:46:39.000Z",
        //         MODIFIED_BY: 'n0171597',
        //         CHILD_CODE: 'NO',
        //         CHILD_TYPE_VALUE: 'LM_REFRNC_CVRG_LVL',
        //         PARENT_CODE: 'BT',
        //         PARENT_TYPE_VALUE: 'LM_REFRNC_PROD_TYPE'
        //     }];
        //
        //     /** Then: an exception is thrown **/
        //     expect(jsonResponseAdapter.convert.bind(jsonResponseAdapter, input, { top1: true })).to.throw(`1 row was expected ... 2 rows were found`);

        // });
    })
})
