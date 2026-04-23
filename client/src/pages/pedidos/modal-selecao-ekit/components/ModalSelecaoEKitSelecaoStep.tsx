import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MaterialIcon } from "@/components/MaterialIcon";
import { formatarDataHora } from "@/lib/format";
import type { KitDetalhe, KitResumo } from "../../shared/pedidos-config-types";
import type { UseMutationResult } from "@tanstack/react-query";

export interface ModalSelecaoEKitSelecaoStepProps {
  showCriarNovo: boolean;
  setShowCriarNovo: (v: boolean) => void;
  nomeNovoKit: string;
  setNomeNovoKit: (v: string) => void;
  filtroBusca: string;
  setFiltroBusca: (v: string) => void;
  loadingKits: boolean;
  kitsFiltrados: KitDetalhe[];
  kitsDisponiveis: KitDetalhe[];
  kitsCompativeis: KitDetalhe[];
  createMutation: UseMutationResult<KitResumo, Error, string, unknown>;
  handleCriarNovo: () => void;
  handleEscolherKit: (k: KitDetalhe) => void;
  handleClose: () => void;
}

export function ModalSelecaoEKitSelecaoStep({
  showCriarNovo,
  setShowCriarNovo,
  nomeNovoKit,
  setNomeNovoKit,
  filtroBusca,
  setFiltroBusca,
  loadingKits,
  kitsFiltrados,
  kitsDisponiveis,
  kitsCompativeis,
  createMutation,
  handleCriarNovo,
  handleEscolherKit,
  handleClose,
}: ModalSelecaoEKitSelecaoStepProps) {
  return (
    <>
      <header className="bg-white border-b border-slate-200 px-6 py-5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <MaterialIcon name="hub" className="text-blue-600" />
          <div>
            <h2 className="text-base font-bold text-slate-800 uppercase tracking-tight">
              Seleção de Kit
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Selecione ou crie um novo kit para configuração
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setShowCriarNovo(true)}
            className="bg-erp-blue hover:bg-blue-700 text-xs font-bold uppercase"
          >
            <MaterialIcon name="add_box" className="text-lg" />
            Criar Novo Kit
          </Button>
        </div>
      </header>
      {showCriarNovo && (
        <div className="px-6 py-3 bg-slate-50 border-b flex gap-2 items-center">
          <Input
            value={nomeNovoKit}
            onChange={(e) => setNomeNovoKit(e.target.value)}
            placeholder="Nome do novo kit (ex: KIT-015)"
            className="text-sm flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleCriarNovo()}
          />
          <Button
            size="sm"
            onClick={() => handleCriarNovo()}
            disabled={!nomeNovoKit.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Criar"
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowCriarNovo(false);
              setNomeNovoKit("");
            }}
          >
            Cancelar
          </Button>
        </div>
      )}
      <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
        <div className="relative">
          <MaterialIcon
            name="search"
            className="absolute left-2.5 top-2 text-slate-400 text-sm"
          />
          <Input
            value={filtroBusca}
            onChange={(e) => setFiltroBusca(e.target.value)}
            placeholder="Filtrar por nome ou modelos/operadoras..."
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto min-h-[200px]">
        <table className="w-full text-[11px]">
          <thead className="sticky top-0 bg-slate-100 z-10">
            <tr>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-left">
                Nome
              </th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-left">
                Data de Criação
              </th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-left">
                Quantidade
              </th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-left">
                Modelos / Operadoras
              </th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">
                Ação
              </th>
            </tr>
          </thead>
          <tbody>
            {loadingKits ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                </td>
              </tr>
            ) : kitsFiltrados.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  Nenhum kit encontrado.
                </td>
              </tr>
            ) : (
              kitsFiltrados.map((k) => (
                <tr key={k.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-bold text-slate-900">
                    {k.nome}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {formatarDataHora(k.criadoEm)}
                  </td>
                  <td className="px-4 py-3">{k.quantidade}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {k.modelosOperadoras}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-[10px] font-bold"
                      onClick={() => handleEscolherKit(k)}
                    >
                      Escolher{" "}
                      <MaterialIcon name="chevron_right" className="text-sm" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-500 uppercase">
            Exibindo{" "}
            <span className="font-bold text-slate-700">
              {kitsFiltrados.length} kits
            </span>
          </span>
          {kitsDisponiveis.length - kitsCompativeis.length > 0 && (
            <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1">
              <MaterialIcon name="info" className="text-sm" />
              {kitsDisponiveis.length - kitsCompativeis.length} kit
              {kitsDisponiveis.length - kitsCompativeis.length > 1
                ? "s"
                : ""}{" "}
              oculto
              {kitsDisponiveis.length - kitsCompativeis.length > 1
                ? "s"
                : ""}{" "}
              por incompatibilidade
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={handleClose}>
          Cancelar
        </Button>
      </div>
    </>
  );
}
