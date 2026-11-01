# reservation-alteration-sync Specification

## Purpose
TBD - created by archiving change sync-reservation-alterations. Update Purpose after archive.
## Requirements
### Requirement: Extrair o código do e-mail "Reservation updated"

O sistema SHALL extrair o código de confirmação de um e-mail de `automated@airbnb.com` com
assunto "Reservation updated" a partir do link `hosting/reservations/details/<CODIGO>` do
corpo, normalizado para maiúsculas, e o primeiro nome do hóspede da frase "YOUR RESERVATION
WITH <NOME> HAS BEEN UPDATED". Sem código, o parser SHALL lançar erro.

#### Scenario: E-mail real de alteração aceita
- **WHEN** o corpo contém `https://www.airbnb.com/hosting/reservations/details/HMK95EPSFN?c=...` e "YOUR RESERVATION WITH EDUARDO HAS BEEN UPDATED"
- **THEN** o parser retorna `confirmation_code = "HMK95EPSFN"` e `guestFirstName = "Eduardo"`

#### Scenario: Nome com acento
- **WHEN** o corpo contém "YOUR RESERVATION WITH ANDRÉ HAS BEEN UPDATED" e o link de `HMCRW3C395`
- **THEN** o parser retorna `confirmation_code = "HMCRW3C395"` e `guestFirstName = "André"`

#### Scenario: E-mail fora do formato
- **WHEN** o corpo não contém link `hosting/reservations/details/`
- **THEN** o parser lança "Código de confirmação não encontrado no email de alteração"

### Requirement: Extrair o pedido de alteração

O sistema SHALL extrair de um e-mail "<Nome> wants to change their reservation" o primeiro
nome do hóspede (do assunto) e, quando presentes, as datas originais e pedidas ("ORIGINAL
DATES <data> - <data>" / "REQUESTED DATES <data> - <data>", formato "Nov 14, 2026") e o número
de hóspedes original e pedido ("Original Guests N guest(s)" / "Requested Guests N guest(s)").
Datas SHALL ser `DATE` em GMT-03:00. Um pedido sem datas e sem hóspedes SHALL lançar erro.

#### Scenario: Pedido de mudança de datas
- **WHEN** o e-mail tem assunto "Eduardo wants to change their reservation" e corpo "ORIGINAL DATES Nov 14, 2026 - Nov 21, 2026 REQUESTED DATES Feb 12, 2027 - Feb 17, 2027"
- **THEN** o parser retorna guestFirstName "Eduardo", original { checkin 2026-11-14, checkout 2026-11-21 } e requested { checkin 2027-02-12, checkout 2027-02-17 }, sem campos de hóspedes

#### Scenario: Pedido de mudança de hóspedes
- **WHEN** o e-mail tem assunto "André wants to change their reservation" e corpo "Original Guests 1 guest Requested Guests 4 guests"
- **THEN** o parser retorna original { guests_count 1 } e requested { guests_count 4 }, sem datas

#### Scenario: Pedido sem dados reconhecíveis
- **WHEN** o corpo não tem nem a seção de datas nem a de hóspedes
- **THEN** o parser lança erro e o e-mail não é usado como pedido

### Requirement: Casar a alteração aceita com o pedido

Para cada "Reservation updated", o sistema SHALL considerar como candidatos os pedidos de
alteração cujo primeiro nome (primeira palavra, sem diferenciar maiúsculas nem acentos)
coincida com o do aceite e com `guest_first_name` da reserva, recebidos até o aceite e no
máximo 7 dias antes dele, depois do `last_alteration_at` da reserva e ainda não usados por
outro aceite na mesma rodada. Entre os candidatos cujos valores originais conferem com a
reserva, SHALL usar o mais recente; se houver mais de um com valores pedidos diferentes, o
aceite SHALL ir para `errors` como ambíguo, sem alterar a reserva.

#### Scenario: Pedido e aceite da mesma noite
- **WHEN** há o pedido de Eduardo às 21:32 e o "Reservation updated" de Eduardo às 22:41 do mesmo dia
- **THEN** o aceite é casado com esse pedido

#### Scenario: Pedido de outro hóspede no meio
- **WHEN** há pedido de Eduardo às 21:32, pedido de Maria às 22:00 e o aceite de Eduardo às 22:41
- **THEN** o aceite de Eduardo é casado com o pedido de Eduardo, não com o de Maria

#### Scenario: Homônimos com pedidos diferentes
- **WHEN** há um pedido de Eduardo às 10h (datas 14–21/11 → 12–17/02) e outro de um Eduardo diferente às 11h (2 → 4 hóspedes), ambos conferem com a reserva, e o aceite chega às 12h
- **THEN** a reserva não é alterada e o e-mail entra em `errors` como "Mais de um pedido de alteração possível"

#### Scenario: Pedido antigo ou recusado
- **WHEN** o único pedido do hóspede foi recebido 10 dias antes do aceite, ou antes do `last_alteration_at` da reserva
- **THEN** ele não é usado e o aceite entra em `errors` com "Pedido de alteração não encontrado"

#### Scenario: Nome composto no e-mail
- **WHEN** o pedido tem assunto "Thais Luiza wants to change their reservation" e a reserva tem `guest_first_name = "Thais"`
- **THEN** o aceite é casado com esse pedido (a comparação usa só a primeira palavra do nome)

#### Scenario: Aceite sem pedido
- **WHEN** não existe pedido do mesmo hóspede antes do aceite
- **THEN** a reserva não é alterada e o e-mail entra em `errors` com "Pedido de alteração não encontrado"

### Requirement: Aplicar a alteração aceita na reserva

O sistema SHALL calcular o patch como os campos do pedido (`checkin_at`, `checkout_at`,
`guests_count`) cujo valor pedido difere do atual e aplicá-lo via
`reservation.service.updateReservation`. Antes de aplicar, os valores **originais** do pedido
SHALL conferir com os atuais da reserva. O status da reserva SHALL não ser alterado por este
passo. Reservas `cancelled` SHALL ser ignoradas.

#### Scenario: Datas alteradas
- **WHEN** a reserva HMK95EPSFN (confirmed, payout 2000, check-in 2026-11-14, checkout 2026-11-21) recebe o aceite casado com o pedido 14–21/11/2026 → 12–17/02/2027
- **THEN** a reserva passa a check-in 2027-02-12 e checkout 2027-02-17 (5 noites, saída em 17/02), continua `confirmed`, e `host_service_fee` = 240,00 (12% de 2000, check-in ≥ 2026-02-08)

#### Scenario: Taxa muda de faixa com a nova data
- **WHEN** uma reserva com payout 1000 e check-in 2026-02-10 (taxa 120,00) é alterada para check-in 2026-02-05
- **THEN** `host_service_fee` passa a 100,00 (10%, check-in antes de 2026-02-08)

#### Scenario: Hóspedes alterados
- **WHEN** a reserva HMCRW3C395 com `guests_count = 1` recebe o aceite casado com o pedido 1 → 4 hóspedes
- **THEN** `guests_count` passa a 4 e as datas não mudam

#### Scenario: Pedido não confere com a reserva
- **WHEN** o pedido diz datas originais 14–21/11/2026, mas a reserva está com 15–21/11/2026 e não com as datas pedidas
- **THEN** a reserva não é alterada e o e-mail entra em `errors` com "Pedido de alteração não confere com a reserva"

#### Scenario: Reserva cancelada
- **WHEN** a reserva do código está `cancelled`
- **THEN** a reserva não é alterada e o e-mail entra em ignorados com "Reserva cancelada"

#### Scenario: Reserva nunca importada
- **WHEN** não há reserva com o código do aceite
- **THEN** o e-mail entra em ignorados com "Alteração sem reserva importada" e o sync continua

### Requirement: Efeitos colaterais da alteração

Quando a alteração muda `checkin_at`, o sistema SHALL voltar `email_sent` para `false`. Quando
muda datas ou hóspedes, SHALL marcar `payout_needs_review = true`, porque os e-mails não trazem
o payout novo. O sistema SHALL gravar `last_alteration_at` com a data de recebimento do aceite.

#### Scenario: Check-in muda depois do e-mail enviado
- **WHEN** a reserva tem `email_sent = true` e o check-in muda de 2026-11-14 para 2027-02-12
- **THEN** `email_sent` passa a `false` e o cron envia o e-mail de check-in a partir de 2027-02-10

#### Scenario: Só hóspedes mudam
- **WHEN** só `guests_count` muda numa reserva com `email_sent = true`
- **THEN** `email_sent` continua `true` e `payout_needs_review` passa a `true`

### Requirement: Passo de alterações no sync é idempotente e ordenado

O passo SHALL rodar depois da importação de confirmações e do cancelamento, processar os
aceites do mais antigo para o mais novo e ignorar aceites com recebimento ≤
`last_alteration_at` da reserva. Um aceite cujo patch fica vazio SHALL entrar em ignorados com
"Já atualizada". O erro de um e-mail SHALL não interromper os demais.

#### Scenario: Rodar o sync duas vezes
- **WHEN** o sync aplica a alteração de HMK95EPSFN e roda de novo em seguida
- **THEN** na segunda rodada o aceite é ignorado ("Já atualizada") e nenhum campo da reserva muda

#### Scenario: Duas alterações da mesma reserva
- **WHEN** a reserva tem aceite A1 (14–21/11 → 12–17/02) e depois A2 (12–17/02 → 13–18/02), cada um com seu pedido
- **THEN** o sync aplica A1 e depois A2, terminando em 13–18/02, e numa segunda rodada não altera nada

#### Scenario: Confirmação e alteração no mesmo ciclo
- **WHEN** o e-mail de confirmação e o aceite da mesma reserva chegam entre duas rodadas do sync
- **THEN** a reserva é importada e alterada na mesma rodada

#### Scenario: Resultado do sync
- **WHEN** uma alteração é aplicada
- **THEN** `POST /sync` responde 200 com `updated = 1` e um item em `updatedItems` com código, nome do hóspede e a lista de campos alterados

