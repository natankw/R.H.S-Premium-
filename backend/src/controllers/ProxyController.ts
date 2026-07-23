import { Response } from 'express'
import { prisma } from '../server'
import { AuthRequest } from '../middleware/auth'

export class ProxyController {
  async list(req: AuthRequest, res: Response) {
    try {
      const proxies = await prisma.proxy.findMany({
        where: { userId: req.user.id },
        include: {
          _count: {
            select: { devices: true }
          }
        }
      })

      res.json({ data: proxies })
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar proxies' })
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const { host, port, username, password, type } = req.body

      const proxy = await prisma.proxy.create({
        data: {
          host,
          port: Number(port),
          username,
          password,
          type,
          userId: req.user.id
        }
      })

      await prisma.log.create({
        data: {
          level: 'INFO',
          message: `Proxy ${host}:${port} criado`,
          userId: req.user.id
        }
      })

      res.status(201).json(proxy)
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar proxy' })
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params
      const { host, port, username, password, type, active } = req.body

      const proxy = await prisma.proxy.findFirst({
        where: {
          id,
          userId: req.user.id
        }
      })

      if (!proxy) {
        return res.status(404).json({ error: 'Proxy não encontrado' })
      }

      const updated = await prisma.proxy.update({
        where: { id },
        data: {
          host,
          port: Number(port),
          username,
          password,
          type,
          active
        }
      })

      res.json(updated)
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar proxy' })
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params

      const proxy = await prisma.proxy.findFirst({
        where: {
          id,
          userId: req.user.id
        }
      })

      if (!proxy) {
        return res.status(404).json({ error: 'Proxy não encontrado' })
      }

      await prisma.proxy.delete({
        where: { id }
      })

      res.status(204).send()
    } catch (error) {
      res.status(500).json({ error: 'Erro ao excluir proxy' })
    }
  }

  async test(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params

      const proxy = await prisma.proxy.findFirst({
        where: {
          id,
          userId: req.user.id
        }
      })

      if (!proxy) {
        return res.status(404).json({ error: 'Proxy não encontrado' })
      }

      // Simular teste de proxy
      const startTime = Date.now()
      // Aqui você pode implementar uma verificação real
      const latency = Math.floor(Math.random() * 100) + 50
      const isWorking = true

      await prisma.proxy.update({
        where: { id },
        data: { lastTest: new Date() }
      })

      res.json({
        working: isWorking,
        latency,
        host: proxy.host,
        port: proxy.port
      })
    } catch (error) {
      res.status(500).json({ error: 'Erro ao testar proxy' })
    }
  }
  }
