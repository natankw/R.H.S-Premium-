import { Response } from 'express'
import { prisma } from '../server'
import { AuthRequest } from '../middleware/auth'

export class AutomationController {
  async list(req: AuthRequest, res: Response) {
    try {
      const automations = await prisma.automation.findMany({
        where: { userId: req.user.id },
        include: {
          group: true
        }
      })

      res.json({ data: automations })
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar automações' })
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const { name, description, flow, schedule, groupId } = req.body

      const automation = await prisma.automation.create({
        data: {
          name,
          description,
          flow,
          schedule,
          groupId,
          userId: req.user.id
        }
      })

      await prisma.log.create({
        data: {
          level: 'INFO',
          message: `Automação ${name} criada`,
          userId: req.user.id
        }
      })

      res.status(201).json(automation)
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar automação' })
    }
  }

  async run(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params

      const automation = await prisma.automation.findFirst({
        where: {
          id,
          userId: req.user.id
        }
      })

      if (!automation) {
        return res.status(404).json({ error: 'Automação não encontrada' })
      }

      // Simular execução
      const updated = await prisma.automation.update({
        where: { id },
        data: {
          lastRun: new Date(),
          nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      })

      await prisma.log.create({
        data: {
          level: 'INFO',
          message: `Automação ${automation.name} executada`,
          userId: req.user.id,
          automationId: automation.id
        }
      })

      res.json({
        success: true,
        message: `Automação ${automation.name} executada com sucesso`,
        data: updated
      })
    } catch (error) {
      res.status(500).json({ error: 'Erro ao executar automação' })
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params
      const { name, description, flow, schedule, enabled, groupId } = req.body

      const automation = await prisma.automation.findFirst({
        where: {
          id,
          userId: req.user.id
        }
      })

      if (!automation) {
        return res.status(404).json({ error: 'Automação não encontrada' })
      }

      const updated = await prisma.automation.update({
        where: { id },
        data: {
          name,
          description,
          flow,
          schedule,
          enabled,
          groupId
        }
      })

      res.json(updated)
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar automação' })
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params

      const automation = await prisma.automation.findFirst({
        where: {
          id,
          userId: req.user.id
        }
      })

      if (!automation) {
        return res.status(404).json({ error: 'Automação não encontrada' })
      }

      await prisma.automation.delete({
        where: { id }
      })

      res.status(204).send()
    } catch (error) {
      res.status(500).json({ error: 'Erro ao excluir automação' })
    }
  }
  }
