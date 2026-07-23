import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { PrismaClient } from '@prisma/client'
import Redis from 'ioredis'
import authRoutes from './routes/auth.routes'
import deviceRoutes from './routes/device.routes'
import groupRoutes from './routes/group.routes'
import proxyRoutes from './routes/proxy.routes'
import automationRoutes from './routes/automation.routes'
import appRoutes from './routes/app.routes'
import fileRoutes from './routes/file.routes'
import logRoutes from './routes/log.routes'
import statsRoutes from './routes/stats.routes'

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
})

export const prisma = new PrismaClient()
export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
})

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
})

app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))
app.use(express.json())
app.use(limiter)

app.use('/api/auth', authRoutes)
app.use('/api/devices', deviceRoutes)
app.use('/api/groups', groupRoutes)
app.use('/api/proxies', proxyRoutes)
app.use('/api/automation', automationRoutes)
app.use('/api/apps', appRoutes)
app.use('/api/files', fileRoutes)
app.use('/api/logs', logRoutes)
app.use('/api/stats', statsRoutes)

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)
  socket.on('subscribe', (userId: string) => {
    socket.join(`user:${userId}`)
  })
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
