# Context — Nexus System

Ver índice em `AGENTS.md`.

## Configuração do projeto frontend (`client/`)

### `package.json` — scripts

| Script | Comando |
|--------|---------|
| `dev` | Vite dev server |
| `build` | `tsc && vite build` |
| `preview` | Preview do build |
| `lint` / `lint:check` | ESLint (com `--fix` no lint) |
| `format` / `format:check` | Prettier em `src/**/*.{ts,tsx}` |
| `test` | Vitest (watch) |
| `test:ci` | `vitest run` |
| `test:coverage` | Cobertura com Vitest |

### Dependências principais

| Pacote | Uso |
|--------|-----|
| React 19 | UI |
| React Router 7 | Roteamento |
| TanStack Query 5 | Cache e estado de servidor |
| react-hook-form + zod | Formulários e validação |
| Radix UI (vários) | Primitivas acessíveis |
| Tailwind + `tailwind-merge` + `clsx` + CVA | Estilização |
| Leaflet + react-leaflet | Mapas (TecnicosMap) |
| supercluster | Clustering de marcadores |
| sonner | Toast notifications |
| lucide-react | Ícones SVG |
| next-themes | Presente no package; uso indireto |
| papaparse (+ `@types/papaparse`) | Parse de CSV (importação de pareamento em `PareamentoPage`) |
| react-colorful | Color picker usado em `InputCor` (Clientes) |

**Dev**: Vite 7, Vitest 4, Testing Library, TypeScript 5.9, ESLint 9 flat config.

### `vite.config.ts`

- Plugin `@vitejs/plugin-react`.
- Alias `@` → `./src`.
- Bloco `test`: `environment: 'jsdom'`, `globals: true`, `setupFiles: ['./src/__tests__/setup.ts']`.

### `tailwind.config.js`

- `darkMode: ['class']`.
- Fontes: `Inter` (padrão), `Roboto Condensed` (`font-condensed`).
- Cores ERP: `erp-blue`, `erp-yellow`, `erp-green`, `erp-orange`, `erp-purple` — usadas em todos os badges e estados da UI.
- Plugin `tailwindcss-animate`.
- Tokens shadcn: `background`, `primary`, `secondary`, etc. ligados a variáveis CSS.

### `tsconfig.json`

- `paths`: `@/*` → `./src/*` (alias de import).
- `strict: true`, `moduleResolution: "bundler"`, `jsx: "react-jsx"`.
- `noUnusedLocals: true`, `verbatimModuleSyntax: true`.

### Variável de ambiente

`VITE_API_URL` — base URL da API; fallback `http://localhost:3000` (definido em `src/lib/api.ts`).

---

## Bootstrap da aplicação (`main.tsx` + `App.tsx`)

### `main.tsx`

- `QueryClient`: `retry: 0`, `staleTime: 60_000`, `refetchOnWindowFocus: false`.
- Providers em ordem: `BrowserRouter` → `AuthProvider` → `App` → `Toaster` (sonner).
- `PageLoader`: componente de loading exibido durante `Suspense` das páginas lazy.

### `App.tsx` — Tabela de rotas

Todas as páginas são carregadas com `lazy()` + `Suspense` (exceto `Login`). Rotas protegidas vivem dentro de `<ProtectedRoute>` + `<AppLayout>`.

| Path | Componente | Notas |
|------|-----------|-------|
| `/login` | `Login` | Público; não lazy |
| `/` | `OrdensServicoPage` | Dashboard de OS |
| `/ordens-servico/nova` | `OrdensServicoCriacaoPage` | — |
| `/pedidos-rastreadores` | `PedidosRastreadoresPage` | — |
| `/pedidos-config` | `PedidosConfigPage` | — |
| `/testes` | `TestesPage` | — |
| `/configuracoes` | `ConfiguracoesPage` | — |
| `/debitos-equipamentos` | `DebitosEquipamentosPage` | — |
| `/cadastro-rastreamento` | `CadastroRastreamentoPage` | — |
| `/usuarios` | `UsuariosPage` | — |
| `/cargos` | `CargosPage` | — |
| `/clientes` | `ClientesPage` | Módulo em `pages/clientes/`: `shared/clientes-page.shared.ts` (schema, API body, rodapé, labels, formatadores de endereço); `hooks/useClientesPageList.ts`; `components/*` (header, tabela, rodapé); `cliente-modal/` (formulário + `useClienteModal`) |
| `/tecnicos` | `TecnicosPage` | — |
| `/aparelhos` | `AparelhosPage` | — |
| `/aparelhos/lote` | `CadastroLotePage` | — |
| `/aparelhos/individual` | `CadastroIndividualPage` | — |
| `/equipamentos` | `EquipamentosPage` | — |
| `/equipamentos/config` | `EquipamentosConfigPage` | — |
| `/equipamentos/pareamento` | `PareamentoPage` | — |
| `/equipamentos/marcas` … `/operadoras` | `Navigate` → `/equipamentos/config` | Redirects legados |
| `*` | `Navigate` → `/` | Fallback |


---

## Testes frontend (`client/src/__tests__/`)

**Runner**: Vitest 4 com `environment: 'jsdom'`.

### `setup.ts`

- Importa `@testing-library/jest-dom`.
- `afterEach`: limpa `localStorage` e chama `vi.restoreAllMocks()`.
- Mock global de `sonner`: `toast` e `Toaster` são substituídos por stubs.
- Polyfill de `globalThis.ResizeObserver` (jsdom não define; Radix Select/Dialog em testes).

### `utils.tsx`

Helper compartilhado de testes: exporta wrapper com providers (QueryClient, Router, AuthProvider) para uso em `render()`.

### Arquivos de teste por área

| Pasta | Arquivos |
|-------|---------|
| `hooks/` | `useConsultaPlaca.test.tsx`, `useDebounce.test.ts`, `useBrasilAPI.test.tsx` |
| `lib/` | `api.test.ts`, `format.test.ts`, `cadastro-rastreamento-*.test.ts` (período, tipo-mappers, mapper, UI, copy), `os-revisao-display.test.ts`, `aparelho-status.test.ts`, `tecnicos-page.test.ts`, `tecnico-map-cluster.test.ts`, `tecnico-map-marker-html.test.ts`, `tecnico-map-spread.test.ts` |
| `pages/cadastro-rastreamento/` | Hook, tabela, toolbar, painel, integração da página, `table-helpers` (ver `docs/context/cadastro-rastreamento.md`) |
| `components/` | `InputCEP`, `InputCNPJ`, `InputPlaca`, `InputTelefone`, `ProtectedRoute`, `TecnicosMap` |
| `contexts/` | `AuthContext.test.tsx` |
| `pages/` | `Login.test.tsx`, `PareamentoPage.test.tsx`, `TecnicosPage.test.tsx`, `tecnicos/tecnico-form.test.ts`, `ClientesPage.test.tsx`, `clientes-page.shared.test.ts` |
| `pages/clientes/` | `ClientesPage.integration.test.tsx`, `ClienteModal.integration.test.tsx`, `useClientesPageList.test.tsx`, `useClienteModal.test.tsx`, `clientes-page.shared.test.ts` (formatadores), testes dos componentes `ClientesPageHeader`, `ClientesTable`, `ClientesTableFooter`, `ClienteRowExpandedPanel` |

Comando: `cd client && npm run test` (watch) ou `npm run test:ci` (CI).

**Padrão de mock**: mocks de módulos externos (Leaflet, sonner) declarados no `setup.ts` global. Para componentes com portals, usar `createPortal` mockado ou `document.body` como container.
