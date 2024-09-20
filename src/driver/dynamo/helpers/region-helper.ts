import { environmentUtils } from '../utils/environment-utils'

export const getRegion = () => {
    return environmentUtils.getVariable('DYNAMO_REGION') || environmentUtils.getVariable('AWS_REGION') || environmentUtils.getVariable('DEFAULT_AWS_REGION') || 'us-east-1'
}
