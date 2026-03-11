import { useState, useMemo, useEffect, useRef, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { Search } from 'lucide-react'
import { MaterialIcon } from '@/components/MaterialIcon'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { RastreadorParaTeste } from './testes-types'

const BLUR_DELAY_MS = 150

function textoRastreador(r: RastreadorParaTeste): string {
  const imei = (r.identificador ?? '').trim()
  const iccid = (r.simVinculado?.identificador ?? '').trim()
  const marcaModelo = [r.marca, r.modelo].filter(Boolean).join(' ')
  const operadora = r.marcaSimcard?.operadora?.nome ?? r.operadora ?? ''
  const marcaSim = r.marcaSimcard?.nome ?? ''
  const plano = r.planoSimcard?.planoMb ?? r.simVinculado?.planoSimcard?.planoMb
  const partes = [imei, iccid, marcaModelo, operadora, marcaSim]
  if (plano != null) partes.push(`${plano}MB`)
  return partes.filter(Boolean).join(' ').toLowerCase()
}

export function SelectRastreadorTeste({
  rastreadores,
  value,
  onChange,
  placeholder = 'Buscar IMEI, ICCID ou Serial...',
}: {
  rastreadores: RastreadorParaTeste[]
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState(value)
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [dropdownStyle, setDropdownStyle] = useState({ top: 0, left: 0, width: 0 })
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
    const onScroll = (e: Event) => {
      if (dropdownRef.current?.contains(e.target as Node)) return
      setIsOpen(false)
    }
    document.addEventListener('scroll', onScroll, true)
    return () => document.removeEventListener('scroll', onScroll, true)
  }, [isOpen])

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current)
    }
  }, [])

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return rastreadores.slice(0, 15)
    const term = searchTerm.toLowerCase()
    return rastreadores.filter((r) => textoRastreador(r).includes(term))
  }, [rastreadores, searchTerm])

  const displayValue = isOpen ? searchTerm : value

  useEffect(() => {
    if (!isOpen) setSearchTerm(value)
  }, [isOpen, value])

  function handleFocus() {
    setIsOpen(true)
    setSearchTerm(value)
  }

  function handleBlur() {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current)
    blurTimeoutRef.current = setTimeout(() => {
      blurTimeoutRef.current = null
      setIsOpen(false)
      const trimmed = searchTerm.trim()
      if (trimmed) onChange(trimmed)
    }, BLUR_DELAY_MS)
  }

  function handleSelect(id: string) {
    setSearchTerm(id)
    onChange(id)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        className="h-9 pr-9"
        placeholder={placeholder}
        value={displayValue}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        autoComplete="off"
      />
      <Search className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[100] max-h-72 overflow-auto rounded-md border border-slate-200 bg-popover py-1 text-popover-foreground shadow-lg"
            style={{
              top: dropdownStyle.top,
              left: dropdownStyle.left,
              width: Math.max(dropdownStyle.width, 420),
              minWidth: 420,
            }}
            onMouseDown={(e) => {
              if ((e.target as HTMLElement).closest('button')) e.preventDefault()
            }}
          >
            {value && (
              <button
                type="button"
                className="w-full cursor-pointer px-3 py-2 text-left text-[11px] text-slate-500 hover:bg-accent"
                onMouseDown={(e) => {
                  e.preventDefault()
                  onChange('')
                  setSearchTerm('')
                }}
              >
                Limpar
              </button>
            )}
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-[11px] text-slate-500">
                Nenhum rastreador encontrado.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-0.5 px-1">
                {filtered.map((r) => {
                  const id = (r.identificador ?? '').trim()
                  if (!id) return null
                  const imei = id
                  const iccid = (r.simVinculado?.identificador ?? '').trim()
                  const marcaModelo = [r.marca, r.modelo].filter(Boolean).join(' ') || '—'
                  const operadora =
                    r.marcaSimcard?.operadora?.nome ??
                    r.operadora ??
                    r.simVinculado?.marcaSimcard?.operadora?.nome ??
                    r.simVinculado?.operadora ??
                    null
                  const marcaSim = r.marcaSimcard?.nome ?? r.simVinculado?.marcaSimcard?.nome ?? null
                  const plano = r.planoSimcard?.planoMb ?? r.simVinculado?.planoSimcard?.planoMb
                  const planoStr = plano != null ? `${plano} MB` : null
                  const partes = [operadora, marcaSim, planoStr].filter((x): x is string => !!x)
                  const operadoraLinha = partes.length > 0 ? partes.join(' / ') : null

                  return (
                    <button
                      key={r.id}
                      type="button"
                      className={cn(
                        'flex items-start gap-3 rounded px-3 py-2.5 text-left outline-none transition-colors hover:bg-accent hover:text-accent-foreground',
                        value === id && 'bg-accent'
                      )}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        handleSelect(id)
                      }}
                    >
                      <div className="shrink-0 mt-0.5 flex h-9 w-9 items-center justify-center rounded-md bg-erp-blue/10">
                        <MaterialIcon name="router" className="text-erp-blue text-lg" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs">
                          <span className="font-mono font-bold text-slate-800">{imei}</span>
                          {iccid && (
                            <span className="font-mono text-slate-600">{iccid}</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-600">
                          <span className="font-medium">{marcaModelo}</span>
                        </div>
                        {operadoraLinha && (
                          <div className="text-[10px] text-slate-500">
                            {operadoraLinha}
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  )
}
