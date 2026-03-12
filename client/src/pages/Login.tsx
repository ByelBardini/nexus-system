import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ModalTrocaSenha } from '@/components/ModalTrocaSenha'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

type FormData = z.infer<typeof schema>

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showSenha, setShowSenha] = useState(false)
  const [showTrocaSenha, setShowTrocaSenha] = useState(false)
  const [senhaAtualParaTroca, setSenhaAtualParaTroca] = useState('')

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      const res = await login(data.email, data.password)
      toast.success('Login realizado com sucesso')
      if (res.exigeTrocaSenha) {
        setSenhaAtualParaTroca(data.password)
        setShowTrocaSenha(true)
      } else {
        navigate(from, { replace: true })
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Credenciais inválidas')
    } finally {
      setLoading(false)
    }
  }

  function handleTrocaSenhaSuccess() {
    setShowTrocaSenha(false)
    setSenhaAtualParaTroca('')
    navigate(from, { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Nexus System</CardTitle>
          <CardDescription>Entre com suas credenciais</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@admin.com"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showSenha ? 'text' : 'password'}
                  placeholder="••••••"
                  autoComplete="current-password"
                  className="pr-9"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowSenha((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  aria-label={showSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <ModalTrocaSenha
        open={showTrocaSenha}
        senhaAtual={senhaAtualParaTroca}
        obrigatorio
        onSuccess={handleTrocaSenhaSuccess}
      />
    </div>
  )
}
