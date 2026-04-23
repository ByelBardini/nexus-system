import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { describe, it, expect } from "vitest";
import { UsuarioDadosForm } from "@/pages/usuarios/components/UsuarioDadosForm";
import { schemaEdit, type FormEdit } from "@/pages/usuarios/lib/schemas";

function TestHarness() {
  const form = useForm<FormEdit>({
    resolver: zodResolver(schemaEdit),
    defaultValues: {
      nome: "",
      email: "",
      ativo: true,
      setor: null,
    },
  });
  return <UsuarioDadosForm form={form} />;
}

describe("UsuarioDadosForm", () => {
  it("seção, placeholders e preenchimento", async () => {
    const user = userEvent.setup();
    render(<TestHarness />);
    expect(
      screen.getByRole("heading", { name: /dados cadastrais/i }),
    ).toBeInTheDocument();
    const nome = screen.getByPlaceholderText(/ricardo cavalcanti/i);
    await user.type(nome, "Bruno");
    expect(nome).toHaveValue("Bruno");
  });
});
