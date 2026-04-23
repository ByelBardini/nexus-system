import { TesteSectionShell } from "../components/TesteSectionShell";
import type { OsTeste } from "../lib/testes-types";

interface TesteRetiradaSectionProps {
  os: OsTeste | null;
}

export function TesteRetiradaSection({ os }: TesteRetiradaSectionProps) {
  return (
    <TesteSectionShell icon="remove_circle" title="02. Dados da Retirada">
      <div className="p-6">
        <div className="grid grid-cols-1 gap-4 max-w-md">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase">
              ID a retirar
            </span>
            <span className="text-sm font-bold text-slate-700">
              {os?.idAparelho?.trim() ?? "—"}
            </span>
          </div>
        </div>
      </div>
    </TesteSectionShell>
  );
}
