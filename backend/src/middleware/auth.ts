import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../server'

export interface AuthRequest extends Request {
  user?: any
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { settings: true }
    })

    if (!user || !user.active) {
      return res.status(401).json({ error: 'Usuário não encontrado ou inativo' })
    }

    req.user = user
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' })
  }
      }
