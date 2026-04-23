import { useState, useMemo, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { schemaCreate, schemaEdit, type FormCreate, type FormEdit } from "./lib/schemas";
import { groupCargosBySetorNome } from "./lib/groupCargos";
import { useUsuariosPaginatedQuery, usePermissionsQuery, useCargosComPermissoesQuery } from "./hooks/useUsuariosQueries";
import { useUsuariosMutations } from "./hooks/useUsuariosMutations";
import { CriarUsuarioDialog } from "./components/CriarUsuarioDialog";
import { EditarUsuarioDialog } from "./components/EditarUsuarioDialog";
import { UsuariosDataTable } from "./components/UsuariosDataTable";
import { UsuariosPageHeader } from "./components/UsuariosPageHeader";
import { UsuariosTableFooter } from "./components/UsuariosTableFooter";
import type { UsuarioListItem } from "@/types/usuarios";

export function UsuariosPage() {
  const { hasPermission, user: currentUser } = useAuth();
  const [openCreate, setOpenCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState<string>("TODOS");
  const [page, setPage] = useState(1);
  const [showCreateRoleSelector, setShowCreateRoleSelector] = useState(false);
  const [showEditRoleSelector, setShowEditRoleSelector] = useState(false);
  const canCreate = hasPermission("ADMINISTRATIVO.USUARIO.CRIAR");
  const canEdit = hasPermission("ADMINISTRATIVO.USUARIO.EDITAR");

  const { data: response, isLoading } = useUsuariosPaginatedQuery(
    debouncedSearch,
    statusFilter,
    page,
  );

  const { data: permissoes = [] } = usePermissionsQuery();
  const { data: cargosComPermissoes = [] } = useCargosComPermissoesQuery(
    openCreate || !!editingId,
  );

  const [selectedCreateRoleIds, setSelectedCreateRoleIds] = useState<number[]>(
    [],
  );
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);

  const createForm = useForm<FormCreate>({
    resolver: zodResolver(schemaCreate),
    defaultValues: {
      nome: "",
      email: "",
      ativo: true,
      setor: null,
      cargoIds: [],
    },
  });

  const editForm = useForm<FormEdit>({
    resolver: zodResolver(schemaEdit),
    defaultValues: { nome: "", email: "", ativo: true, setor: null },
  });

  const onCreateSettled = useCallback(() => {
    setOpenCreate(false);
    createForm.reset();
    setSelectedCreateRoleIds([]);
  }, [createForm]);

  const onUpdateSettled = useCallback(() => {
    setEditingId(null);
  }, []);

  const {
    createMutation,
    updateMutation,
    toggleStatusMutation,
    resetPasswordMutation,
  } = useUsuariosMutations({
    onCreateSettled,
    onUpdateSettled,
  });

  const handleCreateSubmit = (data: FormCreate) => {
    createMutation.mutate({ ...data, cargoIds: selectedCreateRoleIds });
  };

  const handleEditSubmit = (data: FormEdit) => {
    if (!editingId) return;
    updateMutation.mutate({ id: editingId, data, roleIds: selectedRoleIds });
  };

  const openEdit = (usuario: UsuarioListItem) => {
    editForm.reset({
      nome: usuario.nome,
      email: usuario.email,
      ativo: usuario.ativo,
      setor: usuario.setor ?? null,
    });
    setSelectedRoleIds(usuario.usuarioCargos?.map((uc) => uc.cargo.id) ?? []);
    setEditingId(usuario.id);
  };

  const toggleRole = (roleId: number) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId],
    );
  };

  const toggleCreateRole = (roleId: number) => {
    setSelectedCreateRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId],
    );
  };

  const cargosPorSetor = useMemo(
    () => groupCargosBySetorNome(cargosComPermissoes),
    [cargosComPermissoes],
  );

  const users = useMemo(() => response?.data ?? [], [response]);
  const totalUsers = response?.total ?? 0;
  const totalPages = response?.totalPages ?? 1;
  const activeCount = useMemo(
    () => users.filter((u) => u.ativo).length,
    [users],
  );
  const inactiveCount = useMemo(
    () => users.filter((u) => !u.ativo).length,
    [users],
  );
  const totalPermissions = permissoes.length;

  const onSearchChange = (v: string) => {
    setSearch(v);
    setPage(1);
  };

  const onStatusFilterChange = (v: string) => {
    setStatusFilter(v);
    setPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="-m-4 flex min-h-[100dvh] flex-col bg-slate-100">
      <UsuariosPageHeader
        search={search}
        onSearchChange={onSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={onStatusFilterChange}
        canCreate={canCreate}
        onOpenCreate={() => setOpenCreate(true)}
      />

      <div className="flex-1 overflow-hidden flex flex-col bg-white min-h-0">
        <div className="overflow-y-auto flex-1">
          <UsuariosDataTable
            users={users}
            expandedId={expandedId}
            onToggleExpand={(id) =>
              setExpandedId((cur) => (cur === id ? null : id))
            }
            totalPermissions={totalPermissions}
            canEdit={canEdit}
            currentUserId={currentUser?.id}
            onResetPassword={(id) => resetPasswordMutation.mutate(id)}
            onEdit={openEdit}
            onToggleStatus={(u) =>
              toggleStatusMutation.mutate({ id: u.id, ativo: !u.ativo })
            }
            resetPasswordPending={resetPasswordMutation.isPending}
          />
        </div>

        <UsuariosTableFooter
          totalUsers={totalUsers}
          activeCount={activeCount}
          inactiveCount={inactiveCount}
          page={page}
          totalPages={totalPages}
          onPrevPage={() => setPage((p) => p - 1)}
          onNextPage={() => setPage((p) => p + 1)}
        />
      </div>

      <CriarUsuarioDialog
        open={openCreate}
        onOpenChange={(open) => {
          setOpenCreate(open);
          if (!open) {
            createForm.reset();
            setSelectedCreateRoleIds([]);
            setShowCreateRoleSelector(false);
          }
        }}
        form={createForm}
        onSubmit={handleCreateSubmit}
        selectedCreateRoleIds={selectedCreateRoleIds}
        onToggleCreateRole={toggleCreateRole}
        showCreateRoleSelector={showCreateRoleSelector}
        onToggleCreateRoleSelector={() =>
          setShowCreateRoleSelector((s) => !s)
        }
        cargosPorSetor={cargosPorSetor}
        cargosComPermissoes={cargosComPermissoes}
        permissoes={permissoes}
        createMutationPending={createMutation.isPending}
      />

      <EditarUsuarioDialog
        open={!!editingId}
        onOpenChange={(v) => {
          if (!v) {
            setEditingId(null);
            setShowEditRoleSelector(false);
          }
        }}
        form={editForm}
        onSubmit={handleEditSubmit}
        selectedRoleIds={selectedRoleIds}
        onToggleRole={toggleRole}
        showEditRoleSelector={showEditRoleSelector}
        onToggleEditRoleSelector={() =>
          setShowEditRoleSelector((s) => !s)
        }
        cargosPorSetor={cargosPorSetor}
        cargosComPermissoes={cargosComPermissoes}
        permissoes={permissoes}
        updateMutationPending={updateMutation.isPending}
      />
    </div>
  );
}
