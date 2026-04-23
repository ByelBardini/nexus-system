/** Status na definição de entrada (cadastro individual) — distinto do workflow em `@/types/aparelho-status`. */
export type StatusAparelhoCadastroIndividual =
  | "NOVO_OK"
  | "EM_MANUTENCAO"
  | "CANCELADO_DEFEITO";

export type OrigemItem =
  | "RETIRADA_CLIENTE"
  | "DEVOLUCAO_TECNICO"
  | "COMPRA_AVULSA";

export type CategoriaFalha =
  | "FALHA_COMUNICACAO"
  | "PROBLEMA_ALIMENTACAO"
  | "DANO_FISICO"
  | "CURTO_CIRCUITO"
  | "OUTRO";

export type DestinoDefeito = "SUCATA" | "GARANTIA" | "LABORATORIO";
