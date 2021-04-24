import { environmentUtils } from '@lmig/legal-nodejs-utils'

export const tableHelper = {

    name (name: string, environment?: string) {
        environment = environment || environmentUtils.getNodeEnv()
        return `${environment}-${name}`
    }
}
