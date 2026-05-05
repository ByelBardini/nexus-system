import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExcluirPedidoConfirmDialog } from "./ExcluirPedidoConfirmDialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { MaterialIcon } from "@/components/MaterialIcon";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { PedidoRastreadorView } from "../../shared/pedidos-rastreador.types";
import { getUrgenciaValueTextClass } from "../../shared/pedidos-urgencia-ui";

export function DrawerDetalhes({
  pedido,
  open,
  onOpenChange,
  onDeleted,
}: {
  pedido: PedidoRastreadorView | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}) {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      api(`/pedidos-rastreadores/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedidos-rastreadores"] });
      onOpenChange(false);
      onDeleted?.();
      toast.success("Pedido excluído com sucesso");
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Erro ao excluir pedido",
      ),
  });

  const podeExcluir = hasPermission("AGENDAMENTO.PEDIDO_RASTREADOR.EXCLUIR");

  function handleExcluir() {
    if (!pedido) return;
    deleteMutation.mutate(pedido.id);
    setConfirmOpen(false);
  }

  if (!pedido) return null;

  return (
    <>
      <ExcluirPedidoConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        pedidoCodigo={pedido.codigo}
        isPending={deleteMutation.isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleExcluir}
      />
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-[450px] max-w-[95vw] sm:max-w-[450px] p-0 flex flex-col"
        >
          <SheetHeader className="p-6 border-b border-slate-200">
            <div className="flex justify-between items-start">
              <div>
                <SheetTitle className="text-[10px] font-bold text-erp-blue uppercase tracking-widest">
                  Solicitação Detalhada
                </SheetTitle>
                <p className="text-lg font-bold text-slate-800 leading-tight mt-1">
                  {pedido.codigo}
                </p>
              </div>
            </div>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-8">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4">
                Informações Gerais
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-500 uppercase leading-none mb-1">
                    Tipo de Destino
                  </p>
                  <p className="text-xs font-bold text-slate-800">
                    {pedido.tipo === "tecnico"
                      ? "Técnico"
                      : pedido.tipo === "misto"
                        ? "Misto"
                        : "Cliente"}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-500 uppercase leading-none mb-1">
                    Data do Pedido
                  </p>
                  <p className="text-xs font-semibold text-slate-700">
                    {pedido.dataSolicitacao
                      ? new Date(pedido.dataSolicitacao).toLocaleDateString(
                          "pt-BR",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          },
                        )
                      : "-"}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-500 uppercase leading-none mb-1">
                    Quantidade
                  </p>
                  <p className="text-xs font-semibold text-slate-700">
                    {pedido.quantidade} Unidades
                  </p>
                </div>
                {pedido.marcaModelo && (
                  <div className="bg-slate-50 p-3 rounded border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-500 uppercase leading-none mb-1">
                      Marca / Modelo
                    </p>
                    <p className="text-xs font-semibold text-slate-700">
                      {pedido.marcaModelo}
                    </p>
                  </div>
                )}
                {pedido.operadora && (
                  <div className="bg-slate-50 p-3 rounded border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-500 uppercase leading-none mb-1">
                      Operadora
                    </p>
                    <p className="text-xs font-semibold text-slate-700">
                      {pedido.operadora}
                    </p>
                  </div>
                )}
                {pedido.deCliente && (
                  <div className="bg-slate-50 p-3 rounded border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-500 uppercase leading-none mb-1">
                      De Cliente
                    </p>
                    <p className="text-xs font-semibold text-slate-700">
                      {pedido.deCliente}
                    </p>
                  </div>
                )}
                {pedido.urgencia && (
                  <div className="bg-slate-50 p-3 rounded border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-500 uppercase leading-none mb-1">
                      Urgência
                    </p>
                    <p
                      className={cn(
                        "text-xs font-semibold",
                        getUrgenciaValueTextClass(pedido.urgencia),
                      )}
                    >
                      {pedido.urgencia}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {pedido.tipo === "misto" &&
              pedido.itensMisto &&
              pedido.itensMisto.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4">
                    Distribuição dos Itens
                  </h3>
                  <div className="bg-white border border-slate-200 rounded overflow-hidden shadow-sm">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-2 text-left font-bold text-slate-500 text-[10px] uppercase">
                            Destino
                          </th>
                          <th className="px-4 py-2 text-right font-bold text-slate-500 text-[10px] uppercase">
                            Qtd
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pedido.itensMisto.map((item, i) => (
                          <tr key={i}>
                            <td className="px-4 py-2 text-slate-700">
                              {item.label}
                            </td>
                            <td className="px-4 py-2 text-right font-bold text-slate-800">
                              {item.quantidade}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 border-t border-slate-200">
                        <tr>
                          <td className="px-4 py-2 font-bold text-slate-500 text-[10px] uppercase">
                            Total
                          </td>
                          <td className="px-4 py-2 text-right font-bold text-slate-800">
                            {pedido.quantidade}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

            {(pedido.endereco || pedido.contato) && (
              <div className="mb-8">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4">
                  {pedido.endereco && pedido.contato
                    ? "Endereço e Contato (Destino)"
                    : pedido.endereco
                      ? "Endereço (Destino)"
                      : "Meios de Contato (Destino)"}
                </h3>
                <div className="bg-white border border-slate-200 rounded p-4 shadow-sm space-y-4">
                  {pedido.endereco && (
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        Endereço
                      </label>
                      <div className="flex items-start gap-2">
                        <MaterialIcon
                          name="location_on"
                          className="text-slate-400 text-sm shrink-0 mt-0.5"
                        />
                        <span className="text-xs font-semibold text-slate-800">
                          {pedido.endereco}
                        </span>
                      </div>
                    </div>
                  )}
                  {pedido.contato && (
                    <>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                          Nome Completo
                        </label>
                        <div className="flex items-center gap-2">
                          <MaterialIcon
                            name="person"
                            className="text-slate-400 text-sm"
                          />
                          <span className="text-xs font-semibold text-slate-800">
                            {pedido.contato.nome}
                          </span>
                        </div>
                      </div>
                      {(pedido.contato.telefone || pedido.contato.email) && (
                        <div className="grid grid-cols-2 gap-4">
                          {pedido.contato.telefone && (
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                                Telefone
                              </label>
                              <div className="flex items-center gap-2">
                                <MaterialIcon
                                  name="call"
                                  className="text-slate-400 text-sm"
                                />
                                <span className="text-xs font-semibold text-slate-800">
                                  {pedido.contato.telefone}
                                </span>
                              </div>
                            </div>
                          )}
                          {pedido.contato.email && (
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                                E-mail
                              </label>
                              <div className="flex items-center gap-2">
                                <MaterialIcon
                                  name="mail"
                                  className="text-slate-400 text-sm"
                                />
                                <span className="text-xs font-semibold text-slate-800 truncate">
                                  {pedido.contato.email}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {(pedido.status === "despachado" || pedido.status === "entregue") &&
              pedido.despacho?.tipoDespacho && (
                <div className="mb-8">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <MaterialIcon
                      name="lock"
                      className="text-xs text-slate-400"
                    />
                    Informações de Despacho
                  </h3>
                  <div className="bg-white border border-slate-200 rounded p-4 shadow-sm space-y-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Meio de Envio
                      </p>
                      <p className="text-xs font-bold text-slate-800">
                        {pedido.despacho.tipoDespacho === "TRANSPORTADORA"
                          ? "Transportadora"
                          : pedido.despacho.tipoDespacho === "CORREIOS"
                            ? "Correios"
                            : "Em Mãos"}
                      </p>
                    </div>
                    {pedido.despacho.tipoDespacho === "TRANSPORTADORA" &&
                      pedido.despacho.transportadora && (
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Transportadora
                          </p>
                          <p className="text-xs font-semibold text-slate-800">
                            {pedido.despacho.transportadora}
                          </p>
                        </div>
                      )}
                    {pedido.despacho.numeroNf &&
                      pedido.despacho.tipoDespacho !== "EM_MAOS" && (
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                            {pedido.despacho.tipoDespacho === "CORREIOS"
                              ? "Cód. Rastreio"
                              : "Nº NF"}
                          </p>
                          <p className="text-xs font-bold text-slate-800 font-mono">
                            {pedido.despacho.numeroNf}
                          </p>
                        </div>
                      )}
                  </div>
                </div>
              )}

            {pedido.historico && pedido.historico.length > 0 && (
              <div>
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-6">
                  Linha do Tempo
                </h3>
                <div className="space-y-0">
                  {pedido.historico.map((item, idx) => (
                    <div
                      key={idx}
                      className="relative pl-6 pb-6 border-l-2 border-slate-200 last:border-0 last:pb-0"
                    >
                      <div
                        className={cn(
                          "absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2",
                          item.concluido
                            ? "border-erp-blue"
                            : "border-slate-300",
                        )}
                      />
                      <p
                        className={cn(
                          "text-[11px] font-bold",
                          item.concluido ? "text-slate-800" : "text-slate-400",
                        )}
                      >
                        {item.titulo}
                      </p>
                      <p
                        className={cn(
                          "text-[10px]",
                          item.concluido ? "text-slate-500" : "text-slate-400",
                        )}
                      >
                        {item.descricao}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <SheetFooter className="p-6 border-t border-slate-200 bg-white flex-row gap-2 sm:flex-row">
            {podeExcluir && (
              <Button
                variant="destructive"
                className="flex-1 sm:flex-initial font-bold text-xs uppercase tracking-wide"
                onClick={() => setConfirmOpen(true)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <MaterialIcon name="delete" className="text-sm mr-2" />
                )}
                Excluir
              </Button>
            )}
            <Button
              className={cn(
                "font-bold text-xs uppercase tracking-wide",
                podeExcluir
                  ? "flex-1 sm:flex-initial bg-slate-800 hover:bg-slate-900"
                  : "w-full bg-slate-800 hover:bg-slate-900",
              )}
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
