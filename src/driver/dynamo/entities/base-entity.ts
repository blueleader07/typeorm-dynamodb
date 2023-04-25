import { Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { YesNoIndicatorTransformer } from '../../../transformers/yes-no-indicator-transformer'

export class BaseEntity {
    @Column({ name: 'deleted', type: 'varchar2', transformer: new YesNoIndicatorTransformer() })
    deleted: boolean;

    @Column({ name: 'deletedDate', type: 'date' })
    deletedDate: Date;

    @Column({ name: 'createdBy', type: 'varchar2' })
    createdBy: string;

    @CreateDateColumn({ name: 'created', type: 'timestamp' })
    created: Date;

    @Column({ name: 'modifiedBy', type: 'varchar2' })
    modifiedBy: string;

    @UpdateDateColumn({ name: 'modified', type: 'timestamp' })
    modified: Date;

    // primary key
    id: string | number;
}
