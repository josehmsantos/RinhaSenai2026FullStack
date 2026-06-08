import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Configura PRAGMAs do SQLite para performance e concorrencia
await prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL')
await prisma.$queryRawUnsafe('PRAGMA busy_timeout = 5000')
await prisma.$queryRawUnsafe('PRAGMA synchronous = NORMAL')

export default prisma
