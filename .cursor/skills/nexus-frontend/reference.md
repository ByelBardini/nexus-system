# Nexus Frontend – Referência Técnica

## tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        condensed: ['Roboto Condensed', 'sans-serif']
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      colors: {
        'erp-blue': '#2563eb',
        'erp-yellow': '#eab308',
        'erp-orange': '#f97316',
        'erp-green': '#16a34a',
        'erp-purple': '#8b5cf6',
        'erp-bg': '#f1f5f9',
        // + shadcn semantic colors (background, foreground, primary, etc.)
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
}
```

## index.css – Variáveis e Classes Base

### Variáveis CSS (:root e .dark)

- `--background`, `--foreground`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--radius`
- `--chart-1` a `--chart-5` para gráficos

### Base

```css
body {
  @apply bg-erp-bg text-slate-900 font-sans text-sm;
}
h1, h2, h3, h4, h5, h6 {
  @apply font-condensed uppercase tracking-tight;
}
```

### .erp-table

```css
.erp-table th {
  @apply px-3 py-2 text-[11px] font-bold border-b-2 border-slate-300 bg-slate-200 text-slate-700 uppercase;
}
.erp-table td {
  @apply px-3 py-1.5 border-b border-slate-200 align-middle;
}
```

### .pipeline-item

Pipeline com clip-path hexagonal. Ver `index.css` para implementação completa.

---

## Componentes existentes – reutilizar sempre

Antes de criar qualquer componente, verificar `components/ui/` e `components/`:

- **UI:** button, input, label, select, table, dialog, card, checkbox, sheet, dropdown-menu, toast, sonner, form, separator
- **Domínio:** InputCNPJ, InputCPFCNPJ, InputTelefone, InputCEP, InputPreco, InputPlaca, SelectCidade, SelectUF, SelectClienteSearch, SelectTecnicoSearch, MaterialIcon, ProtectedRoute

Criar novo componente **apenas** quando a funcionalidade não existir no projeto.

---

## components.json (shadcn)

- style: "new-york"
- baseColor: "neutral"
- iconLibrary: "lucide"
- Aliases: `@/components`, `@/lib/utils`, `@/components/ui`, `@/lib`, `@/hooks`

---

## Exemplo Completo: Tela Principal (Listagem)

```tsx
// ProdutosPage.tsx — tela principal SEM header próprio
export function ProdutosPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { hasPermission } = useAuth()
  const canCreate = hasPermission('PRODUTOS.CRIAR')

  const { data, isLoading } = useQuery({ ... })

  return (
    <div className="space-y-4">
      {/* Toolbar: máximo 1 busca + filtros + 1 botão */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xs">
          <MaterialIcon
            name="search"
            className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-base"
          />
          <Input
            className="pl-8 text-[11px]"
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {canCreate && (
            <Button
              onClick={openCreate}
              className="bg-erp-blue hover:bg-blue-700 text-[11px] font-bold uppercase"
            >
              <MaterialIcon name="add" className="text-sm mr-1" />
              Novo Produto
            </Button>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse erp-table font-condensed">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Status</th>
              <th className="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((item) => (
              <tr key={item.id}>
                <td>{item.nome}</td>
                <td>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${statusColors[item.status]}`}>
                    {item.status}
                  </span>
                </td>
                <td className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

---

## Exemplo Completo: Tela Secundária (Criação/Detalhe)

```tsx
// ProdutoCriacaoPage.tsx — tela secundária COM header próprio
export function ProdutoCriacaoPage() {
  return (
    <div className="-m-4 flex min-h-[100dvh] flex-col bg-slate-100">

      {/* Header: h-20, botão voltar + ícone + título + subtítulo + ações */}
      <header className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8">
        <div className="flex items-center gap-4">
          <Link
            to="/produtos"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-3">
            <MaterialIcon name="inventory_2" className="text-erp-blue text-xl" />
            <div>
              <h1 className="text-lg font-bold text-slate-800">Novo Produto</h1>
              <p className="text-xs text-slate-500">Preencha os dados do produto</p>
            </div>
          </div>
        </div>
        {/* Ações do header com Label acima para alinhamento */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1 opacity-0">Ação</Label>
            <Button
              className="bg-erp-blue hover:bg-blue-700 text-white text-sm font-bold h-9 px-4 rounded-sm"
              onClick={handleSave}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MaterialIcon name="save" className="text-lg mr-2" />}
              Salvar
            </Button>
          </div>
        </div>
      </header>

      {/* Conteúdo scrollável */}
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* Seções do formulário */}
        <section className="bg-white border border-slate-300 shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-300 px-4 py-2 flex items-center gap-2">
            <MaterialIcon name="info" className="text-slate-400 text-lg" />
            <h2 className="text-xs font-bold text-slate-700 font-condensed uppercase">
              Informações Gerais
            </h2>
          </div>
          <div className="p-4 grid grid-cols-6 gap-4">
            <div className="col-span-3">
              <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                Nome <span className="text-red-500">*</span>
              </Label>
              <Input {...form.register('nome')} className="h-9" placeholder="Nome do produto" />
            </div>
          </div>
        </section>
      </div>

    </div>
  )
}
```

---

## Exemplo Completo: Modal (Dialog)

```tsx
// Padrão obrigatório para todos os modais do projeto
<Dialog open={modalOpen} onOpenChange={(o) => !o && closeModal()}>
  <DialogContent hideClose className="max-w-md p-0 gap-0 overflow-hidden rounded-sm">

    {/* Header: ícone que simboliza a função + título + botão X */}
    <header className="bg-white border-b border-slate-200 p-6 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <MaterialIcon name="devices" className="text-erp-blue" />
        <h2 className="text-lg font-bold text-slate-800">
          {editingItem ? 'Editar Modelo' : 'Novo Modelo'}
        </h2>
      </div>
      <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
        <X className="h-5 w-5" />
      </button>
    </header>

    {/* Body */}
    <div className="p-6 space-y-4">
      <div>
        <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
          Campo <span className="text-red-500">*</span>
        </Label>
        <Input value={nome} onChange={(e) => setNome(e.target.value)} className="h-10" />
      </div>
    </div>

    {/* Footer: cancelar + ação principal */}
    <footer className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end gap-3">
      <Button variant="ghost" onClick={closeModal} disabled={isPending}>
        Cancelar
      </Button>
      <Button
        className="bg-erp-blue hover:bg-blue-700"
        onClick={handleSave}
        disabled={isPending || !isValid}
      >
        {isPending ? 'Salvando...' : 'Salvar'}
      </Button>
    </footer>

  </DialogContent>
</Dialog>
```

---

## Exemplo: Campos de Formulário

```tsx
{/* Input simples */}
<div>
  <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Nome</Label>
  <Input {...form.register('nome')} className="h-9" placeholder="Ex: João Silva" autoComplete="off" />
</div>

{/* Select */}
<div>
  <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Tipo</Label>
  <Controller name="tipo" control={form.control} render={({ field }) => (
    <Select value={field.value} onValueChange={field.onChange}>
      <SelectTrigger className="h-9"><SelectValue placeholder="Selecione..." /></SelectTrigger>
      <SelectContent>
        <SelectItem value="A">Opção A</SelectItem>
        <SelectItem value="B">Opção B</SelectItem>
      </SelectContent>
    </Select>
  )} />
</div>

{/* CPF/CNPJ — usar componente existente */}
<div>
  <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">CPF/CNPJ</Label>
  <Controller name="cpfCnpj" control={form.control} render={({ field }) => (
    <InputCPFCNPJ value={field.value ?? ''} onChange={field.onChange} className="h-9" />
  )} />
</div>

{/* CEP — usar componente existente com autopreenchimento */}
<div>
  <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">CEP</Label>
  <Controller name="cep" control={form.control} render={({ field }) => (
    <InputCEP
      value={field.value ?? ''}
      onChange={field.onChange}
      onAddressFound={handleAddressFound}
      placeholder="00000-000"
      className="h-9"
    />
  )} />
</div>

{/* Telefone — usar componente existente */}
<div>
  <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Telefone</Label>
  <Controller name="telefone" control={form.control} render={({ field }) => (
    <InputTelefone value={field.value ?? ''} onChange={field.onChange} className="h-9" />
  )} />
</div>

{/* Textarea */}
<div>
  <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Observações</Label>
  <textarea
    {...form.register('observacoes')}
    className="w-full min-h-[96px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
    placeholder="Observações adicionais..."
  />
</div>

{/* Toggle button (sim/não) */}
<Controller name="ativo" control={form.control} render={({ field }) => (
  <Button
    type="button"
    variant={field.value ? 'default' : 'outline'}
    size="sm"
    className={cn('h-9 w-full text-[11px] font-bold uppercase', field.value && 'bg-erp-blue hover:bg-blue-700')}
    onClick={() => field.onChange(!field.value)}
  >
    {field.value ? 'Sim' : 'Não'}
  </Button>
)} />
```

---

## Exemplo: Requisição API

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

const { data } = useQuery({
  queryKey: ['clientes'],
  queryFn: () => api('/clientes'),
})

const mutation = useMutation({
  mutationFn: (data) => api('/clientes', { method: 'POST', body: JSON.stringify(data) }),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clientes'] }),
})
```

---

## Exemplo: Formulário (RHF + Zod)

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({ nome: z.string().min(1, 'Nome obrigatório') })
type FormData = z.infer<typeof schema>

const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: { nome: '' },
})
```

---

## Exemplo: Componente UI (padrão shadcn)

```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva("...", {
  variants: { variant: {...}, size: {...} },
  defaultVariants: { variant: "default", size: "default" },
})

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  )
)
Button.displayName = "Button"
```

---

## Exemplo: Status workflow

```tsx
const statusColors: Record<string, string> = {
  AGENDADO: 'bg-erp-yellow/10 text-yellow-800 border-erp-yellow/30',
  EM_TESTES: 'bg-erp-blue/10 text-erp-blue border-erp-blue/30',
  FINALIZADO: 'bg-erp-green/10 text-green-800 border-erp-green/30',
  CANCELADO: 'bg-slate-200 text-slate-600 border-slate-400',
}

<span className={`px-1.5 py-0.5 border ${statusColors[status]}`}>{label}</span>
```

---

## Exemplo: Badge de entidade (ATIVO/INATIVO/PENDENTE)

```tsx
const entityStatusColors: Record<string, string> = {
  ATIVO: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PENDENTE: 'bg-amber-50 text-amber-700 border-amber-200',
  INATIVO: 'bg-slate-100 text-slate-500 border-slate-200',
}

<span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${entityStatusColors[status]}`}>
  {status}
</span>
```
