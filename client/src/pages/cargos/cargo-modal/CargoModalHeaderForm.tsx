import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CategoriaCargo } from "@/types/cargo";

export function CargoModalHeaderForm({
  isNew,
  nome,
  descricao,
  categoria,
  ativo,
  onNomeChange,
  onDescricaoChange,
  onCategoriaChange,
  onAtivoChange,
}: {
  isNew: boolean;
  nome: string;
  descricao: string;
  categoria: CategoriaCargo;
  ativo: boolean;
  onNomeChange: (v: string) => void;
  onDescricaoChange: (v: string) => void;
  onCategoriaChange: (v: CategoriaCargo) => void;
  onAtivoChange: (v: boolean) => void;
}) {
  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-4">
        <Label className="text-[10px] font-bold uppercase text-slate-500">
          Nome do Cargo
        </Label>
        <Input
          className="w-full h-10 mt-1"
          placeholder="Ex: Operador Logístico Nível II"
          value={nome}
          onChange={(e) => onNomeChange(e.target.value)}
        />
      </div>
      <div className="col-span-3">
        <Label className="text-[10px] font-bold uppercase text-slate-500">
          Categoria
        </Label>
        <Select
          value={categoria}
          onValueChange={(v: CategoriaCargo) => onCategoriaChange(v)}
        >
          <SelectTrigger className="h-10 mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="OPERACIONAL">Operacional</SelectItem>
            <SelectItem value="ADMINISTRATIVO">Administrativo</SelectItem>
            <SelectItem value="GESTAO">Gestão</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-5">
        <Label className="text-[10px] font-bold uppercase text-slate-500">
          Descrição
        </Label>
        <Input
          className="w-full h-10 mt-1"
          placeholder="Breve descrição das responsabilidades..."
          value={descricao}
          onChange={(e) => onDescricaoChange(e.target.value)}
        />
      </div>
      {!isNew && (
        <div className="col-span-12 flex items-center gap-2 pt-2">
          <Checkbox
            id="cargoAtivo"
            checked={ativo}
            onCheckedChange={(checked) => onAtivoChange(checked === true)}
          />
          <Label
            htmlFor="cargoAtivo"
            className="text-sm font-medium cursor-pointer"
          >
            Cargo ativo (desmarque para inativar)
          </Label>
        </div>
      )}
    </div>
  );
}
