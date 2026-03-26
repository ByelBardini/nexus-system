import { useState, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Option {
  value: string
  label: string
}

interface SearchableSelectProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Selecionar...',
  className,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = options.find((o) => o.value === value)

  const filtered = useMemo(() => {
    if (!search.trim()) return options
    const term = search.toLowerCase()
    return options.filter((o) => o.label.toLowerCase().includes(term))
  }, [options, search])

  useEffect(() => {
    if (!isOpen) {
      setSearch('')
      return
    }
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const dropdownWidth = Math.max(rect.width, 128)
      const spaceBelow = window.innerHeight - rect.bottom
      const openUpward = spaceBelow < 260

      // Horizontal: alinha à direita do trigger se o dropdown sairia da tela
      const leftAligned = rect.left + dropdownWidth <= window.innerWidth - 4
      const left = leftAligned ? rect.left : rect.right - dropdownWidth

      setDropdownStyle({
        position: 'fixed',
        top: openUpward ? rect.top - 4 : rect.bottom + 4,
        ...(openUpward ? { transform: 'translateY(-100%)' } : {}),
        left: Math.max(4, left),
        width: dropdownWidth,
        zIndex: 9999,
      })
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current?.contains(e.target as Node)) return
      if (dropdownRef.current?.contains(e.target as Node)) return
      setIsOpen(false)
    }
    // Fecha ao rolar a página
    function handleScroll() { setIsOpen(false) }
    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [isOpen])

  function open() {
    setIsOpen(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function handleSelect(option: Option) {
    onChange(option.value)
    setIsOpen(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setIsOpen(false)
      return
    }
    if (e.key === 'Enter' && isOpen && filtered.length > 0) {
      e.preventDefault()
      handleSelect(filtered[0])
    }
  }

  const triggerBase =
    'flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background'

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger */}
      {!isOpen ? (
        <button
          type="button"
          onClick={open}
          className={cn(
            triggerBase,
            'hover:bg-accent focus:outline-none focus:ring-1 focus:ring-ring',
            !selected && 'text-muted-foreground'
          )}
        >
          <span className="truncate">{selected?.label ?? placeholder}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      ) : (
        <div className={cn(triggerBase, 'focus-within:ring-1 focus-within:ring-ring')}>
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Filtrar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </div>
      )}

      {/* Dropdown via portal com position:fixed */}
      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="max-h-60 overflow-y-auto overflow-x-hidden rounded-md border bg-popover py-1 text-popover-foreground shadow-md"
          style={{ ...dropdownStyle, pointerEvents: 'auto' }}
        >
          {filtered.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              Nenhuma opção encontrada
            </div>
          ) : (
            filtered.map((option) => (
              <button
                key={option.value}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(option)}
                className={cn(
                  'w-full cursor-pointer px-3 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                  value === option.value && 'bg-accent font-semibold'
                )}
              >
                {option.label}
              </button>
            ))
          )}
        </div>,
        document.body
      )}
    </div>
  )
}
