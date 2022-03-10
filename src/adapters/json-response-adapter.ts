import { camelCaseAdapter } from './camel-case-adapter'
import { commonUtils } from '@lmig/legal-nodejs-utils'

const DEFAULT_OPTIONS = {
    booleanIndicators: true,
    top1: false,
    includeNull: false,
    exclude: [],
    stringIds: true,
    transformers: []
}

export class JsonResponseOptions {
    booleanIndicators: boolean
    top1: boolean
    includeNull: boolean
    exclude: string[]
    stringIds: boolean
    transformers?: any[]
    static getDefault (options: any): JsonResponseOptions {
        return commonUtils.mixin(DEFAULT_OPTIONS, options)
    }
}

export const jsonResponseAdapter = {

    convert (rows?: Array<any>, options?: any): any {
        options = JsonResponseOptions.getDefault(options)
        rows = rows || []
        return options.top1 ? jsonResponseAdapter.firstRow(rows, options) : jsonResponseAdapter.allRows(rows, options)
    },

    firstRow (rows: Array<any>, options?: any): any {
        if (rows.length > 1) {
            throw Error(`Single result expected ... ${rows.length} found.`)
        }
        return rows.length > 0 ? jsonResponseAdapter.toJson(rows[0], options) : null
    },

    allRows (rows: Array<any>, options?: JsonResponseOptions): Array<any> {
        options = JsonResponseOptions.getDefault(options)
        return jsonResponseAdapter._allRows(rows, options)
    },

    _allRows (rows: Array<any>, options: JsonResponseOptions): Array<any> {
        return rows.map(row => {
            let item = jsonResponseAdapter.toJson(row, options)
            if (options.transformers) {
                options.transformers.forEach(transformer => {
                    item = transformer.transform(item)
                })
            }
            return item
        })
    },

    toJson (row: any, options: JsonResponseOptions): Array<any> {
        const item: any = {}
        for (const key in row) {
            if (Object.prototype.hasOwnProperty.call(row, key)) {
                let propertyName = camelCaseAdapter.convert(key)
                if (!options.exclude.includes(propertyName)) {
                    let propertyValue = row[key]
                    if (propertyValue || options.includeNull) {
                        if (options.booleanIndicators && (key.endsWith('_IND') || key.endsWith('_INDICATOR'))) {
                            propertyValue = propertyValue === 'Y'
                            propertyName = propertyName.substring(0, propertyName.length - 3)
                        }
                        if (propertyValue && options.stringIds && key.endsWith('_ID')) {
                            propertyValue = `${propertyValue}`
                        }
                        item[propertyName] = propertyValue
                    }
                }
            }
        }
        return item
    }

}
