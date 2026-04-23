import { formatarMoeda } from "@/lib/format";
import { tecnicoPrecoToNum } from "@/lib/tecnicos-page";
import type { Tecnico } from "../lib/tecnicos.types";

type Props = {
  precos: Tecnico["precos"];
};

export function TecnicoPrecosCards({ precos }: Props) {
  return (
    <div className="grid grid-cols-5 gap-2">
      <div className="rounded border border-slate-200 bg-white p-3">
        <span className="mb-1 block text-[9px] font-bold uppercase text-slate-400">
          Inst. c/ Bloqueio
        </span>
        <span className="text-sm font-bold text-slate-800">
          {formatarMoeda(tecnicoPrecoToNum(precos?.instalacaoComBloqueio))}
        </span>
      </div>
      <div className="rounded border border-slate-200 bg-white p-3">
        <span className="mb-1 block text-[9px] font-bold uppercase text-slate-400">
          Inst. s/ Bloqueio
        </span>
        <span className="text-sm font-bold text-slate-800">
          {formatarMoeda(tecnicoPrecoToNum(precos?.instalacaoSemBloqueio))}
        </span>
      </div>
      <div className="rounded border border-slate-200 bg-white p-3">
        <span className="mb-1 block text-[9px] font-bold uppercase text-slate-400">
          Revisão
        </span>
        <span className="text-sm font-bold text-slate-800">
          {formatarMoeda(tecnicoPrecoToNum(precos?.revisao))}
        </span>
      </div>
      <div className="rounded border border-slate-200 bg-white p-3">
        <span className="mb-1 block text-[9px] font-bold uppercase text-slate-400">
          Retirada
        </span>
        <span className="text-sm font-bold text-slate-800">
          {formatarMoeda(tecnicoPrecoToNum(precos?.retirada))}
        </span>
      </div>
      <div className="rounded border border-slate-200 bg-white p-3">
        <span className="mb-1 block text-[9px] font-bold uppercase text-slate-400">
          Deslocamento (km)
        </span>
        <span className="text-sm font-bold text-slate-800">
          {formatarMoeda(tecnicoPrecoToNum(precos?.deslocamento))}
        </span>
      </div>
    </div>
  );
}
