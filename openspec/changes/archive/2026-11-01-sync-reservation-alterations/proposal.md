## Why

Quando um hóspede altera a reserva no Airbnb (datas ou número de hóspedes) e o host aceita, o
painel continua com os dados antigos: o sync só lê "Reservation confirmed" e "Canceled:
Reservation …". Caso real: Eduardo (HMK95EPSFN) trocou **14–21/11/2026** por **12–17/02/2027**
em 21/10/2026 e o painel ainda mostra novembro — bloqueia o calendário errado, distorce a
ocupação e o cron de check-in mandaria o e-mail com as datas antigas em 12/11/2026. Além disso,
o painel não permite corrigir datas, hóspedes nem payout à mão (a API aceita, a tela não).

## What Changes

- Novo passo no sync do Gmail, depois da importação e do cancelamento: processar os e-mails
  **"Reservation updated"** (alteração aceita) e aplicar na reserva os valores do pedido de
  alteração correspondente (**"<Nome> wants to change their reservation"**). Os dois e-mails
  são necessários porque cada um só tem metade da informação:
  - "Reservation updated" (ex.: 21/10/2026 22:41) tem só o código, no link
    `hosting/reservations/details/HMK95EPSFN`, e o texto "YOUR RESERVATION WITH EDUARDO HAS
    BEEN UPDATED". Nenhuma data ou valor.
  - "Eduardo wants to change their reservation" (21/10/2026 21:32) tem "ORIGINAL DATES Nov 14,
    2026 - Nov 21, 2026 / REQUESTED DATES Feb 12, 2027 - Feb 17, 2027", mas **não** tem o
    código. Variante de hóspedes: "André wants to change their reservation" → "Original Guests
    1 guest / Requested Guests 4 guests" (HMCRW3C395, 03/08/2026).
- Nenhum dos dois e-mails traz o **payout novo**. A reserva alterada fica marcada como
  "conferir payout" até o dono ajustar o valor.
- Mudou o check-in → `email_sent` volta para `false`, para o e-mail de check-in sair de novo
  com as datas novas.
- Tela de detalhe da reserva ganha edição de check-in, checkout, hóspedes e payout (o "U" do
  CRUD que faltava na interface) e o aviso "conferir payout".
- `PATCH /reservations/:id` passa a aceitar só os campos editáveis (hoje repassa o `req.body`
  inteiro para o knex).
- Resultado do sync ganha `updated` / `updatedItems`, mostrado no painel junto com importadas
  e canceladas.

Fora desta change: pedidos de alteração **recusados ou pendentes** (não mudam nada),
alterações iniciadas pelo host, mudança só de preço, criação manual de reserva pela tela e
reimportar o payout de outra fonte (API do Airbnb não existe para este uso).

## Capabilities

### New Capabilities

- `reservation-alteration-sync`: aplicar no painel as alterações de reserva aceitas no Airbnb
  a partir dos e-mails "Reservation updated" + "wants to change their reservation".
- `reservation-manual-edit`: editar à mão datas, hóspedes e payout de uma reserva pelo painel,
  com recálculo da taxa e o aviso "conferir payout".

### Modified Capabilities

(nenhuma — ainda não há specs em `openspec/specs/`)

## Impact

- `backend/src/services/gmail.service.ts`: parsers novos + passo 3 do sync; `SyncResult`.
- `backend/src/services/reservation.service.ts`: `applyReservationAlteration`, regra pura de
  patch, reset de `email_sent`, limpeza do aviso de payout.
- `backend/src/repositories/reservation.repository.ts`, `backend/src/types/index.ts`.
- Migração nova: colunas `payout_needs_review` e `last_alteration_at` em `reservations`.
- `backend/src/controllers/reservation.controller.ts`: whitelist do PATCH.
- Frontend: `domain` (tipo `Reservation`, `SyncResult`), `presentation/components/detail`,
  `presentation/components/sync`, tabela do dashboard.
- `CLAUDE.md` (fluxo do sync e modelo de dados).

Decisões do dono: (1) resetar `email_sent` quando o check-in muda; (2) sinalizar "conferir
payout" em vez de deixar o payout antigo silenciosamente; (3) aplicar alteração também em
reserva `completed` (corrige histórico) e nunca em `cancelled`.
