import { PlatformTools } from 'typeorm/platform/PlatformTools'
import {
    PutItemInput,
    UpdateItemInput,
    ScanInput,
    QueryInput,
    BatchWriteItemInput,
    DeleteTableInput,
    DeleteItemInput,
    BatchGetItemInput,
    ScanCommand,
    QueryCommand,
    DeleteTableCommand, ListTablesCommand, ListTablesCommandInput
} from '@aws-sdk/client-dynamodb'
import { environmentUtils } from '../utils/environment-utils'
import {
    BatchGetCommand,
    BatchWriteCommand,
    DeleteCommand,
    DynamoDBDocumentClient,
    PutCommand, UpdateCommand
} from '@aws-sdk/lib-dynamodb'

export class DynamodbClient {
    getClient (): DynamoDBDocumentClient {
        const ClientDynamoDb = PlatformTools.load('@aws-sdk/client-dynamodb')
        const LibDynamoDb = PlatformTools.load('@aws-sdk/lib-dynamodb')
        const client = new ClientDynamoDb.DynamoDBClient({
            region: environmentUtils.getVariable('DYNAMO_REGION') || 'us-east-1',
            endpoint: environmentUtils.getVariable('DYNAMO_ENDPOINT')
        })
        return LibDynamoDb.DynamoDBDocumentClient.from(client, {
            marshallOptions: {
                convertClassInstanceToMap: true
            }
        })
    }

    put (params: PutItemInput) {
        if (environmentUtils.isTrue('DEBUG_DYNAMODB')) {
            console.log('dynamodb put', params)
        }
        return this.getClient().send(new PutCommand(params))
    }

    update (params: UpdateItemInput): Promise<any> {
        if (environmentUtils.isTrue('DEBUG_DYNAMODB')) {
            console.log('dynamodb update', params)
        }
        return this.getClient().send(new UpdateCommand(params))
    }

    scan (params: ScanInput) {
        if (environmentUtils.isTrue('DEBUG_DYNAMODB')) {
            console.log('dynamodb scan', params)
        }
        return this.getClient().send(new ScanCommand(params))
    }

    query (params: QueryInput) {
        if (environmentUtils.isTrue('DEBUG_DYNAMODB')) {
            console.log('dynamodb query', params)
        }
        return this.getClient().send(new QueryCommand(params))
    }

    delete (params: DeleteItemInput) {
        if (environmentUtils.isTrue('DEBUG_DYNAMODB')) {
            console.log('dynamodb delete', params)
        }
        return this.getClient().send(new DeleteCommand(params))
    }

    batchGet (params: BatchGetItemInput) {
        if (environmentUtils.isTrue('DEBUG_DYNAMODB')) {
            console.log('dynamodb batchGet', params)
        }
        return this.getClient().send(new BatchGetCommand(params))
    }

    batchWrite (params: BatchWriteItemInput) {
        if (environmentUtils.isTrue('DEBUG_DYNAMODB')) {
            console.log('dynamodb batchWrite', params)
        }
        return this.getClient().send(new BatchWriteCommand(params))
    }

    deleteTable (params: DeleteTableInput) {
        if (environmentUtils.isTrue('DEBUG_DYNAMODB')) {
            console.log('dynamodb delete table', params)
        }
        return this.getClient().send(new DeleteTableCommand(params))
    }

    listTables (params: ListTablesCommandInput) {
        if (environmentUtils.isTrue('DEBUG_DYNAMODB')) {
            console.log('dynamodb delete', params)
        }
        return this.getClient().send(new ListTablesCommand(params))
    }
}
