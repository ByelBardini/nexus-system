import { cn } from "@/lib/utils";
import {
  TIPO_CONTRATO_BADGE_CLASS,
  TIPO_CONTRATO_LABEL,
  formatClienteEnderecoResumo,
  type ClienteFormData,
  type TipoContrato,
} from "../shared/clientes-page.shared";

type Props = {
  resumoForm: ClienteFormData;
  resumoTipoContrato: TipoContrato;
};

export function ClienteModalResumo({ resumoForm, resumoTipoContrato }: Props) {
  const enderecoTexto = formatClienteEnderecoResumo({
    logradouro: resumoForm.logradouro,
    numero: resumoForm.numero,
    bairro: resumoForm.bairro,
    cidade: resumoForm.cidade,
    estado: resumoForm.estado,
  });

  return (
    <div className="w-64 border-l border-slate-200 bg-slate-50 p-6 shrink-0 overflow-y-auto">
      <h3 className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest">
        Resumo do Cliente
      </h3>
      <div className="space-y-6">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            Razão Social
          </label>
          <p className="text-sm font-bold text-slate-800 break-words">
            {resumoForm.nome || "—"}
          </p>
        </div>
        {resumoForm.nomeFantasia && (
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Nome Fantasia
            </label>
            <p className="text-sm text-slate-700">{resumoForm.nomeFantasia}</p>
          </div>
        )}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            Tipo Contrato
          </label>
          <span
            className={cn(
              "inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
              TIPO_CONTRATO_BADGE_CLASS[resumoTipoContrato],
            )}
          >
            {TIPO_CONTRATO_LABEL[resumoTipoContrato]}
          </span>
        </div>
        {(resumoForm.cep ||
          resumoForm.logradouro ||
          resumoForm.cidade) &&
          enderecoTexto && (
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Endereço
              </label>
              <p className="text-sm text-slate-700">{enderecoTexto}</p>
            </div>
          )}
        <div className="pt-4 border-t border-slate-200">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">
            Contatos
          </label>
          <p className="text-sm font-bold text-slate-700">
            {resumoForm.contatos?.length || 0} contato(s)
          </p>
        </div>
        <div className="mt-8 p-3 bg-blue-50 border border-blue-100 rounded-sm">
          <p className="text-[10px] text-blue-700 leading-tight">
            Os contatos cadastrados serão utilizados para comunicação sobre ordens
            de serviço.
          </p>
        </div>
      </div>
    </div>
  );
}
