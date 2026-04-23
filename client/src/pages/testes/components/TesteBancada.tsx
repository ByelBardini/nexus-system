import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TesteOsDataSection } from "../sections/TesteOsDataSection";
import { TesteEquipamentoSection } from "../sections/TesteEquipamentoSection";
import { TesteComunicacaoSection } from "../sections/TesteComunicacaoSection";
import { TesteRetiradaSection } from "../sections/TesteRetiradaSection";
import { TesteObservacoesSection } from "../sections/TesteObservacoesSection";
import type {
  ComunicacaoResult,
  OsTeste,
  RastreadorParaTeste,
} from "../lib/testes-types";

interface TesteBancadaProps {
  selectedOs: OsTeste | null;
  rastreadores: RastreadorParaTeste[];
  imeiSearch: string;
  onImeiSearchChange: (v: string) => void;
  aparelhoSelecionado: RastreadorParaTeste | null;
  onTrocarAparelho: () => void;
  comunicacaoResult: ComunicacaoResult | null;
  onComunicacaoChange: (v: ComunicacaoResult) => void;
  novoLocalInstalacao?: string;
  onNovoLocalInstalacaoChange?: (v: string) => void;
  posChave?: "SIM" | "NAO";
  onPosChaveChange?: (v: "SIM" | "NAO") => void;
  observacoes: string;
  onObservacoesChange: (v: string) => void;
  onCancelar: () => void;
  onFinalizar: () => void;
  onRetiradaRealizada?: () => void;
  canFinalizar?: boolean;
  isRetirada?: boolean;
}

export function TesteBancada({
  selectedOs,
  rastreadores,
  imeiSearch,
  onImeiSearchChange,
  aparelhoSelecionado,
  onTrocarAparelho,
  comunicacaoResult,
  onComunicacaoChange,
  novoLocalInstalacao,
  onNovoLocalInstalacaoChange,
  posChave,
  onPosChaveChange,
  observacoes,
  onObservacoesChange,
  onCancelar,
  onFinalizar,
  onRetiradaRealizada,
  canFinalizar = false,
  isRetirada = false,
}: TesteBancadaProps) {
  const tempoRastreadorEmTestesMin =
    aparelhoSelecionado && selectedOs ? selectedOs.tempoEmTestesMin : undefined;
  const showValidation = !!aparelhoSelecionado;

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-slate-100 min-w-0">
      <div className="flex-1 overflow-y-auto p-8 space-y-6 min-h-0">
        <TesteOsDataSection os={selectedOs} />
        {isRetirada ? (
          <TesteRetiradaSection os={selectedOs} />
        ) : (
          <>
            <TesteEquipamentoSection
              rastreadores={rastreadores}
              value={imeiSearch}
              onChange={onImeiSearchChange}
              aparelhoSelecionado={aparelhoSelecionado}
              onTrocarAparelho={onTrocarAparelho}
              osClienteId={selectedOs?.clienteId ?? null}
              tempoRastreadorEmTestesMin={tempoRastreadorEmTestesMin}
            />
            {showValidation && (
              <TesteComunicacaoSection
                value={comunicacaoResult}
                onChange={onComunicacaoChange}
                novoLocalInstalacao={novoLocalInstalacao}
                onNovoLocalInstalacaoChange={onNovoLocalInstalacaoChange}
                posChave={posChave}
                onPosChaveChange={onPosChaveChange}
              />
            )}
          </>
        )}
        <TesteObservacoesSection
          value={observacoes}
          onChange={onObservacoesChange}
        />
      </div>

      <footer className="bg-white border-t border-slate-200 p-6 flex justify-end items-center gap-4 shrink-0">
        <Button
          variant="ghost"
          className="text-slate-500 font-bold uppercase"
          onClick={onCancelar}
        >
          Cancelar Operação
        </Button>
        {isRetirada ? (
          <Button
            className="bg-erp-blue hover:bg-blue-700 text-white font-bold uppercase text-sm gap-2"
            onClick={onRetiradaRealizada}
          >
            Retirada Realizada
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            className="bg-erp-blue hover:bg-blue-700 text-white font-bold uppercase text-sm gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onFinalizar}
            disabled={!canFinalizar}
            title={
              !canFinalizar
                ? "Necessário: aparelho vinculado, opção Comunicando e local de instalação preenchido"
                : undefined
            }
          >
            Finalizar Teste & Liberar OS
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </footer>
    </main>
  );
}
