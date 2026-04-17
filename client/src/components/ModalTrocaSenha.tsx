import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { MaterialIcon } from '@/components/MaterialIcon'
import { api } from '@/lib/api'
import { toast } from 'sonner'

/** Mínimo 8 caracteres, pelo menos 1 número e 1 caractere especial */
const senhaForteRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/

const schema = z
  .object({
    novaSenha: z
      .string()
      .min(8, 'A senha deve ter no mínimo 8 caracteres')
      .regex(
        senhaForteRegex,
        'A senha deve conter pelo menos um número e um caractere especial (!@#$%^&* etc.)'
      ),
    confirmarSenha: z.string().min(1, 'Confirme a nova senha'),
  })
  .refine((data) => data.novaSenha === data.confirmarSenha, {
    message: 'As senhas não coincidem',
    path: ['confirmarSenha'],
  })

type FormData = z.infer<typeof schema>

interface ModalTrocaSenhaProps {
  open: boolean
  onOpenChange?: (open: boolean) => void
  senhaAtual: string
  obrigatorio?: boolean
  onSuccess: () => void
}

export function ModalTrocaSenha({
  open,
  onOpenChange,
  senhaAtual,
  obrigatorio = false,
  onSuccess,
}: ModalTrocaSenhaProps) {
  const [showNovaSenha, setShowNovaSenha] = useState(false)
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { novaSenha: '', confirmarSenha: '' },
  })

  async function onSubmit(data: FormData) {
    try {
      await api('/auth/trocar-senha', {
        method: 'POST',
        body: JSON.stringify({
          senhaAtual,
          novaSenha: data.novaSenha,
        }),
      })
      toast.success('Senha alterada com sucesso. Sua senha expira em 6 meses.')
      reset()
      setShowNovaSenha(false)
      setShowConfirmarSenha(false)
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao alterar senha')
    }
  }

  function handleOpenChange(next: boolean) {
    if (obrigatorio && !next) return
    onOpenChange?.(next)
    if (!next) {
      reset()
      setShowNovaSenha(false)
      setShowConfirmarSenha(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        hideClose={obrigatorio}
        ariaTitle="Trocar senha no primeiro acesso"
        className="max-w-md p-0 gap-0 overflow-hidden rounded-sm"
        onPointerDownOutside={(e) => obrigatorio && e.preventDefault()}
        onEscapeKeyDown={(e) => obrigatorio && e.preventDefault()}
      >
        <header className="bg-white border-b border-slate-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MaterialIcon name="lock_reset" className="text-erp-blue" />
            <h2 className="text-lg font-bold text-slate-800">
              {obrigatorio ? 'Troque sua senha no primeiro acesso' : 'Trocar senha'}
            </h2>
          </div>
          {!obrigatorio && (
            <button
              onClick={() => handleOpenChange(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </header>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 space-y-4">
            {obrigatorio && (
              <p className="text-sm text-slate-600">
                Por segurança, sua senha deve ser alterada. Use no mínimo 8 caracteres, com pelo
                menos um número e um caractere especial.
              </p>
            )}
            <div>
              <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                Nova senha <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  type={showNovaSenha ? 'text' : 'password'}
                  className="h-9 pr-9"
                  placeholder="Ex: MinhaSenh@123"
                  autoComplete="new-password"
                  {...register('novaSenha')}
                />
                <button
                  type="button"
                  onClick={() => setShowNovaSenha((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  aria-label={showNovaSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showNovaSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.novaSenha && (
                <p className="text-sm text-destructive mt-1">{errors.novaSenha.message}</p>
              )}
            </div>
            <div>
              <Label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">
                Confirmar nova senha <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  type={showConfirmarSenha ? 'text' : 'password'}
                  className="h-9 pr-9"
                  placeholder="Repita a nova senha"
                  autoComplete="new-password"
                  {...register('confirmarSenha')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmarSenha((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  aria-label={showConfirmarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showConfirmarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmarSenha && (
                <p className="text-sm text-destructive mt-1">{errors.confirmarSenha.message}</p>
              )}
            </div>
          </div>

          <footer className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end gap-3">
            {!obrigatorio && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              className="bg-erp-blue hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? 'Salvando...' : 'Alterar senha'}
            </Button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  )
}
