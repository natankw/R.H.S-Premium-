import { Response } from 'express'
import { prisma } from '../server'
import { AuthRequest } from '../middleware/auth'

export class LogController {
  async list(req: AuthRequest, res: Response) {
    try {
      const { page = 1, limit = 50, level, deviceId, startDate, endDate } = req.query
      const skip = (Number(page) - 1) * Number(limit)

      const where: any = { userId: req.user.id }
      if (level) where.level = level
      if (deviceId) where.deviceId = deviceId
      if (startDate) where.createdAt = { gte: new Date(startDate as string) }
      if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate as string) }

      const [logs, total] = await Promise.all([
        prisma.log.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            device: true,
            automation: true
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.log.count({ where })
      ])

      res.json({
        data: logs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      })
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar logs' })
    }
  }

  async clear(req: AuthRequest, res: Response) {
    try {
      await prisma.log.deleteMany({
        where: { userId: req.user.id }
      })

      res.json({ message: 'Logs removidos com sucesso' })
    } catch (error) {
      res.status(500).json({ error: 'Erro ao limpar logs' })
    }
  }
                           }
