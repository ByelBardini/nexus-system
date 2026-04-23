import type {
  OsTeste,
  RastreadorParaTeste,
} from "@/pages/testes/lib/testes-types";

export function osTesteFixture(overrides: Partial<OsTeste> = {}): OsTeste {
  return {
    id: 10,
    numero: 100,
    tipo: "INSTALACAO",
    status: "EM_TESTES",
    clienteId: 1,
    subclienteId: 2,
    veiculoId: 3,
    tecnicoId: 4,
    idAparelho: "IMEI-ORIG",
    idEntrada: null,
    cliente: { id: 1, nome: "Cliente Alfa" },
    subcliente: { id: 2, nome: "Base Sul" },
    veiculo: { id: 3, placa: "ABC1D23", marca: "Ford", modelo: "Ka" },
    tecnico: { id: 4, nome: "Técnico Um" },
    tempoEmTestesMin: 12,
    ...overrides,
  };
}

export function rastreadorTesteFixture(
  overrides: Partial<RastreadorParaTeste> = {},
): RastreadorParaTeste {
  return {
    id: 99,
    identificador: "IMEI-99",
    proprietario: "CLIENTE",
    marca: "MarcaX",
    modelo: "ModY",
    status: "EM_TESTES",
    operadora: null,
    criadoEm: "2024-01-01",
    cliente: { id: 1, nome: "Cliente Alfa" },
    tecnico: null,
    marcaSimcard: {
      id: 1,
      nome: "Chip",
      operadora: { id: 1, nome: "OpTel" },
    },
    planoSimcard: { id: 1, planoMb: 100 },
    simVinculado: { id: 1, identificador: "8955" },
    ...overrides,
  };
}
