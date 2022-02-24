import { datasourceManager, DatasourceManagerOptions } from '../managers/datasource-manager'

export const datasourceInitializer = (options: DatasourceManagerOptions) => {
    return async (req: any, res: any, next: any) => {
        await datasourceManager.open(options)
        next()
    }
}
