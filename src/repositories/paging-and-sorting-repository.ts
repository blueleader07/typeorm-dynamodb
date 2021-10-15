import { FindOptions } from '../models/find-options'
import { commonUtils, Page, Pageable } from '@lmig/legal-nodejs-utils'
import { DynamoPage } from '../models/dynamo-page'
import { DynamodbRepository } from './dynamodb-repository'

const encode = (json: object) => {
    return Buffer.from(JSON.stringify(json)).toString('base64')
}

const decode = (data: string) => {
    return JSON.parse(Buffer.from(data, 'base64').toString('ascii'))
}

export class PagingAndSortingRepository <T> extends DynamodbRepository<T> {
    /**
     * Queries by page size and exclusiveStartKey
     */
    async findPage (options: FindOptions, pageable: Pageable) {
        options.limit = commonUtils.isEmpty(pageable.pageSize) ? 15 : pageable.pageSize
        options.exclusiveStartKey = pageable.exclusiveStartKey ? decode(pageable.exclusiveStartKey) : undefined
        const items: any = await this.find(options)
        return new DynamoPage(items, pageable, encode(items.lastEvaluatedKey))
    }

    /**
     * Queries ALL items then returns the desired subset
     * WARNING: This is NOT an efficient way of querying dynamodb.
     * Please only use this if you must, preferably on light use pages
     */
    async findPageWithCountExpensive (options: FindOptions, pageable: Pageable) {
        const pageSize = commonUtils.isEmpty(pageable.pageSize) ? 15 : pageable.pageSize
        const pageNumber = commonUtils.isEmpty(pageable.pageNumber) ? 0 : pageable.pageNumber
        const items = await this.findAll(options)
        const start = pageNumber * pageSize
        let count = (pageNumber + 1) * pageSize
        if (start + count > items.length) {
            count = items.length - start
        }
        const subset = items.splice(start, count)
        return new Page(subset, pageable, subset.length + items.length)
    }
}
