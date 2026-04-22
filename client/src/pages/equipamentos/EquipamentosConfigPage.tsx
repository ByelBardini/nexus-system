import { useState, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Loader2, MoreVertical, ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MaterialIcon } from "@/components/MaterialIcon";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Marca {
  id: number;
  nome: string;
  ativo: boolean;
  _count: { modelos: number };
}

interface Modelo {
  id: number;
  nome: string;
  ativo: boolean;
  minCaracteresImei?: number | null;
  marca: { id: number; nome: string; ativo: boolean };
}

interface Operadora {
  id: number;
  nome: string;
  ativo: boolean;
}

interface PlanoSimcard {
  id: number;
  marcaSimcardId: number;
  planoMb: number;
  ativo: boolean;
}

interface MarcaSimcard {
  id: number;
  nome: string;
  operadoraId: number;
  temPlanos: boolean;
  ativo: boolean;
  minCaracteresIccid?: number | null;
  operadora: { id: number; nome: string };
  planos?: PlanoSimcard[];
}

export function EquipamentosConfigPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("CONFIGURACAO.APARELHO.EDITAR");
  const [searchMarcas, setSearchMarcas] = useState("");
  const debouncedSearchMarcas = useDebounce(searchMarcas, 300);
  const [searchOperadoras, setSearchOperadoras] = useState("");
  const debouncedSearchOperadoras = useDebounce(searchOperadoras, 300);
  const [expandedMarcaIds, setExpandedMarcaIds] = useState<Set<number>>(
    new Set(),
  );

  // Modals
  const [modalMarcaOpen, setModalMarcaOpen] = useState(false);
  const [editingMarca, setEditingMarca] = useState<Marca | null>(null);
  const [nomeMarca, setNomeMarca] = useState("");

  const [modalModeloOpen, setModalModeloOpen] = useState(false);
  const [editingModelo, setEditingModelo] = useState<Modelo | null>(null);
  const [nomeModelo, setNomeModelo] = useState("");
  const [marcaIdForModelo, setMarcaIdForModelo] = useState<string>("");
  const [minCaracteresImeiModelo, setMinCaracteresImeiModelo] =
    useState<string>("");

  const [modalOperadoraOpen, setModalOperadoraOpen] = useState(false);
  const [editingOperadora, setEditingOperadora] = useState<Operadora | null>(
    null,
  );
  const [nomeOperadora, setNomeOperadora] = useState("");

  const [modalMarcaSimcardOpen, setModalMarcaSimcardOpen] = useState(false);
  const [editingMarcaSimcard, setEditingMarcaSimcard] =
    useState<MarcaSimcard | null>(null);
  const [nomeMarcaSimcard, setNomeMarcaSimcard] = useState("");
  const [operadoraIdMarcaSimcard, setOperadoraIdMarcaSimcard] =
    useState<string>("");
  const [temPlanosMarcaSimcard, setTemPlanosMarcaSimcard] = useState(false);
  const [minCaracteresIccidMarcaSimcard, setMinCaracteresIccidMarcaSimcard] =
    useState<string>("");
  const [expandedMarcasSimcardIds, setExpandedMarcasSimcardIds] = useState<
    Set<number>
  >(new Set());
  const [modalPlanoSimcardOpen, setModalPlanoSimcardOpen] = useState(false);
  const [editingPlanoSimcard, setEditingPlanoSimcard] =
    useState<PlanoSimcard | null>(null);
  const [planoMbPlanoSimcard, setPlanoMbPlanoSimcard] = useState<number | "">(
    "",
  );
  const [marcaSimcardIdForPlano, setMarcaSimcardIdForPlano] = useState<
    number | null
  >(null);

  const { data: marcas = [], isLoading: loadingMarcas } = useQuery<Marca[]>({
    queryKey: ["marcas"],
    queryFn: () => api("/equipamentos/marcas"),
  });

  const { data: modelos = [], isLoading: loadingModelos } = useQuery<Modelo[]>({
    queryKey: ["modelos"],
    queryFn: () => api("/equipamentos/modelos"),
  });

  const { data: operadoras = [], isLoading: loadingOperadoras } = useQuery<
    Operadora[]
  >({
    queryKey: ["operadoras"],
    queryFn: () => api("/equipamentos/operadoras"),
  });

  const { data: marcasSimcard = [], isLoading: loadingMarcasSimcard } =
    useQuery<MarcaSimcard[]>({
      queryKey: ["marcas-simcard"],
      queryFn: () => api("/equipamentos/marcas-simcard"),
    });

  const marcasAtivas = useMemo(() => marcas.filter((m) => m.ativo), [marcas]);
  const operadorasAtivas = useMemo(
    () => operadoras.filter((o) => o.ativo),
    [operadoras],
  );

  const filteredMarcas = useMemo(() => {
    const q = debouncedSearchMarcas.toLowerCase();
    return marcas.filter((m) => {
      const matchMarca = m.nome.toLowerCase().includes(q);
      const matchModelo = modelos.some(
        (mod) => mod.marca.id === m.id && mod.nome.toLowerCase().includes(q),
      );
      return matchMarca || matchModelo;
    });
  }, [marcas, modelos, debouncedSearchMarcas]);

  const filteredOperadoras = useMemo(
    () =>
      operadoras.filter((o) =>
        o.nome.toLowerCase().includes(debouncedSearchOperadoras.toLowerCase()),
      ),
    [operadoras, debouncedSearchOperadoras],
  );

  const [searchMarcasSimcard, setSearchMarcasSimcard] = useState("");
  const debouncedSearchMarcasSimcard = useDebounce(searchMarcasSimcard, 300);

  const filteredMarcasSimcard = useMemo(
    () =>
      marcasSimcard.filter(
        (m) =>
          m.nome
            .toLowerCase()
            .includes(debouncedSearchMarcasSimcard.toLowerCase()) ||
          m.operadora.nome
            .toLowerCase()
            .includes(debouncedSearchMarcasSimcard.toLowerCase()),
      ),
    [marcasSimcard, debouncedSearchMarcasSimcard],
  );

  const modelosByMarca = useMemo(() => {
    const map = new Map<number, Modelo[]>();
    for (const m of modelos) {
      const list = map.get(m.marca.id) ?? [];
      list.push(m);
      map.set(m.marca.id, list);
    }
    return map;
  }, [modelos]);

  const totalModelos = modelos.length;

  function toggleMarca(marcaId: number) {
    setExpandedMarcaIds((prev) => {
      const next = new Set(prev);
      if (next.has(marcaId)) next.delete(marcaId);
      else next.add(marcaId);
      return next;
    });
  }

  // Marca mutations
  const createMarcaMutation = useMutation({
    mutationFn: (data: { nome: string }) =>
      api("/equipamentos/marcas", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marcas"] });
      closeModalMarca();
      toast.success("Marca criada com sucesso");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao criar marca"),
  });

  const updateMarcaMutation = useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: number;
      nome?: string;
      ativo?: boolean;
    }) =>
      api(`/equipamentos/marcas/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marcas"] });
      closeModalMarca();
      toast.success("Marca atualizada com sucesso");
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Erro ao atualizar marca",
      ),
  });

  const deleteMarcaMutation = useMutation({
    mutationFn: (id: number) =>
      api(`/equipamentos/marcas/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marcas"] });
      toast.success("Marca deletada com sucesso");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao deletar marca"),
  });

  // Modelo mutations
  const createModeloMutation = useMutation({
    mutationFn: (data: {
      nome: string;
      marcaId: number;
      minCaracteresImei?: number;
    }) =>
      api("/equipamentos/modelos", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modelos"] });
      queryClient.invalidateQueries({ queryKey: ["marcas"] });
      closeModalModelo();
      toast.success("Modelo criado com sucesso");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao criar modelo"),
  });

  const updateModeloMutation = useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: number;
      nome?: string;
      ativo?: boolean;
      minCaracteresImei?: number;
    }) =>
      api(`/equipamentos/modelos/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modelos"] });
      closeModalModelo();
      toast.success("Modelo atualizado com sucesso");
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Erro ao atualizar modelo",
      ),
  });

  const deleteModeloMutation = useMutation({
    mutationFn: (id: number) =>
      api(`/equipamentos/modelos/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modelos"] });
      queryClient.invalidateQueries({ queryKey: ["marcas"] });
      toast.success("Modelo deletado com sucesso");
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Erro ao deletar modelo",
      ),
  });

  // Operadora mutations
  const createOperadoraMutation = useMutation({
    mutationFn: (data: { nome: string }) =>
      api("/equipamentos/operadoras", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operadoras"] });
      closeModalOperadora();
      toast.success("Operadora criada com sucesso");
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Erro ao criar operadora",
      ),
  });

  const updateOperadoraMutation = useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: number;
      nome?: string;
      ativo?: boolean;
    }) =>
      api(`/equipamentos/operadoras/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operadoras"] });
      closeModalOperadora();
      toast.success("Operadora atualizada com sucesso");
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Erro ao atualizar operadora",
      ),
  });

  const deleteOperadoraMutation = useMutation({
    mutationFn: (id: number) =>
      api(`/equipamentos/operadoras/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operadoras"] });
      toast.success("Operadora deletada com sucesso");
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Erro ao deletar operadora",
      ),
  });

  function openCreateMarca() {
    setEditingMarca(null);
    setNomeMarca("");
    setModalMarcaOpen(true);
  }

  function openEditMarca(marca: Marca) {
    setEditingMarca(marca);
    setNomeMarca(marca.nome);
    setModalMarcaOpen(true);
  }

  function closeModalMarca() {
    setModalMarcaOpen(false);
    setEditingMarca(null);
    setNomeMarca("");
  }

  function handleSaveMarca() {
    if (!nomeMarca.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (editingMarca)
      updateMarcaMutation.mutate({ id: editingMarca.id, nome: nomeMarca });
    else createMarcaMutation.mutate({ nome: nomeMarca });
  }

  function toggleAtivoMarca(marca: Marca) {
    updateMarcaMutation.mutate({ id: marca.id, ativo: !marca.ativo });
  }

  function openCreateModelo(marcaId?: number) {
    setEditingModelo(null);
    setNomeModelo("");
    setMarcaIdForModelo(marcaId ? String(marcaId) : "");
    setMinCaracteresImeiModelo("");
    setModalModeloOpen(true);
  }

  function openEditModelo(modelo: Modelo) {
    setEditingModelo(modelo);
    setNomeModelo(modelo.nome);
    setMarcaIdForModelo(String(modelo.marca.id));
    setMinCaracteresImeiModelo(
      modelo.minCaracteresImei ? String(modelo.minCaracteresImei) : "",
    );
    setModalModeloOpen(true);
  }

  function closeModalModelo() {
    setModalModeloOpen(false);
    setEditingModelo(null);
    setNomeModelo("");
    setMarcaIdForModelo("");
    setMinCaracteresImeiModelo("");
  }

  function handleSaveModelo() {
    if (!nomeModelo.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (!editingModelo && !marcaIdForModelo) {
      toast.error("Selecione uma marca");
      return;
    }
    const minImei = minCaracteresImeiModelo
      ? Number(minCaracteresImeiModelo)
      : undefined;
    if (editingModelo) {
      updateModeloMutation.mutate({
        id: editingModelo.id,
        nome: nomeModelo,
        minCaracteresImei: minImei,
      });
    } else {
      createModeloMutation.mutate({
        nome: nomeModelo,
        marcaId: Number(marcaIdForModelo),
        minCaracteresImei: minImei,
      });
    }
  }

  function toggleAtivoModelo(modelo: Modelo) {
    updateModeloMutation.mutate({ id: modelo.id, ativo: !modelo.ativo });
  }

  function openCreateOperadora() {
    setEditingOperadora(null);
    setNomeOperadora("");
    setModalOperadoraOpen(true);
  }

  function openEditOperadora(operadora: Operadora) {
    setEditingOperadora(operadora);
    setNomeOperadora(operadora.nome);
    setModalOperadoraOpen(true);
  }

  function closeModalOperadora() {
    setModalOperadoraOpen(false);
    setEditingOperadora(null);
    setNomeOperadora("");
  }

  function handleSaveOperadora() {
    if (!nomeOperadora.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (editingOperadora) {
      updateOperadoraMutation.mutate({
        id: editingOperadora.id,
        nome: nomeOperadora,
      });
    } else {
      createOperadoraMutation.mutate({ nome: nomeOperadora });
    }
  }

  function toggleAtivoOperadora(operadora: Operadora) {
    updateOperadoraMutation.mutate({
      id: operadora.id,
      ativo: !operadora.ativo,
    });
  }

  // Marca Simcard mutations
  const createMarcaSimcardMutation = useMutation({
    mutationFn: (data: {
      nome: string;
      operadoraId: number;
      temPlanos?: boolean;
      minCaracteresIccid?: number;
    }) =>
      api("/equipamentos/marcas-simcard", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marcas-simcard"] });
      closeModalMarcaSimcard();
      toast.success("Marca de simcard criada com sucesso");
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Erro ao criar marca de simcard",
      ),
  });

  const updateMarcaSimcardMutation = useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: number;
      nome?: string;
      operadoraId?: number;
      temPlanos?: boolean;
      ativo?: boolean;
      minCaracteresIccid?: number;
    }) =>
      api(`/equipamentos/marcas-simcard/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marcas-simcard"] });
      closeModalMarcaSimcard();
      toast.success("Marca de simcard atualizada com sucesso");
    },
    onError: (err) =>
      toast.error(
        err instanceof Error
          ? err.message
          : "Erro ao atualizar marca de simcard",
      ),
  });

  const deleteMarcaSimcardMutation = useMutation({
    mutationFn: (id: number) =>
      api(`/equipamentos/marcas-simcard/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marcas-simcard"] });
      toast.success("Marca de simcard excluída com sucesso");
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Erro ao excluir marca de simcard",
      ),
  });

  function openCreateMarcaSimcard() {
    setEditingMarcaSimcard(null);
    setNomeMarcaSimcard("");
    setOperadoraIdMarcaSimcard("");
    setTemPlanosMarcaSimcard(false);
    setMinCaracteresIccidMarcaSimcard("");
    setModalMarcaSimcardOpen(true);
  }

  function openEditMarcaSimcard(m: MarcaSimcard) {
    setEditingMarcaSimcard(m);
    setNomeMarcaSimcard(m.nome);
    setOperadoraIdMarcaSimcard(String(m.operadoraId));
    setTemPlanosMarcaSimcard(m.temPlanos);
    setMinCaracteresIccidMarcaSimcard(
      m.minCaracteresIccid ? String(m.minCaracteresIccid) : "",
    );
    setModalMarcaSimcardOpen(true);
  }

  function closeModalMarcaSimcard() {
    setModalMarcaSimcardOpen(false);
    setEditingMarcaSimcard(null);
    setNomeMarcaSimcard("");
    setOperadoraIdMarcaSimcard("");
    setTemPlanosMarcaSimcard(false);
    setMinCaracteresIccidMarcaSimcard("");
  }

  function handleSaveMarcaSimcard() {
    if (!nomeMarcaSimcard.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (!editingMarcaSimcard && !operadoraIdMarcaSimcard) {
      toast.error("Selecione uma operadora");
      return;
    }
    const minIccid = minCaracteresIccidMarcaSimcard
      ? Number(minCaracteresIccidMarcaSimcard)
      : undefined;
    if (editingMarcaSimcard) {
      updateMarcaSimcardMutation.mutate({
        id: editingMarcaSimcard.id,
        nome: nomeMarcaSimcard,
        operadoraId: operadoraIdMarcaSimcard
          ? Number(operadoraIdMarcaSimcard)
          : undefined,
        temPlanos: temPlanosMarcaSimcard,
        minCaracteresIccid: minIccid,
      });
    } else {
      createMarcaSimcardMutation.mutate({
        nome: nomeMarcaSimcard,
        operadoraId: Number(operadoraIdMarcaSimcard),
        temPlanos: temPlanosMarcaSimcard,
        minCaracteresIccid: minIccid,
      });
    }
  }

  function toggleMarcaSimcard(marcaId: number) {
    setExpandedMarcasSimcardIds((prev) => {
      const next = new Set(prev);
      if (next.has(marcaId)) next.delete(marcaId);
      else next.add(marcaId);
      return next;
    });
  }

  const createPlanoSimcardMutation = useMutation({
    mutationFn: (data: { marcaSimcardId: number; planoMb: number }) =>
      api("/equipamentos/planos-simcard", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marcas-simcard"] });
      closeModalPlanoSimcard();
      toast.success("Plano criado com sucesso");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Erro ao criar plano"),
  });

  const updatePlanoSimcardMutation = useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: number;
      planoMb?: number;
      ativo?: boolean;
    }) =>
      api(`/equipamentos/planos-simcard/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marcas-simcard"] });
      closeModalPlanoSimcard();
      toast.success("Plano atualizado com sucesso");
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Erro ao atualizar plano",
      ),
  });

  const deletePlanoSimcardMutation = useMutation({
    mutationFn: (id: number) =>
      api(`/equipamentos/planos-simcard/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marcas-simcard"] });
      toast.success("Plano desativado com sucesso");
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Erro ao desativar plano",
      ),
  });

  function openCreatePlanoSimcard(marcaId: number) {
    setEditingPlanoSimcard(null);
    setPlanoMbPlanoSimcard("");
    setMarcaSimcardIdForPlano(marcaId);
    setModalPlanoSimcardOpen(true);
  }

  function openEditPlanoSimcard(plano: PlanoSimcard) {
    setEditingPlanoSimcard(plano);
    setPlanoMbPlanoSimcard(plano.planoMb);
    setMarcaSimcardIdForPlano(plano.marcaSimcardId);
    setModalPlanoSimcardOpen(true);
  }

  function closeModalPlanoSimcard() {
    setModalPlanoSimcardOpen(false);
    setEditingPlanoSimcard(null);
    setPlanoMbPlanoSimcard("");
    setMarcaSimcardIdForPlano(null);
  }

  function handleSavePlanoSimcard() {
    if (planoMbPlanoSimcard === "" || Number(planoMbPlanoSimcard) <= 0) {
      toast.error("Informe o valor em MB");
      return;
    }
    if (!marcaSimcardIdForPlano) return;
    if (editingPlanoSimcard) {
      updatePlanoSimcardMutation.mutate({
        id: editingPlanoSimcard.id,
        planoMb: Number(planoMbPlanoSimcard),
      });
    } else {
      createPlanoSimcardMutation.mutate({
        marcaSimcardId: marcaSimcardIdForPlano,
        planoMb: Number(planoMbPlanoSimcard),
      });
    }
  }

  function toggleAtivoMarcaSimcard(m: MarcaSimcard) {
    updateMarcaSimcardMutation.mutate({ id: m.id, ativo: !m.ativo });
  }

  const isLoading =
    loadingMarcas ||
    loadingModelos ||
    loadingOperadoras ||
    loadingMarcasSimcard;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="-m-4 flex min-h-[100dvh] flex-col bg-slate-100">
      {/* Header */}
      <header className="h-20 shrink-0 flex items-center justify-between border-b border-slate-200 bg-white px-8">
        <div className="flex items-center gap-4">
          <Link
            to="/equipamentos"
            className="flex h-9 w-9 items-center justify-center rounded-sm border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-3">
            <MaterialIcon
              name="precision_manufacturing"
              className="text-erp-blue text-xl"
            />
            <div>
              <h1 className="text-lg font-bold text-slate-800 uppercase tracking-tight">
                Marcas, Modelos e Operadoras
              </h1>
              <p className="text-xs text-slate-500">
                Gestão de marcas, modelos e operadoras dos aparelhos e simcards.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content - Grid 12 cols */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-12 gap-6 h-full">
          {/* Col 7 - Marcas e Modelos */}
          <div className="col-span-7 flex flex-col">
            <div className="bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col flex-1 min-h-0">
              <div className="p-4 border-b border-slate-100 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <MaterialIcon name="sensors" className="text-blue-600" />
                    Marcas e Modelos de Rastreador
                  </h2>
                  {canEdit && (
                    <Button
                      className="bg-erp-blue hover:bg-blue-700 text-white text-[10px] font-bold h-8 px-3 rounded-sm flex items-center gap-1.5 uppercase"
                      onClick={() => openCreateMarca()}
                    >
                      <MaterialIcon name="add" className="text-base" />
                      Nova Marca
                    </Button>
                  )}
                </div>
                <div className="relative">
                  <MaterialIcon
                    name="search"
                    className="absolute left-3 top-2 text-slate-400 text-lg"
                  />
                  <Input
                    className="h-9 pl-9 pr-3 w-full bg-slate-100 border-transparent focus:bg-white focus:ring-1 focus:ring-blue-500 text-xs rounded-sm"
                    placeholder="Pesquisar marca ou modelo..."
                    value={searchMarcas}
                    onChange={(e) => setSearchMarcas(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredMarcas.map((marca) => {
                  const isExpanded = expandedMarcaIds.has(marca.id);
                  const modelosDaMarca = modelosByMarca.get(marca.id) ?? [];
                  return (
                    <div
                      key={marca.id}
                      className="border-b border-slate-50 last:border-b-0"
                    >
                      <div
                        className={cn(
                          "flex items-center justify-between p-4 cursor-pointer transition-colors",
                          isExpanded ? "bg-slate-50/50" : "hover:bg-slate-50",
                        )}
                        onClick={() => toggleMarca(marca.id)}
                      >
                        <div className="flex items-center gap-3">
                          <MaterialIcon
                            name={isExpanded ? "expand_more" : "chevron_right"}
                            className="text-slate-400"
                          />
                          <span className="font-bold text-slate-800 text-sm tracking-tight">
                            {marca.nome}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded font-bold",
                              marca.ativo
                                ? "bg-blue-100 text-blue-700"
                                : "bg-slate-100 text-slate-500",
                            )}
                          >
                            {String(marca._count.modelos).padStart(2, "0")}{" "}
                            MODELOS
                          </span>
                        </div>
                        {canEdit && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className="text-slate-400 hover:text-slate-600"
                              >
                                <MaterialIcon name="edit" className="text-lg" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <DropdownMenuItem
                                onClick={() => openEditMarca(marca)}
                              >
                                <MaterialIcon
                                  name="edit"
                                  className="mr-2 text-base"
                                />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => toggleAtivoMarca(marca)}
                              >
                                <MaterialIcon
                                  name={
                                    marca.ativo
                                      ? "visibility_off"
                                      : "visibility"
                                  }
                                  className="mr-2 text-base"
                                />
                                {marca.ativo ? "Desativar" : "Ativar"}
                              </DropdownMenuItem>
                              {marca._count.modelos === 0 && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    deleteMarcaMutation.mutate(marca.id)
                                  }
                                  className="text-red-600"
                                >
                                  <MaterialIcon
                                    name="delete"
                                    className="mr-2 text-base"
                                  />
                                  Excluir
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      {isExpanded && (
                        <div className="bg-white">
                          {modelosDaMarca.length === 0 ? (
                            <div className="py-4 pl-10 pr-4 text-xs text-slate-500 flex items-center justify-between">
                              <span>Nenhum modelo cadastrado</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-[10px] h-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openCreateModelo(marca.id);
                                }}
                              >
                                <MaterialIcon
                                  name="add"
                                  className="text-sm mr-1"
                                />
                                Novo Modelo
                              </Button>
                            </div>
                          ) : (
                            modelosDaMarca.map((modelo) => (
                              <div
                                key={modelo.id}
                                className="flex items-center justify-between py-3 pl-10 pr-4 hover:bg-blue-50/30 border-l-2 border-transparent hover:border-blue-400 transition-all"
                              >
                                <span
                                  className={cn(
                                    "text-xs font-medium",
                                    modelo.ativo
                                      ? "text-slate-600"
                                      : "text-slate-400 line-through",
                                  )}
                                >
                                  {modelo.nome}
                                </span>
                                <div className="flex items-center gap-4">
                                  <span
                                    className={cn(
                                      "px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase border",
                                      modelo.ativo
                                        ? "bg-green-50 text-green-700 border-green-100"
                                        : "bg-slate-100 text-slate-600 border-slate-200",
                                    )}
                                  >
                                    {modelo.ativo ? "Ativo" : "Desativado"}
                                  </span>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-slate-300 hover:text-slate-500"
                                      >
                                        <MoreVertical className="h-5 w-5" />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={() => openEditModelo(modelo)}
                                      >
                                        <MaterialIcon
                                          name="edit"
                                          className="mr-2 text-base"
                                        />
                                        Editar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          toggleAtivoModelo(modelo)
                                        }
                                      >
                                        <MaterialIcon
                                          name={
                                            modelo.ativo
                                              ? "visibility_off"
                                              : "visibility"
                                          }
                                          className="mr-2 text-base"
                                        />
                                        {modelo.ativo ? "Desativar" : "Ativar"}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          deleteModeloMutation.mutate(modelo.id)
                                        }
                                        className="text-red-600"
                                      >
                                        <MaterialIcon
                                          name="delete"
                                          className="mr-2 text-base"
                                        />
                                        Excluir
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            ))
                          )}
                          {modelosDaMarca.length > 0 && (
                            <div className="py-2 pl-10 pr-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-[10px] h-7 text-blue-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openCreateModelo(marca.id);
                                }}
                              >
                                <MaterialIcon
                                  name="add"
                                  className="text-sm mr-1"
                                />
                                Novo Modelo
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {filteredMarcas.length === 0 && (
                  <div className="p-8 text-center text-sm text-slate-500">
                    Nenhuma marca encontrada
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Total: {filteredMarcas.length} Marcas / {totalModelos} Modelos
                </span>
              </div>
            </div>
          </div>

          {/* Col 5 - Operadoras */}
          <div className="col-span-5 flex flex-col">
            <div className="bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col flex-1 min-h-0">
              <div className="p-4 border-b border-slate-100 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <MaterialIcon
                      name="signal_cellular_alt"
                      className="text-blue-600"
                    />
                    Operadoras
                  </h2>
                  {canEdit && (
                    <Button
                      className="bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-bold h-8 px-3 rounded-sm flex items-center gap-1.5 uppercase"
                      onClick={openCreateOperadora}
                    >
                      <MaterialIcon name="add" className="text-base" />
                      Nova Operadora
                    </Button>
                  )}
                </div>
                <div className="relative">
                  <MaterialIcon
                    name="search"
                    className="absolute left-3 top-2 text-slate-400 text-lg"
                  />
                  <Input
                    className="h-9 pl-9 pr-3 w-full bg-slate-100 border-transparent focus:bg-white focus:ring-1 focus:ring-blue-500 text-xs rounded-sm"
                    placeholder="Filtrar operadoras..."
                    value={searchOperadoras}
                    onChange={(e) => setSearchOperadoras(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                        Nome
                      </th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                        Status
                      </th>
                      {canEdit && (
                        <th className="px-4 py-2.5 w-10 border-b border-slate-100" />
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredOperadoras.map((operadora) => (
                      <tr
                        key={operadora.id}
                        className={cn(
                          "hover:bg-slate-50/50 transition-colors",
                          !operadora.ativo && "opacity-60 bg-slate-50/20",
                        )}
                      >
                        <td className="px-4 py-4">
                          <span
                            className={cn(
                              "text-xs font-bold",
                              operadora.ativo
                                ? "text-slate-800"
                                : "text-slate-500",
                            )}
                          >
                            {operadora.nome}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5">
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full",
                                operadora.ativo
                                  ? "bg-emerald-500"
                                  : "bg-slate-400",
                              )}
                            />
                            <span
                              className={cn(
                                "text-[10px] font-bold uppercase",
                                operadora.ativo
                                  ? "text-slate-600"
                                  : "text-slate-400",
                              )}
                            >
                              {operadora.ativo ? "Ativo" : "Inativo"}
                            </span>
                          </div>
                        </td>
                        {canEdit && (
                          <td className="px-4 py-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  className="text-slate-400 hover:text-slate-600"
                                >
                                  <MaterialIcon
                                    name="settings"
                                    className="text-lg"
                                  />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => openEditOperadora(operadora)}
                                >
                                  <MaterialIcon
                                    name="edit"
                                    className="mr-2 text-base"
                                  />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    toggleAtivoOperadora(operadora)
                                  }
                                >
                                  <MaterialIcon
                                    name={
                                      operadora.ativo
                                        ? "visibility_off"
                                        : "visibility"
                                    }
                                    className="mr-2 text-base"
                                  />
                                  {operadora.ativo ? "Desativar" : "Ativar"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    deleteOperadoraMutation.mutate(operadora.id)
                                  }
                                  className="text-red-600"
                                >
                                  <MaterialIcon
                                    name="delete"
                                    className="mr-2 text-base"
                                  />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        )}
                      </tr>
                    ))}
                    {filteredOperadoras.length === 0 && (
                      <tr>
                        <td
                          colSpan={canEdit ? 3 : 2}
                          className="px-4 py-12 text-center text-sm text-slate-500"
                        >
                          Nenhuma operadora encontrada
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Total: {filteredOperadoras.length} Operadoras Registradas
                </span>
              </div>
            </div>
          </div>

          {/* Marcas Simcard - full width */}
          <div className="col-span-12 flex flex-col">
            <div className="bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col flex-1 min-h-0">
              <div className="p-4 border-b border-slate-100 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <MaterialIcon name="sim_card" className="text-blue-600" />
                    Marcas de Simcard
                  </h2>
                  {canEdit && (
                    <Button
                      className="bg-erp-blue hover:bg-blue-700 text-white text-[10px] font-bold h-8 px-3 rounded-sm flex items-center gap-1.5 uppercase"
                      onClick={openCreateMarcaSimcard}
                    >
                      <MaterialIcon name="add" className="text-base" />
                      Nova Marca
                    </Button>
                  )}
                </div>
                <div className="relative">
                  <MaterialIcon
                    name="search"
                    className="absolute left-3 top-2 text-slate-400 text-lg"
                  />
                  <Input
                    className="h-9 pl-9 pr-3 w-full bg-slate-100 border-transparent focus:bg-white focus:ring-1 focus:ring-blue-500 text-xs rounded-sm"
                    placeholder="Filtrar por marca ou operadora..."
                    value={searchMarcasSimcard}
                    onChange={(e) => setSearchMarcasSimcard(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto max-h-64">
                {filteredMarcasSimcard.map((m) => {
                  const isExpanded = expandedMarcasSimcardIds.has(m.id);
                  const planosDaMarca = (m.planos ?? []).filter((p) => p.ativo);
                  return (
                    <div
                      key={m.id}
                      className="border-b border-slate-50 last:border-b-0"
                    >
                      <div
                        className={cn(
                          "flex items-center justify-between p-4 cursor-pointer transition-colors",
                          isExpanded ? "bg-slate-50/50" : "hover:bg-slate-50",
                        )}
                        onClick={() => toggleMarcaSimcard(m.id)}
                      >
                        <div className="flex items-center gap-3">
                          <MaterialIcon
                            name={isExpanded ? "expand_more" : "chevron_right"}
                            className="text-slate-400"
                          />
                          <span
                            className={cn(
                              "text-xs font-bold",
                              m.ativo ? "text-slate-800" : "text-slate-500",
                            )}
                          >
                            {m.nome}
                          </span>
                          <span className="text-xs text-slate-500">•</span>
                          <span className="text-xs text-slate-600">
                            {m.operadora.nome}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded font-bold",
                              m.temPlanos
                                ? "bg-blue-100 text-blue-700"
                                : "bg-slate-100 text-slate-500",
                            )}
                          >
                            {m.temPlanos ? "Tem planos" : "Sem planos"}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded font-bold",
                              m.ativo
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-500",
                            )}
                          >
                            {m.ativo ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                        {canEdit && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                onClick={(e) => e.stopPropagation()}
                                className="text-slate-400 hover:text-slate-600"
                              >
                                <MaterialIcon
                                  name="settings"
                                  className="text-lg"
                                />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <DropdownMenuItem
                                onClick={() => openEditMarcaSimcard(m)}
                              >
                                <MaterialIcon
                                  name="edit"
                                  className="mr-2 text-base"
                                />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => toggleAtivoMarcaSimcard(m)}
                              >
                                <MaterialIcon
                                  name={
                                    m.ativo ? "visibility_off" : "visibility"
                                  }
                                  className="mr-2 text-base"
                                />
                                {m.ativo ? "Desativar" : "Ativar"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  deleteMarcaSimcardMutation.mutate(m.id)
                                }
                                className="text-red-600"
                              >
                                <MaterialIcon
                                  name="delete"
                                  className="mr-2 text-base"
                                />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      {isExpanded && (
                        <div className="bg-white">
                          {m.temPlanos ? (
                            planosDaMarca.length === 0 ? (
                              <div className="py-4 pl-10 pr-4 text-xs text-slate-500 flex items-center justify-between">
                                <span>Nenhum plano cadastrado</span>
                                {canEdit && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-[10px] h-7"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openCreatePlanoSimcard(m.id);
                                    }}
                                  >
                                    <MaterialIcon
                                      name="add"
                                      className="text-sm mr-1"
                                    />
                                    Adicionar Plano
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <>
                                {planosDaMarca.map((plano) => (
                                  <div
                                    key={plano.id}
                                    className="flex items-center justify-between py-3 pl-10 pr-4 hover:bg-blue-50/30 border-l-2 border-transparent hover:border-blue-400 transition-all"
                                  >
                                    <span className="text-xs font-medium text-slate-600">
                                      {plano.planoMb} MB
                                    </span>
                                    {canEdit && (
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <button
                                            type="button"
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-slate-300 hover:text-slate-500"
                                          >
                                            <MoreVertical className="h-5 w-5" />
                                          </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem
                                            onClick={() =>
                                              openEditPlanoSimcard(plano)
                                            }
                                          >
                                            <MaterialIcon
                                              name="edit"
                                              className="mr-2 text-base"
                                            />
                                            Editar
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() =>
                                              deletePlanoSimcardMutation.mutate(
                                                plano.id,
                                              )
                                            }
                                            className="text-red-600"
                                          >
                                            <MaterialIcon
                                              name="delete"
                                              className="mr-2 text-base"
                                            />
                                            Excluir
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    )}
                                  </div>
                                ))}
                                {canEdit && (
                                  <div className="py-2 pl-10 pr-4">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-[10px] h-7 text-blue-600"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openCreatePlanoSimcard(m.id);
                                      }}
                                    >
                                      <MaterialIcon
                                        name="add"
                                        className="text-sm mr-1"
                                      />
                                      Adicionar Plano
                                    </Button>
                                  </div>
                                )}
                              </>
                            )
                          ) : (
                            <div className="py-4 pl-10 pr-4 text-xs text-slate-500">
                              Marca sem planos cadastrados. Edite a marca e
                              marque &quot;Tem planos&quot; para adicionar.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {filteredMarcasSimcard.length === 0 && (
                  <div className="p-8 text-center text-sm text-slate-500">
                    Nenhuma marca de simcard encontrada
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Total: {filteredMarcasSimcard.length} Marcas de Simcard
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Marca */}
      <Dialog
        open={modalMarcaOpen}
        onOpenChange={(o) => !o && closeModalMarca()}
      >
        <DialogContent
          hideClose
          className="max-w-md p-0 gap-0 overflow-hidden rounded-sm"
        >
          <header className="bg-white border-b border-slate-200 p-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MaterialIcon
                name="precision_manufacturing"
                className="text-blue-600"
              />
              <h2 className="text-lg font-bold text-slate-800">
                {editingMarca ? "Editar Marca" : "Nova Marca"}
              </h2>
            </div>
            <button
              onClick={closeModalMarca}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </header>
          <div className="p-6">
            <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
              Nome da Marca <span className="text-red-500">*</span>
            </Label>
            <Input
              value={nomeMarca}
              onChange={(e) => setNomeMarca(e.target.value)}
              placeholder="Ex: Teltonika"
              className="h-10"
            />
          </div>
          <footer className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end gap-3">
            <Button variant="ghost" onClick={closeModalMarca}>
              Cancelar
            </Button>
            <Button
              className="bg-erp-blue hover:bg-blue-700"
              onClick={handleSaveMarca}
              disabled={
                createMarcaMutation.isPending || updateMarcaMutation.isPending
              }
            >
              {createMarcaMutation.isPending || updateMarcaMutation.isPending
                ? "Salvando..."
                : "Salvar"}
            </Button>
          </footer>
        </DialogContent>
      </Dialog>

      {/* Modal Modelo */}
      <Dialog
        open={modalModeloOpen}
        onOpenChange={(o) => !o && closeModalModelo()}
      >
        <DialogContent
          hideClose
          className="max-w-md p-0 gap-0 overflow-hidden rounded-sm"
        >
          <header className="bg-white border-b border-slate-200 p-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MaterialIcon name="devices" className="text-blue-600" />
              <h2 className="text-lg font-bold text-slate-800">
                {editingModelo ? "Editar Modelo" : "Novo Modelo"}
              </h2>
            </div>
            <button
              onClick={closeModalModelo}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </header>
          <div className="p-6 space-y-4">
            {!editingModelo && (
              <div>
                <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                  Marca <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={marcaIdForModelo}
                  onValueChange={setMarcaIdForModelo}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Selecione uma marca..." />
                  </SelectTrigger>
                  <SelectContent>
                    {marcasAtivas.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {m.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {editingModelo && (
              <div>
                <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                  Marca
                </Label>
                <div className="h-10 px-3 flex items-center bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-600">
                  {editingModelo.marca.nome}
                </div>
              </div>
            )}
            <div>
              <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                Nome do Modelo <span className="text-red-500">*</span>
              </Label>
              <Input
                value={nomeModelo}
                onChange={(e) => setNomeModelo(e.target.value)}
                placeholder="Ex: FMB920"
                className="h-10"
              />
            </div>
            <div>
              <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                Mínimo de caracteres do IMEI
              </Label>
              <Input
                type="number"
                min={1}
                value={minCaracteresImeiModelo}
                onChange={(e) => setMinCaracteresImeiModelo(e.target.value)}
                placeholder="Ex: 15"
                className="h-10"
              />
            </div>
          </div>
          <footer className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end gap-3">
            <Button variant="ghost" onClick={closeModalModelo}>
              Cancelar
            </Button>
            <Button
              className="bg-erp-blue hover:bg-blue-700"
              onClick={handleSaveModelo}
              disabled={
                createModeloMutation.isPending || updateModeloMutation.isPending
              }
            >
              {createModeloMutation.isPending || updateModeloMutation.isPending
                ? "Salvando..."
                : "Salvar"}
            </Button>
          </footer>
        </DialogContent>
      </Dialog>

      {/* Modal Operadora */}
      <Dialog
        open={modalOperadoraOpen}
        onOpenChange={(o) => !o && closeModalOperadora()}
      >
        <DialogContent
          hideClose
          className="max-w-md p-0 gap-0 overflow-hidden rounded-sm"
        >
          <header className="bg-white border-b border-slate-200 p-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MaterialIcon name="sim_card" className="text-blue-600" />
              <h2 className="text-lg font-bold text-slate-800">
                {editingOperadora ? "Editar Operadora" : "Nova Operadora"}
              </h2>
            </div>
            <button
              onClick={closeModalOperadora}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </header>
          <div className="p-6">
            <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
              Nome da Operadora <span className="text-red-500">*</span>
            </Label>
            <Input
              value={nomeOperadora}
              onChange={(e) => setNomeOperadora(e.target.value)}
              placeholder="Ex: Vivo"
              className="h-10"
            />
          </div>
          <footer className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end gap-3">
            <Button variant="ghost" onClick={closeModalOperadora}>
              Cancelar
            </Button>
            <Button
              className="bg-erp-blue hover:bg-blue-700"
              onClick={handleSaveOperadora}
              disabled={
                createOperadoraMutation.isPending ||
                updateOperadoraMutation.isPending
              }
            >
              {createOperadoraMutation.isPending ||
              updateOperadoraMutation.isPending
                ? "Salvando..."
                : "Salvar"}
            </Button>
          </footer>
        </DialogContent>
      </Dialog>

      {/* Modal Marca Simcard */}
      <Dialog
        open={modalMarcaSimcardOpen}
        onOpenChange={(o) => !o && closeModalMarcaSimcard()}
      >
        <DialogContent
          hideClose
          className="max-w-md p-0 gap-0 overflow-hidden rounded-sm"
        >
          <header className="bg-white border-b border-slate-200 p-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MaterialIcon name="sim_card" className="text-blue-600" />
              <h2 className="text-lg font-bold text-slate-800">
                {editingMarcaSimcard
                  ? "Editar Marca de Simcard"
                  : "Nova Marca de Simcard"}
              </h2>
            </div>
            <button
              onClick={closeModalMarcaSimcard}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </header>
          <div className="p-6 space-y-4">
            {!editingMarcaSimcard && (
              <div>
                <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                  Operadora <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={operadoraIdMarcaSimcard}
                  onValueChange={setOperadoraIdMarcaSimcard}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Selecione uma operadora..." />
                  </SelectTrigger>
                  <SelectContent>
                    {operadorasAtivas.map((o) => (
                      <SelectItem key={o.id} value={String(o.id)}>
                        {o.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {editingMarcaSimcard && (
              <div>
                <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                  Operadora
                </Label>
                <Select
                  value={operadoraIdMarcaSimcard}
                  onValueChange={setOperadoraIdMarcaSimcard}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {operadorasAtivas.map((o) => (
                      <SelectItem key={o.id} value={String(o.id)}>
                        {o.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                Nome da Marca <span className="text-red-500">*</span>
              </Label>
              <Input
                value={nomeMarcaSimcard}
                onChange={(e) => setNomeMarcaSimcard(e.target.value)}
                placeholder="Ex: Getrak, Virtueyes, 1nce"
                className="h-10"
              />
            </div>
            <div>
              <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                Mínimo de caracteres do ICCID
              </Label>
              <Input
                type="number"
                min={1}
                value={minCaracteresIccidMarcaSimcard}
                onChange={(e) =>
                  setMinCaracteresIccidMarcaSimcard(e.target.value)
                }
                placeholder="Ex: 19"
                className="h-10"
              />
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="temPlanos"
                checked={temPlanosMarcaSimcard}
                onCheckedChange={(v) => setTemPlanosMarcaSimcard(!!v)}
                className="border-slate-300 data-[state=checked]:bg-erp-blue data-[state=checked]:border-erp-blue"
              />
              <Label
                htmlFor="temPlanos"
                className="text-sm font-medium text-slate-700 cursor-pointer"
              >
                Tem planos (500 MB, 1 GB, etc.)
              </Label>
            </div>
          </div>
          <footer className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end gap-3">
            <Button variant="ghost" onClick={closeModalMarcaSimcard}>
              Cancelar
            </Button>
            <Button
              className="bg-erp-blue hover:bg-blue-700"
              onClick={handleSaveMarcaSimcard}
              disabled={
                createMarcaSimcardMutation.isPending ||
                updateMarcaSimcardMutation.isPending
              }
            >
              {createMarcaSimcardMutation.isPending ||
              updateMarcaSimcardMutation.isPending
                ? "Salvando..."
                : "Salvar"}
            </Button>
          </footer>
        </DialogContent>
      </Dialog>

      {/* Modal Plano Simcard */}
      <Dialog
        open={modalPlanoSimcardOpen}
        onOpenChange={(o) => !o && closeModalPlanoSimcard()}
      >
        <DialogContent
          hideClose
          className="max-w-md p-0 gap-0 overflow-hidden rounded-sm"
        >
          <header className="bg-white border-b border-slate-200 p-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MaterialIcon name="sim_card" className="text-blue-600" />
              <h2 className="text-lg font-bold text-slate-800">
                {editingPlanoSimcard ? "Editar Plano" : "Novo Plano"}
              </h2>
            </div>
            <button
              onClick={closeModalPlanoSimcard}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </header>
          <div className="p-6 space-y-4">
            <div>
              <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                Plano (MB) <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                min={1}
                placeholder="Ex: 500, 1024"
                value={planoMbPlanoSimcard}
                onChange={(e) => {
                  const v = e.target.value;
                  setPlanoMbPlanoSimcard(
                    v === "" ? "" : Math.max(0, parseInt(v, 10) || 0),
                  );
                }}
                className="h-10"
              />
            </div>
          </div>
          <footer className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end gap-3">
            <Button variant="ghost" onClick={closeModalPlanoSimcard}>
              Cancelar
            </Button>
            <Button
              className="bg-erp-blue hover:bg-blue-700"
              onClick={handleSavePlanoSimcard}
              disabled={
                createPlanoSimcardMutation.isPending ||
                updatePlanoSimcardMutation.isPending
              }
            >
              {createPlanoSimcardMutation.isPending ||
              updatePlanoSimcardMutation.isPending
                ? "Salvando..."
                : "Salvar"}
            </Button>
          </footer>
        </DialogContent>
      </Dialog>
    </div>
  );
}
