import type { SetorUsuario } from "@/pages/usuarios/lib/constants";
import type {
  CargoWithPermissions,
  UsuarioListItem,
  PaginatedUsuariosResponse,
} from "@/pages/usuarios/lib/types";

export function usuarioListItemFixture(
  override: Partial<UsuarioListItem> = {},
): UsuarioListItem {
  return {
    id: 1,
    nome: "Ana Teste",
    email: "ana@teste.com",
    ativo: true,
    setor: "AGENDAMENTO" as SetorUsuario,
    createdAt: "2024-01-10T00:00:00.000Z",
    ultimoAcesso: "2026-04-22T10:00:00.000Z",
    usuarioCargos: [
      {
        cargo: {
          id: 5,
          nome: "Técnico",
          categoria: "OPERACIONAL",
          cargoPermissoes: [
            { permissaoId: 1 },
            { permissaoId: 2 },
            { permissaoId: 3 },
          ],
        },
      },
    ],
    ...override,
  };
}

export function paginatedUsuariosFixture(
  data: UsuarioListItem[],
  o: Partial<PaginatedUsuariosResponse> = {},
): PaginatedUsuariosResponse {
  return {
    data,
    total: data.length,
    page: 1,
    totalPages: 1,
    ...o,
  };
}

export function cargoComPermissoesFixture(
  id: number,
  nomeSetor: string,
  perms: string[],
): CargoWithPermissions {
  return {
    id,
    code: `R${id}`,
    nome: `Cargo ${id}`,
    categoria: "OPERACIONAL",
    setor: { id: 1, code: "S", nome: nomeSetor },
    cargoPermissoes: perms.map((code, i) => ({
      permissao: { id: 10 + i, code },
    })),
  };
}
