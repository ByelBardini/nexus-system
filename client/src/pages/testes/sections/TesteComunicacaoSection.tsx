import { Check, Clock, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { TesteSectionShell } from "../components/TesteSectionShell";
import type { ComunicacaoResult } from "../lib/testes-types";

type PosChaveValue = "SIM" | "NAO";

interface TesteComunicacaoSectionProps {
  value: ComunicacaoResult | null;
  onChange: (v: ComunicacaoResult) => void;
  novoLocalInstalacao?: string;
  onNovoLocalInstalacaoChange?: (v: string) => void;
  posChave?: PosChaveValue;
  onPosChaveChange?: (v: PosChaveValue) => void;
}

const OPTIONS: {
  value: ComunicacaoResult;
  label: string;
  sublabel: string;
  Icon: typeof Check;
  activeClasses: string;
  iconClasses: string;
  iconHoverClasses: string;
  labelActiveClasses: string;
  sublabelActiveClasses: string;
}[] = [
  {
    value: "COMUNICANDO",
    label: "Comunicando",
    sublabel: "Sinal GPS/GPRS Estável",
    Icon: Check,
    activeClasses: "border-green-500 bg-green-50",
    iconClasses: "bg-green-500",
    iconHoverClasses: "group-hover:bg-green-500",
    labelActiveClasses: "text-green-700",
    sublabelActiveClasses: "text-green-600/70",
  },
  {
    value: "AGUARDANDO",
    label: "Aguardando",
    sublabel: "Aguardando sinais do equipamento",
    Icon: Clock,
    activeClasses: "border-amber-500 bg-amber-50",
    iconClasses: "bg-amber-500",
    iconHoverClasses: "group-hover:bg-amber-500",
    labelActiveClasses: "text-amber-700",
    sublabelActiveClasses: "text-amber-600/70",
  },
  {
    value: "NAO_COMUNICOU",
    label: "Não comunicou",
    sublabel: "Nenhum pacote recebido",
    Icon: X,
    activeClasses: "border-red-500 bg-red-50",
    iconClasses: "bg-red-500",
    iconHoverClasses: "group-hover:bg-red-500",
    labelActiveClasses: "text-red-700",
    sublabelActiveClasses: "text-red-600/70",
  },
];

export function TesteComunicacaoSection({
  value,
  onChange,
  novoLocalInstalacao = "",
  onNovoLocalInstalacaoChange,
  posChave = "NAO",
  onPosChaveChange,
}: TesteComunicacaoSectionProps) {
  const showNovoLocal = value === "COMUNICANDO";

  return (
    <TesteSectionShell icon="wifi" title="03. Validação de Comunicação GPRS/GPS">
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {OPTIONS.map((opt) => {
            const isActive = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange(opt.value)}
                className={cn(
                  "flex flex-col items-center justify-center p-6 border-2 rounded-lg transition-all group",
                  isActive
                    ? opt.activeClasses
                    : "border-slate-200 bg-white hover:border-slate-300",
                  !isActive &&
                    opt.value === "COMUNICANDO" &&
                    "hover:border-green-500 hover:bg-green-50",
                  !isActive &&
                    opt.value === "AGUARDANDO" &&
                    "hover:border-amber-500 hover:bg-amber-50",
                  !isActive &&
                    opt.value === "NAO_COMUNICOU" &&
                    "hover:border-red-500 hover:bg-red-50",
                )}
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors",
                    isActive
                      ? opt.iconClasses
                      : cn("bg-slate-200", opt.iconHoverClasses),
                  )}
                >
                  <opt.Icon className="w-6 h-6 text-white" strokeWidth={3} />
                </div>
                <span
                  className={cn(
                    "text-sm font-bold uppercase transition-colors",
                    isActive ? opt.labelActiveClasses : "text-slate-400",
                  )}
                >
                  {opt.label}
                </span>
                <span
                  className={cn(
                    "text-[10px] mt-1 transition-colors",
                    isActive ? opt.sublabelActiveClasses : "text-slate-400",
                  )}
                >
                  {opt.sublabel}
                </span>
              </button>
            );
          })}
        </div>
        {showNovoLocal && onNovoLocalInstalacaoChange && (
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[200px]">
              <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                Novo Local de Instalação <span className="text-red-500">*</span>
              </Label>
              <Input
                className="h-9 max-w-md"
                placeholder="Ex: Painel Frontal... (obrigatório para finalizar)"
                value={novoLocalInstalacao}
                onChange={(e) => onNovoLocalInstalacaoChange(e.target.value)}
              />
            </div>
            {onPosChaveChange && (
              <div>
                <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                  Pós-chave
                </Label>
                <button
                  type="button"
                  onClick={() =>
                    onPosChaveChange(posChave === "SIM" ? "NAO" : "SIM")
                  }
                  className={cn(
                    "h-9 min-w-[80px] px-4 rounded-md border-2 font-bold text-sm uppercase transition-colors",
                    posChave === "SIM"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                  )}
                >
                  {posChave === "SIM" ? "Sim" : "Não"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </TesteSectionShell>
  );
}
