---
description: Orienta a criar commits semânticos e descritivos (Conventional Commits). Mensagens devem detalhar o máximo possível a tarefa (o que, por que, como). Git add modular — nunca misturar arquivos de locais diferentes. Prioridade: testes > backend > frontend.
---

# Commits Semânticos

## Comandos Permitidos

**Usar APENAS:**
- `git add` — adicionar arquivos ao stage
- `git commit` — criar commit com mensagem

Não usar: `git push`, `git pull`, `git stash`, `git reset` ou outros comandos git.

---

## Regra de Ouro: Add Modular

**NUNCA misturar arquivos de lugares diferentes no mesmo commit.**

Cada commit deve conter arquivos de **um único escopo**:
- Ou só `test/`
- Ou só `server/`
- Ou só `client/`
- Ou só arquivos de configuração/raiz (package.json, .env.example, etc.)

---

## Prioridade dos Commits

Seguir esta ordem ao criar múltiplos commits:

1. **Testes** (`test/`) — primeiro
2. **Backend** (`server/`) — segundo
3. **Frontend** (`client/`) — terceiro

---

## Formato da Mensagem (Conventional Commits)

```
<tipo>(<escopo>): <resumo curto>

[corpo — descrição detalhada da tarefa]
```

### Mensagens descritivas (obrigatório)

**As mensagens devem descrever a tarefa o máximo possível.** Evite mensagens genéricas. O corpo deve responder:
- **O que** foi feito (quais arquivos, quais funções)
- **Por que** (problema resolvido, objetivo da mudança)
- **Como** (abordagem usada, quando for relevante)

Exemplo:
```
feat(equipamentos): adicionar filtro por status na listagem

Implementa filtro por status (ativo, inativo, em manutenção) na
página de equipamentos. Inclui:
- Parâmetro de query no EquipamentosService
- Select de filtro no EquipamentosPage
- Persistência do filtro na URL para compartilhamento
```

### Tipos principais

| Tipo   | Uso                           |
|--------|-------------------------------|
| `feat` | Nova funcionalidade           |
| `fix`  | Correção de bug               |
| `test` | Adicionar ou ajustar testes   |
| `refactor` | Refatoração sem mudar comportamento |
| `chore` | Manutenção, config, deps     |
| `docs` | Documentação                  |
| `style` | Formatação (não altera lógica) |

### Regras do resumo (primeira linha)

- Imperativo, minúscula (exceto nomes): "adiciona" não "adicionado"
- Sem ponto final
- Máx. ~72 caracteres
- Específico o suficiente para entender a mudança

---

## Fluxo de Trabalho

### 1. Verificar alterações

```bash
git status
```

### 2. Agrupar por escopo

Classificar arquivos modificados em: `test/**`, `server/**`, `client/**`, outros.

### 3. Criar commits na ordem de prioridade

```bash
git add <arquivos-do-grupo>
git commit -m "<tipo>(<escopo>): <resumo>" -m "<corpo detalhado>"
```

---

## Exemplos

### Testes + implementação backend

```bash
# Commit 1 — testes
git add test/unit/equipamentos/equipamentos.service.spec.ts
git commit -m "test(equipamentos): adicionar testes para create e update" -m "Cobre create e update do EquipamentosService com cenários de sucesso, validação de DTO e tratamento de erros. Mock do PrismaService para isolar a unidade de teste."

# Commit 2 — backend
git add server/src/equipamentos/
git commit -m "feat(equipamentos): implementar create e update no service" -m "Implementa EquipamentosService.create e EquipamentosService.update com validação de DTOs, mapeamento para o modelo Prisma e tratamento de conflitos."
```

---

## Checklist antes de commitar

```
- [ ] Arquivos agrupados por escopo (test / server / client)
- [ ] Nenhum grupo misturado no mesmo commit
- [ ] Ordem: testes → backend → frontend
- [ ] Resumo específico (não genérico)
- [ ] Corpo descrevendo o que/por que/como (quando relevante)
- [ ] Mensagem no formato: tipo(escopo): resumo + corpo
- [ ] Apenas git add e git commit
```