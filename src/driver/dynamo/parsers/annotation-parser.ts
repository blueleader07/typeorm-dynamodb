const removeSpaces = (text: string) => {
    let inside = 0
    const s = text.replace(/\n/g, '')
     
    return s.replace(/ +|"/g, (m: string) => m === '"' ? (inside ^= 1, '"') : inside ? m : '')
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
            return x[1]
        }
    })
    annotations = annotations.map(annotation => {
         
        return eval('(' + annotation + ')')
    })
    return annotations.filter(annotation => {
        return annotation.name !== '@Id'
    })
}
