---
name: commit
description: Orienta o agente a criar commits semânticos (Conventional Commits) com git add modular. Nunca mistura arquivos de locais diferentes no mesmo commit. Prioridade: testes > backend > frontend. Usa APENAS git add e git commit. Use quando o usuário pedir para fazer commits, versionar mudanças ou ao finalizar tarefas que precisem ser commitadas.
---

# Commits Semânticos

## Comandos Permitidos

**O agente deve usar APENAS:**
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

Exemplo: se há mudanças em test/ e server/, fazer dois commits separados: primeiro testes, depois backend.

---

## Formato da Mensagem (Conventional Commits)

```
<tipo>(<escopo>): <descrição curta>

[corpo opcional]
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

### Escopo (opcional)

Usar o módulo ou área afetada:
- `feat(equipamentos): adicionar filtro por status`
- `fix(auth): validar token expirado`
- `test(equipamentos): cobrir create e update`

### Regras

- Descrição em imperativo, minúscula (exceto nomes): "adiciona" não "adicionado"
- Sem ponto final na descrição
- Máx. ~72 caracteres na primeira linha

---

## Fluxo de Trabalho

### 1. Verificar alterações

```
git status
```

### 2. Agrupar por escopo

Classificar arquivos modificados em:
- `test/**`
- `server/**`
- `client/**`
- Outros (raiz, config)

### 3. Criar commits na ordem de prioridade

Para cada grupo, em ordem: testes → backend → frontend → outros:

```bash
git add <arquivos-do-grupo>
git commit -m "<tipo>(<escopo>): <descrição>"
```

---

## Exemplos

### Exemplo 1: Testes + implementação backend

```bash
# Commit 1 — testes
git add test/unit/equipamentos/equipamentos.service.spec.ts
git commit -m "test(equipamentos): adicionar testes para create e update"

# Commit 2 — backend
git add server/src/equipamentos/
git commit -m "feat(equipamentos): implementar create e update"
```

### Exemplo 2: Múltiplos módulos

```bash
# 1. Testes do auth
git add test/unit/auth/
git commit -m "test(auth): cobrir validação de token"

# 2. Backend auth
git add server/src/auth/
git commit -m "fix(auth): validar token expirado"

# 3. Frontend auth
git add client/src/pages/login/
git commit -m "feat(auth): exibir mensagem ao token expirar"
```

### Exemplo 3: Só frontend

```bash
git add client/src/pages/equipamentos/EquipamentosPage.tsx
git commit -m "refactor(equipamentos): extrair filtros para componente"
```

---

## Checklist antes de commitar

```
- [ ] Arquivos agrupados por escopo (test / server / client)
- [ ] Nenhum grupo misturado no mesmo commit
- [ ] Ordem: testes → backend → frontend
- [ ] Mensagem no formato: tipo(escopo): descrição
- [ ] Apenas git add e git commit
```
