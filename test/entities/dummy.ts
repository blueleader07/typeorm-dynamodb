import { BaseEntity, Entity, PrimaryColumn } from 'typeorm'

@Entity({ name: 'dummy_t' })
export class Dummy extends BaseEntity {
    @PrimaryColumn({ name: 'id', type: 'varchar' })
    id: string

    // in dynamodb  we don't need to map all columns
    name: string
}
