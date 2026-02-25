import { Link } from 'react-router-dom'
import { Users, Briefcase, Building2, Wrench } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'

const shortcuts = [
  { to: '/usuarios', label: 'Usuários', icon: Users },
  { to: '/cargos', label: 'Cargos e Permissões', icon: Briefcase },
  { to: '/clientes', label: 'Clientes', icon: Building2 },
  { to: '/tecnicos', label: 'Técnicos', icon: Wrench },
]

export function Home() {
  const { user } = useAuth()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">
          Olá, {user?.nome ?? 'Usuário'}
        </h1>
        <p className="text-muted-foreground">
          Bem-vindo ao Nexus System
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {shortcuts.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <Icon className="h-5 w-5" />
                <CardTitle className="text-base">{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Acessar {label.toLowerCase()}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
