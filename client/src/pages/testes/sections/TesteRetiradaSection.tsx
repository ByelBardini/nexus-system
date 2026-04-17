import { MaterialIcon } from '@/components/MaterialIcon'
import type { OsTeste } from '../testes-types'

interface TesteRetiradaSectionProps {
  os: OsTeste | null
}

export function TesteRetiradaSection({ os }: TesteRetiradaSectionProps) {
  return (
    <section className="bg-white border border-slate-300 shadow-sm overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-300 px-4 py-2 flex items-center gap-2">
        <MaterialIcon name="remove_circle" className="text-erp-blue text-lg" />
        <h2 className="text-xs font-bold text-slate-700 font-condensed uppercase">
          02. Dados da Retirada
        </h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 gap-4 max-w-md">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase">ID a retirar</span>
            <span className="text-sm font-bold text-slate-700">
              {os?.idAparelho?.trim() ?? '—'}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
