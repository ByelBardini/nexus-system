import { Fragment } from "react";
import { Pencil, ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatarMoeda, formatarTelefone } from "@/lib/format";
import { tecnicoPrecoToNum } from "@/lib/tecnicos-page";
import type { Tecnico } from "../lib/tecnicos.types";
import { TecnicoPrecosCards } from "./TecnicoPrecosCards";

type Props = {
  paginated: Tecnico[];
  filteredCount: number;
  expandedId: number | null;
  onExpandedChange: (id: number | null) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  canEdit: boolean;
  onToggleStatus: (t: Tecnico) => void;
  onEditTecnico: (t: Tecnico) => void;
};

export function TecnicosTableSection({
  paginated,
  filteredCount,
  expandedId,
  onExpandedChange,
  page,
  totalPages,
  onPageChange,
  canEdit,
  onToggleStatus,
  onEditTecnico,
}: Props) {
  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-200 bg-slate-50 hover:bg-slate-50">
              <TableHead className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Nome
              </TableHead>
              <TableHead className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Cidade/UF
              </TableHead>
              <TableHead className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Telefone
              </TableHead>
              <TableHead className="px-4 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Valor Base (Inst.)
              </TableHead>
              <TableHead className="px-4 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Status
              </TableHead>
              <TableHead className="w-10 px-4 py-2" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((t) => {
              const isExpanded = expandedId === t.id;
              const valorBase = tecnicoPrecoToNum(t.precos?.instalacaoSemBloqueio);
              return (
                <Fragment key={t.id}>
                  <TableRow
                    className="cursor-pointer border-slate-200 hover:bg-slate-50"
                    onClick={() =>
                      onExpandedChange(isExpanded ? null : t.id)
                    }
                  >
                    <TableCell className="px-4 py-3 text-sm font-semibold text-slate-800">
                      {t.nome}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-slate-600">
                      {t.cidade && t.estado
                        ? `${t.cidade} / ${t.estado}`
                        : "-"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-slate-600">
                      {t.telefone ? formatarTelefone(t.telefone) : "-"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right text-sm font-medium text-slate-800">
                      {formatarMoeda(valorBase)}
                    </TableCell>
                    <TableCell
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-center">
                        <Switch
                          checked={t.ativo}
                          disabled={!canEdit}
                          onCheckedChange={() => onToggleStatus(t)}
                          className="h-5 w-10 data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-slate-200 [&>span]:h-4 [&>span]:w-4"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-slate-400">
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow className="bg-slate-50">
                      <TableCell
                        colSpan={6}
                        className="border-b border-slate-200 p-0"
                      >
                        <div className="bg-slate-100 p-6">
                          <div className="grid grid-cols-2 gap-8">
                            <div>
                              <h4 className="mb-2 text-[10px] font-bold uppercase text-slate-500">
                                Endereço Completo
                              </h4>
                              <p className="text-sm leading-relaxed text-slate-700">
                                {t.logradouro ? (
                                  <>
                                    {t.logradouro}
                                    {t.numero && `, ${t.numero}`}
                                    {t.complemento && ` - ${t.complemento}`}
                                    <br />
                                    {t.bairro && `${t.bairro}, `}
                                    {t.cidadeEndereco &&
                                      `${t.cidadeEndereco} - `}
                                    {t.estadoEndereco}
                                    {t.cep && (
                                      <>
                                        <br />
                                        CEP: {t.cep}
                                      </>
                                    )}
                                  </>
                                ) : (
                                  "-"
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="mt-6">
                            <h4 className="mb-3 text-[10px] font-bold uppercase text-slate-500">
                              Tabela de Custos Operacionais
                            </h4>
                            <TecnicoPrecosCards precos={t.precos} />
                          </div>
                          {canEdit && (
                            <div className="mt-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditTecnico(t);
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar Perfil
                              </Button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex h-12 shrink-0 items-center justify-between border-t border-slate-200 bg-slate-50 px-4">
        <span className="text-[11px] font-medium uppercase tracking-tight text-slate-500">
          Total de {filteredCount} técnico
          {filteredCount !== 1 ? "s" : ""} localizado
          {filteredCount !== 1 ? "s" : ""}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            disabled={page <= 0}
            onClick={() => onPageChange(Math.max(0, page - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-2 text-xs font-bold">
            {page + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            disabled={page >= totalPages - 1}
            onClick={() =>
              onPageChange(Math.min(totalPages - 1, page + 1))
            }
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
