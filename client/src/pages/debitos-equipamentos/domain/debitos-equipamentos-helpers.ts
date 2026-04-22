import type { DebitoEquipamento, StatusDebito } from "./types";

export interface DebitosEquipamentosStats {
  totalAparelhosDevidos: number;
  saldoMes: number;
  devedoresCliente: number;
  devedoresInfinity: number;
  pctCliente: number;
  modelosAtivos: number;
  modeloPredominante: string;
}

export function computeDebitosEquipamentosStats(
  debitos: DebitoEquipamento[],
): DebitosEquipamentosStats {
  const ativos = debitos.filter((d) => d.status !== "quitado");

  const totalAparelhosDevidos = ativos.reduce(
    (acc, d) => acc + d.modelos.reduce((s, m) => s + m.quantidade, 0),
    0,
  );

  const saldoMes = ativos.reduce((acc, d) => {
    return (
      acc +
      d.historico.reduce(
        (s, h) => s + (h.tipo === "entrada" ? h.quantidade : -h.quantidade),
        0,
      )
    );
  }, 0);

  const devedoresCliente = new Set(
    ativos
      .filter((d) => d.devedor.tipo === "cliente")
      .map((d) => d.devedor.nome),
  ).size;
  const devedoresInfinity = new Set(
    ativos
      .filter((d) => d.devedor.tipo === "infinity")
      .map((d) => d.devedor.nome),
  ).size;
  const totalDevedores = devedoresCliente + devedoresInfinity;
  const pctCliente =
    totalDevedores > 0
      ? Math.round((devedoresCliente / totalDevedores) * 100)
      : 0;

  const modelosMap = new Map<string, number>();
  ativos.forEach((d) => {
    d.modelos.forEach((m) => {
      if (m.quantidade > 0)
        modelosMap.set(m.nome, (modelosMap.get(m.nome) ?? 0) + m.quantidade);
    });
  });
  const modelosPorQtd = [...modelosMap.entries()].sort((a, b) => b[1] - a[1]);
  const modeloPredominante = modelosPorQtd[0]?.[0] ?? "-";

  return {
    totalAparelhosDevidos,
    saldoMes,
    devedoresCliente,
    devedoresInfinity,
    pctCliente,
    modelosAtivos: modelosMap.size,
    modeloPredominante,
  };
}

export interface DebitosEquipamentosFilters {
  busca: string;
  filtroStatus: StatusDebito | "todos";
  filtroDevedor: string;
  filtroModelo: string;
}

export function buildOpcoesDevedorCredor(debitos: DebitoEquipamento[]) {
  const nomes = new Set(debitos.flatMap((d) => [d.devedor.nome, d.credor.nome]));
  return [
    { value: "", label: "Todos" },
    ...[...nomes].map((n) => ({ value: n, label: n })),
  ];
}

export function buildOpcoesModelo(debitos: DebitoEquipamento[]) {
  const nomes = new Set(debitos.flatMap((d) => d.modelos.map((m) => m.nome)));
  return [
    { value: "", label: "Todos" },
    ...[...nomes].map((n) => ({ value: n, label: n })),
  ];
}

export function filterDebitosEquipamentos(
  debitos: DebitoEquipamento[],
  f: DebitosEquipamentosFilters,
): DebitoEquipamento[] {
  return debitos.filter((d) => {
    const termo = f.busca.trim().toLowerCase();
    const matchBusca =
      !termo ||
      d.devedor.nome.toLowerCase().includes(termo) ||
      d.credor.nome.toLowerCase().includes(termo);
    const matchStatus =
      f.filtroStatus === "todos" || d.status === f.filtroStatus;
    const matchDevedor =
      !f.filtroDevedor ||
      d.devedor.nome === f.filtroDevedor ||
      d.credor.nome === f.filtroDevedor;
    const matchModelo =
      !f.filtroModelo || d.modelos.some((m) => m.nome === f.filtroModelo);
    return matchBusca && matchStatus && matchDevedor && matchModelo;
  });
}

export function hasFiltrosAtivos(f: DebitosEquipamentosFilters): boolean {
  return Boolean(
    f.busca ||
      f.filtroDevedor ||
      f.filtroModelo ||
      f.filtroStatus !== "todos",
  );
}
