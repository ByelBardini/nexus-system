import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EquipamentosConfigModals } from "@/pages/equipamentos/config/components/EquipamentosConfigModals";
import type { EquipamentosConfigController } from "@/pages/equipamentos/config/hooks/useEquipamentosConfig";

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: () => <span data-icon="m" />,
}));

function mut() {
  return { isPending: false, mutate: vi.fn() } as any;
}

function minController(
  over: Partial<EquipamentosConfigController> = {},
): EquipamentosConfigController {
  const base = {
    canEdit: true,
    isLoading: false,
    searchMarcas: "",
    setSearchMarcas: vi.fn(),
    searchOperadoras: "",
    setSearchOperadoras: vi.fn(),
    searchMarcasSimcard: "",
    setSearchMarcasSimcard: vi.fn(),
    expandedMarcaIds: new Set<number>(),
    expandedMarcasSimcardIds: new Set<number>(),
    filteredMarcas: [],
    filteredOperadoras: [],
    filteredMarcasSimcard: [],
    modelosByMarca: new Map(),
    totalModelos: 0,
    marcasAtivas: [
      { id: 1, nome: "M", ativo: true, _count: { modelos: 0 } },
    ],
    operadorasAtivas: [{ id: 1, nome: "O", ativo: true }],
    toggleMarca: vi.fn(),
    openCreateMarca: vi.fn(),
    openEditMarca: vi.fn(),
    handleSaveMarca: vi.fn(),
    toggleAtivoMarca: vi.fn(),
    openCreateModelo: vi.fn(),
    openEditModelo: vi.fn(),
    handleSaveModelo: vi.fn(),
    toggleAtivoModelo: vi.fn(),
    openCreateOperadora: vi.fn(),
    openEditOperadora: vi.fn(),
    handleSaveOperadora: vi.fn(),
    toggleAtivoOperadora: vi.fn(),
    openCreateMarcaSimcard: vi.fn(),
    openEditMarcaSimcard: vi.fn(),
    handleSaveMarcaSimcard: vi.fn(),
    toggleMarcaSimcard: vi.fn(),
    openCreatePlanoSimcard: vi.fn(),
    openEditPlanoSimcard: vi.fn(),
    handleSavePlanoSimcard: vi.fn(),
    toggleAtivoMarcaSimcard: vi.fn(),
    createMarcaMutation: mut(),
    updateMarcaMutation: mut(),
    deleteMarcaMutation: mut(),
    createModeloMutation: mut(),
    updateModeloMutation: mut(),
    deleteModeloMutation: mut(),
    createOperadoraMutation: mut(),
    updateOperadoraMutation: mut(),
    deleteOperadoraMutation: mut(),
    createMarcaSimcardMutation: mut(),
    updateMarcaSimcardMutation: mut(),
    deleteMarcaSimcardMutation: mut(),
    createPlanoSimcardMutation: mut(),
    updatePlanoSimcardMutation: mut(),
    deletePlanoSimcardMutation: mut(),
    modalMarcaOpen: false,
    closeModalMarca: vi.fn(),
    editingMarca: null,
    nomeMarca: "",
    setNomeMarca: vi.fn(),
    modalModeloOpen: false,
    closeModalModelo: vi.fn(),
    editingModelo: null,
    nomeModelo: "",
    setNomeModelo: vi.fn(),
    marcaIdForModelo: "",
    setMarcaIdForModelo: vi.fn(),
    minCaracteresImeiModelo: "",
    setMinCaracteresImeiModelo: vi.fn(),
    modalOperadoraOpen: false,
    closeModalOperadora: vi.fn(),
    editingOperadora: null,
    nomeOperadora: "",
    setNomeOperadora: vi.fn(),
    modalMarcaSimcardOpen: false,
    closeModalMarcaSimcard: vi.fn(),
    editingMarcaSimcard: null,
    nomeMarcaSimcard: "",
    setNomeMarcaSimcard: vi.fn(),
    operadoraIdMarcaSimcard: "",
    setOperadoraIdMarcaSimcard: vi.fn(),
    temPlanosMarcaSimcard: false,
    setTemPlanosMarcaSimcard: vi.fn(),
    minCaracteresIccidMarcaSimcard: "",
    setMinCaracteresIccidMarcaSimcard: vi.fn(),
    modalPlanoSimcardOpen: false,
    closeModalPlanoSimcard: vi.fn(),
    editingPlanoSimcard: null,
    planoMbPlanoSimcard: "" as const,
    setPlanoMbPlanoSimcard: vi.fn(),
  } as unknown as EquipamentosConfigController;
  return { ...base, ...over } as EquipamentosConfigController;
}

describe("EquipamentosConfigModals", () => {
  it("com modal de marca aberto exibe título e campo", () => {
    render(
      <EquipamentosConfigModals
        c={minController({
          modalMarcaOpen: true,
          editingMarca: null,
        })}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Nova Marca" }),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Ex: Teltonika"),
    ).toBeInTheDocument();
  });

  it("modal plano (MB) com valor e edição muda título", () => {
    render(
      <EquipamentosConfigModals
        c={minController({
          modalPlanoSimcardOpen: true,
          editingPlanoSimcard: { id: 1, marcaSimcardId: 2, planoMb: 256, ativo: true },
          planoMbPlanoSimcard: 256,
        })}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Editar Plano" }),
    ).toBeInTheDocument();
  });
});
