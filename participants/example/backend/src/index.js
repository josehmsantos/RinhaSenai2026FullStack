import path from 'path'
import { fileURLToPath } from 'url'
import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import prisma from './db.js'
import transactionsRoutes from './routes/transactions.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fastify = Fastify({ logger: true })

// Rotas da API
fastify.register(transactionsRoutes, { prefix: '/api' })

// Health check
fastify.get('/api/health', async () => ({ status: 'ok' }))

// Balance
fastify.get('/api/balance', async () => {
  const approved = await prisma.transaction.aggregate({
    where: { status: 'approved' },
    _sum: { netAmount: true },
    _count: true,
  })
  const declined = await prisma.transaction.count({ where: { status: 'declined' } })
  const refunded = await prisma.transaction.count({ where: { status: 'refunded' } })

  return {
    balance_cents: approved._sum.netAmount ?? 0,
    total_approved: approved._count,
    total_declined: declined,
    total_refunded: refunded,
  }
})

// Frontend: arquivos estaticos do build do Vite
fastify.register(fastifyStatic, {
  root: path.join(__dirname, '../../frontend/dist'),
  wildcard: false,
})

// SPA fallback: qualquer rota que nao seja /api/* devolve index.html
fastify.setNotFoundHandler((req, reply) => {
  if (req.url.startsWith('/api/')) {
    reply.code(404).send({ error: 'Rota nao encontrada' })
  } else {
    reply.sendFile('index.html')
  }
})

// Graceful shutdown
const shutdown = async () => {
  await prisma.$disconnect()
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

// Start
try {
  await fastify.listen({ port: 3000, host: '0.0.0.0' })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}
