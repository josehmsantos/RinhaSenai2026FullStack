# Rinha FullStack SENAI 2026 - Resumo

Os alunos, em times, vão construir um **gateway de pagamento fake** (backend + frontend) usando Node.js, React e SQLite. O desafio simula um sistema real onde o cartão é cobrado, taxas são aplicadas por bandeira, juros compostos são calculados por parcela, e existe um limite diário de R$5.000 por cartão.

## O que cada time recebe

- Uma pasta `template/` com o projeto base já configurado (Fastify, Prisma, React + Vite, npm workspaces)
- O frontend pronto com todas as telas e formulários — os alunos precisam fazer funcionar
- Rotas do backend com stubs (retornam 501) — os alunos implementam a lógica

## O que cada time precisa fazer

1. Implementar o POST de criação de transação com todas as regras de negócio (taxas por bandeira, juros por parcela, limite diário)
2. Implementar o estorno de transações
3. Garantir que o sistema aguente carga progressiva (500 → 1k → 2k → 5k transações) com múltiplas abas simultâneas
4. Resolver problemas de concorrência: idempotência (mesma requisição não duplicar), race conditions no limite diário, e escritas simultâneas no SQLite

## Como funciona a competição

- Cada time abre um PR com sua implementação
- Um benchmark automático (Playwright) roda no PR, testando via classes CSS do frontend
- O benchmark insere transações em massa, verifica se estão no histórico paginado, testa estornos, e sobe a carga progressivamente
- O resultado é postado como comentário no PR
- Ao fazer merge na main, o leaderboard é atualizado

## Pontuação

- Corretude das regras de negócio (taxas, juros, limites)
- Performance sob carga (tempo de resposta)
- Resistência a concorrência (sem duplicatas, sem ultrapassar limites)

## Stack obrigatória

Node.js + React + SQLite + Prisma + Fastify. Tudo roda em uma porta só (3000), com `npm run build` e `npm start`.

## O que os alunos aprendem

Git/PRs, arquitetura fullstack, banco de dados relacional, concorrência, regras de negócio financeiras, e performance sob pressão.
