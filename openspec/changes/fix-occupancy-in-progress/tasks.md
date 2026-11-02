## 1. Regra de ocupação (backend)

- [x] 1.1 Exportar `OCCUPYING_STATUSES` (`confirmed`, `in_progress`, `completed`) em `backend/src/types/index.ts` e usá-la em `calculateOccupancyStats` e nas queries `listReservationsForOccupancy`/`getOccupancyDateBounds`
- [ ] 1.2 Testes em `backend/tests/occupancy.test.ts`: estadia `in_progress` conta, os três status somam (10 noites, 33,33%), reserva `in_progress` atravessando o fim do período, checkout no primeiro dia do período não conta; `npx tsc --noEmit` + `npm test` verdes e commit

## 2. Fechamento

- [ ] 2.1 Conferir que o `CLAUDE.md` continua correto ("Ocupação considera `confirmed`, `in_progress` e `completed`") e citar `OCCUPYING_STATUSES` como fonte da regra
