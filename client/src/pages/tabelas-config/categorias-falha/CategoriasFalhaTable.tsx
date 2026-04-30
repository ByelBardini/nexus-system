import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";
import type { CategoriaFalha } from "./useCategoriasFalhaConfig";

type Props = {
  categorias: CategoriaFalha[];
  canEdit: boolean;
  onEditar: (cat: CategoriaFalha) => void;
  onDesativar: (id: number) => void;
  isDesativando: boolean;
};

export function CategoriasFalhaTable({
  categorias,
  canEdit,
  onEditar,
  onDesativar,
  isDesativando,
}: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead className="text-center">Exige Descrição</TableHead>
          <TableHead className="text-center">Ativo</TableHead>
          {canEdit && <TableHead className="text-right">Ações</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {categorias.length === 0 && (
          <TableRow>
            <TableCell colSpan={canEdit ? 4 : 3} className="text-center text-slate-400 py-8">
              Nenhuma categoria cadastrada
            </TableCell>
          </TableRow>
        )}
        {categorias.map((cat) => (
          <TableRow key={cat.id} className={cn(!cat.ativo && "opacity-50")}>
            <TableCell className="font-medium">{cat.nome}</TableCell>
            <TableCell className="text-center">
              {cat.motivaTexto ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
                  <MaterialIcon name="edit_note" className="text-sm" />
                  Sim
                </span>
              ) : (
                <span className="text-xs text-slate-400">Não</span>
              )}
            </TableCell>
            <TableCell className="text-center">
              {cat.ativo ? (
                <span className="text-xs font-semibold text-emerald-600">Ativo</span>
              ) : (
                <span className="text-xs text-slate-400">Inativo</span>
              )}
            </TableCell>
            {canEdit && (
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditar(cat)}
                    title="Editar"
                  >
                    <MaterialIcon name="edit" className="text-sm" />
                  </Button>
                  {cat.ativo && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isDesativando}
                      onClick={() => onDesativar(cat.id)}
                      title="Desativar"
                      className="text-red-500 hover:text-red-700"
                    >
                      <MaterialIcon name="block" className="text-sm" />
                    </Button>
                  )}
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
