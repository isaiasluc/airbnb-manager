## Context

`listReservationsForOccupancy` e `getOccupancyDateBounds` já filtram no SQL por
`confirmed | in_progress | completed`, mas a regra pura `calculateOccupancyStats` refiltra só
`confirmed | completed` — descartando a estadia em andamento. O status `in_progress` foi criado
depois (migração `20240006_add_in_progress_status.ts`) e a regra pura não acompanhou.

## Goals / Non-Goals

**Goals:** ocupação correta durante a estadia; uma única fonte para "status que ocupam".

**Non-Goals:** mudar o frontend, a API ou as regras de status.

## Decisions

1. **Constante exportada `OCCUPYING_STATUSES`** (`['confirmed', 'in_progress', 'completed']`)
   em `backend/src/types/index.ts`, usada pela regra pura e pelo repositório (os dois já
   importam os tipos do domínio). *Alternativa:* filtrar `status !== 'cancelled'` — mais curto, mas um
   status novo entraria na ocupação sem ninguém decidir.
2. **A regra pura continua filtrando**, mesmo com o SQL já filtrando: ela é testada sem banco
   e precisa estar correta sozinha.

## Risks / Trade-offs

- [Repositório importar do service inverteria a direção das camadas] → a constante fica em
  `backend/src/types/index.ts`, que os dois já importam.

## Migration Plan

Sem migração. Deploy normal; o efeito aparece no cartão de ocupação na próxima consulta.

## Open Questions

Nenhuma.
