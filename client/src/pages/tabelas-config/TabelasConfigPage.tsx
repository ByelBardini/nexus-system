import { useAuth } from "@/contexts/AuthContext";
import { MaterialIcon } from "@/components/MaterialIcon";
import { Button } from "@/components/ui/button";
import { useCategoriasFalhaConfig } from "./categorias-falha/useCategoriasFalhaConfig";
import { CategoriasFalhaTable } from "./categorias-falha/CategoriasFalhaTable";
import { CategoriaFalhaModal } from "./categorias-falha/CategoriaFalhaModal";

export function TabelasConfigPage() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("CONFIGURACAO.APARELHO.EDITAR");

  const {
    categorias,
    isLoading,
    modal,
    abrirCriar,
    abrirEditar,
    fecharModal,
    criarMutation,
    atualizarMutation,
    desativarMutation,
  } = useCategoriasFalhaConfig();

  const handleSalvar = (dto: { nome: string; motivaTexto: boolean }) => {
    if (modal.open && modal.modo === "editar") {
      atualizarMutation.mutate({ id: modal.item.id, dto });
    } else {
      criarMutation.mutate(dto);
    }
  };

  const isPendingModal =
    criarMutation.isPending || atualizarMutation.isPending;

  return (
    <div className="px-8 py-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MaterialIcon name="table_chart" className="text-erp-blue text-xl" />
          <h1 className="text-lg font-bold text-slate-800 uppercase tracking-tight">
            Tabelas de Configuração
          </h1>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <MaterialIcon name="report_problem" className="text-slate-400" />
            <h2 className="text-sm font-bold uppercase tracking-tight text-slate-700">
              Categorias de Falha de Rastreadores
            </h2>
          </div>
          {canEdit && (
            <Button size="sm" onClick={abrirCriar}>
              <MaterialIcon name="add" className="text-sm mr-1" />
              Nova Categoria
            </Button>
          )}
        </div>
        <div className="p-0">
          {isLoading ? (
            <p className="text-center text-slate-400 py-8 text-sm">
              Carregando...
            </p>
          ) : (
            <CategoriasFalhaTable
              categorias={categorias}
              canEdit={canEdit}
              onEditar={abrirEditar}
              onDesativar={(id) => desativarMutation.mutate(id)}
              isDesativando={desativarMutation.isPending}
            />
          )}
        </div>
      </div>

      {modal.open && (
        <CategoriaFalhaModal
          open={modal.open}
          modo={modal.modo}
          item={modal.modo === "editar" ? modal.item : undefined}
          onFechar={fecharModal}
          onSalvar={handleSalvar}
          isPending={isPendingModal}
        />
      )}
    </div>
  );
}
