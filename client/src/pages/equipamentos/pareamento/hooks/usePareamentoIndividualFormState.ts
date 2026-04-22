import { useState } from "react";
import type { ProprietarioTipo } from "../domain/types";

export function usePareamentoIndividualFormState() {
  const [imeiIndividual, setImeiIndividual] = useState("");
  const [iccidIndividual, setIccidIndividual] = useState("");
  const [pertenceLoteRastreador, setPertenceLoteRastreador] = useState(false);
  const [pertenceLoteSim, setPertenceLoteSim] = useState(false);
  const [marcaRastreador, setMarcaRastreador] = useState("");
  const [modeloRastreador, setModeloRastreador] = useState("");
  const [operadoraSim, setOperadoraSim] = useState("");
  const [marcaSimcardIdSim, setMarcaSimcardIdSim] = useState("");
  const [planoSimcardIdSim, setPlanoSimcardIdSim] = useState("");
  const [proprietarioIndividual, setProprietarioIndividual] =
    useState<ProprietarioTipo>("INFINITY");
  const [clienteIdIndividual, setClienteIdIndividual] = useState<
    number | null
  >(null);
  const [quantidadeCriada, setQuantidadeCriada] = useState(0);
  const [criarNovoRastreador, setCriarNovoRastreador] = useState(false);
  const [criarNovoSim, setCriarNovoSim] = useState(false);

  return {
    imeiIndividual,
    setImeiIndividual,
    iccidIndividual,
    setIccidIndividual,
    pertenceLoteRastreador,
    setPertenceLoteRastreador,
    pertenceLoteSim,
    setPertenceLoteSim,
    marcaRastreador,
    setMarcaRastreador,
    modeloRastreador,
    setModeloRastreador,
    operadoraSim,
    setOperadoraSim,
    marcaSimcardIdSim,
    setMarcaSimcardIdSim,
    planoSimcardIdSim,
    setPlanoSimcardIdSim,
    proprietarioIndividual,
    setProprietarioIndividual,
    clienteIdIndividual,
    setClienteIdIndividual,
    quantidadeCriada,
    setQuantidadeCriada,
    criarNovoRastreador,
    setCriarNovoRastreador,
    criarNovoSim,
    setCriarNovoSim,
  };
}
