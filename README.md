# typeorm-dynamodb

This package adds DynamoDB support to TypeORM.  It works by wrapping TypeORM.
Supports Typeorm version 0.3+

To get started using NPM, you can use the following commands:

```
npm install --save typeorm-dynamodb
```

## Initializing the datasource
In dynamodb we don't really "open" a connection.  However, we will need to read in all the entities so TypeORM knows about them.

There are two easy ways to initialized TypeORM.

### datasourceManager.open
```typescript
import { datasourceManager } from 'typeorm-dynamodb'
import { User } from '../entities/user.ts'

const run = async () => {
    await datasourceManager.open({
        entities: [User],
        synchronize: false // true will attempt to create tables
    })
    // now you can read / write to dynamodb
}

```

### datasourceInitializer ExpressJS middleware

```typescript
import express from 'express'
import { datasourceInitializer, environmentUtils, pageableRoutes } from 'typeorm-dynamodb'
import { User } from '../entities/user'

const app = express()
app.use(datasourceInitializer({
    entities: [User],
    synchronize: environmentUtils.isLocal()
}))
app.use(pageableRoutes)
// ... continue with Express configuration

```
#### In the above example I am creating the database tables if NODE_ENV=local
#### Also see how I am passing in the entities.  I've found this helps reduce the lambda cold start.

### pageableRoutes ExpressJS middleware

This will automatically parse query string parameters "page", "size" and "sort" and populate a req.pageable object.
You can pass pageable straight through to your findPage repository method to pull back a limited result set.

## Create an Entity

```typescript
import { Entity, PrimaryColumn, Column } from 'typeorm'
import { GlobalSecondaryIndex } from 'typeorm-dynamodb'

@Entity({ name: 'user' })
@GlobalSecondaryIndex({ name: 'ageIndex', partitionKey: 'age', sortKey: ['lastname','firstname'] })
export class User extends BaseEntity {
    @PrimaryColumn({ name: 'id', type: 'varchar' })
    id: string

    @Column({ name: 'firstname', type: 'varchar' })
    firstname: string

    @Column({ name: 'lastname', type: 'varchar' })
    lastname: string

    @Column({ name: 'age', type: 'varchar' })
    age: string
}

```

## Create a Repository (old Typeorm 0.2 way)

```typescript
import { EntityRepository } from 'typeorm'
import { PagingAndSortingRepository } from 'typeorm-repository'
import { User } from '../entities/user'

export class UserRepository extends PagingAndSortingRepository<User> {

}
```

## Create a Repository (new Typeorm 0.3 way)

```typescript
import { getRepository } from './datasource-manager'
import { DataSource } from 'typeorm/data-source/DataSource'

const repository = getRepository(User)
```

## CRUD Service Example

```typescript
import { User } from '../entities/user'
import { getRepository } from 'typeorm-dynamodb'

export class UserService {

    async get (id: string) {
        return getRepository(User).get(id)
    }

    async put (user: User) {
        await getRepository(User).put(user)
    }

    async delete (id: string) {
        await getRepository(User).delete({ id })
    }

    async findPage (criteria: any, pageable: Pageable) {
        const repository = getRepository(User)
        if (criteria.age) {
            return repository.findPage({
                index: 'ageIndex',
                where: {
                    age: criteria.age
                }
            }, pageable)
        }
        return repository.findPage({}, pageable)
    }
}
```

## GlobalSecondaryIndex

### Reading
In the User example the GlobalSecondaryIndex annotation allows you to use the dynamodb query method.  It's extremely important to 
use an index whenever you are querying to avoid full table scans.  

### Writing
When new records are written to the database a column will be populated automatically that will store the value needed by the index.
For example, the sort column ```["lastname","firstname"]``` will automatically populate a column "lastname#firstname" when the record is 
saved to the database.  Magic!

## DynamoDB Transactions

This package now supports DynamoDB transactions, allowing you to perform multiple operations atomically across multiple tables. All operations either succeed together or fail together, ensuring data consistency.

## Using Transactional Decorator
[typeorm-transactional](https://github.com/Aliheym/typeorm-transactional) is automatically initialized.  All you need to do is all the @Transactional() method decorator.

- Every service method that needs to be transactional, need to use the `@Transactional()` decorator
- The decorator can take a `connectionName` as argument (by default it is `default`) to specify [the data source ](#data-sources) to be user
- The decorator can take an optional `propagation` as argument to define the [propagation behaviour](#transaction-propagation)
- The decorator can take an optional `isolationLevel` as argument to define the [isolation level](#isolation-levels) (by default it will use your database driver's default isolation level)

```typescript
export class PostService {
  constructor(readonly repository: PostRepository)

  @Transactional() // Will open a transaction if one doesn't already exist
  async createPost(id, message): Promise<Post> {
    const post = this.repository.create({ id, message })
    return this.repository.save(post)
  }
}
```

### Basic Transaction Usage

```typescript
import { datasourceManager } from 'typeorm-dynamodb'
import { User } from '../entities/user'
import { Order } from '../entities/order'

const performTransaction = async () => {
    const queryRunner = datasourceManager.connection.createQueryRunner()
    
    await queryRunner.startTransaction()
    try {
        // All these operations will be buffered and executed atomically
        await queryRunner.putOne('users', { 
            id: 'user-123', 
            name: 'Alice', 
            status: 'active' 
        })
        
        await queryRunner.putOne('orders', { 
            id: 'order-456', 
            userId: 'user-123', 
            total: 100.00,
            status: 'pending'
        })
        
        await queryRunner.deleteOne('cart', { userId: 'user-123' })
        
        // Execute all operations atomically
        await queryRunner.commitTransaction()
        console.log('Transaction completed successfully!')
        
    } catch (error) {
        await queryRunner.rollbackTransaction()
        console.error('Transaction failed:', error)
        throw error
    }
}
```

### Transaction with Entity Manager

You can also use transactions with the entity manager methods:

```typescript
import { getManager } from 'typeorm-dynamodb'
import { User } from '../entities/user'
import { Order } from '../entities/order'

const entityManagerTransaction = async () => {
    const manager = getManager()
    const queryRunner = manager.connection.createQueryRunner()
    
    await queryRunner.startTransaction()
    try {
        // Create entities
        const user = new User()
        user.id = 'user-123'
        user.name = 'Bob'
        user.status = 'active'
        
        const order = new Order()
        order.id = 'order-789'
        order.userId = 'user-123'
        order.total = 250.00
        
        // These operations use the transaction-aware query runner
        await manager.put(User, user)
        await manager.put(Order, order)
        
        // Update user status
        await manager.update(User, {
            where: { id: 'user-123' },
            setValues: { lastOrderDate: new Date().toISOString() }
        })
        
        await queryRunner.commitTransaction()
        console.log('Entity transaction completed!')
        
    } catch (error) {
        await queryRunner.rollbackTransaction()
        throw error
    }
}
```

### Supported Transaction Operations

The following operations participate in transactions when a transaction is active:

- **`putOne(tableName, item)`** - Insert a single item
- **`putMany(tableName, items)`** - Insert multiple items
- **`deleteOne(tableName, key)`** - Delete a single item
- **`deleteMany(tableName, keys)`** - Delete multiple items
- **`updateOne(tableName, key, updateExpression, values)`** - Update a single item
- **Entity Manager operations**: `put()`, `delete()`, `update()`

### Transaction Limitations

DynamoDB transactions have the following limitations:

- **Maximum 100 operations** per transaction
- **Cross-table support** - operations can span multiple tables
- **No read operations** in write transactions (use `TransactGetItems` separately)
- **Atomic execution** - all operations succeed or all fail

### Error Handling

```typescript
const handleTransactionErrors = async () => {
    const queryRunner = datasourceManager.connection.createQueryRunner()
    
    await queryRunner.startTransaction()
    try {
        // Add operations that might exceed the 100 operation limit
        for (let i = 0; i < 150; i++) {
            await queryRunner.putOne('items', { id: `item-${i}`, data: 'test' })
        }
        
        await queryRunner.commitTransaction()
        
    } catch (error) {
        await queryRunner.rollbackTransaction()
        
        if (error.message.includes('maximum 100 operations')) {
            console.error('Too many operations in transaction')
            // Handle by splitting into multiple transactions
        } else if (error.message.includes('Transaction failed')) {
            console.error('DynamoDB transaction failed:', error)
            // Handle DynamoDB-specific errors (conditional check failures, etc.)
        }
        
        throw error
    }
}
```

### Complex Transaction Example

```typescript
const complexTransaction = async () => {
    const queryRunner = datasourceManager.connection.createQueryRunner()
    
    await queryRunner.startTransaction()
    try {
        // Create user account
        await queryRunner.putOne('users', {
            id: 'user-123',
            email: 'alice@example.com',
            status: 'active',
            createdAt: new Date().toISOString()
        })
        
        // Create user profile
        await queryRunner.putOne('profiles', {
            userId: 'user-123',
            firstName: 'Alice',
            lastName: 'Johnson',
            preferences: { newsletter: true }
        })
        
        // Initialize user wallet
        await queryRunner.putOne('wallets', {
            userId: 'user-123',
            balance: 0.00,
            currency: 'USD'
        })
        
        // Create audit log entries
        const auditEntries = [
            { id: 'audit-1', action: 'USER_CREATED', userId: 'user-123', timestamp: Date.now() },
            { id: 'audit-2', action: 'PROFILE_CREATED', userId: 'user-123', timestamp: Date.now() },
            { id: 'audit-3', action: 'WALLET_CREATED', userId: 'user-123', timestamp: Date.now() }
        ]
        await queryRunner.putMany('audit_logs', auditEntries)
        
        // Clean up temporary data
        await queryRunner.deleteMany('temp_registrations', [
            { registrationId: 'temp-123' },
            { registrationId: 'temp-124' }
        ])
        
        await queryRunner.commitTransaction()
        console.log('Complex user registration transaction completed!')
        
    } catch (error) {
        await queryRunner.rollbackTransaction()
        console.error('User registration failed, all changes rolled back')
        throw error
    }
}
```

### Best Practices

1. **Keep transactions small** - Minimize the number of operations to improve performance
2. **Handle rollbacks** - Always wrap transactions in try/catch blocks
3. **Idempotent operations** - Design operations to be safely retryable
4. **Batch related changes** - Group logically related operations together
5. **Monitor limits** - Stay well under the 100 operation limit per transaction

### Migration from Non-Transactional Code

Existing code will continue to work without modification. To add transaction support:

```typescript
// Before (non-transactional)
await repository.put(user)
await repository.put(order)
await repository.delete(cart)

// After (transactional)
const queryRunner = connection.createQueryRunner()
await queryRunner.startTransaction()
try {
    await repository.put(user)      // Now participates in transaction
    await repository.put(order)     // Now participates in transaction  
    await repository.delete(cart)   // Now participates in transaction
    await queryRunner.commitTransaction()
} catch (error) {
    await queryRunner.rollbackTransaction()
    throw error
}
```
