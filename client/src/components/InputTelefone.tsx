import { Input } from "@/components/ui/input";
import { formatarTelefone, telefoneApenasDigitos } from "@/lib/format";

interface InputTelefoneProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function InputTelefone({
  value,
  onChange,
  placeholder = "(00) 00000-0000",
  className,
  disabled,
}: InputTelefoneProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatado = formatarTelefone(e.target.value);
    onChange(telefoneApenasDigitos(formatado));
  }

  return (
    <Input
      type="tel"
      value={value ? formatarTelefone(value) : ""}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      maxLength={15}
      autoComplete="off"
    />
  );
}
