import type { DebitoRastreadorListaApi } from "@/pages/debitos-equipamentos/domain/types";

export function buildDebitoRastreadorListaApi(
  overrides: Partial<DebitoRastreadorListaApi> = {},
): DebitoRastreadorListaApi {
  return {
    id: 1,
    devedorTipo: "CLIENTE",
    devedorClienteId: 10,
    devedorCliente: { id: 10, nome: "Acme Ltda" },
    credorTipo: "INFINITY",
    credorClienteId: null,
    credorCliente: null,
    marcaId: 1,
    marca: { id: 1, nome: "MarcaX" },
    modeloId: 2,
    modelo: { id: 2, nome: "Modelo Y" },
    quantidade: 5,
    criadoEm: "2024-01-01T12:00:00.000Z",
    atualizadoEm: "2024-06-15T14:30:00.000Z",
    historicos: [],
    ...overrides,
  };
}
