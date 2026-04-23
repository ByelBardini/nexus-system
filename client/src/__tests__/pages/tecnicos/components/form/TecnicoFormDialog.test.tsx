import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { describe, it, expect, vi } from "vitest";
import { TecnicoFormDialog } from "@/pages/tecnicos/components/form/TecnicoFormDialog";
import {
  emptyTecnicoFormValues,
  tecnicoFormSchema,
  type TecnicoFormData,
} from "@/pages/tecnicos/lib/tecnico-form";

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => <span data-icon={name} />,
}));

vi.mock("@/components/InputCPFCNPJ", () => ({
  InputCPFCNPJ: (p: { value: string; onChange: (v: string) => void }) => (
    <input aria-label="cpf-cnpj" value={p.value} onChange={(e) => p.onChange(e.target.value)} />
  ),
}));

vi.mock("@/components/InputTelefone", () => ({
  InputTelefone: (p: { value: string; onChange: (v: string) => void }) => (
    <input aria-label="telefone" value={p.value} onChange={(e) => p.onChange(e.target.value)} />
  ),
}));

vi.mock("@/components/InputCEP", () => ({
  InputCEP: (p: { onAddressFound?: () => void }) => (
    <button type="button" data-testid="cep-btn" onClick={() => p.onAddressFound?.()}>
      cep
    </button>
  ),
}));

vi.mock("@/components/InputPreco", () => ({
  InputPreco: (p: { value: number; onChange: (v: number) => void }) => (
    <input
      type="number"
      aria-label="input-preco-field"
      value={p.value}
      onChange={(e) => p.onChange(Number(e.target.value))}
    />
  ),
}));

vi.mock("@/components/SelectUF", () => ({
  SelectUF: (p: { value: string; onChange: (v: string) => void }) => (
    <select aria-label="uf" value={p.value} onChange={(e) => p.onChange(e.target.value)}>
      <option value="">--</option>
      <option value="SP">SP</option>
    </select>
  ),
}));

vi.mock("@/components/SelectCidade", () => ({
  SelectCidade: (p: { value: string; onChange: (v: string) => void }) => (
    <select aria-label="cidade" value={p.value} onChange={(e) => p.onChange(e.target.value)}>
      <option value="">--</option>
    </select>
  ),
}));

function DialogHarness({
  editing,
  onSubmit,
}: {
  editing: boolean;
  onSubmit: (data: TecnicoFormData) => void;
}) {
  const form = useForm<TecnicoFormData>({
    resolver: zodResolver(tecnicoFormSchema) as Resolver<TecnicoFormData>,
    defaultValues: { ...emptyTecnicoFormValues(), nome: "X" },
  });
  return (
    <TecnicoFormDialog
      open
      editingTecnico={
        editing
          ? {
              id: 1,
              nome: "Ed",
              cpfCnpj: null,
              telefone: null,
              cidade: null,
              estado: null,
              cep: null,
              logradouro: null,
              numero: null,
              complemento: null,
              bairro: null,
              cidadeEndereco: null,
              estadoEndereco: null,
              latitude: null,
              longitude: null,
              geocodingPrecision: null,
              ativo: true,
            }
          : null
      }
      onClose={vi.fn()}
      form={form}
      ufs={[
        {
          id: 35,
          sigla: "SP",
          nome: "SP",
          regiao: { id: 3, sigla: "SE", nome: "Sudeste" },
        },
      ]}
      municipios={[]}
      estadoAtuacao=""
      onAddressFound={vi.fn()}
      watchedResumo={{
        nome: "X",
        cidade: undefined,
        estado: undefined,
        instalacaoSemBloqueio: 0,
        revisao: 0,
        deslocamento: 0,
      }}
      onSubmit={onSubmit}
      isSubmitting={false}
    />
  );
}

describe("TecnicoFormDialog", () => {
  it("mostra título Novo Técnico ou Editar conforme props", () => {
    const { rerender } = render(
      <DialogHarness editing={false} onSubmit={vi.fn()} />,
    );
    expect(
      screen.getAllByRole("heading", { name: /Novo Técnico/i }).length,
    ).toBeGreaterThanOrEqual(1);
    rerender(<DialogHarness editing onSubmit={vi.fn()} />);
    expect(
      screen.getAllByRole("heading", { name: /Editar Técnico/i }).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("submete formulário válido", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<DialogHarness editing={false} onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button", { name: /Salvar Técnico/i }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0]![0].nome).toBe("X");
  });
});
