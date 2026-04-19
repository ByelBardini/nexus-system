import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebounce } from "@/hooks/useDebounce";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useDebounce", () => {
  it("retorna o valor inicial imediatamente", () => {
    const { result } = renderHook(() => useDebounce("inicial", 300));
    expect(result.current).toBe("inicial");
  });

  it("não atualiza antes do delay", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      {
        initialProps: { value: "inicial" },
      },
    );

    rerender({ value: "atualizado" });
    act(() => {
      vi.advanceTimersByTime(299);
    });

    expect(result.current).toBe("inicial");
  });

  it("atualiza após o delay", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      {
        initialProps: { value: "inicial" },
      },
    );

    rerender({ value: "atualizado" });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe("atualizado");
  });

  it("múltiplas mudanças rápidas → apenas a última é aplicada", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      {
        initialProps: { value: "a" },
      },
    );

    rerender({ value: "b" });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ value: "c" });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ value: "d" });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe("d");
  });

  it("delay customizado é respeitado", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 1000),
      {
        initialProps: { value: "inicial" },
      },
    );

    rerender({ value: "novo" });
    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(result.current).toBe("inicial");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe("novo");
  });

  it("funciona com tipos não-string", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      {
        initialProps: { value: 0 },
      },
    );

    rerender({ value: 42 });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe(42);
  });
});
