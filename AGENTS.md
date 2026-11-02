# Agentes do Airbnb Manager

Repositório em `C:\Users\Isaias\Projects\airbnb-manager` (`backend/` + `frontend/`). Contexto,
modelo de dados, fluxos e gotchas estão no [`CLAUDE.md`](CLAUDE.md); o planejamento de
mudanças é feito com **OpenSpec** em [`openspec/`](openspec/) (`/opsx-propose`, `/opsx-apply`,
`/opsx-archive`).

A sessão principal é o **orquestrador**: lê o `tasks.md` da change ativa, dispara o agente
certo para cada task, confere o resultado e segue para a próxima. Cada agente começa com
contexto limpo, então o prompt de disparo sempre informa: nome da change, número da task e o
que já foi feito.

As definições executáveis ficam em `.opencode/agents/*.md` (OpenCode) e em `.claude/agents/*.md`
(Claude Code); mantenha as duas cópias iguais. Se o papel não aparecer como subagente, dispare
`general` mandando ler `.opencode/agents/<papel>.md` primeiro. Skills em `.opencode/skills/`
(espelho de `.claude/skills/`) e comandos em `.opencode/commands/opsx-*.md`.

| Agente | Modelo | Quando entra | Faz | Não faz |
|---|---|---|---|---|
| `spec-architect` | `deepseek-v4.1-flash#high` | Nova funcionalidade, novo tipo de e-mail no sync, spec divergente do código | Cria/atualiza changes OpenSpec e roda `openspec validate --strict` | Código de produto |
| `implementer` | `deepseek-v4.1-flash#high` | Uma task do `tasks.md` | Implementa com testes e typecheck, marca o checkbox e commita | Pular task, mexer em specs sem avisar, telas novas, push |
| `ui-designer` | `deepseek-v4-pro#high` | Mockups e tasks que criam/redesenham tela | Com a skill `frontend-design`: mockups em `docs/mockups/` e camada `presentation/` | Lógica de dados/HTTP (é do `implementer`) |
| `tester` | `deepseek-v4.1-flash#high` | Depois de cada task e no fim de cada grupo | typecheck, `npm test`, build; escreve testes de funções puras que faltam | Corrigir código de produto; testes com banco/rede |
| `code-reviewer` | `deepseek-v4-pro#max` | Antes do fim de cada grupo | Revisa o diff: sync Gmail, datas/fuso, regra financeira, status, auth, custo | Reescrever código |
| `visual-qa` | `deepseek-v4.1-flash` | Tasks com UI; fim de grupo com tela | Screenshots locais (≤ 6), console, 390 px, comparação com mockup | Usar o backend de produção; disparar sync/e-mail |
| `github-publisher` | `deepseek-v4.1-flash` | Depois dos commits de um grupo verde | Confere working tree e testes, faz push numa branch/PR | Push na `main` sem autorização (vai para produção); `--force`; commitar `.env` |
