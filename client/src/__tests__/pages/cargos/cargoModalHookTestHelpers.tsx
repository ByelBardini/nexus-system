import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { vi } from "vitest";
import type { Cargo, Permission, Setor } from "@/types/cargo";

export const setores: Setor[] = [
  { id: 10, code: "ADM", nome: "Admin" },
  { id: 20, code: "CFG", nome: "Config" },
];

export const permissoes: Permission[] = [
  { id: 101, code: "ADMINISTRATIVO.CARGO.LISTAR" },
  { id: 102, code: "ADMINISTRATIVO.CARGO.CRIAR" },
];

export const cargoBase: Cargo = {
  id: 99,
  code: "OP",
  nome: "Operador",
  descricao: "d",
  categoria: "GESTAO",
  ativo: false,
  setor: setores[0],
  usuariosVinculados: 3,
  cargoPermissoes: [{ permissaoId: 101 }],
};

export function createCargoModalWrapper(qc: QueryClient) {
  return function W({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );
  };
}

export async function mockToastFns() {
  const { toast } = await import("sonner");
  return {
    error: vi.mocked(toast.error),
    success: vi.mocked(toast.success),
  };
}
