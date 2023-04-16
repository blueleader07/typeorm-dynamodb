import { Stream } from 'stream'
import { ScanOptions } from '../models/scan-options'
import { DynamodbRepository } from '../repositories/dynamodb-repository'
import { CustomError } from '../models/custom-error'

export class DynamodbReadStream<Entity> extends Stream.Readable {
    repository: DynamodbRepository<Entity>
    options: ScanOptions

    constructor (repository: DynamodbRepository<Entity>, options: ScanOptions) {
        super()
        this.repository = repository
        this.options = options
    }

    _read () {
        this.repository.scan(this.options).then(items => {
            if (items.length > 0) {
                for (let i = 0; i < items.length; i++) {
                    const item = items[i]
                    this.push(item)
                }
                if (items.LastEvaluatedKey) {
                    this.options.exclusiveStartKey = items.LastEvaluatedKey
                } else {
                    this.push(null)
                }
            } else {
                this.push(null)
            }
        }).catch((error: any) => {
            throw new CustomError('failed to stream dynamodb results', error)
        })
    }
}
