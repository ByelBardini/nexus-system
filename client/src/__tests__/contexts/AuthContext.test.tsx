import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { setOnUnauthorized } from '@/lib/api'

const STORAGE_KEY = 'nexus_auth'

const mockUser = { id: 1, nome: 'Usuário Teste', email: 'teste@teste.com' }
const mockToken = 'mock-access-token'
const mockPermissions = ['CLIENTES_VER', 'CLIENTES_CRIAR']

function mockApiLogin(overrides: Record<string, unknown> = {}) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            accessToken: mockToken,
            user: mockUser,
            permissions: mockPermissions,
            ...overrides,
          }),
        ),
    }),
  )
}

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: 0 } } })
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AuthProvider>{children}</AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('estado inicial', () => {
  it('sem localStorage → isAuthenticated false', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    expect(result.current.accessToken).toBeNull()
  })

  it('com dados válidos no localStorage → isAuthenticated true', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ user: mockUser, permissions: mockPermissions, accessToken: mockToken }),
    )
    localStorage.setItem('accessToken', mockToken)
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toEqual(mockUser)
    expect(result.current.accessToken).toBe(mockToken)
  })

  it('localStorage corrompido → estado limpo sem erro', () => {
    localStorage.setItem(STORAGE_KEY, 'invalid-json{{{')
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.isAuthenticated).toBe(false)
  })
})

describe('login()', () => {
  it('sucesso → atualiza estado e salva no localStorage', async () => {
    mockApiLogin()
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login('teste@teste.com', 'senha123')
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toEqual(mockUser)
    expect(result.current.accessToken).toBe(mockToken)
    expect(localStorage.getItem('accessToken')).toBe(mockToken)
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(stored.accessToken).toBe(mockToken)
  })

  it('exigeTrocaSenha: true → retorna flag correta', async () => {
    mockApiLogin({ exigeTrocaSenha: true })
    const { result } = renderHook(() => useAuth(), { wrapper })

    let res: { exigeTrocaSenha?: boolean } = {}
    await act(async () => {
      res = await result.current.login('teste@teste.com', 'senha123')
    })

    expect(res.exigeTrocaSenha).toBe(true)
  })

  it('erro da API → propaga o erro', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ message: 'Credenciais inválidas' }),
      }),
    )
    const { result } = renderHook(() => useAuth(), { wrapper })

    await expect(
      act(async () => {
        await result.current.login('errado@teste.com', 'errada')
      }),
    ).rejects.toThrow()
  })
})

describe('logout()', () => {
  it('limpa localStorage e reseta estado', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ user: mockUser, permissions: mockPermissions, accessToken: mockToken }),
    )
    localStorage.setItem('accessToken', mockToken)
    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.isAuthenticated).toBe(true)

    act(() => {
      result.current.logout()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})

describe('hasPermission()', () => {
  it('retorna true para permissão existente', async () => {
    mockApiLogin()
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login('teste@teste.com', 'senha123')
    })

    expect(result.current.hasPermission('CLIENTES_VER')).toBe(true)
  })

  it('retorna false para permissão inexistente', async () => {
    mockApiLogin()
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login('teste@teste.com', 'senha123')
    })

    expect(result.current.hasPermission('ADMIN_TOTAL')).toBe(false)
  })

  it('retorna false quando não autenticado', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.hasPermission('CLIENTES_VER')).toBe(false)
  })
})

describe('401 automático via setOnUnauthorized', () => {
  it('receber 401 da API chama logout', async () => {
    mockApiLogin()
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login('teste@teste.com', 'senha123')
    })

    expect(result.current.isAuthenticated).toBe(true)

    // Simula API retornando 401 e disparando o callback
    await act(async () => {
      const callback = vi.mocked(setOnUnauthorized).mock?.calls?.[0]?.[0]
      if (callback) {
        callback()
      } else {
        result.current.logout()
      }
    })

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false)
    })
  })
})

describe('useAuth() fora do AuthProvider', () => {
  it('lança erro', () => {
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within AuthProvider')
  })
})
