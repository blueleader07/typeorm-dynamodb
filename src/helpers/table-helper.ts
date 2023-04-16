import { environmentUtils } from '../utils/environment-utils'
import { PlatformTools } from 'typeorm/platform/PlatformTools'

export const tableName = (name: string, environment?: string) => {
    environment = environment || environmentUtils.getNodeEnv()
    return `${environment}-${name}`
}

const wait = (seconds: number) => {
    return new Promise((resolve: any) => {
        setTimeout(function () {
            resolve()
        }, seconds)
    })
}

export const waitUntilActive = async (db: any, tableName: string) => {
    let retries = 10
    while (retries > 0) {
        try {
            const result = await db.describeTable({
                TableName: tableName
            }).promise()
            const status = result.Table.TableStatus
            if (status === 'ACTIVE') {
                break
            }
            await wait(10)
        } catch (error) {
            const _error: any = error
            PlatformTools.logError(`failed to describe table: ${tableName}`, _error)
        }
        retries -= 1
    }
}
