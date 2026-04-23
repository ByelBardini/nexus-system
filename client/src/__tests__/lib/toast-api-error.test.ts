import { beforeEach, describe, expect, it, vi } from "vitest";
import { toastApiError } from "@/lib/toast-api-error";

const toastError = vi.hoisted(() => vi.fn());

vi.mock("sonner", () => ({
  toast: { error: toastError },
}));

describe("toastApiError", () => {
  beforeEach(() => {
    toastError.mockReset();
  });

  it("usa a mensagem quando o valor é Error", () => {
    toastApiError(new Error("Falha no servidor"), "fallback");
    expect(toastError).toHaveBeenCalledWith("Falha no servidor");
  });

  it("usa fallback para string (não é instância de Error)", () => {
    toastApiError("erro de rede", "fallback");
    expect(toastError).toHaveBeenCalledWith("fallback");
  });

  it("usa fallback para null/undefined e objetos", () => {
    toastApiError(null, "fallback nulo");
    expect(toastError).toHaveBeenCalledWith("fallback nulo");
    toastError.mockReset();
    toastApiError({ code: 500 }, "fallback obj");
    expect(toastError).toHaveBeenCalledWith("fallback obj");
  });
});
