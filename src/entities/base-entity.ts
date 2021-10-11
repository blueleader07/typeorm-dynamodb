import { Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { YesNoIndicatorTransformer } from '../transformers/yes-no-indicator-transformer'

export class BaseEntity {
    @Column({ name: 'DLT_IND', type: 'varchar2', transformer: new YesNoIndicatorTransformer() })
    deleted: boolean;

    @Column({ name: 'DLT_DT', type: 'date' })
    deletedDate: Date;

    @Column({ name: 'CRTD_BY_NM', type: 'varchar2' })
    createdBy: string;

    @CreateDateColumn({ name: 'CRTD_TS', type: 'timestamp' })
    created: Date;

    @Column({ name: 'MOD_BY_NM', type: 'varchar2' })
    modifiedBy: string;

    @UpdateDateColumn({ name: 'MOD_TS', type: 'timestamp' })
    modified: Date;

    // primary key
    id: string | number;
}
