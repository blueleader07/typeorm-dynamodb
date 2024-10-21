export const splitOperators = (text: string) => {
    if (text) {
        return text.trim().split(/=|<>|<|<=|>|>=/gi)
    }
    return []
}
