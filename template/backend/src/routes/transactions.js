import { v4 as uuidv4 } from 'uuid'
import prisma from '../db.js'

// ============================================================
// TODO: Implementar as regras de negocio aqui!
//
// Bandeiras e taxas:
//   4 = visa (2.5%), 5 = mastercard (3%), 3 = amex (3.5%), 6 = elo (4%)
//   Outro = rejeitar 422
//
// Parcelas e juros:
//   1x = sem juros
//   2x-6x = 2% ao mes (composto)
//   7x-12x = 4% ao mes (composto)
//   Formula: total = amount * (1 + taxa)^parcelas
//   Cada parcela = Math.ceil(total / parcelas)
//   Minimo por parcela: R$10 (1000 centavos) senao 422
//
// Limite diario:
//   R$5.000 (500000 centavos) por card_last4 por dia
//   So conta approved. declined e refunded nao contam.
//   CUIDADO: race condition! Usar transacao do Prisma.
//
// Idempotencia:
//   Se idempotency_key ja existe, retornar a transacao existente (200)
//   Se nao existe, criar nova (201)
//
// Cartao 9999:
//   Cartoes comecando com 9999 = status declined (salvar no banco)
//
// Estorno:
//   So pode estornar approved -> refunded
//   Nao pode estornar duas vezes
//   Devolver ao saldo e liberar limite diario
// ============================================================

const BRANDS = {
  '3': { name: 'amex', fee: 0.035 },
  '4': { name: 'visa', fee: 0.025 },
  '5': { name: 'mastercard', fee: 0.03 },
  '6': { name: 'elo', fee: 0.04 },
}

function getBrand(cardNumber) {
  return BRANDS[cardNumber[0]] || null
}

function calculateInterest(amountCents, installments) {
  if (installments === 1) return amountCents
  const rate = installments <= 6 ? 0.02 : 0.04
  return Math.ceil(amountCents * Math.pow(1 + rate, installments))
}

// TODO: Implementar validacoes de campos
// TODO: Implementar checagem de limite diario com transacao do Prisma
// TODO: Implementar idempotencia
// TODO: Implementar logica de declined para cartao 9999

export default async function (fastify) {

  // POST /api/transactions -- criar transacao
  fastify.post('/transactions', async (req, reply) => {
    // TODO: implementar
    reply.code(501).send({ error: 'Nao implementado ainda!' })
  })

  // GET /api/transactions/:id -- consultar transacao
  fastify.get('/transactions/:id', async (req, reply) => {
    const tx = await prisma.transaction.findUnique({
      where: { id: req.params.id },
    })
    if (!tx) return reply.code(404).send({ error: 'Transacao nao encontrada' })
    return formatTransaction(tx)
  })

  // GET /api/transactions?page=1&limit=10 -- listar com paginacao
  fastify.get('/transactions', async (req) => {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10))
    const skip = (page - 1) * limit

    const [data, total] = await Promise.all([
      prisma.transaction.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.transaction.count(),
    ])

    return {
      data: data.map(formatTransaction),
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    }
  })

  // POST /api/transactions/:id/refund -- estornar transacao
  fastify.post('/transactions/:id/refund', async (req, reply) => {
    // TODO: implementar com protecao contra double refund
    // Dica: UPDATE ... WHERE id = ? AND status = 'approved'
    reply.code(501).send({ error: 'Nao implementado ainda!' })
  })
}

// Formata a transacao do Prisma para o formato da API
function formatTransaction(tx) {
  return {
    id: tx.id,
    idempotency_key: tx.idempotencyKey,
    status: tx.status,
    card_last4: tx.cardLast4,
    card_brand: tx.cardBrand,
    holder_name: tx.holderName,
    amount_cents: tx.amountCents,
    installments: tx.installments,
    installment_amount: tx.installmentAmount,
    total_with_interest: tx.totalWithInterest,
    fee_cents: tx.feeCents,
    net_amount: tx.netAmount,
    description: tx.description,
    created_at: tx.createdAt.toISOString(),
  }
}
