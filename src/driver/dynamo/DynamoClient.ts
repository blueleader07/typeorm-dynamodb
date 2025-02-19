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
    DeleteTableCommand,
    ListTablesCommand,
    CreateTableCommand,
    DescribeTableInput,
    DescribeTableCommand,
    CreateTableInput,
    UpdateTableInput,
    UpdateTableCommand,
    ListTablesInput,
    DynamoDBClientConfigType
} from '@aws-sdk/client-dynamodb'
import { NodeHttpHandler } from '@smithy/node-http-handler'
import { environmentUtils } from './utils/environment-utils'
import {
    BatchGetCommand,
    BatchWriteCommand,
    DeleteCommand,
    DynamoDBDocumentClient,
    PutCommand, UpdateCommand,
    ExecuteStatementCommandInput,
    ExecuteStatementCommand
} from '@aws-sdk/lib-dynamodb'
import { getRegion } from './helpers/region-helper'

let dynamoDBDocumentClient: DynamoDBDocumentClient

export class DynamoClient {
    getClient (config: DynamoDBClientConfigType = {}): DynamoDBDocumentClient {
        if (!dynamoDBDocumentClient) {
            const ClientDynamoDb = PlatformTools.load('@aws-sdk/client-dynamodb')
            const LibDynamoDb = PlatformTools.load('@aws-sdk/lib-dynamodb')
            const client = new ClientDynamoDb.DynamoDBClient({
                region: getRegion(),
                endpoint: environmentUtils.getVariable('DYNAMO_ENDPOINT'),
                requestHandler: new NodeHttpHandler({
                    requestTimeout: 10000 // <- this decreases the emfiles count, the Node.js default is 120000
                }),
                ...config
            })
            dynamoDBDocumentClient = LibDynamoDb.DynamoDBDocumentClient.from(client, {
                marshallOptions: {
                    convertClassInstanceToMap: true,
                    removeUndefinedValues: true
                }
            })
        }
        return dynamoDBDocumentClient
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

    executeStatement (params: ExecuteStatementCommandInput) {
        if (environmentUtils.isTrue('DEBUG_DYNAMODB')) {
            console.log('dynamodb executeStatement', params)
        }
        return this.getClient().send(new ExecuteStatementCommand(params))
    }

    deleteTable (params: DeleteTableInput) {
        if (environmentUtils.isTrue('DEBUG_DYNAMODB')) {
            console.log('dynamodb delete table', params)
        }
        return this.getClient().send(new DeleteTableCommand(params))
    }

    describeTable (params: DescribeTableInput) {
        if (environmentUtils.isTrue('DEBUG_DYNAMODB')) {
            console.log('dynamodb describe table', params)
        }
        return this.getClient().send(new DescribeTableCommand(params))
    }

    listTables (params: ListTablesInput) {
        if (environmentUtils.isTrue('DEBUG_DYNAMODB')) {
            console.log('dynamodb list tables', params)
        }
        return this.getClient().send(new ListTablesCommand(params))
    }

    createTable (params: CreateTableInput) {
        if (environmentUtils.isTrue('DEBUG_DYNAMODB')) {
            console.log('dynamodb create table', params)
        }
        return this.getClient().send(new CreateTableCommand(params))
    }

    updateTable (params: UpdateTableInput) {
        if (environmentUtils.isTrue('DEBUG_DYNAMODB')) {
            console.log('dynamodb create table', params)
        }
        return this.getClient().send(new UpdateTableCommand(params))
    }
}

export const getDocumentClient = () => {
    return new DynamoClient()
}
