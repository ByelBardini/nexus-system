import { createRef } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PareamentoCsvPanel } from "@/pages/equipamentos/pareamento/panels/PareamentoCsvPanel";
import type { CsvPreviewResult } from "@/pages/equipamentos/pareamento/preview/PreviewCsvTable";

let proprietarioSelectOnValueChange: ((v: string) => void) | undefined;

const previewCsvStore = vi.hoisted(() => ({ received: [] as unknown[] }));

vi.mock("@/components/ui/select", () => ({
  Select: ({
    children,
    onValueChange,
    value,
  }: {
    children: React.ReactNode;
    onValueChange?: (v: string) => void;
    value?: string;
  }) => {
    proprietarioSelectOnValueChange = onValueChange;
    return (
      <div data-testid="proprietario-select" data-value={value}>
        {children}
      </div>
    );
  },
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectItem: ({
    value,
    children,
  }: {
    value: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      data-testid={`select-item-${value}`}
      onClick={() => proprietarioSelectOnValueChange?.(value)}
    >
      {children}
    </button>
  ),
}));

vi.mock("@/pages/equipamentos/pareamento/preview/PreviewCsvTable", () => ({
  PreviewCsvTable: ({ preview }: { preview: unknown }) => {
    previewCsvStore.received.push(preview);
    return <div data-testid="preview-csv-table" />;
  },
}));

vi.mock("@/components/MaterialIcon", () => ({
  MaterialIcon: ({ name }: { name: string }) => <span data-icon={name} />,
}));

vi.mock("@/components/SelectClienteSearch", () => ({
  SelectClienteSearch: ({
    clientes,
    value,
    onChange,
  }: {
    clientes: { id: number; nome: string }[];
    value?: number;
    onChange: (id: number | undefined) => void;
  }) => (
    <div
      data-testid="select-cliente-csv"
      data-clientes-count={clientes.length}
      data-value={value ?? ""}
    >
      <button
        type="button"
        data-testid="csv-cliente-simula-selecao"
        onClick={() => onChange(99)}
      >
        simular cliente 99
      </button>
      <button
        type="button"
        data-testid="csv-cliente-limpar"
        onClick={() => onChange(undefined)}
      >
        limpar cliente
      </button>
    </div>
  ),
}));

function baseProps(overrides: Partial<Parameters<typeof PareamentoCsvPanel>[0]> = {}) {
  return {
    csvFileInputRef: createRef<HTMLInputElement>(),
    csvFileName: "",
    csvLinhas: [],
    csvParseErro: "",
    csvPreview: null,
    proprietarioCsv: "INFINITY" as const,
    setProprietarioCsv: vi.fn(),
    clienteIdCsv: null as number | null,
    setClienteIdCsv: vi.fn(),
    clientes: [],
    onBaixarTemplate: vi.fn(),
    onFileSelected: vi.fn(),
    onEscolherArquivoClick: vi.fn(),
    ...overrides,
  };
}

function minimalCsvPreview(): CsvPreviewResult {
  return {
    linhas: [],
    contadores: { validos: 0, comAviso: 0, erros: 0 },
  };
}

/** jsdom não implementa FileList/DataTransfer de forma completa em todos os ambientes */
function makeFileList(files: File[]): FileList {
  const list = {
    length: files.length,
    item: (i: number) => files[i] ?? null,
    [Symbol.iterator]: function* fileIterator() {
      for (const f of files) yield f;
    },
  } as unknown as Record<number, File> & FileList;
  for (let i = 0; i < files.length; i++) list[i] = files[i];
  return list as FileList;
}

describe("PareamentoCsvPanel", () => {
  beforeEach(() => {
    previewCsvStore.received.length = 0;
  });

  describe("proprietário (Select)", () => {
    it("INFINITY: atualiza tipo e zera cliente (fluxo típico após CLIENTE)", async () => {
      const setProprietarioCsv = vi.fn();
      const setClienteIdCsv = vi.fn();
      render(
        <PareamentoCsvPanel
          {...baseProps({
            proprietarioCsv: "CLIENTE",
            clienteIdCsv: 12,
            setProprietarioCsv,
            setClienteIdCsv,
          })}
        />,
      );
      await userEvent.click(screen.getByTestId("select-item-INFINITY"));
      expect(setProprietarioCsv.mock.calls).toEqual([["INFINITY"]]);
      expect(setClienteIdCsv.mock.calls).toEqual([[null]]);
    });

    it("CLIENTE: só altera tipo de proprietário — não mexe em clienteId", async () => {
      const setProprietarioCsv = vi.fn();
      const setClienteIdCsv = vi.fn();
      render(
        <PareamentoCsvPanel
          {...baseProps({
            proprietarioCsv: "INFINITY",
            setProprietarioCsv,
            setClienteIdCsv,
          })}
        />,
      );
      await userEvent.click(screen.getByTestId("select-item-CLIENTE"));
      expect(setProprietarioCsv).toHaveBeenCalledWith("CLIENTE");
      expect(setClienteIdCsv).not.toHaveBeenCalled();
    });

    it("SelectClienteSearch recebe clientes, value e repassa onChange para setClienteIdCsv", async () => {
      const setClienteIdCsv = vi.fn();
      const clientes = [
        { id: 1, nome: "A" },
        { id: 99, nome: "B" },
      ];
      render(
        <PareamentoCsvPanel
          {...baseProps({
            proprietarioCsv: "CLIENTE",
            clientes,
            clienteIdCsv: 1,
            setClienteIdCsv,
          })}
        />,
      );
      const search = screen.getByTestId("select-cliente-csv");
      expect(search).toHaveAttribute("data-clientes-count", "2");
      expect(search).toHaveAttribute("data-value", "1");

      await userEvent.click(screen.getByTestId("csv-cliente-simula-selecao"));
      expect(setClienteIdCsv).toHaveBeenLastCalledWith(99);

      await userEvent.click(screen.getByTestId("csv-cliente-limpar"));
      expect(setClienteIdCsv).toHaveBeenLastCalledWith(null);
    });

    it("não monta SelectClienteSearch quando proprietário é INFINITY", () => {
      render(<PareamentoCsvPanel {...baseProps({ proprietarioCsv: "INFINITY" })} />);
      expect(screen.queryByTestId("select-cliente-csv")).not.toBeInTheDocument();
    });
  });

  describe("arquivo CSV", () => {
    it("ref aponta para o input com accept correto", () => {
      const ref = createRef<HTMLInputElement>();
      render(<PareamentoCsvPanel {...baseProps({ csvFileInputRef: ref })} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current?.accept).toBe(".csv,text/csv");
    });

    it("dispara onFileSelected só quando há arquivo; ignora seleção vazia", () => {
      const onFileSelected = vi.fn();
      render(<PareamentoCsvPanel {...baseProps({ onFileSelected })} />);
      const input = screen.getByTestId("csv-file-input");

      fireEvent.change(input, { target: { files: makeFileList([]) } });
      expect(onFileSelected).not.toHaveBeenCalled();

      const file = new File(["x"], "dados.csv", { type: "text/csv" });
      fireEvent.change(input, { target: { files: makeFileList([file]) } });
      expect(onFileSelected).toHaveBeenCalledTimes(1);
      expect(onFileSelected).toHaveBeenCalledWith(file);
    });

    it("com vários arquivos, usa apenas o primeiro (comportamento input file)", () => {
      const onFileSelected = vi.fn();
      render(<PareamentoCsvPanel {...baseProps({ onFileSelected })} />);
      const input = screen.getByTestId("csv-file-input");
      const first = new File(["a"], "primeiro.csv", { type: "text/csv" });
      const second = new File(["b"], "segundo.csv", { type: "text/csv" });
      fireEvent.change(input, { target: { files: makeFileList([first, second]) } });
      expect(onFileSelected).toHaveBeenCalledWith(
        expect.objectContaining({ name: "primeiro.csv" }),
      );
    });

    it("mostra nome do arquivo ou placeholder; linhas carregadas; erro de parse", () => {
      const { rerender } = render(
        <PareamentoCsvPanel
          {...baseProps({
            csvFileName: "",
            csvLinhas: [],
            csvParseErro: "",
          })}
        />,
      );
      const dropzone = screen.getByText(/selecione o arquivo \.csv a importar/i).closest("div");
      expect(dropzone).toBeTruthy();
      expect(
        screen.queryByText(/linha\(s\) carregada\(s\)/i),
      ).not.toBeInTheDocument();

      rerender(
        <PareamentoCsvPanel
          {...baseProps({
            csvFileName: "lote.csv",
            csvLinhas: [{ imei: "1", iccid: "2" }],
            csvParseErro: "falha",
          })}
        />,
      );
      expect(screen.getByText("lote.csv")).toBeInTheDocument();
      expect(screen.getByText("1 linha(s) carregada(s)")).toBeInTheDocument();
      expect(screen.getByText("falha")).toBeInTheDocument();
    });

    it('"Escolher arquivo" e "Baixar modelo" chamam os handlers', async () => {
      const onEscolherArquivoClick = vi.fn();
      const onBaixarTemplate = vi.fn();
      render(
        <PareamentoCsvPanel
          {...baseProps({ onEscolherArquivoClick, onBaixarTemplate })}
        />,
      );
      await userEvent.click(
        screen.getByRole("button", { name: /escolher arquivo/i }),
      );
      await userEvent.click(screen.getByRole("button", { name: /baixar modelo/i }));
      expect(onEscolherArquivoClick).toHaveBeenCalledTimes(1);
      expect(onBaixarTemplate).toHaveBeenCalledTimes(1);
    });
  });

  describe("preview", () => {
    it("renderiza PreviewCsvTable e repassa o objeto preview", () => {
      const preview = minimalCsvPreview();
      render(<PareamentoCsvPanel {...baseProps({ csvPreview: preview })} />);
      expect(screen.getByTestId("preview-csv-table")).toBeInTheDocument();
      expect(previewCsvStore.received).toEqual([preview]);
    });

    it("sem csvPreview, não monta a tabela", () => {
      render(<PareamentoCsvPanel {...baseProps({ csvPreview: null })} />);
      expect(screen.queryByTestId("preview-csv-table")).not.toBeInTheDocument();
      expect(previewCsvStore.received).toEqual([]);
    });
  });
});
