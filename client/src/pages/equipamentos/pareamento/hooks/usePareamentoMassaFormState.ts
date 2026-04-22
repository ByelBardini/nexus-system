import { useState } from "react";
import type { ProprietarioTipo } from "../domain/types";

export function usePareamentoMassaFormState() {
  const [textImeis, setTextImeis] = useState("");
  const [textIccids, setTextIccids] = useState("");
  const [pertenceLoteRastreadorMassa, setPertenceLoteRastreadorMassa] =
    useState(true);
  const [pertenceLoteSimMassa, setPertenceLoteSimMassa] = useState(true);
  const [marcaRastreadorMassa, setMarcaRastreadorMassa] = useState("");
  const [modeloRastreadorMassa, setModeloRastreadorMassa] = useState("");
  const [operadoraSimMassa, setOperadoraSimMassa] = useState("");
  const [marcaSimcardIdSimMassa, setMarcaSimcardIdSimMassa] = useState("");
  const [planoSimcardIdSimMassa, setPlanoSimcardIdSimMassa] = useState("");
  const [proprietarioMassa, setProprietarioMassa] =
    useState<ProprietarioTipo>("INFINITY");
  const [clienteIdMassa, setClienteIdMassa] = useState<number | null>(null);
  const [criarNovoRastreadorMassa, setCriarNovoRastreadorMassa] =
    useState(false);
  const [criarNovoSimMassa, setCriarNovoSimMassa] = useState(false);

  return {
    textImeis,
    setTextImeis,
    textIccids,
    setTextIccids,
    pertenceLoteRastreadorMassa,
    setPertenceLoteRastreadorMassa,
    pertenceLoteSimMassa,
    setPertenceLoteSimMassa,
    marcaRastreadorMassa,
    setMarcaRastreadorMassa,
    modeloRastreadorMassa,
    setModeloRastreadorMassa,
    operadoraSimMassa,
    setOperadoraSimMassa,
    marcaSimcardIdSimMassa,
    setMarcaSimcardIdSimMassa,
    planoSimcardIdSimMassa,
    setPlanoSimcardIdSimMassa,
    proprietarioMassa,
    setProprietarioMassa,
    clienteIdMassa,
    setClienteIdMassa,
    criarNovoRastreadorMassa,
    setCriarNovoRastreadorMassa,
    criarNovoSimMassa,
    setCriarNovoSimMassa,
  };
}
