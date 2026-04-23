import { useState } from "react";

/** Lotes e buscas compartilhados entre modos individual e massa. */
export function usePareamentoSharedLotesState() {
  const [loteRastreadorId, setLoteRastreadorId] = useState<string>("");
  const [loteSimId, setLoteSimId] = useState<string>("");
  const [loteBuscaRastreador, setLoteBuscaRastreador] = useState("");
  const [loteBuscaSim, setLoteBuscaSim] = useState("");

  return {
    loteRastreadorId,
    setLoteRastreadorId,
    loteSimId,
    setLoteSimId,
    loteBuscaRastreador,
    setLoteBuscaRastreador,
    loteBuscaSim,
    setLoteBuscaSim,
  };
}
