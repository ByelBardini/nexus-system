import { EquipamentosConfigModals } from "./components/EquipamentosConfigModals";
import { EquipamentosConfigPageHeader } from "./components/EquipamentosConfigPageHeader";
import { MarcasModelosPanel } from "./components/MarcasModelosPanel";
import { MarcasSimcardPanel } from "./components/MarcasSimcardPanel";
import { OperadorasTablePanel } from "./components/OperadorasTablePanel";
import {
  buildModelosByMarca,
  filterMarcasByMarcaOrModeloName,
  filterMarcasSimcardByNomeOuOperadora,
  filterOperadorasByName,
  toggleIdInSet,
} from "./domain/equipamentos-config.helpers";
import {
  useEquipamentosConfig,
  type EquipamentosConfigController,
} from "./hooks/useEquipamentosConfig";

/** Avaliação do barrel para cobertura (sem efeito em runtime). */
export const equipamentosConfigBarrelLoaded = true;

export * from "./domain/equipamentos-config.types";
export {
  buildModelosByMarca,
  EquipamentosConfigModals,
  EquipamentosConfigPageHeader,
  filterMarcasByMarcaOrModeloName,
  filterMarcasSimcardByNomeOuOperadora,
  filterOperadorasByName,
  MarcasModelosPanel,
  MarcasSimcardPanel,
  OperadorasTablePanel,
  toggleIdInSet,
  useEquipamentosConfig,
};
export type { EquipamentosConfigController };
