export const datasourceInitializer = (options?: any) => {
    return async (req: any, res: any, next: any) => {
        // not necessary (yet).  maybe when typeorm is available.
        // await datasourceManager.open(options)
        next()
    }
}
