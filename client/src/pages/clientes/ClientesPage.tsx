import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ClienteModal } from "./cliente-modal";
import { ClientesPageHeader } from "./components/ClientesPageHeader";
import { ClientesTable } from "./components/ClientesTable";
import { ClientesTableFooter } from "./components/ClientesTableFooter";
import type { Cliente } from "./shared/clientes-page.shared";
import { useClientesPageList } from "./hooks/useClientesPageList";

export function ClientesPage() {
  const { hasPermission } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);

  const {
    isLoading,
    isError,
    error,
    paginated,
    totalPages,
    page,
    setPage,
    footerStats,
    expandedId,
    setExpandedId,
    busca,
    setBusca,
    filtroTipoContrato,
    setFiltroTipoContrato,
    filtroEstoque,
    setFiltroEstoque,
  } = useClientesPageList();

  const canCreate = hasPermission("AGENDAMENTO.CLIENTE.CRIAR");
  const canEdit = hasPermission("AGENDAMENTO.CLIENTE.EDITAR");

  function openCreateModal() {
    setEditingCliente(null);
    setModalOpen(true);
  }

  function openEditModal(c: Cliente) {
    setEditingCliente(c);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingCliente(null);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-destructive font-medium">
          Erro ao carregar clientes
        </p>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          {error instanceof Error ? error.message : "Erro desconhecido."}
        </p>
      </div>
    );
  }

  return (
    <div className="-m-4 flex min-h-[100dvh] flex-col bg-slate-100">
      <ClientesPageHeader
        busca={busca}
        onBuscaChange={setBusca}
        filtroTipoContrato={filtroTipoContrato}
        onFiltroTipoContratoChange={setFiltroTipoContrato}
        filtroEstoque={filtroEstoque}
        onFiltroEstoqueChange={setFiltroEstoque}
        canCreate={canCreate}
        onNovoCliente={openCreateModal}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden p-6">
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col w-full h-full">
          <ClientesTable
            paginated={paginated}
            expandedId={expandedId}
            onToggleExpand={(id) =>
              setExpandedId(expandedId === id ? null : id)
            }
            canEdit={canEdit}
            onEditCliente={openEditModal}
          />
          <ClientesTableFooter
            footerStats={footerStats}
            page={page}
            totalPages={totalPages}
            onPrevPage={() => setPage((p) => Math.max(0, p - 1))}
            onNextPage={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          />
        </div>
      </div>

      <ClienteModal
        open={modalOpen}
        editingCliente={editingCliente}
        onClose={closeModal}
      />
    </div>
  );
}
