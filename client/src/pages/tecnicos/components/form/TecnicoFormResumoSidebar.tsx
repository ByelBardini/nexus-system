import { formatarMoedaDeCentavos } from "@/lib/format";

type WatchedResumo = {
  nome: string | undefined;
  cidade: string | undefined;
  estado: string | undefined;
  instalacaoSemBloqueio: number | undefined;
  revisao: number | undefined;
  deslocamento: number | undefined;
};

type Props = {
  watched: WatchedResumo;
};

export function TecnicoFormResumoSidebar({ watched }: Props) {
  return (
    <div className="w-64 border-l border-slate-200 bg-slate-50 p-6 shrink-0 overflow-y-auto">
      <h3 className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest">
        Resumo do Técnico
      </h3>
      <div className="space-y-6">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            Nome do Prestador
          </label>
          <p className="text-sm font-bold text-slate-800 break-words">
            {watched.nome || "—"}
          </p>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            Localidade
          </label>
          <p className="text-sm font-bold text-slate-800">
            {watched.cidade && watched.estado
              ? `${watched.cidade} / ${watched.estado}`
              : "— / —"}
          </p>
        </div>
        <div className="pt-4 border-t border-slate-200">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">
            Taxas Principais
          </label>
          <div className="space-y-2">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500">Instalação:</span>
              <span className="font-bold text-slate-700">
                {formatarMoedaDeCentavos(watched.instalacaoSemBloqueio ?? 0)}
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500">Revisão:</span>
              <span className="font-bold text-slate-700">
                {formatarMoedaDeCentavos(watched.revisao ?? 0)}
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500">Km:</span>
              <span className="font-bold text-slate-700">
                {formatarMoedaDeCentavos(watched.deslocamento ?? 0)}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-8 p-3 bg-blue-50 border border-blue-100 rounded-sm">
          <p className="text-[10px] text-blue-700 leading-tight">
            Os valores informados serão utilizados para o cálculo automático de
            ordens de serviço.
          </p>
        </div>
      </div>
    </div>
  );
}
