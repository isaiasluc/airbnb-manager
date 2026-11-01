## ADDED Requirements

### Requirement: PATCH aceita só campos editáveis

`PATCH /reservations/:id` SHALL aceitar apenas `status`, `email_sent`, `checkin_at`,
`checkout_at`, `guests_count`, `host_payout`, `host_service_status` e
`payout_needs_review`, descartando qualquer outro campo. SHALL responder 400 quando
`checkout_at` não for posterior a `checkin_at`, quando datas não estiverem em `AAAA-MM-DD`,
quando `guests_count` não for inteiro ≥ 1 ou quando `host_payout` não for número ≥ 0; 404
quando a reserva não existir; 200 com a reserva atualizada no sucesso.

#### Scenario: Campo não editável no corpo
- **WHEN** o corpo é `{ "guests_count": 3, "confirmation_code": "XXXX", "guest_id": 99 }`
- **THEN** responde 200, `guests_count` vira 3 e `confirmation_code`/`guest_id` não mudam

#### Scenario: Checkout antes do check-in
- **WHEN** o corpo é `{ "checkin_at": "2027-02-17", "checkout_at": "2027-02-12" }`
- **THEN** responde 400 e nada muda

#### Scenario: Checkout igual ao check-in
- **WHEN** o corpo é `{ "checkin_at": "2027-02-12", "checkout_at": "2027-02-12" }`
- **THEN** responde 400 (checkout é exclusivo: zero noites)

#### Scenario: Só o checkout mudando
- **WHEN** a reserva tem check-in 2027-02-12 e o corpo é `{ "checkout_at": "2027-02-11" }`
- **THEN** responde 400, validando contra o check-in já gravado

### Requirement: Editar datas, hóspedes e payout pela tela

A tela de detalhe da reserva SHALL permitir editar check-in, checkout, número de hóspedes e
payout, salvando via `PATCH /reservations/:id`, e mostrar o número de noites (checkout −
check-in) antes de salvar. A taxa SHALL ser recalculada pelo backend.

#### Scenario: Corrigir o payout
- **WHEN** o dono altera o payout de 2000 para 1500 numa reserva com check-in 2027-02-12
- **THEN** a tela mostra payout R$ 1.500,00 e taxa R$ 180,00 (12%)

#### Scenario: Prévia das noites
- **WHEN** o dono escolhe check-in 12/02/2027 e checkout 17/02/2027
- **THEN** a tela mostra "5 noites" antes de salvar

### Requirement: Aviso "conferir payout"

Reservas com `payout_needs_review = true` SHALL exibir o aviso "Conferir payout no Airbnb" no
detalhe e um indicador na tabela do dashboard. Editar `host_payout` SHALL limpar o aviso
(`payout_needs_review = false`), salvo se o mesmo PATCH mandar `payout_needs_review`
explicitamente; o dono também SHALL poder dispensar o aviso sem mudar o valor.

#### Scenario: Payout ajustado limpa o aviso
- **WHEN** a reserva tem `payout_needs_review = true` e o PATCH envia `{ "host_payout": 1500 }`
- **THEN** a reserva fica com `payout_needs_review = false`

#### Scenario: Dispensar o aviso
- **WHEN** o dono clica em "Payout está certo" numa reserva com o aviso
- **THEN** o PATCH envia `{ "payout_needs_review": false }`, o aviso some e o payout não muda
