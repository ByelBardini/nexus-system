import { telefoneApenasDigitos } from "@/lib/format";

export const criacaoOsWatchFieldList = [
  "subclienteTelefone",
  "subclienteNome",
  "subclienteCep",
  "subclienteLogradouro",
  "subclienteNumero",
  "subclienteBairro",
  "subclienteEstado",
  "subclienteCidade",
  "ordemInstalacao",
  "clienteOrdemId",
  "tecnicoId",
  "veiculoPlaca",
  "veiculoMarca",
  "veiculoModelo",
  "tipo",
] as const;

export type CriacaoOsWatched = {
  subclienteTelefone: string | undefined;
  subclienteNome: string | undefined;
  subclienteCep: string | undefined;
  subclienteLogradouro: string | undefined;
  subclienteNumero: string | undefined;
  subclienteBairro: string | undefined;
  subclienteEstado: string | undefined;
  subclienteCidade: string | undefined;
  ordemInstalacao: "INFINITY" | "CLIENTE";
  clienteOrdemId: number | undefined;
  tecnicoId: number | undefined;
  veiculoPlaca: string | undefined;
  veiculoMarca: string | undefined;
  veiculoModelo: string | undefined;
  tipo: string | undefined;
};

export function mapCriacaoOsWatchFields(
  fields: (string | number | boolean | undefined)[] | undefined,
): CriacaoOsWatched {
  const f = fields ?? [];
  return {
    subclienteTelefone: f[0] as string | undefined,
    subclienteNome: f[1] as string | undefined,
    subclienteCep: f[2] as string | undefined,
    subclienteLogradouro: f[3] as string | undefined,
    subclienteNumero: f[4] as string | undefined,
    subclienteBairro: f[5] as string | undefined,
    subclienteEstado: f[6] as string | undefined,
    subclienteCidade: f[7] as string | undefined,
    ordemInstalacao: f[8] as CriacaoOsWatched["ordemInstalacao"],
    clienteOrdemId: f[9] as number | undefined,
    tecnicoId: f[10] as number | undefined,
    veiculoPlaca: f[11] as string | undefined,
    veiculoMarca: f[12] as string | undefined,
    veiculoModelo: f[13] as string | undefined,
    tipo: f[14] as string | undefined,
  };
}

export type CriacaoOsDerivedFlags = {
  temCliente: boolean;
  temTecnico: boolean;
  temVeiculo: boolean;
  temTipo: boolean;
  isFormValid: boolean;
};

export function computeCriacaoOsDerivedFlags(
  watched: CriacaoOsWatched,
  clienteInfinityId: number | null,
): CriacaoOsDerivedFlags {
  const telefoneCompleto =
    telefoneApenasDigitos(watched.subclienteTelefone ?? "").length >= 10;
  const temDadosSubcliente =
    !!(watched.subclienteNome ?? "").trim() &&
    !!(watched.subclienteCep ?? "").trim() &&
    !!(watched.subclienteLogradouro ?? "").trim() &&
    !!(watched.subclienteNumero ?? "").trim() &&
    !!(watched.subclienteBairro ?? "").trim() &&
    !!(watched.subclienteEstado ?? "").trim() &&
    !!(watched.subclienteCidade ?? "").trim() &&
    telefoneCompleto;
  const temCliente =
    temDadosSubcliente &&
    (watched.ordemInstalacao === "INFINITY"
      ? !!clienteInfinityId && clienteInfinityId > 0
      : watched.ordemInstalacao === "CLIENTE" &&
        !!watched.clienteOrdemId &&
        watched.clienteOrdemId > 0);
  const temTecnico = !!watched.tecnicoId && watched.tecnicoId > 0;
  const temVeiculo = !!(watched.veiculoPlaca ?? "").trim();
  const temTipo = !!watched.tipo;
  return {
    temCliente,
    temTecnico,
    temVeiculo,
    temTipo,
    isFormValid: temCliente && temTipo,
  };
}
