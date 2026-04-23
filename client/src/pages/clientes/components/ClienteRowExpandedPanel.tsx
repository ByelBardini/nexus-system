import { Mail, MapPin, Pencil, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatarTelefone } from "@/lib/format";
import {
  formatClienteEnderecoLinhaLista,
  type Cliente,
} from "../shared/clientes-page.shared";

type Props = {
  cliente: Cliente;
  canEdit: boolean;
  onEdit: (c: Cliente) => void;
};

export function ClienteRowExpandedPanel({
  cliente: c,
  canEdit,
  onEdit,
}: Props) {
  const temEnderecoCabecalho = Boolean(c.cep || c.logradouro || c.cidade);
  const enderecoFormatado = formatClienteEnderecoLinhaLista(c);

  return (
    <div className="bg-slate-50 border-l-4 border-blue-600 p-6 mx-4 mb-4 mt-2 shadow-inner">
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
          Meios de Contato
        </h4>
        {canEdit && (
          <Button
            size="sm"
            className="h-8 px-5 text-[11px] font-bold uppercase gap-2"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(c);
            }}
          >
            <Pencil className="h-3 w-3" />
            Editar
          </Button>
        )}
      </div>
      {temEnderecoCabecalho && enderecoFormatado && (
        <div className="mb-4 p-3 bg-white border border-slate-200 rounded flex items-start gap-2">
          <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
          <div className="text-sm text-slate-700">{enderecoFormatado}</div>
        </div>
      )}
      {c.contatos.length === 0 ? (
        <p className="text-sm text-slate-500 italic">
          Nenhum contato cadastrado
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {c.contatos.map((contato) => (
            <div
              key={contato.id}
              className="bg-white border border-slate-200 rounded p-3 flex flex-col gap-1.5 shadow-sm hover:border-slate-300 transition-colors"
            >
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-500 uppercase leading-none">
                  Nome
                </span>
                <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                  <User className="h-3 w-3 text-slate-400" />
                  {contato.nome}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-500 uppercase leading-none">
                  Telefone
                </span>
                <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                  <Phone className="h-3 w-3 text-slate-400" />
                  {contato.celular ? (
                    formatarTelefone(contato.celular)
                  ) : (
                    <span className="italic text-slate-400 font-normal">
                      Não informado
                    </span>
                  )}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-500 uppercase leading-none">
                  E-mail
                </span>
                <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                  <Mail className="h-3 w-3 text-slate-400" />
                  {contato.email || (
                    <span className="italic text-slate-400 font-normal">
                      Não informado
                    </span>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
