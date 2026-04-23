/** Campos persistidos em `ContatoCliente` (sem `id` / `clienteId`). */
export type ContatoPrismaWrite = {
  nome: string;
  celular?: string;
  email?: string;
};

export function toPrismaContatoWriteData(input: {
  nome: string;
  celular?: string;
  email?: string;
}): ContatoPrismaWrite {
  return {
    nome: input.nome,
    celular: input.celular,
    email: input.email,
  };
}
