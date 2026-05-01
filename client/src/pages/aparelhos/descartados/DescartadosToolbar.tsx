import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TipoFilter = "RASTREADOR" | "SIM" | "TODOS";

type DescartadosToolbarProps = {
  busca: string;
  onBuscaChange: (v: string) => void;
  tipoFilter: TipoFilter;
  onTipoFilterChange: (v: TipoFilter) => void;
};

export function DescartadosToolbar({
  busca,
  onBuscaChange,
  tipoFilter,
  onTipoFilterChange,
}: DescartadosToolbarProps) {
  return (
    <div className="flex gap-3 items-center">
      <Input
        placeholder="Buscar por identificador..."
        value={busca}
        onChange={(e) => onBuscaChange(e.target.value)}
        className="max-w-xs h-9"
        data-testid="descartados-busca"
      />
      <Select
        value={tipoFilter}
        onValueChange={(v) => onTipoFilterChange(v as TipoFilter)}
      >
        <SelectTrigger
          className="w-44 h-9"
          data-testid="descartados-tipo-filter"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="TODOS">Todos os tipos</SelectItem>
          <SelectItem value="RASTREADOR">Rastreador</SelectItem>
          <SelectItem value="SIM">SIM</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
