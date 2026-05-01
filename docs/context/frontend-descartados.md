# Context — Nexus System

Ver índice em `AGENTS.md`. Tela de Descartados (`/equipamentos/descartados`).

## Estrutura de arquivos

```
client/src/pages/aparelhos/descartados/
  DescartadosPage.tsx        ← página principal (lazy em App.tsx)
  useDescartadosList.ts      ← useQuery + filtros client-side
  DescartadosToolbar.tsx     ← busca por identificador + select de tipo
  DescartadosTable.tsx       ← tabela de registros descartados
```

## Comportamento

- **Rota:** `/equipamentos/descartados`
- **Permissão:** `CONFIGURACAO.APARELHO.LISTAR`
- **Somente-leitura** — sem botões de mutação
- Dados via `GET /aparelhos/descartados` (`queryKey: ["aparelhos-descartados"]`)
- Filtros client-side: `busca` (texto sobre `identificador`) e `tipoFilter` (`RASTREADOR | SIM | TODOS`)

## Mockup HTML

```html
<!-- DescartadosPage — /equipamentos/descartados -->
<div class="flex flex-col gap-6">

  <!-- Header -->
  <div class="flex items-center gap-3">
    <span class="material-icon text-slate-600">delete_sweep</span>
    <div>
      <h1 class="text-xl font-bold text-slate-800">Descartados</h1>
      <p class="text-xs text-slate-500">Aparelhos removidos permanentemente do estoque</p>
    </div>
  </div>

  <!-- Toolbar -->
  <div class="flex gap-3 items-center">
    <input
      placeholder="Buscar por identificador..."
      data-testid="descartados-busca"
      class="max-w-xs h-9 border rounded-md px-3 text-sm"
    />
    <select data-testid="descartados-tipo-filter" class="w-44 h-9 border rounded-md">
      <option value="TODOS">Todos os tipos</option>
      <option value="RASTREADOR">Rastreador</option>
      <option value="SIM">SIM</option>
    </select>
  </div>

  <!-- Tabela -->
  <div class="overflow-x-auto rounded-sm border border-slate-200">
    <table data-testid="descartados-table" class="w-full text-sm">
      <thead>
        <tr class="border-b bg-slate-50">
          <th class="px-4 py-3 text-[11px] font-bold uppercase text-slate-500">Identificador</th>
          <th class="px-4 py-3 text-[11px] font-bold uppercase text-slate-500">Tipo</th>
          <th class="px-4 py-3 text-[11px] font-bold uppercase text-slate-500">Marca / Modelo</th>
          <th class="px-4 py-3 text-[11px] font-bold uppercase text-slate-500">Categoria de Falha</th>
          <th class="px-4 py-3 text-[11px] font-bold uppercase text-slate-500">Motivo</th>
          <th class="px-4 py-3 text-[11px] font-bold uppercase text-slate-500">Proprietário</th>
          <th class="px-4 py-3 text-[11px] font-bold uppercase text-slate-500">Descartado em</th>
        </tr>
      </thead>
      <tbody>
        <!-- linha exemplo -->
        <tr data-testid="descartado-row-{id}" class="border-b hover:bg-slate-50">
          <td class="px-4 py-3 font-mono text-xs">862345678901234</td>
          <td class="px-4 py-3">RASTREADOR</td>
          <td class="px-4 py-3">Suntech / ST-901</td>
          <td class="px-4 py-3">Dano físico</td>
          <td class="px-4 py-3">Antena partida</td>
          <td class="px-4 py-3">Infinity</td>
          <td class="px-4 py-3 text-slate-500">01/04/2026</td>
        </tr>
        <!-- linha quando lista vazia -->
        <tr>
          <td colspan="7" class="text-center py-16 text-slate-400 text-sm">
            Nenhum aparelho descartado encontrado.
          </td>
        </tr>
      </tbody>
    </table>
  </div>

</div>
```

## Dialog de confirmação de descarte (CadastroIndividualPage)

Quando o usuário submete o formulário de cadastro individual com
`status = CANCELADO_DEFEITO` e `destinoDefeito = DESCARTADO`, o submit é
interceptado e abre um `Dialog` de confirmação antes de chamar a API:

```html
<dialog>
  <h2>Confirmar Descarte</h2>
  <p>
    Esta ação é <strong>irreversível</strong>. O equipamento será
    registrado como descartado e não poderá ser recuperado para o estoque.
  </p>
  <footer>
    <button>Cancelar</button>
    <button data-testid="confirmar-descarte-btn" class="bg-red-600 text-white">
      Confirmar Descarte
    </button>
  </footer>
</dialog>
```

## Testes

| Arquivo | Cobertura |
|---------|-----------|
| `client/src/__tests__/pages/aparelhos/descartados/useDescartadosList.test.tsx` | query, filtro busca, filtro tipo |
| `client/src/__tests__/pages/aparelhos/descartados/DescartadosTable.test.tsx` | renderiza colunas, dados, vazio, campos nulos |
| `client/src/__tests__/pages/aparelhos/CadastroIndividualPage.test.tsx` | `describe("dialog de confirmação")` — abre dialog, cancela, confirma |
