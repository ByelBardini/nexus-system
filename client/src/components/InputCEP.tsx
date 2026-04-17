import { useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { formatarCEP, cepApenasDigitos } from '@/lib/format'
import { buscarCEP } from '@/hooks/useBrasilAPI'
import type { EnderecoCEP } from '@/hooks/useBrasilAPI'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InputCEPProps {
  value: string
  onChange: (value: string) => void
  onAddressFound?: (endereco: EnderecoCEP) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function InputCEP({
  value,
  onChange,
  onAddressFound,
  placeholder = '00000-000',
  className,
  disabled,
}: InputCEPProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatado = formatarCEP(e.target.value)
      const digitos = cepApenasDigitos(formatado)
      onChange(digitos)

      if (digitos.length === 8 && onAddressFound) {
        setIsLoading(true)
        try {
          const endereco = await buscarCEP(digitos)
          if (endereco) {
            onAddressFound(endereco)
          }
        } finally {
          setIsLoading(false)
        }
      }
    },
    [onChange, onAddressFound]
  )

  return (
    <div className="relative">
      <Input
        type="text"
        inputMode="numeric"
        value={value ? formatarCEP(value) : ''}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(isLoading && 'pr-9', className)}
        disabled={disabled || isLoading}
        maxLength={9}
        autoComplete="off"
      />
      {isLoading && (
        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      )}
    </div>
  )
}
