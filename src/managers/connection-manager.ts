import { DataSource, DataSourceOptions } from 'typeorm'

export const connectionManager = {

    create (options: DataSourceOptions) {
        const datasource = new DataSource(options)
        return datasource.initialize()
    }

}
