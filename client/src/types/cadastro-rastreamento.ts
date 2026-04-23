import type { CadastroRastreamentoTipoRegistro } from "@/lib/cadastro-rastreamento-tipo-mappers";

export type StatusCadastro = "AGUARDANDO" | "EM_CADASTRO" | "CONCLUIDO";
export type PlataformaCadastroRastreamento = "GETRAK" | "GEOMAPS" | "SELSYN";
/** Alias curto para selects e mutações */
export type Plataforma = PlataformaCadastroRastreamento;

export interface OrdemCadastro {
  id: number;
  status: StatusCadastro;
  tipoRegistro: CadastroRastreamentoTipoRegistro;
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

export interface AparelhoCadastroRastreamentoResposta {
  marca: string | null;
  modelo: string | null;
  iccid: string | null;
  sim: {
    operadora: string | null;
    marcaNome: string | null;
    planoMb: number | null;
  } | null;
}

/** Resposta de um item em `GET /cadastro-rastreamento` */
export interface OSResponse {
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
  localInstalacaoEntrada: string | null;
  posChaveEntrada: string | null;
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
  aparelhoEntrada: AparelhoCadastroRastreamentoResposta | null;
  aparelhoSaida: AparelhoCadastroRastreamentoResposta | null;
}

export interface CadastroRastreamentoListagemResposta {
  data: OSResponse[];
  total: number;
}
