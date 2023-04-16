import { createConnection, getConnection } from 'typeorm'
import { ConnectionOptions } from 'typeorm/connection/ConnectionOptions'

export const connectionManager = {

    create (options: ConnectionOptions) {
        return createConnection(options)
    },

    get (name?: string) {
        return getConnection(name)
    }

}
