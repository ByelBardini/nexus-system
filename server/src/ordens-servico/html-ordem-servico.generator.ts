import { Injectable } from '@nestjs/common';
import { TipoOS } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const TIPO_LABELS: Record<string, string> = {
  INSTALACAO_COM_BLOQUEIO: 'Instalação com bloqueio',
  INSTALACAO_SEM_BLOQUEIO: 'Instalação sem bloqueio',
  REVISAO: 'Revisão',
  RETIRADA: 'Retirada',
  DESLOCAMENTO: 'Deslocamento',
};

type SubclienteParaExibicao = {
  nome: string;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  cpf?: string | null;
  email?: string | null;
  telefone?: string | null;
  cobrancaTipo?: string | null;
};

type OsParaHtml = {
  numero: number;
  tipo: string;
  status: string;
  observacoes?: string | null;
  criadoEm: Date;
  idAparelho?: string | null;
  localInstalacao?: string | null;
  posChave?: string | null;
  idEntrada?: string | null;
  localInstalacaoEntrada?: string | null;
  posChaveEntrada?: string | null;
  aparelhoEncontrado?: boolean | null;
  cliente: { nome: string; nomeFantasia?: string | null };
  subcliente?: SubclienteParaExibicao | null;
  subclienteSnapshotNome?: string | null;
  subclienteSnapshotLogradouro?: string | null;
  subclienteSnapshotNumero?: string | null;
  subclienteSnapshotComplemento?: string | null;
  subclienteSnapshotBairro?: string | null;
  subclienteSnapshotCidade?: string | null;
  subclienteSnapshotEstado?: string | null;
  subclienteSnapshotCep?: string | null;
  subclienteSnapshotCpf?: string | null;
  subclienteSnapshotEmail?: string | null;
  subclienteSnapshotTelefone?: string | null;
  subclienteSnapshotCobrancaTipo?: string | null;
  veiculo?: {
    placa: string;
    marca: string;
    modelo: string;
    ano?: number | null;
    cor?: string | null;
  } | null;
  tecnico?: {
    nome: string;
    cidade?: string | null;
    estado?: string | null;
    telefone?: string | null;
  } | null;
  criadoPor?: { nome: string } | null;
};

function esc(s: unknown): string {
  if (s == null || s === undefined) return '-';
  // eslint-disable-next-line @typescript-eslint/no-base-to-string
  const t = String(s);
  return t
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatarTelefone(val: string | null | undefined): string {
  if (!val) return '-';
  const d = val.replace(/\D/g, '');
  if (!d) return '-';
  if (d.length <= 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}${d.length > 6 ? '-' + d.slice(6, 10) : ''}`;
  }
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

function formatarCEP(val: string | null | undefined): string {
  if (!val) return '-';
  const d = val.replace(/\D/g, '');
  if (!d) return '-';
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5, 8)}`;
}

function formatarCPFCNPJ(val: string | null | undefined): string {
  if (!val) return '-';
  const d = val.replace(/\D/g, '');
  if (!d) return '-';
  if (d.length <= 11) {
    // CPF: 000.000.000-00
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
  }
  // CNPJ: 00.000.000/0001-00
  if (d.length <= 12)
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
}

@Injectable()
export class HtmlOrdemServicoGenerator {
  private getLogoBase64(): string {
    const base = process.cwd();
    const candidates = [
      path.join(base, 'assets', 'logo-infinity.png'),
      path.join(base, '..', 'assets', 'logo-infinity.png'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        return fs.readFileSync(p, { encoding: 'base64' });
      }
    }
    return '';
  }

  /** Usa snapshot do subcliente (preserva dados no momento da criação) quando disponível. */
  private static subclienteParaExibicao(
    os: OsParaHtml,
  ): SubclienteParaExibicao | null {
    const d = os;
    if (d.subclienteSnapshotNome != null && d.subclienteSnapshotNome !== '') {
      return {
        nome: d.subclienteSnapshotNome,
        logradouro: d.subclienteSnapshotLogradouro ?? undefined,
        numero: d.subclienteSnapshotNumero ?? undefined,
        complemento: d.subclienteSnapshotComplemento ?? undefined,
        bairro: d.subclienteSnapshotBairro ?? undefined,
        cidade: d.subclienteSnapshotCidade ?? undefined,
        estado: d.subclienteSnapshotEstado ?? undefined,
        cep: d.subclienteSnapshotCep ?? undefined,
        cpf: d.subclienteSnapshotCpf ?? undefined,
        email: d.subclienteSnapshotEmail ?? undefined,
        telefone: d.subclienteSnapshotTelefone ?? undefined,
        cobrancaTipo: d.subclienteSnapshotCobrancaTipo ?? undefined,
      };
    }
    return d.subcliente ?? null;
  }

  gerar(os: unknown): string {
    const d = os as OsParaHtml;
    const formatDate = (date: Date) =>
      new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    const logoB64 = this.getLogoBase64();
    const logoImg = logoB64
      ? `<img src="data:image/png;base64,${logoB64}" alt="Infinity System" class="h-10 object-contain" />`
      : '';

    const sub = HtmlOrdemServicoGenerator.subclienteParaExibicao(d);
    const partesEndereco: string[] = [];
    if (sub) {
      if (sub.logradouro) {
        let rua = sub.logradouro;
        if (sub.numero) rua += `, ${sub.numero}`;
        if (sub.complemento) rua += ` - ${sub.complemento}`;
        partesEndereco.push(rua);
      }
      if (sub.bairro) partesEndereco.push(sub.bairro);
      if (sub.cidade || sub.estado)
        partesEndereco.push(
          [sub.cidade, sub.estado].filter(Boolean).join(' - '),
        );
      if (sub.cep) partesEndereco.push(`CEP ${formatarCEP(sub.cep)}`);
    }
    const endereco =
      sub && partesEndereco.length > 0 ? partesEndereco.join(', ') : '-';
    const cidadeSub = sub
      ? [sub.cidade, sub.estado].filter(Boolean).join(' / ') || '-'
      : '-';
    const tecCidade = d.tecnico
      ? [d.tecnico.cidade, d.tecnico.estado].filter(Boolean).join(' / ') || '-'
      : '-';
    const v = d.veiculo;
    const marcaModelo = v ? `${v.marca} ${v.modelo}`.trim() : '-';
    const tipoLabel = TIPO_LABELS[d.tipo] || d.tipo;
    const isRetirada = d.tipo === TipoOS.RETIRADA;
    const isRevisao = d.tipo === TipoOS.REVISAO;
    const isInstalacao =
      d.tipo === TipoOS.INSTALACAO_COM_BLOQUEIO ||
      d.tipo === TipoOS.INSTALACAO_SEM_BLOQUEIO;
    const isRevisaoOuRetirada = isRetirada || isRevisao;
    const isFinalizado = d.status === 'FINALIZADO';
    const statusAntesTestes = ['AGENDADO', 'EM_TESTES'].includes(d.status);
    const statusDepoisTestes = [
      'TESTES_REALIZADOS',
      'AGUARDANDO_CADASTRO',
      'FINALIZADO',
      'CANCELADO',
    ].includes(d.status);
    const posChaveLabel =
      d.posChave === 'SIM' ? 'Sim' : d.posChave === 'NAO' ? 'Não' : '-';
    // Em REVISÃO, os valores "de entrada" (aparelho novo escolhido nos testes)
    // ficam em campos dedicados; para os demais tipos caímos nos campos base.
    const posChaveEntradaSrc = isRevisao
      ? (d.posChaveEntrada ?? d.posChave)
      : d.posChave;
    const posChaveEntradaLabel =
      posChaveEntradaSrc === 'SIM'
        ? 'Sim'
        : posChaveEntradaSrc === 'NAO'
          ? 'Não'
          : '-';
    const localInstalacaoEntradaSrc = isRevisao
      ? (d.localInstalacaoEntrada ?? d.localInstalacao)
      : d.localInstalacao;
    let aparelhoEncontradoLabel = '-';
    if (d.aparelhoEncontrado === true) aparelhoEncontradoLabel = 'Sim';
    else if (d.aparelhoEncontrado === false) aparelhoEncontradoLabel = 'Não';
    else {
      const match = (d.observacoes ?? '').match(
        /Aparelho encontrado:\s*(Sim|Não)/i,
      );
      if (match)
        aparelhoEncontradoLabel =
          match[1].toLowerCase() === 'sim' ? 'Sim' : 'Não';
    }
    const idEntradaVal = d.idEntrada ?? d.idAparelho;

    return `<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ordem de Serviço ${esc(d.numero)} - Infinity System</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    .section-icon { width: 1.25rem; height: 1.25rem; flex-shrink: 0; color: #1e40af; }
    body { font-family: 'Inter', sans-serif; color: #1a202c; background: #f3f4f6; -webkit-print-color-adjust: exact; }
    .label-title { font-size: 0.65rem; font-weight: 600; text-transform: uppercase; color: #1e40af; letter-spacing: 0.025em; }
    .field-value { font-size: 0.85rem; font-weight: 400; color: #374151; }
    @page { size: A4; margin: 8mm; }
    .a4-container { width: 210mm; padding: 8mm; margin: 0 auto; background: white; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
    @media print {
      body { background: none; padding: 0 !important; }
      .a4-container { box-shadow: none; margin: 0; width: 100%; padding: 0; }
    }
  </style>
</head>
<body class="py-0">
  <main class="a4-container flex flex-col">
    <header class="flex justify-between items-start mb-3">
      <div class="flex-1 flex items-center gap-4">
        ${logoImg ? `<div class="flex-shrink-0">${logoImg}</div>` : ''}
        <div>
          <h1 class="text-2xl font-bold text-blue-800 tracking-tight">Infinity System</h1>
          <p class="text-sm font-semibold text-gray-700">Assistência Veicular Ltda.</p>
          <div class="mt-2 text-xs text-gray-500 leading-relaxed">
            <p>Rua Vidal Ramos, 66, Centro – Orleans / SC</p>
            <p>CNPJ: 21.110.777/0001-89</p>
          </div>
        </div>
      </div>
      <div class="w-64 border-2 border-gray-100 rounded-lg p-3 bg-gray-50">
        <h2 class="text-xs font-bold text-blue-900 border-b border-gray-200 pb-1 mb-2 uppercase tracking-widest text-center">Ordem de Serviço</h2>
        <div class="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
          <span class="font-semibold text-gray-500 uppercase">OS Nº:</span>
          <span class="font-bold text-gray-900 text-right">${String(d.numero).padStart(9, '0')}</span>
          <span class="font-semibold text-gray-500 uppercase">Data:</span>
          <span class="text-gray-900 text-right">${formatDate(d.criadoEm || new Date())}</span>
          <span class="font-semibold text-gray-500 uppercase">Criado por:</span>
          <span class="text-gray-900 text-right">${esc(d.criadoPor?.nome)}</span>
          <span class="font-semibold text-gray-500 uppercase">Cliente:</span>
          <span class="text-gray-900 text-right font-medium">${esc(d.cliente?.nome || d.cliente?.nomeFantasia)}</span>
        </div>
      </div>
    </header>

    <section class="mb-3">
      <h3 class="label-title mb-1 border-l-4 border-blue-600 pl-2 flex items-center gap-2">
        <svg class="section-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
        Informações do Cliente / Beneficiário
      </h3>
      <div class="grid grid-cols-2 gap-x-8 gap-y-3 p-3 border border-gray-100 rounded">
        <div><label class="label-title block">Nome</label><span class="field-value">${esc(sub?.nome)}</span></div>
        <div><label class="label-title block">Telefone</label><span class="field-value">${esc(formatarTelefone(sub?.telefone))}</span></div>
        <div class="col-span-2"><label class="label-title block">Endereço</label><span class="field-value">${esc(endereco)}</span></div>
        <div><label class="label-title block">Cidade</label><span class="field-value">${esc(cidadeSub)}</span></div>
        <div><label class="label-title block">E-mail</label><span class="field-value">${esc(sub?.email)}</span></div>
        <div><label class="label-title block">CPF/CNPJ</label><span class="field-value">${esc(formatarCPFCNPJ(sub?.cpf))}</span></div>
        <div class="col-span-2"><label class="label-title block">Faturamento</label><span class="field-value">${esc(sub?.cobrancaTipo)}</span></div>
      </div>
    </section>

    <section class="mb-3">
      <h3 class="label-title mb-1 border-l-4 border-blue-600 pl-2 flex items-center gap-2">
        <svg class="section-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 10-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" /></svg>
        Técnico Responsável
      </h3>
      <div class="grid grid-cols-3 gap-x-4 p-3 border border-gray-100 rounded bg-gray-50/50">
        <div><label class="label-title block">Nome</label><span class="field-value">${esc(d.tecnico?.nome)}</span></div>
        <div><label class="label-title block">Cidade</label><span class="field-value">${esc(tecCidade)}</span></div>
        <div><label class="label-title block">Telefone</label><span class="field-value">${esc(formatarTelefone(d.tecnico?.telefone))}</span></div>
      </div>
    </section>

    <section class="mb-3">
      <h3 class="label-title mb-1 border-l-4 border-blue-600 pl-2 flex items-center gap-2">
        <svg class="section-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>
        Dados do Veículo
      </h3>
      <div class="grid grid-cols-2 gap-x-8 gap-y-3 p-3 border border-gray-100 rounded">
        <div><label class="label-title block text-gray-400">Placa</label><span class="field-value font-bold">${esc(v?.placa)}</span></div>
        <div><label class="label-title block text-gray-400">Marca/Modelo</label><span class="field-value">${esc(marcaModelo)}</span></div>
        <div><label class="label-title block text-gray-400">Ano</label><span class="field-value">${esc(v?.ano)}</span></div>
        <div><label class="label-title block text-gray-400">Cor</label><span class="field-value">${esc(v?.cor)}</span></div>
      </div>
    </section>

    <section class="mb-3">
      <h3 class="label-title mb-1 border-l-4 border-blue-600 pl-2 flex items-center gap-2">
        <svg class="section-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>
        Tipo de Serviço${isRevisaoOuRetirada || isInstalacao ? ' e Detalhes' : ''}
      </h3>
      <div class="p-3 border border-gray-100 rounded">
        ${
          statusAntesTestes
            ? `
          ${
            isRetirada
              ? `
        <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1 justify-center text-center">
          <span class="field-value font-semibold">${esc(tipoLabel)}</span>
          <span class="text-gray-400">|</span>
          <span><span class="label-title">ID a retirar:</span> <span class="field-value">${esc(d.idAparelho) || '-'}</span></span>
          <span class="text-gray-400">|</span>
          <span><span class="label-title">Local:</span> <span class="field-value">${esc(d.localInstalacao) || '-'}</span></span>
          <span class="text-gray-400">|</span>
          <span><span class="label-title">Pós-Chave:</span> <span class="field-value">${posChaveLabel}</span></span>
        </div>
          `
              : isRevisao
                ? `
        <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1 justify-center text-center">
          <span class="field-value font-semibold">${esc(tipoLabel)}</span>
          <span class="text-gray-400">|</span>
          <span><span class="label-title">ID a substituir:</span> <span class="field-value">${esc(d.idAparelho) || '-'}</span></span>
          <span class="text-gray-400">|</span>
          <span><span class="label-title">Local:</span> <span class="field-value">${esc(d.localInstalacao) || '-'}</span></span>
          <span class="text-gray-400">|</span>
          <span><span class="label-title">Pós-Chave:</span> <span class="field-value">${posChaveLabel}</span></span>
        </div>
          `
                : isInstalacao
                  ? `
        <div class="text-center">
          <span class="field-value font-semibold">${esc(tipoLabel)}</span>
        </div>
          `
                  : `
        <div class="text-center"><label class="label-title block">Tipo</label><span class="field-value font-semibold">${esc(tipoLabel)}</span></div>
          `
          }
        `
            : statusDepoisTestes
              ? `
          ${
            isRetirada
              ? `
        <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1 justify-center text-center">
          <span class="field-value font-semibold">${esc(tipoLabel)}</span>
          <span class="text-gray-400">|</span>
          <span><span class="label-title">ID a retirar:</span> <span class="field-value">${esc(d.idAparelho) || '-'}</span></span>
          <span class="text-gray-400">|</span>
          <span><span class="label-title">Local:</span> <span class="field-value">${esc(d.localInstalacao) || '-'}</span></span>
          <span class="text-gray-400">|</span>
          <span><span class="label-title">Pós-Chave:</span> <span class="field-value">${posChaveLabel}</span></span>
        </div>
        <div class="text-center mt-3">
          <span class="label-title">Aparelho encontrado?</span> <span class="field-value font-semibold">${aparelhoEncontradoLabel}</span>
        </div>
          `
              : isRevisao
                ? `
        <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1 justify-center text-center">
          <span class="field-value font-semibold">${esc(tipoLabel)}</span>
          <span class="text-gray-400">|</span>
          <span><span class="label-title">ID a substituir:</span> <span class="field-value">${esc(d.idAparelho) || '-'}</span></span>
          <span class="text-gray-400">|</span>
          <span><span class="label-title">Local:</span> <span class="field-value">${esc(d.localInstalacao) || '-'}</span></span>
          <span class="text-gray-400">|</span>
          <span><span class="label-title">Pós-Chave:</span> <span class="field-value">${posChaveLabel}</span></span>
        </div>
        <div class="border-t border-gray-200 mt-3 pt-3">
          <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1 justify-center text-center">
            <span><span class="label-title">ID de entrada:</span> <span class="field-value">${esc(idEntradaVal) || '-'}</span></span>
            <span class="text-gray-400">|</span>
            <span><span class="label-title">Local:</span> <span class="field-value">${esc(localInstalacaoEntradaSrc) || '-'}</span></span>
            <span class="text-gray-400">|</span>
            <span><span class="label-title">Pós-Chave:</span> <span class="field-value">${posChaveEntradaLabel}</span></span>
          </div>
        </div>
          `
                : isInstalacao
                  ? `
        <div class="text-center mb-3">
          <span class="field-value font-semibold">${esc(tipoLabel)}</span>
        </div>
        <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1 justify-center text-center">
          <span><span class="label-title">ID de entrada:</span> <span class="field-value">${esc(idEntradaVal) || '-'}</span></span>
          <span class="text-gray-400">|</span>
          <span><span class="label-title">Local:</span> <span class="field-value">${esc(d.localInstalacao) || '-'}</span></span>
          <span class="text-gray-400">|</span>
          <span><span class="label-title">Pós-Chave:</span> <span class="field-value">${posChaveLabel}</span></span>
        </div>
          `
                  : `
        <div class="text-center"><label class="label-title block">Tipo</label><span class="field-value font-semibold">${esc(tipoLabel)}</span></div>
          `
          }
        `
              : `
        <div class="text-center"><label class="label-title block">Tipo</label><span class="field-value font-semibold">${esc(tipoLabel)}</span></div>
        `
        }
      </div>
    </section>

    <section class="mb-3">
      <h3 class="label-title mb-1 border-l-4 border-blue-600 pl-2 flex items-center gap-2">
        <svg class="section-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
        Observações
      </h3>
      <div class="p-3 border border-gray-100 rounded bg-gray-50/30">
        <p class="field-value whitespace-pre-wrap">${esc(d.observacoes) || '-'}</p>
      </div>
    </section>

    ${
      isFinalizado
        ? `
    <section class="mt-auto">
      <h3 class="label-title mb-4 flex items-center gap-2">
        <svg class="section-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        Execução do Serviço
      </h3>
      <p class="field-value">Data da execução do serviço: ____ / ____ / ______</p>
    </section>
    `
        : ''
    }

    <footer class="mt-4 pt-2 border-t border-gray-100 text-[9px] text-gray-400 uppercase tracking-widest">
      Documento gerado automaticamente pelo sistema Infinity
    </footer>
  </main>
</body>
</html>`;
  }
}
