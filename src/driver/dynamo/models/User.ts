export class User {
    id: string
    name: string
    email: string

    static parse (req: any) {
        const user = new User()
        user.id = (req.user.id || req.user.client_id).toLowerCase()
        user.name = (req.user.givenName && req.user.surname) ? `${req.user.givenName} ${req.user.surname}` : req.user.id
        user.email = req.user.mail || ''
        return user
    }
}
