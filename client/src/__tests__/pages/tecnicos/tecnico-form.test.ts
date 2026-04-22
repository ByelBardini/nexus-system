import { describe, expect, it } from "vitest";
import {
  buildTecnicoApiBody,
  emptyTecnicoFormValues,
  tecnicoFormSchema,
} from "@/pages/tecnicos/tecnico-form";

describe("tecnico-form", () => {
  describe("emptyTecnicoFormValues", () => {
    it("retorna cópia independente a cada chamada", () => {
      const a = emptyTecnicoFormValues();
      const b = emptyTecnicoFormValues();
      expect(a).toEqual(b);
      a.nome = "X";
      expect(b.nome).toBe("");
    });
  });

  describe("buildTecnicoApiBody", () => {
    it("converte centavos para reais nos preços", () => {
      const body = buildTecnicoApiBody({
        ...emptyTecnicoFormValues(),
        nome: "T",
        instalacaoComBloqueio: 15050,
        instalacaoSemBloqueio: 10000,
        revisao: 500,
        retirada: 0,
        deslocamento: 250,
      });
      expect(body.precos).toEqual({
        instalacaoComBloqueio: 150.5,
        instalacaoSemBloqueio: 100,
        revisao: 5,
        retirada: 0,
        deslocamento: 2.5,
      });
    });

    it("omite strings v opcionais (usa undefined)", () => {
      const body = buildTecnicoApiBody({
        ...emptyTecnicoFormValues(),
        nome: "Só nome",
      });
      expect(body.cpfCnpj).toBeUndefined();
      expect(body.telefone).toBeUndefined();
      expect(body.cidade).toBeUndefined();
      expect(body.nome).toBe("Só nome");
    });

    it("preserva ativo false", () => {
      const body = buildTecnicoApiBody({
        ...emptyTecnicoFormValues(),
        nome: "Inativo",
        ativo: false,
      });
      expect(body.ativo).toBe(false);
    });
  });

  describe("tecnicoFormSchema", () => {
    it("rejeita nome vazio", () => {
      const r = tecnicoFormSchema.safeParse({
        ...emptyTecnicoFormValues(),
        nome: "",
      });
      expect(r.success).toBe(false);
    });

    it("default do formulário tem nome vazio (inválido até o usuário preencher)", () => {
      const r = tecnicoFormSchema.safeParse(emptyTecnicoFormValues());
      expect(r.success).toBe(false);
    });

    it("aceita quando nome está preenchido e demais campos nos defaults", () => {
      const r = tecnicoFormSchema.safeParse({
        ...emptyTecnicoFormValues(),
        nome: "Válido",
      });
      expect(r.success).toBe(true);
    });
  });
});
