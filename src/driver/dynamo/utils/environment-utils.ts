declare let process: { env: { [key: string]: any }}

export const environmentUtils = {

    isProduction (): boolean {
        return environmentUtils.getNodeEnv() === 'production'
    },

    isPerformance (): boolean {
        return environmentUtils.getNodeEnv() === 'performance'
    },

    isTest (): boolean {
        return environmentUtils.getNodeEnv() === 'test'
    },

    isDevelopment (): boolean {
        return environmentUtils.getNodeEnv() === 'development'
    },

    isSandbox (): boolean {
        return environmentUtils.getNodeEnv() === 'sandbox'
    },

    isLocal (): boolean {
        return environmentUtils.getNodeEnv() === 'local'
    },

    getNodeEnv (): string {
        return environmentUtils.getVariable('NODE_ENV') || ''
    },

    getVariable (name: string): any {
        return process.env[name]
    },

    setVariable (name: string, value: any) {
        process.env[name] = value
    },

    isTrue (name: string): boolean {
        const value: any = process.env[name]
        return value === true || value === 'true'
    }

}
