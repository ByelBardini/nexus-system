import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ModalSelecaoEKitProps } from "./modal-selecao-ekit.types";
import { useModalSelecaoEKit } from "./hooks/useModalSelecaoEKit";
import { ModalSelecaoEKitSelecaoStep } from "./components/ModalSelecaoEKitSelecaoStep";
import { ModalSelecaoEKitEdicaoStep } from "./components/ModalSelecaoEKitEdicaoStep";

export type { ModalSelecaoEKitProps } from "./modal-selecao-ekit.types";

export function ModalSelecaoEKit(props: ModalSelecaoEKitProps) {
  const ctl = useModalSelecaoEKit(props);

  return (
    <Dialog open={props.open} onOpenChange={(o) => !o && ctl.handleClose()}>
      <DialogContent
        hideClose
        className={cn(
          "max-w-[800px] max-h-[90vh] p-0 flex flex-col overflow-hidden",
          ctl.step === "edicao" && "max-w-[850px]",
        )}
      >
        {ctl.step === "selecao" ? (
          <ModalSelecaoEKitSelecaoStep
            showCriarNovo={ctl.showCriarNovo}
            setShowCriarNovo={ctl.setShowCriarNovo}
            nomeNovoKit={ctl.nomeNovoKit}
            setNomeNovoKit={ctl.setNomeNovoKit}
            filtroBusca={ctl.filtroBusca}
            setFiltroBusca={ctl.setFiltroBusca}
            loadingKits={ctl.loadingKits}
            kitsFiltrados={ctl.kitsFiltrados}
            kitsDisponiveis={ctl.kitsDisponiveis}
            kitsCompativeis={ctl.kitsCompativeis}
            createMutation={ctl.createMutation}
            handleCriarNovo={ctl.handleCriarNovo}
            handleEscolherKit={ctl.handleEscolherKit}
            handleClose={ctl.handleClose}
          />
        ) : (
          <ModalSelecaoEKitEdicaoStep ctl={ctl} />
        )}
      </DialogContent>
    </Dialog>
  );
}
