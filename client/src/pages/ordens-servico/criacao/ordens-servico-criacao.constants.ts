import type { PrecoTecnico } from "./ordens-servico-criacao.types";

export const tipoServicoConfig = {
  INSTALACAO: { label: "Instalação", icon: "add_circle" as const },
  REVISAO: { label: "Revisão", icon: "build_circle" as const },
  RETIRADA: { label: "Retirada", icon: "remove_circle" as const },
} as const;

export const cobrancaOptions = [
  { value: "INFINITY", label: "Infinity (Padrão)" },
  { value: "CLIENTE", label: "Direto Cliente" },
] as const;

export const veiculoTipoIconMap: Record<string, string> = {
  AUTO: "directions_car",
  MOTOCICLETA: "two_wheeler",
  CAMINHONETE: "local_shipping",
  UTILITARIO: "airport_shuttle",
  CAMINHÃO: "local_shipping",
  MOTONETA: "two_wheeler",
  CICLOMOTOR: "two_wheeler",
};

export const VEICULO_TIPOS = [
  { value: "AUTO", label: "Auto" },
  { value: "MOTOCICLETA", label: "Motocicleta" },
  { value: "MOTONETA", label: "Motoneta" },
  { value: "CICLOMOTOR", label: "Ciclomotor" },
  { value: "CAMINHONETE", label: "Caminhonete" },
  { value: "UTILITARIO", label: "Utilitário" },
  { value: "CAMINHÃO", label: "Caminhão" },
] as const;

export const tipoToPrecoKey: Record<string, keyof PrecoTecnico> = {
  INSTALACAO_COM_BLOQUEIO: "instalacaoComBloqueio",
  INSTALACAO_SEM_BLOQUEIO: "instalacaoSemBloqueio",
  REVISAO: "revisao",
  RETIRADA: "retirada",
  DESLOCAMENTO: "deslocamento",
};

export const TECNICO_PRECO_CARDS: {
  key: keyof PrecoTecnico;
  label: string;
}[] = [
  { key: "instalacaoComBloqueio", label: "Instalação c/ bloqueio" },
  { key: "instalacaoSemBloqueio", label: "Instalação s/ bloqueio" },
  { key: "revisao", label: "Revisão" },
  { key: "retirada", label: "Retirada" },
  { key: "deslocamento", label: "Deslocamento" },
];
