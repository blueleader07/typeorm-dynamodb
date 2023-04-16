import { ValueTransformer } from 'typeorm'
import { BigNumber } from 'bignumber.js'

export class BigNumberTransformer implements ValueTransformer {
    from (value: string): BigNumber {
        return new BigNumber(value)
    }

    to (value: BigNumber) {
        return value ? value.toString() : null
    }
}
