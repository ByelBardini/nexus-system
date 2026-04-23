import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { toastApiError } from "@/lib/toast-api-error";
import type { PreviewResult } from "../preview/PreviewPareamentoTable";
import type { ModoPareamento } from "../domain/types";
import type { ParImeiIccid } from "../domain/types";

export function usePareamentoMainPreview(input: {
  modo: ModoPareamento;
  paresIndividual: ParImeiIccid[];
  paresMassa: ParImeiIccid[];
  podeConfirmarIndividual: boolean;
  imeiIndividual: string;
  iccidIndividual: string;
  quantidadeBate: boolean;
  imeisLength: number;
  iccidsLength: number;
  minImeiIndividual: number;
  minIccidIndividual: number;
}) {
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const lastPreviewAttemptRef = useRef<string | null>(null);

  const fetchPreview = useCallback(async () => {
    const pares =
      input.modo === "individual" ? input.paresIndividual : input.paresMassa;
    if (pares.length === 0) return null;
    return api<PreviewResult>("/aparelhos/pareamento/preview", {
      method: "POST",
      body: JSON.stringify({ pares }),
    });
  }, [input.modo, input.paresIndividual, input.paresMassa]);

  const previewMutation = useMutation({
    mutationFn: fetchPreview,
    onSuccess: (data) => setPreview(data ?? null),
    onError: (err) => toastApiError(err, "Erro ao gerar preview"),
  });

  useEffect(() => {
    if (
      input.modo !== "individual" ||
      !input.podeConfirmarIndividual ||
      preview ||
      previewMutation.isPending
    )
      return;
    const key = `${input.imeiIndividual.trim()}|${input.iccidIndividual.trim()}`;
    if (lastPreviewAttemptRef.current === key) return;
    lastPreviewAttemptRef.current = key;
    previewMutation.mutate();
  }, [
    input.modo,
    input.podeConfirmarIndividual,
    preview,
    previewMutation,
    input.imeiIndividual,
    input.iccidIndividual,
  ]);

  const handleGerarPreview = useCallback(() => {
    if (input.modo === "individual") {
      if (input.paresIndividual.length === 0) {
        const imeiMsg =
          input.minImeiIndividual > 0
            ? `${input.minImeiIndividual} dígitos`
            : "ao menos 1 dígito";
        const iccidMsg =
          input.minIccidIndividual > 0
            ? `${input.minIccidIndividual} dígitos`
            : "ao menos 1 dígito";
        toast.error(`Informe IMEI (${imeiMsg}) e ICCID (${iccidMsg})`);
        return;
      }
    } else {
      if (!input.quantidadeBate) {
        toast.error(
          `Quantidade não confere: ${input.imeisLength} IMEIs x ${input.iccidsLength} ICCIDs`,
        );
        return;
      }
      if (input.paresMassa.length === 0) {
        toast.error("Cole as listas de IMEIs e ICCIDs");
        return;
      }
    }
    previewMutation.mutate();
  }, [
    input.modo,
    input.paresIndividual,
    input.paresMassa,
    input.quantidadeBate,
    input.imeisLength,
    input.iccidsLength,
    input.minImeiIndividual,
    input.minIccidIndividual,
    previewMutation,
  ]);

  return {
    preview,
    setPreview,
    previewMutation,
    handleGerarPreview,
    lastPreviewAttemptRef,
  };
}
