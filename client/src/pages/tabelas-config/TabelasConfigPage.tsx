import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
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
    isLoading,
    modal,
    abrirCriar,
    abrirEditar,
    fecharModal,
    criarMutation,
    atualizarMutation,
    desativarMutation,
    searchCategoria,
    setSearchCategoria,
    categoriasFiltradas,
  } = useCategoriasFalhaConfig();

  const handleSalvar = (dto: { nome: string; motivaTexto: boolean }) => {
    if (modal.open && modal.modo === "editar") {
      atualizarMutation.mutate({ id: modal.item.id, dto });
    } else {
      criarMutation.mutate(dto);
    }
  };

  const isPendingModal = criarMutation.isPending || atualizarMutation.isPending;

  return (
    <div className="-m-4 flex min-h-[100dvh] flex-col bg-slate-100">
      <header className="h-20 shrink-0 flex items-center border-b border-slate-200 bg-white px-8">
        <div className="flex items-center gap-4">
          <Link
            to="/configuracoes"
            className="flex h-9 w-9 items-center justify-center rounded-sm border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-3">
            <MaterialIcon name="table_chart" className="text-erp-blue text-xl" />
            <div>
              <h1 className="text-lg font-bold text-slate-800 uppercase tracking-tight">
                Tabelas de Configuração
              </h1>
              <p className="text-xs text-slate-500">
                Gestão de tabelas auxiliares de configuração de aparelhos.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <p className="text-center text-slate-400 py-8 text-sm">
            Carregando...
          </p>
        ) : (
          <div className="max-w-2xl">
            <div className="bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <MaterialIcon
                    name="report_problem"
                    className="text-slate-400"
                  />
                  Categorias de Falha de Rastreadores
                </h2>
                {canEdit && (
                  <Button
                    className="bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-bold h-8 px-3 rounded-sm flex items-center gap-1.5 uppercase"
                    onClick={abrirCriar}
                  >
                    <MaterialIcon name="add" className="text-base" />
                    Nova Categoria
                  </Button>
                )}
              </div>
              <CategoriasFalhaTable
                categorias={categoriasFiltradas}
                canEdit={canEdit}
                onEditar={abrirEditar}
                onToggleAtivo={(cat) => desativarMutation.mutate(cat.id)}
                isDesativando={desativarMutation.isPending}
                search={searchCategoria}
                onSearch={setSearchCategoria}
              />
            </div>
          </div>
        )}
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
