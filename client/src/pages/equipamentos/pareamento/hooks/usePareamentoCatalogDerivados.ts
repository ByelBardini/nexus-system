import { useMemo } from "react";
import {
  filterMarcasSimcardPorNomeOperadora,
  filterModelosPorNomeMarca,
} from "../domain/catalog-helpers";
import type { MarcaPareamentoCatalog } from "../domain/types";
import type { ModeloPareamentoCatalog } from "../domain/types";
import type { OperadoraPareamentoCatalog } from "../domain/types";
import type { MarcaSimcardPareamentoCatalog } from "../domain/types";

export function usePareamentoCatalogDerivados(input: {
  marcaRastreador: string;
  marcaRastreadorMassa: string;
  operadoraSim: string;
  operadoraSimMassa: string;
  marcasAtivas: MarcaPareamentoCatalog[];
  modelos: ModeloPareamentoCatalog[];
  operadorasAtivas: OperadoraPareamentoCatalog[];
  marcasSimcard: MarcaSimcardPareamentoCatalog[];
}) {
  const {
    marcaRastreador,
    marcaRastreadorMassa,
    operadoraSim,
    operadoraSimMassa,
    marcasAtivas,
    modelos,
    operadorasAtivas,
    marcasSimcard,
  } = input;

  const modelosPorMarca = useMemo(
    () =>
      filterModelosPorNomeMarca(marcaRastreador, marcasAtivas, modelos),
    [marcaRastreador, marcasAtivas, modelos],
  );

  const modelosPorMarcaMassa = useMemo(
    () =>
      filterModelosPorNomeMarca(marcaRastreadorMassa, marcasAtivas, modelos),
    [marcaRastreadorMassa, marcasAtivas, modelos],
  );

  const marcasSimcardPorOperadora = useMemo(
    () =>
      filterMarcasSimcardPorNomeOperadora(
        operadoraSim,
        operadorasAtivas,
        marcasSimcard,
      ),
    [operadoraSim, operadorasAtivas, marcasSimcard],
  );

  const marcasSimcardPorOperadoraMassa = useMemo(
    () =>
      filterMarcasSimcardPorNomeOperadora(
        operadoraSimMassa,
        operadorasAtivas,
        marcasSimcard,
      ),
    [operadoraSimMassa, operadorasAtivas, marcasSimcard],
  );

  return {
    modelosPorMarca,
    modelosPorMarcaMassa,
    marcasSimcardPorOperadora,
    marcasSimcardPorOperadoraMassa,
  };
}
