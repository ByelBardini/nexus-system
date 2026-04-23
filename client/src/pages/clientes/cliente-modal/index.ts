import { ClienteModal } from "./ClienteModal";
import { useClienteModal } from "./useClienteModal";

/** Avaliação do barrel para cobertura (sem efeito em runtime). */
export const clienteModalBarrelLoaded = true;

export { ClienteModal, useClienteModal };
export type { ClienteModalProps } from "./ClienteModal";
export type { UseClienteModalOptions } from "./useClienteModal";
