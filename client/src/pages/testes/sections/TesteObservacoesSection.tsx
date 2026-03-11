import { MaterialIcon } from '@/components/MaterialIcon'

interface TesteObservacoesSectionProps {
  value: string
  onChange: (v: string) => void
}

export function TesteObservacoesSection({ value, onChange }: TesteObservacoesSectionProps) {
  return (
    <section className="bg-white border border-slate-300 shadow-sm overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-300 px-4 py-2 flex items-center gap-2">
        <MaterialIcon name="edit_note" className="text-erp-blue text-lg" />
        <h2 className="text-xs font-bold text-slate-700 font-condensed uppercase">
          Observações Adicionais
        </h2>
      </div>
      <div className="p-6">
        <textarea
          className="w-full min-h-[96px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="Insira detalhes sobre o comportamento do teste ou anomalias percebidas..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
        />
      </div>
    </section>
  )
}
