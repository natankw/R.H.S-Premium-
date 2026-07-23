import { Router } from 'express'
import { AppController, upload } from '../controllers/AppController'
import { authMiddleware } from '../middleware/auth'

const router = Router()
const appController = new AppController()

router.get('/', authMiddleware, appController.list)
router.post('/upload', authMiddleware, upload.single('apk'), appController.uploadApk)
router.post('/:id/install', authMiddleware, appController.install)
router.post('/:id/uninstall', authMiddleware, appController.uninstall)
router.delete('/:id', authMiddleware, appController.delete)

export default router
