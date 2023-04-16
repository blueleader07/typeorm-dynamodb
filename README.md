# typeorm-dynamodb

To get started using NPM, you can use the following commands:

```
npm install
npm test
```

To get started using Yarn, you can use the following commands:
```
yarn
yarn test
```

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

## Create a Repository

```typescript
import { EntityRepository } from 'typeorm'
import { PagingAndSortingRepository } from 'typeorm-repository'
import { User } from '../entities/user'

@EntityRepository(User)
export class UserRepository extends PagingAndSortingRepository<User> {

}
```

## CRUD Service Example

```typescript
import { UserRepository } from '../repositories/user-repository'
import { User } from '../entities/user'
import { datasourceManager } from 'typeorm-dynamodb'

export class UserService {

    async get (id: string) {
        const repository = datasourceManager.getCustomRepository(UserRepository)
        return repository.get(id)
    }

    async put (user: User) {
        const repository = datasourceManager.getCustomRepository(UserRepository)
        await repository.put(user)
    }

    async delete (id: string) {
        const repository = datasourceManager.getCustomRepository(UserRepository)
        await repository.delete({ id })
    }

    async findPage (criteria: any, pageable: Pageable) {
        if (criteria.age) {
            const repository = datasourceManager.getCustomRepository(UserRepository)
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
