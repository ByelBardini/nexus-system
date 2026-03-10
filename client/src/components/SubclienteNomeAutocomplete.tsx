import { useState, useMemo, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface SubclienteAutocompleteItem {
  id: number
  nome: string
  cep?: string | null
  logradouro?: string | null
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  cidade?: string | null
  estado?: string | null
  cpf?: string | null
  email?: string | null
  telefone?: string | null
  cobrancaTipo?: string | null
}

const BLUR_DELAY_MS = 150

export function SubclienteNomeAutocomplete({
  subclientes,
  value,
  subclienteId,
  isNovoSubcliente,
  onSelect,
  onSelectNovo,
  onChange,
  placeholder,
}: {
  subclientes: SubclienteAutocompleteItem[]
  value: string
  subclienteId?: number
  isNovoSubcliente: boolean
  onSelect: (s: SubclienteAutocompleteItem) => void
  onSelectNovo: () => void
  onChange: (nome: string) => void
  placeholder?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState(value)
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return subclientes
    const term = searchTerm.toLowerCase()
    return subclientes.filter((s) => s.nome.toLowerCase().includes(term))
  }, [subclientes, searchTerm])

  const displayValue = isOpen ? searchTerm : value

  useEffect(() => {
    if (!isOpen) setSearchTerm(value)
  }, [isOpen, value])

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current)
    }
  }, [])

  function handleFocus() {
    setIsOpen(true)
    setSearchTerm(value)
  }

  function handleBlur() {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current)
    blurTimeoutRef.current = setTimeout(() => {
      blurTimeoutRef.current = null
      setIsOpen(false)
      setSearchTerm(value)
    }, BLUR_DELAY_MS)
  }

  function handleSelect(s: SubclienteAutocompleteItem) {
    onSelect(s)
    setIsOpen(false)
  }

  function handleInputChange(v: string) {
    setSearchTerm(v)
    onChange(v)
  }

  return (
    <div className="relative">
      <Input
        className="h-9 pr-9"
        placeholder={placeholder}
        value={displayValue}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        autoComplete="off"
      />
      <Search className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      {isOpen && (
        <div
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover py-1 text-popover-foreground shadow-md"
          onMouseDown={(e) => e.preventDefault()}
        >
          {filtered.length === 0 ? (
            <div className="px-3 py-4 text-center">
              <button
                type="button"
                className="w-full cursor-pointer rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 outline-none transition-colors hover:border-erp-blue hover:bg-erp-blue/5 hover:text-erp-blue"
                onMouseDown={() => {
                  onSelectNovo()
                  setIsOpen(false)
                }}
              >
                Novo Subcliente
              </button>
              <p className="mt-2 text-[11px] text-slate-500">
                Nenhum subcliente encontrado. Preencha os campos para criar novo.
              </p>
            </div>
          ) : (
            filtered.map((s) => (
              <button
                key={s.id}
                type="button"
                className={cn(
                  'w-full cursor-pointer px-3 py-2 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                  !isNovoSubcliente && subclienteId === s.id && 'bg-accent'
                )}
                onMouseDown={() => handleSelect(s)}
              >
                {s.nome}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
