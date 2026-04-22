import { describe, expect, it, vi } from "vitest";
import { toastLoteFormValidationErrors } from "@/pages/aparelhos/cadastro-lote/lote-form-errors";

const toastError = vi.hoisted(() => vi.fn());

vi.mock("sonner", () => ({
  toast: { error: toastError },
}));

describe("toastLoteFormValidationErrors", () => {
  it("agrega mensagens e chama toast.error", () => {
    toastError.mockClear();
    toastLoteFormValidationErrors({
      referencia: { type: "required", message: "Referência obrigatória" },
      clienteId: { type: "custom", message: "Selecione o cliente" },
    });
    expect(toastError).toHaveBeenCalledWith(
      "Referência obrigatória, Selecione o cliente",
    );
  });

  it("usa mensagem padrão quando não há message string", () => {
    toastError.mockClear();
    toastLoteFormValidationErrors({ referencia: { type: "custom" } });
    expect(toastError).toHaveBeenCalledWith("Verifique os campos do formulário");
  });
});
