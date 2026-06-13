import { Router } from 'express'
import { authenticate } from '../middleware/authenticate'
import { upload } from '../config/storage'
import {
  uploadDocument,
  getDocuments,
  getDocument,
  viewDocument,
  deleteDocument,
  archiveDocument,
  getAnalytics,
} from '../controllers/document.controller'

const router = Router()

// All document routes require authentication
router.use(authenticate)

router.post('/upload', upload.single('file'), uploadDocument)
router.get('/', getDocuments)
router.get('/analytics', getAnalytics)
router.get('/:id', getDocument)
router.get('/:id/view', viewDocument)
router.delete('/:id', deleteDocument)
router.patch('/:id/archive', archiveDocument)

export default router