import { Response } from 'express'
import { prisma } from '../server'
import { AuthRequest } from '../middleware/auth'
import multer from 'multer'
import fs from 'fs'
import path from 'path'

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads/files'
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`)
  }
})

export const upload = multer({ storage })

export class FileController {
  async list(req: AuthRequest, res: Response) {
    try {
      const { deviceId, folder } = req.query

      const where: any = { userId: req.user.id }
      if (deviceId) where.deviceId = deviceId
      if (folder) where.path = { startsWith: folder as string }

      const files = await prisma.file.findMany({
        where,
        include: {
          device: true
        },
        orderBy: { createdAt: 'desc' }
      })

      res.json({ data: files })
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar arquivos' })
    }
  }

  async upload(req: AuthRequest, res: Response) {
    try {
      const { deviceId, folder = '/' } = req.body
      const file = (req as any).file

      if (!file) {
        return res.status(400).json({ error: 'Arquivo não enviado' })
      }

      const newFile = await prisma.file.create({
        data: {
          name: file.originalname,
          path: `${folder}/${file.originalname}`,
          size: file.size,
          type: file.mimetype,
          deviceId,
          userId: req.user.id
        }
      })

      await prisma.log.create({
        data: {
          level: 'INFO',
          message: `Arquivo ${file.originalname} enviado`,
          userId: req.user.id,
          deviceId
        }
      })

      res.status(201).json(newFile)
    } catch (error) {
      res.status(500).json({ error: 'Erro ao enviar arquivo' })
    }
  }

  async download(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params

      const file = await prisma.file.findFirst({
        where: {
          id,
          userId: req.user.id
        }
      })

      if (!file) {
        return res.status(404).json({ error: 'Arquivo não encontrado' })
      }

      const filePath = path.join('./uploads/files', path.basename(file.path))
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Arquivo físico não encontrado' })
      }

      res.download(filePath, file.name)
    } catch (error) {
      res.status(500).json({ error: 'Erro ao baixar arquivo' })
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params

      const file = await prisma.file.findFirst({
        where: {
          id,
          userId: req.user.id
        }
      })

      if (!file) {
        return res.status(404).json({ error: 'Arquivo não encontrado' })
      }

      const filePath = path.join('./uploads/files', path.basename(file.path))
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }

      await prisma.file.delete({
        where: { id }
      })

      res.status(204).send()
    } catch (error) {
      res.status(500).json({ error: 'Erro ao excluir arquivo' })
    }
  }

  async rename(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params
      const { newName } = req.body

      const file = await prisma.file.findFirst({
        where: {
          id,
          userId: req.user.id
        }
      })

      if (!file) {
        return res.status(404).json({ error: 'Arquivo não encontrado' })
      }

      const updated = await prisma.file.update({
        where: { id },
        data: { name: newName }
      })

      res.json(updated)
    } catch (error) {
      res.status(500).json({ error: 'Erro ao renomear arquivo' })
    }
  }
        }
