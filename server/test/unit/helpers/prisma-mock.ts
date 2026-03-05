const createTableMock = () => ({
  findMany: jest.fn(),
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  findUniqueOrThrow: jest.fn(),
  create: jest.fn(),
  createMany: jest.fn(),
  update: jest.fn(),
  updateMany: jest.fn(),
  delete: jest.fn(),
  deleteMany: jest.fn(),
  count: jest.fn(),
  aggregate: jest.fn(),
  groupBy: jest.fn(),
});

export type PrismaMock = ReturnType<typeof createPrismaMock>;

export function createPrismaMock() {
  const mock = {
    usuario: createTableMock(),
    cargo: createTableMock(),
    setor: createTableMock(),
    permissao: createTableMock(),
    cargoPermissao: createTableMock(),
    usuarioCargo: createTableMock(),
    cliente: createTableMock(),
    contatoCliente: createTableMock(),
    tecnico: createTableMock(),
    precoTecnico: createTableMock(),
    veiculo: createTableMock(),
    marcaEquipamento: createTableMock(),
    modeloEquipamento: createTableMock(),
    operadora: createTableMock(),
    aparelho: createTableMock(),
    aparelhoHistorico: createTableMock(),
    loteAparelho: createTableMock(),
    kit: createTableMock(),
    ordemServico: createTableMock(),
    oSHistorico: createTableMock(),
    pedidoRastreador: createTableMock(),
    pedidoRastreadorHistorico: createTableMock(),
    $transaction: jest.fn(),
  };

  mock.$transaction.mockImplementation(
    (arg: unknown) => {
      if (typeof arg === 'function') return arg(mock);
      if (Array.isArray(arg)) return Promise.all(arg);
      return Promise.resolve();
    },
  );

  return mock;
}
