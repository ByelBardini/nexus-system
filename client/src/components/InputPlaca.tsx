import { Input } from "@/components/ui/input";
import { formatarPlaca } from "@/lib/format";
import { cn } from "@/lib/utils";

interface InputPlacaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function InputPlaca({
  value,
  onChange,
  placeholder = "ABC-1D23",
  className,
  disabled,
}: InputPlacaProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatado = formatarPlaca(e.target.value);
    onChange(formatado);
  };

  return (
    <Input
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className={cn("h-9", className)}
      disabled={disabled}
      autoComplete="off"
      maxLength={8}
    />
  );
}
