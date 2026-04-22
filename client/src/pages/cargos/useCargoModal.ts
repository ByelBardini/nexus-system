import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Cargo, CategoriaCargo, Permission, Setor } from "@/types/cargo";
import {
  agruparPermissoes,
  rotulosPermissoesAtivas,
} from "@/pages/cargos/permissionMatrix";

const DEFAULT_EXPANDED = ["ADMINISTRATIVO", "CONFIGURACAO", "AGENDAMENTO"];

export function useCargoModal({
  cargo,
  isNew,
  setores,
  permissoes,
  onClose,
}: {
  cargo: Cargo | null;
  isNew: boolean;
  setores: Setor[];
  permissoes: Permission[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState<CategoriaCargo>("OPERACIONAL");
  const [ativo, setAtivo] = useState(true);
  const [setorId, setSetorId] = useState<number>(0);
  const [selectedPermIds, setSelectedPermIds] = useState<number[]>([]);
  const [expandedSectors, setExpandedSectors] = useState<string[]>([
    ...DEFAULT_EXPANDED,
  ]);

  useEffect(() => {
    if (cargo) {
      setNome(cargo.nome);
      setDescricao(cargo.descricao || "");
      setCategoria(cargo.categoria);
      setAtivo(cargo.ativo);
      setSetorId(cargo.setor.id);
      setSelectedPermIds(cargo.cargoPermissoes.map((cp) => cp.permissaoId));
    } else {
      setNome("");
      setDescricao("");
      setCategoria("OPERACIONAL");
      setAtivo(true);
      setSetorId(setores[0]?.id || 0);
      setSelectedPermIds([]);
    }
  }, [cargo, setores]);

  const createMutation = useMutation({
    mutationFn: async (data: {
      nome: string;
      code: string;
      setorId: number;
      descricao: string;
      categoria: CategoriaCargo;
      permissionIds: number[];
    }) => {
      const created = await api<{ id: number }>("/roles", {
        method: "POST",
        body: JSON.stringify({
          nome: data.nome,
          code: data.nome.toUpperCase().replace(/\s+/g, "_"),
          setorId: data.setorId,
          descricao: data.descricao,
          categoria: data.categoria,
          ativo: true,
        }),
      });
      if (data.permissionIds.length > 0) {
        await api(`/roles/${created.id}/permissions`, {
          method: "PATCH",
          body: JSON.stringify({ permissionIds: data.permissionIds }),
        });
      }
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles-paginated"] });
      onClose();
      toast.success("Cargo criado com sucesso");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao criar cargo"),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: {
      id: number;
      nome: string;
      descricao: string;
      categoria: CategoriaCargo;
      ativo: boolean;
      permissionIds: number[];
    }) => {
      await Promise.all([
        api(`/roles/${data.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            nome: data.nome,
            descricao: data.descricao,
            categoria: data.categoria,
            ativo: data.ativo,
          }),
        }),
        api(`/roles/${data.id}/permissions`, {
          method: "PATCH",
          body: JSON.stringify({ permissionIds: data.permissionIds }),
        }),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles-paginated"] });
      onClose();
      toast.success("Cargo atualizado com sucesso");
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Erro ao atualizar cargo",
      ),
  });

  const estrutura = useMemo(() => agruparPermissoes(permissoes), [permissoes]);

  const permissoesAtivas = useMemo(
    () => rotulosPermissoesAtivas(permissoes, selectedPermIds),
    [permissoes, selectedPermIds],
  );

  function togglePermission(id: number) {
    setSelectedPermIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleSectorExpanded(setor: string) {
    setExpandedSectors((prev) =>
      prev.includes(setor) ? prev.filter((s) => s !== setor) : [...prev, setor],
    );
  }

  function toggleAllSectorPermissions(setor: string, checked: boolean) {
    const setorItens = estrutura[setor];
    if (!setorItens) return;
    const allPermIds = Object.values(setorItens)
      .flat()
      .map((a) => a.permissao.id);
    if (checked) {
      setSelectedPermIds((prev) => [...new Set([...prev, ...allPermIds])]);
    } else {
      setSelectedPermIds((prev) =>
        prev.filter((id) => !allPermIds.includes(id)),
      );
    }
  }

  function isSectorFullySelected(setor: string) {
    const setorItens = estrutura[setor];
    if (!setorItens) return false;
    const allPermIds = Object.values(setorItens)
      .flat()
      .map((a) => a.permissao.id);
    return allPermIds.every((id) => selectedPermIds.includes(id));
  }

  function handleSave() {
    if (!nome.trim()) {
      toast.error("Nome do cargo é obrigatório");
      return;
    }
    if (isNew) {
      if (!setorId) {
        toast.error("Selecione um setor");
        return;
      }
      createMutation.mutate({
        nome,
        code: nome.toUpperCase().replace(/\s+/g, "_"),
        setorId,
        descricao,
        categoria,
        permissionIds: selectedPermIds,
      });
    } else if (cargo) {
      updateMutation.mutate({
        id: cargo.id,
        nome,
        descricao,
        categoria,
        ativo,
        permissionIds: selectedPermIds,
      });
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return {
    nome,
    setNome,
    descricao,
    setDescricao,
    categoria,
    setCategoria,
    ativo,
    setAtivo,
    selectedPermIds,
    expandedSectors,
    estrutura,
    permissoesAtivas,
    togglePermission,
    toggleSectorExpanded,
    toggleAllSectorPermissions,
    isSectorFullySelected,
    handleSave,
    isPending,
  };
}
