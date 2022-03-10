export const camelCaseAdapter = {

    convert (text: string) : any {
        let arr = text.split('_')
        arr = arr.map((item, index) => index ? item.charAt(0).toUpperCase() + item.slice(1).toLowerCase() : item.toLowerCase())
        return arr.join('')
    }

}
