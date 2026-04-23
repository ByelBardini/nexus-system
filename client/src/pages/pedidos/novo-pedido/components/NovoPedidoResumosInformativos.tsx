import type { FieldArrayWithId } from "react-hook-form";
import { MaterialIcon } from "@/components/MaterialIcon";
import type { FormNovoPedido } from "../novo-pedido-rastreador.schema";
import type { ClienteComSubclientes } from "../novo-pedido-rastreador.utils";

type NovoPedidoResumosInformativosProps = {
  tipoDestino: FormNovoPedido["tipoDestino"];
  itensMistoFields: FieldArrayWithId<FormNovoPedido, "itensMisto", "id">[];
  itensMisto: FormNovoPedido["itensMisto"] | undefined;
  clientes: ClienteComSubclientes[];
  /** `null` quando ainda não há destinatário com nome. */
  nomeDestinatario: string | null;
  quantidade: number | undefined;
};

export function NovoPedidoResumosInformativos({
  tipoDestino,
  itensMistoFields,
  itensMisto,
  clientes,
  nomeDestinatario,
  quantidade,
}: NovoPedidoResumosInformativosProps) {
  return (
    <>
      {tipoDestino === "MISTO" && itensMistoFields.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded p-3 space-y-1">
          <p className="text-xs font-bold text-blue-800">
            Distribuição do pedido:
          </p>
          {itensMistoFields.map((f, i) => {
            const item = itensMisto?.[i];
            if (!item) return null;
            const label =
              item.proprietario === "INFINITY"
                ? "Infinity"
                : (clientes.find((c) => c.id === item.clienteId)?.nome ??
                  "Cliente");
            return (
              <p key={f.id} className="text-xs text-blue-700">
                {item.quantidade}× → {label}
              </p>
            );
          })}
        </div>
      )}
      {tipoDestino !== "MISTO" &&
        (nomeDestinatario != null || (quantidade ?? 0) > 0) && (
          <div className="bg-blue-50 border border-blue-100 rounded p-3">
            <p className="text-xs text-blue-800 font-medium flex items-center gap-2">
              <MaterialIcon name="info" className="text-sm" />
              Você está solicitando{" "}
              <span className="font-bold underline">
                {quantidade} unidades
              </span>{" "}
              para{" "}
              <span className="font-bold">{nomeDestinatario ?? "..."}</span>.
            </p>
          </div>
        )}
    </>
  );
}
