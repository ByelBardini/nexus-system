import { placaApenasAlfanumericos, telefoneApenasDigitos } from "@/lib/format";
import type { CriarOrdemServicoPayload, SubclienteEnderecoInput } from "./ordens-servico-criacao.types";
import type { CriacaoOsFormData } from "./ordens-servico-criacao.schema";

export function isDadosSubclienteCompletos(data: CriacaoOsFormData): boolean {
  return !!(
    data.subclienteNome?.trim() &&
    data.subclienteCep?.trim() &&
    data.subclienteCidade?.trim() &&
    data.subclienteEstado?.trim() &&
    telefoneApenasDigitos(data.subclienteTelefone ?? "").length >= 10
  );
}

export function resolveSubclienteIdFromForm(
  data: CriacaoOsFormData,
): number | undefined {
  return !data.isNovoSubcliente && data.subclienteId && data.subclienteId > 0
    ? data.subclienteId
    : undefined;
}

function cobrancaFromForm(
  data: CriacaoOsFormData,
): string | undefined {
  return data.ordemInstalacao === "INFINITY"
    ? "INFINITY"
    : data.subclienteCobranca || undefined;
}

export function buildSubclienteEndereco(
  data: CriacaoOsFormData,
): SubclienteEnderecoInput {
  return {
    nome: data.subclienteNome!.trim(),
    cep: data.subclienteCep!.trim(),
    logradouro: data.subclienteLogradouro?.trim() || undefined,
    numero: data.subclienteNumero?.trim() || undefined,
    complemento: data.subclienteComplemento?.trim() || undefined,
    bairro: data.subclienteBairro?.trim() || undefined,
    cidade: data.subclienteCidade!.trim(),
    estado: data.subclienteEstado!.trim(),
    cpf: data.subclienteCpf?.trim() || undefined,
    email: data.subclienteEmail?.trim() || undefined,
    telefone: telefoneApenasDigitos(data.subclienteTelefone ?? ""),
    cobrancaTipo: cobrancaFromForm(data),
  };
}

export function buildSubclienteCreate(
  data: CriacaoOsFormData,
): SubclienteEnderecoInput | undefined {
  if (!data.isNovoSubcliente || !isDadosSubclienteCompletos(data)) {
    return undefined;
  }
  return buildSubclienteEndereco(data);
}

export function buildSubclienteUpdate(
  data: CriacaoOsFormData,
  subclienteId: number | undefined,
): SubclienteEnderecoInput | undefined {
  if (
    data.isNovoSubcliente ||
    !subclienteId ||
    !isDadosSubclienteCompletos(data)
  ) {
    return undefined;
  }
  return buildSubclienteEndereco(data);
}

export type PrecheckCriacaoOsResult =
  | { ok: true; clienteIdFinal: number }
  | { ok: false; errorMessage: string };

export function precheckCriacaoOs(
  data: CriacaoOsFormData,
  clienteInfinityId: number | null,
): PrecheckCriacaoOsResult {
  if (
    data.ordemInstalacao === "CLIENTE" &&
    (!data.clienteOrdemId || data.clienteOrdemId <= 0)
  ) {
    return {
      ok: false,
      errorMessage: "Selecione o cliente para criar a ordem de serviço.",
    };
  }
  if (
    data.ordemInstalacao === "INFINITY" &&
    (!clienteInfinityId || clienteInfinityId <= 0)
  ) {
    return {
      ok: false,
      errorMessage:
        "Modo Infinity: não foi possível carregar o cliente do sistema. Tente novamente.",
    };
  }
  const clienteIdFinal =
    data.ordemInstalacao === "INFINITY"
      ? clienteInfinityId!
      : data.clienteOrdemId!;
  return { ok: true, clienteIdFinal };
}

export function trimObservacoes(
  observacoes: string | undefined,
): string | undefined {
  return observacoes?.trim() || undefined;
}

export function buildCriarOrdemServicoPayload(
  data: CriacaoOsFormData,
  params: {
    clienteIdFinal: number;
    subclienteId: number | undefined;
    subclienteCreate: SubclienteEnderecoInput | undefined;
    subclienteUpdate: SubclienteEnderecoInput | undefined;
    veiculoId: number | undefined;
    observacoes: string | undefined;
  },
): CriarOrdemServicoPayload {
  return {
    tipo: data.tipo,
    clienteId: params.clienteIdFinal,
    subclienteId: params.subclienteCreate ? undefined : params.subclienteId,
    subclienteCreate: params.subclienteCreate,
    subclienteUpdate: params.subclienteUpdate,
    tecnicoId:
      data.tecnicoId && data.tecnicoId > 0 ? data.tecnicoId : undefined,
    veiculoId: params.veiculoId,
    observacoes: params.observacoes,
    idAparelho: data.idAparelho?.trim() || undefined,
    localInstalacao: data.localInstalacao?.trim() || undefined,
    posChave: data.posChave || undefined,
  };
}

export function hasVeiculoDataCompletoParaApi(data: CriacaoOsFormData): boolean {
  const placa = placaApenasAlfanumericos(data.veiculoPlaca ?? "");
  return (
    placa.length >= 7 &&
    !!data.veiculoMarca?.trim() &&
    !!data.veiculoModelo?.trim() &&
    !!data.veiculoAno?.trim() &&
    !!data.veiculoCor?.trim()
  );
}

export async function buscarOuCriarVeiculoId(
  data: CriacaoOsFormData,
  postVeiculo: (body: {
    placa: string;
    marca: string;
    modelo: string;
    ano: string;
    cor: string;
  }) => Promise<{ id: number }>,
): Promise<number | undefined> {
  if (!hasVeiculoDataCompletoParaApi(data)) return undefined;
  const placa = placaApenasAlfanumericos(data.veiculoPlaca ?? "");
  try {
    const veiculo = await postVeiculo({
      placa,
      marca: data.veiculoMarca!.trim(),
      modelo: data.veiculoModelo!.trim(),
      ano: data.veiculoAno!.trim(),
      cor: data.veiculoCor!.trim(),
    });
    return veiculo?.id;
  } catch {
    return undefined;
  }
}
