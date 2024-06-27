import { FindOptions } from '../models/FindOptions'
import { Pageable } from '../models/Pageable'
import { PageExpensive } from '../models/PageExpensive'
import { Page } from '../models/Page'
import { DynamoRepository } from './DynamoRepository'
import { isEmpty } from '../helpers/DynamoObjectHelper'
import { ObjectLiteral } from 'typeorm'

const encode = (json: object) => {
    if (json) {
        return Buffer.from(JSON.stringify(json)).toString('base64')
    }
    return undefined
}

const decode = (data: string) => {
    return JSON.parse(Buffer.from(data, 'base64').toString('ascii'))
}

export class PagingAndSortingRepository<T extends ObjectLiteral> extends DynamoRepository<T> {
    /**
     * Queries by page size and exclusiveStartKey
     */
    async findPage (options: FindOptions, pageable: Pageable) {
        options.limit = isEmpty(pageable.pageSize) ? 15 : pageable.pageSize
        options.exclusiveStartKey = pageable.exclusiveStartKey
            ? decode(pageable.exclusiveStartKey)
            : undefined
        if (
            pageable.sort &&
            pageable.sort.orders &&
            pageable.sort.orders.length > 0
        ) {
            const firstOrder = pageable.sort.orders[0]
            options.sort = firstOrder.direction
        }
        const items: any = await this.find(options)
        return new Page(items, pageable, encode(items.lastEvaluatedKey))
    }

    /**
     * Queries ALL items then returns the desired subset
     * WARNING: This is NOT an efficient way of querying dynamodb.
     * Please only use this if you must, preferably on lightly used pages
     */
    async findPageWithCountExpensive (
        options: FindOptions,
        pageable: Pageable
    ) {
        const pageSize = isEmpty(pageable.pageSize) ? 15 : pageable.pageSize
        const pageNumber = isEmpty(pageable.pageNumber)
            ? 0
            : pageable.pageNumber
        const items = await this.findAll(options)
        const start = pageNumber * pageSize
        let count = (pageNumber + 1) * pageSize
        if (start + count > items.length) {
            count = items.length - start
        }
        const subset = items.splice(start, count)
        return new PageExpensive(
            subset,
            pageable,
            subset.length + items.length
        )
    }
}
