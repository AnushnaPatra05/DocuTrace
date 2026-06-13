import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { prisma } from '../config/database'
import { AppError } from '../middleware/errorHandler'
import { DocumentStatus } from '../generated/prisma'

const computeChecksum = (filePath: string): string => {
  const buffer = fs.readFileSync(filePath)
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

export const uploadDocument = async (
  ownerId: string,
  file: Express.Multer.File,
  title: string
) => {
  const checksum = computeChecksum(file.path)

  const document = await prisma.document.create({
    data: {
      ownerId,
      title: title || file.originalname,
      fileKey: file.filename,
      fileSize: file.size,
      mimeType: file.mimetype,
      checksum,
      status: 'DRAFT',
      storageBackend: 'LOCAL',
    },
  })

  // Update analytics
  await prisma.documentAnalytics.update({
    where: { ownerId },
    data: { totalDocuments: { increment: 1 } },
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: ownerId,
      documentId: document.id,
      action: 'DOCUMENT_UPLOADED',
      actorEmail: '',
      metadata: { title: document.title, fileSize: file.size },
    },
  })

  return document
}

export const getUserDocuments = async (ownerId: string) => {
  return prisma.document.findMany({
    where: { ownerId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      fileSize: true,
      status: true,
      pageCount: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

export const getDocumentById = async (id: string, ownerId: string) => {
  const document = await prisma.document.findFirst({
    where: { id, ownerId, deletedAt: null },
  })
  if (!document) throw new AppError(404, 'Document not found')
  return document
}

export const deleteDocument = async (id: string, ownerId: string) => {
  const document = await prisma.document.findFirst({
    where: { id, ownerId, deletedAt: null },
  })
  if (!document) throw new AppError(404, 'Document not found')

  // Soft delete
  await prisma.document.update({
    where: { id },
    data: { deletedAt: new Date() },
  })

  // Update analytics
  await prisma.documentAnalytics.update({
    where: { ownerId },
    data: { totalDocuments: { decrement: 1 } },
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: ownerId,
      documentId: id,
      action: 'DOCUMENT_DELETED',
      actorEmail: '',
      metadata: { title: document.title },
    },
  })
}

export const archiveDocument = async (id: string, ownerId: string) => {
  const document = await prisma.document.findFirst({
    where: { id, ownerId, deletedAt: null },
  })
  if (!document) throw new AppError(404, 'Document not found')
  if (document.status === 'ARCHIVED') {
    throw new AppError(400, 'Document is already archived')
  }

  const updated = await prisma.document.update({
    where: { id },
    data: { status: 'ARCHIVED' },
  })

  // Update analytics
  await prisma.documentAnalytics.update({
    where: { ownerId },
    data: { archivedCount: { increment: 1 } },
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: ownerId,
      documentId: id,
      action: 'DOCUMENT_ARCHIVED',
      actorEmail: '',
      metadata: { title: document.title },
    },
  })

  return updated
}

export const serveDocument = async (id: string, ownerId: string) => {
  const document = await prisma.document.findFirst({
    where: { id, ownerId, deletedAt: null },
  })
  if (!document) throw new AppError(404, 'Document not found')

  const filePath = path.join(process.cwd(), 'uploads', document.fileKey)
  if (!fs.existsSync(filePath)) {
    throw new AppError(404, 'File not found on disk')
  }

  return { filePath, document }
}

export const getAnalytics = async (ownerId: string) => {
  return prisma.documentAnalytics.findUnique({
    where: { ownerId },
  })
}