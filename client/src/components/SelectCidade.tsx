import { useState, useMemo, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { Municipio } from '@/hooks/useBrasilAPI'

interface SelectCidadeProps {
  municipios: Municipio[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function SelectCidade({
  municipios,
  value,
  onChange,
  disabled,
  placeholder = 'Selecione a cidade',
  className,
}: SelectCidadeProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return municipios
    const term = searchTerm.toLowerCase()
    return municipios.filter((m) => m.nome.toLowerCase().includes(term))
  }, [municipios, searchTerm])

  const displayValue = isOpen ? searchTerm : value

  useEffect(() => {
    if (!isOpen) setSearchTerm(value)
  }, [isOpen, value])

  function handleFocus() {
    if (disabled) return
    setIsOpen(true)
    setSearchTerm(value)
  }

  function handleBlur() {
    setTimeout(() => {
      setIsOpen(false)
      if (value && !searchTerm) setSearchTerm(value)
    }, 150)
  }

  function handleSelect(nome: string) {
    onChange(nome)
    setIsOpen(false)
    setSearchTerm(nome)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setIsOpen(false)
      setSearchTerm(value)
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
        <span className={value ? 'text-foreground' : ''}>{value || placeholder}</span>
        <ChevronDown className="h-4 w-4 opacity-50" />
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
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
      {isOpen && (
        <div
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover py-1 text-popover-foreground shadow-md"
          onMouseDown={(e) => e.preventDefault()}
        >
          {filtered.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              Nenhuma cidade encontrada
            </div>
          ) : (
            filtered.map((m) => (
              <button
                key={m.codigo_ibge}
                type="button"
                className={cn(
                  'w-full cursor-pointer px-3 py-2 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                  value === m.nome && 'bg-accent'
                )}
                onMouseDown={() => handleSelect(m.nome)}
              >
                {m.nome}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
