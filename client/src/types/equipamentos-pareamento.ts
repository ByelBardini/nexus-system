export type ModoPareamento = "individual" | "massa" | "csv";
export type ProprietarioTipo = "INFINITY" | "CLIENTE";

export interface CsvLinhaInput {
  imei: string;
  iccid: string;
  marcaRastreador?: string;
  modeloRastreador?: string;
  marcaSimcard?: string;
  operadora?: string;
  plano?: string;
  loteRastreador?: string;
  loteSimcard?: string;
}

/** Item de lote retornado pela API de pareamento */
export interface LotePareamentoListItem {
  id: number;
  referencia: string;
  quantidadeDisponivelSemId: number;
  modelo: string | null;
  marca: string | null;
  operadora: string | null;
  marcaSimcardId: number | null;
}

export interface MarcaPareamentoCatalog {
  id: number;
  nome: string;
  ativo: boolean;
}

export interface ModeloPareamentoCatalog {
  id: number;
  nome: string;
  marca: { id: number };
  minCaracteresImei?: number | null;
}

export interface OperadoraPareamentoCatalog {
  id: number;
  nome: string;
  ativo: boolean;
}

export interface MarcaSimcardPareamentoCatalog {
  id: number;
  nome: string;
  operadoraId: number;
  temPlanos: boolean;
  minCaracteresIccid?: number | null;
  operadora: { id: number; nome: string };
  planos?: { id: number; planoMb: number; ativo: boolean }[];
}

export interface ClientePareamentoLista {
  id: number;
  nome: string;
  cidade?: string | null;
  estado?: string | null;
}

export type ParImeiIccid = { imei: string; iccid: string };
