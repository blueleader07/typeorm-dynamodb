export class CustomError extends Error {
    forwardToClient: boolean
    httpCode: number

    constructor (description: string, forward?: boolean, httpCode?: number) {
        super(description)
        this.forwardToClient = forward !== undefined ? forward : true
        if (httpCode) {
            this.httpCode = httpCode
        }
    }
}

export function messageForError (error: Error, placeholder: string): string {
    if (error instanceof CustomError) {
        return error.forwardToClient ? error.message : 'Bad Request'
    } else {
        const anyError = error as any
        if (anyError.expose) {
            return error.message
        }
        return placeholder
    }
}

export function httpCodeForError (error: Error, placeholder: number): number {
    if (error instanceof CustomError) {
        return error.httpCode || 400
    } else {
        const anyError = error as any
        if ('statusCode' in anyError) {
            return anyError.statusCode
        }
        return placeholder
    }
}
