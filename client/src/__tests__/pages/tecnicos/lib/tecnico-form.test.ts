import { describe, expect, it } from "vitest";
import {
  buildTecnicoApiBody,
  emptyTecnicoFormValues,
  tecnicoFormSchema,
  tecnicoToFormValues,
} from "@/pages/tecnicos/lib/tecnico-form";
import type { Tecnico } from "@/pages/tecnicos/lib/tecnicos.types";

function makeTecnicoApi(overrides: Partial<Tecnico> = {}): Tecnico {
  return {
    id: 1,
    nome: "Fulano",
    cpfCnpj: null,
    telefone: null,
    cidade: "Campinas",
    estado: "SP",
    cep: null,
    logradouro: null,
    numero: null,
    complemento: null,
    bairro: null,
    cidadeEndereco: null,
    estadoEndereco: null,
    latitude: null,
    longitude: null,
    geocodingPrecision: null,
    ativo: true,
    precos: {
      instalacaoComBloqueio: 0,
      instalacaoSemBloqueio: 100,
      revisao: 5,
      retirada: 0,
      deslocamento: 2.5,
    },
    ...overrides,
  };
}

describe("tecnico-form", () => {
  describe("tecnicoToFormValues", () => {
    it("converte preços string e number para centavos inteiros", () => {
      const v = tecnicoToFormValues(
        makeTecnicoApi({
          precos: {
            instalacaoComBloqueio: "150.50",
            instalacaoSemBloqueio: 10,
            revisao: "3.25",
            retirada: 0,
            deslocamento: "1",
          },
        }),
      );
      expect(v.instalacaoComBloqueio).toBe(15050);
      expect(v.instalacaoSemBloqueio).toBe(1000);
      expect(v.revisao).toBe(325);
      expect(v.retirada).toBe(0);
      expect(v.deslocamento).toBe(100);
    });

    it("trata precos ausente como zeros", () => {
      const v = tecnicoToFormValues(makeTecnicoApi({ precos: undefined }));
      expect(v.instalacaoComBloqueio).toBe(0);
      expect(v.instalacaoSemBloqueio).toBe(0);
      expect(v.revisao).toBe(0);
      expect(v.retirada).toBe(0);
      expect(v.deslocamento).toBe(0);
    });

    it("normaliza nulls em strings vazias para campos opcionais", () => {
      const v = tecnicoToFormValues(
        makeTecnicoApi({
          cpfCnpj: null,
          telefone: null,
          cidade: null,
          estado: null,
          cep: null,
          logradouro: null,
          cidadeEndereco: null,
          estadoEndereco: null,
        }),
      );
      expect(v.cpfCnpj).toBe("");
      expect(v.telefone).toBe("");
      expect(v.cidade).toBe("");
      expect(v.estado).toBe("");
      expect(v.cep).toBe("");
      expect(v.logradouro).toBe("");
      expect(v.cidadeEndereco).toBe("");
      expect(v.estadoEndereco).toBe("");
    });

    it("preserva ativo false", () => {
      expect(tecnicoToFormValues(makeTecnicoApi({ ativo: false })).ativo).toBe(
        false,
      );
    });

    it("preserva nome mesmo com caracteres especiais", () => {
      const v = tecnicoToFormValues(
        makeTecnicoApi({ nome: "José da Silva & Cia." }),
      );
      expect(v.nome).toBe("José da Silva & Cia.");
    });
  });

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
