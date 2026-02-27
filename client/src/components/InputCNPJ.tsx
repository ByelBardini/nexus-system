import { Input } from '@/components/ui/input'
import { formatarCNPJ, cnpjApenasDigitos } from '@/lib/format'

interface InputCNPJProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function InputCNPJ({
  value,
  onChange,
  placeholder = '00.000.000/0001-00',
  className,
  disabled,
}: InputCNPJProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatado = formatarCNPJ(e.target.value)
    onChange(cnpjApenasDigitos(formatado))
  }

  return (
    <Input
      type="text"
      value={value ? formatarCNPJ(value) : ''}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      maxLength={18}
    />
  )
}
