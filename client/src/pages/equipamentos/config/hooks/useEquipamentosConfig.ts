import { useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useEquipamentosFullCatalogQueries } from "@/pages/equipamentos/hooks/useEquipamentosCatalogQueries";
import {
  buildModelosByMarca,
  filterMarcasByMarcaOrModeloName,
  filterMarcasSimcardByNomeOuOperadora,
  filterOperadorasByName,
  toggleIdInSet,
} from "../domain/equipamentos-config.helpers";
import type {
  MarcaRastreador,
  MarcaSimcard,
  ModeloRastreador,
  Operadora,
  PlanoSimcard,
} from "../domain/equipamentos-config.types";
import { useEquipamentosConfigModalState } from "./useEquipamentosConfigModalState";
import { useEquipamentosConfigCrudMutations } from "./useEquipamentosConfigCrudMutations";

export function useEquipamentosConfig() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("CONFIGURACAO.APARELHO.EDITAR");

  const modal = useEquipamentosConfigModalState();

  const {
    createMarcaMutation,
    updateMarcaMutation,
    deleteMarcaMutation,
    createModeloMutation,
    updateModeloMutation,
    deleteModeloMutation,
    createOperadoraMutation,
    updateOperadoraMutation,
    deleteOperadoraMutation,
    createMarcaSimcardMutation,
    updateMarcaSimcardMutation,
    deleteMarcaSimcardMutation,
    createPlanoSimcardMutation,
    updatePlanoSimcardMutation,
    deletePlanoSimcardMutation,
  } = useEquipamentosConfigCrudMutations({
    closers: {
      closeModalMarca: modal.closeModalMarca,
      closeModalModelo: modal.closeModalModelo,
      closeModalOperadora: modal.closeModalOperadora,
      closeModalMarcaSimcard: modal.closeModalMarcaSimcard,
      closeModalPlanoSimcard: modal.closeModalPlanoSimcard,
    },
  });

  const debouncedSearchMarcas = useDebounce(modal.searchMarcas, 300);
  const debouncedSearchOperadoras = useDebounce(modal.searchOperadoras, 300);
  const debouncedSearchMarcasSimcard = useDebounce(
    modal.searchMarcasSimcard,
    300,
  );

  const { marcas, modelos, operadoras, marcasSimcard, isLoading } =
    useEquipamentosFullCatalogQueries<
      MarcaRastreador,
      ModeloRastreador,
      Operadora,
      MarcaSimcard
    >();

  const marcasAtivas = useMemo(() => marcas.filter((m) => m.ativo), [marcas]);
  const operadorasAtivas = useMemo(
    () => operadoras.filter((o) => o.ativo),
    [operadoras],
  );

  const filteredMarcas = useMemo(
    () =>
      filterMarcasByMarcaOrModeloName(marcas, modelos, debouncedSearchMarcas),
    [marcas, modelos, debouncedSearchMarcas],
  );

  const filteredOperadoras = useMemo(
    () => filterOperadorasByName(operadoras, debouncedSearchOperadoras),
    [operadoras, debouncedSearchOperadoras],
  );

  const filteredMarcasSimcard = useMemo(
    () =>
      filterMarcasSimcardByNomeOuOperadora(
        marcasSimcard,
        debouncedSearchMarcasSimcard,
      ),
    [marcasSimcard, debouncedSearchMarcasSimcard],
  );

  const modelosByMarca = useMemo(() => buildModelosByMarca(modelos), [modelos]);

  const totalModelos = modelos.length;

  function openCreateMarca() {
    modal.setEditingMarca(null);
    modal.setNomeMarca("");
    modal.setModalMarcaOpen(true);
  }

  function openEditMarca(marca: MarcaRastreador) {
    modal.setEditingMarca(marca);
    modal.setNomeMarca(marca.nome);
    modal.setModalMarcaOpen(true);
  }

  function handleSaveMarca() {
    if (!modal.nomeMarca.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (modal.editingMarca) {
      updateMarcaMutation.mutate({
        id: modal.editingMarca.id,
        nome: modal.nomeMarca,
      });
    } else {
      createMarcaMutation.mutate({ nome: modal.nomeMarca });
    }
  }

  function toggleAtivoMarca(marca: MarcaRastreador) {
    updateMarcaMutation.mutate({ id: marca.id, ativo: !marca.ativo });
  }

  function openCreateModelo(marcaId?: number) {
    modal.setEditingModelo(null);
    modal.setNomeModelo("");
    modal.setMarcaIdForModelo(marcaId ? String(marcaId) : "");
    modal.setMinCaracteresImeiModelo("");
    modal.setModalModeloOpen(true);
  }

  function openEditModelo(modelo: ModeloRastreador) {
    modal.setEditingModelo(modelo);
    modal.setNomeModelo(modelo.nome);
    modal.setMarcaIdForModelo(String(modelo.marca.id));
    modal.setMinCaracteresImeiModelo(
      modelo.minCaracteresImei ? String(modelo.minCaracteresImei) : "",
    );
    modal.setModalModeloOpen(true);
  }

  function handleSaveModelo() {
    if (!modal.nomeModelo.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (!modal.editingModelo && !modal.marcaIdForModelo) {
      toast.error("Selecione uma marca");
      return;
    }
    const minImei = modal.minCaracteresImeiModelo
      ? Number(modal.minCaracteresImeiModelo)
      : undefined;
    if (modal.editingModelo) {
      updateModeloMutation.mutate({
        id: modal.editingModelo.id,
        nome: modal.nomeModelo,
        minCaracteresImei: minImei,
      });
    } else {
      createModeloMutation.mutate({
        nome: modal.nomeModelo,
        marcaId: Number(modal.marcaIdForModelo),
        minCaracteresImei: minImei,
      });
    }
  }

  function toggleAtivoModelo(modelo: ModeloRastreador) {
    updateModeloMutation.mutate({ id: modelo.id, ativo: !modelo.ativo });
  }

  function openCreateOperadora() {
    modal.setEditingOperadora(null);
    modal.setNomeOperadora("");
    modal.setModalOperadoraOpen(true);
  }

  function openEditOperadora(operadora: Operadora) {
    modal.setEditingOperadora(operadora);
    modal.setNomeOperadora(operadora.nome);
    modal.setModalOperadoraOpen(true);
  }

  function handleSaveOperadora() {
    if (!modal.nomeOperadora.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (modal.editingOperadora) {
      updateOperadoraMutation.mutate({
        id: modal.editingOperadora.id,
        nome: modal.nomeOperadora,
      });
    } else {
      createOperadoraMutation.mutate({ nome: modal.nomeOperadora });
    }
  }

  function toggleAtivoOperadora(operadora: Operadora) {
    updateOperadoraMutation.mutate({
      id: operadora.id,
      ativo: !operadora.ativo,
    });
  }

  function openCreateMarcaSimcard() {
    modal.setEditingMarcaSimcard(null);
    modal.setNomeMarcaSimcard("");
    modal.setOperadoraIdMarcaSimcard("");
    modal.setTemPlanosMarcaSimcard(false);
    modal.setMinCaracteresIccidMarcaSimcard("");
    modal.setModalMarcaSimcardOpen(true);
  }

  function openEditMarcaSimcard(m: MarcaSimcard) {
    modal.setEditingMarcaSimcard(m);
    modal.setNomeMarcaSimcard(m.nome);
    modal.setOperadoraIdMarcaSimcard(String(m.operadoraId));
    modal.setTemPlanosMarcaSimcard(m.temPlanos);
    modal.setMinCaracteresIccidMarcaSimcard(
      m.minCaracteresIccid ? String(m.minCaracteresIccid) : "",
    );
    modal.setModalMarcaSimcardOpen(true);
  }

  function handleSaveMarcaSimcard() {
    if (!modal.nomeMarcaSimcard.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (!modal.editingMarcaSimcard && !modal.operadoraIdMarcaSimcard) {
      toast.error("Selecione uma operadora");
      return;
    }
    const minIccid = modal.minCaracteresIccidMarcaSimcard
      ? Number(modal.minCaracteresIccidMarcaSimcard)
      : undefined;
    if (modal.editingMarcaSimcard) {
      updateMarcaSimcardMutation.mutate({
        id: modal.editingMarcaSimcard.id,
        nome: modal.nomeMarcaSimcard,
        operadoraId: modal.operadoraIdMarcaSimcard
          ? Number(modal.operadoraIdMarcaSimcard)
          : undefined,
        temPlanos: modal.temPlanosMarcaSimcard,
        minCaracteresIccid: minIccid,
      });
    } else {
      createMarcaSimcardMutation.mutate({
        nome: modal.nomeMarcaSimcard,
        operadoraId: Number(modal.operadoraIdMarcaSimcard),
        temPlanos: modal.temPlanosMarcaSimcard,
        minCaracteresIccid: minIccid,
      });
    }
  }

  function toggleMarca(marcaId: number) {
    modal.setExpandedMarcaIds((prev) => toggleIdInSet(prev, marcaId));
  }

  function toggleMarcaSimcard(marcaId: number) {
    modal.setExpandedMarcasSimcardIds((prev) => toggleIdInSet(prev, marcaId));
  }

  function openCreatePlanoSimcard(marcaId: number) {
    modal.setEditingPlanoSimcard(null);
    modal.setPlanoMbPlanoSimcard("");
    modal.setMarcaSimcardIdForPlano(marcaId);
    modal.setModalPlanoSimcardOpen(true);
  }

  function openEditPlanoSimcard(plano: PlanoSimcard) {
    modal.setEditingPlanoSimcard(plano);
    modal.setPlanoMbPlanoSimcard(plano.planoMb);
    modal.setMarcaSimcardIdForPlano(plano.marcaSimcardId);
    modal.setModalPlanoSimcardOpen(true);
  }

  function handleSavePlanoSimcard() {
    if (
      modal.planoMbPlanoSimcard === "" ||
      Number(modal.planoMbPlanoSimcard) <= 0
    ) {
      toast.error("Informe o valor em MB");
      return;
    }
    if (!modal.marcaSimcardIdForPlano) return;
    if (modal.editingPlanoSimcard) {
      updatePlanoSimcardMutation.mutate({
        id: modal.editingPlanoSimcard.id,
        planoMb: Number(modal.planoMbPlanoSimcard),
      });
    } else {
      createPlanoSimcardMutation.mutate({
        marcaSimcardId: modal.marcaSimcardIdForPlano,
        planoMb: Number(modal.planoMbPlanoSimcard),
      });
    }
  }

  function toggleAtivoMarcaSimcard(m: MarcaSimcard) {
    updateMarcaSimcardMutation.mutate({ id: m.id, ativo: !m.ativo });
  }

  return {
    canEdit,
    isLoading,
    searchMarcas: modal.searchMarcas,
    setSearchMarcas: modal.setSearchMarcas,
    searchOperadoras: modal.searchOperadoras,
    setSearchOperadoras: modal.setSearchOperadoras,
    searchMarcasSimcard: modal.searchMarcasSimcard,
    setSearchMarcasSimcard: modal.setSearchMarcasSimcard,
    expandedMarcaIds: modal.expandedMarcaIds,
    expandedMarcasSimcardIds: modal.expandedMarcasSimcardIds,
    filteredMarcas,
    filteredOperadoras,
    filteredMarcasSimcard,
    modelosByMarca,
    totalModelos,
    marcasAtivas,
    operadorasAtivas,
    toggleMarca,
    openCreateMarca,
    openEditMarca,
    handleSaveMarca,
    toggleAtivoMarca,
    openCreateModelo,
    openEditModelo,
    handleSaveModelo,
    toggleAtivoModelo,
    openCreateOperadora,
    openEditOperadora,
    handleSaveOperadora,
    toggleAtivoOperadora,
    openCreateMarcaSimcard,
    openEditMarcaSimcard,
    handleSaveMarcaSimcard,
    toggleMarcaSimcard,
    openCreatePlanoSimcard,
    openEditPlanoSimcard,
    handleSavePlanoSimcard,
    toggleAtivoMarcaSimcard,
    createMarcaMutation,
    updateMarcaMutation,
    deleteMarcaMutation,
    createModeloMutation,
    updateModeloMutation,
    deleteModeloMutation,
    createOperadoraMutation,
    updateOperadoraMutation,
    deleteOperadoraMutation,
    createMarcaSimcardMutation,
    updateMarcaSimcardMutation,
    deleteMarcaSimcardMutation,
    createPlanoSimcardMutation,
    updatePlanoSimcardMutation,
    deletePlanoSimcardMutation,
    modalMarcaOpen: modal.modalMarcaOpen,
    closeModalMarca: modal.closeModalMarca,
    editingMarca: modal.editingMarca,
    nomeMarca: modal.nomeMarca,
    setNomeMarca: modal.setNomeMarca,
    modalModeloOpen: modal.modalModeloOpen,
    closeModalModelo: modal.closeModalModelo,
    editingModelo: modal.editingModelo,
    nomeModelo: modal.nomeModelo,
    setNomeModelo: modal.setNomeModelo,
    marcaIdForModelo: modal.marcaIdForModelo,
    setMarcaIdForModelo: modal.setMarcaIdForModelo,
    minCaracteresImeiModelo: modal.minCaracteresImeiModelo,
    setMinCaracteresImeiModelo: modal.setMinCaracteresImeiModelo,
    modalOperadoraOpen: modal.modalOperadoraOpen,
    closeModalOperadora: modal.closeModalOperadora,
    editingOperadora: modal.editingOperadora,
    nomeOperadora: modal.nomeOperadora,
    setNomeOperadora: modal.setNomeOperadora,
    modalMarcaSimcardOpen: modal.modalMarcaSimcardOpen,
    closeModalMarcaSimcard: modal.closeModalMarcaSimcard,
    editingMarcaSimcard: modal.editingMarcaSimcard,
    nomeMarcaSimcard: modal.nomeMarcaSimcard,
    setNomeMarcaSimcard: modal.setNomeMarcaSimcard,
    operadoraIdMarcaSimcard: modal.operadoraIdMarcaSimcard,
    setOperadoraIdMarcaSimcard: modal.setOperadoraIdMarcaSimcard,
    temPlanosMarcaSimcard: modal.temPlanosMarcaSimcard,
    setTemPlanosMarcaSimcard: modal.setTemPlanosMarcaSimcard,
    minCaracteresIccidMarcaSimcard: modal.minCaracteresIccidMarcaSimcard,
    setMinCaracteresIccidMarcaSimcard: modal.setMinCaracteresIccidMarcaSimcard,
    modalPlanoSimcardOpen: modal.modalPlanoSimcardOpen,
    closeModalPlanoSimcard: modal.closeModalPlanoSimcard,
    editingPlanoSimcard: modal.editingPlanoSimcard,
    planoMbPlanoSimcard: modal.planoMbPlanoSimcard,
    setPlanoMbPlanoSimcard: modal.setPlanoMbPlanoSimcard,
  };
}

export type EquipamentosConfigController = ReturnType<
  typeof useEquipamentosConfig
>;
