## 1. Dados e regra pura (backend)

- [x] 1.1 Migração `backend/migrations/20240009_add_alteration_fields_to_reservations.ts` com `payout_needs_review BOOLEAN NOT NULL DEFAULT false` e `last_alteration_at TIMESTAMPTZ NULL` (`up`/`down`); adicionar os campos em `Reservation` (`backend/src/types/index.ts`) e no `Pick` de `ReservationRepo.updateReservation`
- [x] 1.2 `parseAlterationAcceptedEmail` em `gmail.service.ts` + `backend/tests/alteration-email.test.ts` com o texto real dos aceites de HMK95EPSFN (Eduardo) e HMCRW3C395 (André) e o caso sem link
- [x] 1.3 `parseAlterationRequestEmail` (datas "Nov 14, 2026 - Nov 21, 2026" em GMT-03:00, hóspedes "1 guest"/"4 guests", seções opcionais, erro sem nenhuma seção) + testes com os pedidos reais de Eduardo e André
- [x] 1.4 `findAlterationRequest` (mesmo primeiro nome sem acento/caixa, mais recente antes do aceite) + testes dos cenários "pedido e aceite da mesma noite", "outro hóspede no meio" e "aceite sem pedido"
- [x] 1.5 `buildAlterationPatch` e `resolveAlterationSideEffects` em `reservation.service.ts` + testes: datas alteradas (fee 240,00), troca de faixa 12% → 10%, hóspedes, já aplicada, original não confere, `email_sent` reset só quando o check-in muda, `payout_needs_review`

## 2. Passo de alterações no sync (backend)

- [x] 2.1 `applyReservationAlteration(code, request, acceptedAt)` em `reservation.service.ts`: busca por código, ignora `cancelled`, ignora `acceptedAt ≤ last_alteration_at`, aplica via `updateReservation` com os efeitos colaterais e grava `last_alteration_at`; retorna `outcome` tipado como `cancelReservationByConfirmationCode`
- [x] 2.2 `updateReservation` desliga `payout_needs_review` quando recebe `host_payout` sem `payout_needs_review` explícito (função pura `shouldClearPayoutReview` + teste)
- [x] 2.3 Passo `applyReservationAlterationsFromEmails` em `gmail.service.ts` (queries `from:automated@airbnb.com subject:"Reservation updated"` e `subject:"wants to change their reservation"`, aceites em ordem de recebimento, erro por e-mail em `errors`), rodando depois do cancelamento; `SyncResult` ganha `updated`/`updatedItems` (com `changedFields`)
- [x] 2.4 Conferir `sync-status.service.ts`/logs do cron para incluir `updated` no resumo da rodada

## 3. Edição manual (backend)

- [x] 3.1 `pickEditableReservationFields` + `validateReservationEdit` (datas `AAAA-MM-DD`, checkout > check-in considerando os valores gravados, `guests_count` inteiro ≥ 1, `host_payout` ≥ 0) usados no `PATCH /reservations/:id`, com 400/404/200 + testes das funções puras

## 4. Frontend

- [ ] 4.1 Tipos `Reservation` (`payout_needs_review`, `last_alteration_at`) e `SyncResult` (`updated`, `updatedItems`) em `frontend/src/domain`; `updateReservation` da infraestrutura aceita `payout_needs_review`
- [ ] 4.2 (ui-designer) Mockup em `docs/mockups/` da edição de datas/hóspedes/payout no detalhe da reserva, do aviso "Conferir payout no Airbnb" e do indicador na tabela — aguarda aprovação do dono
- [ ] 4.3 (ui-designer) Implementar a edição no detalhe (`ReservationDates`/`ReservationFinancials`) com prévia de noites, aviso de payout com "Payout está certo" e indicador na `ReservationsTable`
- [ ] 4.4 (ui-designer) Painel de sync mostra as reservas atualizadas (`updatedItems`) junto com importadas e canceladas

## 5. Fechamento

- [ ] 5.1 Atualizar o `CLAUDE.md`: sync em três passos (importar → cancelar → alterar), formato dos dois e-mails de alteração, colunas novas no modelo de dados e o aviso de payout
- [ ] 5.2 Validação real: com o backend local apontado para um banco de dev com cópia das reservas HMK95EPSFN e HMCRW3C395, rodar `POST /sync` duas vezes e conferir datas, hóspedes, taxa, `email_sent`, aviso de payout e a idempotência; `code-reviewer` no diff do grupo
