import { Request, Response, NextFunction } from 'express'
import * as DocumentService from '../services/document.service'
import { AppError } from '../middleware/errorHandler'

export const uploadDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) throw new AppError(400, 'No file uploaded')
    const { title } = req.body
    const document = await DocumentService.uploadDocument(
      req.user!.userId,
      req.file,
      title
    )
    res.status(201).json({ status: 'success', data: document })
  } catch (err) {
    next(err)
  }
}

export const getDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const documents = await DocumentService.getUserDocuments(req.user!.userId)
    res.status(200).json({ status: 'success', data: documents })
  } catch (err) {
    next(err)
  }
}

export const getDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const document = await DocumentService.getDocumentById(
      String(req.params.id),
      req.user!.userId
    )
    res.status(200).json({ status: 'success', data: document })
  } catch (err) {
    next(err)
  }
}

export const viewDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filePath, document } = await DocumentService.serveDocument(
      String(req.params.id),
      req.user!.userId
    )
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${document.title}.pdf"`)
    res.sendFile(filePath)
  } catch (err) {
    next(err)
  }
}

export const deleteDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await DocumentService.deleteDocument(String(req.params.id), req.user!.userId)
    res.status(200).json({ status: 'success', message: 'Document deleted' })
  } catch (err) {
    next(err)
  }
}

export const archiveDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const document = await DocumentService.archiveDocument(String(req.params.id), req.user!.userId)
    res.status(200).json({ status: 'success', data: document })
  } catch (err) {
    next(err)
  }
}

export const getAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const analytics = await DocumentService.getAnalytics(req.user!.userId)
    res.status(200).json({ status: 'success', data: analytics })
  } catch (err) {
    next(err)
  }
}