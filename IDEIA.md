# Rinha FullStack SENAI 2026

## O que e?

Uma competicao de programacao para times de alunos do ensino medio onde cada time
implementa um **gateway de pagamento fake** (backend Node.js + SQLite, frontend
React + Vite). Sem Docker, sem infra complicada. Os alunos aprendem a contribuir
via Pull Request em um repo open source real.

O bench e **auto-auditavel**: insere transacoes em massa pelo frontend, sobe a
carga progressivamente, abre varias abas ao mesmo tempo, e depois navega o
historico paginado para verificar que TUDO esta la -- com as regras de negocio
aplicadas corretamente.

---

## Stack obrigatoria

- **Backend**: Node.js com ESM modules (`"type": "module"`)
- **Framework HTTP**: Fastify (o template ja vem com Fastify)
- **ORM / Banco**: Prisma com SQLite (schema declarativo, migrations automaticas)
- **Frontend**: React com Vite
- **Linguagem**: JavaScript ou TypeScript (o time escolhe)
- Existe uma pasta `template/` com o setup minimo pronto -- o time copia e
  implementa as regras de negocio

---

## Regras gerais

- Cada time faz um **fork** deste repo e abre um **PR** com sua solucao
- A solucao fica dentro de `participantes/<nome-do-time>/`
- Pode ser escrito em **JavaScript ou TypeScript** (o time escolhe)
- A pasta DEVE conter `info.json` e `package.json` (detalhes abaixo)
- O banco SQLite e criado automaticamente ao iniciar (arquivo local, sem instalar nada)
- Nao e permitido usar Docker

### package.json -- npm workspaces

O projeto usa **npm workspaces**: um `package.json` raiz que aponta para as
pastas `backend/` e `frontend/`. Cada uma tem seu proprio `package.json` com
suas dependencias. Um unico `npm install` na raiz resolve tudo.

O CI roda exatamente esses comandos na raiz da pasta do time:

```bash
npm install          # instala deps do back e do front via workspaces
npm run build        # builda o React (gera frontend/dist/)
npm start            # sobe o backend na porta 3000 servindo tudo
```

#### package.json raiz (o contrato)

```json
{
  "name": "rinha-nome-do-time",
  "private": true,
  "workspaces": ["backend", "frontend"],
  "scripts": {
    "build": "npm run build --workspace=frontend",
    "start": "npm start --workspace=backend"
  }
}
```

O aluno roda tudo da raiz. Nunca precisa entrar nas subpastas pra dar install.

| Comando na raiz | O que acontece | Requisito |
|----------------|---------------|-----------|
| `npm install` | Instala deps de back + front via workspaces | < 2 min |
| `npm run build` | Executa `vite build` no workspace frontend | Gera `frontend/dist/` |
| `npm start` | Executa `prisma db push` + `node src/index.js` no backend | Porta 3000 em < 30s |

#### backend/package.json

```json
{
  "name": "backend",
  "type": "module",
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:setup": "npm run db:generate && npm run db:push",
    "start": "npm run db:setup && node src/index.js"
  },
  "dependencies": {
    "fastify": "^5.0.0",
    "@fastify/static": "^8.0.0",
    "@prisma/client": "^6.0.0",
    "uuid": "^11.0.0"
  },
  "devDependencies": {
    "prisma": "^6.0.0"
  }
}
```

O script `start` faz **tudo automaticamente**: gera o client do Prisma, cria/atualiza
o banco SQLite, e sobe o servidor. Nenhum passo manual.

Se o time usar **TypeScript**, basta trocar `node src/index.js` por `tsx src/index.ts`
e adicionar `tsx` + `typescript` nas deps.

#### frontend/package.json

```json
{
  "name": "frontend",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.28.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^6.0.0"
  }
}
```

---

### Arquitetura: uma porta so, sem proxy

O backend serve **tudo** na porta **3000**:
- `/api/*` -- rotas da API REST
- `/*` -- arquivos estaticos do frontend (o `dist/` gerado pelo Vite build)

```
Browser -> localhost:3000/api/transactions -> backend (API)
Browser -> localhost:3000/                 -> backend serve index.html
Browser -> localhost:3000/history          -> backend serve index.html (SPA fallback)
Browser -> localhost:3000/assets/main.js   -> backend serve arquivo estatico
```

**Sem proxy, sem CORS, sem dois processos.** Um processo, uma porta.

O aluno aprende a servir SPA com fallback para `index.html` em rotas que
nao sao `/api/*` -- exatamente como aplicacoes reais em producao.

#### Exemplo: backend Fastify servindo o frontend

```js
import path from 'path'
import { fileURLToPath } from 'url'
import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fastify = Fastify({ logger: true })

// API
fastify.register(transactionsRoutes, { prefix: '/api' })
fastify.get('/api/health', async () => ({ status: 'ok' }))

// Frontend: arquivos estaticos do build do Vite
fastify.register(fastifyStatic, {
  root: path.join(__dirname, '../../frontend/dist'),
  wildcard: false,
})

// SPA fallback: qualquer rota que nao seja /api/* retorna index.html
// (necessario para React Router funcionar com /history, /transaction/:id)
fastify.setNotFoundHandler((req, reply) => {
  if (req.url.startsWith('/api/')) {
    reply.code(404).send({ error: 'Rota nao encontrada' })
  } else {
    reply.sendFile('index.html')
  }
})

await fastify.listen({ port: 3000, host: '0.0.0.0' })
```

### info.json (obrigatorio)

Cada time DEVE criar um `info.json` na raiz da sua pasta com os dados dos
membros. O CI valida esse arquivo antes de rodar o bench -- se estiver faltando
ou mal formatado, o PR falha.

```json
{
  "team": "os-cabulosos",
  "members": [
    { "name": "Joao Silva", "github": "@joaosilva" },
    { "name": "Maria Santos", "github": "@mariasantos" },
    { "name": "Pedro Lima", "github": "@pedrolima" }
  ]
}
```

**Regras do info.json:**
- `team` deve bater com o nome da pasta
- `members` deve ter pelo menos 1 membro
- Cada membro precisa de `name` (nome real) e `github` (com @)
- O `github` e usado para mencionar os membros no comentario do PR e no RESULTS.md

---

## Regras de negocio do gateway

O gateway fake simula um processador de pagamentos com regras reais. O bench
valida que TODAS as regras foram aplicadas corretamente nas transacoes inseridas.

### Bandeiras de cartao

O primeiro digito do `card_number` define a bandeira e a **taxa** cobrada:

| Primeiro digito | Bandeira | Taxa |
|----------------|----------|------|
| 4 | Visa | 2.5% |
| 5 | Mastercard | 3.0% |
| 3 | Amex | 3.5% |
| 6 | Elo | 4.0% |
| Qualquer outro | Desconhecida | rejeitar (HTTP 422) |

A taxa e calculada sobre o `amount_cents` e armazenada junto com a transacao.
Exemplo: pagamento de R$100,00 (10000 centavos) com Visa = taxa de R$2,50
(250 centavos). O `net_amount` (valor liquido) e `amount_cents - fee_cents`.

### Parcelas (installments)

O pagamento pode ser parcelado de 1x a 12x:

| Parcelas | Regra |
|----------|-------|
| 1x | Sem juros |
| 2x a 6x | Juros de 2% ao mes (composto sobre o total) |
| 7x a 12x | Juros de 4% ao mes (composto sobre o total) |

Formula: `total_with_interest = amount_cents * (1 + taxa_juros) ^ parcelas`

Cada parcela = `total_with_interest / installments` (arredondado para cima)

**Restricao**: valor minimo por parcela e **R$10,00** (1000 centavos).
Se `total_with_interest / installments < 1000` = HTTP 422.

### Limite diario por cartao

Cada cartao (identificado pelos `card_last4`) tem um **limite diario de
R$5.000,00** (500000 centavos) em transacoes aprovadas. Se a soma das
transacoes aprovadas do dia para aquele `card_last4` + a nova transacao
ultrapassar o limite = HTTP 422 com mensagem informando o limite.

### Status da transacao

| Cenario | Status |
|---------|--------|
| Cartao comeca com `9999` | `declined` |
| Limite diario excedido | `declined` |
| Bandeira desconhecida | HTTP 422 (nem cria transacao) |
| Parcela abaixo do minimo | HTTP 422 |
| Campos invalidos | HTTP 422 |
| Tudo ok | `approved` |

Transacoes com status `declined` SAO salvas no banco (aparecem no historico)
mas NAO contam no saldo nem no limite diario.

### Estorno

- So pode estornar transacoes com status `approved`
- Status muda para `refunded`
- O valor e devolvido ao saldo (subtrai do saldo)
- O valor e devolvido ao limite diario (libera espaco)
- Nao pode estornar duas vezes a mesma transacao

---

## O que o time precisa implementar

### Backend -- API REST

| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/api/transactions` | Cria uma transacao |
| GET | `/api/transactions/:id` | Consulta uma transacao pelo ID |
| GET | `/api/transactions?page=1&limit=10` | Lista transacoes com paginacao |
| POST | `/api/transactions/:id/refund` | Estorna uma transacao |
| GET | `/api/balance` | Retorna saldo atual |
| GET | `/api/health` | Retorna `{ "status": "ok" }` |

#### POST /api/transactions -- body

```json
{
  "idempotency_key": "uuid-gerado-pelo-frontend",
  "card_number": "4111111111111111",
  "holder_name": "Joao Silva",
  "expiration": "12/28",
  "cvv": "123",
  "amount_cents": 15000,
  "installments": 3,
  "description": "Camiseta SENAI"
}
```

#### POST /api/transactions -- resposta (201)

```json
{
  "id": "uuid-gerado",
  "status": "approved",
  "card_last4": "1111",
  "card_brand": "visa",
  "holder_name": "Joao Silva",
  "amount_cents": 15000,
  "installments": 3,
  "installment_amount": 5305,
  "total_with_interest": 15916,
  "fee_cents": 375,
  "net_amount": 14625,
  "description": "Camiseta SENAI",
  "created_at": "2026-06-06T12:00:00Z"
}
```

#### GET /api/transactions?page=2&limit=10 -- resposta (200)

```json
{
  "data": [
    {
      "id": "uuid",
      "status": "approved",
      "card_last4": "1111",
      "card_brand": "visa",
      "holder_name": "Joao Silva",
      "amount_cents": 15000,
      "installments": 3,
      "installment_amount": 5305,
      "total_with_interest": 15916,
      "fee_cents": 375,
      "net_amount": 14625,
      "description": "Camiseta SENAI",
      "created_at": "2026-06-06T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 2,
    "limit": 10,
    "total": 57,
    "total_pages": 6
  }
}
```

#### GET /api/balance -- resposta (200)

```json
{
  "balance_cents": 1462500,
  "total_approved": 150,
  "total_declined": 12,
  "total_refunded": 3
}
```

#### Validacoes de campos

- `idempotency_key` obrigatorio, deve ser UUID valido, UNIQUE no banco
  - Se ja existe transacao com esse key, retorna a transacao existente (HTTP 200, nao 201)
- `amount_cents` deve ser > 0 e <= 1000000 (R$10.000,00)
- `card_number` deve ter exatamente 16 digitos numericos
- `cvv` deve ter 3 ou 4 digitos numericos
- `holder_name` nao pode estar vazio, max 50 caracteres, sem tags HTML
- `expiration` formato MM/YY, nao pode estar vencido
- `installments` inteiro de 1 a 12 (default 1 se nao informado)
- `description` obrigatoria, max 100 caracteres
- Campo faltando ou invalido = HTTP 422 + mensagem de erro
- `card_number` **nunca** e retornado inteiro na API -- so `card_last4`
- Paginacao: `page` default 1, `limit` default 10, max 100

#### Banco de dados -- Prisma + SQLite (auto-init)

O banco e gerenciado pelo **Prisma**. O schema fica em `backend/prisma/schema.prisma`
e o banco e criado/atualizado automaticamente no `npm start` (via `prisma db push`).

Nenhum passo manual -- o CI faz `npm start` e tudo esta pronto.

**Schema Prisma (`backend/prisma/schema.prisma`):**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:../../data.db"
}

model Transaction {
  id                 String   @id @default(uuid())
  idempotencyKey     String   @unique @map("idempotency_key")
  status             String   // approved, declined, refunded
  cardLast4          String   @map("card_last4")
  cardBrand          String   @map("card_brand")
  holderName         String   @map("holder_name")
  amountCents        Int      @map("amount_cents")
  installments       Int      @default(1)
  installmentAmount  Int      @map("installment_amount")
  totalWithInterest  Int      @map("total_with_interest")
  feeCents           Int      @map("fee_cents")
  netAmount          Int      @map("net_amount")
  description        String
  createdAt          DateTime @default(now()) @map("created_at")

  @@index([cardLast4, createdAt], name: "idx_card_date")
  @@index([status], name: "idx_status")
  @@index([createdAt(sort: Desc)], name: "idx_created")
  @@map("transactions")
}
```

**Conexao com PRAGMAs (`backend/src/db.js`):**

```js
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// PRAGMAs do SQLite para performance e concorrencia
await prisma.$executeRawUnsafe('PRAGMA journal_mode = WAL')
await prisma.$executeRawUnsafe('PRAGMA busy_timeout = 5000')
await prisma.$executeRawUnsafe('PRAGMA synchronous = NORMAL')

export default prisma
```

**Como funciona o auto-init:**
1. `npm start` roda `prisma generate` (gera o client)
2. Depois roda `prisma db push` (cria/atualiza o banco + tabelas + indices)
3. Depois sobe o servidor com `node src/index.js`
4. O `db.js` configura os PRAGMAs na primeira conexao

**O arquivo `data.db` vai no `.gitignore`.**
O bench **deleta** o `data.db` antes de cada execucao para garantir banco limpo.

**Dica para os alunos**: sem os PRAGMAs (WAL mode, busy timeout), o sistema vai
travar com escritas concorrentes a partir da rodada 2 do stress test. Os indices
sao criados pelo Prisma automaticamente (definidos no `@@index` do schema).

---

### Frontend -- React + Vite

O frontend usa React com React Router (ou equivalente) para navegacao entre
paginas. O benchmark usa **classes CSS** para localizar elementos, preencher
inputs, clicar botoes e validar dados automaticamente via Playwright.

**Liberdade total de design**: layout, cores, animacoes, libs de UI (MUI,
Tailwind, Chakra, shadcn, o que quiser). So precisa garantir que as classes
CSS estejam nos elementos corretos.

Pode ser JavaScript (.jsx) ou TypeScript (.tsx) -- o time escolhe.

#### Rotas do frontend

Tudo na **porta 3000** (servido pelo backend). React Router faz o client-side
routing. O backend tem SPA fallback (retorna `index.html` para qualquer rota
que nao seja `/api/*`).

| URL no browser | Rota React | Pagina |
|---------------|------------|--------|
| `http://localhost:3000/` | `/` | Dashboard (form + saldo) |
| `http://localhost:3000/history?page=1&limit=10` | `/history` | Historico paginado |
| `http://localhost:3000/transaction/abc-123` | `/transaction/:id` | Detalhe da transacao |

O bench navega diretamente para essas URLs -- nao clica em links para chegar la.
Se o SPA fallback nao estiver configurado no backend, o bench recebe 404 ao
acessar `/history` direto e o time perde pontos.

---

#### Pagina `/` -- Dashboard

Tudo que o bench precisa encontrar nesta pagina:

**Formulario de pagamento:**

| Elemento | Classe CSS | Tag HTML | Notas |
|----------|-----------|---------|-------|
| Input numero do cartao | `.input-card-number` | `<input>` | 16 digitos |
| Input nome do titular | `.input-holder-name` | `<input>` | Texto |
| Input validade | `.input-expiration` | `<input>` | Formato MM/YY |
| Input CVV | `.input-cvv` | `<input>` | 3-4 digitos |
| Input valor em centavos | `.input-amount` | `<input>` | Inteiro > 0 |
| Select parcelas | `.select-installments` | `<select>` | Options de 1 a 12 |
| Input descricao | `.input-description` | `<input>` | Texto |
| Botao pagar | `.btn-pay` | `<button>` | Envia POST /api/transactions |

O frontend DEVE gerar um `idempotency_key` (UUID v4) automaticamente a cada
submit e enviar no body. O usuario nao preenche esse campo.

**Feedback apos submit:**

| Elemento | Classe CSS | Tag HTML | Quando aparece |
|----------|-----------|---------|---------------|
| Mensagem de sucesso | `.feedback-success` | `<div>` | Apos transacao approved |
| Mensagem de erro | `.feedback-error` | `<div>` | Apos erro 422 ou declined |

O bench espera que **exatamente um** dos dois esteja visivel apos cada submit.
Escondido = `display: none` ou nao renderizado. O bench usa
`waitForSelector('.feedback-success:visible')` ou `.feedback-error:visible`.

**Resumo / Saldo:**

| Elemento | Classe CSS | Tag HTML | Conteudo esperado |
|----------|-----------|---------|------------------|
| Saldo liquido | `.display-balance` | qualquer | Valor em centavos (ex: `1462500`) |
| Total de aprovadas | `.display-total-approved` | qualquer | Numero inteiro (ex: `150`) |
| Total de recusadas | `.display-total-declined` | qualquer | Numero inteiro (ex: `12`) |
| Total de estornadas | `.display-total-refunded` | qualquer | Numero inteiro (ex: `3`) |

O bench le o `textContent` desses elementos e extrai o numero. Pode ter texto
junto (ex: "Saldo: R$ 14.625,00") mas o numero em centavos DEVE estar presente
como `data-value` no elemento:

```html
<span class="display-balance" data-value="1462500">R$ 14.625,00</span>
<span class="display-total-approved" data-value="150">150 aprovadas</span>
```

O bench usa `element.dataset.value` para ler os valores de forma confiavel.

---

#### Pagina `/history` -- Historico paginado

URL completa: `http://localhost:3000/history?page=1&limit=10`

**Query parameters:**

| Param | Default | Descricao |
|-------|---------|-----------|
| `page` | `1` | Pagina atual (comeca em 1) |
| `limit` | `10` | Itens por pagina (max 100) |

**Comportamento obrigatorio:**
- Acessar `/history?page=3&limit=20` deve mostrar a pagina 3 direto (deep link)
- Clicar nos botoes de navegacao deve mudar o `?page=` na URL
- O componente deve ler os query params da URL ao montar (useSearchParams)

**Elementos da lista:**

| Elemento | Classe CSS | Tag HTML | Conteudo |
|----------|-----------|---------|---------|
| Container da lista | `.list-transactions` | `<div>` / `<table>` | Contem todos os items |
| Cada transacao | `.transaction-item` | `<div>` / `<tr>` | Uma por transacao |

**Dentro de cada `.transaction-item`:**

| Elemento | Classe CSS | Tag HTML | `data-value` |
|----------|-----------|---------|-------------|
| ID | `.transaction-id` | `<span>` / `<td>` | UUID da transacao |
| Status | `.transaction-status` | `<span>` / `<td>` | `approved`, `declined`, ou `refunded` |
| Valor original | `.transaction-amount` | `<span>` / `<td>` | Centavos (ex: `15000`) |
| Bandeira | `.transaction-brand` | `<span>` / `<td>` | `visa`, `mastercard`, `amex`, `elo` |
| Parcelas | `.transaction-installments` | `<span>` / `<td>` | Numero (ex: `3`) |
| Valor da parcela | `.transaction-installment-amount` | `<span>` / `<td>` | Centavos (ex: `5305`) |
| Total com juros | `.transaction-total` | `<span>` / `<td>` | Centavos (ex: `15916`) |
| Taxa | `.transaction-fee` | `<span>` / `<td>` | Centavos (ex: `375`) |
| Descricao | `.transaction-description` | `<span>` / `<td>` | Texto livre |
| Ultimos 4 digitos | `.transaction-card` | `<span>` / `<td>` | 4 digitos (ex: `1111`) |
| Data | `.transaction-date` | `<span>` / `<td>` | ISO 8601 |
| Botao estorno | `.btn-refund` | `<button>` | Envia POST /api/transactions/:id/refund |

**Importante:** todos os elementos com valor numerico DEVEM ter `data-value`
com o valor bruto (em centavos ou numero inteiro). O texto visivel pode ser
formatado (R$ 150,00), mas o bench le `data-value` para validar.

Exemplo de item:
```html
<tr class="transaction-item">
  <td class="transaction-id" data-value="a1b2c3">a1b2c3</td>
  <td class="transaction-status" data-value="approved">Aprovada</td>
  <td class="transaction-amount" data-value="15000">R$ 150,00</td>
  <td class="transaction-brand" data-value="visa">Visa</td>
  <td class="transaction-installments" data-value="3">3x</td>
  <td class="transaction-installment-amount" data-value="5305">R$ 53,05</td>
  <td class="transaction-total" data-value="15916">R$ 159,16</td>
  <td class="transaction-fee" data-value="375">R$ 3,75</td>
  <td class="transaction-description" data-value="Camiseta SENAI">Camiseta SENAI</td>
  <td class="transaction-card" data-value="1111">**** 1111</td>
  <td class="transaction-date" data-value="2026-06-06T12:00:00Z">06/06/2026</td>
  <td><button class="btn-refund">Estornar</button></td>
</tr>
```

**Controles de paginacao:**

| Elemento | Classe CSS | Tag HTML | `data-value` |
|----------|-----------|---------|-------------|
| Pagina atual | `.pagination-current` | `<span>` | Numero da pagina (ex: `2`) |
| Total de paginas | `.pagination-pages` | `<span>` | Numero (ex: `87`) |
| Total de transacoes | `.pagination-total` | `<span>` | Numero (ex: `8694`) |
| Botao anterior | `.btn-prev-page` | `<button>` | `disabled` na pagina 1 |
| Botao proximo | `.btn-next-page` | `<button>` | `disabled` na ultima pagina |

---

#### Pagina `/transaction/:id` -- Detalhe da transacao

URL: `http://localhost:3000/transaction/a1b2c3-uuid`

Mostra todos os dados de uma transacao especifica. O bench acessa direto pela URL.

| Elemento | Classe CSS | Tag HTML | `data-value` |
|----------|-----------|---------|-------------|
| ID | `.detail-id` | qualquer | UUID |
| Status | `.detail-status` | qualquer | `approved` / `declined` / `refunded` |
| Valor original | `.detail-amount` | qualquer | Centavos |
| Bandeira | `.detail-brand` | qualquer | `visa` / `mastercard` / `amex` / `elo` |
| Nome do titular | `.detail-holder` | qualquer | Texto |
| Ultimos 4 digitos | `.detail-card` | qualquer | 4 digitos |
| Parcelas | `.detail-installments` | qualquer | Numero |
| Valor da parcela | `.detail-installment-amount` | qualquer | Centavos |
| Total com juros | `.detail-total` | qualquer | Centavos |
| Taxa | `.detail-fee` | qualquer | Centavos |
| Valor liquido | `.detail-net` | qualquer | Centavos |
| Descricao | `.detail-description` | qualquer | Texto |
| Data | `.detail-date` | qualquer | ISO 8601 |
| Botao estorno | `.btn-refund` | `<button>` | So visivel se status = approved |

---

#### Resumo: todas as classes CSS que o bench procura

```
PAGINA /
  .input-card-number        .input-holder-name
  .input-expiration         .input-cvv
  .input-amount             .select-installments
  .input-description        .btn-pay
  .feedback-success         .feedback-error
  .display-balance          .display-total-approved
  .display-total-declined   .display-total-refunded

PAGINA /history
  .list-transactions        .transaction-item
  .transaction-id           .transaction-status
  .transaction-amount       .transaction-brand
  .transaction-installments .transaction-installment-amount
  .transaction-total        .transaction-fee
  .transaction-description  .transaction-card
  .transaction-date         .btn-refund
  .pagination-current       .pagination-pages
  .pagination-total         .btn-prev-page
  .btn-next-page

PAGINA /transaction/:id
  .detail-id                .detail-status
  .detail-amount            .detail-brand
  .detail-holder            .detail-card
  .detail-installments      .detail-installment-amount
  .detail-total             .detail-fee
  .detail-net               .detail-description
  .detail-date              .btn-refund
```

---

## Desafios tecnicos (onde os alunos vao quebrar a cabeca)

A rinha e desenhada para forcar os alunos a descobrirem problemas reais de
banco de dados e concorrencia. Nao e so CRUD -- tem armadilha em cada esquina.

### 1. SQLite trava com escrita concorrente

SQLite so permite **uma escrita por vez**. Quando 5 abas mandam POST ao mesmo
tempo, o backend vai receber `SQLITE_BUSY` ou `SQLITE_LOCKED`.

**O que o aluno precisa aprender:**
- Ativar **WAL mode** (`PRAGMA journal_mode=WAL`) -- permite leitura durante escrita
- Tratar retry quando o banco estiver ocupado (busy timeout ou retry loop)
- O Prisma lanca `P2034` (transaction conflict) sob concorrencia -- tratar!
- Sem isso, na rodada 4+ o sistema comeca a perder transacoes ou retornar erro 500

### 2. Race condition no limite diario

O limite de R$5.000/dia por cartao tem uma armadilha classica:

```
Aba 1: SELECT SUM(amount) WHERE card_last4='1111' -> R$4.800 (cabe mais R$200)
Aba 2: SELECT SUM(amount) WHERE card_last4='1111' -> R$4.800 (cabe mais R$200)
Aba 1: INSERT R$300 -> aprova (total agora R$5.100 -- ERRADO)
Aba 2: INSERT R$300 -> aprova (total agora R$5.400 -- ERRADO)
```

**O que o aluno precisa aprender:**
- Usar **`prisma.$transaction`** com isolation level para garantir atomicidade
- Ou usar **serialization** no nivel da aplicacao (mutex/semaforo por card_last4)
- O bench manda propositalmente o MESMO cartao de abas diferentes para pegar isso

### 3. Idempotencia -- request duplicado

O bench manda a **mesma transacao** (mesmo body exato) de 2 abas ao mesmo tempo.
O sistema tem que criar **apenas uma** transacao, nao duas.

**Como resolver:**
- O frontend deve gerar um `idempotency_key` (UUID) antes de enviar
- O backend checa se ja existe transacao com aquele key antes de inserir
- Se ja existe, retorna a transacao existente (nao cria outra)
- O bench verifica no historico que nao ha duplicatas

**Campo extra no body:**
```json
{
  "idempotency_key": "uuid-gerado-pelo-frontend",
  "card_number": "4111111111111111",
  ...
}
```

O backend deve ter um UNIQUE constraint na coluna `idempotency_key`.

### 4. Estorno duplo (double refund)

O bench clica `.btn-refund` duas vezes rapido no mesmo item (de abas diferentes).
O sistema deve estornar **apenas uma vez**. A segunda tentativa deve retornar
erro ou ser ignorada.

**O que o aluno precisa aprender:**
- Checar o status DENTRO da transacao SQL antes de atualizar
- `UPDATE transactions SET status='refunded' WHERE id=? AND status='approved'`
  retorna 0 rows affected se ja foi estornado

### 5. Paginacao com dados mudando

Enquanto o bench navega o historico pagina por pagina, novas transacoes estao
sendo inseridas. A paginacao nao pode:
- Pular transacoes (uma transacao "sumiu" entre uma pagina e outra)
- Mostrar a mesma transacao duas vezes em paginas diferentes

**O que o aluno precisa aprender:**
- Paginar por cursor (ORDER BY created_at DESC, id DESC) em vez de OFFSET
- Ou aceitar que OFFSET tem esse problema e usar um snapshot (transacao SQL de leitura)

### 6. Performance com milhares de linhas

Na ultima fase o banco vai ter **10.000+** transacoes. Queries sem indice
vao ficar visivelmente lentas:

- `SELECT COUNT(*) FROM transactions` para o total da paginacao
- `SELECT * FROM transactions ORDER BY created_at DESC LIMIT 50 OFFSET 9950`
- `SELECT SUM(amount_cents) FROM transactions WHERE card_last4=? AND status='approved' AND DATE(created_at)=DATE('now')`

**O que o aluno precisa aprender:**
- Criar **indices** nas colunas usadas em WHERE/ORDER BY
- `CREATE INDEX idx_card_date ON transactions(card_last4, created_at)`
- `CREATE INDEX idx_status ON transactions(status)`
- `CREATE INDEX idx_created ON transactions(created_at DESC)`
- Sem indices, a rodada final vai ser extremamente lenta e o time perde todos
  os pontos de velocidade

---

## Sistema de pontuacao (100 pontos)

Tudo automatizado -- nenhuma avaliacao manual.

O bench tem **3 fases**: primeiro valida as regras pelo frontend, depois
bombardeia a API diretamente para testar volume e concorrencia, e no final
audita tudo pelo historico paginado.

### Como o bench funciona

#### Fase 1: Corretude via frontend (Playwright)

Insere **100 transacoes** pelo formulario (preenchendo inputs, clicando `.btn-pay`)
em **1 aba**. Usa dados controlados para validar que todas as regras de negocio
estao corretas: bandeiras, taxas, juros, parcelas, limite diario, declined, etc.

Depois navega o historico e confere cada campo de cada transacao.

#### Fase 2: Stress via API (bombardeio direto)

Escala progressiva direto na API (sem Playwright, puro HTTP):

```
Rodada 1:    500 txns,  10 workers concorrentes    (~500/s)
Rodada 2:  1.000 txns,  25 workers concorrentes  (~1.000/s)
Rodada 3:  2.000 txns,  50 workers concorrentes  (~2.000/s)
Rodada 4:  5.000 txns, 100 workers concorrentes  (~3.000/s+)
                         ^
              Teto: ~8.600 transacoes (+ 100 da fase 1)
```

Cada rodada mistura:
- **70%** transacoes validas normais (bandeiras e parcelas variadas)
- **10%** duplicatas propositais (mesmo `idempotency_key` enviado de 2+ workers)
- **10%** mesmo cartao repetido (para forcar race condition no limite diario)
- **5%** cartoes `9999` (declined)
- **5%** payloads invalidos (campos faltando, valores fora do range)

Entre as rodadas, o bench faz uma **bateria de estornos concorrentes**:
- Pega 20 transacoes approved e manda refund de **2 workers ao mesmo tempo**
  para cada uma (testa double refund)

#### Fase 3: Auditoria final via frontend (Playwright)

Apos o bombardeio, o bench abre o frontend e:

1. Verifica `.display-balance` -- o saldo tem que bater com a soma real
2. Verifica `.display-total-approved`, `.display-total-declined`, `.display-total-refunded`
3. Navega `/history?page=1&limit=100` e percorre TODAS as paginas
4. Coleta toda transacao e confere contra o que foi enviado
5. Verifica que duplicatas (mesmo idempotency_key) geraram **uma so** transacao
6. Verifica que limite diario nao foi furado (soma por card_last4 por dia <= R$5.000)
7. Verifica que nenhum estorno duplo aconteceu
8. Testa deep link direto: `/history?page=50&limit=100`

### 1. Regras de negocio (0-35 pontos)

Validado na fase 1 (100 txns pelo frontend) + conferido na auditoria final:

| Teste | Pontos |
|-------|--------|
| Bandeira correta baseada no primeiro digito | 4 |
| Taxa calculada corretamente por bandeira | 4 |
| Juros de parcelas calculados corretamente | 4 |
| Valor da parcela com arredondamento correto (Math.ceil) | 4 |
| `net_amount` = `amount_cents` - `fee_cents` | 3 |
| Cartao `9999` = `declined`, salvo no banco | 3 |
| `declined` nao conta no saldo | 3 |
| Limite diario R$5.000 aplicado corretamente | 4 |
| Bandeira invalida (digito 0,1,2,7,8,9) rejeitada HTTP 422 | 3 |
| Parcela abaixo do minimo R$10 rejeitada HTTP 422 | 3 |

### 2. Concorrencia e integridade (0-40 pontos)

O teste mais pesado. Validado na fase 2 (bombardeio) + auditoria final:

| Teste | Pontos |
|-------|--------|
| Zero transacao perdida (tudo que foi aprovado existe no historico) | 8 |
| Zero transacao fantasma (nada no historico que nao foi enviado) | 5 |
| Idempotencia: duplicatas geraram exatamente 1 transacao cada | 8 |
| Limite diario nunca furado sob concorrencia (soma <= R$5.000) | 8 |
| Zero estorno duplo (refund concorrente nao gerou 2 refunds) | 5 |
| Saldo final correto (approved - refunded, sem contar declined) | 3 |
| Paginacao consistente (sem itens repetidos ou pulados entre paginas) | 3 |

### 3. Velocidade (0-25 pontos)

Ranking comparativo entre todos os times:

| Metrica | Pontos |
|---------|--------|
| Throughput rodada 1 (txns/segundo com 10 workers) | 0-4 |
| Throughput rodada 2 (txns/segundo com 25 workers) | 0-5 |
| Throughput rodada 3 (txns/segundo com 50 workers) | 0-6 |
| Throughput rodada 4 (txns/segundo com 100 workers) | 0-7 |
| Tempo para percorrer historico completo paginado (~8.700 txns) | 0-3 |

O time com melhor throughput em cada rodada ganha nota maxima.
Se o sistema **cair** (retornar 500 ou parar de responder) durante
uma rodada = **0 na rodada e todas as seguintes**.

**Total: 100 pontos**

---

## Estrutura do repositorio

```
RinhaSenai2026FullStack/
├── IDEIA.md                 # este arquivo
├── README.md                # instrucoes para os times
├── LEADERBOARD.md           # top 10 (atualizado automaticamente na main)
├── RESULTS.md               # resultado de TODOS os times
├── .github/
│   └── workflows/
│       ├── pr-validate.yml  # valida PR (pasta certa, info.json, etc)
│       ├── pr-bench.yml     # roda bench a cada PR
│       └── main-rank.yml    # ao merge na main, recalcula ranking
├── bench/
│   ├── run.sh               # script principal
│   ├── test-rules.ts        # fase 1: 100 txns pelo frontend (Playwright)
│   ├── test-stress.ts       # fase 2: bombardeio API (httpx/workers)
│   ├── test-refund.ts       # fase 2b: estornos concorrentes
│   ├── test-audit.ts        # fase 3: auditoria final pelo frontend
│   ├── scoreboard.ts        # gera LEADERBOARD.md + RESULTS.md
│   └── playwright.config.ts
├── template/                  # SETUP MINIMO -- o time copia esta pasta
│   ├── info.json              # editar com dados do time
│   ├── package.json           # raiz: workspaces + scripts build/start
│   ├── .gitignore             # node_modules/, *.db, frontend/dist/
│   ├── backend/
│   │   ├── package.json       # fastify, @fastify/static, @prisma/client, uuid
│   │   ├── prisma/
│   │   │   └── schema.prisma  # schema do banco (Prisma + SQLite)
│   │   └── src/
│   │       ├── index.js       # Fastify + static + SPA fallback (porta 3000)
│   │       ├── db.js          # PrismaClient + PRAGMAs
│   │       └── routes/
│   │           └── transactions.js  # rotas com TODOs para implementar
│   └── frontend/
│       ├── package.json       # react, react-dom, react-router-dom
│       ├── index.html
│       ├── vite.config.js
│       └── src/
│           ├── main.jsx       # entrada com BrowserRouter
│           ├── App.jsx        # React Router (/, /history, /transaction/:id)
│           ├── pages/
│           │   ├── Dashboard.jsx   # form + saldo (com classes CSS)
│           │   ├── History.jsx     # lista paginada (com classes CSS)
│           │   └── Detail.jsx      # detalhe da transacao (com classes CSS)
│           └── components/
│               ├── PayForm.jsx          # formulario com .input-* e .btn-pay
│               ├── Balance.jsx          # saldo com .display-*
│               ├── TransactionList.jsx  # lista com .transaction-*
│               └── Pagination.jsx       # paginacao com .pagination-* e .btn-*
└── participantes/
    └── <nome-do-time>/        # copia do template/ com regras implementadas
        ├── info.json
        ├── package.json
        ├── .gitignore
        ├── backend/
        └── frontend/
```

---

## Fluxo do time (passo a passo)

1. Forme um time e escolham um nome (sem espacos, kebab-case: `os-cabulosos`)
2. **Fork** este repositorio no GitHub
3. **Clone** o fork: `git clone https://github.com/SEU-USER/RinhaSenai2026FullStack`
4. Crie a pasta `participantes/<nome-do-time>/`
5. Crie o `info.json` com nome e @github de cada membro
6. Copie a pasta `template/` para `participantes/<nome-do-time>/`
7. Edite o `info.json` e o `name` no `package.json` raiz
8. Implemente as regras de negocio nos TODOs do `routes/transactions.js`
9. Implemente as 3 paginas do frontend (ja vem com as classes CSS prontas):
   - `/` -- formulario de pagamento + saldo
   - `/history?page=&limit=` -- historico paginado
   - `/transaction/:id` -- detalhe da transacao
10. Teste localmente:
    ```bash
    cd participantes/<nome-do-time>/
    npm install && npm run build && npm start
    # abrir http://localhost:3000
    ```
13. Faca **commit** e **push** para o seu fork
14. Abra um **Pull Request** para este repositorio
15. O benchmark roda automaticamente e **posta a nota como comentario no PR**
16. Quando aprovado e mergeado na main, o ranking geral e recalculado

---

## CI/CD -- tres workflows

### Workflow 1: `pr-validate.yml` (validacao de seguranca)

Roda primeiro, antes do bench. Se falhar, o bench nem roda.

**Checklist de validacao (o PR so e aceito se):**

- [ ] O PR so altera arquivos dentro de `participantes/<nome-do-time>/`
  - Se mexer em qualquer coisa fora da pasta (bench/, .github/, README, etc) = **BLOQUEADO**
- [ ] Existe `info.json` valido (`team` bate com pasta, `members` com `name` + `github`)
- [ ] Existe `package.json` com scripts `build` e `start`
- [ ] `npm install` roda sem erro (timeout 2min)
- [ ] `npm run build` roda sem erro (timeout 1min)
- [ ] `npm start` sobe e `http://localhost:3000/api/health` responde 200 (timeout 30s)
- [ ] `http://localhost:3000/` retorna HTML (frontend servido pelo backend)
- [ ] Nenhum arquivo maior que 5MB (evitar binarios)
- [ ] No maximo 100 arquivos no PR
- [ ] Nao inclui `node_modules/` ou `*.db` (devem estar no .gitignore)

### Workflow 2: `pr-bench.yml` (benchmark no PR)

Roda apos o validate passar. Resultado postado como comentario no PR.

```
1. cd participantes/<nome-do-time>/
2. rm -f data.db (banco limpo)
3. npm install && npm run build && npm start
4. Aguarda http://localhost:3000/api/health responder 200
4. FASE 1: test-rules.ts     (100 txns pelo frontend, valida regras)
5. FASE 2: test-stress.ts    (8.500 txns direto na API, escala progressiva)
6. FASE 2b: test-refund.ts   (estornos concorrentes entre as rodadas)
7. FASE 3: test-audit.ts     (auditoria final pelo frontend paginado)
8. Calcula nota final
9. Posta comentario detalhado no PR
```

Exemplo de comentario no PR:

```markdown
## Resultado -- os-cabulosos

| Categoria | Nota |
|-----------|------|
| Regras de negocio | 33/35 |
| Concorrencia e integridade | 36/40 |
| Velocidade | 21/25 |
| **TOTAL** | **90/100** |

### Fase 1: Corretude (100 txns via frontend)
- [x] Bandeira correta (Visa/Master/Amex/Elo)
- [x] Taxa por bandeira calculada certo
- [x] Juros de parcelas corretos
- [ ] Valor da parcela: arredondamento errado em 2 transacoes (Math.floor em vez de Math.ceil)
- [x] net_amount correto
- [x] Cartao 9999 = declined, salvo no banco
- [x] declined nao conta no saldo
- [x] Limite diario R$5.000 aplicado
- [x] Bandeira invalida rejeitada 422
- [x] Parcela abaixo R$10 rejeitada 422

### Fase 2: Stress test (8.500 txns via API)
| Rodada | Txns | Workers | Throughput | Erros 500 |
|--------|------|---------|-----------|-----------|
| 1 | 500 | 10 | 823 txn/s | 0 |
| 2 | 1.000 | 25 | 1.247 txn/s | 0 |
| 3 | 2.000 | 50 | 1.891 txn/s | 3 |
| 4 | 5.000 | 100 | 2.456 txn/s | 12 |

Estornos concorrentes: 20 pares testados, 0 double refunds

### Fase 3: Auditoria final (historico paginado)
- [x] 7.823/7.823 approved encontradas
- [x] 412/412 declined encontradas
- [x] Idempotencia: 850 duplicatas enviadas, 0 transacoes duplicadas no banco
- [ ] Limite diario: 2 cartoes furaram o limite sob concorrencia
         card_last4=4532: soma=R$5.180 (limite R$5.000)
         card_last4=7891: soma=R$5.040 (limite R$5.000)
- [x] 0 estornos duplos
- [x] Saldo final correto
- [x] Paginacao consistente (87 paginas percorridas)
- [x] Deep link /history?page=44&limit=100 funciona
- Historico navegado em 6.8s

### Velocidade (21/25)
- R1: 823 txn/s
- R2: 1.247 txn/s
- R3: 1.891 txn/s
- R4: 2.456 txn/s
- Historico: 6.8s
```

O time pode dar push de novos commits e o bench roda de novo.

### Auto-approve e auto-merge

Apos o validate + bench rodarem com sucesso:

1. Bot aprova o PR automaticamente
2. PR e mergeado via squash merge na main
3. Nenhum organizador precisa aprovar manualmente

Se alguma checagem do validate falhar, o PR fica aberto com comentario
explicando o erro para o time corrigir.

### Workflow 3: `main-rank.yml` (ranking geral)

Roda a cada merge na main. Re-testa TODOS os times no mesmo ambiente.

```
Trigger: push (branch: main, paths: participantes/**)

1. Lista TODAS as pastas em participantes/
2. Para cada time:
   a. rm -f data.db && npm install && npm run build && npm start
   b. Roda as 3 fases (rules, stress, audit)
   c. Salva resultado em results/<nome-do-time>.json
   d. Mata os processos
3. Junta todos os JSONs
4. Gera LEADERBOARD.md (top 10)
5. Gera RESULTS.md (todos os times, com detalhes)
6. Commit automatico na main
```

Ranking **justo** -- todo mundo testado no mesmo ambiente, mesma maquina,
mesma hora.

---

## LEADERBOARD.md (top 10 -- raiz do repo)

Atualizado automaticamente a cada merge na main.

```markdown
# Leaderboard -- Rinha FullStack SENAI 2026

Atualizado em: 2026-06-10 14:30 UTC

| # | Time | Regras | Concorrencia | Velocidade | Total |
|---|------|--------|-------------|-----------|-------|
| 1 | os-cabulosos | 35/35 | 40/40 | 23/25 | 98 |
| 2 | byte-force | 33/35 | 40/40 | 19/25 | 92 |
| 3 | dev-juniors | 35/35 | 36/40 | 20/25 | 91 |
| 4 | react-lords | 31/35 | 38/40 | 22/25 | 91 |
| 5 | full-stackers | 35/35 | 34/40 | 18/25 | 87 |
| 6 | codigo-limpo | 33/35 | 32/40 | 19/25 | 84 |
| 7 | node-ninjas | 28/35 | 36/40 | 22/25 | 86 |
| 8 | api-avengers | 30/35 | 30/40 | 21/25 | 81 |
| 9 | bug-hunters | 27/35 | 32/40 | 17/25 | 76 |
| 10 | hello-world | 25/35 | 24/40 | 15/25 | 64 |

Resultado completo: [RESULTS.md](./RESULTS.md)
```

---

## RESULTS.md (todos os times)

Todos os times com detalhes expandidos. Atualizado junto com o LEADERBOARD.md.

```markdown
# Resultados Completos -- Rinha FullStack SENAI 2026

Atualizado em: 2026-06-10 14:30 UTC
Total de times: 18

| # | Time | Regras | Concorrencia | Velocidade | Total |
|---|------|--------|-------------|-----------|-------|
| 1 | os-cabulosos | 35/35 | 40/40 | 23/25 | 98 |
| ... | ... | ... | ... | ... | ... |
| 18 | primeiro-pr | 10/35 | 8/40 | 3/25 | 21 |

---

<details>
<summary>os-cabulosos -- 98/100</summary>

- Membros: Joao Silva (@joaosilva), Maria Santos (@mariasantos), Pedro Lima (@pedrolima)
- Regras: 35/35 -- bandeiras, taxas, juros, limites tudo correto
- Concorrencia: 40/40 -- 0 duplicatas, 0 furos de limite, 0 double refund
- Velocidade: R1=823/s, R2=1.5k/s, R3=2.3k/s, R4=3.1k/s, historico=5.2s
- Total de transacoes no banco: 7.891
- Pico throughput: 3.100 txn/s
- Ultimo bench: 2026-06-10 14:30 UTC

</details>

<details>
<summary>byte-force -- 92/100</summary>

- Membros: Ana Costa (@anacosta), Lucas Rocha (@lucasrocha)
- Regras: 33/35 -- arredondamento de parcela errado em 5 txns
- Concorrencia: 40/40 -- 0 problemas de concorrencia
- Velocidade: R1=650/s, R2=1.1k/s, R3=1.8k/s, R4=2.4k/s, historico=7.1s
- Total de transacoes no banco: 7.823
- Pico throughput: 2.400 txn/s
- Ultimo bench: 2026-06-10 14:30 UTC

</details>

...
```

---

## O que os alunos aprendem

- **Git/GitHub na pratica**: fork, branch, commit, PR -- fluxo real de open source
- **ORM + SQL**: Prisma schema declarativo, migrations, indices, WAL mode, transacoes
- **Concorrencia**: race conditions, SQLITE_BUSY, locks, mutex, check-then-write
- **Idempotencia**: request duplicado nao pode criar dado duplicado
- **Regras de negocio reais**: taxas por bandeira, juros compostos, parcelas, limites diarios
- **Matematica aplicada**: juros compostos, arredondamento, percentuais
- **Paginacao real**: query parameters, cursor vs offset, deep links
- **Frontend conectado**: React consumindo API, estado, rotas, parametros de URL
- **Integridade de dados**: 8.000+ transacoes e nao pode perder, duplicar, nem inventar nenhuma
- **Performance sob carga**: de 10 workers a 100 workers, o sistema nao pode cair
- **Indices de banco**: sem indice, query com 10k linhas trava -- aprendem na dor
- **Padrao de mercado**: Node + Fastify + Prisma + React e stack moderna de mercado
- **Debugging real**: o comentario do PR mostra exatamente onde falhou, o aluno
  tem que investigar, entender o problema, e corrigir -- como no trabalho
