const removeQuotes = (text: string) => {
    if (text) {
        text = text.replace(/"/g, '')
    }
    return text
}

const removeSpaces = (text: string) => {
    let inside = 0
    const s = text.replace(/\n/g, '')
    // eslint-disable-next-line no-return-assign
    return s.replace(/ +|"/g, (m: string) => m === '"' ? (inside ^= 1, '"') : inside ? m : '')
}

const parseKeyValues = (attribute: string, jsonColumn: any) => {
    const keyValues = attribute.split(/\s*=\s*/)
    for (let i = 0; i < keyValues.length; i++) {
        if (i % 2 === 0) {
            const key = removeQuotes(keyValues[i])
            jsonColumn[key] = removeQuotes(keyValues[i + 1])
        }
    }
    return jsonColumn
}

export const parseAnnotations = (file: string, ...names: string[]) => {
    const pipeSeparatedNames = names.length > 1 ? `${names.join('|')}` : names[0]
    const regex = new RegExp(`@${pipeSeparatedNames}\\((.*?)\\)`, 'g')
    const fileWithoutSpaces = removeSpaces(file)
    const matches = fileWithoutSpaces.matchAll(regex)
    // TODO: determine which annotations are ids
    let annotations = Array.from(matches, (x: any, index: number) => {
        const annotation = x[0]
        if (annotation === '@Id') {
            return `name=@Id,index=${index}`
        } else {
            const annotationAttributes = x[1]
            return annotationAttributes
        }
    })
    const isId = false
    annotations = annotations.map(annotation => {
        // eslint-disable-next-line no-eval
        return eval('(' + annotation + ')')
    })
    return annotations.filter(annotation => {
        return annotation.name !== '@Id'
    })
}
