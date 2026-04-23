import { Label } from "@/components/ui/label";
import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";
import { CATEGORIA_CONFIG, type CategoriaCargo } from "@/types/cargo";

export function CargoModalSummary({
  nome,
  categoria,
  permissoesAtivas,
  selectedCount,
}: {
  nome: string;
  categoria: CategoriaCargo;
  permissoesAtivas: string[];
  selectedCount: number;
}) {
  const categoriaConfig = CATEGORIA_CONFIG[categoria];

  return (
    <aside className="w-72 bg-slate-50 p-6 flex flex-col gap-6 shrink-0 overflow-y-auto">
      <div className="sticky top-0">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">
          Resumo do Cargo
        </h3>
        <div className="space-y-4">
          <div>
            <Label className="text-[10px] font-bold uppercase text-slate-500">
              Nome Visualizado
            </Label>
            <div className="text-sm font-semibold text-slate-700 italic mt-1">
              {nome || "— Definir Nome —"}
            </div>
          </div>
          <div>
            <Label className="text-[10px] font-bold uppercase text-slate-500">
              Categoria Selecionada
            </Label>
            <div
              className={cn(
                "text-[10px] font-bold uppercase inline-flex items-center px-2 py-0.5 rounded border mt-1",
                categoria
                  ? categoriaConfig.className
                  : "bg-slate-200 text-slate-500 border-slate-300",
              )}
            >
              {categoria ? categoriaConfig.label : "Não Especificada"}
            </div>
          </div>
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-600">
                Permissões Ativas
              </span>
              <span className="bg-erp-blue text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {String(selectedCount).padStart(2, "0")}
              </span>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {permissoesAtivas.slice(0, 10).map((perm, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-[10px] text-slate-500"
                >
                  <MaterialIcon
                    name="check_circle"
                    className="text-[12px] text-emerald-500"
                  />
                  <span>{perm}</span>
                </div>
              ))}
              {permissoesAtivas.length > 10 && (
                <div className="text-[10px] text-slate-400 italic">
                  + {permissoesAtivas.length - 10} permissões...
                </div>
              )}
              {permissoesAtivas.length === 0 && (
                <div className="text-[10px] text-slate-400 italic">
                  Nenhuma permissão selecionada
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded text-[10px] text-blue-700 leading-relaxed">
          <span className="font-bold flex items-center gap-1 mb-1">
            <MaterialIcon name="info" className="text-[14px]" />
            Lógica de Acesso:
          </span>
          Permissões de <strong>Criar</strong> ou <strong>Editar</strong>{" "}
          habilitam automaticamente a permissão de <strong>Visualizar</strong>{" "}
          para o recurso correspondente.
        </div>
      </div>
    </aside>
  );
}
