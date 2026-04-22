import { useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Papa from "papaparse";
import {
  gerarTemplateCsv,
  computeMassaLists,
  processCsvRowsFromPapa,
  normalizarCabecalho,
} from "./domain/parsing";
import {
  limparCsvForm,
  limparIndividualFormComPreview,
  resetIndividualFormAfterPareamentoSuccess,
  resetMassaFormAndPreview,
} from "./domain/pareamento-form-reset";
import {
  computeMinImeiRastreador,
  computeMinIccidSim,
  computeParesIndividual,
  computePodeConfirmarIndividual,
  computePodeConfirmarPareamentoIndividual,
  computePodeConfirmarMassa,
  computeProgressoVinculoIndividual,
  loteIdValidoSelecionado,
} from "./domain/preview-rules";
import { usePareamentoModoFromSearchParams } from "./hooks/usePareamentoModoFromSearchParams";
import { usePareamentoRemoteQueries } from "./hooks/usePareamentoRemoteQueries";
import { usePareamentoCatalogDerivados } from "./hooks/usePareamentoCatalogDerivados";
import { usePareamentoIndividualFormState } from "./hooks/usePareamentoIndividualFormState";
import { usePareamentoMassaFormState } from "./hooks/usePareamentoMassaFormState";
import { usePareamentoCsvState } from "./hooks/usePareamentoCsvState";
import { usePareamentoSharedLotesState } from "./hooks/usePareamentoSharedLotesState";
import { usePareamentoMainPreview } from "./hooks/usePareamentoMainPreview";
import { usePareamentoSubmitMutation } from "./hooks/usePareamentoSubmitMutation";
import { usePareamentoCsvMutations } from "./hooks/usePareamentoCsvMutations";
import { PareamentoPageHeader } from "./components/PareamentoPageHeader";
import { PareamentoPageFooter } from "./components/PareamentoPageFooter";
import { PareamentoIndividualPanel } from "./panels/PareamentoIndividualPanel";
import { PareamentoMassaPanel } from "./panels/PareamentoMassaPanel";
import { PareamentoCsvPanel } from "./panels/PareamentoCsvPanel";

export function PareamentoPage() {
  const queryClient = useQueryClient();
  const { modo, setModo } = usePareamentoModoFromSearchParams();

  const individual = usePareamentoIndividualFormState();
  const {
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
  } = individual;

  const massa = usePareamentoMassaFormState();
  const {
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
  } = massa;

  const csv = usePareamentoCsvState();
  const {
    csvFileName,
    setCsvFileName,
    csvLinhas,
    setCsvLinhas,
    csvParseErro,
    setCsvParseErro,
    csvPreview,
    setCsvPreview,
    proprietarioCsv,
    setProprietarioCsv,
    clienteIdCsv,
    setClienteIdCsv,
    csvFileInputRef,
  } = csv;

  const lotes = usePareamentoSharedLotesState();
  const {
    loteRastreadorId,
    setLoteRastreadorId,
    loteSimId,
    setLoteSimId,
    loteBuscaRastreador,
    setLoteBuscaRastreador,
    loteBuscaSim,
    setLoteBuscaSim,
  } = lotes;

  const { imeis, iccids, quantidadeBate, paresMassa } = useMemo(
    () => computeMassaLists(textImeis, textIccids),
    [textImeis, textIccids],
  );

  const remote = usePareamentoRemoteQueries({
    modo,
    proprietarioIndividual,
    proprietarioMassa,
    proprietarioCsv,
    loteBuscaRastreador,
    loteBuscaSim,
  });

  const {
    lotesRastreadoresFiltrados,
    lotesSimsFiltrados,
    marcasAtivas,
    operadorasAtivas,
    modelos,
    marcasSimcard,
    clientes,
  } = remote;

  const {
    modelosPorMarca,
    modelosPorMarcaMassa,
    marcasSimcardPorOperadora,
    marcasSimcardPorOperadoraMassa,
  } = usePareamentoCatalogDerivados({
    marcaRastreador,
    marcaRastreadorMassa,
    operadoraSim,
    operadoraSimMassa,
    marcasAtivas,
    modelos,
    operadorasAtivas,
    marcasSimcard,
  });

  const minImeiIndividual = useMemo(
    () =>
      computeMinImeiRastreador(
        pertenceLoteRastreador,
        modeloRastreador,
        modelosPorMarca,
      ),
    [pertenceLoteRastreador, modeloRastreador, modelosPorMarca],
  );

  const minIccidIndividual = useMemo(
    () =>
      computeMinIccidSim(pertenceLoteSim, marcaSimcardIdSim, marcasSimcard),
    [pertenceLoteSim, marcaSimcardIdSim, marcasSimcard],
  );

  const minImeiMassa = useMemo(
    () =>
      computeMinImeiRastreador(
        pertenceLoteRastreadorMassa,
        modeloRastreadorMassa,
        modelosPorMarcaMassa,
      ),
    [
      pertenceLoteRastreadorMassa,
      modeloRastreadorMassa,
      modelosPorMarcaMassa,
    ],
  );

  const minIccidMassa = useMemo(
    () =>
      computeMinIccidSim(
        pertenceLoteSimMassa,
        marcaSimcardIdSimMassa,
        marcasSimcard,
      ),
    [pertenceLoteSimMassa, marcaSimcardIdSimMassa, marcasSimcard],
  );

  const paresIndividual = useMemo(
    () =>
      computeParesIndividual(
        imeiIndividual,
        iccidIndividual,
        minImeiIndividual,
        minIccidIndividual,
      ),
    [
      imeiIndividual,
      iccidIndividual,
      minImeiIndividual,
      minIccidIndividual,
    ],
  );

  const podeConfirmarIndividual = useMemo(
    () =>
      computePodeConfirmarIndividual(
        imeiIndividual,
        iccidIndividual,
        minImeiIndividual,
        minIccidIndividual,
      ),
    [
      imeiIndividual,
      iccidIndividual,
      minImeiIndividual,
      minIccidIndividual,
    ],
  );

  const {
    preview,
    setPreview,
    previewMutation,
    handleGerarPreview,
    lastPreviewAttemptRef,
  } = usePareamentoMainPreview({
    modo,
    paresIndividual,
    paresMassa,
    podeConfirmarIndividual,
    imeiIndividual,
    iccidIndividual,
    quantidadeBate,
    imeisLength: imeis.length,
    iccidsLength: iccids.length,
    minImeiIndividual,
    minIccidIndividual,
  });

  const loteRastreadorSelecionado = useMemo(
    () =>
      loteIdValidoSelecionado(
        criarNovoRastreador,
        pertenceLoteRastreador,
        loteRastreadorId,
      ),
    [criarNovoRastreador, pertenceLoteRastreador, loteRastreadorId],
  );

  const loteSimSelecionado = useMemo(
    () =>
      loteIdValidoSelecionado(criarNovoSim, pertenceLoteSim, loteSimId),
    [criarNovoSim, pertenceLoteSim, loteSimId],
  );

  const progressoVinculoIndividual = useMemo(
    () =>
      computeProgressoVinculoIndividual({
        imeiIndividual,
        iccidIndividual,
        minImeiIndividual,
        minIccidIndividual,
        criarNovoRastreador,
        criarNovoSim,
        pertenceLoteRastreador,
        pertenceLoteSim,
        loteRastreadorSelecionado,
        loteSimSelecionado,
        marcaRastreador,
        modeloRastreador,
        marcaSimcardIdSim,
        operadoraSim,
      }),
    [
      imeiIndividual,
      iccidIndividual,
      minImeiIndividual,
      minIccidIndividual,
      criarNovoRastreador,
      criarNovoSim,
      pertenceLoteRastreador,
      pertenceLoteSim,
      loteRastreadorSelecionado,
      loteSimSelecionado,
      marcaRastreador,
      modeloRastreador,
      marcaSimcardIdSim,
      operadoraSim,
    ],
  );

  const podeConfirmarPareamentoIndividual = useMemo(
    () =>
      computePodeConfirmarPareamentoIndividual(
        podeConfirmarIndividual,
        preview,
        {
          criarNovoRastreador,
          criarNovoSim,
          loteRastreadorId,
          loteSimId,
          pertenceLoteRastreador,
          pertenceLoteSim,
          marcaRastreador,
          modeloRastreador,
          marcaSimcardIdSim,
          operadoraSim,
        },
      ),
    [
      podeConfirmarIndividual,
      preview,
      criarNovoRastreador,
      criarNovoSim,
      loteRastreadorId,
      loteSimId,
      pertenceLoteRastreador,
      pertenceLoteSim,
      marcaRastreador,
      modeloRastreador,
      marcaSimcardIdSim,
      operadoraSim,
    ],
  );

  const podeConfirmarMassa = useMemo(
    () =>
      computePodeConfirmarMassa(quantidadeBate, paresMassa, preview, {
        criarNovoRastreadorMassa,
        criarNovoSimMassa,
        loteRastreadorId,
        loteSimId,
        pertenceLoteRastreadorMassa,
        pertenceLoteSimMassa,
        marcaRastreadorMassa,
        modeloRastreadorMassa,
        marcaSimcardIdSimMassa,
        operadoraSimMassa,
      }),
    [
      quantidadeBate,
      paresMassa,
      preview,
      criarNovoRastreadorMassa,
      criarNovoSimMassa,
      loteRastreadorId,
      loteSimId,
      pertenceLoteRastreadorMassa,
      pertenceLoteSimMassa,
      marcaRastreadorMassa,
      modeloRastreadorMassa,
      marcaSimcardIdSimMassa,
      operadoraSimMassa,
    ],
  );

  const getPostBodyInput = useCallback(
    () => ({
      modo: (modo === "individual" ? "individual" : "massa") as
        | "individual"
        | "massa",
      paresIndividual,
      preview,
      proprietario:
        modo === "individual" ? proprietarioIndividual : proprietarioMassa,
      clienteId:
        modo === "individual" ? clienteIdIndividual : clienteIdMassa,
      loteRastreadorId,
      loteSimId,
      criarNovoRastreador,
      criarNovoSim,
      pertenceLoteRastreador,
      pertenceLoteSim,
      marcaRastreador,
      modeloRastreador,
      marcaSimcardIdSim,
      planoSimcardIdSim,
      operadoraSim,
      criarNovoRastreadorMassa,
      criarNovoSimMassa,
      pertenceLoteRastreadorMassa,
      pertenceLoteSimMassa,
      marcaRastreadorMassa,
      modeloRastreadorMassa,
      marcaSimcardIdSimMassa,
      planoSimcardIdSimMassa,
      operadoraSimMassa,
    }),
    [
      modo,
      paresIndividual,
      preview,
      proprietarioIndividual,
      proprietarioMassa,
      clienteIdIndividual,
      clienteIdMassa,
      loteRastreadorId,
      loteSimId,
      criarNovoRastreador,
      criarNovoSim,
      pertenceLoteRastreador,
      pertenceLoteSim,
      marcaRastreador,
      modeloRastreador,
      marcaSimcardIdSim,
      planoSimcardIdSim,
      operadoraSim,
      criarNovoRastreadorMassa,
      criarNovoSimMassa,
      pertenceLoteRastreadorMassa,
      pertenceLoteSimMassa,
      marcaRastreadorMassa,
      modeloRastreadorMassa,
      marcaSimcardIdSimMassa,
      planoSimcardIdSimMassa,
      operadoraSimMassa,
    ],
  );

  const pareamentoMutation = usePareamentoSubmitMutation({
    getModo: () => modo,
    getPostBodyInput,
    setQuantidadeCriada,
    queryClient,
    onIndividualSuccess: () =>
      resetIndividualFormAfterPareamentoSuccess({
        setImeiIndividual,
        setIccidIndividual,
        setCriarNovoRastreador,
        setCriarNovoSim,
        setPertenceLoteRastreador,
        setPertenceLoteSim,
        setMarcaRastreador,
        setModeloRastreador,
        setOperadoraSim,
        setMarcaSimcardIdSim,
        setPlanoSimcardIdSim,
        setLoteRastreadorId,
        setLoteSimId,
        setProprietarioIndividual,
        setClienteIdIndividual,
      }),
    onMassaSuccess: () =>
      resetMassaFormAndPreview({
        setTextImeis,
        setTextIccids,
        setCriarNovoRastreadorMassa,
        setCriarNovoSimMassa,
        setLoteRastreadorId,
        setLoteSimId,
        setPertenceLoteRastreadorMassa,
        setPertenceLoteSimMassa,
        setMarcaRastreadorMassa,
        setModeloRastreadorMassa,
        setOperadoraSimMassa,
        setMarcaSimcardIdSimMassa,
        setPlanoSimcardIdSimMassa,
        setProprietarioMassa,
        setClienteIdMassa,
        setPreview,
      }),
  });

  const limparCsv = useCallback(
    () =>
      limparCsvForm({
        setCsvFileName,
        setCsvLinhas,
        setCsvParseErro,
        setCsvPreview,
        setProprietarioCsv,
        setClienteIdCsv,
        csvFileInputRef,
      }),
    [
      setCsvFileName,
      setCsvLinhas,
      setCsvParseErro,
      setCsvPreview,
      setProprietarioCsv,
      setClienteIdCsv,
      csvFileInputRef,
    ],
  );

  const { csvPreviewMutation, csvImportarMutation } =
    usePareamentoCsvMutations({
      csvLinhas,
      proprietarioCsv,
      clienteIdCsv,
      setCsvPreview,
      onImportSuccess: limparCsv,
      queryClient,
    });

  const limparIndividual = useCallback(
    () =>
      limparIndividualFormComPreview({
        setImeiIndividual,
        setIccidIndividual,
        setCriarNovoRastreador,
        setCriarNovoSim,
        setPertenceLoteRastreador,
        setPertenceLoteSim,
        setMarcaRastreador,
        setModeloRastreador,
        setOperadoraSim,
        setMarcaSimcardIdSim,
        setPlanoSimcardIdSim,
        setLoteRastreadorId,
        setLoteSimId,
        setProprietarioIndividual,
        setClienteIdIndividual,
        setPreview,
        lastPreviewAttemptRef,
      }),
    [
      setImeiIndividual,
      setIccidIndividual,
      setCriarNovoRastreador,
      setCriarNovoSim,
      setPertenceLoteRastreador,
      setPertenceLoteSim,
      setMarcaRastreador,
      setModeloRastreador,
      setOperadoraSim,
      setMarcaSimcardIdSim,
      setPlanoSimcardIdSim,
      setLoteRastreadorId,
      setLoteSimId,
      setProprietarioIndividual,
      setClienteIdIndividual,
      setPreview,
      lastPreviewAttemptRef,
    ],
  );

  const limparMassa = useCallback(
    () =>
      resetMassaFormAndPreview({
        setTextImeis,
        setTextIccids,
        setCriarNovoRastreadorMassa,
        setCriarNovoSimMassa,
        setLoteRastreadorId,
        setLoteSimId,
        setPertenceLoteRastreadorMassa,
        setPertenceLoteSimMassa,
        setMarcaRastreadorMassa,
        setModeloRastreadorMassa,
        setOperadoraSimMassa,
        setMarcaSimcardIdSimMassa,
        setPlanoSimcardIdSimMassa,
        setProprietarioMassa,
        setClienteIdMassa,
        setPreview,
      }),
    [
      setTextImeis,
      setTextIccids,
      setCriarNovoRastreadorMassa,
      setCriarNovoSimMassa,
      setLoteRastreadorId,
      setLoteSimId,
      setPertenceLoteRastreadorMassa,
      setPertenceLoteSimMassa,
      setMarcaRastreadorMassa,
      setModeloRastreadorMassa,
      setOperadoraSimMassa,
      setMarcaSimcardIdSimMassa,
      setPlanoSimcardIdSimMassa,
      setProprietarioMassa,
      setClienteIdMassa,
      setPreview,
    ],
  );

  const csvTemErros = useMemo(
    () => (csvPreview?.contadores.erros ?? 0) > 0,
    [csvPreview],
  );

  const csvPodeImportar =
    csvLinhas.length > 0 &&
    csvPreview !== null &&
    !csvTemErros &&
    (proprietarioCsv === "INFINITY" || clienteIdCsv !== null);

  const handleBaixarTemplateCsv = () => {
    const conteudo = gerarTemplateCsv();
    const blob = new Blob([`\uFEFF${conteudo}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template-pareamento.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUploadCsv = (file: File) => {
    setCsvParseErro("");
    setCsvPreview(null);
    setCsvLinhas([]);
    setCsvFileName(file.name);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => normalizarCabecalho(h),
      complete: (result) => {
        const outcome = processCsvRowsFromPapa(
          result.data,
          (result.errors ?? []).map((e) => ({ message: e.message })),
        );
        if (!outcome.ok) {
          setCsvParseErro(outcome.error);
          return;
        }
        setCsvLinhas(outcome.linhas);
      },
      error: (err) => {
        setCsvParseErro(`Erro ao ler CSV: ${err.message}`);
      },
    });
  };

  return (
    <div className="-m-4 min-h-[100dvh] flex flex-col bg-slate-100">
      <PareamentoPageHeader modo={modo} onModoChange={setModo} />

      <div className="flex-1 overflow-y-auto p-6 pb-32">
        <div className="mx-auto max-w-[1400px]">
          {modo === "individual" && (
            <PareamentoIndividualPanel
              imeiIndividual={imeiIndividual}
              setImeiIndividual={setImeiIndividual}
              iccidIndividual={iccidIndividual}
              setIccidIndividual={setIccidIndividual}
              criarNovoRastreador={criarNovoRastreador}
              setCriarNovoRastreador={setCriarNovoRastreador}
              pertenceLoteRastreador={pertenceLoteRastreador}
              setPertenceLoteRastreador={setPertenceLoteRastreador}
              loteRastreadorId={loteRastreadorId}
              setLoteRastreadorId={setLoteRastreadorId}
              loteBuscaRastreador={loteBuscaRastreador}
              setLoteBuscaRastreador={setLoteBuscaRastreador}
              marcaRastreador={marcaRastreador}
              setMarcaRastreador={setMarcaRastreador}
              modeloRastreador={modeloRastreador}
              setModeloRastreador={setModeloRastreador}
              criarNovoSim={criarNovoSim}
              setCriarNovoSim={setCriarNovoSim}
              pertenceLoteSim={pertenceLoteSim}
              setPertenceLoteSim={setPertenceLoteSim}
              loteSimId={loteSimId}
              setLoteSimId={setLoteSimId}
              loteBuscaSim={loteBuscaSim}
              setLoteBuscaSim={setLoteBuscaSim}
              operadoraSim={operadoraSim}
              setOperadoraSim={setOperadoraSim}
              marcaSimcardIdSim={marcaSimcardIdSim}
              setMarcaSimcardIdSim={setMarcaSimcardIdSim}
              planoSimcardIdSim={planoSimcardIdSim}
              setPlanoSimcardIdSim={setPlanoSimcardIdSim}
              proprietarioIndividual={proprietarioIndividual}
              setProprietarioIndividual={setProprietarioIndividual}
              clienteIdIndividual={clienteIdIndividual}
              setClienteIdIndividual={setClienteIdIndividual}
              preview={preview}
              quantidadeCriada={quantidadeCriada}
              podeConfirmarIndividual={podeConfirmarIndividual}
              podeConfirmarPareamentoIndividual={
                podeConfirmarPareamentoIndividual
              }
              progressoVinculoIndividual={progressoVinculoIndividual}
              minImeiIndividual={minImeiIndividual}
              minIccidIndividual={minIccidIndividual}
              lotesRastreadoresFiltrados={lotesRastreadoresFiltrados}
              lotesSimsFiltrados={lotesSimsFiltrados}
              marcasAtivas={marcasAtivas}
              modelosPorMarca={modelosPorMarca}
              operadorasAtivas={operadorasAtivas}
              marcasSimcardPorOperadora={marcasSimcardPorOperadora}
              marcasSimcard={marcasSimcard}
              clientes={clientes}
            />
          )}

          {modo === "massa" && (
            <PareamentoMassaPanel
              textImeis={textImeis}
              setTextImeis={setTextImeis}
              textIccids={textIccids}
              setTextIccids={setTextIccids}
              minImeiMassa={minImeiMassa}
              minIccidMassa={minIccidMassa}
              imeisLen={imeis.length}
              iccidsLen={iccids.length}
              quantidadeBate={quantidadeBate}
              paresMassa={paresMassa}
              preview={preview}
              criarNovoRastreadorMassa={criarNovoRastreadorMassa}
              setCriarNovoRastreadorMassa={setCriarNovoRastreadorMassa}
              pertenceLoteRastreadorMassa={pertenceLoteRastreadorMassa}
              setPertenceLoteRastreadorMassa={setPertenceLoteRastreadorMassa}
              criarNovoSimMassa={criarNovoSimMassa}
              setCriarNovoSimMassa={setCriarNovoSimMassa}
              pertenceLoteSimMassa={pertenceLoteSimMassa}
              setPertenceLoteSimMassa={setPertenceLoteSimMassa}
              loteRastreadorId={loteRastreadorId}
              setLoteRastreadorId={setLoteRastreadorId}
              loteSimId={loteSimId}
              setLoteSimId={setLoteSimId}
              loteBuscaRastreador={loteBuscaRastreador}
              setLoteBuscaRastreador={setLoteBuscaRastreador}
              loteBuscaSim={loteBuscaSim}
              setLoteBuscaSim={setLoteBuscaSim}
              marcaRastreadorMassa={marcaRastreadorMassa}
              setMarcaRastreadorMassa={setMarcaRastreadorMassa}
              modeloRastreadorMassa={modeloRastreadorMassa}
              setModeloRastreadorMassa={setModeloRastreadorMassa}
              operadoraSimMassa={operadoraSimMassa}
              setOperadoraSimMassa={setOperadoraSimMassa}
              marcaSimcardIdSimMassa={marcaSimcardIdSimMassa}
              setMarcaSimcardIdSimMassa={setMarcaSimcardIdSimMassa}
              planoSimcardIdSimMassa={planoSimcardIdSimMassa}
              setPlanoSimcardIdSimMassa={setPlanoSimcardIdSimMassa}
              proprietarioMassa={proprietarioMassa}
              setProprietarioMassa={setProprietarioMassa}
              clienteIdMassa={clienteIdMassa}
              setClienteIdMassa={setClienteIdMassa}
              lotesRastreadoresFiltrados={lotesRastreadoresFiltrados}
              lotesSimsFiltrados={lotesSimsFiltrados}
              marcasAtivas={marcasAtivas}
              modelosPorMarcaMassa={modelosPorMarcaMassa}
              operadorasAtivas={operadorasAtivas}
              marcasSimcardPorOperadoraMassa={marcasSimcardPorOperadoraMassa}
              marcasSimcard={marcasSimcard}
              clientes={clientes}
            />
          )}

          {modo === "csv" && (
            <PareamentoCsvPanel
              csvFileInputRef={csvFileInputRef}
              csvFileName={csvFileName}
              csvLinhas={csvLinhas}
              csvParseErro={csvParseErro}
              csvPreview={csvPreview}
              proprietarioCsv={proprietarioCsv}
              setProprietarioCsv={setProprietarioCsv}
              clienteIdCsv={clienteIdCsv}
              setClienteIdCsv={setClienteIdCsv}
              clientes={clientes}
              onBaixarTemplate={handleBaixarTemplateCsv}
              onFileSelected={handleUploadCsv}
              onEscolherArquivoClick={() =>
                csvFileInputRef.current?.click()
              }
            />
          )}
        </div>
      </div>

      <PareamentoPageFooter
        modo={modo}
        onLimparIndividual={limparIndividual}
        onLimparMassa={limparMassa}
        onLimparCsv={limparCsv}
        onGerarPreview={handleGerarPreview}
        onConfirmarPareamento={() => pareamentoMutation.mutate()}
        onValidarCsv={() => csvPreviewMutation.mutate()}
        onConfirmarImportacaoCsv={() => csvImportarMutation.mutate()}
        podeConfirmarIndividual={podeConfirmarIndividual}
        quantidadeBate={quantidadeBate}
        paresMassaLength={paresMassa.length}
        podeConfirmarPareamentoIndividual={
          podeConfirmarPareamentoIndividual
        }
        podeConfirmarMassa={podeConfirmarMassa}
        previewMutationPending={previewMutation.isPending}
        pareamentoMutationPending={pareamentoMutation.isPending}
        csvLinhasLength={csvLinhas.length}
        csvPodeImportar={csvPodeImportar}
        csvPreviewMutationPending={csvPreviewMutation.isPending}
        csvImportarMutationPending={csvImportarMutation.isPending}
      />
    </div>
  );
}
