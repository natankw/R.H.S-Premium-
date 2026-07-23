import { Response } from 'express'
import { prisma } from '../server'
import { AuthRequest } from '../middleware/auth'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads/apks'
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

export class AppController {
  async list(req: AuthRequest, res: Response) {
    try {
      const { deviceId } = req.query

      const where: any = {}
      if (deviceId) where.deviceId = deviceId

      const apps = await prisma.application.findMany({
        where,
        include: {
          device: true
        }
      })

      res.json({ data: apps })
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar aplicativos' })
    }
  }

  async uploadApk(req: AuthRequest, res: Response) {
    try {
      const { deviceId, name, packageName, version } = req.body
      const file = (req as any).file

      if (!file) {
        return res.status(400).json({ error: 'Arquivo APK não enviado' })
      }

      const app = await prisma.application.create({
        data: {
          name,
          packageName,
          version,
          apkPath: file.path,
          size: file.size,
          deviceId,
          installed: true
        }
      })

      await prisma.log.create({
        data: {
          level: 'INFO',
          message: `APK ${name} instalado no dispositivo ${deviceId}`,
          userId: req.user.id,
          deviceId
        }
      })

      res.status(201).json(app)
    } catch (error) {
      res.status(500).json({ error: 'Erro ao fazer upload do APK' })
    }
  }

  async install(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params
      const { deviceId } = req.body

      const app = await prisma.application.findFirst({
        where: {
          id,
          device: {
            userId: req.user.id
          }
        }
      })

      if (!app) {
        return res.status(404).json({ error: 'Aplicativo não encontrado' })
      }

      const updated = await prisma.application.update({
        where: { id },
        data: {
          installed: true,
          deviceId
        }
      })

      await prisma.log.create({
        data: {
          level: 'INFO',
          message: `Aplicativo ${app.name} instalado`,
          userId: req.user.id,
          deviceId
        }
      })

      res.json(updated)
    } catch (error) {
      res.status(500).json({ error: 'Erro ao instalar aplicativo' })
    }
  }

  async uninstall(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params

      const app = await prisma.application.findFirst({
        where: {
          id,
          device: {
            userId: req.user.id
          }
        }
      })

      if (!app) {
        return res.status(404).json({ error: 'Aplicativo não encontrado' })
      }

      const updated = await prisma.application.update({
        where: { id },
        data: { installed: false }
      })

      await prisma.log.create({
        data: {
          level: 'INFO',
          message: `Aplicativo ${app.name} desinstalado`,
          userId: req.user.id
        }
      })

      res.json(updated)
    } catch (error) {
      res.status(500).json({ error: 'Erro ao desinstalar aplicativo' })
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params

      const app = await prisma.application.findFirst({
        where: {
          id,
          device: {
            userId: req.user.id
          }
        }
      })

      if (!app) {
        return res.status(404).json({ error: 'Aplicativo não encontrado' })
      }

      // Remover arquivo APK
      if (fs.existsSync(app.apkPath)) {
        fs.unlinkSync(app.apkPath)
      }

      await prisma.application.delete({
        where: { id }
      })

      res.status(204).send()
    } catch (error) {
      res.status(500).json({ error: 'Erro ao excluir aplicativo' })
    }
  }
                }
