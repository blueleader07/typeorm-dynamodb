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
import { datasourceManager } from './datasource-manager'
import { DataSource } from 'typeorm/data-source/DataSource'

const repository = datasourceManager.getRepository(User)
```

## CRUD Service Example

```typescript
import { UserRepository } from '../repositories/user-repository'
import { User } from '../entities/user'
import { datasourceManager } from 'typeorm-dynamodb'

export class UserService {

    async get (id: string) {
        const repository = datasourceManager.getCustomRepository(UserRepository, User)
        return repository.get(id)
    }

    async put (user: User) {
        const repository = datasourceManager.getCustomRepository(UserRepository, User)
        await repository.put(user)
    }

    async delete (id: string) {
        const repository = datasourceManager.getCustomRepository(UserRepository, User)
        await repository.delete({ id })
    }

    async findPage (criteria: any, pageable: Pageable) {
        if (criteria.age) {
            const repository = datasourceManager.getCustomRepository(UserRepository, User)
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

