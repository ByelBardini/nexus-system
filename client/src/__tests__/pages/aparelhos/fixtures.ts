import type { Aparelho } from "@/pages/aparelhos/lista/aparelhos-page.shared";

export function aparelhoFixture(
  overrides: Partial<Aparelho> & Pick<Aparelho, "id" | "tipo" | "status" | "proprietario">,
): Aparelho {
  return {
    identificador: null,
    marca: null,
    modelo: null,
    operadora: null,
    marcaSimcard: null,
    planoSimcard: null,
    cliente: null,
    simVinculado: null,
    aparelhosVinculados: undefined,
    kitId: null,
    kit: null,
    tecnico: null,
    lote: null,
    valorUnitario: null,
    ordemServicoVinculada: null,
    criadoEm: "2024-01-15T12:00:00.000Z",
    historico: [],
    ...overrides,
  };
}
