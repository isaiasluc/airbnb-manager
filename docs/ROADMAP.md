# Roadmap — Airbnb Manager

Estado do projeto e próximos passos. Atualizado em 2026-07-19.

## ✅ Implementado

### Importação e sincronização
- Sincronização com o Gmail via Gmail API — lê e-mails de confirmação do Airbnb e cria
  reservas automaticamente, com parse de hóspede, datas, código e valores.
- Deduplicação por `source_email_id` (não reimporta o mesmo e-mail).
- Cron horário de sincronização + sincronização manual (`POST /sync`).
- Trigger de cron externo via `POST /cron/*` protegido por `CRON_SECRET`.

### Reservas
- CRUD de reservas (listar, detalhar, criar, editar, excluir).
- Status: `confirmed`, `in_progress`, `cancelled`, `completed`.
- **Atualização automática de status conforme as datas** — `confirmed → in_progress` no
  check-in e `→ completed` no checkout (cron horário + startup + endpoint externo).
  Preserva overrides manuais (`cancelled`/`completed` não são revertidos).
- Cálculo automático da taxa de serviço do host (10% até 2026-02-08, 12% depois).
- Status de pagamento do serviço do host (`pending`/`paid`/`cancelled`).
- Alteração manual de status pela tela de detalhe.

### Dashboard e visualização
- Dashboard com estatísticas (total, confirmadas, receita, taxa de host, ocupação).
- Painel **"Em andamento agora"** no topo da dashboard — lista as estadias ativas no
  momento (hóspede, datas, contagem até o checkout), independente do filtro de datas.
- Tabela de reservas com filtros por status, intervalo de datas e paginação.
- Calendário mensal de ocupação com navegação entre meses.
- Cálculo de taxa de ocupação (merge de intervalos, checkout exclusivo).
- Exportação CSV das reservas filtradas.

### E-mails
- E-mails de check-in automáticos (cron diário 08:00 America/Sao_Paulo) para reservas
  com check-in dentro de 7 dias e ainda não notificadas.
- Envio manual do e-mail de check-in pela tela de detalhe.
- Marcação de "e-mail enviado".

### Infra e auth
- Autenticação via Firebase (e-mail/senha); rota de sync restrita a um e-mail autorizado.
- Token Google OAuth armazenado no Secret Manager, com renovação por refresh token.
- Detecção de token expirado (`invalid_grant`) → UI oferece reautenticação automática.
- Tema claro/escuro.
- Deploy no Railway.

## 🚧 Próximos / ideias

- **Notificações** de novas reservas importadas (push/e-mail para o host).
- **Persistir estado de token inválido** (hoje é em memória; some em restart).
- **Histórico/auditoria de mudanças de status** (log de transições).
- **Dashboard financeiro** por período (receita mensal, comparativos, projeções).
- **Métricas de dashboard**: receita líquida, diária média (ADR), RevPAR, a receber (serviço pendente).
- **Agenda operacional**: próximos check-ins / check-outs (complementa "Em andamento agora").
- **E-mail de checkout/pós-estadia** (agradecimento, avaliação).
- **Múltiplos imóveis / listings** (hoje o modelo é centrado em um host).
- **Testes de integração** com banco (hoje só funções puras).
- **Webhooks/ICS** para sincronizar com o calendário oficial do Airbnb (além do e-mail).

> Ao concluir um item de "Próximos", mova-o para "Implementado" com uma linha curta.
