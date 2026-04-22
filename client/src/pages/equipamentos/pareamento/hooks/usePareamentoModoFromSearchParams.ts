import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { ModoPareamento } from "../domain/types";

const MODOS: ModoPareamento[] = ["individual", "massa", "csv"];

function isModoPareamento(v: string | null): v is ModoPareamento {
  return v !== null && (MODOS as string[]).includes(v);
}

export function usePareamentoModoFromSearchParams() {
  const [searchParams] = useSearchParams();
  const modoParam = searchParams.get("modo");
  const [modo, setModo] = useState<ModoPareamento>(
    isModoPareamento(modoParam) ? modoParam : "individual",
  );

  useEffect(() => {
    if (isModoPareamento(modoParam)) {
      setModo(modoParam);
    }
  }, [modoParam]);

  return { modo, setModo, modoParam };
}
