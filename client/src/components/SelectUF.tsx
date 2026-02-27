import { useState, useMemo, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { UF } from '@/hooks/useBrasilAPI'

interface SelectUFProps {
  ufs: UF[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function SelectUF({
  ufs,
  value,
  onChange,
  disabled,
  placeholder = 'Pesquisar estado...',
  className,
}: SelectUFProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedUF = useMemo(() => ufs.find((uf) => uf.sigla === value), [ufs, value])

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return ufs
    const term = searchTerm.toLowerCase()
    return ufs.filter(
      (uf) =>
        uf.nome.toLowerCase().includes(term) ||
        uf.sigla.toLowerCase().includes(term)
    )
  }, [ufs, searchTerm])

  const displayValue = isOpen ? searchTerm : (selectedUF ? `${selectedUF.sigla} - ${selectedUF.nome}` : '')

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm(selectedUF ? `${selectedUF.sigla} - ${selectedUF.nome}` : '')
    }
  }, [isOpen, selectedUF])

  function handleFocus() {
    if (disabled) return
    setIsOpen(true)
    setSearchTerm('')
  }

  function handleBlur() {
    setTimeout(() => {
      setIsOpen(false)
    }, 150)
  }

  function handleSelect(sigla: string) {
    onChange(sigla)
    setIsOpen(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setIsOpen(false)
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
        <span className={value ? 'text-foreground' : ''}>{displayValue || placeholder}</span>
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
              Nenhum estado encontrado
            </div>
          ) : (
            filtered.map((uf) => (
              <button
                key={uf.id}
                type="button"
                className={cn(
                  'w-full cursor-pointer px-3 py-2 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                  value === uf.sigla && 'bg-accent'
                )}
                onMouseDown={() => handleSelect(uf.sigla)}
              >
                {uf.sigla} - {uf.nome}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
