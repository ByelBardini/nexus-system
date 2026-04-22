import "@testing-library/jest-dom";
import { afterEach, vi } from "vitest";

/** Radix Select / Popover usam ResizeObserver (jsdom não define). */
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

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
