import { describe, expect, it } from "vitest";
import {
  collectMarcasModelosLabelsFromAparelhos,
  collectOperadorasLabelsFromAparelhos,
} from "@/pages/pedidos/shared/aparelho-no-kit-aggregates";
import { buildAparelhoNoKit } from "../modal-selecao-ekit/modal-selecao-ekit.fixtures";

describe("aparelho-no-kit-aggregates", () => {
  describe("collectMarcasModelosLabelsFromAparelhos", () => {
    it("lista vazia", () => {
      expect(collectMarcasModelosLabelsFromAparelhos([])).toEqual([]);
    });

    it("deduplica, ordena e ignora marca/modelo totalmente vazios", () => {
      const list = [
        buildAparelhoNoKit({ id: 1, marca: "B", modelo: "M2" }),
        buildAparelhoNoKit({ id: 2, marca: "A", modelo: "M1" }),
        buildAparelhoNoKit({ id: 3, marca: "B", modelo: "M2" }),
        buildAparelhoNoKit({
          id: 4,
          marca: "",
          modelo: "",
        }),
      ];
      expect(collectMarcasModelosLabelsFromAparelhos(list)).toEqual([
        "A / M1",
        "B / M2",
      ]);
    });

    it("edge: só marca sem modelo vira label com uma parte", () => {
      const list = [
        buildAparelhoNoKit({ id: 1, marca: "SóMarca", modelo: "" }),
      ];
      expect(collectMarcasModelosLabelsFromAparelhos(list)).toEqual([
        "SóMarca",
      ]);
    });
  });

  describe("collectOperadorasLabelsFromAparelhos", () => {
    it("lista vazia", () => {
      expect(collectOperadorasLabelsFromAparelhos([])).toEqual([]);
    });

    it("usa operadora do SIM quando operadora nula", () => {
      const list = [
        buildAparelhoNoKit({
          id: 1,
          operadora: null,
          simVinculado: { identificador: "s", operadora: "Tim" },
        }),
      ];
      expect(collectOperadorasLabelsFromAparelhos(list)).toEqual(["Tim"]);
    });

    it("prioriza operadora direta quando ambas existem", () => {
      const list = [
        buildAparelhoNoKit({
          id: 1,
          operadora: "Vivo",
          simVinculado: { identificador: "s", operadora: "Claro" },
        }),
      ];
      expect(collectOperadorasLabelsFromAparelhos(list)).toEqual(["Vivo"]);
    });

    it("deduplica e ordena", () => {
      const list = [
        buildAparelhoNoKit({ id: 1, operadora: "B" }),
        buildAparelhoNoKit({ id: 2, operadora: "A" }),
        buildAparelhoNoKit({ id: 3, operadora: "B" }),
      ];
      expect(collectOperadorasLabelsFromAparelhos(list)).toEqual(["A", "B"]);
    });
  });
});
