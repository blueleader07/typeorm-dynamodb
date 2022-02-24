import { datasourceManager, DatasourceManagerOptions } from '../managers/datasource-manager'
import { environmentUtils } from '@lmig/legal-nodejs-utils'

export const datasourceInitializer = (options: DatasourceManagerOptions) => {
    if (environmentUtils.isLocal()) {
        datasourceManager.open(options).then(() => {
            console.log('database created.')
        }).catch(error => {
            console.error('error creating database', error)
        })
        return (req: any, res: any, next: any) => {
            next()
        }
    }
    return async (req: any, res: any, next: any) => {
        await datasourceManager.open(options)
        next()
    }
}
