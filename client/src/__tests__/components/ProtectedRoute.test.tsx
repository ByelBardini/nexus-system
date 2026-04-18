import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ProtectedRoute } from '@/components/ProtectedRoute'

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '@/contexts/AuthContext'

function renderWithRouter(
  authState: { isAuthenticated: boolean; isLoading: boolean },
  initialEntry = '/protegido',
) {
  vi.mocked(useAuth).mockReturnValue({
    ...authState,
    user: null,
    permissions: [],
    accessToken: null,
    login: vi.fn(),
    logout: vi.fn(),
    hasPermission: vi.fn().mockReturnValue(false),
  })

  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/protegido"
          element={
            <ProtectedRoute>
              <div>Conteúdo protegido</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Página de Login</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  it('renderiza children quando autenticado', () => {
    renderWithRouter({ isAuthenticated: true, isLoading: false })
    expect(screen.getByText('Conteúdo protegido')).toBeInTheDocument()
  })

  it('redireciona para /login quando não autenticado', () => {
    renderWithRouter({ isAuthenticated: false, isLoading: false })
    expect(screen.getByText('Página de Login')).toBeInTheDocument()
    expect(screen.queryByText('Conteúdo protegido')).not.toBeInTheDocument()
  })

  it('exibe "Carregando..." durante isLoading', () => {
    renderWithRouter({ isAuthenticated: false, isLoading: true })
    expect(screen.getByText('Carregando...')).toBeInTheDocument()
    expect(screen.queryByText('Conteúdo protegido')).not.toBeInTheDocument()
  })

  it('não redireciona enquanto está carregando, mesmo não autenticado', () => {
    renderWithRouter({ isAuthenticated: false, isLoading: true })
    expect(screen.queryByText('Página de Login')).not.toBeInTheDocument()
  })
})
