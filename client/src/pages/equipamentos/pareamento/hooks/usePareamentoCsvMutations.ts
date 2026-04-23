import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { toastApiError } from "@/lib/toast-api-error";
import { pareamentoQueryKeys } from "../domain/query-keys";
import type { CsvLinhaInput } from "../domain/types";
import type { ProprietarioTipo } from "../domain/types";
import type { CsvPreviewResult } from "../preview/PreviewCsvTable";
import { useRef } from "react";

export function usePareamentoCsvMutations(options: {
  csvLinhas: CsvLinhaInput[];
  proprietarioCsv: ProprietarioTipo;
  clienteIdCsv: number | null;
  setCsvPreview: (v: CsvPreviewResult | null) => void;
  onImportSuccess: () => void;
  queryClient?: QueryClient;
}) {
  const qc = useQueryClient();
  const client = options.queryClient ?? qc;

  const optsRef = useRef(options);
  optsRef.current = options;

  const csvPreviewMutation = useMutation({
    mutationFn: async () => {
      const o = optsRef.current;
      return api<CsvPreviewResult>("/aparelhos/pareamento/csv/preview", {
        method: "POST",
        body: JSON.stringify({
          linhas: o.csvLinhas,
          proprietario: o.proprietarioCsv,
          clienteId: o.clienteIdCsv ?? undefined,
        }),
      });
    },
    onSuccess: (data) => optsRef.current.setCsvPreview(data),
    onError: (err) => toastApiError(err, "Erro ao gerar preview"),
  });

  const csvImportarMutation = useMutation({
    mutationFn: async () => {
      const o = optsRef.current;
      return api<{ criados: number }>("/aparelhos/pareamento/csv", {
        method: "POST",
        body: JSON.stringify({
          linhas: o.csvLinhas,
          proprietario: o.proprietarioCsv,
          clienteId: o.clienteIdCsv ?? undefined,
        }),
      });
    },
    onSuccess: (data) => {
      client.invalidateQueries({ queryKey: ["aparelhos"] });
      client.invalidateQueries({
        queryKey: pareamentoQueryKeys.lotesRastreadores,
      });
      client.invalidateQueries({
        queryKey: pareamentoQueryKeys.lotesSims,
      });
      toast.success(
        `${data?.criados ?? 0} equipamento(s) importado(s) com sucesso!`,
      );
      optsRef.current.onImportSuccess();
    },
    onError: (err) => toastApiError(err, "Erro ao importar CSV"),
  });

  return { csvPreviewMutation, csvImportarMutation };
}
