import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { placaApenasAlfanumericos } from "@/lib/format";

export interface DadosVeiculoPlaca {
  marca: string;
  modelo: string;
  ano: string;
  cor: string;
  tipo?: string;
}

export function useConsultaPlaca(placaRaw: string | null | undefined) {
  const placa = placaRaw ? placaApenasAlfanumericos(placaRaw) : "";
  const enabled = placa.length === 7;

  return useQuery<DadosVeiculoPlaca | null>({
    queryKey: ["veiculos", "consulta-placa", placa],
    queryFn: () =>
      api<DadosVeiculoPlaca | null>(
        `/veiculos/consulta-placa/${encodeURIComponent(placa)}`,
      ),
    enabled,
  });
}
