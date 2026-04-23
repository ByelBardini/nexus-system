import { TesteSectionShell } from "../components/TesteSectionShell";

interface TesteObservacoesSectionProps {
  value: string;
  onChange: (v: string) => void;
}

export function TesteObservacoesSection({
  value,
  onChange,
}: TesteObservacoesSectionProps) {
  return (
    <TesteSectionShell icon="edit_note" title="Observações Adicionais">
      <div className="p-6">
        <textarea
          className="w-full min-h-[96px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="Insira detalhes sobre o comportamento do teste ou anomalias percebidas..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
        />
      </div>
    </TesteSectionShell>
  );
}
