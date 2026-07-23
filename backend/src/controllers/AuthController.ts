import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { prisma } from '../server'
import { AuthRequest } from '../middleware/auth'

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body

      const user = await prisma.user.findUnique({
        where: { email },
        include: { settings: true }
      })

      if (!user) {
        return res.status(401).json({ error: 'Credenciais inválidas' })
      }

      const validPassword = await bcrypt.compare(password, user.password)

      if (!validPassword) {
        return res.status(401).json({ error: 'Credenciais inválidas' })
      }

      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      )

      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      })

      await prisma.session.create({
        data: {
          token,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      })

      const { password: _, ...userWithoutPassword } = user

      res.json({
        user: userWithoutPassword,
        token
      })
    } catch (error) {
      res.status(500).json({ error: 'Erro ao fazer login' })
    }
  }

  async register(req: Request, res: Response) {
    try {
      const { username, email, password, fullName } = req.body

      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { username }
          ]
        }
      })

      if (existingUser) {
        return res.status(400).json({ error: 'Usuário ou email já existe' })
      }

      const hashedPassword = await bcrypt.hash(password, 10)

      const user = await prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          fullName,
          settings: {
            create: {}
          }
        },
        include: {
          settings: true
        }
      })

      const { password: _, ...userWithoutPassword } = user

      res.status(201).json(userWithoutPassword)
    } catch (error) {
      res.status(500).json({ error: 'Erro ao registrar usuário' })
    }
  }

  async profile(req: AuthRequest, res: Response) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          settings: true,
          _count: {
            select: {
              devices: true,
              groups: true,
              automations: true
            }
          }
        }
      })

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' })
      }

      const { password: _, ...userWithoutPassword } = user

      res.json(userWithoutPassword)
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar perfil' })
    }
  }
  }
