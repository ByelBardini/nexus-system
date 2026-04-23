import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";
import {
  categoriaCargoOuOperacional,
} from "@/types/cargo";
import { formatLastLogin } from "../lib/usuarios-format";
import type { UsuarioExpandedPanelProps } from "@/types/usuarios";

export function UsuarioExpandedPanel({
  user,
  accessLevel,
  totalPermissions,
  canEdit,
  currentUserId,
  onResetPassword,
  onEdit,
  onToggleStatus,
  resetPasswordPending,
}: UsuarioExpandedPanelProps) {
  return (
    <div className="bg-slate-50 border-b border-slate-200 px-8 py-4 shadow-inner">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-5 border-r border-slate-200 pr-6">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
            <MaterialIcon
              name="security_update_good"
              className="text-sm"
            />
            Audit Trail & Segurança
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-[11px] border-b border-slate-100 pb-2">
              <span className="text-slate-500">Data de cadastro</span>
              <span className="font-bold text-slate-700">
                {new Date(user.createdAt).toLocaleDateString("pt-BR")}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px] border-b border-slate-100 pb-2">
              <span className="text-slate-500">Último acesso</span>
              <span
                className={cn(
                  "font-bold",
                  user.ultimoAcesso ? "text-slate-700" : "text-amber-600",
                )}
              >
                {formatLastLogin(user.ultimoAcesso)}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-500">Permissões ativas</span>
              <span className="font-bold text-blue-600">
                {accessLevel.percent}% (
                {Math.round(
                  (accessLevel.percent * totalPermissions) / 100,
                )}{" "}
                de {totalPermissions})
              </span>
            </div>
          </div>
        </div>

        <div className="col-span-4 border-r border-slate-200 pr-6">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
            <MaterialIcon name="badge" className="text-sm" />
            Cargos Vinculados
          </h4>
          <div className="space-y-1">
            {user.usuarioCargos && user.usuarioCargos.length > 0 ? (
              user.usuarioCargos.map((uc) => {
                const config = categoriaCargoOuOperacional(uc.cargo.categoria);
                return (
                  <div
                    key={uc.cargo.id}
                    className="flex items-center gap-2 text-[10px] text-slate-600"
                  >
                    <MaterialIcon
                      name="check_circle"
                      className="text-xs text-emerald-500"
                    />
                    <span className="font-medium">{uc.cargo.nome}</span>
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase",
                        config.className,
                      )}
                    >
                      {config.label}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-[10px] text-slate-400 italic">
                Nenhum cargo vinculado
              </div>
            )}
          </div>
        </div>

        <div className="col-span-3 flex flex-col justify-center gap-2">
          {canEdit && (
            <>
              <button
                type="button"
                onClick={onResetPassword}
                disabled={resetPasswordPending}
                className="flex items-center gap-1 px-3 py-1.5 rounded-sm text-[11px] font-bold uppercase transition-colors border bg-white text-slate-700 border-slate-300 hover:bg-slate-50 disabled:opacity-50"
              >
                <MaterialIcon name="lock_reset" className="text-base" />
                Resetar Senha
              </button>
              <button
                type="button"
                onClick={onEdit}
                className="flex items-center gap-1 px-3 py-1.5 rounded-sm text-[11px] font-bold uppercase transition-colors border bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
              >
                <MaterialIcon name="edit" className="text-base" />
                Editar Usuário
              </button>
              {currentUserId !== user.id && (
                <button
                  type="button"
                  onClick={onToggleStatus}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-sm text-[11px] font-bold uppercase transition-colors border",
                    user.ativo
                      ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
                  )}
                >
                  <MaterialIcon
                    name={user.ativo ? "person_off" : "person"}
                    className="text-base"
                  />
                  {user.ativo ? "Inativar Usuário" : "Ativar Usuário"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
