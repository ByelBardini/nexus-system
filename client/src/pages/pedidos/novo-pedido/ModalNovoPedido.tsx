import { useAuth } from "@/contexts/AuthContext";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getDefaultNovoPedidoRastreadorFormValues } from "./novo-pedido-rastreador.schema";
import { getDestinatarioDisplayNome } from "./novo-pedido-rastreador.utils";
import { useNovoPedidoRastreadorForm } from "./hooks/useNovoPedidoRastreadorForm";
import { ModalNovoPedidoHeader } from "./components/ModalNovoPedidoHeader";
import { NovoPedidoMetadadosRow } from "./components/NovoPedidoMetadadosRow";
import { NovoPedidoMarcaModeloOperadoraBlock } from "./components/NovoPedidoMarcaModeloOperadoraBlock";
import { NovoPedidoDestinoSection } from "./components/NovoPedidoDestinoSection";
import { NovoPedidoResumosInformativos } from "./components/NovoPedidoResumosInformativos";
import { ModalNovoPedidoFooter } from "./components/ModalNovoPedidoFooter";

export function ModalNovoPedido({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const { user } = useAuth();
  const {
    form,
    itensMistoFields,
    appendItem,
    removeItem,
    tecnicos,
    loadingTecnicos,
    clientes,
    loadingClientes,
    marcas,
    operadoras,
    modelosRaw,
    modelosFiltrados,
    tipoDestino,
    deCliente,
    marcaModeloEspecifico,
    marcaEquipamentoId,
    operadoraEspecifica,
    quantidade,
    itensMistoValues,
    opcoesCliente,
    destinatarioSelecionado,
    cidadeDisplay,
    filialDisplay,
    createMutation,
    handleClose,
    onSubmit,
  } = useNovoPedidoRastreadorForm({ open, onOpenChange, onSuccess });

  function handleDialogOpenChange(o: boolean) {
    if (!o) {
      form.reset(
        getDefaultNovoPedidoRastreadorFormValues(
          new Date().toISOString().slice(0, 10),
        ),
      );
    }
    onOpenChange(o);
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        hideClose
        className="p-0 max-w-[600px] gap-0 overflow-hidden rounded-sm border-slate-200"
      >
        <ModalNovoPedidoHeader onClose={handleClose} />
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
            <NovoPedidoMetadadosRow
              control={form.control}
              nomeUsuario={user?.nome}
            />

            <NovoPedidoMarcaModeloOperadoraBlock
              control={form.control}
              setValue={form.setValue}
              marcaModeloEspecifico={marcaModeloEspecifico}
              operadoraEspecifica={operadoraEspecifica}
              marcaEquipamentoId={marcaEquipamentoId}
              marcas={marcas}
              modelosFiltrados={modelosFiltrados}
              operadoras={operadoras}
            />

            <NovoPedidoDestinoSection
              form={form}
              tecnicos={tecnicos}
              loadingTecnicos={loadingTecnicos}
              clientes={clientes}
              loadingClientes={loadingClientes}
              opcoesCliente={opcoesCliente}
              itensMistoFields={itensMistoFields}
              appendItem={appendItem}
              removeItem={removeItem}
              modelosRaw={modelosRaw}
              marcas={marcas}
              operadoras={operadoras}
              tipoDestino={tipoDestino}
              deCliente={deCliente}
              destinatarioSelecionado={destinatarioSelecionado}
              cidadeDisplay={cidadeDisplay}
              filialDisplay={filialDisplay}
              marcaModeloEspecifico={marcaModeloEspecifico}
              operadoraEspecifica={operadoraEspecifica}
              itensMistoValues={itensMistoValues}
            />

            <div>
              <Label className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">
                Observação (Opcional)
              </Label>
              <textarea
                {...form.register("observacao")}
                placeholder="Ex: Solicitação urgente para manutenção preventiva."
                className="w-full h-20 p-3 bg-white border border-slate-300 rounded-sm text-xs focus:ring-2 focus:ring-erp-blue focus:border-erp-blue outline-none resize-none"
              />
            </div>

            <NovoPedidoResumosInformativos
              tipoDestino={tipoDestino}
              itensMistoFields={itensMistoFields}
              itensMisto={itensMistoValues}
              clientes={clientes}
              nomeDestinatario={getDestinatarioDisplayNome(
                destinatarioSelecionado,
              )}
              quantidade={quantidade}
            />
          </div>

          <ModalNovoPedidoFooter
            isPending={createMutation.isPending}
            onCancel={handleClose}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
