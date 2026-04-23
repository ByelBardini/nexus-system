import { describe, expect, it } from "vitest";
import {
  formatModeloAparelhoCadastro,
  mapCadastroRastreamentoOS,
} from "@/lib/cadastro-rastreamento-mapper";
import type { OSResponse } from "@/types/cadastro-rastreamento";
import { osRespostaBase } from "@/__tests__/pages/cadastro-rastreamento/cadastro-rastreamento.fixtures";

function os(over: Partial<OSResponse>): OSResponse {
  return { ...osRespostaBase, ...over };
}

describe("formatModeloAparelhoCadastro", () => {
  it("retorna null se aparelho nulo", () => {
    expect(formatModeloAparelhoCadastro(null)).toBeNull();
  });

  it("retorna null se marca e modelo vazios", () => {
    expect(
      formatModeloAparelhoCadastro({
        marca: null,
        modelo: null,
        iccid: null,
        sim: null,
      }),
    ).toBeNull();
  });

  it("inclui operadora e marca/plano do SIM quando completos", () => {
    const s = formatModeloAparelhoCadastro({
      marca: "X",
      modelo: "Y",
      iccid: "1",
      sim: { operadora: "Op", marcaNome: "Chip", planoMb: 10 },
    });
    expect(s).toBe("X Y (Op Chip/10 MB)");
  });

  it("sem partes de SIM fica só base", () => {
    expect(
      formatModeloAparelhoCadastro({
        marca: "A",
        modelo: "B",
        iccid: null,
        sim: { operadora: null, marcaNome: null, planoMb: null },
      }),
    ).toBe("A B");
  });
});

describe("mapCadastroRastreamentoOS", () => {
  it("mapeia OS de revisão e campos de veículo", () => {
    const o = mapCadastroRastreamentoOS(osRespostaBase);
    expect(o.tipoRegistro).toBe("REVISAO");
    expect(o.cliente).toBe("Cliente X");
    expect(o.placa).toBe("ABC1D23");
    expect(o.tecnico).toBe("Técnico Z");
  });

  it("INSTALACAO_COM_BLOQUEIO define instalacaoComBloqueio true e CADASTRO", () => {
    const o = mapCadastroRastreamentoOS(
      os({ tipo: "INSTALACAO_COM_BLOQUEIO", statusCadastro: "EM_CADASTRO" }),
    );
    expect(o.tipoRegistro).toBe("CADASTRO");
    expect(o.instalacaoComBloqueio).toBe(true);
  });

  it("tipo desconhecido vira OUTRO e instalacaoComBloqueio null", () => {
    const o = mapCadastroRastreamentoOS(os({ tipo: "DESCONHECIDO" }));
    expect(o.tipoRegistro).toBe("OUTRO");
    expect(o.instalacaoComBloqueio).toBeNull();
  });

  it("sem veículo preenche placeholders de veículo", () => {
    const o = mapCadastroRastreamentoOS(os({ veiculo: null }));
    expect(o.veiculo).toBe("—");
    expect(o.placa).toBe("—");
  });

  it("sem técnico usa em-dash", () => {
    const o = mapCadastroRastreamentoOS(os({ tecnico: null }));
    expect(o.tecnico).toBe("—");
  });

  it("concluidoEm null não formata conclusão", () => {
    const o = mapCadastroRastreamentoOS(os({ concluidoEm: null }));
    expect(o.concluidoEm).toBeNull();
  });
});
