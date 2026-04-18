const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const FETCH_TIMEOUT_MS = 15_000; // 15s - evita ficar travado quando API está inacessível

let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(callback: () => void) {
  onUnauthorized = callback;
}

export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, {
    ...options,
    signal: controller.signal,
  }).finally(() => clearTimeout(timer));
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${path}`;
  let res: Response;
  try {
    res = await fetchWithTimeout(
    url,
    {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
      credentials: 'include',
    },
    FETCH_TIMEOUT_MS
  );
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Tempo limite excedido. Verifique se o servidor está rodando.');
    }
    throw err;
  }
  if (res.status === 401) {
    onUnauthorized?.();
    throw new Error('Sessão expirada. Faça login novamente.');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message || res.statusText || 'Erro na requisição');
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text);
}

/**
 * Busca conteúdo como texto (ex: HTML)
 */
export async function apiGetText(path: string): Promise<string> {
  const url = `${API_BASE}${path}`;
  const res = await fetchWithTimeout(
    url,
    {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    },
    FETCH_TIMEOUT_MS
  );
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message || res.statusText || 'Erro na requisição');
  }
  return res.text();
}

/**
 * Baixa um arquivo (ex: PDF) e retorna o Blob para download
 * @param timeoutMs timeout opcional (padrão 15s); use valor maior para PDF
 */
export async function apiDownloadBlob(path: string, timeoutMs?: number): Promise<Blob> {
  const url = `${API_BASE}${path}`;
  const res = await fetchWithTimeout(
    url,
    {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    },
    timeoutMs ?? FETCH_TIMEOUT_MS
  );
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message || res.statusText || 'Erro na requisição');
  }
  return res.blob();
}
