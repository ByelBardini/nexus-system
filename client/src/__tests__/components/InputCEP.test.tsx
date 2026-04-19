import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { InputCEP } from "@/components/InputCEP";
import type { EnderecoCEP } from "@/hooks/useBrasilAPI";

// Wrapper com estado real para testar componente controlado
function StatefulInputCEP({
  onAddressFound,
}: {
  onAddressFound?: (e: EnderecoCEP) => void;
}) {
  const [value, setValue] = useState("");
  return (
    <InputCEP
      value={value}
      onChange={setValue}
      onAddressFound={onAddressFound}
    />
  );
}

vi.mock("@/hooks/useBrasilAPI", () => ({
  buscarCEP: vi.fn(),
}));

import { buscarCEP } from "@/hooks/useBrasilAPI";

const mockEndereco = {
  cep: "01310-100",
  logradouro: "Avenida Paulista",
  complemento: "",
  bairro: "Bela Vista",
  localidade: "São Paulo",
  uf: "SP",
};

describe("InputCEP", () => {
  it("renderiza sem crash", () => {
    render(<InputCEP value="" onChange={vi.fn()} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("exibe placeholder padrão", () => {
    render(<InputCEP value="" onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText("00000-000")).toBeInTheDocument();
  });

  it("exibe CEP formatado", () => {
    render(<InputCEP value="01310100" onChange={vi.fn()} />);
    expect(screen.getByDisplayValue("01310-100")).toBeInTheDocument();
  });

  it("valor vazio exibe campo vazio", () => {
    render(<InputCEP value="" onChange={vi.fn()} />);
    expect(screen.getByRole("textbox")).toHaveValue("");
  });

  it("chama onChange ao digitar", async () => {
    const onChange = vi.fn();
    render(<InputCEP value="" onChange={onChange} />);
    await userEvent.type(screen.getByRole("textbox"), "0");
    expect(onChange).toHaveBeenCalled();
  });

  it("busca endereço ao completar 8 dígitos e chama onAddressFound", async () => {
    vi.mocked(buscarCEP).mockResolvedValue(mockEndereco);
    const onAddressFound = vi.fn();

    render(<StatefulInputCEP onAddressFound={onAddressFound} />);

    await userEvent.type(screen.getByRole("textbox"), "01310100");

    await waitFor(() => {
      expect(buscarCEP).toHaveBeenCalled();
      expect(onAddressFound).toHaveBeenCalledWith(mockEndereco);
    });
  });

  it("não chama onAddressFound quando CEP não é encontrado", async () => {
    vi.mocked(buscarCEP).mockResolvedValue(null);
    const onAddressFound = vi.fn();

    render(<StatefulInputCEP onAddressFound={onAddressFound} />);
    await userEvent.type(screen.getByRole("textbox"), "99999999");

    await waitFor(() => {
      expect(buscarCEP).toHaveBeenCalled();
    });
    expect(onAddressFound).not.toHaveBeenCalled();
  });

  it("disabled desabilita o input", () => {
    render(<InputCEP value="" onChange={vi.fn()} disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });
});
