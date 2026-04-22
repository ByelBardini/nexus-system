import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CADASTRO_RAST_STATUS_CONFIG,
  badgeServicoColunaCadastroRast,
} from "@/lib/cadastro-rastreamento-ui";
import type { OrdemCadastro } from "@/lib/cadastro-rastreamento.types";
import { cn } from "@/lib/utils";
import { getColunaEquipamentoSaida } from "../lib/table-helpers";

export function CadastroRastreamentoTable({
  isLoading,
  ordensFiltradas,
  selectedId,
  onToggleRow,
}: {
  isLoading: boolean;
  ordensFiltradas: OrdemCadastro[];
  selectedId: number | null;
  onToggleRow: (id: number) => void;
}) {
  return (
    <div className="flex-1 min-w-0 bg-white border border-slate-300 shadow-sm overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-200 bg-slate-50 hover:bg-slate-50">
            <TableHead className="w-[110px] pl-4 px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              OS #
            </TableHead>
            <TableHead className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Cliente
            </TableHead>
            <TableHead className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Subcliente / Veículo
            </TableHead>
            <TableHead className="min-w-[168px] w-[1%] whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Serviço
            </TableHead>
            <TableHead className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Equipamento de Entrada
            </TableHead>
            <TableHead className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Equipamento de Saída
            </TableHead>
            <TableHead className="w-[120px] px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Status
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell
                colSpan={7}
                className="py-12 text-center text-sm text-slate-400"
              >
                Carregando...
              </TableCell>
            </TableRow>
          )}
          {!isLoading && ordensFiltradas.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={7}
                className="py-12 text-center text-sm text-slate-400"
              >
                Nenhuma ordem encontrada.
              </TableCell>
            </TableRow>
          )}
          {ordensFiltradas.map((ordem) => {
            const isSelected = selectedId === ordem.id;
            const cfgStatus = CADASTRO_RAST_STATUS_CONFIG[ordem.status];
            const cfgServico = badgeServicoColunaCadastroRast(ordem);
            const { imei: imeiSaidaColuna, modelo: modeloSaidaColuna } =
              getColunaEquipamentoSaida(ordem);
            return (
              <TableRow
                key={ordem.id}
                onClick={() => onToggleRow(ordem.id)}
                className={cn(
                  "cursor-pointer border-b border-slate-100 transition-colors bg-white",
                  isSelected
                    ? "border-l-4 border-l-blue-600 bg-blue-50/20"
                    : "hover:bg-blue-50/30",
                )}
              >
                <TableCell className="pl-4 px-3 py-3">
                  <span className="text-xs font-bold text-erp-blue tabular-nums">
                    #{ordem.id}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {ordem.data}
                  </p>
                </TableCell>
                <TableCell className="px-3 py-3">
                  <div className="text-xs font-bold text-slate-800">
                    {ordem.cliente}
                  </div>
                </TableCell>
                <TableCell className="px-3 py-3">
                  <div className="text-xs font-bold text-slate-800">
                    {ordem.subcliente ?? (
                      <span className="text-slate-400 font-normal">—</span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {ordem.veiculo} •{" "}
                    <span className="font-bold text-erp-blue">
                      {ordem.placa}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="px-3 py-3 whitespace-nowrap align-top">
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-1 rounded text-[10px] font-bold leading-tight border whitespace-nowrap",
                      cfgServico.className,
                      ordem.tipoRegistro === "CADASTRO"
                        ? "normal-case"
                        : "uppercase",
                    )}
                  >
                    {cfgServico.label}
                  </span>
                </TableCell>
                <TableCell className="px-3 py-3">
                  {ordem.imei ? (
                    <>
                      <div className="text-[10px] font-mono text-slate-600">
                        {ordem.imei}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {ordem.modeloAparelhoEntrada ?? "—"}
                      </div>
                    </>
                  ) : (
                    <span className="text-[10px] text-slate-300">—</span>
                  )}
                </TableCell>
                <TableCell className="px-3 py-3">
                  {imeiSaidaColuna ? (
                    <>
                      <div className="text-[10px] font-mono text-slate-600">
                        {imeiSaidaColuna}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {modeloSaidaColuna ?? "—"}
                      </div>
                    </>
                  ) : (
                    <span className="text-[10px] text-slate-300">—</span>
                  )}
                </TableCell>
                <TableCell className="px-3 py-3">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                      cfgStatus.className,
                    )}
                  >
                    {cfgStatus.label}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
