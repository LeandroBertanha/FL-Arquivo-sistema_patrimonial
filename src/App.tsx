/* Main App Component - Handles routing (using react-router-dom), query client and other providers */
import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import Layout from './components/Layout'

// Páginas do Sistema Gestão Patrimonial (Grupo VL)
import Dashboard from './pages/Dashboard'
import ArquivoAtual from './pages/ArquivoAtual'
import ArquivoMorto from './pages/ArquivoMorto'
import Caixas from './pages/Caixas'
import CaixaDetalhe from './pages/CaixaDetalhe'
import Pastas from './pages/Pastas'
import PastaDetalhe from './pages/PastaDetalhe'
import Empresas from './pages/Empresas'
import Pessoas from './pages/Pessoas'
import Imoveis from './pages/Imoveis'
import Veiculos from './pages/Veiculos'
import IpvaObrigacoes from './pages/IpvaObrigacoes'
import Processos from './pages/Processos'
import Funcionarios from './pages/Funcionarios'
import MapaArquivo from './pages/MapaArquivo'
import Movimentacoes from './pages/Movimentacoes'
import Inventario from './pages/Inventario'
import RetencaoDescarte from './pages/RetencaoDescarte'
import MapaPatrimonial from './pages/MapaPatrimonial'
import Relatorios from './pages/Relatorios'
import Auditoria from './pages/Auditoria'
import RevisaoMigracao from './pages/RevisaoMigracao'
import Configuracoes from './pages/Configuracoes'
import GlobalSearch from './pages/GlobalSearch'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import Apresentacao from './pages/Apresentacao'
import NotFound from './pages/NotFound'

// Componente para proteger rotas autenticadas
function ProtectedLayout() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F8F9FB]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E2749]" />
          <span className="text-xs text-slate-500 font-medium">
            Carregando Gestão Patrimonial...
          </span>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

// Componente para rotas públicas (se já autenticado, vai para o Dashboard)
function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

// Componente para a rota raiz "/":
// Se autenticado -> redireciona direto para "/dashboard"
// Se não autenticado -> renderiza a tela de Apresentação
function RootRoute() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F8F9FB]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E2749]" />
          <span className="text-xs text-slate-500 font-medium">
            Carregando Gestão Patrimonial...
          </span>
        </div>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return <Apresentacao />
}

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          {/* Rota Raiz: não autenticado -> Apresentação; autenticado -> Dashboard */}
          <Route path="/" element={<RootRoute />} />

          {/* Rota direta para Apresentação: se autenticado -> redireciona para Dashboard */}
          <Route
            path="/apresentacao"
            element={
              <PublicOnlyRoute>
                <Apresentacao />
              </PublicOnlyRoute>
            }
          />

          {/* Rotas Autenticadas protegidas com Layout */}
          <Route element={<ProtectedLayout />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/search" element={<GlobalSearch />} />
              <Route path="/arquivo-atual" element={<ArquivoAtual />} />
              <Route path="/arquivo-morto" element={<ArquivoMorto />} />
              <Route path="/caixas" element={<Caixas />} />
              <Route path="/caixas/:id" element={<CaixaDetalhe />} />
              <Route path="/pastas" element={<Pastas />} />
              <Route path="/pastas/:id" element={<PastaDetalhe />} />
              <Route path="/empresas" element={<Empresas />} />
              <Route path="/pessoas" element={<Pessoas />} />
              <Route path="/imoveis" element={<Imoveis />} />
              <Route path="/veiculos" element={<Veiculos />} />
              <Route path="/ipva-obrigacoes" element={<IpvaObrigacoes />} />
              <Route path="/processos" element={<Processos />} />
              <Route path="/funcionarios" element={<Funcionarios />} />
              <Route path="/mapa-arquivo" element={<MapaArquivo />} />
              <Route path="/movimentacoes" element={<Movimentacoes />} />
              <Route path="/inventario" element={<Inventario />} />
              <Route path="/retencao" element={<RetencaoDescarte />} />
              <Route path="/mapa-patrimonial" element={<MapaPatrimonial />} />
              <Route path="/relatorios" element={<Relatorios />} />
              <Route path="/auditoria" element={<Auditoria />} />
              <Route path="/revisao-migracao" element={<RevisaoMigracao />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
            </Route>
          </Route>

          {/* Rotas Públicas */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicOnlyRoute>
                <Signup />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicOnlyRoute>
                <ForgotPassword />
              </PublicOnlyRoute>
            }
          />

          {/* Rota 404 para rotas desconhecidas */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
