import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { CategoriaFalha } from "./useCategoriasFalhaConfig";

type Props = {
  open: boolean;
  modo: "criar" | "editar";
  item?: CategoriaFalha;
  onFechar: () => void;
  onSalvar: (dto: { nome: string; motivaTexto: boolean }) => void;
  isPending: boolean;
};

export function CategoriaFalhaModal({
  open,
  modo,
  item,
  onFechar,
  onSalvar,
  isPending,
}: Props) {
  const [nome, setNome] = useState("");
  const [motivaTexto, setMotivaTexto] = useState(false);

  useEffect(() => {
    if (open) {
      setNome(item?.nome ?? "");
      setMotivaTexto(item?.motivaTexto ?? false);
    }
  }, [open, item]);

  const handleSalvar = () => {
    if (!nome.trim()) return;
    onSalvar({ nome: nome.trim(), motivaTexto });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {modo === "criar" ? "Nova Categoria de Falha" : "Editar Categoria"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="nome-categoria">Nome</Label>
            <Input
              id="nome-categoria"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Falha de Comunicação"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="motiva-texto" className="cursor-pointer">
              Exige descrição do defeito
            </Label>
            <Switch
              id="motiva-texto"
              checked={motivaTexto}
              onCheckedChange={setMotivaTexto}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onFechar} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar} disabled={isPending || !nome.trim()}>
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
