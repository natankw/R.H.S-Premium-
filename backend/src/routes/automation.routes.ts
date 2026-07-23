import { Router } from 'express'
import { AutomationController } from '../controllers/AutomationController'
import { authMiddleware } from '../middleware/auth'

const router = Router()
const automationController = new AutomationController()

router.get('/', authMiddleware, automationController.list)
router.post('/', authMiddleware, automationController.create)
router.put('/:id', authMiddleware, automationController.update)
router.delete('/:id', authMiddleware, automationController.delete)
router.post('/:id/run', authMiddleware, automationController.run)

export default router
