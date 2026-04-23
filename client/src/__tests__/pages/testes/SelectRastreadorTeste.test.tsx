import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { SelectRastreadorTeste } from "@/pages/testes/components/SelectRastreadorTeste";
import { rastreadorTesteFixture } from "./fixtures";

describe("SelectRastreadorTeste (integração UI + rastreador-format)", () => {
  it("abre lista, seleciona IMEI e chama onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const r = rastreadorTesteFixture({ identificador: "IMEI-SEL" });
    render(
      <SelectRastreadorTeste
        rastreadores={[r]}
        value=""
        onChange={onChange}
        osClienteId={1}
      />,
    );
    await user.click(screen.getByPlaceholderText(/buscar imei/i));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /IMEI-SEL/i })).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: /IMEI-SEL/i }));
    expect(onChange).toHaveBeenCalledWith("IMEI-SEL");
  });

  it("edge: filtra por termo presente só em um item (marca no texto de busca)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const a = rastreadorTesteFixture({
      id: 1,
      identificador: "ALPHA",
      marca: "MarcaUniqueXYZ",
      modelo: null,
    });
    const b = rastreadorTesteFixture({
      id: 2,
      identificador: "BETA",
      marca: "Outra",
    });
    render(
      <SelectRastreadorTeste
        rastreadores={[a, b]}
        value=""
        onChange={onChange}
      />,
    );
    await user.click(screen.getByPlaceholderText(/buscar imei/i));
    await user.keyboard("uniquexyz");
    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: /BETA/i }),
      ).not.toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /ALPHA/i })).toBeInTheDocument();
  });

  it("edge: Limpar zera valor", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SelectRastreadorTeste
        rastreadores={[rastreadorTesteFixture({ identificador: "X1" })]}
        value="X1"
        onChange={onChange}
      />,
    );
    await user.click(screen.getByPlaceholderText(/buscar imei/i));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /^limpar$/i })).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: /^limpar$/i }));
    expect(onChange).toHaveBeenCalledWith("");
  });
});
