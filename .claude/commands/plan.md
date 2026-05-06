Cria um plano de implementação detalhado para a tarefa descrita em $ARGUMENTS. Siga este processo **sem pular nenhuma etapa**:

---

## 1. Identificar domínio e contexto

Leia `AGENTS.md` para identificar se a tarefa afeta **backend**, **frontend** ou **ambos**, e qual entrada da tabela `docs/context/` é relevante.

## 2. Ler docs/context OBRIGATÓRIO

Para cada área identificada, leia o arquivo correspondente em `docs/context/`. **Nunca pule esta etapa.** Extraia:
- Caminhos dos arquivos de componente/serviço envolvidos
- Contratos de API / DTOs / endpoints afetados
- Modelos de dados envolvidos
- Padrões visuais e convenções (para mudanças de frontend)

Se a tarefa tocar componentes de `lib/` ou `components/` compartilhados, leia também `docs/context/frontend-core.md`.

## 3. Ler o código atual

Com os caminhos identificados, abra **apenas** os arquivos que serão alterados. Para arquivos >500 linhas use `offset`/`limit`. Não vasculhe o repo inteiro — siga os imports a partir do ponto de entrada documentado.

## 4. Montar o plano e salvar

Salve em `.claude/plans/<nome-descritivo>.md` com **todas** as seções abaixo:

---

### Seções obrigatórias do plano

#### Contexto
O que o `docs/context` diz sobre esta área. O que o código atual faz. Qual é o gap entre o estado atual e o desejado.

#### O que muda
Lista clara de arquivos e o tipo de mudança em cada um (novo arquivo, edição de função, remoção, renomeação).

#### Testes unitários (TDD — escrever ANTES da implementação)
Para cada função/comportamento novo:
- **Nome do teste** — descritivo, no padrão do projeto
- **Input** — valor(es) de entrada
- **Output esperado** — valor de retorno ou efeito colateral
- **Importância** — por que este caso importa (caminho feliz, borda, erro esperado)

Inclua obrigatoriamente: caso feliz, pelo menos um caso de borda e pelo menos um caso de erro/exceção.

#### Implementação (executar APÓS os testes existirem)
Passo a passo da implementação. Máximo 5 arquivos por fase; se exceder, dividir em fases e pedir aprovação entre elas.

#### Atualização de docs/context
Se a mudança afeta **qualquer** dos itens abaixo, liste aqui os trechos do `docs/context/<area>.md` que precisam ser reescritos e o novo conteúdo:
- Contrato de API ou DTO
- Endpoint (path, método, permissão)
- Modelo de dados / schema Prisma
- Comportamento de componente ou hook
- Exportações públicas de `lib/`

Se nada for afetado, declare explicitamente: "Nenhuma atualização de docs/context necessária."

#### Arquivos alterados
Tabela: `Arquivo | Tipo de mudança | Motivo`.

#### O que NÃO muda
Explícito sobre o que permanece igual (schema, props, testes existentes, etc.).

---

## 5. Apresentar o plano — não executar

Mostre o resumo do plano ao usuário. **Não comece nenhuma implementação.** A execução só ocorre quando o usuário digitar `/exec-plan <nome>`.

## 6. Regra absoluta sobre testes

Nunca execute `npm run test` nem qualquer variante. Lembre sempre o usuário de rodar os testes manualmente após a implementação.
