import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  formatDadosVeiculo,
  formatEnderecoSubcliente,
  getDadosRetirada,
  getDadosTeste,
  getSubclienteParaExibicao,
} from "@/pages/ordens-servico/shared/ordens-servico.display";
import type { OrdemServicoDetalhe } from "@/pages/ordens-servico/shared/ordens-servico.types";

function baseDetalhe(
  overrides: Partial<OrdemServicoDetalhe> = {},
): OrdemServicoDetalhe {
  return {
    id: 1,
    numero: 100,
    tipo: "INSTALACAO",
    status: "AGENDADO",
    observacoes: null,
    criadoEm: "2024-01-01T10:00:00.000Z",
    cliente: { id: 1, nome: "Cliente A" },
    ...overrides,
  };
}

describe("ordens-servico-page.display", () => {
  describe("getSubclienteParaExibicao", () => {
    it("prioriza snapshot quando nome não vazio", () => {
      const os = baseDetalhe({
        subclienteSnapshotNome: "Snap",
        subclienteSnapshotCidade: "São Paulo",
        subcliente: { nome: "Live", id: 2 },
      });
      const r = getSubclienteParaExibicao(os);
      expect(r?.nome).toBe("Snap");
      expect(r?.cidade).toBe("São Paulo");
    });

    it("edge: snapshot nome vazio string cai para subcliente", () => {
      const os = baseDetalhe({
        subclienteSnapshotNome: "",
        subcliente: { nome: "Live", id: 2 },
      });
      const r = getSubclienteParaExibicao(os);
      expect(r?.nome).toBe("Live");
    });

    it("edge: sem snapshot nem subcliente retorna null", () => {
      expect(getSubclienteParaExibicao(baseDetalhe())).toBeNull();
    });
  });

  describe("formatEnderecoSubcliente", () => {
    it("monta endereço completo", () => {
      const s = formatEnderecoSubcliente({
        nome: "X",
        logradouro: "Rua A",
        numero: "10",
        complemento: "Bloco B",
        bairro: "Centro",
        cidade: "Campinas",
        estado: "SP",
        cep: "13010000",
      });
      expect(s).toContain("Rua A");
      expect(s).toContain("Centro");
      expect(s).toContain("Campinas");
      expect(s).toContain("SP");
      expect(s).toContain("CEP");
    });

    it("edge: só nome quando sem partes de endereço", () => {
      expect(formatEnderecoSubcliente({ nome: "Só Nome" })).toBe("Só Nome");
    });

    it("edge: null retorna hífen", () => {
      expect(formatEnderecoSubcliente(null)).toBe("-");
    });
  });

  describe("formatDadosVeiculo", () => {
    it("edge: sem veículo", () => {
      expect(formatDadosVeiculo(undefined)).toBe("-");
    });

    it("inclui placa marca modelo ano cor", () => {
      expect(
        formatDadosVeiculo({
          id: 1,
          placa: "ABC1D23",
          marca: "Fiat",
          modelo: "Uno",
          ano: 2020,
          cor: "Branco",
        }),
      ).toContain("ABC1D23");
    });
  });

  describe("getDadosTeste", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-06-15T12:00:00.000Z"));
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("calcula tempo em minutos até saidaEmTestes", () => {
      const os = baseDetalhe({
        historico: [
          {
            statusAnterior: "AGENDADO",
            statusNovo: "EM_TESTES",
            criadoEm: "2024-06-15T10:00:00.000Z",
          },
          {
            statusAnterior: "EM_TESTES",
            statusNovo: "TESTES_REALIZADOS",
            criadoEm: "2024-06-15T10:30:00.000Z",
          },
        ],
      });
      const r = getDadosTeste(os);
      expect(r.entradaEmTestes).toBe("2024-06-15T10:00:00.000Z");
      expect(r.saidaEmTestes).toBe("2024-06-15T10:30:00.000Z");
      expect(r.tempoMin).toBe(30);
    });

    it("edge: sem saída usa relógio atual para tempo", () => {
      const os = baseDetalhe({
        historico: [
          {
            statusAnterior: "AGENDADO",
            statusNovo: "EM_TESTES",
            criadoEm: "2024-06-15T11:00:00.000Z",
          },
        ],
      });
      const r = getDadosTeste(os);
      expect(r.saidaEmTestes).toBeNull();
      expect(r.tempoMin).toBe(60);
    });

    it("edge: sem histórico EM_TESTES", () => {
      const r = getDadosTeste(baseDetalhe({ historico: [] }));
      expect(r.entradaEmTestes).toBeNull();
      expect(r.tempoMin).toBe(0);
    });
  });

  describe("getDadosRetirada", () => {
    it("extrai data e Sim da observação", () => {
      const os = baseDetalhe({
        historico: [
          {
            statusAnterior: "AGENDADO",
            statusNovo: "AGUARDANDO_CADASTRO",
            criadoEm: "2024-01-02T10:00:00.000Z",
            observacao: "Data retirada: 15/03/2024 | Aparelho encontrado: Sim",
          },
        ],
      });
      const r = getDadosRetirada(os);
      expect(r.dataRetirada).toBe("15/03/2024");
      expect(r.aparelhoEncontrado).toBe(true);
    });

    it("edge: Não com acento", () => {
      const os = baseDetalhe({
        historico: [
          {
            statusAnterior: "AGENDADO",
            statusNovo: "AGUARDANDO_CADASTRO",
            criadoEm: "2024-01-02T10:00:00.000Z",
            observacao: "Data retirada: 01/01/2024 | Aparelho encontrado: Não",
          },
        ],
      });
      expect(getDadosRetirada(os).aparelhoEncontrado).toBe(false);
    });

    it("edge: usa primeiro AGUARDANDO_CADASTRO no histórico", () => {
      const os = baseDetalhe({
        historico: [
          {
            statusAnterior: "AGENDADO",
            statusNovo: "AGUARDANDO_CADASTRO",
            criadoEm: "2024-01-01T10:00:00.000Z",
            observacao: "Data retirada: Primeira | Aparelho encontrado: Sim",
          },
          {
            statusAnterior: "X",
            statusNovo: "AGUARDANDO_CADASTRO",
            criadoEm: "2024-01-02T10:00:00.000Z",
            observacao: "Data retirada: Segunda | Aparelho encontrado: Não",
          },
        ],
      });
      const r = getDadosRetirada(os);
      expect(r.dataRetirada).toBe("Primeira");
      expect(r.aparelhoEncontrado).toBe(true);
    });

    it("edge: sem entrada retorna nulls", () => {
      expect(getDadosRetirada(baseDetalhe())).toEqual({
        dataRetirada: null,
        aparelhoEncontrado: null,
      });
    });
  });
});
