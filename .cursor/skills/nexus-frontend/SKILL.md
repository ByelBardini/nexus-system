---
name: nexus-frontend
description: Frontend specialist for Nexus System React app. Covers development patterns, visual style, component conventions, and do/don't guidelines. Use when working on client/, UI components, pages, or styling in the Nexus project.
---

# Nexus Frontend

## Stack e Estrutura

- **Stack:** React 19, Vite 7, TypeScript, Tailwind CSS, shadcn/ui (new-york, neutral), TanStack Query, React Hook Form + Zod, Lucide React
- **Estrutura:** `client/src/` – `components/ui/` (primitivos shadcn), `components/` (InputCNPJ, SelectCidade, etc.), `pages/`, `layouts/`, `lib/`, `hooks/`, `contexts/`
- **Alias:** `@/` → `./src`

## Padrões de Componentes

- **UI primitivos:** `forwardRef` + `cva` + `cn()`, `displayName`
- **Páginas:** sufixo `*Page.tsx`, lazy loading com `Suspense` + fallback `PageLoader`
- **Componentes de domínio:** PascalCase (InputCNPJ, SelectCidade, InputTelefone, MaterialIcon)

## Estilo Visual

### Regras obrigatórias

| Elemento | Classes |
|----------|---------|
| Labels | `text-[10px] font-bold uppercase text-slate-500` |
| Títulos | `font-condensed uppercase tracking-tight` |
| Body | `text-sm` |
| Background | `bg-erp-bg`, `bg-slate-100`, `bg-white` |
| Badges | `px-2 py-0.5 rounded text-[10px] font-bold uppercase border` + cores semânticas |
| Cabeçalhos tabela | `text-[10px] font-bold uppercase tracking-wider text-slate-600` |

### Paleta ERP

- `erp-blue` (#2563eb), `erp-yellow`, `erp-orange`, `erp-green`, `erp-purple`, `erp-bg` (#f1f5f9)

### Status

- **Entidade (ATIVO/PENDENTE/INATIVO):** emerald (ativo), amber (pendente), slate (inativo)
- **Workflow (AGENDADO, EM_TESTES, etc.):** `bg-erp-X/10 text-X-800 border-erp-X/30`

## O Que Fazer

- Usar `cn()` para classes condicionais (`@/lib/utils`)
- **Reutilizar componentes existentes** – consultar `@/components/ui` e `@/components` antes de qualquer implementação; criar componente novo apenas quando for algo de fato inexistente no projeto
- Usar `api()` de `@/lib/api` para requisições
- Validar formulários com Zod + React Hook Form
- Usar TanStack Query para dados assíncronos
- **Ícones:** Lucide para ações (Plus, Pencil, Loader2, Search, ChevronLeft); MaterialIcon para domínio (sensors, sim_card, precision_manufacturing, add, edit)
- Verificar permissões com `useAuth().hasPermission()`
- Toasts via Sonner

## O Que Não Fazer

- **Jamais criar componente que já existe** – sempre usar os existentes; criar só quando for algo realmente novo
- Não criar componentes UI do zero – usar shadcn/ui ou componentes do projeto
- Não usar CSS-in-JS ou CSS adicionais – usar Tailwind
- Não usar caminhos absolutos sem alias `@/`
- Não usar cores arbitrárias – usar paleta ERP/slate

## Tabelas e Modais

- **Tabelas:** `<table className="erp-table font-condensed">` (HTML nativa) ou `Table` do shadcn com `TableHead className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-600"`
- **Modais:** Preferir `Dialog` do shadcn; modal customizado (div overlay) apenas quando layout exigir (ex: sidebar de resumo)

## Padrão de Página

Estrutura típica: header com título + filtros + ações, área de conteúdo (tabela/cards), footer com paginação/contadores, modais para CRUD.

## Exceções

- **Login:** Card/Label padrão do shadcn, `bg-muted/30`

## Referência

Para detalhes de `tailwind.config.js`, `index.css`, variáveis CSS e exemplos, ver [reference.md](reference.md).
