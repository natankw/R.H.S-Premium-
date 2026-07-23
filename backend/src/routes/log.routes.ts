import { Router } from 'express'
import { LogController } from '../controllers/LogController'
import { authMiddleware } from '../middleware/auth'

const router = Router()
const logController = new LogController()

router.get('/', authMiddleware, logController.list)
router.delete('/clear', authMiddleware, logController.clear)

export default router
