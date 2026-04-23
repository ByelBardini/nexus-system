import { Fragment } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { categoriaCargoOuOperacional } from "@/types/cargo";
import {
  getSetorLabel,
  getAccessLevel,
  getInitials,
  formatLastLogin,
} from "../lib/usuarios-format";
import type { UsuarioListItem } from "@/types/usuarios";
import { UsuarioExpandedPanel } from "./UsuarioExpandedPanel";

export function UsuariosDataTable({
  users,
  expandedId,
  onToggleExpand,
  totalPermissions,
  canEdit,
  currentUserId,
  onResetPassword,
  onEdit,
  onToggleStatus,
  resetPasswordPending,
}: {
  users: UsuarioListItem[];
  expandedId: number | null;
  onToggleExpand: (userId: number) => void;
  totalPermissions: number;
  canEdit: boolean;
  currentUserId?: number;
  onResetPassword: (userId: number) => void;
  onEdit: (user: UsuarioListItem) => void;
  onToggleStatus: (user: UsuarioListItem) => void;
  resetPasswordPending: boolean;
}) {
  return (
    <table className="w-full border-collapse">
      <thead className="sticky top-0 z-10">
        <tr>
          <th className="px-4 py-3 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 w-8" />
          <th className="px-4 py-3 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-left">
            Usuário / Identificação
          </th>
          <th className="px-4 py-3 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-left">
            Setor
          </th>
          <th className="px-4 py-3 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-left">
            Cargo(s) Atribuídos
          </th>
          <th className="px-4 py-3 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-left">
            Último Acesso
          </th>
          <th className="px-4 py-3 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-left">
            Nível de Acesso
          </th>
          <th className="px-4 py-3 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-center w-24">
            Status
          </th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => {
          const isExpanded = expandedId === user.id;
          const isInactive = !user.ativo;
          const accessLevel = getAccessLevel(user, totalPermissions);

          return (
            <Fragment key={user.id}>
              <tr
                className={cn(
                  "border-b border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer",
                  isExpanded && "border-l-4 border-l-blue-600 bg-white",
                  isInactive && "bg-slate-50",
                )}
                onClick={() => onToggleExpand(user.id)}
              >
                <td className="px-4 py-3 text-slate-400">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </td>
                <td className="px-4 py-3">
                  <div
                    className={cn(
                      "flex items-center gap-3",
                      isInactive && "opacity-50",
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-sm flex items-center justify-center font-bold text-[10px] border",
                        isInactive
                          ? "bg-slate-200 text-slate-400 border-slate-300"
                          : "bg-slate-100 text-slate-600 border-slate-200",
                      )}
                    >
                      {getInitials(user.nome)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800">
                        {user.nome}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        ID: {String(user.id).padStart(5, "0")} • {user.email}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div
                    className={cn(
                      "flex flex-wrap gap-1",
                      isInactive && "opacity-50",
                    )}
                  >
                    {user.setor ? (
                      <span className="px-2 py-0.5 rounded-sm text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        {getSetorLabel(user.setor)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">
                        Sem setor
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div
                    className={cn(
                      "flex flex-wrap gap-1",
                      isInactive && "opacity-50 grayscale",
                    )}
                  >
                    {user.usuarioCargos && user.usuarioCargos.length > 0 ? (
                      user.usuarioCargos.map((uc) => {
                        const config = categoriaCargoOuOperacional(
                          uc.cargo.categoria,
                        );
                        return (
                          <span
                            key={uc.cargo.id}
                            className={cn(
                              "px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase border flex items-center gap-1.5",
                              config.className,
                            )}
                            title={`Categoria: ${config.label}`}
                          >
                            {uc.cargo.nome}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">
                        Sem cargo
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">
                  {formatLastLogin(user.ultimoAcesso)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all",
                          accessLevel.barColor,
                        )}
                        style={{ width: `${accessLevel.percent}%` }}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase",
                        accessLevel.color,
                      )}
                    >
                      {accessLevel.label}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  {user.ativo ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold uppercase border border-emerald-200">
                      Ativo
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[9px] font-bold uppercase border border-slate-200">
                      Inativo
                    </span>
                  )}
                </td>
              </tr>

              {isExpanded && (
                <tr>
                  <td colSpan={7} className="p-0">
                    <UsuarioExpandedPanel
                      user={user}
                      accessLevel={accessLevel}
                      totalPermissions={totalPermissions}
                      canEdit={canEdit}
                      currentUserId={currentUserId}
                      onResetPassword={() => onResetPassword(user.id)}
                      onEdit={() => onEdit(user)}
                      onToggleStatus={() => onToggleStatus(user)}
                      resetPasswordPending={resetPasswordPending}
                    />
                  </td>
                </tr>
              )}
            </Fragment>
          );
        })}
        {users.length === 0 && (
          <tr>
            <td
              colSpan={7}
              className="px-4 py-12 text-center text-sm text-slate-500"
            >
              Nenhum usuário encontrado
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
