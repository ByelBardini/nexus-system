import { render, waitFor } from "@testing-library/react";
import { useForm, FormProvider } from "react-hook-form";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePreencherVeiculoPorPlaca } from "@/pages/ordens-servico/criacao/hooks/usePreencherVeiculoPorPlaca";
import {
  criacaoOsDefaultValues,
  type CriacaoOsFormData,
} from "@/pages/ordens-servico/criacao/ordens-servico-criacao.schema";
import { toast } from "sonner";

const api = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  api: (...a: unknown[]) => api(...a),
}));

function PlacaEffectProbe({
  placa,
  onForm,
}: {
  placa: string;
  onForm: (f: ReturnType<typeof useForm<CriacaoOsFormData>>) => void;
}) {
  const form = useForm<CriacaoOsFormData>({
    defaultValues: criacaoOsDefaultValues,
  });
  onForm(form);
  usePreencherVeiculoPorPlaca(form, placa);
  return null;
}

beforeEach(() => {
  vi.mocked(toast.success).mockClear();
  vi.mocked(toast.error).mockClear();
  api.mockReset();
});

describe("usePreencherVeiculoPorPlaca", () => {
  it("preenche campos ao receber consulta de placa com 7 caracteres alfanum", async () => {
    api.mockResolvedValue({
      marca: "F",
      modelo: "G",
      ano: "2020",
      cor: "B",
      tipo: "AUTO",
    });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    let f: ReturnType<typeof useForm<CriacaoOsFormData>> | null = null;
    render(
      <QueryClientProvider client={qc}>
        <PlacaEffectProbe
          placa="ABC-1D23"
          onForm={(form) => {
            f = form;
          }}
        />
      </QueryClientProvider>,
    );
    await waitFor(
      () => {
        expect(f?.getValues("veiculoMarca")).toBe("F");
        expect(f?.getValues("veiculoModelo")).toBe("G");
        expect(f?.getValues("veiculoAno")).toBe("2020");
        expect(f?.getValues("veiculoCor")).toBe("B");
        expect(f?.getValues("veiculoTipo")).toBe("AUTO");
      },
      { timeout: 4000 },
    );
    expect(toast.success).toHaveBeenCalledWith("Dados do veículo consultados");
  });

  it("toast de placa não encontrada quando sucesso e dados nulos", async () => {
    api.mockResolvedValue(null);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <PlacaEffectProbe
          placa="ABC1D23"
          onForm={() => {}}
        />
      </QueryClientProvider>,
    );
    await waitFor(
      () => {
        expect(toast.error).toHaveBeenCalledWith("Placa não encontrada");
      },
      { timeout: 4000 },
    );
  });
});
