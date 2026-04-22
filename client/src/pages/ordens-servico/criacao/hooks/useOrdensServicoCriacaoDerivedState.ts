import { useMemo } from "react";
import { useWatch, type Control } from "react-hook-form";
import type { CriacaoOsFormData } from "../ordens-servico-criacao.schema";
import {
  computeCriacaoOsDerivedFlags,
  criacaoOsWatchFieldList,
  mapCriacaoOsWatchFields,
} from "../ordens-servico-criacao.derived";

export function useOrdensServicoCriacaoDerivedState(
  control: Control<CriacaoOsFormData>,
  clienteInfinityId: number | null,
) {
  const watchedFields = useWatch({
    control,
    name: [...criacaoOsWatchFieldList],
  });
  const watched = useMemo(
    () => mapCriacaoOsWatchFields(watchedFields),
    [watchedFields],
  );
  return useMemo(
    () => computeCriacaoOsDerivedFlags(watched, clienteInfinityId),
    [watched, clienteInfinityId],
  );
}

export function useCriacaoOsWatchedForSidebar(control: Control<CriacaoOsFormData>) {
  const watchedFields = useWatch({
    control,
    name: [...criacaoOsWatchFieldList],
  });
  return useMemo(
    () => mapCriacaoOsWatchFields(watchedFields),
    [watchedFields],
  );
}
