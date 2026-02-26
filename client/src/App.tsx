import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppLayout } from '@/layouts/AppLayout'
import { Login } from '@/pages/Login'
import { OrdensServicoPage } from '@/pages/OrdensServicoPage'
import { ConfiguracoesPage } from '@/pages/configuracoes/ConfiguracoesPage'
import { UsuariosPage } from '@/pages/usuarios/UsuariosPage'
import { CargosPage } from '@/pages/cargos/CargosPage'
import { ClientesPage } from '@/pages/clientes/ClientesPage'
import { TecnicosPage } from '@/pages/tecnicos/TecnicosPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<OrdensServicoPage />} />
        <Route path="configuracoes" element={<ConfiguracoesPage />} />
        <Route path="usuarios" element={<UsuariosPage />} />
        <Route path="cargos" element={<CargosPage />} />
        <Route path="clientes" element={<ClientesPage />} />
        <Route path="tecnicos" element={<TecnicosPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
