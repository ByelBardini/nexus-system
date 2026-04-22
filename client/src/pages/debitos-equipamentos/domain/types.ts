import type { DebitoRastreadorApi } from "@/pages/aparelhos/shared/debito-rastreador";

export type TipoEntidade = "cliente" | "infinity";
export type StatusDebito = "aberto" | "parcial" | "quitado";

export interface ModeloDebito {
  nome: string;
  quantidade: number;
}

export interface HistoricoItem {
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
  historico: HistoricoItem[];
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
