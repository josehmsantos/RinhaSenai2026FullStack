import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Configura PRAGMAs do SQLite para performance e concorrencia
await prisma.$executeRawUnsafe('PRAGMA journal_mode = WAL')
await prisma.$executeRawUnsafe('PRAGMA busy_timeout = 5000')
await prisma.$executeRawUnsafe('PRAGMA synchronous = NORMAL')

export default prisma
