import { useRef, useState } from "react";
import type { CsvLinhaInput } from "../domain/types";
import type { ProprietarioTipo } from "../domain/types";
import type { CsvPreviewResult } from "../preview/PreviewCsvTable";

export function usePareamentoCsvState() {
  const [csvFileName, setCsvFileName] = useState<string>("");
  const [csvLinhas, setCsvLinhas] = useState<CsvLinhaInput[]>([]);
  const [csvParseErro, setCsvParseErro] = useState<string>("");
  const [csvPreview, setCsvPreview] = useState<CsvPreviewResult | null>(null);
  const [proprietarioCsv, setProprietarioCsv] =
    useState<ProprietarioTipo>("INFINITY");
  const [clienteIdCsv, setClienteIdCsv] = useState<number | null>(null);
  const csvFileInputRef = useRef<HTMLInputElement | null>(null);

  return {
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
  };
}
