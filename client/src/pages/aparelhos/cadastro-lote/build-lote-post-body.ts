import type {
  MarcaCatalog,
  MarcaModeloCatalog,
  OperadoraCatalog,
} from "@/pages/aparelhos/shared/catalog.types";
import type { LoteFormValues } from "./schema";

export type LotePostBody = {
  referencia: string;
  notaFiscal: string | null;
  dataChegada: string;
  proprietarioTipo: LoteFormValues["proprietarioTipo"];
  clienteId: LoteFormValues["clienteId"];
  tipo: LoteFormValues["tipo"];
  marca: string | null;
  modelo: string | null;
  operadora: string | null;
  marcaSimcardId: number | null;
  planoSimcardId: number | null;
  quantidade: number;
  valorUnitario: number;
  identificadores: string[];
  abaterDebitoId?: number;
  abaterQuantidade?: number;
};

export function buildLotePostBody(
  data: LoteFormValues,
  options: {
    marcasAtivas: MarcaCatalog[];
    modelosDisponiveis: MarcaModeloCatalog[];
    operadorasAtivas: OperadoraCatalog[];
    idValidos: string[];
    quantidadeFinal: number;
  },
): LotePostBody {
  const { marcasAtivas, modelosDisponiveis, operadorasAtivas } = options;

  const marcaSelecionada = marcasAtivas.find(
    (m) => m.id === Number(data.marca),
  );
  const modeloSelecionado = modelosDisponiveis.find(
    (m) => m.id === Number(data.modelo),
  );
  const operadoraSelecionada = operadorasAtivas.find(
    (o) => o.id === Number(data.operadora),
  );

  const base: LotePostBody = {
    referencia: String(data.referencia ?? ""),
    notaFiscal: (data.notaFiscal?.trim() || null) as string | null,
    dataChegada: String(
      data.dataChegada ?? new Date().toISOString().split("T")[0],
    ),
    proprietarioTipo: data.proprietarioTipo,
    clienteId: data.clienteId,
    tipo: data.tipo,
    marca: data.tipo === "RASTREADOR" ? (marcaSelecionada?.nome ?? null) : null,
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
    quantidade: options.quantidadeFinal,
    valorUnitario: Number(data.valorUnitario) / 100,
    identificadores: data.definirIds ? options.idValidos : [],
  };

  if (data.abaterDivida) {
    return {
      ...base,
      abaterDebitoId: data.abaterDebitoId ?? undefined,
      abaterQuantidade: data.abaterQuantidade ?? undefined,
    };
  }

  return base;
}
