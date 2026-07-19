# CLAUDE.md — Airbnb Manager

Guia de contexto para agentes trabalharem neste repositório. Leia antes de alterar código.

## O que é

Painel de gestão de reservas de Airbnb. Importa reservas automaticamente dos e-mails de
confirmação do Gmail, organiza em dashboard (tabela + calendário de ocupação), calcula
estatísticas financeiras, dispara e-mails de check-in e mantém o status das reservas
atualizado automaticamente conforme as datas.

Monorepo: **backend** (Node.js + Express 5 + PostgreSQL, TypeScript) e **frontend**
(React 19 + Vite + TypeScript + Tailwind). Deploy no **Railway** (produção:
`https://airbnb-manager-production-d4a9.up.railway.app`).

## Estrutura

```
backend/
  src/
    controllers/   # HTTP handlers (thin) → chamam services
    services/      # regra de negócio
    repositories/  # acesso ao banco (knex)
    routes/        # definição das rotas Express
    middlewares/   # auth Firebase, restrição de e-mail
    types/index.ts # tipos do domínio (Reservation, Guest, etc.)
    db.ts          # instância knex (pg)
    server.ts      # bootstrap: monta rotas e inicia os crons
  migrations/      # migrações knex (.ts)
  tests/           # node:test via `tsx --test` (testam funções puras, sem DB)
  scripts/auth-google.ts  # gera token Google OAuth manualmente (uma vez)
frontend/
  src/
    domain/         # entidades + serviços puros (sem React)
    application/    # hooks (casos de uso)
    infrastructure/ # chamadas HTTP, Firebase
    presentation/   # componentes, páginas, tema
docs/              # screenshots + ROADMAP.md
```

Arquitetura em camadas (Clean Architecture leve) nos dois lados. Controllers finos;
regra de negócio nos services; acesso a dados nos repositories.

## Rodar

```bash
# backend (porta 3000)
cd backend && npm install && npm run dev
npm test                       # roda os testes (tsx --test)
npm run migrate:latest         # aplica migrações
npx tsc --noEmit               # typecheck

# frontend (porta 5173)
cd frontend && npm install && npm run dev
npm run build                  # tsc -b && vite build
```

Config via `.env` (não versionado). Variáveis principais: `DATABASE_URL`,
`GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI`, `GOOGLE_TOKEN_SECRET_NAME`,
`FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY`, `CRON_SECRET`, `FRONTEND_URL`,
`VITE_SYNC_ALLOWED_EMAIL`.

## Modelo de dados

`reservations` (1 guest N reservations):
- `status`: `confirmed | in_progress | cancelled | completed` (check constraint).
- `host_service_status`: `pending | paid | cancelled`.
- `checkin_at` / `checkout_at`: `timestamptz`, gravados no horário real em **GMT-3**
  (check-in ~15h, checkout ~11h). **`checkout_at` é exclusivo**: o hóspede sai nesse dia,
  então a última noite ocupada é o dia anterior ao checkout.
- `host_service_fee`: calculado (10% até 2026-02-08, 12% a partir daí — ver
  `reservation.service.ts`).

## Fluxos-chave

- **Sync Gmail** (`gmail.service.ts`, cron horário + `POST /sync` manual): lê e-mails de
  confirmação do Airbnb, faz parse e cria reservas (dedupe por `source_email_id`).
- **E-mails de check-in** (`reservation.service.sendDueCheckinEmails`): cron diário 08:00
  America/Sao_Paulo + `POST /cron/checkin-emails` (externo, header `x-cron-secret`).
  Envia para reservas `confirmed`, `email_sent=false`, com check-in dentro de 7 dias.
- **Atualização automática de status** (`reservation-status.service.ts`, cron horário +
  startup + `POST /cron/reservation-status`): avança `confirmed → in_progress` no
  check-in e `confirmed/in_progress → completed` no checkout. Comparação por timestamp
  absoluto contra `now()`. **`cancelled` e `completed` nunca são revertidos** (override
  manual é respeitado). Fonte de verdade da regra: `resolveReservationStatus`.
- **Reautenticação Google**: quando o token expira, o sync falha com `invalid_grant`; o
  backend marca o token inválido e o frontend mostra "Autenticar Google". Ver Gotchas.

## Crons (iniciados em `server.ts`)

| Cron | Agenda | Também exposto como |
|------|--------|---------------------|
| Sync Gmail | `0 * * * *` (horário) | `POST /sync` (autenticado) |
| E-mails de check-in | `0 8 * * *` (America/Sao_Paulo) | `POST /cron/checkin-emails` (secret) |
| Atualização de status | `0 * * * *` + startup | `POST /cron/reservation-status` (secret) |

Endpoints `/cron/*` exigem header `x-cron-secret` == `CRON_SECRET` (para agendadores externos).

## Gotchas (importante)

- **OAuth Google dividido em DOIS projetos GCP**: o client OAuth (dono da tela de
  consentimento, que rege a expiração do refresh token) vive em `airbnb-manager-498714`;
  o Firebase + Secret Manager (onde o token é salvo) em `airbnb-manager-428ff`. A tela de
  consentimento precisa estar "Em produção" no **498714** (está). Se estiver em "Testing",
  o refresh token expira em 7 dias → `invalid_grant`.
- **Token Google no Secret Manager**, não em arquivo. `loadGoogleToken` renova via evento
  `tokens`. A flag de token inválido é **em memória** (reseta em restart do Railway; o
  cron horário re-detecta).
- **`checkout_at` é exclusivo** em toda a lógica de ocupação e datas.
- **Ocupação** considera `confirmed`, `in_progress` e `completed` (não `cancelled`).
- **Testes não tocam o banco** — testam funções puras. Ao adicionar lógica, extraia a
  regra pura (ex.: `resolveReservationStatus`) para poder testar sem DB.
- Sync restrito ao e-mail em `VITE_SYNC_ALLOWED_EMAIL` (middleware `require-sync-email`).

## Convenções

- TypeScript nos dois lados. Comentários e mensagens de log em português.
- Backend: controller → service → repository. Não acesse `db` fora de repositories/services.
- Migrações knex em `backend/migrations` (padrão `NNNN_descricao.ts`), com `up`/`down`.
- Commits em português no estilo Conventional Commits (`feat:`, `fix:`, `docs:`).
