export {
  useEquipamentosConfig,
  type EquipamentosConfigController,
} from "./hooks/useEquipamentosConfig";
export { EquipamentosConfigPageHeader } from "./components/EquipamentosConfigPageHeader";
export { MarcasModelosPanel } from "./components/MarcasModelosPanel";
export { OperadorasTablePanel } from "./components/OperadorasTablePanel";
export { MarcasSimcardPanel } from "./components/MarcasSimcardPanel";
export { EquipamentosConfigModals } from "./components/EquipamentosConfigModals";
export * from "./domain/equipamentos-config.types";
export {
  toggleIdInSet,
  buildModelosByMarca,
  filterMarcasByMarcaOrModeloName,
  filterOperadorasByName,
  filterMarcasSimcardByNomeOuOperadora,
} from "./domain/equipamentos-config.helpers";
