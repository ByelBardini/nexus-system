import { Link } from 'react-router-dom'
import { MaterialIcon } from '@/components/MaterialIcon'

const navTileClasses =
  'flex items-center justify-between p-4 border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer text-sm font-medium text-slate-700 group'

const cardHeaderClasses =
  'flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200'

const industrialCardClasses =
  'bg-white border border-slate-200 rounded-sm overflow-hidden'

export function ConfiguracoesPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-lg font-bold text-slate-800 uppercase tracking-tight">
          Configurações do Sistema
        </h1>
        <nav className="flex items-center gap-2 text-[11px] text-slate-400 uppercase tracking-wider font-semibold mt-1">
          <span className="text-slate-600">Configurações</span>
        </nav>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Agendamento */}
        <section className={industrialCardClasses}>
          <div className={cardHeaderClasses}>
            <MaterialIcon name="calendar_month" className="text-blue-600" />
            <h2 className="text-sm font-bold uppercase tracking-tight text-slate-800">
              Agendamento
            </h2>
          </div>
          <div className="p-4 grid grid-cols-1 gap-2">
            <Link to="/tecnicos" className={navTileClasses}>
              <div className="flex items-center gap-3">
                <MaterialIcon name="engineering" className="text-slate-400" />
                <span>Técnicos</span>
              </div>
              <MaterialIcon
                name="chevron_right"
                className="text-slate-300 group-hover:text-slate-600"
              />
            </Link>
            <Link to="/clientes" className={navTileClasses}>
              <div className="flex items-center gap-3">
                <MaterialIcon name="groups" className="text-slate-400" />
                <span>Clientes</span>
              </div>
              <MaterialIcon
                name="chevron_right"
                className="text-slate-300 group-hover:text-slate-600"
              />
            </Link>
          </div>
        </section>

        {/* Controle de Acesso */}
        <section className={industrialCardClasses}>
          <div className={cardHeaderClasses}>
            <MaterialIcon name="lock" className="text-amber-600" />
            <h2 className="text-sm font-bold uppercase tracking-tight text-slate-800">
              Controle de Acesso
            </h2>
          </div>
          <div className="p-4 grid grid-cols-1 gap-2">
            <Link to="/cargos" className={navTileClasses}>
              <div className="flex items-center gap-3">
                <MaterialIcon
                  name="admin_panel_settings"
                  className="text-slate-400"
                />
                <span>Cargos e Permissões</span>
              </div>
              <MaterialIcon
                name="chevron_right"
                className="text-slate-300 group-hover:text-slate-600"
              />
            </Link>
            <Link to="/usuarios" className={navTileClasses}>
              <div className="flex items-center gap-3">
                <MaterialIcon name="person_add" className="text-slate-400" />
                <span>Usuários</span>
              </div>
              <MaterialIcon
                name="chevron_right"
                className="text-slate-300 group-hover:text-slate-600"
              />
            </Link>
          </div>
        </section>

        {/* Equipamentos */}
        <section className={industrialCardClasses}>
          <div className={cardHeaderClasses}>
            <MaterialIcon name="sensors" className="text-emerald-600" />
            <h2 className="text-sm font-bold uppercase tracking-tight text-slate-800">
              Equipamentos
            </h2>
          </div>
          <div className="p-4 grid grid-cols-1 gap-2">
            <Link to="/equipamentos/marcas" className={navTileClasses}>
              <div className="flex items-center gap-3">
                <MaterialIcon name="precision_manufacturing" className="text-slate-400" />
                <span>Marcas</span>
              </div>
              <MaterialIcon
                name="chevron_right"
                className="text-slate-300 group-hover:text-slate-600"
              />
            </Link>
            <Link to="/equipamentos/modelos" className={navTileClasses}>
              <div className="flex items-center gap-3">
                <MaterialIcon name="devices" className="text-slate-400" />
                <span>Modelos</span>
              </div>
              <MaterialIcon
                name="chevron_right"
                className="text-slate-300 group-hover:text-slate-600"
              />
            </Link>
            <Link to="/equipamentos/operadoras" className={navTileClasses}>
              <div className="flex items-center gap-3">
                <MaterialIcon name="sim_card" className="text-slate-400" />
                <span>Operadoras</span>
              </div>
              <MaterialIcon
                name="chevron_right"
                className="text-slate-300 group-hover:text-slate-600"
              />
            </Link>
          </div>
        </section>
      </div>

      <div className="mt-12 pt-6 border-t border-slate-200 flex flex-wrap gap-6 items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              Versão
            </span>
            <span className="text-xs font-semibold text-slate-600">v1.0.0</span>
          </div>
        </div>
        <div className="text-[11px] text-slate-400">
          © {new Date().getFullYear()} Sistema Nexus
        </div>
      </div>
    </div>
  )
}
