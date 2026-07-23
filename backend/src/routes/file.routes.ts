import { Router } from 'express'
import { FileController, upload } from '../controllers/FileController'
import { authMiddleware } from '../middleware/auth'

const router = Router()
const fileController = new FileController()

router.get('/', authMiddleware, fileController.list)
router.post('/upload', authMiddleware, upload.single('file'), fileController.upload)
router.get('/:id/download', authMiddleware, fileController.download)
router.put('/:id/rename', authMiddleware, fileController.rename)
router.delete('/:id', authMiddleware, fileController.delete)

export default router
