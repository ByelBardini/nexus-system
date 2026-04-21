# Context — Nexus System

Ver índice em `AGENTS.md`.

## Frontend (`client/`)

- **Rotas / shell:** `client/src/App.tsx`, layouts em `client/src/layouts/`.
- **Páginas:** `client/src/pages/<área>/` — nomes em PascalCase (`*Page.tsx`).
- **Componentes reutilizáveis:** `client/src/components/`; primitives shadcn em `client/src/components/ui/`.
- **API HTTP:** `client/src/lib/api.ts` — padrão central para chamadas à API.
- **Hooks:** `client/src/hooks/`.
- **Estilo:** paleta ERP em `client/tailwind.config.js` e `client/src/index.css` (cores `erp-*`).

---

### Contexto de autenticação (`client/src/contexts/AuthContext.tsx`)

Único context do app. Provê autenticação persistida em `localStorage` sob a chave `nexus_auth`.

| Export | Tipo | Descrição |
|--------|------|-----------|
| `AuthProvider` | Componente | Envolve o app; inicializa estado de forma síncrona (sem flash de "carregando") |
| `useAuth()` | Hook | Retorna `AuthContextValue`; lança se usado fora de `AuthProvider` |
| `User` | Interface | `{ id: number; nome: string; email: string }` |
| `AuthState` | Interface | `{ user, permissions, accessToken, isLoading, isAuthenticated }` |

**Métodos do `AuthContextValue`:**

| Método | Assinatura | Comportamento |
|--------|-----------|---------------|
| `login` | `(email, password) → Promise<LoginResponse>` | POST `/auth/login`; grava `nexus_auth` e `accessToken` no `localStorage`; retorna `{ exigeTrocaSenha? }` |
| `logout` | `() → void` | Remove `nexus_auth` e `accessToken`; zera estado |
| `hasPermission` | `(code: string) → boolean` | Verifica se `code` existe em `permissions[]` |

**Detalhes de implementação:**
- `accessToken` é salvo **duplamente**: dentro de `nexus_auth` (JSON) e em `localStorage.getItem("accessToken")` — `api.ts` lê diretamente a segunda chave via `getAuthHeaders()`.
- `setOnUnauthorized(logout)` é registrado via `useEffect` para que `api.ts` dispare logout automático em respostas 401.
- Permissões chegam do backend como array de strings (ex.: `"CONFIGURACAO.APARELHO.LISTAR"`).

---

### Hooks (`client/src/hooks/`)

#### `useBrasilAPI.ts`

| Export | Tipo | Descrição |
|--------|------|-----------|
| `useUFs()` | Hook (react-query) | `queryKey: ["brasil-api", "ufs"]`; busca em `https://brasilapi.com.br/api/ibge/uf/v1` |
| `useMunicipios(siglaUF)` | Hook (react-query) | `queryKey: ["brasil-api", "municipios", siglaUF]`; habilitado somente quando `siglaUF != null` |
| `buscarCEP(cep)` | Função async | Via `https://viacep.com.br/ws/{cep}/json/`; retorna `EnderecoCEP \| null`; não lança exceção |
| `UF` | Interface | `{ id, sigla, nome, regiao: { id, sigla, nome } }` |
| `Municipio` | Interface | `{ nome, codigo_ibge }` |
| `EnderecoCEP` | Interface | `{ cep, logradouro, complemento, bairro, localidade, uf, erro? }` |

Usado internamente por `InputCEP` e pelos selects `SelectUF`/`SelectCidade`.

#### `useConsultaPlaca.ts`

```ts
useConsultaPlaca(placaRaw: string | null | undefined): QueryResult<DadosVeiculoPlaca | null>
```

- Normaliza a placa via `placaApenasAlfanumericos` de `@/lib/format`.
- Habilitado somente quando `placa.length === 7`.
- `queryKey: ["veiculos", "consulta-placa", placa]`; endpoint: `GET /veiculos/consulta-placa/{placa}`.
- Retorna `{ marca, modelo, ano, cor, tipo? }`.

#### `useDebounce.ts`

```ts
useDebounce<T>(value: T, delay = 300): T
```

Debounce genérico com `setTimeout`. Delay padrão: 300 ms.

---

### Layout principal (`client/src/layouts/AppLayout.tsx`)

Shell da aplicação para rotas autenticadas. Renderiza sidebar fixa + `<Outlet />`.

**Estrutura da sidebar:**

| Seção | Itens (path → label) |
|-------|---------------------|
| Agendamento | `/` → Ordens de Serviço; `/testes` → Bancada de Testes; `/pedidos-rastreadores` → Pedidos |
| Configuração | `/pedidos-config`, `/equipamentos`, `/aparelhos`, `/debitos-equipamentos`, `/cadastro-rastreamento` |
| Rodapé | `/configuracoes` → Configurações |

**Lógica de `isActive`:**
- `to === "/"`: ativo quando `pathname === "/"` **ou** começa com `"/ordens-servico"`.
- Outros: ativo quando `pathname === to` ou começa com `to + "/"`.

Usa `useAuth()` para exibir `user.nome` e o botão de logout (navega para `/login`). Ícones via `<MaterialIcon>` (Material Symbols).


---

### Utilitários de lib (`client/src/lib/`)

#### `api.ts` — cliente HTTP central

| Export | Assinatura | Comportamento |
|--------|-----------|---------------|
| `api<T>(path, options?)` | async | Faz `fetch` com timeout 15 s; injeta `Authorization: Bearer {token}`; 401 → chama `onUnauthorized` + lança; 204 / body vazio → retorna `undefined as T` |
| `apiGetText(path)` | async | Retorna `string` (ex.: HTML) sem parse JSON |
| `apiDownloadBlob(path, timeoutMs?)` | async | Retorna `Blob`; aceita timeout personalizado para PDFs grandes |
| `getAuthHeaders()` | síncrono | `{ "Content-Type": "application/json", Authorization?: "Bearer ..." }` |
| `setOnUnauthorized(callback)` | síncrono | Registra callback global (chamado por `AuthProvider`) |

`API_BASE` = `VITE_API_URL` ou `http://localhost:3000`. Todas as chamadas usam `credentials: "include"`.

#### `format.ts` — formatadores de exibição

Todas as funções são puras, sem efeito colateral. Convenção: `formatar*` → string com máscara; `*ApenasDigitos` / `*ApenasAlfanumericos` → remove máscara.

| Função | Entrada | Saída | Notas |
|--------|---------|-------|-------|
| `formatarMoeda(reais)` | `number` | `"R$ 1,00"` | `Intl.NumberFormat pt-BR` |
| `formatarMoedaDeCentavos(centavos)` | `number` | `"R$ 1,00"` | Divide por 100 |
| `centavosParaReais(centavos)` | `number` | `"1,00"` | Sem símbolo R$ |
| `reaisParaCentavos(val)` | `string \| number` | `number` (centavos) | Remove não-dígitos; `"1,50"` → `150` |
| `formatarTelefone(val)` | `string` | `"(xx) xxxxx-xxxx"` | ≤10 dígitos = fixo; 11 = celular |
| `telefoneApenasDigitos(val)` | `string` | só dígitos | — |
| `formatarCEP(val)` | `string` | `"12345-678"` | — |
| `cepApenasDigitos(val)` | `string` | só dígitos | — |
| `formatarPlaca(val)` | `string` | `"ABC-1D23"` | Limita a 7 chars alfanum |
| `placaApenasAlfanumericos(val)` | `string` | `"ABC1D23"` (upper) | Usado em `useConsultaPlaca` |
| `formatarCNPJ(val)` | `string` | `"00.000.000/0001-00"` | — |
| `cnpjApenasDigitos(val)` | `string` | só dígitos | — |
| `formatarCPF(val)` | `string` | `"000.000.000-00"` | — |
| `formatarCPFCNPJ(val)` | `string` | CPF ou CNPJ automático | ≤11 dígitos = CPF |
| `cpfCnpjApenasDigitos(val)` | `string` | só dígitos | — |
| `parseDataLocal(str)` | `string` ISO | `Date` no fuso local | Strings `YYYY-MM-DD` usam meio-dia local para evitar virada de dia por UTC |
| `formatarDataCompleta(iso)` | `string` | `"12 abr. 2026"` | — |
| `formatarDataHoraCurta(iso)` | `string` | `"12/04 14:30"` | Sem ano |
| `formatarDataHora(iso)` | `string` | `"12/04/2026 14:30"` | — |
| `formatarMoedaOpcional(value?)` | `number \| null` | `"R$ x,xx"` ou `"-"` | — |
| `formatarDataCurta(data)` | `string` | `"12 Out"` | — |
| `formatarFromNow(iso)` | `string` | `"2h atrás"`, `"3 dias atrás"` etc. | Relativo ao `new Date()` |
| `formatarTempoMinutos(min)` | `number` | `"42 min"` ou `"1h 30min"` | — |
| `formatarDuracao(ini, fim)` | duas `string` | `"4 dias"`, `"1 dia e 2h"` | — |
| `formatId(id)` | `number` | `"000000042"` | 9 dígitos com zero à esquerda |
| `TIPO_OS_LABELS` | `Record<string, string>` | Ex.: `INSTALACAO_COM_BLOQUEIO → "Instalação c/ bloqueio"` | Inclui REVISAO, RETIRADA, DESLOCAMENTO |

#### `utils.ts`

```ts
cn(...inputs: ClassValue[]): string
```
Combina classes Tailwind com `clsx` + `twMerge`. Único export.

#### `aparelho-status.ts`

Define o tipo `StatusAparelho` e a constante `STATUS_CONFIG_APARELHO` com label, cores Tailwind e ícone por status.

| Status | Label | Cor principal |
|--------|-------|---------------|
| `EM_ESTOQUE` | "Em Estoque" | amber |
| `CONFIGURADO` | "Configurado" | blue |
| `DESPACHADO` | "Despachado" | amber |
| `COM_TECNICO` | "Com Técnico" | orange |
| `INSTALADO` | "Instalado" | emerald |

Cada entrada tem: `label`, `color` (text), `bgColor`, `borderColor`, `icon` (emoji), `dotColor` (bg).

#### `os-revisao-display.ts`

Lógica centralizada de como exibir campos de OS por tipo — evitar divergência entre telas.

| Função | Uso |
|--------|-----|
| `getOsDadosTesteParaExibicao(os)` | Retorna `{ imeiEntrada, localInstalacao, posChave }` priorizando campos `*Entrada` se existirem |
| `getCadastroMapDeviceFields(tipoOs, os)` | Retorna campos de dispositivo (IMEI entrada/saída, ICCID, local, posChave) conforme `tipoOs` (`REVISAO`, `RETIRADA` ou outros); flag `isRevisao` |

Em `RETIRADA`: `idAparelho` representa o aparelho que **sai** para o estoque (não entra nenhum). Em `REVISAO`: `idEntrada` é o que entra, `idAparelho` é o que sai.

#### `cadastro-rastreamento-periodo.ts`

```ts
buildCadastroRastreamentoPeriodoQuery(periodo: "hoje" | "semana" | "mes", now?): { dataInicio: string; dataFim: string }
```

Retorna intervalo `[dataInicio, dataFim)` em ISO UTC com limites no calendário **local** (para evitar exclusão de horários no fim do dia por UTC). Semana começa na segunda-feira.

#### `tecnico-map-cluster.ts`

Wrapper em cima de `supercluster` para agrupar técnicos no mapa.

| Export | Uso |
|--------|-----|
| `buildTecnicoSupercluster(plots)` | Cria instância `Supercluster` (radius=56, maxZoom=16, minPoints=2) |
| `isClusterFeature(f)` | Type guard: distingue cluster de marcador individual |
| `geoPointFeatureToPlot(f)` | Converte `GeoJSON.Feature<Point>` de volta para `TecnicoPlotClusterInput` |
| `TecnicoPlotClusterInput` | `{ id, nome, cidadeEndereco, estadoEndereco, lat, lng, precision: "EXATO" \| "CIDADE" }` |

#### `tecnico-map-marker-html.ts`

| Export | Uso |
|--------|-----|
| `escapeHtmlForMarker(text)` | Sanitiza texto da API para HTML de marcador Leaflet (previne XSS) |
| `initialFromNome(nome)` | Primeira letra do nome para exibir no círculo do marcador; retorna `"?"` se vazio |

#### `tecnico-map-spread.ts`

Desloca levemente marcadores com mesma lat/lng em círculo (radius padrão: 48 m) para evitar empilhamento visual. Coordenadas reais (`lat`/`lng`) não são alteradas — apenas `displayLat`/`displayLng` são usadas no Leaflet.

| Export | Uso |
|--------|-----|
| `spreadDuplicateMapCoordinates(items, radiusMeters?)` | Retorna `Array<T & { displayLat, displayLng }>` |
| `groupPlotsByCoordinate(items)` | `Map<coordKey, T[]>` — agrupa por `lat_lng` arredondado a 6 casas |
| `coordKey(lat, lng)` | String de chave: `"${lat*1e6}_${lng*1e6}"` (inteiros) |

#### `tecnicos-page.ts`

Helpers de estado da página de técnicos.

| Export | Tipo | Descrição |
|--------|------|-----------|
| `MapState` | `"collapsed" \| "expanded" \| "fullscreen"` | Estado do painel de mapa lateral |
| `nextMapState(s)` | Função | Ciclo: `collapsed → expanded → fullscreen → collapsed` |
| `tecnicoPrecoToNum(v)` | Função | Normaliza preço de técnico (`string \| number \| undefined`) para `number` |

---

### Componentes reutilizáveis (`client/src/components/`)

Antes de criar um input ou select personalizado, verifique se já existe um componente abaixo.

#### Inputs de dados formatados

Todos seguem o padrão: armazenam **dado bruto** (só dígitos ou string normalizada) e exibem formatado. Importar formatadores de `@/lib/format`.

| Componente | Props essenciais | Dado armazenado | Observações |
|------------|-----------------|-----------------|-------------|
| `InputCEP` | `value`, `onChange`, `onAddressFound?` | dígitos (sem máscara) | Ao completar 8 dígitos chama `buscarCEP` via `@/hooks/useBrasilAPI` e dispara `onAddressFound(EnderecoCEP)`; mostra spinner durante fetch |
| `InputCNPJ` | `value`, `onChange` | dígitos | `formatarCNPJ` / `cnpjApenasDigitos` de `@/lib/format`; maxLength=18 |
| `InputCPFCNPJ` | `value`, `onChange` | dígitos | Detecta CPF (11 dig) ou CNPJ (14 dig) automaticamente; `formatarCPFCNPJ` / `cpfCnpjApenasDigitos` |
| `InputTelefone` | `value`, `onChange` | dígitos | `formatarTelefone` / `telefoneApenasDigitos`; maxLength=15 |
| `InputPlaca` | `value`, `onChange` | string com máscara (`ABC-1D23`) | `formatarPlaca` de `@/lib/format`; maxLength=8; **não** remove máscara — armazena com traço |
| `InputPreco` | `value: number` (centavos), `onChange: (centavos: number)` | centavos (inteiro) | **`value` é `number`, não `string`**; converte com `centavosParaReais` / `reaisParaCentavos`; ao enviar para a API divida por 100 |

#### Selects com busca (dropdowns customizados)

Todos os dropdowns abaixo usam `createPortal` para evitar clipping por overflow. Os que detectam `[role="dialog"]` usam `position: absolute` relativo ao dialog em vez de `fixed` no body.

| Componente | Props essenciais | Comportamento especial |
|------------|-----------------|----------------------|
| `SearchableSelect` | `options: {value, label}[]`, `value`, `onChange` | Propósito geral; suporte a teclado (Escape, Enter seleciona primeiro); abre p/ cima se pouco espaço abaixo |
| `SelectUF` | `ufs: UF[]`, `value` (sigla), `onChange` | UFs de `@/hooks/useBrasilAPI`; exibe `"SP - São Paulo"`; portal dialog-aware |
| `SelectCidade` | `municipios: Municipio[]`, `value` (nome), `onChange` | Municípios de `@/hooks/useBrasilAPI`; filtro por nome; portal dialog-aware |
| `SelectClienteSearch` | `clientes: ClienteOption[]`, `value: number\|undefined`, `onChange` | Busca por nome, cidade, estado; exibe `"Nome (Cidade - UF)"`; dropdown inline (sem portal) |
| `SelectTecnicoSearch` | `tecnicos: TecnicoOption[]`, `value: number\|undefined`, `onChange`, `subclienteCidade?`, `subclienteEstado?` | **Filtra** técnicos pelo estado do subcliente; **ordena por proximidade** (cidade=3, estado=2, outro=1); vazio mostra botão "Cadastrar novo técnico" → navega para `/tecnicos`; portal dialog-aware |
| `IdAparelhoSearch` | `rastreadores: {id, identificador?}[]`, `value`, `onChange` | Busca por `identificador`; texto digitado livre (sem forçar seleção da lista); portal `document.body` |
| `SubclienteNomeAutocomplete` | `subclientes[]`, `value`, `subclienteId?`, `isNovoSubcliente`, `onSelect`, `onSelectNovo`, `onChange` | Autocomplete de nome com opção "Novo Subcliente" inline; MAX_VISIBLE=8; dropdown inline (sem portal) |

#### Outros componentes

| Componente | Props | Uso |
|------------|-------|-----|
| `MaterialIcon` | `name: string`, `className?` | Wrapper de `<span class="material-symbols-outlined">`; ícones do Google Material Symbols |
| `ModalTrocaSenha` | `open`, `onOpenChange?`, `senhaAtual`, `obrigatorio?`, `onSuccess` | Modal de troca de senha; `obrigatorio=true` bloqueia fechar com ESC, clique fora ou botão X; chama `POST /auth/trocar-senha`; valida mínimo 8 chars + 1 número + 1 especial |
| `ProtectedRoute` | `children` | Wrapper de rota; redireciona para `/login` se não autenticado; mostra loading durante `isLoading` de `useAuth` |
| `TecnicosMap` | `tecnicos: TecnicoMapItem[]`, `containerSize: MapContainerSize`, `onMarkerClick?` | Mapa Leaflet exportado como `memo`; ignora técnicos sem lat/lng válidos; clusters com `buildTecnicoSupercluster`; marcadores EXATO (azul, sólido) vs CIDADE (amarelo, tracejado); `containerSize` dispara `map.invalidateSize()` com delay de 320 ms |

#### Padrões de portal/dropdown (para criar novos)

- Dropdown dentro de modal/dialog: detectar `containerRef.current.closest('[role="dialog"]')` e usar `position: absolute` relativo ao dialog; sem isso o `fixed` do portal escapa e fica fora do modal.
- Usar `useLayoutEffect` para calcular posição do trigger (não `useEffect`) — evita flash de posição incorreta.
- Fechar ao scroll externo: `document.addEventListener('scroll', handler, true)` (capture phase).
- Prevenir perda de foco no blur antes do click do item: `onMouseDown={(e) => e.preventDefault()}` no container do dropdown.
