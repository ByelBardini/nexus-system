/** Catálogos usados no cadastro individual / lote de aparelhos */

export interface ClienteLista {
  id: number;
  nome: string;
  nomeFantasia?: string | null;
  cidade?: string | null;
  estado?: string | null;
}

export interface MarcaCatalog {
  id: number;
  nome: string;
  ativo: boolean;
  modelos?: MarcaModeloCatalog[];
}

export interface MarcaModeloCatalog {
  id: number;
  nome: string;
  ativo: boolean;
  marca: { id: number; nome: string };
  minCaracteresImei?: number | null;
  /** Lote: marca opcional no tipo retornado por /modelos */
  marcaId?: number;
}

export interface OperadoraCatalog {
  id: number;
  nome: string;
  ativo: boolean;
}

export type MarcaSimcardRow = {
  id: number;
  nome: string;
  operadoraId: number;
  temPlanos: boolean;
  minCaracteresIccid?: number | null;
  operadora: { id: number; nome: string };
  planos?: { id: number; planoMb: number; ativo: boolean }[];
};

/** Item mínimo retornado em GET /aparelhos para checagem de duplicidade */
export interface AparelhoIdentificadorListItem {
  identificador?: string;
  lote?: { referencia: string } | null;
}
