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
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedUF = useMemo(() => ufs.find((uf) => uf.sigla === value), [ufs, value])
  const [dropdownStyle, setDropdownStyle] = useState({
    top: 0,
    left: 0,
    width: 0,
    position: 'fixed' as 'fixed' | 'absolute',
  })

  useLayoutEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const dialog = containerRef.current.closest('[role="dialog"]')
      if (dialog) {
        const dialogRect = dialog.getBoundingClientRect()
        setDropdownStyle({
          top: rect.bottom - dialogRect.top + 4,
          left: rect.left - dialogRect.left,
          width: rect.width,
          position: 'absolute',
        })
      } else {
        setDropdownStyle({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width,
          position: 'fixed',
        })
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onScroll = () => setIsOpen(false)
    document.addEventListener('scroll', onScroll, true)
    return () => document.removeEventListener('scroll', onScroll, true)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    function handleClickOutside(e: MouseEvent) {
      const el = e.target as Node
      if (containerRef.current?.contains(el) || dropdownRef.current?.contains(el)) return
      setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
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

  function handleSelect(sigla: string) {
    onChange(sigla)
    setIsOpen(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setIsOpen(false)
      return
    }
    if (e.key === 'Enter' && isOpen && filtered.length > 0) {
      e.preventDefault()
      handleSelect(filtered[0].sigla)
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

  const portalContainer =
    (typeof document !== 'undefined' && containerRef.current?.closest('[role="dialog"]')) || document?.body

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
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
      {isOpen &&
        portalContainer &&
        createPortal(
          <div
            ref={dropdownRef}
            className="z-[9999] max-h-60 overflow-y-auto overflow-x-hidden overscroll-contain rounded-md border bg-popover py-1 text-popover-foreground shadow-md"
            style={{
              position: dropdownStyle.position,
              top: dropdownStyle.top,
              left: dropdownStyle.left,
              width: dropdownStyle.width,
              minWidth: 200,
            }}
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
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleSelect(uf.sigla)
                  }}
                >
                  {uf.sigla} - {uf.nome}
                </button>
              ))
            )}
          </div>,
          portalContainer
        )}
    </div>
  )
}
