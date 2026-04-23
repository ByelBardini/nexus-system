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

type Props = {
  estaConcluido: boolean;
  podeDespachar: boolean;
  tipoDespacho: TipoDespacho;
  onTipoDespachoChange: (tipo: TipoDespacho) => void;
  transportadora: string;
  numeroNf: string;
  onTransportadoraChange: (valor: string) => void;
  onNumeroNfChange: (valor: string) => void;
};

export function SidePanelDespachoCarga({
  estaConcluido,
  podeDespachar,
  tipoDespacho,
  onTipoDespachoChange,
  transportadora,
  numeroNf,
  onTransportadoraChange,
  onNumeroNfChange,
}: Props) {
  return (
    <div className="p-6 border-t-2 border-t-blue-100 bg-blue-50/20">
      <h3 className="text-xs font-bold text-slate-700 uppercase mb-4 flex items-center gap-2">
        <MaterialIcon name="local_shipping" className="text-erp-blue" />
        Despacho de Carga
      </h3>
      <div
        className={cn(
          "space-y-3",
          (estaConcluido || !podeDespachar) &&
            "opacity-75 pointer-events-none",
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
                onClick={() => onTipoDespachoChange(opt.value)}
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
                  onBlur={(e) => onTransportadoraChange(e.target.value.trim())}
                  placeholder="Ex: Braspress"
                  className="text-[11px] h-9"
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
                onBlur={(e) => onNumeroNfChange(e.target.value.trim())}
                placeholder={
                  tipoDespacho === "CORREIOS" ? "BR12345678" : "Ex: 12345"
                }
                className="text-[11px] h-9"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
