import type { AparelhoDescartado } from "./useDescartadosList";

type DescartadosTableProps = {
  lista: AparelhoDescartado[];
};

function formatarData(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function DescartadosTable({ lista }: DescartadosTableProps) {
  if (lista.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
        Nenhum aparelho descartado encontrado.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-sm border border-slate-200">
      <table className="w-full text-sm" data-testid="descartados-table">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left">
            <th className="px-4 py-3 text-[11px] font-bold uppercase text-slate-500 tracking-wide">
              Identificador
            </th>
            <th className="px-4 py-3 text-[11px] font-bold uppercase text-slate-500 tracking-wide">
              Tipo
            </th>
            <th className="px-4 py-3 text-[11px] font-bold uppercase text-slate-500 tracking-wide">
              Marca / Modelo
            </th>
            <th className="px-4 py-3 text-[11px] font-bold uppercase text-slate-500 tracking-wide">
              Categoria de Falha
            </th>
            <th className="px-4 py-3 text-[11px] font-bold uppercase text-slate-500 tracking-wide">
              Motivo
            </th>
            <th className="px-4 py-3 text-[11px] font-bold uppercase text-slate-500 tracking-wide">
              Proprietário
            </th>
            <th className="px-4 py-3 text-[11px] font-bold uppercase text-slate-500 tracking-wide">
              Descartado em
            </th>
          </tr>
        </thead>
        <tbody>
          {lista.map((item) => (
            <tr
              key={item.id}
              className="border-b border-slate-100 hover:bg-slate-50"
              data-testid={`descartado-row-${item.id}`}
            >
              <td className="px-4 py-3 font-mono text-xs text-slate-800">
                {item.identificador ?? "—"}
              </td>
              <td className="px-4 py-3 text-slate-700">{item.tipo}</td>
              <td className="px-4 py-3 text-slate-600">
                {[item.marca, item.modelo].filter(Boolean).join(" / ") || "—"}
              </td>
              <td className="px-4 py-3 text-slate-600">
                {item.categoriaFalha ?? "—"}
              </td>
              <td className="px-4 py-3 text-slate-600">
                {item.motivoDefeito ?? "—"}
              </td>
              <td className="px-4 py-3 text-slate-600">
                {item.proprietario === "INFINITY" ? "Infinity" : "Cliente"}
              </td>
              <td className="px-4 py-3 text-slate-500">
                {formatarData(item.descartadoEm)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
