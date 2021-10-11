import { ValueTransformer } from 'typeorm'
export class YesNoIndicatorTransformer implements ValueTransformer {
    from (value: string): boolean {
        return value === 'Y'
    }

    to (value: boolean): string {
        return value === true ? 'Y' : 'N'
    }
}
