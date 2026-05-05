import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";
import type { TipoDespacho } from "../../shared/pedidos-config-types";

const OPCOES_TIPO_DESPACHO: {
  value: TipoDespacho;
  label: string;
  icon: string;
}[] = [
  { value: "TRANSPORTADORA", label: "Transportadora", icon: "local_shipping" },
  { value: "CORREIOS", label: "Correios", icon: "mail" },
  { value: "EM_MAOS", label: "Em Mãos", icon: "handshake" },
];

const TIPO_DESPACHO_LABELS: Record<TipoDespacho, string> = {
  TRANSPORTADORA: "Transportadora",
  CORREIOS: "Correios",
  EM_MAOS: "Em Mãos",
};

type Props = {
  bloqueado: boolean;
  podeDespachar: boolean;
  bloqueiaAvançoParaDespacho: boolean;
  tipoDespacho: TipoDespacho;
  onTipoDespachoChange: (tipo: TipoDespacho) => void;
  transportadora: string;
  numeroNf: string;
  onTransportadoraChange: (valor: string) => void;
  onNumeroNfChange: (valor: string) => void;
  onSave: (data: {
    tipoDespacho: TipoDespacho;
    transportadora: string;
    numeroNf: string;
  }) => void;
};

export function SidePanelDespachoCarga({
  bloqueado,
  podeDespachar,
  bloqueiaAvançoParaDespacho,
  tipoDespacho,
  onTipoDespachoChange,
  transportadora,
  numeroNf,
  onTransportadoraChange,
  onNumeroNfChange,
  onSave,
}: Props) {
  function handleTipoDespachoChange(tipo: TipoDespacho) {
    onTipoDespachoChange(tipo);
    onSave({ tipoDespacho: tipo, transportadora, numeroNf });
  }

  function handleTransportadoraBlur(e: React.FocusEvent<HTMLInputElement>) {
    const trimmed = e.target.value.trim();
    onTransportadoraChange(trimmed);
    onSave({ tipoDespacho, transportadora: trimmed, numeroNf });
  }

  function handleNumeroNfBlur(e: React.FocusEvent<HTMLInputElement>) {
    const trimmed = e.target.value.trim();
    onNumeroNfChange(trimmed);
    onSave({ tipoDespacho, transportadora, numeroNf: trimmed });
  }

  const faltaTransportadora =
    tipoDespacho === "TRANSPORTADORA" && !transportadora.trim();
  const faltaNumeroNf =
    (tipoDespacho === "TRANSPORTADORA" || tipoDespacho === "CORREIOS") &&
    !numeroNf.trim();

  if (bloqueado) {
    return (
      <div className="p-6 border-t-2 border-t-blue-100 bg-blue-50/20">
        <h3 className="text-xs font-bold text-slate-700 uppercase mb-4 flex items-center gap-2">
          <MaterialIcon name="local_shipping" className="text-erp-blue" />
          Despacho de Carga
          <span className="ml-auto flex items-center gap-1 text-[10px] font-normal text-slate-400 normal-case">
            <MaterialIcon name="lock" className="text-xs" />
            Fixado
          </span>
        </h3>
        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">
              Tipo de Envio
            </p>
            <p className="text-xs font-bold text-slate-800">
              {TIPO_DESPACHO_LABELS[tipoDespacho] ?? tipoDespacho}
            </p>
          </div>
          {tipoDespacho === "TRANSPORTADORA" && (
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                Transportadora
              </p>
              <p className="text-xs font-bold text-slate-800">
                {transportadora || "-"}
              </p>
            </div>
          )}
          {tipoDespacho !== "EM_MAOS" && (
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                {tipoDespacho === "CORREIOS" ? "Cód. Rastreio" : "Nº NF"}
              </p>
              <p className="text-xs font-bold text-slate-800 font-mono">
                {numeroNf || "-"}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 border-t-2 border-t-blue-100 bg-blue-50/20">
      <h3 className="text-xs font-bold text-slate-700 uppercase mb-4 flex items-center gap-2">
        <MaterialIcon name="local_shipping" className="text-erp-blue" />
        Despacho de Carga
      </h3>
      <div
        className={cn(
          "space-y-3",
          !podeDespachar && "opacity-75 pointer-events-none",
        )}
      >
        <div>
          <Label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">
            Tipo de envio
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {OPCOES_TIPO_DESPACHO.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleTipoDespachoChange(opt.value)}
                className={cn(
                  "flex items-center justify-center gap-1.5 px-3 py-2 rounded-sm text-[11px] font-bold uppercase border transition-colors w-full",
                  tipoDespacho === opt.value
                    ? "bg-erp-blue text-white border-erp-blue"
                    : "bg-white text-slate-600 border-slate-300 hover:border-slate-400",
                )}
              >
                <MaterialIcon name={opt.icon} className="text-sm" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {tipoDespacho !== "EM_MAOS" && (
          <div className="grid grid-cols-2 gap-3">
            {tipoDespacho === "TRANSPORTADORA" && (
              <div>
                <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Transportadora
                </Label>
                <Input
                  value={transportadora}
                  onChange={(e) => onTransportadoraChange(e.target.value)}
                  onBlur={handleTransportadoraBlur}
                  placeholder="Ex: Braspress"
                  className={cn(
                    "text-[11px] h-9",
                    bloqueiaAvançoParaDespacho &&
                      faltaTransportadora &&
                      "border-amber-400 focus-visible:ring-amber-400",
                  )}
                />
              </div>
            )}
            <div>
              <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                {tipoDespacho === "CORREIOS" ? "Cód. Rastreio" : "Nº NF"}
              </Label>
              <Input
                value={numeroNf}
                onChange={(e) => onNumeroNfChange(e.target.value)}
                onBlur={handleNumeroNfBlur}
                placeholder={
                  tipoDespacho === "CORREIOS" ? "BR12345678" : "Ex: 12345"
                }
                className={cn(
                  "text-[11px] h-9",
                  bloqueiaAvançoParaDespacho &&
                    faltaNumeroNf &&
                    "border-amber-400 focus-visible:ring-amber-400",
                )}
              />
            </div>
          </div>
        )}
        {bloqueiaAvançoParaDespacho && (
          <p className="text-[10px] text-amber-600 mt-1">
            {tipoDespacho === "TRANSPORTADORA"
              ? "Preencha a transportadora e o Nº NF para despachar"
              : "Preencha o código de rastreio para despachar"}
          </p>
        )}
      </div>
    </div>
  );
}
