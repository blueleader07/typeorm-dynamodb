import { datasourceManager } from '../managers/datasource-manager'

export const datasourceInitializer = (options?: any) => {
    return async (req: any, res: any, next: any) => {
        await datasourceManager.open(options)
        next()
    }
}
