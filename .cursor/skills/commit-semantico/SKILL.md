---
name: commit-semantico
description: Orienta o agente a criar commits semânticos e descritivos (Conventional Commits). Mensagens devem detalhar o máximo possível a tarefa (o que, por que, como). Git add modular — nunca misturar arquivos de locais diferentes. Prioridade: testes > backend > frontend. Usa APENAS git add e git commit. Use quando fazer commits ou versionar mudanças.
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
<tipo>(<escopo>): <resumo curto>

[corpo — descrição detalhada da tarefa]
```

### Mensagens descritivas (obrigatório)

**As mensagens devem descrever a tarefa o máximo possível.** Evite mensagens genéricas como "corrige bug" ou "atualiza código". Sempre inclua o corpo do commit quando houver algo relevante a explicar.

O **corpo** deve responder:
- **O que** foi feito (quais arquivos, quais funções)
- **Por que** (problema resolvido, objetivo da mudança)
- **Como** (abordagem usada, quando for relevante)

Exemplo de mensagem completa:
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

### Escopo (opcional)

Usar o módulo ou área afetada (ex.: equipamentos, auth, login).

### Regras do resumo (primeira linha)

- Imperativo, minúscula (exceto nomes): "adiciona" não "adicionado"
- Sem ponto final
- Máx. ~72 caracteres
- Específico o suficiente para entender a mudança

### Regras do corpo

- Linhas com ~72 caracteres ou menos
- Usar lista com `-` para múltiplos itens
- Separar parágrafos com linha em branco

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
git commit -m "<tipo>(<escopo>): <resumo>" -m "<corpo detalhado>"
```

Usar múltiplos `-m` para subject + body. Para corpo em múltiplas linhas, concatenar com quebras:
```bash
git commit -m "feat(x): resumo" -m "Detalhe linha 1.

- Item 1
- Item 2"
```

---

## Exemplos

### Exemplo 1: Testes + implementação backend

```bash
# Commit 1 — testes
git add test/unit/equipamentos/equipamentos.service.spec.ts
git commit -m "test(equipamentos): adicionar testes para create e update" -m "Cobre create e update do EquipamentosService com cenários de sucesso, validação de DTO e tratamento de erros. Mock do PrismaService para isolar a unidade de teste."

# Commit 2 — backend
git add server/src/equipamentos/
git commit -m "feat(equipamentos): implementar create e update no service" -m "Implementa EquipamentosService.create e EquipamentosService.update com validação de DTOs, mapeamento para o modelo Prisma e tratamento de conflitos. Usa CreateEquipamentoDto e UpdateEquipamentoDto."
```

### Exemplo 2: Múltiplos módulos

```bash
# 1. Testes do auth
git add test/unit/auth/
git commit -m "test(auth): cobrir validação de token JWT" -m "Adiciona testes para JwtStrategy e AuthService cobrindo: token válido, token expirado, token malformado e refresh token."

# 2. Backend auth
git add server/src/auth/
git commit -m "fix(auth): validar expiração do token antes de aceitar" -m "Antes a validação só checava assinatura. Agora verifica também jwt.exp antes de permitir acesso. Retorna 401 com mensagem 'Token expirado' quando aplicável."

# 3. Frontend auth
git add client/src/pages/login/
git commit -m "feat(auth): exibir mensagem quando token expirar" -m "Intercepta resposta 401 com mensagem 'Token expirado', exibe toast e redireciona para login. Remove token do localStorage antes de redirecionar."
```

### Exemplo 3: Frontend com refatoração

```bash
git add client/src/pages/equipamentos/EquipamentosPage.tsx client/src/components/equipamentos/
git commit -m "refactor(equipamentos): extrair filtros para EquipamentosFilters" -m "Move lógica de filtros (status, busca, ordenação) para componente EquipamentosFilters. Reduz EquipamentosPage de ~700 para ~400 linhas e melhora reutilização."
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
