/** Status na definição de entrada (cadastro individual) — distinto do workflow em `@/types/aparelho-status`. */
export type StatusAparelhoCadastroIndividual =
  | "NOVO_OK"
  | "EM_MANUTENCAO"
  | "CANCELADO_DEFEITO";

export type OrigemItem =
  | "RETIRADA_CLIENTE"
  | "DEVOLUCAO_TECNICO"
  | "COMPRA_AVULSA";

export type DestinoDefeito = "DESCARTADO" | "EM_ESTOQUE_DEFEITO";
