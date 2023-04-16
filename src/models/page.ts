import { Pageable } from './pageable'

export class Page<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    last: boolean;
    size: number;
    number: number;
    first: boolean;
    numberOfElements: number;
    constructor (content: T[], pageable: Pageable, total: number) {
        const totalPages = Math.ceil(total / pageable.pageSize)
        this.content = content
        this.totalElements = total
        this.totalPages = totalPages
        this.last = pageable.pageNumber === totalPages - 1
        this.size = pageable.pageSize
        this.number = pageable.pageNumber
        this.first = pageable.pageNumber === 0
        this.numberOfElements = content.length
    }
}
