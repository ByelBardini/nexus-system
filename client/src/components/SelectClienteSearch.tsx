import { useState, useMemo, useRef, useEffect } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface ClienteOption {
  id: number
  nome: string
  cidade?: string | null
  estado?: string | null
}

interface SelectClienteSearchProps {
  clientes: ClienteOption[]
  value: number | undefined
  onChange: (id: number | undefined) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

function getDisplayText(c?: ClienteOption | null) {
  if (!c) return ''
  const loc = c.cidade && c.estado ? `${c.cidade} - ${c.estado}` : c.cidade ?? c.estado ?? ''
  return loc ? `${c.nome} (${loc})` : c.nome
}

export function SelectClienteSearch({
  clientes,
  value,
  onChange,
  disabled,
  placeholder = 'Digite para pesquisar cliente...',
  className,
}: SelectClienteSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const clienteSelecionado = clientes.find((c) => c.id === value)

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return clientes
    const term = searchTerm.toLowerCase()
    return clientes.filter((c) =>
      c.nome.toLowerCase().includes(term) ||
      c.cidade?.toLowerCase().includes(term) ||
      c.estado?.toUpperCase().includes(term.toUpperCase())
    )
  }, [clientes, searchTerm])

  const displayValue = isOpen ? searchTerm : getDisplayText(clienteSelecionado)

  useEffect(() => {
    if (!isOpen) setSearchTerm(getDisplayText(clienteSelecionado))
  }, [isOpen, clienteSelecionado])

  useEffect(() => {
    if (!isOpen) return
    function handleClickOutside(e: MouseEvent) {
      const el = e.target as Node
      if (containerRef.current?.contains(el)) return
      setIsOpen(false)
      setSearchTerm(getDisplayText(clienteSelecionado))
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, clienteSelecionado?.nome])

  function handleFocus() {
    if (disabled) return
    setIsOpen(true)
    setSearchTerm('')
  }

  function handleSelect(c: ClienteOption) {
    onChange(c.id)
    setIsOpen(false)
  }

  function handleClear() {
    onChange(undefined)
    setIsOpen(false)
    setSearchTerm('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setIsOpen(false)
      setSearchTerm(getDisplayText(clienteSelecionado))
      return
    }
    if (e.key === 'Enter' && isOpen && filtered.length > 0) {
      e.preventDefault()
      handleSelect(filtered[0])
    }
  }

  if (disabled) {
    return (
      <div
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground',
          className
        )}
      >
        <span className={clienteSelecionado ? 'text-foreground' : ''}>
          {clienteSelecionado?.nome ?? placeholder}
        </span>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        className={cn('h-9 pr-9', className)}
        placeholder={placeholder}
        value={displayValue}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
      <Search className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      {isOpen && (
        <div
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover py-1 text-popover-foreground shadow-md"
        >
          {value && (
            <button
              type="button"
              className="w-full cursor-pointer px-3 py-2 text-left text-[11px] text-slate-500 hover:bg-accent"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleClear()
              }}
            >
              Limpar seleção
            </button>
          )}
          {filtered.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              Nenhum cliente encontrado
            </div>
          ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={cn(
                    'w-full cursor-pointer px-3 py-2 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                    value === c.id && 'bg-accent'
                  )}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleSelect(c)
                  }}
                >
                  <span className="font-medium">{c.nome}</span>
                  {(c.cidade || c.estado) && (
                    <span className="ml-1.5 text-slate-500 text-[11px]">
                      {c.cidade && c.estado ? `${c.cidade} - ${c.estado}` : c.cidade ?? c.estado}
                    </span>
                  )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
