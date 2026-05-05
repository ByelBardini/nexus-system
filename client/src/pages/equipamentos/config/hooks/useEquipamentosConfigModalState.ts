import { useState } from "react";
import type {
  MarcaRastreador,
  MarcaSimcard,
  ModeloRastreador,
  Operadora,
  PlanoSimcard,
} from "../domain/equipamentos-config.types";

export function useEquipamentosConfigModalState() {
  const [searchMarcas, setSearchMarcas] = useState("");
  const [searchOperadoras, setSearchOperadoras] = useState("");
  const [expandedMarcaIds, setExpandedMarcaIds] = useState<Set<number>>(
    new Set(),
  );

  const [modalMarcaOpen, setModalMarcaOpen] = useState(false);
  const [editingMarca, setEditingMarca] = useState<MarcaRastreador | null>(
    null,
  );
  const [nomeMarca, setNomeMarca] = useState("");

  const [modalModeloOpen, setModalModeloOpen] = useState(false);
  const [editingModelo, setEditingModelo] = useState<ModeloRastreador | null>(
    null,
  );
  const [nomeModelo, setNomeModelo] = useState("");
  const [marcaIdForModelo, setMarcaIdForModelo] = useState("");
  const [quantidadeCaracteresImeiModelo, setMinCaracteresImeiModelo] =
    useState("");

  const [modalOperadoraOpen, setModalOperadoraOpen] = useState(false);
  const [editingOperadora, setEditingOperadora] = useState<Operadora | null>(
    null,
  );
  const [nomeOperadora, setNomeOperadora] = useState("");

  const [modalMarcaSimcardOpen, setModalMarcaSimcardOpen] = useState(false);
  const [editingMarcaSimcard, setEditingMarcaSimcard] =
    useState<MarcaSimcard | null>(null);
  const [nomeMarcaSimcard, setNomeMarcaSimcard] = useState("");
  const [operadoraIdMarcaSimcard, setOperadoraIdMarcaSimcard] = useState("");
  const [temPlanosMarcaSimcard, setTemPlanosMarcaSimcard] = useState(false);
  const [
    quantidadeCaracteresIccidMarcaSimcard,
    setMinCaracteresIccidMarcaSimcard,
  ] = useState("");
  const [expandedMarcasSimcardIds, setExpandedMarcasSimcardIds] = useState<
    Set<number>
  >(new Set());
  const [modalPlanoSimcardOpen, setModalPlanoSimcardOpen] = useState(false);
  const [editingPlanoSimcard, setEditingPlanoSimcard] =
    useState<PlanoSimcard | null>(null);
  const [planoMbPlanoSimcard, setPlanoMbPlanoSimcard] = useState<number | "">(
    "",
  );
  const [marcaSimcardIdForPlano, setMarcaSimcardIdForPlano] = useState<
    number | null
  >(null);

  const [searchMarcasSimcard, setSearchMarcasSimcard] = useState("");

  function closeModalMarca() {
    setModalMarcaOpen(false);
    setEditingMarca(null);
    setNomeMarca("");
  }

  function closeModalModelo() {
    setModalModeloOpen(false);
    setEditingModelo(null);
    setNomeModelo("");
    setMarcaIdForModelo("");
    setMinCaracteresImeiModelo("");
  }

  function closeModalOperadora() {
    setModalOperadoraOpen(false);
    setEditingOperadora(null);
    setNomeOperadora("");
  }

  function closeModalMarcaSimcard() {
    setModalMarcaSimcardOpen(false);
    setEditingMarcaSimcard(null);
    setNomeMarcaSimcard("");
    setOperadoraIdMarcaSimcard("");
    setTemPlanosMarcaSimcard(false);
    setMinCaracteresIccidMarcaSimcard("");
  }

  function closeModalPlanoSimcard() {
    setModalPlanoSimcardOpen(false);
    setEditingPlanoSimcard(null);
    setPlanoMbPlanoSimcard("");
    setMarcaSimcardIdForPlano(null);
  }

  return {
    searchMarcas,
    setSearchMarcas,
    searchOperadoras,
    setSearchOperadoras,
    expandedMarcaIds,
    setExpandedMarcaIds,
    modalMarcaOpen,
    setModalMarcaOpen,
    editingMarca,
    setEditingMarca,
    nomeMarca,
    setNomeMarca,
    modalModeloOpen,
    setModalModeloOpen,
    editingModelo,
    setEditingModelo,
    nomeModelo,
    setNomeModelo,
    marcaIdForModelo,
    setMarcaIdForModelo,
    quantidadeCaracteresImeiModelo,
    setMinCaracteresImeiModelo,
    modalOperadoraOpen,
    setModalOperadoraOpen,
    editingOperadora,
    setEditingOperadora,
    nomeOperadora,
    setNomeOperadora,
    modalMarcaSimcardOpen,
    setModalMarcaSimcardOpen,
    editingMarcaSimcard,
    setEditingMarcaSimcard,
    nomeMarcaSimcard,
    setNomeMarcaSimcard,
    operadoraIdMarcaSimcard,
    setOperadoraIdMarcaSimcard,
    temPlanosMarcaSimcard,
    setTemPlanosMarcaSimcard,
    quantidadeCaracteresIccidMarcaSimcard,
    setMinCaracteresIccidMarcaSimcard,
    expandedMarcasSimcardIds,
    setExpandedMarcasSimcardIds,
    modalPlanoSimcardOpen,
    setModalPlanoSimcardOpen,
    editingPlanoSimcard,
    setEditingPlanoSimcard,
    planoMbPlanoSimcard,
    setPlanoMbPlanoSimcard,
    marcaSimcardIdForPlano,
    setMarcaSimcardIdForPlano,
    searchMarcasSimcard,
    setSearchMarcasSimcard,
    closeModalMarca,
    closeModalModelo,
    closeModalOperadora,
    closeModalMarcaSimcard,
    closeModalPlanoSimcard,
  };
}

export type EquipamentosConfigModalState = ReturnType<
  typeof useEquipamentosConfigModalState
>;
