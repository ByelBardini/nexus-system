import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  api: vi.fn(),
}));

describe("import useCargoModal", () => {
  it("importa sem travar", async () => {
    const mod = await import("@/pages/cargos/useCargoModal");
    expect(mod.useCargoModal).toBeTypeOf("function");
  });
});
