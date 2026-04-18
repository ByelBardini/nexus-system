import { Input } from "@/components/ui/input";
import { formatarCPFCNPJ, cpfCnpjApenasDigitos } from "@/lib/format";

interface InputCPFCNPJProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function InputCPFCNPJ({
  value,
  onChange,
  placeholder = "000.000.000-00",
  className,
  disabled,
}: InputCPFCNPJProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatado = formatarCPFCNPJ(e.target.value);
    onChange(cpfCnpjApenasDigitos(formatado));
  }

  return (
    <Input
      type="text"
      inputMode="numeric"
      value={value ? formatarCPFCNPJ(value) : ""}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      maxLength={18}
      autoComplete="off"
    />
  );
}
