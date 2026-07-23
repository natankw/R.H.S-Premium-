import { Response } from 'express'
import { prisma } from '../server'
import { AuthRequest } from '../middleware/auth'
import { StatsService } from '../services/StatsService'

const statsService = new StatsService()

export class StatsController {
  async getDashboard(req: AuthRequest, res: Response) {
    try {
      const stats = await statsService.getDashboardStats(req.user.id)
      res.json(stats)
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar estatísticas do dashboard' })
    }
  }

  async getDevices(req: AuthRequest, res: Response) {
    try {
      const stats = await statsService.getDeviceStats(req.user.id)
      res.json(stats)
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar estatísticas dos dispositivos' })
    }
  }
}
