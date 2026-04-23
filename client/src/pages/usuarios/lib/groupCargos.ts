import type { CargoWithPermissions } from "@/types/usuarios";

export function groupCargosBySetorNome(
  cargos: CargoWithPermissions[],
): Record<string, CargoWithPermissions[]> {
  return cargos.reduce<Record<string, CargoWithPermissions[]>>((acc, c) => {
    const key = c.setor.nome;
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});
}
