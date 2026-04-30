import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type CategoriaFalhaAtiva = {
  id: number;
  nome: string;
  motivaTexto: boolean;
};

export function useCategoriasFalhaAtivas() {
  return useQuery<CategoriaFalhaAtiva[]>({
    queryKey: ["tabelas-config", "categorias-falha", "ativas"],
    queryFn: () => api("/tabelas-config/categorias-falha/ativas"),
  });
}
