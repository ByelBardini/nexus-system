---
description: Frontend reference for Nexus System React app. Covers stack, visual style, component conventions, form patterns, modal patterns, page patterns, and do/don't guidelines.
---

# Nexus Frontend

## Stack e Estrutura

- **Stack:** React 19, Vite 7, TypeScript, Tailwind CSS, shadcn/ui (new-york, neutral), TanStack Query, React Hook Form + Zod, Lucide React
- **Estrutura:** `client/src/` – `components/ui/` (primitivos shadcn), `components/` (InputCNPJ, SelectCidade, etc.), `pages/`, `layouts/`, `lib/`, `hooks/`, `contexts/`
- **Alias:** `@/` → `./src`

## Regra #1 – Nunca criar componente que já existe

Antes de qualquer implementação, verificar **obrigatoriamente**:

- `components/ui/` → button, input, label, select, table, dialog, card, checkbox, sheet, dropdown-menu, toast, sonner, form, separator
- `components/` → InputCNPJ, InputCPFCNPJ, InputTelefone, InputCEP, InputPreco, InputPlaca, SelectCidade, SelectUF, SelectClienteSearch, SelectTecnicoSearch, MaterialIcon, ProtectedRoute

**Criar componente novo APENAS quando a funcionalidade for realmente inexistente no projeto.**

## Estilo Visual

| Elemento | Classes |
|----------|---------|
| Labels | `text-[10px] font-bold uppercase text-slate-500` |
| Títulos | `font-condensed uppercase tracking-tight` |
| Body | `text-sm` |
| Background | `bg-erp-bg`, `bg-slate-100`, `bg-white` |
| Badges | `px-2 py-0.5 rounded text-[10px] font-bold uppercase border` + cores semânticas |
| Cabeçalhos tabela | `text-[10px] font-bold uppercase tracking-wider text-slate-600` |

**Paleta ERP:** `erp-blue` (#2563eb), `erp-yellow`, `erp-orange`, `erp-green`, `erp-purple`, `erp-bg` (#f1f5f9)

**Status:**
- Entidade (ATIVO/PENDENTE/INATIVO): emerald (ativo), amber (pendente), slate (inativo)
- Workflow: `bg-erp-X/10 text-X-800 border-erp-X/30`

## Padrão de Campos de Formulário

Todos os campos devem seguir o mesmo padrão, sem exceção:

```tsx
<div>
  <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
    Nome do Campo <span className="text-red-500">*</span>
  </Label>
  {/* campo aqui */}
</div>
```

- **Input de texto:** `<Input className="h-9" placeholder="..." />`
- **Select:** `<SelectTrigger className="h-9">` / `<SelectContent>` com `<SelectItem>`
- **CPF/CNPJ:** `<InputCPFCNPJ>` — nunca criar campo raw
- **CEP:** `<InputCEP onAddressFound={...}>` — nunca criar campo raw
- **Telefone:** `<InputTelefone>` — nunca criar campo raw
- **Preço:** `<InputPreco>` — nunca criar campo raw
- **Placa:** `<InputPlaca>` — nunca criar campo raw
- **Cidade:** `<SelectCidade>` com `<SelectUF>` — nunca criar selects raw
- **Textarea:** `className="w-full min-h-[96px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"`

## Padrão de Botões

- **Primário:** `<Button className="bg-erp-blue hover:bg-blue-700 text-white text-xs font-bold uppercase gap-2">`
- **Secundário / Cancelar:** `<Button variant="ghost">`
- **Contornado:** `<Button variant="outline">`
- **Destructive:** `<Button variant="destructive">`
- **Tamanho inline:** `h-9`; em modal: `h-10`; em header: `h-9 px-4`
- Sempre incluir ícone Lucide ou MaterialIcon à esquerda do label em botões de ação

## Padrão de Modal (Dialog)

**Sempre** usar `Dialog` do shadcn.

```tsx
<Dialog open={modalOpen} onOpenChange={(o) => !o && closeModal()}>
  <DialogContent hideClose className="max-w-md p-0 gap-0 overflow-hidden rounded-sm">

    {/* Header: ícone + título + botão X */}
    <header className="bg-white border-b border-slate-200 p-6 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <MaterialIcon name="[ícone-da-função]" className="text-erp-blue" />
        <h2 className="text-lg font-bold text-slate-800">Título do Modal</h2>
      </div>
      <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
        <X className="h-5 w-5" />
      </button>
    </header>

    {/* Body */}
    <div className="p-6 space-y-4">
      {/* campos do formulário */}
    </div>

    {/* Footer: ações */}
    <footer className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end gap-3">
      <Button variant="ghost" onClick={closeModal} disabled={isPending}>
        Cancelar
      </Button>
      <Button className="bg-erp-blue hover:bg-blue-700" onClick={handleSave} disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {isPending ? 'Salvando...' : 'Salvar'}
      </Button>
    </footer>

  </DialogContent>
</Dialog>
```

Regras do modal:
- Ícone no header simboliza a função (ex: `devices` para equipamentos, `person` para clientes)
- Botão X fecha sem salvar
- Footer sempre contém "Cancelar" (ghost) + ação principal (erp-blue)
- **Jamais** usar `DialogHeader`/`DialogTitle`/`DialogDescription` — usar `<header>` nativo

## Padrão de Tela Principal (Listagem)

Telas principais **não têm header/título próprio** — o título vem do menu lateral.

```tsx
return (
  <div className="space-y-4">
    {/* Toolbar */}
    <div className="flex items-center justify-between gap-4">
      <div className="relative flex-1 max-w-xs">
        <MaterialIcon name="search" className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
        <Input className="pl-8 text-[11px]" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="flex gap-2">
        {canCreate && (
          <Button onClick={openCreate} className="bg-erp-blue hover:bg-blue-700 text-[11px] font-bold uppercase">
            <MaterialIcon name="add" className="text-sm mr-1" />
            Nova Entidade
          </Button>
        )}
      </div>
    </div>

    {/* Tabela */}
    <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
      <table className="w-full text-left border-collapse erp-table font-condensed">...</table>
    </div>

    {/* Modais */}
  </div>
)
```

## Padrão de Tela Secundária (Criação/Detalhe)

```tsx
return (
  <div className="-m-4 flex min-h-[100dvh] flex-col bg-slate-100">
    <header className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8">
      <div className="flex items-center gap-4">
        <Link to="/rota-pai" className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-3">
          <MaterialIcon name="[ícone]" className="text-erp-blue text-xl" />
          <div>
            <h1 className="text-lg font-bold text-slate-800">Título da Página</h1>
            <p className="text-xs text-slate-500">Subtítulo explicativo</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1 opacity-0">Ação</Label>
          <Button className="bg-erp-blue hover:bg-blue-700 text-white text-sm font-bold h-9 px-4 rounded-sm" onClick={handleSave}>
            <MaterialIcon name="save" className="text-lg mr-2" />
            Salvar
          </Button>
        </div>
      </div>
    </header>

    <div className="flex-1 overflow-hidden flex flex-col bg-white min-h-0">
      <div className="overflow-y-auto flex-1">{/* conteúdo */}</div>
      <div className="h-12 border-t border-slate-200 bg-slate-50 flex items-center justify-between px-6 shrink-0">
        <span className="text-[11px] text-slate-500 font-bold uppercase tracking-tight">
          Total de {items.length} registros
        </span>
      </div>
    </div>
  </div>
)
```

## Padrão de Seção/Card em Formulário

```tsx
<section className="bg-white border border-slate-300 shadow-sm overflow-hidden">
  <div className="bg-slate-50 border-b border-slate-300 px-4 py-2 flex items-center gap-2">
    <MaterialIcon name="[ícone]" className="text-slate-400 text-lg" />
    <h2 className="text-xs font-bold text-slate-700 font-condensed uppercase">Título da Seção</h2>
  </div>
  <div className="p-4">{/* campos */}</div>
</section>
```

## O Que Fazer

- Usar `cn()` para classes condicionais (`@/lib/utils`)
- **Reutilizar componentes existentes** — consultar `@/components/ui` e `@/components` antes de implementar
- Usar `api()` de `@/lib/api` para requisições
- Validar formulários com Zod + React Hook Form
- Usar TanStack Query para dados assíncronos
- **Ícones:** Lucide para ações; MaterialIcon para domínio
- Verificar permissões com `useAuth().hasPermission()`
- Toasts via Sonner

## O Que Não Fazer

- **Jamais criar componente que já existe**
- Não criar componentes UI do zero — usar shadcn/ui ou componentes do projeto
- Não usar CSS-in-JS — usar Tailwind
- Não usar caminhos absolutos sem alias `@/`
- Não usar cores arbitrárias — usar paleta ERP/slate
- **Não adicionar header/título em telas principais** — nunca
- **Não criar modal sem o padrão header+body+footer**
- Não criar tela secundária sem botão de voltar, ícone, título e subtítulo

## Tabelas

- **HTML nativa:** `<table className="erp-table font-condensed">` (padrão preferido)
- **shadcn:** `Table` com `TableHead className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-600"`
- Sempre sticky thead com `sticky top-0 z-10` em telas full-height