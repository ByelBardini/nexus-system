import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  api: vi.fn(),
}));

describe("smoke mock api", () => {
  it("runs", () => {
    expect(1).toBe(1);
  });
});
