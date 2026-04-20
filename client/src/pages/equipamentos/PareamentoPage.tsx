import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import {
  Loader2,
  ArrowLeft,
  Link2,
  Router,
  Smartphone,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { MaterialIcon } from "@/components/MaterialIcon";
import { api } from "@/lib/api";
import {
  PreviewPareamentoTable,
  TRACKER_STATUS_LABELS,
  type PreviewResult,
} from "./PreviewPareamentoTable";
import { SelectClienteSearch } from "@/components/SelectClienteSearch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ModoPareamento = "individual" | "massa" | "csv";
type ProprietarioTipo = "INFINITY" | "CLIENTE";

function parseIds(text: string): string[] {
  if (!text?.trim()) return [];
  return text
    .split(/[,;\n\r]+/)
    .map((s) =>
      s
        .replace(/\s+/g, "")
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        .trim(),
    )
    .filter(Boolean);
}

export function PareamentoPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const modoParam = searchParams.get("modo") as ModoPareamento | null;
  const [modo, setModo] = useState<ModoPareamento>(
    modoParam && ["individual", "massa", "csv"].includes(modoParam)
      ? modoParam
      : "individual",
  );

  useEffect(() => {
    if (modoParam && ["individual", "massa", "csv"].includes(modoParam)) {
      setModo(modoParam as ModoPareamento);
    }
  }, [modoParam]);

  // Individual
  const [imeiIndividual, setImeiIndividual] = useState("");
  const [iccidIndividual, setIccidIndividual] = useState("");
  const [pertenceLoteRastreador, setPertenceLoteRastreador] = useState(false);
  const [pertenceLoteSim, setPertenceLoteSim] = useState(false);
  const [marcaRastreador, setMarcaRastreador] = useState("");
  const [modeloRastreador, setModeloRastreador] = useState("");
  const [operadoraSim, setOperadoraSim] = useState("");
  const [marcaSimcardIdSim, setMarcaSimcardIdSim] = useState("");
  const [planoSimcardIdSim, setPlanoSimcardIdSim] = useState("");
  const [proprietarioIndividual, setProprietarioIndividual] =
    useState<ProprietarioTipo>("INFINITY");
  const [clienteIdIndividual, setClienteIdIndividual] = useState<number | null>(
    null,
  );
  const [quantidadeCriada, setQuantidadeCriada] = useState(0);

  // Massa
  const [textImeis, setTextImeis] = useState("");
  const [textIccids, setTextIccids] = useState("");
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [loteRastreadorId, setLoteRastreadorId] = useState<string>("");
  const [loteSimId, setLoteSimId] = useState<string>("");
  const [pertenceLoteRastreadorMassa, setPertenceLoteRastreadorMassa] =
    useState(true);
  const [pertenceLoteSimMassa, setPertenceLoteSimMassa] = useState(true);
  const [marcaRastreadorMassa, setMarcaRastreadorMassa] = useState("");
  const [modeloRastreadorMassa, setModeloRastreadorMassa] = useState("");
  const [operadoraSimMassa, setOperadoraSimMassa] = useState("");
  const [marcaSimcardIdSimMassa, setMarcaSimcardIdSimMassa] = useState("");
  const [planoSimcardIdSimMassa, setPlanoSimcardIdSimMassa] = useState("");
  const [loteBuscaRastreador, setLoteBuscaRastreador] = useState("");
  const [loteBuscaSim, setLoteBuscaSim] = useState("");
  const [proprietarioMassa, setProprietarioMassa] =
    useState<ProprietarioTipo>("INFINITY");
  const [clienteIdMassa, setClienteIdMassa] = useState<number | null>(null);
  const [criarNovoRastreador, setCriarNovoRastreador] = useState(false);
  const [criarNovoSim, setCriarNovoSim] = useState(false);
  const [criarNovoRastreadorMassa, setCriarNovoRastreadorMassa] =
    useState(false);
  const [criarNovoSimMassa, setCriarNovoSimMassa] = useState(false);

  const imeis = useMemo(() => parseIds(textImeis), [textImeis]);
  const iccids = useMemo(() => parseIds(textIccids), [textIccids]);

  const quantidadeBate = imeis.length === iccids.length;
  const paresMassa = useMemo(() => {
    if (!quantidadeBate || imeis.length === 0) return [];
    return imeis.map((imei, i) => ({ imei, iccid: iccids[i] ?? "" }));
  }, [imeis, iccids, quantidadeBate]);

  const { data: lotesRastreadores = [] } = useQuery<
    {
      id: number;
      referencia: string;
      quantidadeDisponivelSemId: number;
      modelo: string | null;
      marca: string | null;
      operadora: string | null;
      marcaSimcardId: number | null;
    }[]
  >({
    queryKey: ["lotes-rastreadores"],
    queryFn: () => api("/aparelhos/pareamento/lotes-rastreadores"),
    enabled: modo === "massa" || modo === "individual",
  });

  const { data: lotesSims = [] } = useQuery<
    {
      id: number;
      referencia: string;
      quantidadeDisponivelSemId: number;
      modelo: string | null;
      marca: string | null;
      operadora: string | null;
      marcaSimcardId: number | null;
    }[]
  >({
    queryKey: ["lotes-sims"],
    queryFn: () => api("/aparelhos/pareamento/lotes-sims"),
    enabled: modo === "massa" || modo === "individual",
  });

  const { data: marcas = [] } = useQuery<
    { id: number; nome: string; ativo: boolean }[]
  >({
    queryKey: ["marcas"],
    queryFn: () => api("/equipamentos/marcas"),
    enabled: modo === "individual" || modo === "massa",
  });
  const { data: modelos = [] } = useQuery<
    {
      id: number;
      nome: string;
      marca: { id: number };
      minCaracteresImei?: number | null;
    }[]
  >({
    queryKey: ["modelos"],
    queryFn: () => api("/equipamentos/modelos"),
    enabled: modo === "individual" || modo === "massa",
  });
  const { data: operadoras = [] } = useQuery<
    { id: number; nome: string; ativo: boolean }[]
  >({
    queryKey: ["operadoras"],
    queryFn: () => api("/equipamentos/operadoras"),
    enabled: modo === "individual" || modo === "massa",
  });
  const { data: marcasSimcard = [] } = useQuery<
    {
      id: number;
      nome: string;
      operadoraId: number;
      temPlanos: boolean;
      minCaracteresIccid?: number | null;
      operadora: { id: number; nome: string };
      planos?: { id: number; planoMb: number; ativo: boolean }[];
    }[]
  >({
    queryKey: ["marcas-simcard"],
    queryFn: () => api("/equipamentos/marcas-simcard"),
    enabled: modo === "individual" || modo === "massa",
  });

  const { data: clientes = [] } = useQuery<
    {
      id: number;
      nome: string;
      cidade?: string | null;
      estado?: string | null;
    }[]
  >({
    queryKey: ["clientes-lista"],
    queryFn: () => api("/clientes"),
    enabled:
      proprietarioIndividual === "CLIENTE" || proprietarioMassa === "CLIENTE",
  });

  const lotesRastreadoresFiltrados = useMemo(() => {
    const s = loteBuscaRastreador.trim().toLowerCase();
    if (!s) return lotesRastreadores;
    return lotesRastreadores.filter((l) => {
      const info = [l.marca, l.modelo].filter(Boolean).join(" / ");
      return (
        l.referencia.toLowerCase().includes(s) || info.toLowerCase().includes(s)
      );
    });
  }, [lotesRastreadores, loteBuscaRastreador]);

  const lotesSimsFiltrados = useMemo(() => {
    const s = loteBuscaSim.trim().toLowerCase();
    if (!s) return lotesSims;
    return lotesSims.filter((l) => {
      const marcaNome =
        marcasSimcard.find((m) => m.id === l.marcaSimcardId)?.nome ?? null;
      const info = [l.operadora, marcaNome].filter(Boolean).join(" / ");
      return (
        l.referencia.toLowerCase().includes(s) || info.toLowerCase().includes(s)
      );
    });
  }, [lotesSims, loteBuscaSim, marcasSimcard]);

  const marcasAtivas = useMemo(() => marcas.filter((m) => m.ativo), [marcas]);
  const operadorasAtivas = useMemo(
    () => operadoras.filter((o) => o.ativo),
    [operadoras],
  );
  const modelosPorMarca = useMemo(() => {
    if (!marcaRastreador) return [];
    const marcaEncontrada = marcasAtivas.find(
      (m) => m.nome === marcaRastreador,
    );
    if (!marcaEncontrada) return [];
    return modelos.filter((m) => m.marca.id === marcaEncontrada.id);
  }, [marcaRastreador, marcasAtivas, modelos]);

  const modelosPorMarcaMassa = useMemo(() => {
    if (!marcaRastreadorMassa) return [];
    const marcaEncontrada = marcasAtivas.find(
      (m) => m.nome === marcaRastreadorMassa,
    );
    if (!marcaEncontrada) return [];
    return modelos.filter((m) => m.marca.id === marcaEncontrada.id);
  }, [marcaRastreadorMassa, marcasAtivas, modelos]);

  const marcasSimcardPorOperadora = useMemo(() => {
    const opId = operadorasAtivas.find((o) => o.nome === operadoraSim)?.id;
    if (!opId) return [];
    return marcasSimcard.filter((m) => m.operadoraId === opId);
  }, [marcasSimcard, operadoraSim, operadorasAtivas]);

  const marcasSimcardPorOperadoraMassa = useMemo(() => {
    const opId = operadorasAtivas.find((o) => o.nome === operadoraSimMassa)?.id;
    if (!opId) return [];
    return marcasSimcard.filter((m) => m.operadoraId === opId);
  }, [marcasSimcard, operadoraSimMassa, operadorasAtivas]);

  const minImeiIndividual = useMemo(() => {
    if (pertenceLoteRastreador) return 0;
    const modelo = modelosPorMarca.find((m) => m.nome === modeloRastreador);
    return modelo?.minCaracteresImei ?? 0;
  }, [pertenceLoteRastreador, modeloRastreador, modelosPorMarca]);

  const minIccidIndividual = useMemo(() => {
    if (pertenceLoteSim) return 0;
    const marca = marcasSimcard.find((m) => String(m.id) === marcaSimcardIdSim);
    return marca?.minCaracteresIccid ?? 0;
  }, [pertenceLoteSim, marcaSimcardIdSim, marcasSimcard]);

  const minImeiMassa = useMemo(() => {
    if (pertenceLoteRastreadorMassa) return 0;
    const modelo = modelosPorMarcaMassa.find(
      (m) => m.nome === modeloRastreadorMassa,
    );
    return modelo?.minCaracteresImei ?? 0;
  }, [
    pertenceLoteRastreadorMassa,
    modeloRastreadorMassa,
    modelosPorMarcaMassa,
  ]);

  const minIccidMassa = useMemo(() => {
    if (pertenceLoteSimMassa) return 0;
    const marca = marcasSimcard.find(
      (m) => String(m.id) === marcaSimcardIdSimMassa,
    );
    return marca?.minCaracteresIccid ?? 0;
  }, [pertenceLoteSimMassa, marcaSimcardIdSimMassa, marcasSimcard]);

  const paresIndividual = useMemo(() => {
    const imei = imeiIndividual.replace(/\D/g, "");
    const iccid = iccidIndividual.replace(/\D/g, "");
    if (imei.length < 1 || iccid.length < 1) return [];
    if (minImeiIndividual > 0 && imei.length < minImeiIndividual) return [];
    if (minIccidIndividual > 0 && iccid.length < minIccidIndividual) return [];
    return [{ imei: imeiIndividual.trim(), iccid: iccidIndividual.trim() }];
  }, [imeiIndividual, iccidIndividual, minImeiIndividual, minIccidIndividual]);

  const fetchPreview = useCallback(async () => {
    const pares = modo === "individual" ? paresIndividual : paresMassa;
    if (pares.length === 0) return null;
    const res = await api<PreviewResult>("/aparelhos/pareamento/preview", {
      method: "POST",
      body: JSON.stringify({ pares }),
    });
    return res;
  }, [modo, paresIndividual, paresMassa]);

  const previewMutation = useMutation({
    mutationFn: fetchPreview,
    onSuccess: (data) => setPreview(data ?? null),
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao gerar preview"),
  });

  const pareamentoMutation = useMutation({
    mutationFn: async () => {
      const paresParaEnviar =
        modo === "individual"
          ? paresIndividual
          : (preview?.linhas
              .filter(
                (l) =>
                  l.action_needed === "OK" ||
                  l.action_needed === "SELECT_TRACKER_LOT" ||
                  l.action_needed === "SELECT_SIM_LOT",
              )
              .map((l) => ({ imei: l.imei, iccid: l.iccid })) ?? []);

      const proprietario =
        modo === "individual" ? proprietarioIndividual : proprietarioMassa;
      const clienteId =
        modo === "individual" ? clienteIdIndividual : clienteIdMassa;

      return api<{ criados: number }>("/aparelhos/pareamento", {
        method: "POST",
        body: JSON.stringify({
          pares: paresParaEnviar,
          loteRastreadorId:
            modo === "individual" &&
            criarNovoRastreador &&
            pertenceLoteRastreador &&
            loteRastreadorId
              ? +loteRastreadorId
              : modo === "massa" &&
                  criarNovoRastreadorMassa &&
                  pertenceLoteRastreadorMassa &&
                  loteRastreadorId
                ? +loteRastreadorId
                : undefined,
          loteSimId:
            modo === "individual" &&
            criarNovoSim &&
            pertenceLoteSim &&
            loteSimId
              ? +loteSimId
              : modo === "massa" &&
                  criarNovoSimMassa &&
                  pertenceLoteSimMassa &&
                  loteSimId
                ? +loteSimId
                : undefined,
          rastreadorManual:
            modo === "individual" &&
            criarNovoRastreador &&
            !pertenceLoteRastreador &&
            marcaRastreador &&
            modeloRastreador
              ? { marca: marcaRastreador, modelo: modeloRastreador }
              : modo === "massa" &&
                  criarNovoRastreadorMassa &&
                  !pertenceLoteRastreadorMassa &&
                  marcaRastreadorMassa &&
                  modeloRastreadorMassa
                ? { marca: marcaRastreadorMassa, modelo: modeloRastreadorMassa }
                : undefined,
          simManual:
            modo === "individual" &&
            criarNovoSim &&
            !pertenceLoteSim &&
            (marcaSimcardIdSim || operadoraSim)
              ? marcaSimcardIdSim
                ? {
                    marcaSimcardId: +marcaSimcardIdSim,
                    planoSimcardId: planoSimcardIdSim
                      ? +planoSimcardIdSim
                      : undefined,
                  }
                : { operadora: operadoraSim }
              : modo === "massa" &&
                  criarNovoSimMassa &&
                  !pertenceLoteSimMassa &&
                  (marcaSimcardIdSimMassa || operadoraSimMassa)
                ? marcaSimcardIdSimMassa
                  ? {
                      marcaSimcardId: +marcaSimcardIdSimMassa,
                      planoSimcardId: planoSimcardIdSimMassa
                        ? +planoSimcardIdSimMassa
                        : undefined,
                    }
                  : { operadora: operadoraSimMassa }
                : undefined,
          proprietario,
          clienteId: clienteId ?? undefined,
        }),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["aparelhos"] });
      setQuantidadeCriada((prev) => prev + (data?.criados ?? 0));
      toast.success(
        `${data?.criados ?? 0} equipamento(s) criado(s) com sucesso!`,
      );
      if (modo === "individual") {
        setImeiIndividual("");
        setIccidIndividual("");
        setCriarNovoRastreador(false);
        setCriarNovoSim(false);
        setPertenceLoteRastreador(false);
        setPertenceLoteSim(false);
        setMarcaRastreador("");
        setModeloRastreador("");
        setOperadoraSim("");
        setMarcaSimcardIdSim("");
        setPlanoSimcardIdSim("");
        setLoteRastreadorId("");
        setLoteSimId("");
        setProprietarioIndividual("INFINITY");
        setClienteIdIndividual(null);
      } else {
        setPreview(null);
        setTextImeis("");
        setTextIccids("");
        setCriarNovoRastreadorMassa(false);
        setCriarNovoSimMassa(false);
        setLoteRastreadorId("");
        setLoteSimId("");
        setPertenceLoteRastreadorMassa(true);
        setPertenceLoteSimMassa(true);
        setMarcaRastreadorMassa("");
        setModeloRastreadorMassa("");
        setOperadoraSimMassa("");
        setMarcaSimcardIdSimMassa("");
        setPlanoSimcardIdSimMassa("");
        setProprietarioMassa("INFINITY");
        setClienteIdMassa(null);
      }
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Erro ao criar equipamentos",
      ),
  });

  const podeConfirmarIndividual = useMemo(() => {
    const imei = imeiIndividual.replace(/\D/g, "");
    const iccid = iccidIndividual.replace(/\D/g, "");
    if (imei.length < 1 || iccid.length < 1) return false;
    if (minImeiIndividual > 0 && imei.length < minImeiIndividual) return false;
    if (minIccidIndividual > 0 && iccid.length < minIccidIndividual)
      return false;
    return true;
  }, [imeiIndividual, iccidIndividual, minImeiIndividual, minIccidIndividual]);

  const loteRastreadorSelecionado = useMemo(
    () =>
      criarNovoRastreador &&
      pertenceLoteRastreador &&
      loteRastreadorId &&
      loteRastreadorId !== "_" &&
      !isNaN(Number(loteRastreadorId)),
    [criarNovoRastreador, pertenceLoteRastreador, loteRastreadorId],
  );
  const loteSimSelecionado = useMemo(
    () =>
      criarNovoSim &&
      pertenceLoteSim &&
      loteSimId &&
      loteSimId !== "_" &&
      !isNaN(Number(loteSimId)),
    [criarNovoSim, pertenceLoteSim, loteSimId],
  );

  const progressoVinculoIndividual = useMemo(() => {
    const imei = imeiIndividual.replace(/\D/g, "");
    const iccid = iccidIndividual.replace(/\D/g, "");
    const imeiOk =
      imei.length >= 1 &&
      (minImeiIndividual === 0 || imei.length >= minImeiIndividual);
    const iccidOk =
      iccid.length >= 1 &&
      (minIccidIndividual === 0 || iccid.length >= minIccidIndividual);
    const rastreadorOk = criarNovoRastreador
      ? pertenceLoteRastreador
        ? !!loteRastreadorSelecionado
        : !!(marcaRastreador && modeloRastreador)
      : true;
    const simOk = criarNovoSim
      ? pertenceLoteSim
        ? !!loteSimSelecionado
        : !!(marcaSimcardIdSim || operadoraSim)
      : true;
    const itensCompletos =
      (imeiOk ? 1 : 0) +
      (iccidOk ? 1 : 0) +
      (rastreadorOk ? 1 : 0) +
      (simOk ? 1 : 0);
    return (itensCompletos / 4) * 100;
  }, [
    imeiIndividual,
    iccidIndividual,
    minImeiIndividual,
    minIccidIndividual,
    criarNovoRastreador,
    criarNovoSim,
    pertenceLoteRastreador,
    pertenceLoteSim,
    loteRastreadorSelecionado,
    loteSimSelecionado,
    marcaRastreador,
    modeloRastreador,
    marcaSimcardIdSim,
    operadoraSim,
  ]);

  const podeConfirmarPareamentoIndividual = useMemo(() => {
    if (!podeConfirmarIndividual || !preview) return false;
    if (preview.contadores.validos > 0) return true;
    if (preview.contadores.exigemLote > 0) {
      const needTracker = preview.linhas.some(
        (l) => l.tracker_status === "NEEDS_CREATE",
      );
      const needSim = preview.linhas.some(
        (l) => l.sim_status === "NEEDS_CREATE",
      );
      if (needTracker) {
        if (!criarNovoRastreador) return false;
        const temLote = pertenceLoteRastreador && loteRastreadorId;
        const temManual =
          !pertenceLoteRastreador && marcaRastreador && modeloRastreador;
        if (!temLote && !temManual) return false;
      }
      if (needSim) {
        if (!criarNovoSim) return false;
        const temLote = pertenceLoteSim && loteSimId;
        const temManual =
          !pertenceLoteSim && (marcaSimcardIdSim || operadoraSim);
        if (!temLote && !temManual) return false;
      }
      return true;
    }
    return false;
  }, [
    podeConfirmarIndividual,
    preview,
    criarNovoRastreador,
    criarNovoSim,
    loteRastreadorId,
    loteSimId,
    pertenceLoteRastreador,
    pertenceLoteSim,
    marcaRastreador,
    modeloRastreador,
    marcaSimcardIdSim,
    operadoraSim,
  ]);

  const podeConfirmarMassa = useMemo(() => {
    if (!quantidadeBate || paresMassa.length === 0) return false;
    if (!preview) return false;
    const validos = preview.contadores.validos;
    const exigemLote = preview.contadores.exigemLote;
    const temErros = preview.contadores.erros > 0;
    if (temErros && validos === 0 && exigemLote === 0) return false;
    if (exigemLote > 0) {
      const needTracker = preview.linhas.some(
        (l) => l.tracker_status === "NEEDS_CREATE",
      );
      const needSim = preview.linhas.some(
        (l) => l.sim_status === "NEEDS_CREATE",
      );
      if (needTracker) {
        if (!criarNovoRastreadorMassa) return false;
        const temLote = pertenceLoteRastreadorMassa && loteRastreadorId;
        const temManual =
          !pertenceLoteRastreadorMassa &&
          marcaRastreadorMassa &&
          modeloRastreadorMassa;
        if (!temLote && !temManual) return false;
      }
      if (needSim) {
        if (!criarNovoSimMassa) return false;
        const temLote = pertenceLoteSimMassa && loteSimId;
        const temManual =
          !pertenceLoteSimMassa &&
          (marcaSimcardIdSimMassa || operadoraSimMassa);
        if (!temLote && !temManual) return false;
      }
    }
    return validos > 0 || exigemLote > 0;
  }, [
    quantidadeBate,
    paresMassa,
    preview,
    criarNovoRastreadorMassa,
    criarNovoSimMassa,
    loteRastreadorId,
    loteSimId,
    pertenceLoteRastreadorMassa,
    pertenceLoteSimMassa,
    marcaRastreadorMassa,
    modeloRastreadorMassa,
    marcaSimcardIdSimMassa,
    operadoraSimMassa,
  ]);

  const lastPreviewAttemptRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      modo !== "individual" ||
      !podeConfirmarIndividual ||
      preview ||
      previewMutation.isPending
    )
      return;
    const key = `${imeiIndividual.trim()}|${iccidIndividual.trim()}`;
    if (lastPreviewAttemptRef.current === key) return;
    lastPreviewAttemptRef.current = key;
    previewMutation.mutate();
  }, [
    modo,
    podeConfirmarIndividual,
    preview,
    previewMutation,
    imeiIndividual,
    iccidIndividual,
  ]);

  const handleGerarPreview = () => {
    if (modo === "individual") {
      if (paresIndividual.length === 0) {
        const imeiMsg =
          minImeiIndividual > 0
            ? `${minImeiIndividual} dígitos`
            : "ao menos 1 dígito";
        const iccidMsg =
          minIccidIndividual > 0
            ? `${minIccidIndividual} dígitos`
            : "ao menos 1 dígito";
        toast.error(`Informe IMEI (${imeiMsg}) e ICCID (${iccidMsg})`);
        return;
      }
    } else {
      if (!quantidadeBate) {
        toast.error(
          `Quantidade não confere: ${imeis.length} IMEIs x ${iccids.length} ICCIDs`,
        );
        return;
      }
      if (paresMassa.length === 0) {
        toast.error("Cole as listas de IMEIs e ICCIDs");
        return;
      }
    }
    previewMutation.mutate();
  };

  const limparIndividual = () => {
    setImeiIndividual("");
    setIccidIndividual("");
    setCriarNovoRastreador(false);
    setCriarNovoSim(false);
    setPertenceLoteRastreador(false);
    setPertenceLoteSim(false);
    setMarcaRastreador("");
    setModeloRastreador("");
    setOperadoraSim("");
    setLoteRastreadorId("");
    setLoteSimId("");
    setPreview(null);
    setProprietarioIndividual("INFINITY");
    setClienteIdIndividual(null);
    lastPreviewAttemptRef.current = null;
  };

  const limparMassa = () => {
    setTextImeis("");
    setTextIccids("");
    setPreview(null);
    setCriarNovoRastreadorMassa(false);
    setCriarNovoSimMassa(false);
    setLoteRastreadorId("");
    setLoteSimId("");
    setPertenceLoteRastreadorMassa(true);
    setPertenceLoteSimMassa(true);
    setMarcaRastreadorMassa("");
    setModeloRastreadorMassa("");
    setOperadoraSimMassa("");
    setProprietarioMassa("INFINITY");
    setClienteIdMassa(null);
  };

  const subtituloPorModo: Record<ModoPareamento, string> = {
    individual: "Pareamento individual (rastreador + SIM)",
    massa: "Cadastro em massa (colagem de IMEIs e ICCIDs)",
    csv: "Importação via arquivo CSV",
  };

  return (
    <div className="-m-4 min-h-[100dvh] flex flex-col bg-slate-100">
      {/* Header */}
      <header className="sticky -top-4 z-10 flex h-20 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8">
        <div className="flex items-center gap-4">
          <Link
            to="/equipamentos"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-3">
            <MaterialIcon name="link" className="text-blue-600 text-xl" />
            <div>
              <h1 className="text-lg font-bold text-slate-800 uppercase tracking-tight">
                Pareamento de Equipamentos
              </h1>
              <p className="text-xs text-slate-500">{subtituloPorModo[modo]}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setModo("individual")}
            className={cn(
              "px-4 py-2 text-[11px] font-bold uppercase rounded-sm border transition-all",
              modo === "individual"
                ? "bg-slate-800 text-white border-slate-800"
                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50",
            )}
          >
            Individual
          </button>
          <button
            type="button"
            onClick={() => setModo("massa")}
            className={cn(
              "px-4 py-2 text-[11px] font-bold uppercase rounded-sm border transition-all",
              modo === "massa"
                ? "bg-slate-800 text-white border-slate-800"
                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50",
            )}
          >
            Em Massa (Colagem)
          </button>
          <button
            type="button"
            onClick={() => setModo("csv")}
            className={cn(
              "px-4 py-2 text-[11px] font-bold uppercase rounded-sm border transition-all opacity-50 cursor-not-allowed",
              "bg-white text-slate-500 border-slate-200",
            )}
            title="Em breve"
          >
            Importação CSV
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-32">
        <div className="mx-auto max-w-[1400px]">
          {modo === "individual" && (
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-sm border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <MaterialIcon
                          name="sensors"
                          className="text-blue-600 text-xl"
                        />
                        <h3 className="text-xs font-bold text-slate-700 uppercase">
                          Rastreador
                        </h3>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">
                        PASSO 01
                      </span>
                    </div>
                    <div className="space-y-4 p-5">
                      <div>
                        <Label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          IMEI do Equipamento
                        </Label>
                        <div className="relative">
                          <Input
                            value={imeiIndividual}
                            onChange={(e) => setImeiIndividual(e.target.value)}
                            placeholder="Ex: 358942109982341"
                            className="h-9 pr-10 font-mono text-sm"
                          />
                          <MaterialIcon
                            name="barcode_scanner"
                            className="absolute right-2.5 top-2 text-slate-300"
                          />
                        </div>
                      </div>
                      <label className="flex cursor-pointer items-center gap-2">
                        <Checkbox
                          checked={criarNovoRastreador}
                          onCheckedChange={(v) => {
                            setCriarNovoRastreador(!!v);
                            if (!v) {
                              setPertenceLoteRastreador(false);
                              setMarcaRastreador("");
                              setModeloRastreador("");
                              setLoteRastreadorId("");
                            }
                          }}
                          className="border-slate-300 data-[state=checked]:bg-erp-blue data-[state=checked]:border-erp-blue"
                        />
                        <span className="text-[11px] font-bold uppercase text-slate-600">
                          Criar Novo
                        </span>
                      </label>
                      {criarNovoRastreador && (
                        <div className="space-y-3 pl-1">
                          <label className="flex cursor-pointer items-center gap-2">
                            <Checkbox
                              checked={pertenceLoteRastreador}
                              onCheckedChange={(v) =>
                                setPertenceLoteRastreador(!!v)
                              }
                              className="border-slate-300 data-[state=checked]:bg-erp-blue data-[state=checked]:border-erp-blue"
                            />
                            <span className="text-[11px] font-bold uppercase text-slate-600">
                              Pertence a um lote
                            </span>
                          </label>
                          {pertenceLoteRastreador ? (
                            <div>
                              <Label className="mb-1.5 block text-[10px] font-bold uppercase text-slate-600">
                                Lote
                              </Label>
                              <Select
                                value={loteRastreadorId}
                                onValueChange={setLoteRastreadorId}
                                onOpenChange={(o) => {
                                  if (!o) setLoteBuscaRastreador("");
                                }}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Selecione o lote..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <div className="px-2 pb-1 pt-1">
                                    <Input
                                      placeholder="Buscar lote..."
                                      value={loteBuscaRastreador}
                                      onChange={(e) =>
                                        setLoteBuscaRastreador(e.target.value)
                                      }
                                      onKeyDown={(e) => e.stopPropagation()}
                                      className="h-7 text-xs"
                                    />
                                  </div>
                                  {lotesRastreadoresFiltrados.map((l) => {
                                    const info = [l.marca, l.modelo]
                                      .filter(Boolean)
                                      .join(" / ");
                                    return (
                                      <SelectItem
                                        key={l.id}
                                        value={String(l.id)}
                                        textValue={l.referencia}
                                      >
                                        <span className="flex w-full items-center justify-between gap-3">
                                          <span>{l.referencia}</span>
                                          {info && (
                                            <span className="text-[11px] text-slate-400">
                                              ({info})
                                            </span>
                                          )}
                                        </span>
                                      </SelectItem>
                                    );
                                  })}
                                  {lotesRastreadoresFiltrados.length === 0 && (
                                    <SelectItem value="_" disabled>
                                      Nenhum lote encontrado
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="mb-1.5 block text-[10px] font-bold uppercase text-slate-600">
                                  Marca (se criar novo)
                                </Label>
                                <Select
                                  value={marcaRastreador}
                                  onValueChange={(v) => {
                                    setMarcaRastreador(v);
                                    setModeloRastreador("");
                                  }}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Selecione..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {marcasAtivas.map((m) => (
                                      <SelectItem key={m.id} value={m.nome}>
                                        {m.nome}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="mb-1.5 block text-[10px] font-bold uppercase text-slate-600">
                                  Modelo (se criar novo)
                                </Label>
                                <Select
                                  value={modeloRastreador}
                                  onValueChange={setModeloRastreador}
                                  disabled={!marcaRastreador}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue
                                      placeholder={
                                        marcaRastreador
                                          ? "Selecione..."
                                          : "Marca primeiro"
                                      }
                                    />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {modelosPorMarca.map((m) => (
                                      <SelectItem key={m.id} value={m.nome}>
                                        {m.nome}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {preview?.linhas[0]?.tracker_status ===
                        "FOUND_AVAILABLE" && (
                        <div className="grid grid-cols-2 gap-3 rounded-sm bg-slate-50 p-2">
                          <div>
                            <Label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
                              Marca
                            </Label>
                            <span className="text-xs font-medium">
                              {preview.linhas[0].marca ?? "--"}
                            </span>
                          </div>
                          <div>
                            <Label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
                              Modelo
                            </Label>
                            <span className="text-xs font-medium">
                              {preview.linhas[0].modelo ?? "--"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-sm border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <MaterialIcon
                          name="sim_card"
                          className="text-blue-600 text-xl"
                        />
                        <h3 className="text-xs font-bold text-slate-700 uppercase">
                          SIM Card
                        </h3>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">
                        PASSO 02
                      </span>
                    </div>
                    <div className="space-y-4 p-5">
                      <div>
                        <Label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          ICCID / Linha
                        </Label>
                        <div className="relative">
                          <Input
                            value={iccidIndividual}
                            onChange={(e) => setIccidIndividual(e.target.value)}
                            placeholder="Ex: 895501100000001"
                            className="h-9 pr-10 font-mono text-sm"
                          />
                          <MaterialIcon
                            name="search"
                            className="absolute right-2.5 top-2 text-slate-300"
                          />
                        </div>
                      </div>
                      <label className="flex cursor-pointer items-center gap-2">
                        <Checkbox
                          checked={criarNovoSim}
                          onCheckedChange={(v) => {
                            setCriarNovoSim(!!v);
                            if (!v) {
                              setPertenceLoteSim(false);
                              setOperadoraSim("");
                              setMarcaSimcardIdSim("");
                              setPlanoSimcardIdSim("");
                              setLoteSimId("");
                            }
                          }}
                          className="border-slate-300 data-[state=checked]:bg-erp-blue data-[state=checked]:border-erp-blue"
                        />
                        <span className="text-[11px] font-bold uppercase text-slate-600">
                          Criar Novo
                        </span>
                      </label>
                      {criarNovoSim && (
                        <div className="space-y-3 pl-1">
                          <label className="flex cursor-pointer items-center gap-2">
                            <Checkbox
                              checked={pertenceLoteSim}
                              onCheckedChange={(v) => setPertenceLoteSim(!!v)}
                              className="border-slate-300 data-[state=checked]:bg-erp-blue data-[state=checked]:border-erp-blue"
                            />
                            <span className="text-[11px] font-bold uppercase text-slate-600">
                              Pertence a um lote
                            </span>
                          </label>
                          {pertenceLoteSim ? (
                            <div>
                              <Label className="mb-1.5 block text-[10px] font-bold uppercase text-slate-600">
                                Lote
                              </Label>
                              <Select
                                value={loteSimId}
                                onValueChange={setLoteSimId}
                                onOpenChange={(o) => {
                                  if (!o) setLoteBuscaSim("");
                                }}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Selecione o lote..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <div className="px-2 pb-1 pt-1">
                                    <Input
                                      placeholder="Buscar lote..."
                                      value={loteBuscaSim}
                                      onChange={(e) =>
                                        setLoteBuscaSim(e.target.value)
                                      }
                                      onKeyDown={(e) => e.stopPropagation()}
                                      className="h-7 text-xs"
                                    />
                                  </div>
                                  {lotesSimsFiltrados.map((l) => {
                                    const marcaNome =
                                      marcasSimcard.find(
                                        (m) => m.id === l.marcaSimcardId,
                                      )?.nome ?? null;
                                    const info = [l.operadora, marcaNome]
                                      .filter(Boolean)
                                      .join(" / ");
                                    return (
                                      <SelectItem
                                        key={l.id}
                                        value={String(l.id)}
                                        textValue={l.referencia}
                                      >
                                        <span className="flex w-full items-center justify-between gap-3">
                                          <span>{l.referencia}</span>
                                          {info && (
                                            <span className="text-[11px] text-slate-400">
                                              ({info})
                                            </span>
                                          )}
                                        </span>
                                      </SelectItem>
                                    );
                                  })}
                                  {lotesSimsFiltrados.length === 0 && (
                                    <SelectItem value="_" disabled>
                                      Nenhum lote encontrado
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div>
                                <Label className="mb-1 block text-[10px] font-bold uppercase text-slate-600">
                                  Operadora
                                </Label>
                                <Select
                                  value={operadoraSim}
                                  onValueChange={(v) => {
                                    setOperadoraSim(v);
                                    setMarcaSimcardIdSim("");
                                    setPlanoSimcardIdSim("");
                                  }}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Selecione..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {operadorasAtivas.map((o) => (
                                      <SelectItem key={o.id} value={o.nome}>
                                        {o.nome}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="mb-1 block text-[10px] font-bold uppercase text-slate-600">
                                  Marca do Simcard
                                </Label>
                                <Select
                                  value={marcaSimcardIdSim}
                                  onValueChange={(v) => {
                                    setMarcaSimcardIdSim(v);
                                    setPlanoSimcardIdSim("");
                                  }}
                                  disabled={!operadoraSim}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue
                                      placeholder={
                                        operadoraSim
                                          ? "Ex: Getrak, 1nce..."
                                          : "Selecione operadora"
                                      }
                                    />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {marcasSimcardPorOperadora.map((m) => (
                                      <SelectItem
                                        key={m.id}
                                        value={String(m.id)}
                                      >
                                        {m.nome}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              {marcaSimcardIdSim &&
                                (() => {
                                  const marcaSel =
                                    marcasSimcardPorOperadora.find(
                                      (m) => String(m.id) === marcaSimcardIdSim,
                                    );
                                  const planos = (
                                    marcaSel?.planos ?? []
                                  ).filter((p) => p.ativo);
                                  return marcaSel?.temPlanos &&
                                    planos.length > 0 ? (
                                    <div>
                                      <Label className="mb-1 block text-[10px] font-bold uppercase text-slate-600">
                                        Plano
                                      </Label>
                                      <Select
                                        value={planoSimcardIdSim}
                                        onValueChange={setPlanoSimcardIdSim}
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
                                    </div>
                                  ) : null;
                                })()}
                            </div>
                          )}
                        </div>
                      )}
                      {preview?.linhas[0]?.sim_status === "FOUND_AVAILABLE" && (
                        <div className="rounded-sm bg-slate-50 p-2">
                          <Label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
                            Operadora
                          </Label>
                          <span className="text-xs font-medium">
                            {preview.linhas[0].operadora ?? "--"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-sm border border-dashed border-blue-200 bg-blue-50/30 p-6">
                  <div className="mb-4 flex items-center gap-2 border-b border-blue-100 pb-3">
                    <MaterialIcon
                      name="lan"
                      className="text-blue-600 text-lg"
                    />
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-blue-800">
                      Visualização da Unidade Lógica
                    </h3>
                  </div>
                  <div className="flex items-center justify-center gap-8 text-slate-400">
                    <div className="flex flex-col items-center gap-1">
                      <Router className="h-8 w-8" />
                      <span className="text-[10px] font-bold uppercase">
                        {imeiIndividual.trim() || "Aguardando IMEI"}
                      </span>
                    </div>
                    <Link2 className="h-6 w-6 text-slate-300" />
                    <div className="flex flex-col items-center gap-1">
                      <Smartphone className="h-8 w-8" />
                      <span className="text-[10px] font-bold uppercase">
                        {iccidIndividual.trim() || "Aguardando ICCID"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Proprietário */}
                <div className="rounded-sm border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                    <MaterialIcon
                      name="business_center"
                      className="text-erp-blue"
                    />
                    <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-wide">
                      Pertence a
                    </h3>
                  </div>
                  <div className="flex rounded-sm overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        setProprietarioIndividual("INFINITY");
                        setClienteIdIndividual(null);
                      }}
                      className={cn(
                        "flex-1 py-2.5 px-4 text-xs font-bold uppercase border transition-all",
                        proprietarioIndividual === "INFINITY"
                          ? "bg-slate-800 text-white border-slate-800"
                          : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50",
                      )}
                    >
                      Infinity
                    </button>
                    <button
                      type="button"
                      onClick={() => setProprietarioIndividual("CLIENTE")}
                      className={cn(
                        "flex-1 py-2.5 px-4 text-xs font-bold uppercase border-t border-b border-r transition-all",
                        proprietarioIndividual === "CLIENTE"
                          ? "bg-slate-800 text-white border-slate-800"
                          : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50",
                      )}
                    >
                      Cliente
                    </button>
                  </div>
                  {proprietarioIndividual === "CLIENTE" && (
                    <div className="mt-3">
                      <SelectClienteSearch
                        clientes={clientes}
                        value={clienteIdIndividual ?? undefined}
                        onChange={(id) => setClienteIdIndividual(id ?? null)}
                        placeholder="Digite para pesquisar cliente..."
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="col-span-4">
                <div className="sticky top-24 space-y-4">
                  <div className="overflow-hidden rounded-sm border border-slate-700 bg-slate-900 text-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                        Resumo da Configuração
                      </h3>
                      {podeConfirmarPareamentoIndividual ? (
                        <span className="rounded-sm bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
                          PRONTO
                        </span>
                      ) : preview ? (
                        preview.contadores.exigemLote > 0 ? (
                          <span className="rounded-sm bg-blue-500 px-2 py-0.5 text-[10px] font-bold text-white">
                            CONFIGURE
                          </span>
                        ) : (
                          <span className="rounded-sm bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                            ERRO
                          </span>
                        )
                      ) : (
                        <span className="rounded-sm bg-slate-500 px-2 py-0.5 text-[10px] font-bold text-white">
                          RASCUNHO
                        </span>
                      )}
                    </div>
                    <div className="space-y-6 p-6">
                      <div>
                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                          Rastreador
                        </label>
                        <div className="flex items-center gap-3 rounded-sm border border-slate-800 bg-slate-800/50 p-3">
                          <MaterialIcon
                            name="sensors"
                            className="text-slate-500"
                          />
                          <span className="font-mono text-xs text-slate-300">
                            {imeiIndividual.trim() || "-- PENDENTE --"}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                          SIM Card
                        </label>
                        <div className="flex items-center gap-3 rounded-sm border border-slate-800 bg-slate-800/50 p-3">
                          <MaterialIcon
                            name="sim_card"
                            className="text-slate-500"
                          />
                          <span className="font-mono text-xs text-slate-300">
                            {iccidIndividual.trim() || "-- PENDENTE --"}
                          </span>
                        </div>
                      </div>
                      <div className="border-t border-slate-800 pt-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase text-slate-600">
                            Status do Vínculo
                          </span>
                          <span
                            className={cn(
                              "text-[10px] font-bold uppercase",
                              podeConfirmarPareamentoIndividual
                                ? "text-emerald-400"
                                : "text-amber-400",
                            )}
                          >
                            {podeConfirmarPareamentoIndividual
                              ? "Completo"
                              : "Incompleto"}
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full bg-erp-blue transition-all duration-300"
                            style={{
                              width: podeConfirmarPareamentoIndividual
                                ? "100%"
                                : `${progressoVinculoIndividual}%`,
                            }}
                          />
                        </div>
                        {!podeConfirmarPareamentoIndividual &&
                          !podeConfirmarIndividual &&
                          (imeiIndividual.replace(/\D/g, "").length > 0 ||
                            iccidIndividual.replace(/\D/g, "").length > 0) && (
                            <p className="mt-2 text-[10px] text-amber-400">
                              {minImeiIndividual > 0
                                ? `IMEI deve ter ao menos ${minImeiIndividual} dígito(s).`
                                : "Informe o IMEI."}{" "}
                              {minIccidIndividual > 0
                                ? `ICCID deve ter ao menos ${minIccidIndividual} dígito(s).`
                                : "Informe o ICCID."}
                            </p>
                          )}
                        {!podeConfirmarPareamentoIndividual &&
                          podeConfirmarIndividual && (
                            <div className="mt-2 space-y-1.5">
                              {!preview ? (
                                <p className="text-[10px] text-amber-400">
                                  Verificando...
                                </p>
                              ) : preview.contadores.exigemLote > 0 ? (
                                <p className="text-[10px] text-amber-400">
                                  Selecione os lotes ou informe marca/modelo e
                                  operadora para itens novos.
                                </p>
                              ) : preview.contadores.erros > 0 ? (
                                <>
                                  <p className="text-[10px] text-amber-400">
                                    Corrija os erros abaixo:
                                  </p>
                                  {preview.linhas[0] && (
                                    <div className="flex flex-wrap gap-2">
                                      {preview.linhas[0].tracker_status ===
                                        "INVALID_FORMAT" && (
                                        <span
                                          className={cn(
                                            "rounded px-2 py-0.5 text-[10px] font-bold",
                                            TRACKER_STATUS_LABELS.INVALID_FORMAT
                                              .className,
                                          )}
                                        >
                                          Rastreador: Formato inválido (IMEI
                                          deve ter 14-16 dígitos)
                                        </span>
                                      )}
                                      {preview.linhas[0].tracker_status ===
                                        "FOUND_ALREADY_LINKED" && (
                                        <span
                                          className={cn(
                                            "rounded px-2 py-0.5 text-[10px] font-bold",
                                            TRACKER_STATUS_LABELS
                                              .FOUND_ALREADY_LINKED.className,
                                          )}
                                        >
                                          Rastreador: Em uso (já vinculado)
                                        </span>
                                      )}
                                      {preview.linhas[0].sim_status ===
                                        "INVALID_FORMAT" && (
                                        <span
                                          className={cn(
                                            "rounded px-2 py-0.5 text-[10px] font-bold",
                                            TRACKER_STATUS_LABELS.INVALID_FORMAT
                                              .className,
                                          )}
                                        >
                                          SIM: Formato inválido (ICCID deve ter
                                          18-21 dígitos)
                                        </span>
                                      )}
                                      {preview.linhas[0].sim_status ===
                                        "FOUND_ALREADY_LINKED" && (
                                        <span
                                          className={cn(
                                            "rounded px-2 py-0.5 text-[10px] font-bold",
                                            TRACKER_STATUS_LABELS
                                              .FOUND_ALREADY_LINKED.className,
                                          )}
                                        >
                                          SIM: Em uso (já vinculado)
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <p className="text-[10px] text-amber-400">
                                  Clique em Verificar para validar os dados.
                                </p>
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                  {quantidadeCriada > 0 && (
                    <div className="flex items-center gap-2 rounded-sm border border-emerald-200 bg-emerald-50 px-4 py-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-bold text-emerald-800">
                        {quantidadeCriada} equipamento(s) criado(s) nesta sessão
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {modo === "massa" && (
            <div className="grid grid-cols-12 gap-8">
              <div className="col-span-8 space-y-6">
                <div className="rounded-sm border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                        <MaterialIcon
                          name="edit_note"
                          className="text-slate-600 text-xl"
                        />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-800">
                          Entrada de Dados
                        </h3>
                        <p className="text-[10px] font-medium text-slate-500 mt-0.5">
                          Cole uma lista de identificadores por linha (vírgula,
                          ponto-vírgula ou quebra de linha)
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50">
                          <MaterialIcon
                            name="sensors"
                            className="text-blue-600 text-base"
                          />
                        </div>
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Lista de IMEIs (Rastreadores)
                        </Label>
                      </div>
                      <textarea
                        value={textImeis}
                        onChange={(e) => setTextImeis(e.target.value)}
                        placeholder={`358942109982341\n358942109982342\n358942109982343...`}
                        className="h-48 w-full resize-none rounded-sm border border-slate-300 p-3 font-mono text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      {minImeiMassa > 0 && (
                        <p className="mt-1 text-[10px] text-slate-400">
                          Mínimo {minImeiMassa} dígito(s) por IMEI
                        </p>
                      )}
                    </div>
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50">
                          <MaterialIcon
                            name="sim_card"
                            className="text-blue-600 text-base"
                          />
                        </div>
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Lista de ICCIDs (SIM Cards)
                        </Label>
                      </div>
                      <textarea
                        value={textIccids}
                        onChange={(e) => setTextIccids(e.target.value)}
                        placeholder={`895501100000001\n895501100000002\n895501100000003...`}
                        className="h-48 w-full resize-none rounded-sm border border-slate-300 p-3 font-mono text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      {minIccidMassa > 0 && (
                        <p className="mt-1 text-[10px] text-slate-400">
                          Mínimo {minIccidMassa} dígito(s) por ICCID
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 border-t border-slate-200 pt-6">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                        <MaterialIcon
                          name="inventory_2"
                          className="text-slate-600"
                        />
                      </div>
                      <div>
                        <Label className="block text-[10px] font-bold uppercase text-slate-600">
                          Para novos IDs: Lote ou criação manual
                        </Label>
                        <p className="text-[10px] font-medium text-slate-500">
                          Rastreadores e SIMs não encontrados serão criados
                          conforme a configuração abaixo
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="rounded-sm border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-slate-200">
                            <MaterialIcon
                              name="sensors"
                              className="text-blue-600 text-lg"
                            />
                          </div>
                          <Label className="text-[10px] font-bold uppercase text-slate-600">
                            Rastreadores
                          </Label>
                        </div>
                        <label className="flex cursor-pointer items-center gap-2">
                          <Checkbox
                            checked={criarNovoRastreadorMassa}
                            onCheckedChange={(v) => {
                              setCriarNovoRastreadorMassa(!!v);
                              if (!v) {
                                setPertenceLoteRastreadorMassa(true);
                                setMarcaRastreadorMassa("");
                                setModeloRastreadorMassa("");
                                setLoteRastreadorId("");
                              }
                            }}
                            className="border-slate-300 data-[state=checked]:bg-erp-blue data-[state=checked]:border-erp-blue"
                          />
                          <span className="text-[11px] font-bold uppercase text-slate-600">
                            Criar Novo
                          </span>
                        </label>
                        {criarNovoRastreadorMassa && (
                          <div className="space-y-3 pl-1">
                            <label className="flex cursor-pointer items-center gap-2">
                              <Checkbox
                                checked={pertenceLoteRastreadorMassa}
                                onCheckedChange={(v) =>
                                  setPertenceLoteRastreadorMassa(!!v)
                                }
                                className="border-slate-300 data-[state=checked]:bg-erp-blue data-[state=checked]:border-erp-blue"
                              />
                              <span className="text-[11px] font-bold uppercase text-slate-600">
                                Pertence a um lote
                              </span>
                            </label>
                            {pertenceLoteRastreadorMassa ? (
                              <Select
                                value={loteRastreadorId}
                                onValueChange={setLoteRastreadorId}
                                onOpenChange={(o) => {
                                  if (!o) setLoteBuscaRastreador("");
                                }}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Selecione o lote..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <div className="px-2 pb-1 pt-1">
                                    <Input
                                      placeholder="Buscar lote..."
                                      value={loteBuscaRastreador}
                                      onChange={(e) =>
                                        setLoteBuscaRastreador(e.target.value)
                                      }
                                      onKeyDown={(e) => e.stopPropagation()}
                                      className="h-7 text-xs"
                                    />
                                  </div>
                                  {lotesRastreadoresFiltrados.map((l) => {
                                    const info = [l.marca, l.modelo]
                                      .filter(Boolean)
                                      .join(" / ");
                                    return (
                                      <SelectItem
                                        key={l.id}
                                        value={String(l.id)}
                                        textValue={l.referencia}
                                      >
                                        <span className="flex w-full items-center justify-between gap-3">
                                          <span>{l.referencia}</span>
                                          {info && (
                                            <span className="text-[11px] text-slate-400">
                                              ({info})
                                            </span>
                                          )}
                                        </span>
                                      </SelectItem>
                                    );
                                  })}
                                  {lotesRastreadoresFiltrados.length === 0 && (
                                    <SelectItem value="_" disabled>
                                      Nenhum lote encontrado
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label className="mb-1 block text-[10px] font-bold text-slate-500">
                                    Marca
                                  </Label>
                                  <Select
                                    value={marcaRastreadorMassa}
                                    onValueChange={(v) => {
                                      setMarcaRastreadorMassa(v);
                                      setModeloRastreadorMassa("");
                                    }}
                                  >
                                    <SelectTrigger className="h-9">
                                      <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {marcasAtivas.map((m) => (
                                        <SelectItem key={m.id} value={m.nome}>
                                          {m.nome}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="mb-1 block text-[10px] font-bold text-slate-500">
                                    Modelo
                                  </Label>
                                  <Select
                                    value={modeloRastreadorMassa}
                                    onValueChange={setModeloRastreadorMassa}
                                    disabled={!marcaRastreadorMassa}
                                  >
                                    <SelectTrigger className="h-9">
                                      <SelectValue
                                        placeholder={
                                          marcaRastreadorMassa
                                            ? "Selecione..."
                                            : "Marca primeiro"
                                        }
                                      />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {modelosPorMarcaMassa.map((m) => (
                                        <SelectItem key={m.id} value={m.nome}>
                                          {m.nome}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="rounded-sm border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-slate-200">
                            <MaterialIcon
                              name="sim_card"
                              className="text-blue-600 text-lg"
                            />
                          </div>
                          <Label className="text-[10px] font-bold uppercase text-slate-600">
                            SIM Cards
                          </Label>
                        </div>
                        <label className="flex cursor-pointer items-center gap-2">
                          <Checkbox
                            checked={criarNovoSimMassa}
                            onCheckedChange={(v) => {
                              setCriarNovoSimMassa(!!v);
                              if (!v) {
                                setPertenceLoteSimMassa(true);
                                setOperadoraSimMassa("");
                                setMarcaSimcardIdSimMassa("");
                                setPlanoSimcardIdSimMassa("");
                                setLoteSimId("");
                              }
                            }}
                            className="border-slate-300 data-[state=checked]:bg-erp-blue data-[state=checked]:border-erp-blue"
                          />
                          <span className="text-[11px] font-bold uppercase text-slate-600">
                            Criar Novo
                          </span>
                        </label>
                        {criarNovoSimMassa && (
                          <div className="space-y-3 pl-1">
                            <label className="flex cursor-pointer items-center gap-2">
                              <Checkbox
                                checked={pertenceLoteSimMassa}
                                onCheckedChange={(v) =>
                                  setPertenceLoteSimMassa(!!v)
                                }
                                className="border-slate-300 data-[state=checked]:bg-erp-blue data-[state=checked]:border-erp-blue"
                              />
                              <span className="text-[11px] font-bold uppercase text-slate-600">
                                Pertence a um lote
                              </span>
                            </label>
                            {pertenceLoteSimMassa ? (
                              <Select
                                value={loteSimId}
                                onValueChange={setLoteSimId}
                                onOpenChange={(o) => {
                                  if (!o) setLoteBuscaSim("");
                                }}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Selecione o lote..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <div className="px-2 pb-1 pt-1">
                                    <Input
                                      placeholder="Buscar lote..."
                                      value={loteBuscaSim}
                                      onChange={(e) =>
                                        setLoteBuscaSim(e.target.value)
                                      }
                                      onKeyDown={(e) => e.stopPropagation()}
                                      className="h-7 text-xs"
                                    />
                                  </div>
                                  {lotesSimsFiltrados.map((l) => {
                                    const marcaNome =
                                      marcasSimcard.find(
                                        (m) => m.id === l.marcaSimcardId,
                                      )?.nome ?? null;
                                    const info = [l.operadora, marcaNome]
                                      .filter(Boolean)
                                      .join(" / ");
                                    return (
                                      <SelectItem
                                        key={l.id}
                                        value={String(l.id)}
                                        textValue={l.referencia}
                                      >
                                        <span className="flex w-full items-center justify-between gap-3">
                                          <span>{l.referencia}</span>
                                          {info && (
                                            <span className="text-[11px] text-slate-400">
                                              ({info})
                                            </span>
                                          )}
                                        </span>
                                      </SelectItem>
                                    );
                                  })}
                                  {lotesSimsFiltrados.length === 0 && (
                                    <SelectItem value="_" disabled>
                                      Nenhum lote encontrado
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="space-y-3">
                                <div>
                                  <Label className="mb-1 block text-[10px] font-bold text-slate-500">
                                    Operadora
                                  </Label>
                                  <Select
                                    value={operadoraSimMassa}
                                    onValueChange={(v) => {
                                      setOperadoraSimMassa(v);
                                      setMarcaSimcardIdSimMassa("");
                                      setPlanoSimcardIdSimMassa("");
                                    }}
                                  >
                                    <SelectTrigger className="h-9">
                                      <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {operadorasAtivas.map((o) => (
                                        <SelectItem key={o.id} value={o.nome}>
                                          {o.nome}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="mb-1 block text-[10px] font-bold text-slate-500">
                                    Marca do Simcard
                                  </Label>
                                  <Select
                                    value={marcaSimcardIdSimMassa}
                                    onValueChange={(v) => {
                                      setMarcaSimcardIdSimMassa(v);
                                      setPlanoSimcardIdSimMassa("");
                                    }}
                                    disabled={!operadoraSimMassa}
                                  >
                                    <SelectTrigger className="h-9">
                                      <SelectValue
                                        placeholder={
                                          operadoraSimMassa
                                            ? "Ex: Getrak, 1nce..."
                                            : "Selecione operadora"
                                        }
                                      />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {marcasSimcardPorOperadoraMassa.map(
                                        (m) => (
                                          <SelectItem
                                            key={m.id}
                                            value={String(m.id)}
                                          >
                                            {m.nome}
                                          </SelectItem>
                                        ),
                                      )}
                                    </SelectContent>
                                  </Select>
                                </div>
                                {marcaSimcardIdSimMassa &&
                                  (() => {
                                    const marcaSel =
                                      marcasSimcardPorOperadoraMassa.find(
                                        (m) =>
                                          String(m.id) ===
                                          marcaSimcardIdSimMassa,
                                      );
                                    const planos = (
                                      marcaSel?.planos ?? []
                                    ).filter((p) => p.ativo);
                                    return marcaSel?.temPlanos &&
                                      planos.length > 0 ? (
                                      <div>
                                        <Label className="mb-1 block text-[10px] font-bold text-slate-500">
                                          Plano
                                        </Label>
                                        <Select
                                          value={planoSimcardIdSimMassa}
                                          onValueChange={
                                            setPlanoSimcardIdSimMassa
                                          }
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
                                      </div>
                                    ) : null;
                                  })()}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Proprietário Massa */}
                  <div className="mt-6 rounded-sm border border-slate-200 bg-white p-5">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                      <MaterialIcon
                        name="business_center"
                        className="text-erp-blue"
                      />
                      <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-wide">
                        Pertence a
                      </h3>
                    </div>
                    <div className="flex rounded-sm overflow-hidden">
                      <button
                        type="button"
                        onClick={() => {
                          setProprietarioMassa("INFINITY");
                          setClienteIdMassa(null);
                        }}
                        className={cn(
                          "flex-1 py-2.5 px-4 text-xs font-bold uppercase border transition-all",
                          proprietarioMassa === "INFINITY"
                            ? "bg-slate-800 text-white border-slate-800"
                            : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50",
                        )}
                      >
                        Infinity
                      </button>
                      <button
                        type="button"
                        onClick={() => setProprietarioMassa("CLIENTE")}
                        className={cn(
                          "flex-1 py-2.5 px-4 text-xs font-bold uppercase border-t border-b border-r transition-all",
                          proprietarioMassa === "CLIENTE"
                            ? "bg-slate-800 text-white border-slate-800"
                            : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50",
                        )}
                      >
                        Cliente
                      </button>
                    </div>
                    {proprietarioMassa === "CLIENTE" && (
                      <div className="mt-3">
                        <SelectClienteSearch
                          clientes={clientes}
                          value={clienteIdMassa ?? undefined}
                          onChange={(id) => setClienteIdMassa(id ?? null)}
                          placeholder="Digite para pesquisar cliente..."
                        />
                      </div>
                    )}
                  </div>

                  {!quantidadeBate &&
                    (imeis.length > 0 || iccids.length > 0) && (
                      <div className="mt-4 flex items-center gap-2 rounded-sm border border-amber-200 bg-amber-50 p-3">
                        <AlertCircle className="h-5 w-5 text-amber-600" />
                        <p className="text-sm font-bold text-amber-800">
                          Quantidade não confere: {imeis.length} IMEIs x{" "}
                          {iccids.length} ICCIDs.
                          {imeis.length > iccids.length
                            ? ` Faltam ${imeis.length - iccids.length} ICCID(s).`
                            : ` Faltam ${iccids.length - imeis.length} IMEI(s).`}
                        </p>
                      </div>
                    )}
                </div>

                {preview && <PreviewPareamentoTable preview={preview} />}
              </div>

              <div className="col-span-4">
                <div className="sticky top-8">
                  <div className="overflow-hidden rounded-sm border border-slate-200 bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700">
                        Resumo da Montagem
                      </h3>
                      <MaterialIcon
                        name="inventory_2"
                        className="text-slate-400"
                      />
                    </div>
                    <div className="space-y-6 p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Total de Itens
                          </label>
                          <p className="mt-0.5 text-2xl font-bold text-slate-800">
                            {paresMassa.length}{" "}
                            <span className="text-xs font-normal text-slate-400">
                              Pares
                            </span>
                          </p>
                        </div>
                        {preview && (
                          <div className="text-right">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                              A Criar
                            </label>
                            <p className="mt-0.5 text-lg font-bold text-blue-600">
                              +
                              {preview.contadores.validos +
                                preview.contadores.exigemLote}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="border-t border-slate-100 pt-4">
                        <label className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Parâmetros de Destino
                        </label>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium uppercase text-slate-500">
                              Status Pós-Montagem:
                            </span>
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                              Configurado
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 border-t border-blue-100 bg-blue-50/50 p-4">
                      <Info className="h-5 w-5 shrink-0 text-blue-500" />
                      <p className="text-[10px] font-medium uppercase leading-relaxed text-blue-700">
                        Equipamentos serão vinculados logicamente no sistema e
                        marcados como prontos para instalação.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer - left-60 para não sobrepor a sidebar (240px) */}
      <footer className="fixed bottom-0 left-60 right-0 z-30 flex h-20 items-center justify-end gap-4 border-t border-slate-200 bg-white px-8 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
        {modo === "individual" ? (
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={limparIndividual}
              className="h-11 px-6 text-[11px] font-bold uppercase text-slate-500"
            >
              Limpar Campos
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleGerarPreview}
              disabled={!podeConfirmarIndividual || previewMutation.isPending}
              className="h-11 px-6 text-[11px] font-bold uppercase"
            >
              {previewMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Verificar"
              )}
            </Button>
            <Button
              type="button"
              onClick={() => pareamentoMutation.mutate()}
              disabled={
                !podeConfirmarPareamentoIndividual ||
                pareamentoMutation.isPending
              }
              className="h-11 gap-2 px-8 bg-erp-blue text-[11px] font-bold uppercase hover:bg-blue-700"
            >
              {pareamentoMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MaterialIcon name="link" className="text-lg" />
              )}
              Confirmar Pareamento
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={limparMassa}
              className="h-11 px-6 text-[11px] font-bold uppercase text-slate-500"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleGerarPreview}
              disabled={!quantidadeBate || paresMassa.length === 0}
              variant="outline"
              className="h-11 px-6 text-[11px] font-bold uppercase"
            >
              {previewMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Gerar Preview"
              )}
            </Button>
            <Button
              type="button"
              onClick={() => pareamentoMutation.mutate()}
              disabled={!podeConfirmarMassa || pareamentoMutation.isPending}
              className="h-11 gap-2 px-8 bg-erp-blue text-[11px] font-bold uppercase shadow-lg shadow-blue-500/20 hover:bg-blue-700"
            >
              {pareamentoMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MaterialIcon
                  name="settings_input_component"
                  className="text-lg"
                />
              )}
              Criar Equipamentos
            </Button>
          </>
        )}
      </footer>
    </div>
  );
}
