import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

const nav = [
  { to: '/', label: 'Ordens de Serviço', icon: 'list_alt' },
  { to: '/usuarios', label: 'Usuários', icon: 'person' },
  { to: '/cargos', label: 'Cargos', icon: 'work' },
  { to: '/clientes', label: 'Clientes', icon: 'business' },
  { to: '/tecnicos', label: 'Técnicos', icon: 'engineering' },
]

function MaterialIcon({ name, className }: { name: string; className?: string }) {
  return <span className={cn('material-symbols-outlined', className)}>{name}</span>
}

export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-60 bg-slate-950 text-slate-300 flex flex-col border-r border-slate-800 shrink-0">
        <div className="p-4 flex items-center gap-3 border-b border-slate-800">
          <div className="size-7 bg-white flex items-center justify-center text-slate-950">
            <MaterialIcon name="precision_manufacturing" className="text-xl" />
          </div>
          <div>
            <h1 className="text-white text-base font-bold leading-none font-condensed">NEXUS</h1>
            <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Agend. e Conf.</p>
          </div>
        </div>
        <nav className="flex-1 px-2 py-4 flex flex-col gap-0.5 overflow-y-auto">
          {nav.map(({ to, label, icon }) => {
            const isActive = location.pathname === to
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 transition-colors',
                  isActive ? 'bg-white/10 text-white border-l-4 border-erp-blue' : 'hover:bg-slate-900'
                )}
              >
                <MaterialIcon name={icon} className="text-lg" />
                <span className="text-xs font-semibold uppercase">{label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="p-4 mt-auto border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="size-8 bg-slate-700 rounded-sm flex items-center justify-center overflow-hidden">
              <MaterialIcon name="person" className="text-slate-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-slate-100 uppercase truncate">{user?.nome ?? 'Usuário'}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="text-slate-500 hover:text-white transition-colors p-1"
              aria-label="Sair"
            >
              <MaterialIcon name="logout" className="text-lg" />
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
