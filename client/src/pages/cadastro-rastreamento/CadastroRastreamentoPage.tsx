import { CadastroRastreamentoStatsCards } from "./components/CadastroRastreamentoStatsCards";
import { CadastroRastreamentoTable } from "./components/CadastroRastreamentoTable";
import { CadastroRastreamentoToolbar } from "./components/CadastroRastreamentoToolbar";
import { CadastroRastreamentoWorkPanel } from "./components/CadastroRastreamentoWorkPanel";
import { useCadastroRastreamento } from "./hooks/useCadastroRastreamento";

export function CadastroRastreamentoPage() {
  const {
    setSelectedId,
    plataforma,
    setPlataforma,
    filtroStatus,
    setFiltroStatus,
    filtroTecnico,
    setFiltroTecnico,
    filtroTipo,
    setFiltroTipo,
    periodo,
    setPeriodo,
    isLoading,
    ordensFiltradas,
    tecnicos,
    selectedOrdem,
    selectedId,
    statsAguardando,
    statsEmCadastro,
    statsConcluido,
    temFiltroAtivo,
    isMutating,
    handleAvancarStatus,
    copiar,
    copiarTodos,
    auxilioCopiaItens,
  } = useCadastroRastreamento();

  return (
    <div className="space-y-4">
      <CadastroRastreamentoStatsCards
        statsAguardando={statsAguardando}
        statsEmCadastro={statsEmCadastro}
        statsConcluido={statsConcluido}
      />

      <CadastroRastreamentoToolbar
        tecnicos={tecnicos}
        filtroTecnico={filtroTecnico}
        setFiltroTecnico={setFiltroTecnico}
        filtroTipo={filtroTipo}
        setFiltroTipo={setFiltroTipo}
        periodo={periodo}
        setPeriodo={setPeriodo}
        filtroStatus={filtroStatus}
        setFiltroStatus={setFiltroStatus}
        temFiltroAtivo={temFiltroAtivo}
        onLimparFiltrosTecnicoETipo={() => {
          setFiltroTecnico("");
          setFiltroTipo("");
        }}
      />

      <div className="flex gap-4 items-start">
        <CadastroRastreamentoTable
          isLoading={isLoading}
          ordensFiltradas={ordensFiltradas}
          selectedId={selectedId}
          onToggleRow={(id) =>
            setSelectedId((prev) => (prev === id ? null : id))
          }
        />

        <CadastroRastreamentoWorkPanel
          selectedOrdem={selectedOrdem}
          plataforma={plataforma}
          setPlataforma={setPlataforma}
          isMutating={isMutating}
          handleAvancarStatus={handleAvancarStatus}
          copiar={copiar}
          copiarTodos={copiarTodos}
          auxilioCopiaItens={auxilioCopiaItens}
        />
      </div>

      <div className="text-[11px] text-slate-500">
        {ordensFiltradas.length} ordem(ns) encontrada(s)
      </div>
    </div>
  );
}
