export type TipoContrato = "COMODATO" | "AQUISICAO";

export type StatusCliente = "ATIVO" | "PENDENTE" | "INATIVO";

export interface ClienteContato {
  id: number;
  nome: string;
  celular: string | null;
  email: string | null;
}

export interface Cliente {
  id: number;
  nome: string;
  nomeFantasia: string | null;
  cnpj: string | null;
  tipoContrato: TipoContrato;
  estoqueProprio: boolean;
  status: StatusCliente;
  cor?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  contatos: ClienteContato[];
  _count?: { ordensServico: number };
}

/** Estatísticas do rodapé alinhadas aos filtros da tabela (não só “ativos globais”). */
export type ClientesFooterStats = {
  exibindo: number;
  totalCadastro: number;
  ativosNaSelecao: number;
};

/** Campos de endereço usados na listagem expandida (texto único). */
export type ClienteEnderecoExibicao = Pick<
  Cliente,
  | "logradouro"
  | "numero"
  | "complemento"
  | "bairro"
  | "cidade"
  | "estado"
  | "cep"
>;

export type UseClienteModalOptions = {
  open: boolean;
  editingCliente: Cliente | null;
  onClose: () => void;
};
