import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { MaterialIcon } from "@/components/MaterialIcon";

type CadastroIndividualHeaderProps = {
  quantidadeCadastrada: number;
};

export function CadastroIndividualHeader({
  quantidadeCadastrada,
}: CadastroIndividualHeaderProps) {
  return (
    <header className="z-10 flex h-20 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8">
      <div className="flex items-center gap-4">
        <Link
          to="/aparelhos"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-3">
          <MaterialIcon
            name="qr_code_scanner"
            className="text-erp-blue text-xl"
          />
          <div>
            <h1 className="text-lg font-bold text-slate-800">
              Cadastro Manual de Rastreador/Simcard
            </h1>
            <p className="text-xs text-slate-500">Entrada individual de equipamentos</p>
          </div>
        </div>
      </div>
      {quantidadeCadastrada > 0 && (
        <div className="flex items-center gap-2 border border-emerald-200 bg-emerald-50 rounded-sm px-4 py-2">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-bold text-emerald-800">
            {quantidadeCadastrada} equipamento
            {quantidadeCadastrada > 1 ? "s" : ""} cadastrado
            {quantidadeCadastrada > 1 ? "s" : ""} nesta sessão
          </span>
        </div>
      )}
    </header>
  );
}
