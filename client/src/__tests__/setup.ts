import "@testing-library/jest-dom";
import { afterEach, vi } from "vitest";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
  Toaster: () => null,
}));
