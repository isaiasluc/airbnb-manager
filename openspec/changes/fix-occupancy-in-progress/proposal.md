## Why

A taxa de ocupação (`GET /reservations/occupancy`, cartão do dashboard) ignora a reserva que
está acontecendo agora. `reservation.service.calculateOccupancyStats` só conta `confirmed` e
`completed`, mas o cron de status move a reserva para `in_progress` no check-in (14h) — então,
durante toda a estadia, as noites dela somem da ocupação e voltam só no checkout, quando ela
vira `completed`. O `CLAUDE.md` e a query do repositório já dizem que ocupação considera
`confirmed`, `in_progress` e `completed`; só a regra pura ficou para trás.

## What Changes

- `calculateOccupancyStats` passa a contar `in_progress` junto com `confirmed` e `completed`
  (continua ignorando `cancelled`).
- A lista de status que ocupam o imóvel vira uma constante única usada pela regra pura e pela
  query do repositório, para as duas não divergirem de novo.

Fora desta change: o frontend (calendário e estatísticas já usam `status !== 'cancelled'`),
regras de receita/financeiro e qualquer mudança de status.

## Capabilities

### New Capabilities

- `occupancy-stats`: cálculo da taxa de ocupação de um período (noites ocupadas / noites do
  período), com checkout exclusivo e só com reservas que de fato ocupam o imóvel.

### Modified Capabilities

(nenhuma)

## Impact

- `backend/src/services/reservation.service.ts` (`calculateOccupancyStats`).
- `backend/src/repositories/reservation.repository.ts` (`listReservationsForOccupancy`,
  `getOccupancyDateBounds`) — só passam a usar a constante.
- `backend/tests/occupancy.test.ts`.
- Sem migração, sem mudança de API ou de tela.
