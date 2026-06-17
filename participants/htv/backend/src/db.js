import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../generated/prisma/client.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dbPath = join(__dirname, '../../data.db')

// O adapter @prisma/adapter-libsql v7.x recebe um objeto de config (com url),
// não uma instância pré-criada do libsql client
const adapter = new PrismaLibSql({ url: `file:${dbPath}` })
const prisma = new PrismaClient({ adapter })

export default prisma