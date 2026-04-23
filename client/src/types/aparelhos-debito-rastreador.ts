export interface DebitoRastreadorApi {
  id: number;
  devedorTipo: "INFINITY" | "CLIENTE";
  devedorClienteId: number | null;
  devedorCliente: { id: number; nome: string } | null;
  credorTipo: "INFINITY" | "CLIENTE";
  credorClienteId: number | null;
  credorCliente: { id: number; nome: string } | null;
  marcaId: number;
  marca: { id: number; nome: string };
  modeloId: number;
  modelo: { id: number; nome: string };
  quantidade: number;
}

export type ProprietarioDebitoFilter = "INFINITY" | "CLIENTE";
