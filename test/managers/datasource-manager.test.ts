import expect from 'expect'
import { datasourceManager, AddOptions } from '../../src'
import sinon from 'sinon'
import { Dummy } from '../entities/dummy'
import { DummyRepository } from '../repositories/dummy-repository'
import { MockEntityManager } from '../mocks/mock-typeorm'
import { DynamoQueryRunner } from '../../src/driver/dynamo/DynamoQueryRunner'
import { TypeORMError } from 'typeorm'
import * as DynamoClientModule from '../../src/driver/dynamo/DynamoClient'

describe('datasource-manager', () => {
    beforeEach(async () => {
        await MockEntityManager()
    })
    afterEach(() => {
        sinon.restore()
    })

    it('insert and delete', async (): Promise<any> => {
        sinon.stub(DummyRepository.prototype, 'put').resolves()
        sinon.stub(DummyRepository.prototype, 'deleteOne').resolves()
        const findStub = sinon.stub(DummyRepository.prototype, 'findOne')
        findStub.onFirstCall().resolves({ id: '123', name: 'dummy' } as any)
        findStub.onSecondCall().resolves(undefined)
        const connection = await datasourceManager.open({ entities: [Dummy] })
        await connection.synchronize()
        const repository = await datasourceManager.getCustomRepository(DummyRepository, Dummy)
        const dummy = new Dummy()
        dummy.id = '456'
        dummy.name = 'dummy'
        dummy.adjustmentGroupId = '789'
        dummy.adjustmentStatus = 'PROCESSED'
        await repository.put(dummy)
        const result = await repository.findOne('456')
        expect(result).not.toBe(undefined)
        await repository.deleteOne({ id: '456' })
        const result2 = await repository.findOne('456')
        expect(result2).toBe(undefined)
    }, 30000)

    it('insert and delete many', async (): Promise<any> => {
        sinon.stub(DummyRepository.prototype, 'put').resolves()
        sinon.stub(DummyRepository.prototype, 'deleteMany').resolves()
        const findStub = sinon.stub(DummyRepository.prototype, 'findOne')
        findStub.onFirstCall().resolves({ id: '123', name: 'dummy1' } as any)
        findStub.onSecondCall().resolves({ id: '456', name: 'dummy2' } as any)
        const connection = await datasourceManager.open({ entities: [Dummy] })
        await connection.synchronize()
        const repository = await datasourceManager.getCustomRepository(DummyRepository, Dummy)
        const dummy1 = new Dummy()
        dummy1.id = '123'
        dummy1.name = 'dummy1'
        dummy1.adjustmentGroupId = '789'
        dummy1.adjustmentStatus = 'PROCESSED'
        const dummy2 = new Dummy()
        dummy2.id = '456'
        dummy2.name = 'dummy2'
        dummy2.adjustmentGroupId = '789'
        dummy2.adjustmentStatus = 'PROCESSED'
        await repository.put([dummy1, dummy2])
        const result1 = await repository.findOne('123')
        expect(result1).not.toBe(undefined)
        const result2 = await repository.findOne('456')
        expect(result2).not.toBe(undefined)
        await repository.deleteMany([{ id: '123' }, { id: '456' }])
    }, 30000)

    it('add', async (): Promise<any> => {
        sinon.stub(DummyRepository.prototype, 'add').resolves()
        const connection = await datasourceManager.open({ entities: [Dummy] })
        await connection.synchronize()
        const repository = await datasourceManager.getCustomRepository(DummyRepository, Dummy)
        const options = new AddOptions()
        options.values = {
            total: 100
        }
        options.where = {
            executionId: '123'
        }
        await repository.add(options)
    }, 30000)
})

describe('transaction-manager', () => {
    let queryRunner: DynamoQueryRunner
    let transactWriteStub: sinon.SinonStub
    let mockDynamoClient: any

    beforeEach(async () => {
        await MockEntityManager()
        queryRunner = new DynamoQueryRunner({} as any, {})

        // Create mock DynamoDB client
        transactWriteStub = sinon.stub().resolves()
        mockDynamoClient = {
            transactWrite: transactWriteStub,
            put: sinon.stub().resolves(),
            delete: sinon.stub().resolves(),
            batchWrite: sinon.stub().resolves()
        }

        // Mock the getDocumentClient function
        sinon.stub(DynamoClientModule, 'getDocumentClient').returns(mockDynamoClient)
    })

    afterEach(() => {
        sinon.restore()
    })

    describe('startTransaction', () => {
        it('should initialize transaction state', async () => {
            expect(queryRunner.isTransactionActive).toBe(false)

            await queryRunner.startTransaction()

            expect(queryRunner.isTransactionActive).toBe(true)
            expect((queryRunner as any).transactionBuffer).toEqual([])
        })

        it('should throw error if transaction already active', async () => {
            await queryRunner.startTransaction()

            await expect(queryRunner.startTransaction()).rejects.toThrow(
                new TypeORMError('Transaction is already active.')
            )
        })
    })

    describe('rollbackTransaction', () => {
        it('should clear transaction state', async () => {
            await queryRunner.startTransaction()
            // Add some operations to the buffer
            await queryRunner.putOne('TestTable', { id: '1', name: 'test' })

            await queryRunner.rollbackTransaction()

            expect(queryRunner.isTransactionActive).toBe(false)
            expect((queryRunner as any).transactionBuffer).toEqual([])
        })

        it('should throw error if no active transaction', async () => {
            await expect(queryRunner.rollbackTransaction()).rejects.toThrow(
                new TypeORMError('No active transaction to rollback.')
            )
        })
    })

    describe('commitTransaction', () => {
        it('should commit empty transaction successfully', async () => {
            await queryRunner.startTransaction()

            await queryRunner.commitTransaction()

            expect(queryRunner.isTransactionActive).toBe(false)
            expect(transactWriteStub.called).toBe(false)
        })

        it('should throw error if no active transaction', async () => {
            await expect(queryRunner.commitTransaction()).rejects.toThrow(
                new TypeORMError('No active transaction to commit.')
            )
        })

        it('should throw error if transaction exceeds 100 operations', async () => {
            await queryRunner.startTransaction()

            // Add 101 operations to exceed the limit
            for (let i = 0; i < 101; i++) {
                await queryRunner.putOne('TestTable', { id: i.toString(), name: `test${i}` })
            }

            await expect(queryRunner.commitTransaction()).rejects.toThrow(
                new TypeORMError('DynamoDB transactions support maximum 100 operations per transaction.')
            )
        })

        it('should execute transactWrite with correct parameters', async () => {
            await queryRunner.startTransaction()

            // Add some operations
            await queryRunner.putOne('Users', { id: '1', name: 'Alice' })
            await queryRunner.deleteOne('Orders', { id: '123' })

            await queryRunner.commitTransaction()

            expect(transactWriteStub.calledOnce).toBe(true)
            const callArgs = transactWriteStub.firstCall.args[0]
            expect(callArgs.TransactItems).toHaveLength(2)

            // Verify put operation
            expect(callArgs.TransactItems[0]).toEqual({
                Put: {
                    TableName: 'Users',
                    Item: { id: '1', name: 'Alice' }
                }
            })

            // Verify delete operation
            expect(callArgs.TransactItems[1]).toEqual({
                Delete: {
                    TableName: 'Orders',
                    Key: { id: '123' }
                }
            })
        })

        it('should handle transactWrite failure', async () => {
            const error = new Error('DynamoDB transaction failed')
            transactWriteStub.rejects(error)

            await queryRunner.startTransaction()
            await queryRunner.putOne('TestTable', { id: '1', name: 'test' })

            await expect(queryRunner.commitTransaction()).rejects.toThrow(
                new TypeORMError('Transaction failed: DynamoDB transaction failed')
            )

            // Transaction should remain active after failure
            expect(queryRunner.isTransactionActive).toBe(true)
        })
    })

    describe('transactional CRUD operations', () => {
        it('should buffer putOne operations during transaction', async () => {
            await queryRunner.startTransaction()

            const result = await queryRunner.putOne('TestTable', { id: '1', name: 'test' })

            expect(result).toEqual({ id: '1', name: 'test' })
            expect((queryRunner as any).transactionBuffer).toHaveLength(1)
            expect((queryRunner as any).transactionBuffer[0]).toEqual({
                type: 'put',
                params: {
                    TableName: 'TestTable',
                    Item: { id: '1', name: 'test' }
                }
            })
        })

        it('should buffer deleteOne operations during transaction', async () => {
            await queryRunner.startTransaction()

            await queryRunner.deleteOne('TestTable', { id: '1' })

            expect((queryRunner as any).transactionBuffer).toHaveLength(1)
            expect((queryRunner as any).transactionBuffer[0]).toEqual({
                type: 'delete',
                params: {
                    TableName: 'TestTable',
                    Key: { id: '1' }
                }
            })
        })

        it('should buffer putMany operations during transaction', async () => {
            await queryRunner.startTransaction()

            const docs = [
                { id: '1', name: 'test1' },
                { id: '2', name: 'test2' }
            ]
            await queryRunner.putMany('TestTable', docs)

            expect((queryRunner as any).transactionBuffer).toHaveLength(2)
            expect((queryRunner as any).transactionBuffer[0]).toEqual({
                type: 'put',
                params: {
                    TableName: 'TestTable',
                    Item: { id: '1', name: 'test1' }
                }
            })
            expect((queryRunner as any).transactionBuffer[1]).toEqual({
                type: 'put',
                params: {
                    TableName: 'TestTable',
                    Item: { id: '2', name: 'test2' }
                }
            })
        })

        it('should buffer deleteMany operations during transaction', async () => {
            await queryRunner.startTransaction()

            const keys = [{ id: '1' }, { id: '2' }]
            await queryRunner.deleteMany('TestTable', keys)

            expect((queryRunner as any).transactionBuffer).toHaveLength(2)
            expect((queryRunner as any).transactionBuffer[0]).toEqual({
                type: 'delete',
                params: {
                    TableName: 'TestTable',
                    Key: { id: '1' }
                }
            })
            expect((queryRunner as any).transactionBuffer[1]).toEqual({
                type: 'delete',
                params: {
                    TableName: 'TestTable',
                    Key: { id: '2' }
                }
            })
        })

        it('should execute operations immediately when no transaction active', async () => {
            const result = await queryRunner.putOne('TestTable', { id: '1', name: 'test' })

            expect(result).toEqual({ id: '1', name: 'test' })
            expect(mockDynamoClient.put.calledOnce).toBe(true)
            expect(mockDynamoClient.put.firstCall.args[0]).toEqual({
                TableName: 'TestTable',
                Item: { id: '1', name: 'test' }
            })
            expect((queryRunner as any).transactionBuffer).toHaveLength(0)
        })
    })

    describe('complex transaction scenarios', () => {
        it('should handle mixed operations in single transaction', async () => {
            await queryRunner.startTransaction()

            // Mix of different operations
            await queryRunner.putOne('Users', { id: '1', name: 'Alice', email: 'alice@example.com' })
            await queryRunner.putMany('Orders', [
                { id: '101', userId: '1', total: 100 },
                { id: '102', userId: '1', total: 200 }
            ])
            await queryRunner.deleteOne('Cart', { userId: '1' })
            await queryRunner.deleteMany('TempData', [{ id: 'temp1' }, { id: 'temp2' }])

            await queryRunner.commitTransaction()

            expect(transactWriteStub.calledOnce).toBe(true)
            const callArgs = transactWriteStub.firstCall.args[0]
            expect(callArgs.TransactItems).toHaveLength(6) // 1 put + 2 puts + 1 delete + 2 deletes

            // Verify the operations are in correct order
            expect(callArgs.TransactItems[0].Put.TableName).toBe('Users')
            expect(callArgs.TransactItems[1].Put.TableName).toBe('Orders')
            expect(callArgs.TransactItems[2].Put.TableName).toBe('Orders')
            expect(callArgs.TransactItems[3].Delete.TableName).toBe('Cart')
            expect(callArgs.TransactItems[4].Delete.TableName).toBe('TempData')
            expect(callArgs.TransactItems[5].Delete.TableName).toBe('TempData')
        })

        it('should handle transaction rollback after operations buffered', async () => {
            await queryRunner.startTransaction()

            // Buffer some operations
            await queryRunner.putOne('Users', { id: '1', name: 'Alice' })
            await queryRunner.deleteOne('Orders', { id: '123' })

            expect((queryRunner as any).transactionBuffer).toHaveLength(2)

            await queryRunner.rollbackTransaction()

            expect(queryRunner.isTransactionActive).toBe(false)
            expect((queryRunner as any).transactionBuffer).toHaveLength(0)
            expect(transactWriteStub.called).toBe(false)
        })

        it('should handle empty array operations gracefully', async () => {
            await queryRunner.startTransaction()

            // Empty arrays should not add to buffer
            await queryRunner.putMany('TestTable', [])
            await queryRunner.deleteMany('TestTable', [])

            expect((queryRunner as any).transactionBuffer).toHaveLength(0)

            await queryRunner.commitTransaction()

            expect(transactWriteStub.called).toBe(false) // No operations to commit
        })
    })

    describe('buildTransactItem', () => {
        it('should build Put item correctly', () => {
            const operation = {
                type: 'put' as const,
                params: {
                    TableName: 'TestTable',
                    Item: { id: '1', name: 'test' },
                    ConditionExpression: 'attribute_not_exists(id)'
                }
            }

            const result = (queryRunner as any).buildTransactItem(operation)

            expect(result).toEqual({
                Put: {
                    TableName: 'TestTable',
                    Item: { id: '1', name: 'test' },
                    ConditionExpression: 'attribute_not_exists(id)'
                }
            })
        })

        it('should build Delete item correctly', () => {
            const operation = {
                type: 'delete' as const,
                params: {
                    TableName: 'TestTable',
                    Key: { id: '1' },
                    ConditionExpression: 'attribute_exists(id)'
                }
            }

            const result = (queryRunner as any).buildTransactItem(operation)

            expect(result).toEqual({
                Delete: {
                    TableName: 'TestTable',
                    Key: { id: '1' },
                    ConditionExpression: 'attribute_exists(id)'
                }
            })
        })

        it('should build Update item correctly', () => {
            const operation = {
                type: 'update' as const,
                params: {
                    TableName: 'TestTable',
                    Key: { id: '1' },
                    UpdateExpression: 'SET #name = :name',
                    ExpressionAttributeValues: { ':name': 'newName' },
                    ConditionExpression: 'attribute_exists(id)'
                }
            }

            const result = (queryRunner as any).buildTransactItem(operation)

            expect(result).toEqual({
                Update: {
                    TableName: 'TestTable',
                    Key: { id: '1' },
                    UpdateExpression: 'SET #name = :name',
                    ExpressionAttributeValues: { ':name': 'newName' },
                    ConditionExpression: 'attribute_exists(id)'
                }
            })
        })

        it('should build ConditionCheck item correctly', () => {
            const operation = {
                type: 'conditionCheck' as const,
                params: {
                    TableName: 'TestTable',
                    Key: { id: '1' },
                    ConditionExpression: 'attribute_exists(id) AND #status = :status'
                }
            }

            const result = (queryRunner as any).buildTransactItem(operation)

            expect(result).toEqual({
                ConditionCheck: {
                    TableName: 'TestTable',
                    Key: { id: '1' },
                    ConditionExpression: 'attribute_exists(id) AND #status = :status'
                }
            })
        })

        it('should throw error for unsupported operation type', () => {
            const operation = {
                type: 'unsupported' as any,
                tableName: 'TestTable'
            }

            expect(() => (queryRunner as any).buildTransactItem(operation))
                .toThrow(new TypeORMError('Unsupported transaction operation type: unsupported'))
        })
    })
})
