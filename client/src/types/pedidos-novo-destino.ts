import type {
  ClienteResumo,
  SubclienteResumo,
} from "@/types/pedidos-rastreador";

export type ClienteComSubclientes = ClienteResumo & {
  subclientes?: SubclienteResumo[];
};

export type OpcaoDestinoCliente = {
  tipo: "cliente" | "subcliente";
  id: number;
  label: string;
  item:
    | ClienteComSubclientes
    | (SubclienteResumo & { cliente?: ClienteResumo });
};
