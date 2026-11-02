## ADDED Requirements

### Requirement: Reservas que ocupam o imóvel

O cálculo de ocupação SHALL contar as noites das reservas com status `confirmed`,
`in_progress` ou `completed` e SHALL ignorar as `cancelled`. A mesma lista de status SHALL ser
usada pela consulta ao banco e pela regra pura.

#### Scenario: Estadia em andamento conta como ocupada
- **WHEN** o período é 01–30/06/2026 e há uma reserva `in_progress` de 10/06 a 13/06/2026
- **THEN** `occupiedNights` = 3 e `occupancyRate` = 10

#### Scenario: Os três status ativos somam
- **WHEN** o período é 01–30/06/2026 e há reservas `completed` 01–03/06, `in_progress` 10–13/06 e `confirmed` 20–25/06
- **THEN** `occupiedNights` = 10 (2 + 3 + 5) e `occupancyRate` = 33,33

#### Scenario: Cancelada não conta
- **WHEN** o período é 01–30/06/2026 e a única reserva é `cancelled` de 10/06 a 13/06/2026
- **THEN** `occupiedNights` = 0 e `occupancyRate` = 0

### Requirement: Noites ocupadas com checkout exclusivo

O sistema SHALL contar como ocupadas as noites de `checkin_at` até o dia anterior a
`checkout_at`, limitadas ao período, sem contar duas vezes noites de reservas sobrepostas, e
SHALL limitar `occupiedNights` ao total de noites do período.

#### Scenario: Reserva atravessa o fim do período
- **WHEN** o período é 01–30/06/2026 e há uma reserva `in_progress` de 28/06 a 03/07/2026
- **THEN** `occupiedNights` = 3 (28, 29 e 30/06)

#### Scenario: Checkout no primeiro dia do período
- **WHEN** o período é 01–30/06/2026 e há uma reserva `completed` de 27/05 a 01/06/2026
- **THEN** `occupiedNights` = 0 (o hóspede sai em 01/06 e não dorme lá)
