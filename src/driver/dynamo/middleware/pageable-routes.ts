import { Pageable } from '../models/Pageable'

export const pageableRoutes = async (req: any, res: any, next: any) => {
    req.pageable = Pageable.parse(req)
    next()
}
