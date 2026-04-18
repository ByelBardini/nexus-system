import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MaterialIcon } from "@/components/MaterialIcon";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusCadastro = "AGUARDANDO" | "EM_CADASTRO" | "CONCLUIDO";
type Plataforma = "GETRAK" | "GEOMAPS" | "SELSYN";
type TipoRegistro = "CADASTRO" | "REVISAO" | "RETIRADA";

interface OrdemCadastro {
  id: number;
  status: StatusCadastro;
  tipoRegistro: TipoRegistro;
  /** Quando `tipoRegistro === 'CADASTRO'`, define o rótulo Instalação c/ ou s/ bloqueio. */
  instalacaoComBloqueio: boolean | null;
  cliente: string;
  subcliente: string | null;
  tipoServico: string;
  tecnico: string;
  veiculo: string;
  placa: string;
  cor: string;
  modelo: string;
  /** Modelo do rastreador/equipamento de entrada (IMEI de entrada). */
  modeloAparelhoEntrada: string | null;
  imei: string | null;
  iccid: string | null;
  local: string | null;
  posChave: string | null;
  imeiSaida: string | null;
  iccidSaida: string | null;
  modeloSaida: string | null;
  data: string;
  plataforma: Plataforma | null;
  concluidoEm: string | null;
  concluidoPor: string | null;
}

// ─── Backend response shape ───────────────────────────────────────────────────

interface OSResponse {
  id: number;
  tipo: string;
  statusCadastro: StatusCadastro;
  idAparelho: string | null;
  iccidAparelho: string | null;
  idEntrada: string | null;
  iccidEntrada: string | null;
  plataforma: Plataforma | null;
  concluidoEm: string | null;
  localInstalacao: string | null;
  posChave: string | null;
  criadoEm: string;
  cliente: { nome: string };
  subcliente: { nome: string } | null;
  tecnico: { nome: string } | null;
  veiculo: {
    placa: string;
    marca: string;
    modelo: string;
    cor: string;
    ano: number;
  } | null;
  concluidoPor: { nome: string } | null;
  aparelhoEntrada: {
    marca: string | null;
    modelo: string | null;
    iccid: string | null;
    sim: {
      operadora: string | null;
      marcaNome: string | null;
      planoMb: number | null;
    } | null;
  } | null;
  aparelhoSaida: {
    marca: string | null;
    modelo: string | null;
    iccid: string | null;
    sim: {
      operadora: string | null;
      marcaNome: string | null;
      planoMb: number | null;
    } | null;
  } | null;
}

// ─── Mapping ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatModelo(
  a: {
    marca: string | null;
    modelo: string | null;
    sim: {
      operadora: string | null;
      marcaNome: string | null;
      planoMb: number | null;
    } | null;
  } | null,
): string | null {
  if (!a) return null;
  const base = [a.marca, a.modelo].filter(Boolean).join(" ");
  if (!base) return null;
  if (!a.sim) return base;
  const { operadora, marcaNome, planoMb } = a.sim;
  const simPartes = [
    operadora,
    marcaNome && planoMb ? `${marcaNome}/${planoMb} MB` : marcaNome,
  ].filter(Boolean);
  return simPartes.length > 0 ? `${base} (${simPartes.join(" ")})` : base;
}

function mapOS(os: OSResponse): OrdemCadastro {
  const tipoRegistro: TipoRegistro =
    os.tipo === "INSTALACAO_COM_BLOQUEIO" ||
    os.tipo === "INSTALACAO_SEM_BLOQUEIO"
      ? "CADASTRO"
      : os.tipo === "REVISAO"
        ? "REVISAO"
        : "RETIRADA";

  const instalacaoComBloqueio =
    os.tipo === "INSTALACAO_COM_BLOQUEIO"
      ? true
      : os.tipo === "INSTALACAO_SEM_BLOQUEIO"
        ? false
        : null;

  const tipoServico =
    os.tipo === "INSTALACAO_COM_BLOQUEIO"
      ? "Instalação c/ bloqueio"
      : os.tipo === "INSTALACAO_SEM_BLOQUEIO"
        ? "Instalação s/ bloqueio"
        : os.tipo === "REVISAO"
          ? "Troca de Equipamento"
          : "Retirada de Equipamento";

  return {
    id: os.id,
    status: os.statusCadastro,
    tipoRegistro,
    instalacaoComBloqueio,
    cliente: os.cliente.nome,
    subcliente: os.subcliente?.nome ?? null,
    tipoServico,
    tecnico: os.tecnico?.nome ?? "—",
    veiculo: os.veiculo ? `${os.veiculo.marca} ${os.veiculo.modelo}` : "—",
    placa: os.veiculo?.placa ?? "—",
    cor: os.veiculo?.cor ?? "—",
    modelo: os.veiculo
      ? `${os.veiculo.marca} ${os.veiculo.modelo} (${os.veiculo.ano})`
      : "—",
    modeloAparelhoEntrada: formatModelo(os.aparelhoEntrada),
    imei: os.idAparelho,
    iccid: os.iccidAparelho ?? os.aparelhoEntrada?.iccid ?? null,
    local: os.localInstalacao,
    posChave: os.posChave,
    imeiSaida: os.idEntrada,
    iccidSaida: os.iccidEntrada ?? os.aparelhoSaida?.iccid ?? null,
    modeloSaida: formatModelo(os.aparelhoSaida),
    data: formatDate(os.criadoEm),
    plataforma: os.plataforma,
    concluidoEm: os.concluidoEm ? formatDate(os.concluidoEm) : null,
    concluidoPor: os.concluidoPor?.nome ?? null,
  };
}

// ─── Period helpers ───────────────────────────────────────────────────────────

function periodoParams(periodo: string): {
  dataInicio: string;
  dataFim: string;
} {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const toISO = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (periodo === "hoje") {
    const today = toISO(now);
    return { dataInicio: today, dataFim: today };
  }
  if (periodo === "semana") {
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { dataInicio: toISO(monday), dataFim: toISO(sunday) };
  }
  // mes
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { dataInicio: toISO(firstDay), dataFim: toISO(lastDay) };
}

// ─── Config Maps ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  StatusCadastro,
  { label: string; className: string }
> = {
  AGUARDANDO: {
    label: "Aguardando",
    className: "bg-amber-50 text-amber-800 border-amber-200",
  },
  EM_CADASTRO: {
    label: "Em Cadastro",
    className: "bg-blue-50 text-blue-800 border-blue-200",
  },
  CONCLUIDO: {
    label: "Concluído",
    className: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
};

const TIPO_REGISTRO_CONFIG: Record<
  TipoRegistro,
  { label: string; className: string }
> = {
  CADASTRO: {
    label: "Cadastro",
    className: "bg-sky-50 text-sky-800 border-sky-200",
  },
  REVISAO: {
    label: "Revisão",
    className: "bg-purple-50 text-purple-800 border-purple-200",
  },
  RETIRADA: {
    label: "Retirada",
    className: "bg-orange-50 text-orange-800 border-orange-200",
  },
};

const LABEL_INSTALACAO_COM_BLOQUEIO = "INSTALAÇÃO C/ BLOQUEIO";
const LABEL_INSTALACAO_SEM_BLOQUEIO = "INSTALAÇÃO S/ BLOQUEIO";

function badgeServicoColuna(ordem: OrdemCadastro): {
  label: string;
  className: string;
} {
  if (
    ordem.tipoRegistro === "CADASTRO" &&
    ordem.instalacaoComBloqueio !== null
  ) {
    return {
      label: ordem.instalacaoComBloqueio
        ? LABEL_INSTALACAO_COM_BLOQUEIO
        : LABEL_INSTALACAO_SEM_BLOQUEIO,
      className: TIPO_REGISTRO_CONFIG.CADASTRO.className,
    };
  }
  return TIPO_REGISTRO_CONFIG[ordem.tipoRegistro];
}

const ACAO_LABELS: Record<
  TipoRegistro,
  { iniciar: string; concluir: string; concluido: string }
> = {
  CADASTRO: {
    iniciar: "Iniciar Cadastro",
    concluir: "Concluir Cadastro",
    concluido: "Cadastro Concluído",
  },
  REVISAO: {
    iniciar: "Iniciar Revisão",
    concluir: "Concluir Revisão",
    concluido: "Revisão Concluída",
  },
  RETIRADA: {
    iniciar: "Iniciar Retirada",
    concluir: "Concluir Retirada",
    concluido: "Retirada Concluída",
  },
};

const PLATAFORMA_LABEL: Record<Plataforma, string> = {
  GETRAK: "Getrak",
  GEOMAPS: "Geomaps",
  SELSYN: "Selsyn",
};

/** Radix Select não permite SelectItem com value=""; reservado para placeholder. */
const SELECT_FILTRO_TODOS = "__todos__";

// ─── Page ─────────────────────────────────────────────────────────────────────

export function CadastroRastreamentoPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [plataforma, setPlataforma] = useState<Plataforma>("GETRAK");
  const [filtroStatus, setFiltroStatus] = useState<StatusCadastro | "TODOS">(
    "TODOS",
  );
  const [filtroTecnico, setFiltroTecnico] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [periodo, setPeriodo] = useState("hoje");

  const { dataInicio, dataFim } = useMemo(
    () => periodoParams(periodo),
    [periodo],
  );

  const { data: queryResult, isLoading } = useQuery({
    queryKey: ["cadastro-rastreamento", dataInicio, dataFim],
    queryFn: () =>
      api<{ data: OSResponse[]; total: number }>(
        `/cadastro-rastreamento?dataInicio=${dataInicio}&dataFim=${dataFim}&limit=100`,
      ),
  });

  const ordens = useMemo(
    () => (queryResult?.data ?? []).map(mapOS),
    [queryResult],
  );

  const mutIniciar = useMutation({
    mutationFn: (id: number) =>
      api(`/cadastro-rastreamento/${id}/iniciar`, { method: "PATCH" }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["cadastro-rastreamento"] }),
  });

  const mutConcluir = useMutation({
    mutationFn: ({ id, plataforma }: { id: number; plataforma: Plataforma }) =>
      api(`/cadastro-rastreamento/${id}/concluir`, {
        method: "PATCH",
        body: JSON.stringify({ plataforma }),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["cadastro-rastreamento"] }),
  });

  const selectedOrdem = ordens.find((o) => o.id === selectedId) ?? null;

  const tecnicos = useMemo(
    () => [...new Set(ordens.map((o) => o.tecnico).filter((t) => t !== "—"))],
    [ordens],
  );

  const ordensFiltradas = ordens.filter((o) => {
    const matchStatus = filtroStatus === "TODOS" || o.status === filtroStatus;
    const matchTecnico = !filtroTecnico || o.tecnico === filtroTecnico;
    const matchTipo = !filtroTipo || o.tipoRegistro === filtroTipo;
    return matchStatus && matchTecnico && matchTipo;
  });

  const statsAguardando = ordens.filter(
    (o) => o.status === "AGUARDANDO",
  ).length;
  const statsEmCadastro = ordens.filter(
    (o) => o.status === "EM_CADASTRO",
  ).length;
  const statsConcluido = ordens.filter((o) => o.status === "CONCLUIDO").length;

  const temFiltroAtivo = filtroTecnico || filtroTipo;
  const isMutating = mutIniciar.isPending || mutConcluir.isPending;

  function handleAvancarStatus() {
    if (!selectedOrdem || selectedOrdem.status === "CONCLUIDO") return;
    const acao = ACAO_LABELS[selectedOrdem.tipoRegistro];
    if (selectedOrdem.status === "AGUARDANDO") {
      mutIniciar.mutate(selectedOrdem.id, {
        onSuccess: () => toast.success(`${acao.iniciar}do!`),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Erro ao iniciar"),
      });
    } else {
      mutConcluir.mutate(
        { id: selectedOrdem.id, plataforma },
        {
          onSuccess: () => toast.success(`${acao.concluido}!`),
          onError: (err) =>
            toast.error(
              err instanceof Error ? err.message : "Erro ao concluir",
            ),
        },
      );
    }
  }

  function copiar(valor: string, label: string) {
    navigator.clipboard.writeText(valor);
    toast.success(`${label} copiado!`);
  }

  function copiarTodos(ordem: OrdemCadastro) {
    const linhas: string[] = [
      `Placa: ${ordem.placa}`,
      `Cliente: ${ordem.cliente}`,
    ];
    if (ordem.imei) linhas.push(`IMEI (Entrada): ${ordem.imei}`);
    if (ordem.iccid) linhas.push(`ICCID (Entrada): ${ordem.iccid}`);
    if (ordem.imeiSaida) linhas.push(`IMEI (Saída): ${ordem.imeiSaida}`);
    if (ordem.iccidSaida) linhas.push(`ICCID (Saída): ${ordem.iccidSaida}`);
    navigator.clipboard.writeText(linhas.join("\n"));
    toast.success("Dados principais copiados!");
  }

  return (
    <div className="space-y-4">
      {/* ── Stat Cards ──────────────────────────────────────────────────────── */}
      <div className="flex w-full shadow-sm border border-slate-300 bg-white">
        <div className="flex-1 border-r border-slate-200 p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div className="border-l-4 border-amber-500 pl-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase font-condensed">
                Aguardando
              </span>
              <div className="text-3xl font-black text-slate-800 leading-none mt-0.5">
                {statsAguardando}
              </div>
            </div>
            <MaterialIcon name="schedule" className="text-amber-400 text-2xl" />
          </div>
          <div className="flex items-center gap-1.5">
            <MaterialIcon name="list_alt" className="text-slate-400 text-sm" />
            <span className="text-[10px] text-slate-400">ordens na fila</span>
          </div>
        </div>

        <div className="flex-1 border-r border-slate-200 p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div className="border-l-4 border-erp-blue pl-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase font-condensed">
                Em Cadastro
              </span>
              <div className="text-3xl font-black text-slate-800 leading-none mt-0.5">
                {statsEmCadastro}
              </div>
            </div>
            <MaterialIcon name="sync" className="text-blue-400 text-2xl" />
          </div>
          <div className="flex items-center gap-1.5">
            <MaterialIcon name="person" className="text-slate-400 text-sm" />
            <span className="text-[10px] text-slate-400">
              sendo registradas
            </span>
          </div>
        </div>

        <div className="flex-1 p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div className="border-l-4 border-emerald-500 pl-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase font-condensed">
                Concluídas no Período
              </span>
              <div className="text-3xl font-black text-slate-800 leading-none mt-0.5">
                {statsConcluido}
              </div>
            </div>
            <MaterialIcon
              name="check_circle"
              className="text-emerald-400 text-2xl"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <MaterialIcon name="verified" className="text-slate-400 text-sm" />
            <span className="text-[10px] text-slate-400">
              registros concluídos
            </span>
          </div>
        </div>
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">
              Técnico
            </label>
            <Select
              value={filtroTecnico === "" ? SELECT_FILTRO_TODOS : filtroTecnico}
              onValueChange={(v) =>
                setFiltroTecnico(v === SELECT_FILTRO_TODOS ? "" : v)
              }
            >
              <SelectTrigger className="h-9 text-xs w-[180px]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SELECT_FILTRO_TODOS}>Todos</SelectItem>
                {tecnicos.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">
              Tipo de Registro
            </label>
            <Select
              value={filtroTipo === "" ? SELECT_FILTRO_TODOS : filtroTipo}
              onValueChange={(v) =>
                setFiltroTipo(v === SELECT_FILTRO_TODOS ? "" : v)
              }
            >
              <SelectTrigger className="h-9 text-xs w-[160px]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SELECT_FILTRO_TODOS}>Todos</SelectItem>
                <SelectItem value="CADASTRO">Instalação</SelectItem>
                <SelectItem value="REVISAO">Revisão</SelectItem>
                <SelectItem value="RETIRADA">Retirada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">
              Período
            </label>
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="h-9 text-xs w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hoje">Hoje</SelectItem>
                <SelectItem value="semana">Esta semana</SelectItem>
                <SelectItem value="mes">Este mês</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {temFiltroAtivo && (
            <div className="flex flex-col justify-end">
              <button
                type="button"
                onClick={() => {
                  setFiltroTecnico("");
                  setFiltroTipo("");
                }}
                className="h-9 px-3 text-[11px] font-bold text-slate-500 hover:text-slate-700 border border-slate-200 rounded bg-white hover:bg-slate-50 flex items-center gap-1"
              >
                <MaterialIcon name="close" className="text-sm" />
                Limpar
              </button>
            </div>
          )}
        </div>

        {/* Status tabs */}
        <div className="flex gap-1">
          {(
            [
              { value: "TODOS", label: "Todos" },
              { value: "AGUARDANDO", label: "Aguardando" },
              { value: "EM_CADASTRO", label: "Em Cadastro" },
              { value: "CONCLUIDO", label: "Concluído" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFiltroStatus(tab.value)}
              className={cn(
                "px-3 py-1 text-[11px] font-bold rounded border transition-colors",
                filtroStatus === tab.value
                  ? "bg-erp-blue text-white border-erp-blue"
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body: Table + Panel ─────────────────────────────────────────────── */}
      <div className="flex gap-4 items-start">
        {/* Tabela */}
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
                const cfgStatus = STATUS_CONFIG[ordem.status];
                const cfgServico = badgeServicoColuna(ordem);
                return (
                  <TableRow
                    key={ordem.id}
                    onClick={() => setSelectedId(isSelected ? null : ordem.id)}
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
                      {ordem.imeiSaida ? (
                        <>
                          <div className="text-[10px] font-mono text-slate-600">
                            {ordem.imeiSaida}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {ordem.modeloSaida ?? "—"}
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

        {/* ── Work Panel ──────────────────────────────────────────────────────── */}
        <aside className="w-[340px] shrink-0 bg-white border border-slate-300 shadow-sm sticky top-4 self-start">
          {/* Header */}
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MaterialIcon name="work" className="text-erp-blue text-lg" />
              <h3 className="text-xs font-bold text-slate-700 font-condensed uppercase tracking-tight">
                Mesa de Trabalho
              </h3>
            </div>
            {selectedOrdem && (
              <span
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded font-bold border",
                  STATUS_CONFIG[selectedOrdem.status].className,
                )}
              >
                OS #{selectedOrdem.id}
              </span>
            )}
          </div>

          {/* Empty state */}
          {!selectedOrdem ? (
            <div className="flex flex-col items-center justify-center gap-3 py-14 px-8 text-center">
              <MaterialIcon
                name="touch_app"
                className="text-slate-200 text-[3.5rem]"
              />
              <p className="text-xs font-bold text-slate-400 font-condensed uppercase">
                Selecione uma OS
              </p>
              <p className="text-[11px] text-slate-400 max-w-[200px] leading-relaxed">
                Clique em uma ordem da tabela para ver os detalhes e iniciar o
                cadastro
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-5">
              {/* Dados da Ordem */}
              <PanelBlock icon="info" title="Dados da Ordem">
                <PanelRow
                  label="Cliente"
                  value={selectedOrdem.cliente}
                  highlight
                />
                <PanelRow
                  label="Subcliente"
                  value={selectedOrdem.subcliente ?? "—"}
                />
                <PanelRow
                  label="Tipo de Serviço"
                  value={selectedOrdem.tipoServico}
                />
                <PanelRow label="Técnico" value={selectedOrdem.tecnico} />
              </PanelBlock>

              {/* Dados do Veículo */}
              <PanelBlock icon="directions_car" title="Dados do Veículo">
                <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                  <div>
                    <p className="text-[9px] uppercase text-slate-400">Placa</p>
                    <p className="text-sm font-black text-erp-blue">
                      {selectedOrdem.placa}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase text-slate-400">Cor</p>
                    <p className="text-[11px] font-medium text-slate-700">
                      {selectedOrdem.cor}
                    </p>
                  </div>
                  <div className="col-span-2 pt-1.5 border-t border-slate-200">
                    <p className="text-[9px] uppercase text-slate-400">
                      Modelo
                    </p>
                    <p className="text-[11px] font-medium text-slate-700">
                      {selectedOrdem.modelo}
                    </p>
                  </div>
                </div>
              </PanelBlock>

              {/* Aparelho de Entrada — CADASTRO e REVISAO */}
              {(selectedOrdem.tipoRegistro === "CADASTRO" ||
                selectedOrdem.tipoRegistro === "REVISAO") && (
                <PanelBlock icon="router" title="Aparelho de Entrada">
                  <div>
                    <p className="text-[9px] uppercase text-slate-400">
                      Modelo
                    </p>
                    <p className="text-[11px] font-medium text-slate-700">
                      {selectedOrdem.modeloAparelhoEntrada ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase text-slate-400">IMEI</p>
                    <p className="text-xs font-mono font-bold text-slate-800">
                      {selectedOrdem.imei}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase text-slate-400">
                      ICCID (Chip)
                    </p>
                    <p className="text-xs font-mono font-bold text-slate-800">
                      {selectedOrdem.iccid}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-200">
                    <div>
                      <p className="text-[9px] uppercase text-slate-400">
                        Local
                      </p>
                      <p className="text-[10px] text-slate-700">
                        {selectedOrdem.local}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase text-slate-400">
                        Pós-Chave
                      </p>
                      <p className="text-[10px] font-medium text-emerald-700">
                        {selectedOrdem.posChave}
                      </p>
                    </div>
                  </div>
                </PanelBlock>
              )}

              {/* Aparelho de Saída — REVISAO e RETIRADA */}
              {(selectedOrdem.tipoRegistro === "REVISAO" ||
                selectedOrdem.tipoRegistro === "RETIRADA") && (
                <PanelBlock icon="output" title="Aparelho de Saída">
                  <div>
                    <p className="text-[9px] uppercase text-slate-400">
                      Modelo
                    </p>
                    <p className="text-[11px] font-medium text-slate-700">
                      {selectedOrdem.modeloSaida ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase text-slate-400">IMEI</p>
                    <p className="text-xs font-mono font-bold text-slate-800">
                      {selectedOrdem.imeiSaida}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase text-slate-400">
                      ICCID (Chip)
                    </p>
                    <p className="text-xs font-mono font-bold text-slate-800">
                      {selectedOrdem.iccidSaida}
                    </p>
                  </div>
                </PanelBlock>
              )}

              {/* Auxílio de Cadastro */}
              <div>
                <h4 className="text-[10px] uppercase font-bold text-slate-500 mb-2 flex items-center gap-1.5">
                  <MaterialIcon
                    name="content_copy"
                    className="text-slate-400 text-sm"
                  />
                  Auxílio de Cadastro
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Placa", value: selectedOrdem.placa },
                    {
                      label: "Nome",
                      value: selectedOrdem.subcliente ?? selectedOrdem.cliente,
                    },
                    ...(selectedOrdem.imei
                      ? [
                          {
                            label: "IMEI (Entrada)",
                            value: selectedOrdem.imei,
                          },
                          {
                            label: "ICCID (Entrada)",
                            value: selectedOrdem.iccid!,
                          },
                        ]
                      : []),
                    ...(selectedOrdem.imeiSaida
                      ? [
                          {
                            label: "IMEI (Saída)",
                            value: selectedOrdem.imeiSaida,
                          },
                          {
                            label: "ICCID (Saída)",
                            value: selectedOrdem.iccidSaida!,
                          },
                        ]
                      : []),
                  ].map(({ label, value }) => (
                    <button
                      key={label}
                      onClick={() => copiar(value, label)}
                      className="flex items-center justify-center gap-1.5 py-2 bg-white border border-slate-200 rounded-sm text-[10px] font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                    >
                      <MaterialIcon
                        name="content_copy"
                        className="text-sm text-slate-400"
                      />
                      {label}
                    </button>
                  ))}
                  <button
                    onClick={() => copiarTodos(selectedOrdem)}
                    className="col-span-2 flex items-center justify-center gap-2 py-2 bg-erp-blue/10 border border-erp-blue/20 rounded-sm text-[10px] font-bold text-erp-blue hover:bg-erp-blue/15 transition-colors"
                  >
                    <MaterialIcon name="copy_all" className="text-base" />
                    Copiar Todos os Dados Principais
                  </button>
                </div>
              </div>

              {/* Controle */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                {selectedOrdem.status === "EM_CADASTRO" && (
                  <div>
                    <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 flex items-center gap-1.5">
                      <MaterialIcon
                        name="language"
                        className="text-slate-400 text-sm"
                      />
                      Plataforma
                    </Label>
                    <Select
                      value={plataforma}
                      onValueChange={(v) => setPlataforma(v as Plataforma)}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GETRAK">Getrak</SelectItem>
                        <SelectItem value="GEOMAPS">Geomaps</SelectItem>
                        <SelectItem value="SELSYN">Selsyn</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedOrdem.status === "CONCLUIDO" &&
                  selectedOrdem.plataforma && (
                    <div>
                      <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 flex items-center gap-1.5">
                        <MaterialIcon
                          name="language"
                          className="text-slate-400 text-sm"
                        />
                        Plataforma
                      </Label>
                      <div className="h-9 rounded-sm border border-slate-200 bg-slate-50 px-3 flex items-center gap-2">
                        <MaterialIcon
                          name="check_circle"
                          className="text-emerald-500 text-sm"
                        />
                        <span className="text-xs font-bold text-slate-700">
                          {PLATAFORMA_LABEL[selectedOrdem.plataforma]}
                        </span>
                      </div>
                    </div>
                  )}

                <div>
                  <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 flex items-center gap-1.5">
                    <MaterialIcon
                      name="pending_actions"
                      className="text-slate-400 text-sm"
                    />
                    Status do Registro
                  </Label>
                  <div
                    className={cn(
                      "h-9 rounded-sm px-3 flex items-center text-xs font-bold border",
                      STATUS_CONFIG[selectedOrdem.status].className,
                    )}
                  >
                    {STATUS_CONFIG[selectedOrdem.status].label}
                  </div>
                </div>

                {selectedOrdem.status === "CONCLUIDO" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                        Responsável
                      </Label>
                      <Input
                        className="h-9 text-xs bg-slate-50"
                        readOnly
                        value={selectedOrdem.concluidoPor ?? "—"}
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                        Concluído em
                      </Label>
                      <Input
                        className="h-9 text-xs bg-slate-50"
                        readOnly
                        value={selectedOrdem.concluidoEm ?? "—"}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Botão de ação */}
              <div className="pt-1 pb-2">
                {selectedOrdem.status === "AGUARDANDO" && (
                  <Button
                    onClick={handleAvancarStatus}
                    disabled={isMutating}
                    className="w-full h-10 bg-erp-blue hover:bg-blue-700 text-white text-xs font-bold uppercase gap-2"
                  >
                    <MaterialIcon name="play_arrow" className="text-base" />
                    {ACAO_LABELS[selectedOrdem.tipoRegistro].iniciar}
                  </Button>
                )}
                {selectedOrdem.status === "EM_CADASTRO" && (
                  <Button
                    onClick={handleAvancarStatus}
                    disabled={isMutating}
                    className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase gap-2"
                  >
                    <MaterialIcon name="check_circle" className="text-base" />
                    {ACAO_LABELS[selectedOrdem.tipoRegistro].concluir}
                  </Button>
                )}
                {selectedOrdem.status === "CONCLUIDO" && (
                  <Button
                    variant="outline"
                    disabled
                    className="w-full h-10 text-xs font-bold uppercase gap-2"
                  >
                    <MaterialIcon name="verified" className="text-base" />
                    {ACAO_LABELS[selectedOrdem.tipoRegistro].concluido}
                  </Button>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Rodapé count */}
      <div className="text-[11px] text-slate-500">
        {ordensFiltradas.length} ordem(ns) encontrada(s)
      </div>
    </div>
  );
}

// ─── Helper Components ────────────────────────────────────────────────────────

function PanelBlock({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="text-[10px] uppercase font-bold text-slate-500 mb-2 flex items-center gap-1.5">
        <MaterialIcon name={icon} className="text-slate-400 text-sm" />
        {title}
      </h4>
      <div className="bg-slate-50 border border-slate-200 rounded-sm p-3 space-y-2">
        {children}
      </div>
    </div>
  );
}

function PanelRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-[10px] text-slate-500 shrink-0">{label}</span>
      <span
        className={cn(
          "text-[10px] font-bold text-right",
          highlight ? "text-erp-blue" : "text-slate-700",
        )}
      >
        {value}
      </span>
    </div>
  );
}
