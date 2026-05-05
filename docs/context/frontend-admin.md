# Context — Nexus System

Ver índice em `AGENTS.md`. Fragmento extraído da documentação do monorepo.

### Página: `ConfiguracoesPage` (`client/src/pages/configuracoes/ConfiguracoesPage.tsx`)

Hub de navegação de configurações do sistema. Não tem estado, queries nem chamadas HTTP — apenas `<Link>` do React Router.

**Layout:** `flex` vertical centralizado, `max-w-7xl`, `grid-cols-1 md:grid-cols-2`. Cada seção é um "industrial card" (`bg-white border border-slate-200 rounded-sm`) com cabeçalho colorido e tiles de navegação.

**Cards e destinos:**

| Card | Ícone (cor) | Tiles → Rota |
|------|------------|--------------|
| Agendamento | `calendar_month` (azul) | Técnicos → `/tecnicos`; Clientes → `/clientes` |
| Controle de Acesso | `lock` (âmbar) | Cargos e Permissões → `/cargos`; Usuários → `/usuarios` |
| Configuração | `sensors` (esmeralda) | Marcas, Modelos e Operadoras → `/equipamentos/config` |

**Rodapé fixo:** exibe versão (`v1.0.0` hardcoded) e copyright com `new Date().getFullYear()`. Separado do grid por `border-t border-slate-200`.

**Classes reutilizáveis (constantes no topo do arquivo):**
- `navTileClasses` — estilo de cada `<Link>` tile
- `cardHeaderClasses` — cabeçalho de seção
- `industrialCardClasses` — wrapper de card

**Ao adicionar novas seções de configuração:** criar novo `<section>` com as mesmas constantes de classe; adicionar o tile `<Link>` com `MaterialIcon` à esquerda + `chevron_right` à direita. Não há guard de permissão na página em si — a rota de destino é responsável pelo controle de acesso.

---

### Página: `DebitosEquipamentosPage` (`client/src/pages/debitos-equipamentos/DebitosEquipamentosPage.tsx`)

Listagem somente-leitura de débitos de rastreadores entre entidades (Infinity ↔ Clientes). Rota: `/debitos-equipamentos`.

**Sem mutações:** sem formulários de criação/edição.

**Fonte de dados:**

```ts
useQuery<DebitosApiResponse>({
  queryKey: ["debitos-rastreadores"],
  queryFn: () =>
    api("/debitos-rastreadores?limit=500&incluirHistoricos=true"),
});
```

Carrega até 500 registros de uma vez — sem paginação incremental no frontend. A API passou a omitir `historicos` na listagem por padrão (`incluirHistoricos` default `false`) para reduzir carga; esta página envia **`incluirHistoricos=true`** porque o painel expandido depende do histórico (`mapDebitoApiToView` usa `d.historicos ?? []`). O mapeamento `mapDebitoApiToView` (por volta da linha 73) transforma `DebitoRastreadorApi` → `DebitoEquipamento` (view local).

**Tipos locais (não importados de backend):**

| Tipo | Valores |
|------|---------|
| `TipoEntidade` | `"cliente" \| "infinity"` |
| `StatusDebito` | `"aberto" \| "parcial" \| "quitado"` |

> `"parcial"` existe apenas na view — a API não retorna esse status. A lógica `mapDebitoApiToView` mapeia `quantidade <= 0 → "quitado"`, qualquer outro valor → `"aberto"`. `"parcial"` está nos tabs de filtro mas nunca tem registros na prática.

**Derivação de histórico (`mapDebitoApiToView` linha 96–110):**

| Campo da API | `descricao` gerada |
|-------------|-------------------|
| `pedido.codigo` | `"Pedido {codigo}"` |
| `lote.referencia` | `"Lote {referencia}"` |
| `aparelho.identificador` | `"Individual — {identificador \| 'ID {id}'}"` |
| nenhum | `"Registro manual"` |
| + `ordemServico.numero` | sufixo `" · OS nº {numero}"` |

**Estado e filtros:**

| State | Tipo | Descrição |
|-------|------|-----------|
| `expandedId` | `number \| null` | ID do débito com painel expandido (accordion single-open) |
| `busca` | `string` | Texto livre — filtra `devedor.nome` e `credor.nome` |
| `filtroStatus` | `StatusDebito \| "todos"` | Tabs: Todos / Aberto / Parcial / Quitado |
| `filtroDevedor` | `string` | `SearchableSelect` — nomes de devedores e credores (pool combinado) |
| `filtroModelo` | `string` | `SearchableSelect` — nomes `"{marca} {modelo}"` |

**Cards de resumo (calculados em `useMemo → stats`):**

| Card | Métrica |
|------|---------|
| Aparelhos Devidos | Soma de `modelos[].quantidade` nos débitos com `status !== "quitado"` |
| Clientes Devedores | Devedores únicos de tipo `"cliente"` (ativos); barra de % vs Infinity |
| Modelos Ativos | Contagem de modelos distintos com `quantidade > 0` em débitos ativos; modelo predominante |

> `saldoMes` (indicador trending) é o net de entradas − saídas de **todo o histórico** de débitos ativos, não filtrado por mês — nome engana.

**Layout da tabela (7 colunas):** ID · Devedor · Credor · Equip. (total un.) · Status · Últ. Mov. · ícone expand.

**Painel expandido (accordion):** `TableRow` extra com `colSpan=7` em 2 colunas:
1. Distribuição de Modelos — lista `modelos[]` com total consolidado.
2. Histórico de Movimentações — lista `historico[]`; dot verde = entrada, vermelho = saída.

**Configs de estilo (constantes no topo do arquivo):**

| Constante | Tipo | Uso |
|-----------|------|-----|
| `STATUS_CONFIG` | `Record<StatusDebito, {label, className}>` | Badge de status na tabela e no painel |
| `ENTIDADE_CONFIG` | `Record<TipoEntidade, {className}>` | Badge de tipo (infinity / cliente) |

**Helpers puros:**
- `formatarData(iso)` — `dd/mm/yyyy` (pt-BR).
- `formatarDataHora(iso)` — `dd/mm/yyyy, hh:mm` (pt-BR).

**Componentes externos usados:** `SearchableSelect`, `MaterialIcon`, shadcn `Table/*`, `Input`.

**Ao implementar mutações futuras:** adicionar endpoints em `server/src/debitos-rastreadores/` (controller + service), chamar via `useMutation` com `queryClient.invalidateQueries(["debitos-rastreadores"])`, e adicionar os controles de ação no painel expandido de `DebitoEquipamentoRowGroup`.
