import { Response } from 'express'
import { prisma } from '../server'
import { AuthRequest } from '../middleware/auth'
import { v4 as uuidv4 } from 'uuid'

export class DeviceController {
  async list(req: AuthRequest, res: Response) {
    try {
      const { page = 1, limit = 20, status, groupId, search } = req.query
      const skip = (Number(page) - 1) * Number(limit)

      const where: any = {
        userId: req.user.id
      }

      if (status) where.status = status
      if (groupId) where.groupId = groupId
      if (search) {
        where.OR = [
          { name: { contains: search as string } },
          { model: { contains: search as string } },
          { manufacturer: { contains: search as string } },
          { androidId: { contains: search as string } },
          { imei: { contains: search as string } }
        ]
      }

      const [devices, total] = await Promise.all([
        prisma.device.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            group: true,
            proxy: true
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.device.count({ where })
      ])

      res.json({
        data: devices,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      })
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar dispositivos' })
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const {
        name,
        model,
        manufacturer,
        androidVersion,
        ram,
        cpu,
        storage,
        resolution,
        groupId,
        proxyId,
        tags = []
      } = req.body

      const device = await prisma.device.create({
        data: {
          name,
          model,
          manufacturer,
          androidVersion,
          ram: Number(ram),
          cpu,
          storage: Number(storage),
          resolution,
          fingerprint: uuidv4(),
          androidId: uuidv4(),
          imei: `IMEI-${Date.now()}`,
          serialNumber: `SN-${Date.now()}`,
          tags,
          groupId,
          proxyId,
          userId: req.user.id,
          status: 'OFFLINE'
        },
        include: {
          group: true,
          proxy: true
        }
      })

      await prisma.log.create({
        data: {
          level: 'INFO',
          message: `Dispositivo ${name} criado`,
          details: { deviceId: device.id },
          userId: req.user.id,
          deviceId: device.id
        }
      })

      res.status(201).json(device)
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar dispositivo' })
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params
      const data = req.body

      const device = await prisma.device.findFirst({
        where: {
          id,
          userId: req.user.id
        }
      })

      if (!device) {
        return res.status(404).json({ error: 'Dispositivo não encontrado' })
      }

      const updated = await prisma.device.update({
        where: { id },
        data,
        include: {
          group: true,
          proxy: true
        }
      })

      res.json(updated)
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar dispositivo' })
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params

      const device = await prisma.device.findFirst({
        where: {
          id,
          userId: req.user.id
        }
      })

      if (!device) {
        return res.status(404).json({ error: 'Dispositivo não encontrado' })
      }

      await prisma.device.delete({
        where: { id }
      })

      res.status(204).send()
    } catch (error) {
      res.status(500).json({ error: 'Erro ao excluir dispositivo' })
    }
  }

  async clone(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params

      const original = await prisma.device.findFirst({
        where: {
          id,
          userId: req.user.id
        },
        include: {
          group: true,
          proxy: true
        }
      })

      if (!original) {
        return res.status(404).json({ error: 'Dispositivo não encontrado' })
      }

      const cloned = await prisma.device.create({
        data: {
          name: `${original.name} (Clone)`,
          model: original.model,
          manufacturer: original.manufacturer,
          androidVersion: original.androidVersion,
          fingerprint: uuidv4(),
          androidId: uuidv4(),
          imei: `IMEI-${Date.now()}`,
          serialNumber: `SN-${Date.now()}`,
          ram: original.ram,
          cpu: original.cpu,
          storage: original.storage,
          resolution: original.resolution,
          tags: original.tags,
          groupId: original.groupId,
          proxyId: original.proxyId,
          userId: req.user.id,
          status: 'OFFLINE'
        }
      })

      res.status(201).json(cloned)
    } catch (error) {
      res.status(500).json({ error: 'Erro ao clonar dispositivo' })
    }
  }

  async start(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params

      const device = await prisma.device.findFirst({
        where: {
          id,
          userId: req.user.id
        }
      })

      if (!device) {
        return res.status(404).json({ error: 'Dispositivo não encontrado' })
      }

      const updated = await prisma.device.update({
        where: { id },
        data: {
          status: 'ONLINE',
          lastActivity: new Date()
        }
      })

      await prisma.log.create({
        data: {
          level: 'INFO',
          message: `Dispositivo ${device.name} iniciado`,
          userId: req.user.id,
          deviceId: device.id
        }
      })

      res.json(updated)
    } catch (error) {
      res.status(500).json({ error: 'Erro ao iniciar dispositivo' })
    }
  }

  async stop(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params

      const device = await prisma.device.findFirst({
        where: {
          id,
          userId: req.user.id
        }
      })

      if (!device) {
        return res.status(404).json({ error: 'Dispositivo não encontrado' })
      }

      const updated = await prisma.device.update({
        where: { id },
        data: {
          status: 'OFFLINE'
        }
      })

      await prisma.log.create({
        data: {
          level: 'INFO',
          message: `Dispositivo ${device.name} parado`,
          userId: req.user.id,
          deviceId: device.id
        }
      })

      res.json(updated)
    } catch (error) {
      res.status(500).json({ error: 'Erro ao parar dispositivo' })
    }
  }
  }
