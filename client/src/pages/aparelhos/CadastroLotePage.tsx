import { CadastroLoteFooter } from "@/pages/aparelhos/cadastro-lote/CadastroLoteFooter";
import { CadastroLoteHeader } from "@/pages/aparelhos/cadastro-lote/CadastroLoteHeader";
import { CadastroLoteResumoPanel } from "@/pages/aparelhos/cadastro-lote/CadastroLoteResumoPanel";
import { LoteAbaterDividaSection } from "@/pages/aparelhos/cadastro-lote/LoteAbaterDividaSection";
import { LoteIdentificacaoSection } from "@/pages/aparelhos/cadastro-lote/LoteIdentificacaoSection";
import { LoteIdentificadoresSection } from "@/pages/aparelhos/cadastro-lote/LoteIdentificadoresSection";
import { LotePropriedadeTipoSection } from "@/pages/aparelhos/cadastro-lote/LotePropriedadeTipoSection";
import { LoteValoresSection } from "@/pages/aparelhos/cadastro-lote/LoteValoresSection";
import { toastLoteFormValidationErrors } from "@/pages/aparelhos/cadastro-lote/lote-form-errors";
import { useCadastroLote } from "@/pages/aparelhos/cadastro-lote/useCadastroLote";

export function CadastroLotePage() {
  const lote = useCadastroLote();

  return (
    <div className="-m-4 min-h-[100dvh] bg-slate-100">
      <form
        onSubmit={lote.form.handleSubmit(
          lote.onSubmit,
          toastLoteFormValidationErrors,
        )}
        className="contents"
      >
        <CadastroLoteHeader />

        <div className="flex gap-6 p-6">
          <div className="flex-1 space-y-6">
            <LoteIdentificacaoSection form={lote.form} />
            <LotePropriedadeTipoSection
              form={lote.form}
              clientes={lote.clientes}
              marcasAtivas={lote.marcasAtivas}
              operadorasAtivas={lote.operadorasAtivas}
              modelosDisponiveis={lote.modelosDisponiveis}
              marcasSimcardFiltradas={lote.marcasSimcardFiltradas}
              watchTipo={lote.watchTipo}
              watchProprietario={lote.watchProprietario}
              watchMarca={lote.watchMarca}
              watchOperadora={lote.watchOperadora}
              watchClienteId={lote.watchClienteId}
              watchMarcaSimcard={lote.watchMarcaSimcard}
            />
            <LoteIdentificadoresSection
              form={lote.form}
              watchTipo={lote.watchTipo}
              watchDefinirIds={lote.watchDefinirIds}
              watchIdsTexto={lote.watchIdsTexto}
              idValidation={lote.idValidation}
              erroQuantidade={lote.erroQuantidade}
            />
            <LoteValoresSection form={lote.form} valorTotal={lote.valorTotal} />
            <LoteAbaterDividaSection
              form={lote.form}
              watchTipo={lote.watchTipo}
              watchAbaterDivida={lote.watchAbaterDivida}
              watchAbaterDebitoId={lote.watchAbaterDebitoId}
              debitosFiltrados={lote.debitosFiltrados}
              selectedDebito={lote.selectedDebito}
              quantidadeFinal={lote.quantidadeFinal}
            />
          </div>

          <CadastroLoteResumoPanel
            watchReferencia={lote.watchReferencia}
            watchNotaFiscal={lote.watchNotaFiscal}
            watchTipo={lote.watchTipo}
            watchProprietario={lote.watchProprietario}
            watchMarca={lote.watchMarca}
            watchModelo={lote.watchModelo}
            watchOperadora={lote.watchOperadora}
            watchValorUnitario={lote.watchValorUnitario}
            watchDefinirIds={lote.watchDefinirIds}
            clienteSelecionado={lote.clienteSelecionado}
            marcasAtivas={lote.marcasAtivas}
            modelosDisponiveis={lote.modelosDisponiveis}
            operadorasAtivas={lote.operadorasAtivas}
            quantidadeFinal={lote.quantidadeFinal}
            valorTotal={lote.valorTotal}
            idValidation={lote.idValidation}
          />
        </div>

        <CadastroLoteFooter
          canCreate={lote.canCreate}
          podeSalvar={lote.podeSalvar}
          isPending={lote.createLoteMutation.isPending}
        />
      </form>
    </div>
  );
}
