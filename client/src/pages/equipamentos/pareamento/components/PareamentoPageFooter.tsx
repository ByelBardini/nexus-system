import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MaterialIcon } from "@/components/MaterialIcon";
import type { ModoPareamento } from "../domain/types";

type Props = {
  modo: ModoPareamento;
  onLimparIndividual: () => void;
  onLimparMassa: () => void;
  onLimparCsv: () => void;
  onGerarPreview: () => void;
  onConfirmarPareamento: () => void;
  onValidarCsv: () => void;
  onConfirmarImportacaoCsv: () => void;
  podeConfirmarIndividual: boolean;
  quantidadeBate: boolean;
  paresMassaLength: number;
  podeConfirmarPareamentoIndividual: boolean;
  podeConfirmarMassa: boolean;
  previewMutationPending: boolean;
  pareamentoMutationPending: boolean;
  csvLinhasLength: number;
  csvPodeImportar: boolean;
  csvPreviewMutationPending: boolean;
  csvImportarMutationPending: boolean;
};

export function PareamentoPageFooter(props: Props) {
  return (
    <footer className="fixed bottom-0 left-60 right-0 z-30 flex h-20 items-center justify-end gap-4 border-t border-slate-200 bg-white px-8 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
      {props.modo === "individual" ? (
        <>
          <Button
            type="button"
            variant="ghost"
            onClick={props.onLimparIndividual}
            className="h-11 px-6 text-[11px] font-bold uppercase text-slate-500"
          >
            Limpar Campos
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={props.onGerarPreview}
            disabled={
              !props.podeConfirmarIndividual || props.previewMutationPending
            }
            className="h-11 px-6 text-[11px] font-bold uppercase"
          >
            {props.previewMutationPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Verificar"
            )}
          </Button>
          <Button
            type="button"
            onClick={props.onConfirmarPareamento}
            disabled={
              !props.podeConfirmarPareamentoIndividual ||
              props.pareamentoMutationPending
            }
            className="h-11 gap-2 px-8 bg-erp-blue text-[11px] font-bold uppercase hover:bg-blue-700"
          >
            {props.pareamentoMutationPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MaterialIcon name="link" className="text-lg" />
            )}
            Confirmar Pareamento
          </Button>
        </>
      ) : props.modo === "csv" ? (
        <>
          <Button
            type="button"
            variant="outline"
            onClick={props.onLimparCsv}
            className="h-11 px-6 text-[11px] font-bold uppercase text-slate-500"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={props.onValidarCsv}
            disabled={
              props.csvLinhasLength === 0 || props.csvPreviewMutationPending
            }
            variant="outline"
            className="h-11 px-6 text-[11px] font-bold uppercase"
          >
            {props.csvPreviewMutationPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Validar CSV"
            )}
          </Button>
          <Button
            type="button"
            onClick={props.onConfirmarImportacaoCsv}
            disabled={
              !props.csvPodeImportar || props.csvImportarMutationPending
            }
            className="h-11 gap-2 px-8 bg-erp-blue text-[11px] font-bold uppercase shadow-lg shadow-blue-500/20 hover:bg-blue-700"
          >
            {props.csvImportarMutationPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MaterialIcon name="upload" className="text-lg" />
            )}
            Confirmar Importação
          </Button>
        </>
      ) : (
        <>
          <Button
            type="button"
            variant="outline"
            onClick={props.onLimparMassa}
            className="h-11 px-6 text-[11px] font-bold uppercase text-slate-500"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={props.onGerarPreview}
            disabled={!props.quantidadeBate || props.paresMassaLength === 0}
            variant="outline"
            className="h-11 px-6 text-[11px] font-bold uppercase"
          >
            {props.previewMutationPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Gerar Preview"
            )}
          </Button>
          <Button
            type="button"
            onClick={props.onConfirmarPareamento}
            disabled={
              !props.podeConfirmarMassa || props.pareamentoMutationPending
            }
            className="h-11 gap-2 px-8 bg-erp-blue text-[11px] font-bold uppercase shadow-lg shadow-blue-500/20 hover:bg-blue-700"
          >
            {props.pareamentoMutationPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MaterialIcon
                name="settings_input_component"
                className="text-lg"
              />
            )}
            Criar Equipamentos
          </Button>
        </>
      )}
    </footer>
  );
}
