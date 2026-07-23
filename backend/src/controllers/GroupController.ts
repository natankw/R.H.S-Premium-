import { Response } from 'express'
import { prisma } from '../server'
import { AuthRequest } from '../middleware/auth'

export class GroupController {
  async list(req: AuthRequest, res: Response) {
    try {
      const groups = await prisma.group.findMany({
        where: { userId: req.user.id },
        include: {
          _count: {
            select: { devices: true }
          }
        }
      })

      res.json({ data: groups })
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar grupos' })
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const { name, description } = req.body

      const group = await prisma.group.create({
        data: {
          name,
          description,
          userId: req.user.id
        }
      })

      await prisma.log.create({
        data: {
          level: 'INFO',
          message: `Grupo ${name} criado`,
          userId: req.user.id
        }
      })

      res.status(201).json(group)
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar grupo' })
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params
      const { name, description } = req.body

      const group = await prisma.group.findFirst({
        where: {
          id,
          userId: req.user.id
        }
      })

      if (!group) {
        return res.status(404).json({ error: 'Grupo não encontrado' })
      }

      const updated = await prisma.group.update({
        where: { id },
        data: { name, description }
      })

      res.json(updated)
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar grupo' })
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params

      const group = await prisma.group.findFirst({
        where: {
          id,
          userId: req.user.id
        }
      })

      if (!group) {
        return res.status(404).json({ error: 'Grupo não encontrado' })
      }

      await prisma.group.delete({
        where: { id }
      })

      res.status(204).send()
    } catch (error) {
      res.status(500).json({ error: 'Erro ao excluir grupo' })
    }
  }
        }
