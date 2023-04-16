export const commonUtils = {

    isEmpty (object: any) {
        if (Array.isArray(object)) {
            return object === null || object.length === 0
        }
        return typeof object === 'undefined' || object === null || object === '' || JSON.stringify(object) === '{}'
    },

    isNotEmpty (object: any) {
        if (Array.isArray(object)) {
            return object !== null && object.length > 0
        }
        return typeof object !== 'undefined' && object !== null && object !== '' && JSON.stringify(object) !== '{}'
    },

    mixin (target: any, source: any) {
        target = target || {}
        for (const key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
                target[key] = source[key]
            }
        }
        return target
    },

    trimAll (source: any): any {
        for (const key in source) {
            source[key] = typeof source[key] === 'string' ? source[key].trim() : source[key]
        }
        return source
    },

    findItemById (itemId: string, items: Array<string>) {
        return this.findItemByProperty('id', itemId, items)
    },

    findItemByProperty (propertyName: string, propertyValue: string, items: Array<any>) {
        if (this.isNotEmpty(propertyName) && this.isNotEmpty(propertyValue) && this.isNotEmpty(items)) {
            for (let i = 0; i < items.length; i++) {
                const item = items[i]
                if (propertyValue === item[propertyName]) {
                    return item
                }
            }
        }
        return {}
    },

    findItemIndexById (itemId: string, items: Array<any>) {
        if (this.isNotEmpty(itemId)) {
            for (let i = 0; i < items.length; i++) {
                const item = items[i]
                if (itemId === item.id) {
                    return i
                }
            }
        }
        return -1
    }

}
