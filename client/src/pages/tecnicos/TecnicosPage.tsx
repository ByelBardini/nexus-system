import {
  useState,
  useMemo,
  Fragment,
  useCallback,
  Suspense,
  lazy,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Pencil,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InputPreco } from "@/components/InputPreco";
import { InputTelefone } from "@/components/InputTelefone";
import { InputCEP } from "@/components/InputCEP";
import { SelectUF } from "@/components/SelectUF";
import { SelectCidade } from "@/components/SelectCidade";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MaterialIcon } from "@/components/MaterialIcon";
import { SearchableSelect } from "@/components/SearchableSelect";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useUFs, useMunicipios } from "@/hooks/useBrasilAPI";
import type { EnderecoCEP } from "@/hooks/useBrasilAPI";
import {
  formatarTelefone,
  formatarMoeda,
  formatarMoedaDeCentavos,
} from "@/lib/format";
import { InputCPFCNPJ } from "@/components/InputCPFCNPJ";
import { cn } from "@/lib/utils";
import {
  nextMapState,
  tecnicoPrecoToNum,
  type MapState,
} from "@/lib/tecnicos-page";

const TecnicosMap = lazy(() => import("@/components/TecnicosMap"));

const schema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  cpfCnpj: z.string().optional(),
  telefone: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidadeEndereco: z.string().optional(),
  estadoEndereco: z.string().optional(),
  ativo: z.boolean(),
  instalacaoComBloqueio: z.coerce.number().min(0),
  instalacaoSemBloqueio: z.coerce.number().min(0),
  revisao: z.coerce.number().min(0),
  retirada: z.coerce.number().min(0),
  deslocamento: z.coerce.number().min(0),
});

type FormData = z.infer<typeof schema>;

interface Tecnico {
  id: number;
  nome: string;
  cpfCnpj: string | null;
  telefone: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidadeEndereco: string | null;
  estadoEndereco: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  geocodingPrecision: "EXATO" | "CIDADE" | null;
  ativo: boolean;
  precos?: {
    instalacaoComBloqueio: number | string;
    instalacaoSemBloqueio: number | string;
    revisao: number | string;
    retirada: number | string;
    deslocamento: number | string;
  };
}

const PAGE_SIZE = 10;

export function TecnicosPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTecnico, setEditingTecnico] = useState<Tecnico | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [filtroStatus, setFiltroStatus] = useState<
    "todos" | "ativo" | "inativo"
  >("todos");
  const [page, setPage] = useState(0);
  const [mapState, setMapState] = useState<MapState>("collapsed");
  const canCreate = hasPermission("AGENDAMENTO.TECNICO.CRIAR");
  const canEdit = hasPermission("AGENDAMENTO.TECNICO.EDITAR");

  const {
    data: tecnicos = [],
    isLoading,
    isError,
    error,
  } = useQuery<Tecnico[]>({
    queryKey: ["tecnicos"],
    queryFn: () => api("/tecnicos"),
  });

  const filtered = useMemo(() => {
    return tecnicos.filter((t) => {
      const matchBusca =
        !busca.trim() || t.nome.toLowerCase().includes(busca.toLowerCase());
      const matchEstado =
        filtroEstado === "todos" || (t.estado ?? "") === filtroEstado;
      const matchStatus =
        filtroStatus === "todos" ||
        (filtroStatus === "ativo" && t.ativo) ||
        (filtroStatus === "inativo" && !t.ativo);
      return matchBusca && matchEstado && matchStatus;
    });
  }, [tecnicos, busca, filtroEstado, filtroStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, ativo }: { id: number; ativo: boolean }) =>
      api(`/tecnicos/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ ativo }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tecnicos"] });
      toast.success("Status atualizado");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Erro"),
  });

  const form = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
      nome: "",
      cpfCnpj: "",
      telefone: "",
      cidade: "",
      estado: "",
      cep: "",
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidadeEndereco: "",
      estadoEndereco: "",
      ativo: true,
      instalacaoComBloqueio: 0,
      instalacaoSemBloqueio: 0,
      revisao: 0,
      retirada: 0,
      deslocamento: 0,
    },
  });

  const estadoAtuacao = form.watch("estado");
  const { data: ufs = [] } = useUFs();
  const { data: municipios = [] } = useMunicipios(estadoAtuacao || null);

  const createMutation = useMutation({
    mutationFn: (data: FormData) =>
      api("/tecnicos", {
        method: "POST",
        body: JSON.stringify({
          nome: data.nome,
          cpfCnpj: data.cpfCnpj || undefined,
          telefone: data.telefone || undefined,
          cidade: data.cidade || undefined,
          estado: data.estado || undefined,
          cep: data.cep || undefined,
          logradouro: data.logradouro || undefined,
          numero: data.numero || undefined,
          complemento: data.complemento || undefined,
          bairro: data.bairro || undefined,
          cidadeEndereco: data.cidadeEndereco || undefined,
          estadoEndereco: data.estadoEndereco || undefined,
          ativo: data.ativo,
          precos: {
            instalacaoComBloqueio: data.instalacaoComBloqueio / 100,
            instalacaoSemBloqueio: data.instalacaoSemBloqueio / 100,
            revisao: data.revisao / 100,
            retirada: data.retirada / 100,
            deslocamento: data.deslocamento / 100,
          },
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tecnicos"] });
      closeModal();
      toast.success("Técnico criado com sucesso");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao criar técnico"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) =>
      api(`/tecnicos/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          nome: data.nome,
          cpfCnpj: data.cpfCnpj || undefined,
          telefone: data.telefone || undefined,
          cidade: data.cidade || undefined,
          estado: data.estado || undefined,
          cep: data.cep || undefined,
          logradouro: data.logradouro || undefined,
          numero: data.numero || undefined,
          complemento: data.complemento || undefined,
          bairro: data.bairro || undefined,
          cidadeEndereco: data.cidadeEndereco || undefined,
          estadoEndereco: data.estadoEndereco || undefined,
          ativo: data.ativo,
          precos: {
            instalacaoComBloqueio: data.instalacaoComBloqueio / 100,
            instalacaoSemBloqueio: data.instalacaoSemBloqueio / 100,
            revisao: data.revisao / 100,
            retirada: data.retirada / 100,
            deslocamento: data.deslocamento / 100,
          },
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tecnicos"] });
      closeModal();
      toast.success("Técnico atualizado com sucesso");
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Erro ao atualizar técnico",
      ),
  });

  function openCreateModal() {
    setEditingTecnico(null);
    form.reset({
      nome: "",
      cpfCnpj: "",
      telefone: "",
      cidade: "",
      estado: "",
      cep: "",
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidadeEndereco: "",
      estadoEndereco: "",
      ativo: true,
      instalacaoComBloqueio: 0,
      instalacaoSemBloqueio: 0,
      revisao: 0,
      retirada: 0,
      deslocamento: 0,
    });
    setModalOpen(true);
  }

  function openEditModal(t: Tecnico) {
    setEditingTecnico(t);
    form.reset({
      nome: t.nome,
      cpfCnpj: t.cpfCnpj ?? "",
      telefone: t.telefone ?? "",
      cidade: t.cidade ?? "",
      estado: t.estado ?? "",
      cep: t.cep ?? "",
      logradouro: t.logradouro ?? "",
      numero: t.numero ?? "",
      complemento: t.complemento ?? "",
      bairro: t.bairro ?? "",
      cidadeEndereco: t.cidadeEndereco ?? "",
      estadoEndereco: t.estadoEndereco ?? "",
      ativo: t.ativo,
      instalacaoComBloqueio: Math.round(
        tecnicoPrecoToNum(t.precos?.instalacaoComBloqueio) * 100,
      ),
      instalacaoSemBloqueio: Math.round(
        tecnicoPrecoToNum(t.precos?.instalacaoSemBloqueio) * 100,
      ),
      revisao: Math.round(tecnicoPrecoToNum(t.precos?.revisao) * 100),
      retirada: Math.round(tecnicoPrecoToNum(t.precos?.retirada) * 100),
      deslocamento: Math.round(tecnicoPrecoToNum(t.precos?.deslocamento) * 100),
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingTecnico(null);
  }

  function handleSubmit(data: FormData) {
    if (editingTecnico) {
      updateMutation.mutate({ id: editingTecnico.id, data });
    } else {
      createMutation.mutate(data);
    }
  }

  function toggleStatus(t: Tecnico) {
    if (!canEdit) return;
    updateStatusMutation.mutate({ id: t.id, ativo: !t.ativo });
  }

  const handleAddressFound = useCallback(
    (endereco: EnderecoCEP) => {
      form.setValue("logradouro", endereco.logradouro);
      form.setValue("bairro", endereco.bairro);
      form.setValue("cidadeEndereco", endereco.localidade);
      form.setValue("estadoEndereco", endereco.uf);
      if (endereco.complemento) {
        form.setValue("complemento", endereco.complemento);
      }
    },
    [form],
  );

  const watchedValues = useWatch({
    control: form.control,
    name: [
      "nome",
      "cidade",
      "estado",
      "instalacaoSemBloqueio",
      "revisao",
      "deslocamento",
    ],
  });
  const watchedObj = {
    nome: watchedValues[0],
    cidade: watchedValues[1],
    estado: watchedValues[2],
    instalacaoSemBloqueio: watchedValues[3],
    revisao: watchedValues[4],
    deslocamento: watchedValues[5],
  };

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
          Erro ao carregar técnicos
        </p>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          {error instanceof Error ? error.message : "Erro desconhecido."}
        </p>
      </div>
    );
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="-m-4 flex min-h-[100dvh] flex-col bg-slate-100">
      <header className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8">
        <div className="flex items-center gap-4">
          <Link
            to="/configuracoes"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-3">
            <MaterialIcon
              name="engineering"
              className="text-erp-blue text-xl"
            />
            <div>
              <h1 className="text-lg font-bold text-slate-800">Técnicos</h1>
              <p className="text-xs text-slate-500">
                Cobertura regional e gestão de prestadores
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <Label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
              Busca
            </Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="h-9 w-64 pl-9"
                placeholder="Nome ou CPF/CNPJ..."
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setPage(0);
                }}
              />
            </div>
          </div>
          <div className="flex flex-col">
            <Label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
              Estado
            </Label>
            <SearchableSelect
              className="h-9 w-52"
              value={filtroEstado}
              onChange={(v) => {
                setFiltroEstado(v);
                setPage(0);
              }}
              options={[
                { value: "todos", label: "Todos os estados" },
                ...ufs.map((uf) => ({
                  value: uf.sigla,
                  label: `${uf.sigla} – ${uf.nome}`,
                })),
              ]}
            />
          </div>
          <div className="flex flex-col">
            <Label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
              Status
            </Label>
            <SearchableSelect
              className="h-9 w-32"
              value={filtroStatus}
              onChange={(v) => {
                setFiltroStatus(v as "todos" | "ativo" | "inativo");
                setPage(0);
              }}
              options={[
                { value: "todos", label: "Todos" },
                { value: "ativo", label: "Ativo" },
                { value: "inativo", label: "Inativo" },
              ]}
            />
          </div>
          {canCreate && (
            <div className="flex flex-col">
              <Label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
                &nbsp;
              </Label>
              <Button className="h-9 gap-2" onClick={openCreateModal}>
                <Plus className="h-4 w-4" />
                Novo Técnico
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <section
          className={cn(
            "relative z-0 isolate shrink-0 border-r border-slate-200 bg-slate-100 transition-[width] duration-300",
            mapState === "collapsed" && "w-[40%]",
            mapState === "expanded" && "w-[75%]",
            mapState === "fullscreen" && "fixed inset-0 z-40 w-full border-r-0",
          )}
        >
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            }
          >
            <TecnicosMap tecnicos={filtered} containerSize={mapState} />
          </Suspense>
          <div className="absolute right-3 top-3 z-[400] flex flex-row-reverse gap-2">
            <button
              type="button"
              onClick={() => setMapState((s) => nextMapState(s))}
              title={
                mapState === "collapsed"
                  ? "Expandir mapa"
                  : mapState === "expanded"
                    ? "Tela cheia"
                    : "Recolher mapa"
              }
              className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-md transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <MaterialIcon
                name={
                  mapState === "fullscreen"
                    ? "close_fullscreen"
                    : "open_in_full"
                }
                className="text-base"
              />
            </button>
            {mapState === "expanded" && (
              <button
                type="button"
                onClick={() => setMapState("collapsed")}
                title="Recolher mapa"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-md transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                <MaterialIcon name="unfold_less" className="text-base" />
              </button>
            )}
          </div>
        </section>

        <section
          className={cn(
            "flex min-w-0 flex-1 flex-col overflow-hidden bg-white",
            mapState === "fullscreen" && "hidden",
          )}
        >
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
                  const valorBase = tecnicoPrecoToNum(
                    t.precos?.instalacaoSemBloqueio,
                  );
                  return (
                    <Fragment key={t.id}>
                      <TableRow
                        className="cursor-pointer border-slate-200 hover:bg-slate-50"
                        onClick={() => setExpandedId(isExpanded ? null : t.id)}
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
                            <button
                              type="button"
                              role="switch"
                              aria-checked={t.ativo}
                              disabled={!canEdit}
                              onClick={() => toggleStatus(t)}
                              className={cn(
                                "relative h-5 w-10 cursor-pointer rounded-full transition-colors",
                                t.ativo ? "bg-emerald-500" : "bg-slate-200",
                                !canEdit && "cursor-not-allowed opacity-60",
                              )}
                            >
                              <span
                                className={cn(
                                  "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                                  t.ativo && "translate-x-5",
                                )}
                              />
                            </button>
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
                                <div className="grid grid-cols-5 gap-2">
                                  <div className="rounded border border-slate-200 bg-white p-3">
                                    <span className="mb-1 block text-[9px] font-bold uppercase text-slate-400">
                                      Inst. c/ Bloqueio
                                    </span>
                                    <span className="text-sm font-bold text-slate-800">
                                      {formatarMoeda(
                                        tecnicoPrecoToNum(
                                          t.precos?.instalacaoComBloqueio,
                                        ),
                                      )}
                                    </span>
                                  </div>
                                  <div className="rounded border border-slate-200 bg-white p-3">
                                    <span className="mb-1 block text-[9px] font-bold uppercase text-slate-400">
                                      Inst. s/ Bloqueio
                                    </span>
                                    <span className="text-sm font-bold text-slate-800">
                                      {formatarMoeda(
                                        tecnicoPrecoToNum(
                                          t.precos?.instalacaoSemBloqueio,
                                        ),
                                      )}
                                    </span>
                                  </div>
                                  <div className="rounded border border-slate-200 bg-white p-3">
                                    <span className="mb-1 block text-[9px] font-bold uppercase text-slate-400">
                                      Revisão
                                    </span>
                                    <span className="text-sm font-bold text-slate-800">
                                      {formatarMoeda(
                                        tecnicoPrecoToNum(t.precos?.revisao),
                                      )}
                                    </span>
                                  </div>
                                  <div className="rounded border border-slate-200 bg-white p-3">
                                    <span className="mb-1 block text-[9px] font-bold uppercase text-slate-400">
                                      Retirada
                                    </span>
                                    <span className="text-sm font-bold text-slate-800">
                                      {formatarMoeda(
                                        tecnicoPrecoToNum(t.precos?.retirada),
                                      )}
                                    </span>
                                  </div>
                                  <div className="rounded border border-slate-200 bg-white p-3">
                                    <span className="mb-1 block text-[9px] font-bold uppercase text-slate-400">
                                      Deslocamento (km)
                                    </span>
                                    <span className="text-sm font-bold text-slate-800">
                                      {formatarMoeda(
                                        tecnicoPrecoToNum(
                                          t.precos?.deslocamento,
                                        ),
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {canEdit && (
                                <div className="mt-4">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEditModal(t);
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
              Total de {filtered.length} técnico
              {filtered.length !== 1 ? "s" : ""} localizado
              {filtered.length !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={page <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
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
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      </div>

      {/* Modal de Cadastro/Edição */}
      <Dialog open={modalOpen} onOpenChange={(o) => !o && closeModal()}>
        <DialogContent
          hideClose
          ariaTitle={editingTecnico ? "Editar Técnico" : "Novo Técnico"}
          className="max-w-[900px] h-[90vh] p-0 gap-0 flex flex-col overflow-hidden rounded-sm"
        >
          {/* Header */}
          <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <MaterialIcon name="engineering" className="text-blue-600" />
              <h2 className="text-lg font-bold text-slate-800">
                {editingTecnico ? "Editar Técnico" : "Novo Técnico"}
              </h2>
            </div>
            <button
              type="button"
              onClick={closeModal}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          {/* Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Form */}
            <form
              id="tecnico-form"
              onSubmit={form.handleSubmit(handleSubmit)}
              className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/30"
            >
              {/* Seção 01 - Dados Básicos */}
              <section>
                <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
                  <span className="text-[11px] font-black uppercase text-slate-800 tracking-widest">
                    01. Dados Básicos
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-4">
                  <div className="col-span-3">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Nome Completo
                    </label>
                    <Input
                      {...form.register("nome")}
                      placeholder="Ex: Ricardo Silva"
                      className="h-9"
                    />
                    {form.formState.errors.nome && (
                      <p className="text-xs text-red-500 mt-1">
                        {form.formState.errors.nome.message}
                      </p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      CPF / CNPJ
                    </label>
                    <Controller
                      name="cpfCnpj"
                      control={form.control}
                      render={({ field }) => (
                        <InputCPFCNPJ
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          className="h-9"
                        />
                      )}
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Status
                    </label>
                    <div className="flex items-center gap-2 h-9">
                      <Controller
                        name="ativo"
                        control={form.control}
                        render={({ field }) => (
                          <>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={field.value}
                              onClick={() => field.onChange(!field.value)}
                              className={cn(
                                "relative h-5 w-10 cursor-pointer rounded-full transition-colors flex-shrink-0",
                                field.value ? "bg-emerald-500" : "bg-slate-200",
                              )}
                            >
                              <span
                                className={cn(
                                  "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                                  field.value && "translate-x-5",
                                )}
                              />
                            </button>
                            <span
                              className={cn(
                                "text-xs font-bold whitespace-nowrap",
                                field.value
                                  ? "text-emerald-600"
                                  : "text-slate-500",
                              )}
                            >
                              {field.value ? "ATIVO" : "INATIVO"}
                            </span>
                          </>
                        )}
                      />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Telefone / WhatsApp
                    </label>
                    <Controller
                      name="telefone"
                      control={form.control}
                      render={({ field }) => (
                        <InputTelefone
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          className="h-9"
                        />
                      )}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Estado de Atuação
                    </label>
                    <Controller
                      name="estado"
                      control={form.control}
                      render={({ field }) => (
                        <SelectUF
                          ufs={ufs}
                          value={field.value || ""}
                          onChange={(v) => {
                            field.onChange(v);
                            form.setValue("cidade", "");
                          }}
                          placeholder="Pesquisar estado..."
                          className="h-9"
                        />
                      )}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Cidade de Atuação
                    </label>
                    <Controller
                      name="cidade"
                      control={form.control}
                      render={({ field }) => (
                        <SelectCidade
                          municipios={municipios}
                          value={field.value || ""}
                          onChange={field.onChange}
                          disabled={!estadoAtuacao}
                          placeholder="Pesquisar cidade..."
                          className="h-9"
                        />
                      )}
                    />
                  </div>
                </div>
              </section>

              {/* Seção 02 - Endereço */}
              <section>
                <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
                  <span className="text-[11px] font-black uppercase text-slate-800 tracking-widest">
                    02. Endereço para envio de rastreador
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      CEP
                    </label>
                    <Controller
                      name="cep"
                      control={form.control}
                      render={({ field }) => (
                        <InputCEP
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          onAddressFound={handleAddressFound}
                          className="h-9"
                        />
                      )}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Logradouro
                    </label>
                    <Input
                      {...form.register("logradouro")}
                      placeholder="Rua, Avenida..."
                      className="h-9"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Número
                    </label>
                    <Input
                      {...form.register("numero")}
                      placeholder="123"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Complemento
                    </label>
                    <Input
                      {...form.register("complemento")}
                      placeholder="Apto, Bloco..."
                      className="h-9"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Bairro
                    </label>
                    <Input
                      {...form.register("bairro")}
                      placeholder="Centro"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Cidade
                    </label>
                    <Input
                      {...form.register("cidadeEndereco")}
                      placeholder="Cidade"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Estado
                    </label>
                    <Controller
                      name="estadoEndereco"
                      control={form.control}
                      render={({ field }) => (
                        <SelectUF
                          ufs={ufs}
                          value={field.value || ""}
                          onChange={field.onChange}
                          placeholder="Pesquisar..."
                          className="h-9"
                        />
                      )}
                    />
                  </div>
                </div>
              </section>

              {/* Seção 03 - Valores */}
              <section>
                <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
                  <span className="text-[11px] font-black uppercase text-slate-800 tracking-widest">
                    03. Valores de Serviço
                  </span>
                </div>
                <div className="space-y-4">
                  <div className="bg-white p-4 border border-slate-200 rounded-sm">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-3">
                      Instalação
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">
                          Com Bloqueio
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                            R$
                          </span>
                          <Controller
                            name="instalacaoComBloqueio"
                            control={form.control}
                            render={({ field }) => (
                              <InputPreco
                                value={field.value}
                                onChange={field.onChange}
                                className="h-9 pl-9 text-right font-mono"
                              />
                            )}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">
                          Sem Bloqueio
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                            R$
                          </span>
                          <Controller
                            name="instalacaoSemBloqueio"
                            control={form.control}
                            render={({ field }) => (
                              <InputPreco
                                value={field.value}
                                onChange={field.onChange}
                                className="h-9 pl-9 text-right font-mono"
                              />
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white p-4 border border-slate-200 rounded-sm">
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">
                        Revisão
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          R$
                        </span>
                        <Controller
                          name="revisao"
                          control={form.control}
                          render={({ field }) => (
                            <InputPreco
                              value={field.value}
                              onChange={field.onChange}
                              className="h-9 pl-9 text-right font-mono"
                            />
                          )}
                        />
                      </div>
                    </div>
                    <div className="bg-white p-4 border border-slate-200 rounded-sm">
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">
                        Retirada
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          R$
                        </span>
                        <Controller
                          name="retirada"
                          control={form.control}
                          render={({ field }) => (
                            <InputPreco
                              value={field.value}
                              onChange={field.onChange}
                              className="h-9 pl-9 text-right font-mono"
                            />
                          )}
                        />
                      </div>
                    </div>
                    <div className="bg-white p-4 border border-slate-200 rounded-sm">
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">
                        Deslocamento (km)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          R$
                        </span>
                        <Controller
                          name="deslocamento"
                          control={form.control}
                          render={({ field }) => (
                            <InputPreco
                              value={field.value}
                              onChange={field.onChange}
                              className="h-9 pl-9 text-right font-mono"
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </form>

            {/* Sidebar Resumo */}
            <div className="w-64 border-l border-slate-200 bg-slate-50 p-6 shrink-0 overflow-y-auto">
              <h3 className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest">
                Resumo do Técnico
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Nome do Prestador
                  </label>
                  <p className="text-sm font-bold text-slate-800 break-words">
                    {watchedObj.nome || "—"}
                  </p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Localidade
                  </label>
                  <p className="text-sm font-bold text-slate-800">
                    {watchedObj.cidade && watchedObj.estado
                      ? `${watchedObj.cidade} / ${watchedObj.estado}`
                      : "— / —"}
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-200">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">
                    Taxas Principais
                  </label>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Instalação:</span>
                      <span className="font-bold text-slate-700">
                        {formatarMoedaDeCentavos(
                          watchedObj.instalacaoSemBloqueio ?? 0,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Revisão:</span>
                      <span className="font-bold text-slate-700">
                        {formatarMoedaDeCentavos(watchedObj.revisao ?? 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Km:</span>
                      <span className="font-bold text-slate-700">
                        {formatarMoedaDeCentavos(watchedObj.deslocamento ?? 0)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-8 p-3 bg-blue-50 border border-blue-100 rounded-sm">
                  <p className="text-[10px] text-blue-700 leading-tight">
                    Os valores informados serão utilizados para o cálculo
                    automático de ordens de serviço.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-3 shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={closeModal}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="tecnico-form"
              className="bg-erp-blue hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Salvando..." : "Salvar Técnico"}
            </Button>
          </footer>
        </DialogContent>
      </Dialog>
    </div>
  );
}
