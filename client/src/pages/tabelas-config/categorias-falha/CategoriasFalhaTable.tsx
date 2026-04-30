import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";
import type { CategoriaFalha } from "./useCategoriasFalhaConfig";

type Props = {
  categorias: CategoriaFalha[];
  canEdit: boolean;
  onEditar: (cat: CategoriaFalha) => void;
  onToggleAtivo: (cat: CategoriaFalha) => void;
  isDesativando: boolean;
  search: string;
  onSearch: (v: string) => void;
};

export function CategoriasFalhaTable({
  categorias,
  canEdit,
  onEditar,
  onToggleAtivo,
  isDesativando,
  search,
  onSearch,
}: Props) {
  return (
    <>
      <div className="p-4 border-b border-slate-100">
        <div className="relative">
          <MaterialIcon
            name="search"
            className="absolute left-3 top-2 text-slate-400 text-lg"
          />
          <Input
            className="h-9 pl-9 pr-3 w-full bg-slate-100 border-transparent focus:bg-white focus:ring-1 focus:ring-blue-500 text-xs rounded-sm"
            placeholder="Filtrar categorias..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                Nome
              </th>
              <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                Exige Descrição
              </th>
              <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                Status
              </th>
              {canEdit && (
                <th className="px-4 py-2.5 w-10 border-b border-slate-100" />
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {categorias.map((cat) => (
              <tr
                key={cat.id}
                className={cn(
                  "hover:bg-slate-50/50 transition-colors",
                  !cat.ativo && "opacity-60 bg-slate-50/20",
                )}
              >
                <td className="px-4 py-4">
                  <span
                    className={cn(
                      "text-xs font-bold",
                      cat.ativo ? "text-slate-800" : "text-slate-500",
                    )}
                  >
                    {cat.nome}
                  </span>
                </td>
                <td className="px-4 py-4">
                  {cat.motivaTexto ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
                      <MaterialIcon name="edit_note" className="text-sm" />
                      Sim
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">Não</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        cat.ativo ? "bg-emerald-500" : "bg-slate-400",
                      )}
                    />
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase",
                        cat.ativo ? "text-slate-600" : "text-slate-400",
                      )}
                    >
                      {cat.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </td>
                {canEdit && (
                  <td className="px-4 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="text-slate-400 hover:text-slate-600"
                          aria-label="Ações"
                        >
                          <MaterialIcon name="settings" className="text-lg" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditar(cat)}>
                          <MaterialIcon
                            name="edit"
                            className="mr-2 text-base"
                          />
                          Editar
                        </DropdownMenuItem>
                        {cat.ativo && (
                          <DropdownMenuItem
                            onClick={() => onToggleAtivo(cat)}
                            disabled={isDesativando}
                          >
                            <MaterialIcon
                              name="visibility_off"
                              className="mr-2 text-base"
                            />
                            Desativar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                )}
              </tr>
            ))}
            {categorias.length === 0 && (
              <tr>
                <td
                  colSpan={canEdit ? 4 : 3}
                  className="px-4 py-12 text-center text-sm text-slate-500"
                >
                  Nenhuma categoria cadastrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          Total: {categorias.length} Categorias
        </span>
      </div>
    </>
  );
}
