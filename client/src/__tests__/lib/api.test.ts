import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, apiDownloadBlob, apiGetText, getAuthHeaders, setOnUnauthorized } from '@/lib/api'

function mockFetch(status: number, body: unknown, contentType = 'application/json') {
  const text = typeof body === 'string' ? body : JSON.stringify(body)
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      text: () => Promise.resolve(text),
      json: () => Promise.resolve(typeof body === 'string' ? {} : body),
      blob: () => Promise.resolve(new Blob([text])),
      headers: new Headers({ 'content-type': contentType }),
    }),
  )
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('getAuthHeaders', () => {
  it('sem token → sem Authorization', () => {
    const headers = getAuthHeaders() as Record<string, string>
    expect(headers['Authorization']).toBeUndefined()
    expect(headers['Content-Type']).toBe('application/json')
  })

  it('com token → inclui Bearer', () => {
    localStorage.setItem('accessToken', 'meu-token')
    const headers = getAuthHeaders() as Record<string, string>
    expect(headers['Authorization']).toBe('Bearer meu-token')
  })
})

describe('api()', () => {
  it('retorna JSON em resposta 200', async () => {
    mockFetch(200, { id: 1, nome: 'Teste' })
    const result = await api<{ id: number; nome: string }>('/test')
    expect(result).toEqual({ id: 1, nome: 'Teste' })
  })

  it('retorna undefined em resposta 204', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        text: () => Promise.resolve(''),
      }),
    )
    const result = await api('/test')
    expect(result).toBeUndefined()
  })

  it('lança erro com message do body em 400', async () => {
    mockFetch(400, { message: 'Dados inválidos' })
    await expect(api('/test')).rejects.toThrow('Dados inválidos')
  })

  it('lança erro com statusText quando body não tem message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({}),
      }),
    )
    await expect(api('/test')).rejects.toThrow('Internal Server Error')
  })

  it('resposta 401 → chama onUnauthorized e lança sessão expirada', async () => {
    const onUnauthorized = vi.fn()
    setOnUnauthorized(onUnauthorized)
    mockFetch(401, { message: 'Unauthorized' })

    await expect(api('/test')).rejects.toThrow('Sessão expirada. Faça login novamente.')
    expect(onUnauthorized).toHaveBeenCalledOnce()
  })

  it('timeout (AbortError) → lança mensagem de tempo limite', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(Object.assign(new Error('abort'), { name: 'AbortError' })),
    )
    await expect(api('/test')).rejects.toThrow('Tempo limite excedido')
  })

  it('outros erros de rede → propaga o erro original', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    await expect(api('/test')).rejects.toThrow('Network error')
  })

  it('inclui token do localStorage no header', async () => {
    localStorage.setItem('accessToken', 'token-abc')
    let capturedHeaders: HeadersInit | undefined
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((_url: string, opts: RequestInit) => {
        capturedHeaders = opts.headers
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve('{}'),
        })
      }),
    )
    await api('/test')
    expect((capturedHeaders as Record<string, string>)['Authorization']).toBe('Bearer token-abc')
  })

  it('método POST é passado corretamente', async () => {
    let capturedMethod: string | undefined
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((_url: string, opts: RequestInit) => {
        capturedMethod = opts.method
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve('{}'),
        })
      }),
    )
    await api('/test', { method: 'POST', body: JSON.stringify({ foo: 'bar' }) })
    expect(capturedMethod).toBe('POST')
  })
})

describe('apiGetText()', () => {
  it('retorna texto em resposta 200', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve('<html>ok</html>'),
        json: () => Promise.resolve({}),
      }),
    )
    const result = await apiGetText('/report')
    expect(result).toBe('<html>ok</html>')
  })

  it('lança erro em resposta não-ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ message: 'Não encontrado' }),
      }),
    )
    await expect(apiGetText('/report')).rejects.toThrow('Não encontrado')
  })
})

describe('apiDownloadBlob()', () => {
  it('retorna Blob em resposta 200', async () => {
    const blob = new Blob(['pdf-content'])
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        blob: () => Promise.resolve(blob),
        json: () => Promise.resolve({}),
      }),
    )
    const result = await apiDownloadBlob('/file.pdf')
    expect(result).instanceOf(Blob)
  })

  it('lança erro em resposta não-ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Server Error',
        json: () => Promise.resolve({ message: 'Erro ao gerar arquivo' }),
      }),
    )
    await expect(apiDownloadBlob('/file.pdf')).rejects.toThrow('Erro ao gerar arquivo')
  })
})
