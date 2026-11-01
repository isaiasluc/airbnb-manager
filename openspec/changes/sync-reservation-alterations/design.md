## Context

O sync (`gmail.service.syncGmailReservations`) tem dois passos: importar "Reservation
confirmed" (dedupe por `source_email_id`) e cancelar por `confirmation_code` a partir de
"Canceled: Reservation …". Alteração aceita no Airbnb não é lida, então datas e hóspedes ficam
desatualizados. O Airbnb manda dois e-mails por alteração, cada um com metade da informação:

| E-mail | Assunto | Tem | Não tem |
|---|---|---|---|
| Pedido | `<Nome> wants to change their reservation` | nome, datas/hóspedes originais e pedidos, link `reservation/alteration/<id>` | código de confirmação |
| Aceite | `Reservation updated` | código (link `hosting/reservations/details/<CODIGO>`), nome | qualquer valor |

Nenhum dos dois traz o payout novo. Pedido recusado não gera aceite.

Na interface, o detalhe da reserva só edita `status` e `host_service_status`; a API
(`PATCH /reservations/:id`) já aceita datas/hóspedes/payout, mas repassa o `req.body` sem
filtro para o knex.

## Goals / Non-Goals

**Goals:** refletir no painel alterações aceitas (datas e hóspedes) de forma idempotente;
sinalizar o payout que ficou desatualizado; permitir correção manual pela tela.

**Non-Goals:** pedidos pendentes/recusados, alteração iniciada pelo host, descobrir o payout
novo automaticamente, criação manual de reserva, mudar o status pelo passo de alteração.

## Decisions

1. **Casar aceite ↔ pedido pelo primeiro nome + tempo, conferindo os valores originais.**
   O pedido não tem código; o aceite não tem valores. Pega o pedido mais recente do mesmo
   primeiro nome (normalizado sem acento/caixa) recebido antes do aceite e exige que os valores
   *originais* do pedido batam com a reserva do código. A conferência protege contra homônimos
   e contra pedidos antigos. *Alternativa:* seguir o link `reservation/alteration/<id>` —
   exige sessão logada no Airbnb, descartada.
2. **Ordem do sync:** importar → cancelar → alterar. Alterar por último garante que a reserva
   exista (confirmação no mesmo ciclo) e que uma reserva cancelada não seja mexida.
   Pedidos são listados uma vez por rodada (`listMessageIds` + `fetchEmail`) e indexados por
   nome; aceites processados do mais antigo para o mais novo (`receivedAt` asc).
3. **Idempotência por `last_alteration_at` + patch vazio.** Coluna nova
   `reservations.last_alteration_at TIMESTAMPTZ NULL`: aceite com `receivedAt ≤
   last_alteration_at` é ignorado. Necessária para cadeias de alterações (A1 depois A2), onde
   reprocessar A1 acharia os "originais" divergentes. Patch vazio também é ignorado ("Já
   atualizada"). *Alternativa:* tabela de e-mails processados — mais genérica, mas maior que o
   necessário hoje.
4. **Funções puras exportadas** (testáveis sem DB):
   - `parseAlterationAcceptedEmail(body, subject)` → `{ confirmation_code, guestFirstName }`
     (reaproveita o padrão do link já usado em `cancellationBodyPatterns`);
   - `parseAlterationRequestEmail(body, subject)` → `{ guestFirstName, original, requested }`;
   - `findAlterationRequest(requests, guestFirstName, acceptedAt)`;
   - `buildAlterationPatch(reservation, request)` → `{ outcome: 'apply', patch, changedFields } |
     { outcome: 'already_applied' } | { outcome: 'mismatch' }`;
   - `resolveAlterationSideEffects(current, patch)` → `email_sent`/`payout_needs_review`.
   `reservation.service.applyReservationAlteration(code, request, acceptedAt)` orquestra e grava
   via `updateReservation` (que já recalcula `host_service_fee`).
5. **Payout:** coluna `payout_needs_review BOOLEAN NOT NULL DEFAULT false`, ligada quando
   datas ou hóspedes mudam pela alteração. `updateReservation` desliga quando recebe
   `host_payout` sem `payout_needs_review` explícito (mesmo padrão de
   `shouldCancelHostService`). *Alternativa:* estimar o payout pelo valor por noite — inventaria
   número financeiro, descartada.
6. **`email_sent` volta a `false` quando `checkin_at` muda**, porque o e-mail de check-in
   (`reservation-email.service`) traz as datas. O cron diário reenvia na janela de 2 dias.
7. **Status não muda neste passo.** O cron de status (horário) reavalia depois; ele só avança,
   então uma reserva `confirmed` adiada continua `confirmed`. `cancelled` é ignorada;
   `completed` recebe a correção de dados (histórico) mas segue `completed`.
8. **Whitelist no controller** de `PATCH /reservations/:id` (função pura
   `pickEditableReservationFields` + `validateReservationEdit`), validando datas contra os
   valores já gravados no service.

## Risks / Trade-offs

- [Airbnb muda o texto dos e-mails] → parser lança erro por e-mail (vai para `errors`, visível
  no painel de sync), sem derrubar o sync; fixtures com texto real nos testes.
- [Homônimos com pedidos próximos] → conferência dos valores originais; divergência vira erro
  para revisão manual, nunca alteração silenciosa.
- [Formato de pedido não visto (ex.: datas + hóspedes no mesmo e-mail, mudança de preço)] →
  parser aceita seções opcionais; pedido sem nenhuma seção conhecida é erro.
- [Volume de chamadas Gmail] → pedidos listados uma vez por rodada; busca filtrada por remetente
  e assunto; sem mudança no custo do Secret Manager.
- [Reserva `in_progress` com datas alteradas para o futuro] → continua `in_progress` (cron não
  regride); caso raro, corrigido à mão como já documentado no CLAUDE.md.

## Migration Plan

1. Migração `20240009_add_alteration_fields_to_reservations.ts` (`up` adiciona as duas
   colunas, `down` remove). Sem backfill.
2. Deploy do backend (Railway aplica a migração). O primeiro sync processa os aceites
   históricos: HMCRW3C395 (André, 1 → 4 hóspedes, `completed`) e HMK95EPSFN (Eduardo,
   14–21/11/2026 → 12–17/02/2027) — ambos ficam com "conferir payout".
3. Deploy do frontend.
Rollback: reverter o deploy; as colunas novas são ignoradas pelo código antigo, e `down` as
remove se necessário.

## Open Questions

- Confirmar as três decisões do dono listadas no proposal (reset de `email_sent`, aviso de
  payout, aplicar em `completed`).
- Existe e-mail do Airbnb com o payout atualizado após a alteração (ex.: resumo de pagamento)?
  Se existir, uma change futura pode preencher o payout e dispensar o aviso.
