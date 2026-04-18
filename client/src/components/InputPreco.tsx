import { Input } from "@/components/ui/input";
import { centavosParaReais, reaisParaCentavos } from "@/lib/format";

interface InputPrecoProps {
  value: number; // centavos
  onChange: (centavos: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function InputPreco({
  value,
  onChange,
  placeholder = "0,00",
  className,
  disabled,
}: InputPrecoProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const centavos = reaisParaCentavos(e.target.value);
    onChange(centavos);
  }

  return (
    <Input
      type="text"
      inputMode="decimal"
      value={value ? centavosParaReais(value) : ""}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
    />
  );
}
