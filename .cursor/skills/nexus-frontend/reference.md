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

## Componentes existentes – reutilizar sempre

Antes de criar qualquer componente, verificar `components/ui/` e `components/`:

- **UI:** button, input, label, select, table, dialog, card, checkbox, sheet, dropdown-menu, toast, sonner, form, separator
- **Domínio:** InputCNPJ, InputCPFCNPJ, InputTelefone, InputCEP, InputPreco, SelectCidade, SelectUF, MaterialIcon, ProtectedRoute

Criar novo componente **apenas** quando a funcionalidade não existir no projeto.

## components.json (shadcn)

- style: "new-york"
- baseColor: "neutral"
- iconLibrary: "lucide"
- Aliases: `@/components`, `@/lib/utils`, `@/components/ui`, `@/lib`, `@/hooks`

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

## Exemplo: Status workflow (OrdensServicoPage)

```tsx
const statusColors: Record<string, string> = {
  AGENDADO: 'bg-erp-yellow/10 text-yellow-800 border-erp-yellow/30',
  EM_TESTES: 'bg-erp-blue/10 text-erp-blue border-erp-blue/30',
  FINALIZADO: 'bg-erp-green/10 text-green-800 border-erp-green/30',
  CANCELADO: 'bg-slate-200 text-slate-600 border-slate-400',
}

<span className={`px-1.5 py-0.5 border ${statusColors[status]}`}>{label}</span>
```
