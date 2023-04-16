import { PlatformTools } from 'typeorm/platform/PlatformTools'
import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client'
import { environmentUtils } from '../utils/environment-utils'

export class DynamodbClient {
    getClient () {
        const AWS = PlatformTools.load('aws-sdk')
        return new AWS.DynamoDB.DocumentClient()
    }

    put (params: DocumentClient.PutItemInput) {
        if (environmentUtils.isTrue('DEBUG_DYNAMODB')) {
            console.log('dynamodb put', params)
        }
        return this.getClient().put(params).promise()
    }

    update (params: DocumentClient.UpdateItemInput) {
        if (environmentUtils.isTrue('DEBUG_DYNAMODB')) {
            console.log('dynamodb update', params)
        }
        return this.getClient().update(params).promise()
    }

    scan (params: DocumentClient.ScanInput) {
        if (environmentUtils.isTrue('DEBUG_DYNAMODB')) {
            console.log('dynamodb scan', params)
        }
        return this.getClient().scan(params).promise()
    }

    query (params: DocumentClient.QueryInput) {
        if (environmentUtils.isTrue('DEBUG_DYNAMODB')) {
            console.log('dynamodb query', params)
        }
        return this.getClient().query(params).promise()
    }

    delete (params: DocumentClient.DeleteItemInput) {
        if (environmentUtils.isTrue('DEBUG_DYNAMODB')) {
            console.log('dynamodb delete', params)
        }
        return this.getClient().delete(params).promise()
    }

    batchGet (params: DocumentClient.BatchGetItemInput) {
        if (environmentUtils.isTrue('DEBUG_DYNAMODB')) {
            console.log('dynamodb batchGet', params)
        }
        return this.getClient().batchGet(params).promise()
    }

    batchWrite (params: DocumentClient.BatchWriteItemInput) {
        if (environmentUtils.isTrue('DEBUG_DYNAMODB')) {
            console.log('dynamodb batchWrite', params)
        }
        return this.getClient().batchWrite(params).promise()
    }

    deleteTable (params: DocumentClient.DeleteTableInput) {
        if (environmentUtils.isTrue('DEBUG_DYNAMODB')) {
            console.log('dynamodb delete table', params)
        }
        return this.getClient().deleteTable(params).promise()
    }
}
