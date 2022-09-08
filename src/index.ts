import { auditHelper } from './helpers/audit-helper'
import { datasourceInitializer } from './middleware/datasource-initializer'
import { datasourceManager, DatasourceManagerOptions } from './managers/datasource-manager'
import { BaseEntity } from './entities/base-entity'
import {
    DynamoRepository,
    DynamoPagingAndSortingRepository,
    DynamoFindOptions,
    BeginsWith,
    DynamoUpdateExpressionOptions,
    DynamoBatchWriteItem,
    DynamoPage,
    getDocumentClient,
    GlobalSecondaryIndex,
    dynamoParamHelper
} from 'typeorm'
import { tableName } from './helpers/table-helper'
import { User } from './models/user'
import { Pageable, Page, Sort, Order, pageableRoutes } from '@lmig/legal-nodejs-utils'
import { YesNoIndicatorTransformer } from './transformers/yes-no-indicator-transformer'
import { BigNumberTransformer } from './transformers/big-number-transformer'
import { DynamodbEntity } from './decorators/dynamodb-entity'
import { jsonResponseAdapter } from './adapters/json-response-adapter'
import { camelCaseAdapter } from './adapters/camel-case-adapter'

export {
    auditHelper,
    datasourceInitializer,
    datasourceManager,
    DatasourceManagerOptions,
    BaseEntity,
    BigNumberTransformer,
    DynamodbEntity,
    DynamoRepository,
    GlobalSecondaryIndex,
    DynamoPagingAndSortingRepository,
    DynamoPage,
    tableName,
    dynamoParamHelper,
    DynamoFindOptions,
    DynamoUpdateExpressionOptions,
    BeginsWith,
    Page,
    Sort,
    Order,
    Pageable,
    pageableRoutes,
    User,
    DynamoBatchWriteItem,
    YesNoIndicatorTransformer,
    getDocumentClient,
    jsonResponseAdapter,
    camelCaseAdapter
}
