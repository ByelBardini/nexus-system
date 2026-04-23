import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { MaterialIcon } from "@/components/MaterialIcon";
import { SearchableSelect } from "@/components/SearchableSelect";
import { cn } from "@/lib/utils";
import type { PedidoRastreadorView, PedidoRastreadorApi, AparelhosDestinatariosResponse } from "../../shared/pedidos-rastreador.types";
import type { AparelhoNoKit } from "../../shared/pedidos-config-types";
import { getDestinatarioExibicaoAparelhoNoKit } from "../../shared/aparelho-destinatario";

export interface ModalSelecaoEKitPanelNovosRastreadoresProps {
  pedido: PedidoRastreadorView | null;
  pedidoApi: PedidoRastreadorApi | null;
  isMisto: boolean;
  destinatariosData: AparelhosDestinatariosResponse | undefined;
  destinatarioLote: {
    proprietario: "INFINITY" | "CLIENTE";
    clienteId: number | null;
  } | null;
  setDestinatarioLote: (
    v: {
      proprietario: "INFINITY" | "CLIENTE";
      clienteId: number | null;
    } | null,
  ) => void;
  showAllClientes: boolean;
  setShowAllClientes: (v: boolean) => void;
  buscaAparelho: string;
  setBuscaAparelho: (v: string) => void;
  filtroMarcaModelo: string;
  setFiltroMarcaModelo: (v: string) => void;
  filtroOperadora: string;
  setFiltroOperadora: (v: string) => void;
  filtroCliente: string;
  setFiltroCliente: (v: string) => void;
  opcoesMarcaModelo: string[];
  opcoesOperadora: string[];
  opcoesCliente: string[];
  aparelhosFiltrados: AparelhoNoKit[];
  aparelhosSelecionados: Set<number>;
  setAparelhosSelecionados: Dispatch<SetStateAction<Set<number>>>;
  onAdicionarSelecionados: () => void;
}

export function ModalSelecaoEKitPanelNovosRastreadores({
  pedido,
  pedidoApi,
  isMisto,
  destinatariosData,
  destinatarioLote,
  setDestinatarioLote,
  showAllClientes,
  setShowAllClientes,
  buscaAparelho,
  setBuscaAparelho,
  filtroMarcaModelo,
  setFiltroMarcaModelo,
  filtroOperadora,
  setFiltroOperadora,
  filtroCliente,
  setFiltroCliente,
  opcoesMarcaModelo,
  opcoesOperadora,
  opcoesCliente,
  aparelhosFiltrados,
  aparelhosSelecionados,
  setAparelhosSelecionados,
  onAdicionarSelecionados,
}: ModalSelecaoEKitPanelNovosRastreadoresProps) {
  return (
    <section className="bg-slate-50 p-5 rounded-lg border border-slate-200 border-dashed">
      {(pedido?.marcaModelo || pedido?.operadora) && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded text-[10px] font-bold text-blue-700 mb-4">
          <MaterialIcon name="filter_alt" className="text-sm shrink-0" />
          <span className="shrink-0">
            Aparelhos filtrados por requisitos do pedido:
          </span>
          {pedido?.marcaModelo && (
            <span className="bg-blue-100 px-1.5 py-0.5 rounded">
              {pedido.marcaModelo}
            </span>
          )}
          {pedido?.operadora && (
            <span className="bg-blue-100 px-1.5 py-0.5 rounded">
              Operadora: {pedido.operadora}
            </span>
          )}
        </div>
      )}
      {isMisto &&
        destinatariosData?.quotaUsage &&
        destinatariosData.quotaUsage.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-3">
            {destinatariosData.quotaUsage.map((q) => {
              const label =
                q.proprietario === "INFINITY"
                  ? "Infinity"
                  : (q.clienteNome ?? `Cliente #${q.clienteId}`);
              return (
                <div
                  key={`${q.proprietario}-${q.clienteId}`}
                  className={cn(
                    "flex items-center gap-1 border rounded px-2 py-0.5 text-[10px] font-bold",
                    q.atribuido >= q.total
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200",
                  )}
                >
                  <span>{label}:</span>
                  <span>
                    {q.atribuido}/{q.total}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      {isMisto && pedidoApi?.itens && (
        <div className="flex items-end gap-4 mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <div className="flex-1">
            <Label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Destino deste lote
            </Label>
            <SearchableSelect
              options={pedidoApi.itens.map((item) => ({
                value: JSON.stringify({
                  proprietario: item.proprietario,
                  clienteId: item.clienteId ?? null,
                }),
                label:
                  item.proprietario === "INFINITY"
                    ? "Infinity"
                    : (item.cliente?.nome ?? `Cliente #${item.clienteId}`),
              }))}
              value={
                destinatarioLote ? JSON.stringify(destinatarioLote) : ""
              }
              onChange={(val) => {
                if (!val) {
                  setDestinatarioLote(null);
                  return;
                }
                setDestinatarioLote(
                  JSON.parse(val) as {
                    proprietario: "INFINITY" | "CLIENTE";
                    clienteId: number | null;
                  },
                );
              }}
              placeholder="Selecionar destino..."
            />
          </div>
        </div>
      )}
      <div className="flex items-center gap-2 mb-4">
        <Checkbox
          id="showAllClientes"
          checked={showAllClientes}
          onCheckedChange={(v) => setShowAllClientes(!!v)}
          className="rounded border-slate-300 data-[state=checked]:bg-erp-blue data-[state=checked]:border-erp-blue"
        />
        <label
          htmlFor="showAllClientes"
          className="text-[10px] font-bold text-slate-500 cursor-pointer select-none"
        >
          Exibir rastreadores de outros proprietários
        </label>
      </div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <MaterialIcon name="search" className="text-sm" />
          Selecionar Novos Rastreadores
        </h3>
        <Button
          size="sm"
          onClick={onAdicionarSelecionados}
          disabled={
            aparelhosSelecionados.size === 0 ||
            (isMisto && !destinatarioLote)
          }
        >
          <MaterialIcon name="add" className="text-sm" /> Adicionar ao Kit
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-4">
        <div>
          <Label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
            Buscar por ID ou IMEI
          </Label>
          <div className="relative">
            <MaterialIcon
              name="search"
              className="absolute left-2 top-2 text-slate-400 text-sm"
            />
            <Input
              value={buscaAparelho}
              onChange={(e) => setBuscaAparelho(e.target.value)}
              placeholder="Digite o identificador..."
              className="pl-8 h-9 text-xs"
            />
          </div>
        </div>
        <div>
          <Label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
            Marca/Modelo
          </Label>
          <select
            value={filtroMarcaModelo}
            onChange={(e) => setFiltroMarcaModelo(e.target.value)}
            className="w-full h-9 text-xs rounded-md border border-slate-200 bg-white px-2"
          >
            <option value="">Todos</option>
            {opcoesMarcaModelo.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
            Operadora
          </Label>
          <select
            value={filtroOperadora}
            onChange={(e) => setFiltroOperadora(e.target.value)}
            className="w-full h-9 text-xs rounded-md border border-slate-200 bg-white px-2"
          >
            <option value="">Todas</option>
            {opcoesOperadora.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
            Cliente
          </Label>
          <select
            value={filtroCliente}
            onChange={(e) => setFiltroCliente(e.target.value)}
            className="w-full h-9 text-xs rounded-md border border-slate-200 bg-white px-2"
          >
            <option value="">Todos</option>
            {opcoesCliente.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded max-h-48 overflow-y-auto">
        <table className="w-full text-[11px]">
          <thead className="sticky top-0 bg-slate-100">
            <tr>
              <th className="px-3 py-2 text-[10px] font-bold uppercase text-slate-500 w-10">
                <Checkbox
                  checked={
                    aparelhosFiltrados.length > 0 &&
                    aparelhosSelecionados.size === aparelhosFiltrados.length
                  }
                  onCheckedChange={(v) => {
                    if (v) {
                      setAparelhosSelecionados(
                        new Set(aparelhosFiltrados.map((a) => a.id)),
                      );
                    } else {
                      setAparelhosSelecionados(new Set());
                    }
                  }}
                  className="rounded border-slate-300 data-[state=checked]:bg-erp-blue data-[state=checked]:border-erp-blue"
                />
              </th>
              <th className="px-3 py-2 text-[10px] font-bold uppercase text-slate-500 text-left">
                IMEI
              </th>
              <th className="px-3 py-2 text-[10px] font-bold uppercase text-slate-500 text-left">
                Marca/Modelo
              </th>
              <th className="px-3 py-2 text-[10px] font-bold uppercase text-slate-500 text-left">
                Operadora
              </th>
              <th className="px-3 py-2 text-[10px] font-bold uppercase text-slate-500 text-left">
                Cliente
              </th>
              <th className="px-3 py-2 text-[10px] font-bold uppercase text-slate-500 text-left">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {aparelhosFiltrados.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-slate-500 text-[11px]"
                >
                  Nenhum aparelho disponível.
                </td>
              </tr>
            ) : (
              aparelhosFiltrados.map((a) => {
                const selecionado = aparelhosSelecionados.has(a.id);
                const toggleSelecao = () => {
                  setAparelhosSelecionados((prev) => {
                    const next = new Set(prev);
                    if (selecionado) next.delete(a.id);
                    else next.add(a.id);
                    return next;
                  });
                };
                return (
                  <tr
                    key={a.id}
                    onClick={toggleSelecao}
                    className={cn(
                      "border-b border-slate-100 cursor-pointer select-none",
                      selecionado
                        ? "bg-blue-50 hover:bg-blue-100"
                        : "hover:bg-slate-50",
                    )}
                  >
                    <td className="px-3 py-2">
                      <Checkbox
                        checked={selecionado}
                        onCheckedChange={toggleSelecao}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-slate-300 data-[state=checked]:bg-erp-blue data-[state=checked]:border-erp-blue"
                      />
                    </td>
                    <td className="px-3 py-2 font-medium">
                      {a.identificador ?? "-"}
                    </td>
                    <td className="px-3 py-2">
                      {[a.marca, a.modelo].filter(Boolean).join(" / ") || "-"}
                    </td>
                    <td className="px-3 py-2">
                      {a.operadora ?? a.simVinculado?.operadora ?? "-"}
                    </td>
                    <td className="px-3 py-2">
                      {getDestinatarioExibicaoAparelhoNoKit(a)}
                    </td>
                    <td className="px-3 py-2">
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                        {a.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
