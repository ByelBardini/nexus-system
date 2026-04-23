import { describe, expect, it } from "vitest";
import { CargoModal } from "@/pages/cargos/cargo-modal";
import { CargoModal as CargoModalDirect } from "@/pages/cargos/cargo-modal/CargoModal";
import {
  ClienteModal,
  useClienteModal,
} from "@/pages/clientes/cliente-modal";
import { ClienteModal as ClienteModalDirect } from "@/pages/clientes/cliente-modal/ClienteModal";
import { useClienteModal as useClienteModalDirect } from "@/pages/clientes/cliente-modal/useClienteModal";

/**
 * Garante que o barrel (`index.ts`) reexporta exatamente os mesmos bindings
 * que importações diretas — regressão comum após refatorar barrels.
 */
describe("barrels de modal (index.ts)", () => {
  it("CargoModal do barrel é o mesmo componente que o módulo CargoModal.tsx", () => {
    expect(CargoModal).toBe(CargoModalDirect);
  });

  it("ClienteModal e useClienteModal do barrel coincidem com os módulos fonte", () => {
    expect(ClienteModal).toBe(ClienteModalDirect);
    expect(useClienteModal).toBe(useClienteModalDirect);
  });

  it("exporta funções de componente/hook (não default quebrado ou undefined)", () => {
    expect(CargoModal.name).toMatch(/CargoModal/);
    expect(ClienteModal.name).toMatch(/ClienteModal/);
    expect(useClienteModal.name).toMatch(/useClienteModal/);
  });
});
