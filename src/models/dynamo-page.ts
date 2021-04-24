import { Pageable } from '@lmig/legal-nodejs-utils'

export class DynamoPage<T> {
    content: T[];
    size: number;
    lastEvaluatedKey?: string;
    constructor (content: T[], pageable: Pageable, lastEvaluatedKey?: string) {
        this.content = content
        this.size = pageable.pageSize
        this.lastEvaluatedKey = lastEvaluatedKey
    }
}
