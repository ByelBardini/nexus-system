import { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
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
  const [dropdownStyle, setDropdownStyle] = useState({ top: 0, left: 0, width: 0 })

  useLayoutEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setDropdownStyle({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      })
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onScroll = () => setIsOpen(false)
    document.addEventListener('scroll', onScroll, true)
    return () => document.removeEventListener('scroll', onScroll, true)
  }, [isOpen])

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
      {isOpen &&
        createPortal(
          <div
            className="fixed z-[100] max-h-60 overflow-auto rounded-md border bg-popover py-1 text-popover-foreground shadow-md"
            style={{
              top: dropdownStyle.top,
              left: dropdownStyle.left,
              width: dropdownStyle.width,
              minWidth: 200,
            }}
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
          </div>,
          document.body
        )}
    </div>
  )
}
