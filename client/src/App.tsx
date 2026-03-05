import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppLayout } from '@/layouts/AppLayout'
import { Login } from '@/pages/Login'
import { Loader2 } from 'lucide-react'

const OrdensServicoPage = lazy(() => import('@/pages/OrdensServicoPage').then((m) => ({ default: m.OrdensServicoPage })))
const ConfiguracoesPage = lazy(() => import('@/pages/configuracoes/ConfiguracoesPage').then((m) => ({ default: m.ConfiguracoesPage })))
const UsuariosPage = lazy(() => import('@/pages/usuarios/UsuariosPage').then((m) => ({ default: m.UsuariosPage })))
const CargosPage = lazy(() => import('@/pages/cargos/CargosPage').then((m) => ({ default: m.CargosPage })))
const ClientesPage = lazy(() => import('@/pages/clientes/ClientesPage').then((m) => ({ default: m.ClientesPage })))
const TecnicosPage = lazy(() => import('@/pages/tecnicos/TecnicosPage').then((m) => ({ default: m.TecnicosPage })))
const AparelhosPage = lazy(() => import('@/pages/aparelhos/AparelhosPage').then((m) => ({ default: m.AparelhosPage })))
const CadastroLotePage = lazy(() => import('@/pages/aparelhos/CadastroLotePage').then((m) => ({ default: m.CadastroLotePage })))
const EquipamentosPage = lazy(() =>
  import('@/pages/equipamentos/EquipamentosPage').then((m) => ({
    default: m.EquipamentosPage,
  }))
)
const EquipamentosConfigPage = lazy(() =>
  import('@/pages/equipamentos/EquipamentosConfigPage').then((m) => ({
    default: m.EquipamentosConfigPage,
  }))
)
const PareamentoPage = lazy(() =>
  import('@/pages/equipamentos/PareamentoPage').then((m) => ({ default: m.PareamentoPage }))
)
const CadastroIndividualPage = lazy(() => import('@/pages/aparelhos/CadastroIndividualPage').then((m) => ({ default: m.CadastroIndividualPage })))
const PedidosRastreadoresPage = lazy(() =>
  import('@/pages/pedidos/PedidosRastreadoresPage').then((m) => ({ default: m.PedidosRastreadoresPage }))
)
const PedidosConfigPage = lazy(() =>
  import('@/pages/pedidos/PedidosConfigPage').then((m) => ({ default: m.PedidosConfigPage }))
)

function PageLoader() {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
}

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
        <Route
          index
          element={
            <Suspense fallback={<PageLoader />}>
              <OrdensServicoPage />
            </Suspense>
          }
        />
        <Route
          path="pedidos-rastreadores"
          element={
            <Suspense fallback={<PageLoader />}>
              <PedidosRastreadoresPage />
            </Suspense>
          }
        />
        <Route
          path="pedidos-config"
          element={
            <Suspense fallback={<PageLoader />}>
              <PedidosConfigPage />
            </Suspense>
          }
        />
        <Route
          path="configuracoes"
          element={
            <Suspense fallback={<PageLoader />}>
              <ConfiguracoesPage />
            </Suspense>
          }
        />
        <Route
          path="usuarios"
          element={
            <Suspense fallback={<PageLoader />}>
              <UsuariosPage />
            </Suspense>
          }
        />
        <Route
          path="cargos"
          element={
            <Suspense fallback={<PageLoader />}>
              <CargosPage />
            </Suspense>
          }
        />
        <Route
          path="clientes"
          element={
            <Suspense fallback={<PageLoader />}>
              <ClientesPage />
            </Suspense>
          }
        />
        <Route
          path="tecnicos"
          element={
            <Suspense fallback={<PageLoader />}>
              <TecnicosPage />
            </Suspense>
          }
        />
        <Route
          path="aparelhos"
          element={
            <Suspense fallback={<PageLoader />}>
              <AparelhosPage />
            </Suspense>
          }
        />
        <Route
          path="aparelhos/lote"
          element={
            <Suspense fallback={<PageLoader />}>
              <CadastroLotePage />
            </Suspense>
          }
        />
        <Route
          path="aparelhos/individual"
          element={
            <Suspense fallback={<PageLoader />}>
              <CadastroIndividualPage />
            </Suspense>
          }
        />
        <Route
          path="equipamentos"
          element={
            <Suspense fallback={<PageLoader />}>
              <EquipamentosPage />
            </Suspense>
          }
        />
        <Route
          path="equipamentos/config"
          element={
            <Suspense fallback={<PageLoader />}>
              <EquipamentosConfigPage />
            </Suspense>
          }
        />
        <Route
          path="equipamentos/pareamento"
          element={
            <Suspense fallback={<PageLoader />}>
              <PareamentoPage />
            </Suspense>
          }
        />
        <Route
          path="equipamentos/marcas"
          element={<Navigate to="/equipamentos/config" replace />}
        />
        <Route
          path="equipamentos/modelos"
          element={<Navigate to="/equipamentos/config" replace />}
        />
        <Route
          path="equipamentos/operadoras"
          element={<Navigate to="/equipamentos/config" replace />}
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
