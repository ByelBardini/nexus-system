import type { DebitoRastreadorApi } from "@/types/aparelhos-debito-rastreador";

export type TipoEntidade = "cliente" | "infinity";
export type StatusDebito = "aberto" | "parcial" | "quitado";

export interface ModeloDebito {
  nome: string;
  quantidade: number;
}

/** Histórico de movimentação na UI de débitos (não confundir com histórico de aparelho). */
export interface DebitoEquipamentoHistoricoItem {
  descricao: string;
  data: string;
  tipo: "entrada" | "saida";
  quantidade: number;
}

export interface DebitoEquipamento {
  id: number;
  devedor: { nome: string; tipo: TipoEntidade };
  credor: { nome: string; tipo: TipoEntidade };
  status: StatusDebito;
  ultimaMovimentacao: string;
  modelos: ModeloDebito[];
  historico: DebitoEquipamentoHistoricoItem[];
}

export interface DebitoHistoricoMovimentacaoApi {
  id: number;
  delta: number;
  criadoEm: string;
  pedido?: { id: number; codigo: string } | null;
  lote?: { id: number; referencia: string } | null;
  aparelho?: { id: number; identificador: string | null } | null;
  ordemServico?: { id: number; numero: number } | null;
}

/**
 * Resposta da API de listagem com histórico (tela de débitos).
 * Estende o tipo de cadastro de aparelhos com campos opcionais da listagem.
 */
export type DebitoRastreadorListaApi = DebitoRastreadorApi & {
  criadoEm?: string;
  atualizadoEm: string;
  historicos?: DebitoHistoricoMovimentacaoApi[];
};

export interface DebitosEquipamentosApiResponse {
  data: DebitoRastreadorListaApi[];
  total: number;
  page: number;
  totalPages: number;
}

export interface DebitosEquipamentosStats {
  totalAparelhosDevidos: number;
  saldoMes: number;
  devedoresCliente: number;
  devedoresInfinity: number;
  pctCliente: number;
  modelosAtivos: number;
  modeloPredominante: string;
}

export interface DebitosEquipamentosFilters {
  busca: string;
  filtroStatus: StatusDebito | "todos";
  filtroDevedor: string;
  filtroModelo: string;
}
