import { useMemo, useEffect } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MaterialIcon } from "@/components/MaterialIcon";
import { SelectClienteSearch } from "@/components/SelectClienteSearch";
import { InputPreco } from "@/components/InputPreco";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { formatarMoeda, formatarMoedaDeCentavos } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type TipoAparelho = "RASTREADOR" | "SIM";

interface Cliente {
  id: number;
  nome: string;
  nomeFantasia?: string | null;
  cidade?: string | null;
  estado?: string | null;
}

interface IdValidation {
  validos: string[];
  duplicados: string[];
  invalidos: string[];
  jaExistentes: string[];
}

interface Marca {
  id: number;
  nome: string;
  ativo: boolean;
  modelos?: Modelo[];
}

interface Modelo {
  id: number;
  nome: string;
  ativo: boolean;
  marca?: Marca;
}

interface Operadora {
  id: number;
  nome: string;
  ativo: boolean;
}

interface DebitoRastreadorApi {
  id: number;
  devedorTipo: "INFINITY" | "CLIENTE";
  devedorClienteId: number | null;
  devedorCliente: { id: number; nome: string } | null;
  credorTipo: "INFINITY" | "CLIENTE";
  credorClienteId: number | null;
  credorCliente: { id: number; nome: string } | null;
  marcaId: number;
  marca: { id: number; nome: string };
  modeloId: number;
  modelo: { id: number; nome: string };
  quantidade: number;
}

function formatDebitoLabel(d: DebitoRastreadorApi): string {
  const devedor = d.devedorCliente?.nome ?? "Infinity";
  const credor = d.credorCliente?.nome ?? "Infinity";
  return `${devedor} deve ${d.quantidade}x ${d.marca.nome} ${d.modelo.nome} → ${credor}`;
}

const schema = z
  .object({
    referencia: z.preprocess(
      (val) => val ?? "",
      z.string().refine((s) => s.length >= 1, "Referência obrigatória"),
    ),
    notaFiscal: z.preprocess((val) => val ?? "", z.string().optional()),
    dataChegada: z.preprocess(
      (val) => val ?? "",
      z.string().refine((s) => s.length >= 1, "Data obrigatória"),
    ),
    proprietarioTipo: z.enum(["INFINITY", "CLIENTE"]),
    clienteId: z.number().nullable(),
    tipo: z.enum(["RASTREADOR", "SIM"]),
    marca: z.preprocess((val) => val ?? "", z.string()),
    modelo: z.preprocess((val) => val ?? "", z.string()),
    operadora: z.preprocess((val) => val ?? "", z.string()),
    marcaSimcard: z.string().optional(),
    planoSimcard: z.string().optional(),
    quantidade: z.number().min(0),
    definirIds: z.boolean(),
    idsTexto: z.string().optional(),
    valorUnitario: z.number().min(1, "Valor unitário deve ser maior que zero"),
    abaterDivida: z.boolean(),
    abaterDebitoId: z.number().nullable(),
    abaterQuantidade: z.number().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.proprietarioTipo === "CLIENTE" && !data.clienteId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecione o cliente",
        path: ["clienteId"],
      });
    }
    if (data.abaterDivida) {
      if (!data.abaterDebitoId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Selecione o débito",
          path: ["abaterDebitoId"],
        });
      }
      if (!data.abaterQuantidade || data.abaterQuantidade <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe a quantidade a abater",
          path: ["abaterQuantidade"],
        });
      }
    }
    if (data.tipo === "RASTREADOR") {
      if (!data.marca)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Marca obrigatória",
          path: ["marca"],
        });
      if (!data.modelo)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Modelo obrigatório",
          path: ["modelo"],
        });
    }
    if (data.tipo === "SIM" && !data.operadora) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Operadora obrigatória",
        path: ["operadora"],
      });
    }
    if (!data.definirIds && data.quantidade <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Quantidade obrigatória",
        path: ["quantidade"],
      });
    }
  });

type FormData = z.infer<typeof schema>;

function validateIds(
  texto: string,
  tipo: TipoAparelho,
  existentes: string[],
): IdValidation {
  const linhas = texto
    .split(/[\n,;]+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const validos: string[] = [];
  const duplicados: string[] = [];
  const invalidos: string[] = [];
  const jaExistentes: string[] = [];
  const vistos = new Set<string>();

  const tamanhoEsperado = tipo === "RASTREADOR" ? 15 : 19;

  for (const id of linhas) {
    const cleanId = id.replace(/\D/g, "");

    if (vistos.has(cleanId)) {
      duplicados.push(id);
      continue;
    }
    vistos.add(cleanId);

    if (existentes.includes(cleanId)) {
      jaExistentes.push(id);
      continue;
    }

    if (
      cleanId.length < tamanhoEsperado - 1 ||
      cleanId.length > tamanhoEsperado + 1
    ) {
      invalidos.push(id);
      continue;
    }

    validos.push(cleanId);
  }

  return { validos, duplicados, invalidos, jaExistentes };
}

const defaultValues: FormData = {
  referencia: "",
  notaFiscal: "",
  dataChegada: new Date().toISOString().split("T")[0],
  proprietarioTipo: "INFINITY",
  clienteId: null,
  tipo: "RASTREADOR",
  marca: "",
  modelo: "",
  operadora: "",
  marcaSimcard: "",
  planoSimcard: "",
  quantidade: 0,
  definirIds: true,
  idsTexto: "",
  valorUnitario: 0,
  abaterDivida: false,
  abaterDebitoId: null,
  abaterQuantidade: null,
};

export function CadastroLotePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("CONFIGURACAO.APARELHO.CRIAR");

  const form = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues,
  });

  const watchReferencia = form.watch("referencia");
  const watchTipo = form.watch("tipo");
  const watchProprietario = form.watch("proprietarioTipo");
  const watchMarca = form.watch("marca");
  const watchModelo = form.watch("modelo");
  const watchOperadora = form.watch("operadora");
  const watchClienteId = form.watch("clienteId");
  const watchMarcaSimcard = form.watch("marcaSimcard");
  const watchDefinirIds = form.watch("definirIds");
  const watchIdsTexto = form.watch("idsTexto") ?? "";
  const watchQuantidade = form.watch("quantidade");
  const watchValorUnitario = form.watch("valorUnitario");
  const watchAbaterDivida = form.watch("abaterDivida");
  const watchAbaterDebitoId = form.watch("abaterDebitoId");

  const { data: clientes = [] } = useQuery<Cliente[]>({
    queryKey: ["clientes-lista"],
    queryFn: () => api("/clientes"),
  });

  const { data: marcas = [] } = useQuery<Marca[]>({
    queryKey: ["marcas"],
    queryFn: () => api("/equipamentos/marcas"),
  });

  const { data: modelos = [] } = useQuery<Modelo[]>({
    queryKey: ["modelos"],
    queryFn: () => api("/equipamentos/modelos"),
  });

  const { data: operadoras = [] } = useQuery<Operadora[]>({
    queryKey: ["operadoras"],
    queryFn: () => api("/equipamentos/operadoras"),
  });

  const { data: marcasSimcard = [] } = useQuery<
    {
      id: number;
      nome: string;
      operadoraId: number;
      temPlanos: boolean;
      operadora: { id: number; nome: string };
      planos?: { id: number; planoMb: number; ativo: boolean }[];
    }[]
  >({
    queryKey: ["marcas-simcard", watchOperadora || "all"],
    queryFn: () =>
      watchOperadora
        ? api(`/equipamentos/marcas-simcard?operadoraId=${watchOperadora}`)
        : api("/equipamentos/marcas-simcard"),
  });

  const { data: debitosData } = useQuery<{ data: DebitoRastreadorApi[] }>({
    queryKey: ["debitos-rastreadores", "aberto"],
    queryFn: () => api("/debitos-rastreadores?status=aberto&limit=500"),
    enabled: watchTipo === "RASTREADOR",
  });

  const marcasAtivas = useMemo(() => marcas.filter((m) => m.ativo), [marcas]);
  const operadorasAtivas = useMemo(
    () => operadoras.filter((o) => o.ativo),
    [operadoras],
  );
  const marcasSimcardFiltradas = useMemo(
    () =>
      marcasSimcard.filter(
        (m) => !watchOperadora || m.operadoraId === Number(watchOperadora),
      ),
    [marcasSimcard, watchOperadora],
  );

  const { data: aparelhosExistentes = [] } = useQuery<
    { identificador: string }[]
  >({
    queryKey: ["aparelhos-ids"],
    queryFn: () => api("/aparelhos"),
    select: (data) =>
      data.filter((a: { identificador?: string }) => a.identificador),
  });

  const existingIds = useMemo(
    () =>
      aparelhosExistentes
        .map((a) => a.identificador)
        .filter(Boolean) as string[],
    [aparelhosExistentes],
  );

  const clienteSelecionado = useMemo(
    () => clientes.find((c) => c.id === watchClienteId),
    [clientes, watchClienteId],
  );

  const debitosFiltrados = useMemo(() => {
    const todos = debitosData?.data ?? [];
    return todos.filter((d) => {
      // Only show debts where the selected proprietário is the devedor
      const isDevedor =
        watchProprietario === "INFINITY"
          ? d.devedorTipo === "INFINITY"
          : watchClienteId
            ? d.devedorTipo === "CLIENTE" &&
              d.devedorClienteId === watchClienteId
            : false;
      if (!isDevedor) return false;
      // If brand/model selected, also filter by them
      if (watchMarca && watchModelo) {
        return (
          d.marcaId === Number(watchMarca) && d.modeloId === Number(watchModelo)
        );
      }
      return true;
    });
  }, [debitosData, watchProprietario, watchClienteId, watchMarca, watchModelo]);

  const selectedDebito = useMemo(
    () => debitosFiltrados.find((d) => d.id === watchAbaterDebitoId) ?? null,
    [debitosFiltrados, watchAbaterDebitoId],
  );

  useEffect(() => {
    if (debitosFiltrados.length === 0 && form.getValues("abaterDivida")) {
      form.setValue("abaterDivida", false);
      form.setValue("abaterDebitoId", null);
      form.setValue("abaterQuantidade", null);
    }
  }, [debitosFiltrados.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const idValidation = useMemo(() => {
    if (!watchDefinirIds || !watchIdsTexto.trim()) {
      return { validos: [], duplicados: [], invalidos: [], jaExistentes: [] };
    }
    return validateIds(watchIdsTexto, watchTipo, existingIds);
  }, [watchIdsTexto, watchTipo, watchDefinirIds, existingIds]);

  const modelosDisponiveis = useMemo(() => {
    if (!watchMarca) return [];
    return modelos.filter((m) => m.marca?.id === Number(watchMarca) && m.ativo);
  }, [watchMarca, modelos]);

  const valorTotal = useMemo(() => {
    const qtd =
      watchDefinirIds && idValidation.validos.length > 0
        ? idValidation.validos.length
        : watchQuantidade;
    return (watchValorUnitario / 100) * qtd;
  }, [
    watchValorUnitario,
    watchQuantidade,
    watchDefinirIds,
    idValidation.validos.length,
  ]);

  const quantidadeFinal = useMemo(
    () =>
      watchDefinirIds && idValidation.validos.length > 0
        ? idValidation.validos.length
        : watchQuantidade,
    [watchDefinirIds, idValidation.validos.length, watchQuantidade],
  );

  const erroQuantidade = useMemo(() => {
    if (!watchDefinirIds) return null;
    if (watchQuantidade > 0 && idValidation.validos.length > 0) {
      if (watchQuantidade !== idValidation.validos.length) {
        return `Quantidade informada (${watchQuantidade}) não corresponde aos IDs válidos (${idValidation.validos.length})`;
      }
    }
    return null;
  }, [watchDefinirIds, watchQuantidade, idValidation.validos.length]);

  const podeSalvar = useMemo(() => {
    if (!watchReferencia.trim()) return false;
    if (watchProprietario === "CLIENTE" && !watchClienteId) return false;
    if (watchTipo === "RASTREADOR" && (!watchMarca || !watchModelo))
      return false;
    if (watchTipo === "SIM" && !watchOperadora) return false;
    if (watchValorUnitario <= 0) return false;
    if (watchDefinirIds) {
      if (idValidation.validos.length === 0) return false;
      if (erroQuantidade) return false;
    } else {
      if (watchQuantidade <= 0) return false;
    }
    return true;
  }, [
    watchReferencia,
    watchProprietario,
    watchClienteId,
    watchTipo,
    watchMarca,
    watchModelo,
    watchOperadora,
    watchValorUnitario,
    watchDefinirIds,
    watchQuantidade,
    idValidation.validos.length,
    erroQuantidade,
  ]);

  const createLoteMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const marcaSelecionada = marcasAtivas.find(
        (m) => m.id === Number(data.marca),
      );
      const modeloSelecionado = modelosDisponiveis.find(
        (m) => m.id === Number(data.modelo),
      );
      const operadoraSelecionada = operadorasAtivas.find(
        (o) => o.id === Number(data.operadora),
      );
      const payload = {
        referencia: String(data.referencia ?? ""),
        notaFiscal: (data.notaFiscal?.trim() || null) as string | null,
        dataChegada: String(
          data.dataChegada ?? new Date().toISOString().split("T")[0],
        ),
        proprietarioTipo: data.proprietarioTipo,
        clienteId: data.clienteId,
        tipo: data.tipo,
        marca:
          data.tipo === "RASTREADOR" ? (marcaSelecionada?.nome ?? null) : null,
        modelo:
          data.tipo === "RASTREADOR" ? (modeloSelecionado?.nome ?? null) : null,
        operadora:
          data.tipo === "SIM" ? (operadoraSelecionada?.nome ?? null) : null,
        marcaSimcardId:
          data.tipo === "SIM" && data.marcaSimcard
            ? Number(data.marcaSimcard)
            : null,
        planoSimcardId:
          data.tipo === "SIM" && data.planoSimcard
            ? Number(data.planoSimcard)
            : null,
        quantidade: quantidadeFinal,
        valorUnitario: Number(data.valorUnitario) / 100,
        identificadores: data.definirIds ? idValidation.validos : [],
      };
      return api("/aparelhos/lote", {
        method: "POST",
        body: JSON.stringify({
          ...payload,
          abaterDebitoId: data.abaterDivida ? data.abaterDebitoId : undefined,
          abaterQuantidade: data.abaterDivida
            ? data.abaterQuantidade
            : undefined,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aparelhos"] });
      queryClient.invalidateQueries({ queryKey: ["debitos-rastreadores"] });
      toast.success("Lote registrado com sucesso!");
      navigate("/aparelhos");
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Erro ao registrar lote",
      );
    },
  });

  const onSubmit = (data: FormData) => {
    if (!podeSalvar) return;
    createLoteMutation.mutate(data);
  };

  return (
    <div className="-m-4 min-h-[100dvh] bg-slate-100">
      <form
        onSubmit={form.handleSubmit(onSubmit, (errors) => {
          const msg = Object.values(errors)
            .map((e) => (typeof e?.message === "string" ? e.message : null))
            .filter(Boolean)
            .join(", ");
          toast.error(msg || "Verifique os campos do formulário");
        })}
        className="contents"
      >
        <header className="sticky -top-4 z-10 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-8">
          <div className="flex items-center gap-4">
            <Link
              to="/aparelhos"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-3">
              <MaterialIcon
                name="inventory_2"
                className="text-erp-blue text-xl"
              />
              <div>
                <h1 className="text-lg font-bold text-slate-800">
                  Entrada de Rastreador/Simcard
                </h1>
                <p className="text-xs text-slate-500">
                  Cadastro em massa de lote
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex gap-6 p-6">
          <div className="flex-1 space-y-6">
            {/* Bloco 1 - Identificação do Lote */}
            <div className="bg-white border border-slate-200 rounded-sm p-6">
              <div className="flex items-center gap-2 mb-6 pb-2 border-b border-slate-100">
                <MaterialIcon name="tag" className="text-erp-blue" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Identificação do Lote
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                    Referência do Lote <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="referencia"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <>
                        <Input
                          {...field}
                          placeholder="Ex: LT-2026-001"
                          className={cn(
                            "h-9",
                            fieldState.error && "border-red-500",
                          )}
                        />
                        {fieldState.error && (
                          <p className="text-[10px] text-red-600 mt-1">
                            {fieldState.error.message}
                          </p>
                        )}
                      </>
                    )}
                  />
                </div>
                <div>
                  <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                    Nº Nota Fiscal
                  </Label>
                  <Controller
                    name="notaFiscal"
                    control={form.control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        placeholder="Ex: 123456"
                        className="h-9"
                      />
                    )}
                  />
                </div>
                <div>
                  <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                    Data de Chegada
                  </Label>
                  <Controller
                    name="dataChegada"
                    control={form.control}
                    render={({ field }) => (
                      <Input type="date" {...field} className="h-9" />
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Bloco 2 - Propriedade e Tipo */}
            <div className="bg-white border border-slate-200 rounded-sm p-6">
              <div className="flex items-center gap-2 mb-6 pb-2 border-b border-slate-100">
                <MaterialIcon name="business" className="text-erp-blue" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Propriedade e Tipo
                </h3>
              </div>
              <div className="space-y-6">
                <div className="space-y-3">
                  {watchTipo === "RASTREADOR" ? (
                    <>
                      <div>
                        <Label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">
                          Pertence a
                        </Label>
                        <Controller
                          name="proprietarioTipo"
                          control={form.control}
                          render={({ field }) => (
                            <div className="flex rounded-sm overflow-hidden">
                              <button
                                type="button"
                                onClick={() => {
                                  field.onChange("INFINITY");
                                  form.setValue("clienteId", null);
                                }}
                                className={cn(
                                  "flex-1 py-2.5 px-4 text-xs font-bold uppercase border transition-all",
                                  field.value === "INFINITY"
                                    ? "bg-slate-800 text-white border-slate-800"
                                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50",
                                )}
                              >
                                Infinity
                              </button>
                              <button
                                type="button"
                                onClick={() => field.onChange("CLIENTE")}
                                className={cn(
                                  "flex-1 py-2.5 px-4 text-xs font-bold uppercase border-t border-b border-r transition-all",
                                  field.value === "CLIENTE"
                                    ? "bg-slate-800 text-white border-slate-800"
                                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50",
                                )}
                              >
                                Cliente
                              </button>
                            </div>
                          )}
                        />
                      </div>
                      {watchProprietario === "CLIENTE" && (
                        <div>
                          <Label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">
                            Cliente <span className="text-red-500">*</span>
                          </Label>
                          <SelectClienteSearch
                            clientes={clientes}
                            value={watchClienteId ?? undefined}
                            onChange={(id) =>
                              form.setValue("clienteId", id ?? null, {
                                shouldValidate: true,
                              })
                            }
                          />
                          {form.formState.errors.clienteId && (
                            <p className="text-[10px] text-red-600 mt-1">
                              {form.formState.errors.clienteId.message}
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-sm">
                      <MaterialIcon
                        name="info"
                        className="text-slate-400 text-sm"
                      />
                      <span className="text-xs text-slate-500">
                        Simcards são sempre registrados no estoque da Infinity
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">
                    Tipo de Equipamento
                  </Label>
                  <Controller
                    name="tipo"
                    control={form.control}
                    render={({ field }) => (
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            field.onChange("RASTREADOR");
                            form.setValue("operadora", "");
                            form.setValue("marcaSimcard", "");
                            form.setValue("planoSimcard", "");
                          }}
                          className={cn(
                            "flex-1 flex flex-col items-center gap-2 p-4 border-2 rounded-sm transition-all",
                            field.value === "RASTREADOR"
                              ? "border-erp-blue bg-blue-50"
                              : "border-slate-200 bg-white hover:border-slate-300",
                          )}
                        >
                          <MaterialIcon
                            name="sensors"
                            className={cn(
                              "text-3xl",
                              field.value === "RASTREADOR"
                                ? "text-erp-blue"
                                : "text-slate-400",
                            )}
                          />
                          <span
                            className={cn(
                              "text-xs font-bold uppercase",
                              field.value === "RASTREADOR"
                                ? "text-blue-800"
                                : "text-slate-500",
                            )}
                          >
                            Rastreador
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            field.onChange("SIM");
                            form.setValue("marca", "");
                            form.setValue("modelo", "");
                            form.setValue("proprietarioTipo", "INFINITY");
                            form.setValue("clienteId", null);
                          }}
                          className={cn(
                            "flex-1 flex flex-col items-center gap-2 p-4 border-2 rounded-sm transition-all",
                            field.value === "SIM"
                              ? "border-erp-blue bg-blue-50"
                              : "border-slate-200 bg-white hover:border-slate-300",
                          )}
                        >
                          <MaterialIcon
                            name="sim_card"
                            className={cn(
                              "text-3xl",
                              field.value === "SIM"
                                ? "text-erp-blue"
                                : "text-slate-400",
                            )}
                          />
                          <span
                            className={cn(
                              "text-xs font-bold uppercase",
                              field.value === "SIM"
                                ? "text-blue-800"
                                : "text-slate-500",
                            )}
                          >
                            Simcard
                          </span>
                        </button>
                      </div>
                    )}
                  />
                </div>

                {watchTipo === "RASTREADOR" ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                        Fabricante / Marca{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Controller
                        name="marca"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <>
                            <Select
                              value={field.value}
                              onValueChange={(v) => {
                                field.onChange(v);
                                form.setValue("modelo", "");
                              }}
                            >
                              <SelectTrigger
                                className={cn(
                                  "h-9",
                                  fieldState.error && "border-red-500",
                                )}
                              >
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                              <SelectContent>
                                {marcasAtivas.map((m) => (
                                  <SelectItem key={m.id} value={String(m.id)}>
                                    {m.nome}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {fieldState.error && (
                              <p className="text-[10px] text-red-600 mt-1">
                                {fieldState.error.message}
                              </p>
                            )}
                          </>
                        )}
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                        Modelo <span className="text-red-500">*</span>
                      </Label>
                      <Controller
                        name="modelo"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={!watchMarca}
                            >
                              <SelectTrigger
                                className={cn(
                                  "h-9",
                                  fieldState.error && "border-red-500",
                                )}
                              >
                                <SelectValue
                                  placeholder={
                                    watchMarca
                                      ? "Selecione..."
                                      : "Selecione o fabricante primeiro..."
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {modelosDisponiveis.map((m) => (
                                  <SelectItem key={m.id} value={String(m.id)}>
                                    {m.nome}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {fieldState.error && (
                              <p className="text-[10px] text-red-600 mt-1">
                                {fieldState.error.message}
                              </p>
                            )}
                          </>
                        )}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                        Operadora <span className="text-red-500">*</span>
                      </Label>
                      <Controller
                        name="operadora"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <>
                            <Select
                              value={field.value}
                              onValueChange={(v) => {
                                field.onChange(v);
                                form.setValue("marcaSimcard", "");
                              }}
                            >
                              <SelectTrigger
                                className={cn(
                                  "h-9",
                                  fieldState.error && "border-red-500",
                                )}
                              >
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                              <SelectContent>
                                {operadorasAtivas.map((o) => (
                                  <SelectItem key={o.id} value={String(o.id)}>
                                    {o.nome}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {fieldState.error && (
                              <p className="text-[10px] text-red-600 mt-1">
                                {fieldState.error.message}
                              </p>
                            )}
                          </>
                        )}
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                        Marca do Simcard
                      </Label>
                      <Controller
                        name="marcaSimcard"
                        control={form.control}
                        render={({ field }) => (
                          <Select
                            value={field.value ?? ""}
                            onValueChange={(v) => {
                              field.onChange(v);
                              form.setValue("planoSimcard", "");
                            }}
                            disabled={!watchOperadora}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue
                                placeholder={
                                  watchOperadora
                                    ? "Ex: Getrak, 1nce..."
                                    : "Selecione operadora"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {marcasSimcardFiltradas.map((m) => (
                                <SelectItem key={m.id} value={String(m.id)}>
                                  {m.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    {watchMarcaSimcard &&
                      (() => {
                        const marcaSel = marcasSimcardFiltradas.find(
                          (m) => String(m.id) === watchMarcaSimcard,
                        );
                        const planos = (marcaSel?.planos ?? []).filter(
                          (p) => p.ativo,
                        );
                        return marcaSel?.temPlanos && planos.length > 0 ? (
                          <div>
                            <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                              Plano
                            </Label>
                            <Controller
                              name="planoSimcard"
                              control={form.control}
                              render={({ field }) => (
                                <Select
                                  value={field.value ?? ""}
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Selecione o plano..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {planos.map((p) => (
                                      <SelectItem
                                        key={p.id}
                                        value={String(p.id)}
                                      >
                                        {p.planoMb} MB
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </div>
                        ) : null;
                      })()}
                  </div>
                )}
              </div>
            </div>

            {/* Bloco 3 - Identificadores */}
            <div className="bg-white border border-slate-200 rounded-sm p-6">
              <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <MaterialIcon
                    name="barcode_reader"
                    className="text-erp-blue"
                  />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Identificadores (
                    {watchTipo === "RASTREADOR" ? "IMEI" : "ICCID"})
                  </h3>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-sm border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Definir IDs agora?
                  </span>
                  <Controller
                    name="definirIds"
                    control={form.control}
                    render={({ field }) => (
                      <button
                        type="button"
                        onClick={() => field.onChange(!field.value)}
                        className={cn(
                          "w-10 h-5 rounded-full relative transition-colors",
                          field.value ? "bg-erp-blue" : "bg-slate-300",
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                            field.value ? "right-1" : "left-1",
                          )}
                        />
                      </button>
                    )}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="w-1/3">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                    Quantidade <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="quantidade"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <>
                        <Input
                          type="number"
                          min={0}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value, 10) || 0)
                          }
                          placeholder="0"
                          className={cn(
                            "h-9",
                            fieldState.error && "border-red-500",
                          )}
                        />
                        {fieldState.error && (
                          <p className="text-[10px] text-red-600 mt-1">
                            {fieldState.error.message}
                          </p>
                        )}
                      </>
                    )}
                  />
                </div>

                {watchDefinirIds && (
                  <>
                    <div>
                      <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                        Colar IDs (Um por linha ou separados por vírgula)
                      </Label>
                      <Controller
                        name="idsTexto"
                        control={form.control}
                        render={({ field }) => (
                          <textarea
                            {...field}
                            value={field.value ?? ""}
                            placeholder={`Cole os ${watchTipo === "RASTREADOR" ? "IMEIs" : "ICCIDs"} aqui...`}
                            className="w-full h-48 p-4 bg-slate-50 border border-slate-300 rounded-sm font-mono text-sm focus:bg-white focus:ring-2 focus:ring-erp-blue focus:border-erp-blue transition-all resize-none"
                          />
                        )}
                      />
                    </div>

                    {watchIdsTexto.trim() && (
                      <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-sm border border-dashed border-slate-300">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-[11px] font-bold text-slate-600 uppercase">
                            <span className="text-slate-900">
                              {idValidation.validos.length}
                            </span>{" "}
                            Válidos
                          </span>
                        </div>
                        {idValidation.duplicados.length > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                            <span className="text-[11px] font-bold text-slate-600 uppercase">
                              <span className="text-slate-900">
                                {idValidation.duplicados.length}
                              </span>{" "}
                              Duplicados
                            </span>
                          </div>
                        )}
                        {idValidation.invalidos.length > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            <span className="text-[11px] font-bold text-slate-600 uppercase">
                              <span className="text-slate-900">
                                {idValidation.invalidos.length}
                              </span>{" "}
                              Inválidos
                            </span>
                          </div>
                        )}
                        {idValidation.jaExistentes.length > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                            <span className="text-[11px] font-bold text-slate-600 uppercase">
                              <span className="text-slate-900">
                                {idValidation.jaExistentes.length}
                              </span>{" "}
                              Já cadastrados
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {erroQuantidade && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-sm text-red-700">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span className="text-xs font-medium">
                          {erroQuantidade}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Bloco 4 - Valores */}
            <div className="bg-white border border-slate-200 rounded-sm p-6">
              <div className="flex items-center gap-2 mb-6 pb-2 border-b border-slate-100">
                <MaterialIcon name="payments" className="text-erp-blue" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Valores Financeiros
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                    Valor Unitário (R$) <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="valorUnitario"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
                          R$
                        </span>
                        <InputPreco
                          value={field.value}
                          onChange={field.onChange}
                          className={cn(
                            "h-9 pl-10 text-right font-mono",
                            fieldState.error && "border-red-500",
                          )}
                        />
                        {fieldState.error && (
                          <p className="text-[10px] text-red-600 mt-1">
                            {fieldState.error.message}
                          </p>
                        )}
                      </div>
                    )}
                  />
                </div>
                <div>
                  <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                    Valor Total do Lote
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-500">
                      R$
                    </span>
                    <Input
                      readOnly
                      value={formatarMoeda(valorTotal).replace("R$", "").trim()}
                      className="h-9 pl-10 text-right font-mono bg-slate-50 border-slate-200 font-bold text-slate-800"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 italic">
                    Calculado automaticamente (Unitário x Qtd)
                  </p>
                </div>
              </div>
            </div>

            {/* Bloco 5 - Abater Dívida */}
            {watchTipo === "RASTREADOR" && debitosFiltrados.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-sm p-6">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <MaterialIcon
                      name="account_balance_wallet"
                      className="text-amber-600"
                    />
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                        Abater Dívida
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Parte deste lote como pagamento de débito existente
                      </p>
                    </div>
                  </div>
                  <Controller
                    name="abaterDivida"
                    control={form.control}
                    render={({ field }) => (
                      <button
                        type="button"
                        onClick={() => {
                          field.onChange(!field.value);
                          if (field.value) {
                            form.setValue("abaterDebitoId", null);
                            form.setValue("abaterQuantidade", null);
                          }
                        }}
                        className={cn(
                          "w-10 h-5 rounded-full relative transition-colors",
                          field.value ? "bg-amber-500" : "bg-slate-300",
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                            field.value ? "right-1" : "left-1",
                          )}
                        />
                      </button>
                    )}
                  />
                </div>

                {watchAbaterDivida && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                        Débito a Abater <span className="text-red-500">*</span>
                      </Label>
                      <Controller
                        name="abaterDebitoId"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <>
                            <Select
                              value={field.value ? String(field.value) : ""}
                              onValueChange={(v) => {
                                field.onChange(Number(v));
                                form.setValue("abaterQuantidade", null);
                              }}
                            >
                              <SelectTrigger
                                className={cn(
                                  "h-9",
                                  fieldState.error && "border-red-500",
                                )}
                              >
                                <SelectValue placeholder="Selecione o débito..." />
                              </SelectTrigger>
                              <SelectContent>
                                {debitosFiltrados.map((d) => (
                                  <SelectItem key={d.id} value={String(d.id)}>
                                    {formatDebitoLabel(d)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {fieldState.error && (
                              <p className="text-[10px] text-red-600 mt-1">
                                {fieldState.error.message}
                              </p>
                            )}
                          </>
                        )}
                      />
                    </div>

                    {watchAbaterDebitoId && selectedDebito && (
                      <div>
                        <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                          Quantidade a Abater{" "}
                          <span className="text-slate-400 normal-case font-normal">
                            (máx:{" "}
                            {Math.min(
                              selectedDebito.quantidade,
                              quantidadeFinal || 9999,
                            )}
                            )
                          </span>{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Controller
                          name="abaterQuantidade"
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <>
                              <Input
                                type="number"
                                min={1}
                                max={Math.min(
                                  selectedDebito.quantidade,
                                  quantidadeFinal || 9999,
                                )}
                                value={field.value ?? ""}
                                onChange={(e) => {
                                  const v = parseInt(e.target.value, 10);
                                  field.onChange(isNaN(v) ? null : v);
                                }}
                                placeholder="0"
                                className={cn(
                                  "h-9 w-40",
                                  fieldState.error && "border-red-500",
                                )}
                              />
                              {fieldState.error && (
                                <p className="text-[10px] text-red-600 mt-1">
                                  {fieldState.error.message}
                                </p>
                              )}
                              {field.value && field.value > 0 && (
                                <p className="text-[10px] text-amber-700 mt-1.5 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                                  {field.value} unidade(s) serão vinculadas ao
                                  credor:{" "}
                                  <strong>
                                    {selectedDebito.credorCliente?.nome ??
                                      "Infinity"}
                                  </strong>
                                </p>
                              )}
                            </>
                          )}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="w-80 shrink-0 sticky top-[calc(50vh-300px)] h-fit">
            <div className="bg-slate-800 text-white rounded-lg overflow-hidden shadow-xl">
              <div className="px-6 py-4 bg-slate-900 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest">
                  Resumo do Lote
                </h3>
                <MaterialIcon name="info" className="text-slate-500" />
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                      Referência
                    </label>
                    <p className="text-lg font-bold">
                      {watchReferencia || "—"}
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                      Nota Fiscal
                    </label>
                    <p className="text-lg font-bold">
                      {form.getValues("notaFiscal") || "—"}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                      Tipo
                    </label>
                    <p className="text-sm font-medium">
                      {watchTipo === "RASTREADOR"
                        ? "📡 Rastreador"
                        : "📶 Simcard"}
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                      Proprietário
                    </label>
                    <p className="text-sm font-medium">
                      {clienteSelecionado?.nome ?? "—"}
                    </p>
                  </div>
                </div>
                {watchTipo === "RASTREADOR" ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                        Marca
                      </label>
                      <p className="text-sm font-medium">
                        {marcasAtivas.find((m) => m.id === Number(watchMarca))
                          ?.nome || "—"}
                      </p>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                        Modelo
                      </label>
                      <p className="text-sm font-medium">
                        {modelosDisponiveis.find(
                          (m) => m.id === Number(watchModelo),
                        )?.nome || "—"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                      Operadora
                    </label>
                    <p className="text-sm font-medium">
                      {operadorasAtivas.find(
                        (o) => o.id === Number(watchOperadora),
                      )?.nome || "—"}
                    </p>
                  </div>
                )}
                <div className="pt-4 border-t border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Qtd. Itens
                    </label>
                    <span className="text-sm font-bold">
                      {quantidadeFinal} Unidades
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Valor Unitário
                    </label>
                    <span className="text-sm font-medium">
                      {formatarMoedaDeCentavos(watchValorUnitario)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Valor Total
                    </label>
                    <span className="text-xl font-bold text-blue-400">
                      {formatarMoeda(valorTotal)}
                    </span>
                  </div>
                </div>
                {watchDefinirIds && idValidation.validos.length > 0 && (
                  <div className="pt-4 border-t border-slate-700">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                      IDs Válidos
                    </label>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm font-bold text-emerald-400">
                        {idValidation.validos.length} identificadores
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 bg-slate-700/30">
                <div className="flex items-start gap-3">
                  <MaterialIcon
                    name="warning"
                    className="text-yellow-500 text-lg shrink-0"
                  />
                  <p className="text-[10px] text-slate-300 leading-relaxed uppercase">
                    Confira os dados antes de registrar o lote.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky -bottom-4 z-10 h-20 border-t border-slate-200 px-6 flex items-center justify-end gap-4 bg-white">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate("/aparelhos")}
            className="h-11 px-6 text-[11px] font-bold text-slate-500 uppercase"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!canCreate || !podeSalvar || createLoteMutation.isPending}
            className="h-11 px-8 bg-erp-blue hover:bg-blue-700 text-white text-[11px] font-bold uppercase gap-2"
          >
            {createLoteMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Registrar Lote
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
