import { useState, useMemo, Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Loader2,
  ChevronDown,
  ChevronUp,
  Router,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MaterialIcon } from "@/components/MaterialIcon";
import { SearchableSelect } from "@/components/SearchableSelect";
import { api } from "@/lib/api";
import {
  STATUS_CONFIG_APARELHO,
  type StatusAparelho,
} from "@/lib/aparelho-status";
import {
  parseDataLocal,
  formatarDataHora,
  formatarMoedaOpcional,
} from "@/lib/format";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

type TipoAparelho = "RASTREADOR" | "SIM";
type ProprietarioTipo = "INFINITY" | "CLIENTE";

interface Aparelho {
  id: number;
  identificador?: string | null;
  tipo: TipoAparelho;
  marca?: string | null;
  modelo?: string | null;
  operadora?: string | null;
  marcaSimcard?: {
    id: number;
    nome: string;
    operadora?: { id: number; nome: string };
  } | null;
  planoSimcard?: { id: number; planoMb: number } | null;
  status: StatusAparelho;
  proprietario: ProprietarioTipo;
  cliente?: { id: number; nome: string } | null;
  simVinculado?: {
    id: number;
    identificador: string;
    operadora?: string | null;
  } | null;
  aparelhosVinculados?: {
    id: number;
    identificador?: string | null;
    proprietario?: ProprietarioTipo | null;
    kitId?: number | null;
    kit?: { id: number; nome: string } | null;
    tecnicoId?: number | null;
    tecnico?: { id: number; nome: string } | null;
    clienteId?: number | null;
    cliente?: { id: number; nome: string } | null;
  }[];
  kitId?: number | null;
  kit?: { id: number; nome: string } | null;
  tecnico?: { id: number; nome: string } | null;
  lote?: { id: number; referencia: string } | null;
  valorUnitario?: number | null;
  ordemServicoVinculada?: {
    numero: number;
    subclienteNome: string | null;
    veiculoPlaca: string | null;
  } | null;
  criadoEm: string;
  historico?: HistoricoItem[];
}

interface HistoricoItem {
  data: string;
  acao: string;
  descricao?: string;
}

const TIPO_CONFIG: Record<
  TipoAparelho,
  { label: string; icon: typeof Router }
> = {
  RASTREADOR: { label: "Rastreador", icon: Router },
  SIM: { label: "SIM Card", icon: Smartphone },
};

const PROPRIETARIO_CONFIG: Record<
  ProprietarioTipo,
  { label: string; className: string }
> = {
  INFINITY: {
    label: "Infinity",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  CLIENTE: {
    label: "Cliente",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
};

const PAGE_SIZE = 15;

export function AparelhosPage() {
  const { hasPermission } = useAuth();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [busca, setBusca] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusAparelho | "TODOS">(
    "TODOS",
  );
  const [tipoFilter, setTipoFilter] = useState<TipoAparelho | "TODOS">("TODOS");
  const [proprietarioFilter, setProprietarioFilter] = useState<
    ProprietarioTipo | "TODOS"
  >("TODOS");
  const [marcaFilter, setMarcaFilter] = useState<string>("TODOS");
  const [page, setPage] = useState(0);

  const canCreate = hasPermission("CONFIGURACAO.APARELHO.CRIAR");

  const { data: aparelhos = [], isLoading } = useQuery<Aparelho[]>({
    queryKey: ["aparelhos"],
    queryFn: () => api("/aparelhos"),
  });

  const { data: kits = [] } = useQuery<{ id: number; nome: string }[]>({
    queryKey: ["aparelhos", "pareamento", "kits"],
    queryFn: () => api("/aparelhos/pareamento/kits"),
  });

  const kitsPorId = useMemo(
    () => new Map(kits.map((k) => [k.id, k.nome])),
    [kits],
  );

  const marcas = useMemo(() => {
    const set = new Set<string>();
    aparelhos.forEach((a) => {
      if (a.tipo === "RASTREADOR" && a.marca) set.add(a.marca);
      if (a.tipo === "SIM" && a.operadora) set.add(a.operadora);
    });
    return Array.from(set).sort();
  }, [aparelhos]);

  const statusCounts = useMemo(() => {
    const counts: Record<StatusAparelho, number> = {
      EM_ESTOQUE: 0,
      CONFIGURADO: 0,
      DESPACHADO: 0,
      COM_TECNICO: 0,
      INSTALADO: 0,
    };
    aparelhos.forEach((a) => {
      counts[a.status]++;
    });
    return counts;
  }, [aparelhos]);

  const totalCount = useMemo(() => {
    return Object.values(statusCounts).reduce((a, b) => a + b, 0);
  }, [statusCounts]);

  const filtered = useMemo(() => {
    return aparelhos.filter((a) => {
      const matchBusca =
        !busca.trim() ||
        a.identificador?.toLowerCase().includes(busca.toLowerCase()) ||
        a.lote?.referencia?.toLowerCase().includes(busca.toLowerCase()) ||
        a.tecnico?.nome?.toLowerCase().includes(busca.toLowerCase());

      const matchStatus = statusFilter === "TODOS" || a.status === statusFilter;
      const matchTipo = tipoFilter === "TODOS" || a.tipo === tipoFilter;
      const matchProprietario =
        proprietarioFilter === "TODOS" || a.proprietario === proprietarioFilter;
      const matchMarca =
        marcaFilter === "TODOS" ||
        (a.tipo === "RASTREADOR" && a.marca === marcaFilter) ||
        (a.tipo === "SIM" && a.operadora === marcaFilter);

      return (
        matchBusca &&
        matchStatus &&
        matchTipo &&
        matchProprietario &&
        matchMarca
      );
    });
  }, [
    aparelhos,
    busca,
    statusFilter,
    tipoFilter,
    proprietarioFilter,
    marcaFilter,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  function handleStatusClick(status: StatusAparelho | "TODOS") {
    setStatusFilter(status);
    setPage(0);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cards de status */}
      <div className="flex w-full min-h-[88px] shadow-sm border border-slate-300 bg-white">
        <button
          onClick={() => handleStatusClick("TODOS")}
          className={cn(
            "pipeline-item flex-1 bg-slate-50 border-r border-slate-200 p-3 flex flex-col justify-center text-left transition-colors",
            statusFilter === "TODOS" &&
              "border-t-2 border-b-2 border-t-blue-500 border-b-blue-500",
          )}
        >
          <div className="flex justify-between items-center border-l-4 border-erp-blue pl-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase font-condensed">
              Total
            </span>
            <span className="text-lg font-black text-slate-800">
              {totalCount}
            </span>
          </div>
        </button>
        <button
          onClick={() => handleStatusClick("EM_ESTOQUE")}
          className={cn(
            "pipeline-item flex-1 bg-amber-100 border-r border-slate-200 p-3 flex flex-col justify-center text-left transition-colors",
            statusFilter === "EM_ESTOQUE" &&
              "border-t-2 border-b-2 border-t-amber-500 border-b-amber-500",
          )}
        >
          <div className="flex justify-between items-center border-l-4 border-amber-500 pl-2">
            <span className="text-[10px] font-bold text-slate-600 uppercase font-condensed">
              Em Estoque
            </span>
            <span className="text-lg font-black text-slate-800">
              {statusCounts.EM_ESTOQUE}
            </span>
          </div>
        </button>
        <button
          onClick={() => handleStatusClick("CONFIGURADO")}
          className={cn(
            "pipeline-item flex-1 bg-blue-100 border-r border-slate-200 p-3 flex flex-col justify-center text-left transition-colors",
            statusFilter === "CONFIGURADO" &&
              "border-t-2 border-b-2 border-t-blue-500 border-b-blue-500",
          )}
        >
          <div className="flex justify-between items-center border-l-4 border-erp-blue pl-2">
            <span className="text-[10px] font-bold text-slate-600 uppercase font-condensed">
              Configurado
            </span>
            <span className="text-lg font-black text-slate-800">
              {statusCounts.CONFIGURADO}
            </span>
          </div>
        </button>
        <button
          onClick={() => handleStatusClick("DESPACHADO")}
          className={cn(
            "pipeline-item flex-1 bg-amber-100 border-r border-slate-200 p-3 flex flex-col justify-center text-left transition-colors",
            statusFilter === "DESPACHADO" &&
              "border-t-2 border-b-2 border-t-amber-500 border-b-amber-500",
          )}
        >
          <div className="flex justify-between items-center border-l-4 border-amber-500 pl-2">
            <span className="text-[10px] font-bold text-slate-600 uppercase font-condensed">
              Despachado
            </span>
            <span className="text-lg font-black text-slate-800">
              {statusCounts.DESPACHADO}
            </span>
          </div>
        </button>
        <button
          onClick={() => handleStatusClick("COM_TECNICO")}
          className={cn(
            "pipeline-item flex-1 bg-orange-100 border-r border-slate-200 p-3 flex flex-col justify-center text-left transition-colors",
            statusFilter === "COM_TECNICO" &&
              "border-t-2 border-b-2 border-t-orange-500 border-b-orange-500",
          )}
        >
          <div className="flex justify-between items-center border-l-4 border-erp-orange pl-2">
            <span className="text-[10px] font-bold text-slate-600 uppercase font-condensed">
              Com Técnico
            </span>
            <span className="text-lg font-black text-slate-800">
              {statusCounts.COM_TECNICO}
            </span>
          </div>
        </button>
        <button
          onClick={() => handleStatusClick("INSTALADO")}
          className={cn(
            "pipeline-item flex-1 bg-green-100 p-3 flex flex-col justify-center text-left transition-colors",
            statusFilter === "INSTALADO" &&
              "border-t-2 border-b-2 border-t-emerald-500 border-b-emerald-500",
          )}
        >
          <div className="flex justify-between items-center border-l-4 border-erp-green pl-2">
            <span className="text-[10px] font-bold text-slate-600 uppercase font-condensed">
              Instalado
            </span>
            <span className="text-lg font-black text-slate-800">
              {statusCounts.INSTALADO}
            </span>
          </div>
        </button>
      </div>

      {/* Barra de ferramentas */}
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">
            Busca
          </label>
          <div className="relative w-64">
            <MaterialIcon
              name="search"
              className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-base"
            />
            <Input
              className="pl-8 text-[11px]"
              placeholder="IMEI, ICCID, Lote, Técnico..."
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPage(0);
              }}
            />
          </div>
        </div>
        <div className="flex items-end gap-2 flex-wrap">
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">
              Status
            </label>
            <SearchableSelect
              className="w-[160px]"
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v as StatusAparelho | "TODOS");
                setPage(0);
              }}
              options={[
                { value: "TODOS", label: "Todos" },
                ...(
                  Object.keys(STATUS_CONFIG_APARELHO) as StatusAparelho[]
                ).map((s) => ({
                  value: s,
                  label: STATUS_CONFIG_APARELHO[s].label,
                })),
              ]}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">
              Tipo
            </label>
            <SearchableSelect
              className="w-[140px]"
              value={tipoFilter}
              onChange={(v) => {
                setTipoFilter(v as TipoAparelho | "TODOS");
                setPage(0);
              }}
              options={[
                { value: "TODOS", label: "Todos" },
                { value: "RASTREADOR", label: "Rastreador" },
                { value: "SIM", label: "SIM Card" },
              ]}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">
              Proprietário
            </label>
            <SearchableSelect
              className="w-[130px]"
              value={proprietarioFilter}
              onChange={(v) => {
                setProprietarioFilter(v as ProprietarioTipo | "TODOS");
                setPage(0);
              }}
              options={[
                { value: "TODOS", label: "Todos" },
                { value: "INFINITY", label: "Infinity" },
                { value: "CLIENTE", label: "Cliente" },
              ]}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">
              Marca / Operadora
            </label>
            <SearchableSelect
              className="w-[140px]"
              value={marcaFilter}
              onChange={(v) => {
                setMarcaFilter(v);
                setPage(0);
              }}
              options={[
                { value: "TODOS", label: "Todas" },
                ...marcas.map((m) => ({ value: m, label: m })),
              ]}
            />
          </div>
          {canCreate && (
            <>
              <Link to="/aparelhos/lote">
                <Button
                  variant="outline"
                  className="text-[11px] font-bold uppercase"
                >
                  <MaterialIcon name="inventory_2" className="text-sm mr-1" />
                  Entrada de Lote
                </Button>
              </Link>
              <Link to="/aparelhos/individual">
                <Button className="bg-erp-blue hover:bg-blue-700 text-[11px] font-bold uppercase">
                  <MaterialIcon name="add" className="text-sm mr-1" />
                  Criar Manual
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-white border border-slate-300 shadow-sm overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200 bg-slate-50 hover:bg-slate-50">
                <TableHead className="w-10 px-4 py-2" />
                <TableHead className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Identificação
                </TableHead>
                <TableHead className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Tipo
                </TableHead>
                <TableHead className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Marca / Operadora
                </TableHead>
                <TableHead className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Proprietário
                </TableHead>
                <TableHead className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Status
                </TableHead>
                <TableHead className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  SIM/Rastreador Vinculado
                </TableHead>
                <TableHead className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Kit
                </TableHead>
                <TableHead className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Técnico
                </TableHead>
                <TableHead className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Proprietário
                </TableHead>
                <TableHead className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Lote
                </TableHead>
                <TableHead className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Data Entrada
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((aparelho) => {
                const isExpanded = expandedId === aparelho.id;
                const statusConfig = STATUS_CONFIG_APARELHO[aparelho.status];
                const tipoConfig = TIPO_CONFIG[aparelho.tipo];
                const TipoIcon = tipoConfig.icon;
                const propConfig = PROPRIETARIO_CONFIG[aparelho.proprietario];

                return (
                  <Fragment key={aparelho.id}>
                    <TableRow
                      className={cn(
                        "cursor-pointer border-slate-200 hover:bg-slate-50 transition-colors",
                        isExpanded &&
                          "border-l-4 border-l-blue-600 bg-blue-50/30",
                      )}
                      onClick={() =>
                        setExpandedId(isExpanded ? null : aparelho.id)
                      }
                    >
                      <TableCell className="px-4 py-3 text-slate-400">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <TipoIcon className="h-4 w-4 text-slate-400" />
                          <span className="font-mono text-sm font-medium text-slate-800">
                            {aparelho.identificador || `#${aparelho.id}`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[10px] font-bold uppercase",
                            aparelho.tipo === "RASTREADOR"
                              ? "border-slate-200 bg-slate-100 text-slate-600"
                              : "border-sky-200 bg-sky-50 text-sky-700",
                          )}
                        >
                          {tipoConfig.label}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-slate-600">
                        {aparelho.tipo === "RASTREADOR"
                          ? aparelho.marca || "-"
                          : [aparelho.operadora, aparelho.marcaSimcard?.nome]
                              .filter(Boolean)
                              .join(" · ") || "-"}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-bold uppercase",
                            propConfig.className,
                          )}
                        >
                          {propConfig.label}
                        </span>
                        {aparelho.cliente && (
                          <p className="mt-0.5 text-[10px] text-slate-500 truncate max-w-[120px]">
                            {aparelho.cliente.nome}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[10px] font-bold uppercase",
                            statusConfig.bgColor,
                            statusConfig.borderColor,
                            statusConfig.color,
                          )}
                        >
                          <span>{statusConfig.icon}</span>
                          {statusConfig.label}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {(() => {
                          const vinculado =
                            aparelho.tipo === "RASTREADOR"
                              ? aparelho.simVinculado?.identificador
                              : aparelho.aparelhosVinculados?.[0]
                                  ?.identificador;
                          return vinculado ? (
                            <span className="font-mono text-xs text-blue-600">
                              {vinculado}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">
                              {aparelho.tipo === "RASTREADOR"
                                ? "Não vinculado"
                                : "Disponível"}
                            </span>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {(() => {
                          const rastreador =
                            aparelho.tipo === "SIM"
                              ? aparelho.aparelhosVinculados?.[0]
                              : null;
                          const kitNome =
                            aparelho.kit?.nome ??
                            (aparelho.kitId
                              ? kitsPorId.get(aparelho.kitId)
                              : null) ??
                            rastreador?.kit?.nome ??
                            (rastreador?.kitId
                              ? kitsPorId.get(rastreador.kitId)
                              : null);
                          return kitNome ? (
                            <span className="rounded-sm bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700 border border-violet-200">
                              {kitNome}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-slate-600">
                        {(() => {
                          const rastreador =
                            aparelho.tipo === "SIM"
                              ? aparelho.aparelhosVinculados?.[0]
                              : null;
                          const tecnicoNome =
                            aparelho.tecnico?.nome ?? rastreador?.tecnico?.nome;
                          return tecnicoNome ? (
                            <div className="text-xs font-medium">
                              {tecnicoNome}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-slate-600">
                        {(() => {
                          const rastreador =
                            aparelho.tipo === "SIM"
                              ? aparelho.aparelhosVinculados?.[0]
                              : null;
                          const prop =
                            aparelho.proprietario ?? rastreador?.proprietario;
                          const clienteNome =
                            aparelho.cliente?.nome ?? rastreador?.cliente?.nome;
                          return (
                            <div className="text-xs font-medium">
                              {clienteNome ??
                                (prop === "INFINITY" ? "Infinity" : "-")}
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {aparelho.lote ? (
                          <span className="rounded-sm bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200">
                            {aparelho.lote.referencia}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-xs text-slate-500">
                        {parseDataLocal(aparelho.criadoEm).toLocaleDateString(
                          "pt-BR",
                          { day: "2-digit", month: "2-digit", year: "numeric" },
                        )}
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow className="bg-slate-50">
                        <TableCell
                          colSpan={11}
                          className="border-b border-slate-200 p-0"
                        >
                          <div className="bg-slate-50 px-8 py-6">
                            <div className="grid grid-cols-3 gap-8">
                              <div>
                                <h4 className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400">
                                  <MaterialIcon
                                    name="description"
                                    className="text-sm"
                                  />
                                  Dados do Equipamento
                                </h4>
                                <div className="space-y-3">
                                  <div className="flex justify-between text-[11px] border-b border-slate-100 pb-2">
                                    <span className="text-slate-500">
                                      {aparelho.tipo === "RASTREADOR"
                                        ? "IMEI"
                                        : "ICCID"}
                                    </span>
                                    <span className="font-mono font-bold text-slate-700">
                                      {aparelho.identificador ||
                                        `#${aparelho.id}`}
                                    </span>
                                  </div>
                                  {aparelho.tipo === "RASTREADOR" && (
                                    <>
                                      <div className="flex justify-between text-[11px] border-b border-slate-100 pb-2">
                                        <span className="text-slate-500">
                                          Marca
                                        </span>
                                        <span className="font-bold text-slate-700">
                                          {aparelho.marca || "-"}
                                        </span>
                                      </div>
                                      <div className="flex justify-between text-[11px] border-b border-slate-100 pb-2">
                                        <span className="text-slate-500">
                                          Modelo
                                        </span>
                                        <span className="font-bold text-slate-700">
                                          {aparelho.modelo || "-"}
                                        </span>
                                      </div>
                                    </>
                                  )}
                                  {aparelho.tipo === "SIM" && (
                                    <>
                                      <div className="flex justify-between text-[11px] border-b border-slate-100 pb-2">
                                        <span className="text-slate-500">
                                          Operadora
                                        </span>
                                        <span className="font-bold text-slate-700">
                                          {aparelho.operadora || "-"}
                                        </span>
                                      </div>
                                      <div className="flex justify-between text-[11px] border-b border-slate-100 pb-2">
                                        <span className="text-slate-500">
                                          Marca do Simcard
                                        </span>
                                        <span className="font-bold text-slate-700">
                                          {aparelho.marcaSimcard?.nome || "-"}
                                        </span>
                                      </div>
                                      <div className="flex justify-between text-[11px] border-b border-slate-100 pb-2">
                                        <span className="text-slate-500">
                                          Plano
                                        </span>
                                        <span className="font-bold text-slate-700">
                                          {aparelho.planoSimcard
                                            ? `${aparelho.planoSimcard.planoMb} MB`
                                            : "-"}
                                        </span>
                                      </div>
                                    </>
                                  )}
                                  <div className="flex justify-between text-[11px] border-b border-slate-100 pb-2">
                                    <span className="text-slate-500">
                                      Proprietário
                                    </span>
                                    <span className="font-bold text-slate-700">
                                      {propConfig.label}
                                      {aparelho.cliente &&
                                        ` - ${aparelho.cliente.nome}`}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-[11px] border-b border-slate-100 pb-2">
                                    <span className="text-slate-500">
                                      Valor Unitário
                                    </span>
                                    <span className="font-bold text-slate-700">
                                      {formatarMoedaOpcional(
                                        aparelho.valorUnitario,
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-[11px]">
                                    <span className="text-slate-500">Lote</span>
                                    <span className="font-bold text-slate-700">
                                      {aparelho.lote?.referencia || "-"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h4 className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400">
                                  <MaterialIcon
                                    name="link"
                                    className="text-sm"
                                  />
                                  Vínculos
                                </h4>
                                <div className="space-y-3">
                                  <div className="flex justify-between text-[11px] border-b border-slate-100 pb-2">
                                    <span className="text-slate-500">
                                      {aparelho.tipo === "RASTREADOR"
                                        ? "SIM Vinculado"
                                        : "Rastreador Vinculado"}
                                    </span>
                                    {(() => {
                                      const vinculado =
                                        aparelho.tipo === "RASTREADOR"
                                          ? aparelho.simVinculado?.identificador
                                          : aparelho.aparelhosVinculados?.[0]
                                              ?.identificador;
                                      return (
                                        <span
                                          className={cn(
                                            "font-bold",
                                            vinculado
                                              ? "text-blue-600 font-mono"
                                              : "text-slate-400 italic",
                                          )}
                                        >
                                          {vinculado ??
                                            (aparelho.tipo === "RASTREADOR"
                                              ? "Não vinculado"
                                              : "Disponível")}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                  <div className="flex justify-between text-[11px] border-b border-slate-100 pb-2">
                                    <span className="text-slate-500">Kit</span>
                                    {(() => {
                                      const rastreador =
                                        aparelho.tipo === "SIM"
                                          ? aparelho.aparelhosVinculados?.[0]
                                          : null;
                                      const kitNome =
                                        aparelho.kit?.nome ??
                                        (aparelho.kitId
                                          ? kitsPorId.get(aparelho.kitId)
                                          : null) ??
                                        rastreador?.kit?.nome ??
                                        (rastreador?.kitId
                                          ? kitsPorId.get(rastreador.kitId)
                                          : null);
                                      return (
                                        <span
                                          className={cn(
                                            "font-bold",
                                            kitNome
                                              ? "text-violet-600"
                                              : "text-slate-400",
                                          )}
                                        >
                                          {kitNome ?? "-"}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                  <div className="flex justify-between text-[11px] border-b border-slate-100 pb-2">
                                    <span className="text-slate-500">
                                      Técnico
                                    </span>
                                    {(() => {
                                      const rastreador =
                                        aparelho.tipo === "SIM"
                                          ? aparelho.aparelhosVinculados?.[0]
                                          : null;
                                      const nome =
                                        aparelho.cliente?.nome ??
                                        aparelho.tecnico?.nome ??
                                        rastreador?.cliente?.nome ??
                                        rastreador?.tecnico?.nome;
                                      return (
                                        <span
                                          className={cn(
                                            "font-bold",
                                            nome
                                              ? "text-slate-700"
                                              : "text-slate-400",
                                          )}
                                        >
                                          {nome ?? "-"}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                  <div className="flex justify-between text-[11px] border-b border-slate-100 pb-2">
                                    <span className="text-slate-500">
                                      Ordem de Serviço
                                    </span>
                                    {aparelho.ordemServicoVinculada ? (
                                      <span className="font-bold text-blue-600">
                                        OS #
                                        {aparelho.ordemServicoVinculada.numero}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400">-</span>
                                    )}
                                  </div>
                                  <div className="flex justify-between text-[11px] border-b border-slate-100 pb-2">
                                    <span className="text-slate-500">
                                      Subcliente
                                    </span>
                                    <span
                                      className={cn(
                                        "font-bold",
                                        aparelho.ordemServicoVinculada
                                          ?.subclienteNome
                                          ? "text-slate-700"
                                          : "text-slate-400",
                                      )}
                                    >
                                      {aparelho.ordemServicoVinculada
                                        ?.subclienteNome ?? "-"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-[11px]">
                                    <span className="text-slate-500">
                                      Placa
                                    </span>
                                    <span
                                      className={cn(
                                        "font-bold",
                                        aparelho.ordemServicoVinculada
                                          ?.veiculoPlaca
                                          ? "text-slate-700"
                                          : "text-slate-400",
                                      )}
                                    >
                                      {aparelho.ordemServicoVinculada
                                        ?.veiculoPlaca ?? "-"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h4 className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400">
                                  <MaterialIcon
                                    name="history"
                                    className="text-sm"
                                  />
                                  Histórico
                                </h4>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                  {aparelho.historico &&
                                  aparelho.historico.length > 0 ? (
                                    aparelho.historico.map((item, idx) => (
                                      <div
                                        key={idx}
                                        className="flex items-start gap-3 border-l-2 border-slate-200 pl-3 py-1"
                                      >
                                        <div className="flex-1">
                                          <p className="text-[11px] font-bold text-slate-700">
                                            {item.acao}
                                          </p>
                                          {item.descricao && (
                                            <p className="text-[10px] text-slate-500">
                                              {item.descricao}
                                            </p>
                                          )}
                                          <p className="text-[9px] text-slate-400 mt-0.5">
                                            {formatarDataHora(item.data)}
                                          </p>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-[11px] text-slate-400 italic">
                                      Sem histórico registrado
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    className="px-4 py-12 text-center text-sm text-slate-500"
                  >
                    Nenhum aparelho encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-300 flex justify-between items-center bg-slate-50">
          <div className="text-[10px] font-bold text-slate-500 uppercase">
            Exibindo {paginated.length === 0 ? 0 : page * PAGE_SIZE + 1}-
            {Math.min((page + 1) * PAGE_SIZE, filtered.length)} de{" "}
            {filtered.length} aparelhos
          </div>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="text-[10px] font-bold h-7"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Anterior
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p = i;
              if (totalPages > 5) {
                const half = Math.floor(5 / 2);
                let start = Math.max(0, page - half);
                if (start + 5 > totalPages) start = totalPages - 5;
                p = start + i;
              }
              return (
                <Button
                  key={p}
                  variant={page === p ? "default" : "outline"}
                  size="sm"
                  className={`text-[10px] font-bold h-7 ${page === p ? "bg-slate-900" : ""}`}
                  onClick={() => setPage(p)}
                >
                  {p + 1}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              className="text-[10px] font-bold h-7"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              Próximo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
