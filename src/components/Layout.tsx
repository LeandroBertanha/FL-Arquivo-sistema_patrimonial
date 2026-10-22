import React, { useState } from 'react'
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Search,
  FolderOpen,
  Archive,
  Box,
  Folders,
  Network,
  Building2,
  Users,
  Home,
  Car,
  Receipt,
  Scale,
  UserCheck,
  ArrowLeftRight,
  ClipboardCheck,
  ShieldAlert,
  GitFork,
  FileSpreadsheet,
  History,
  AlertTriangle,
  Settings,
  Menu,
  X,
  QrCode,
  Bell,
  LogOut,
  ChevronDown,
  User,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  badge?: string | number
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: 'Principal',
    items: [
      { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { title: 'Pesquisar', href: '/search', icon: Search },
    ],
  },
  {
    label: 'Acervo',
    items: [
      { title: 'Arquivo Atual', href: '/arquivo-atual', icon: FolderOpen },
      { title: 'Arquivo Morto', href: '/arquivo-morto', icon: Archive },
      { title: 'Caixas', href: '/caixas', icon: Box },
      { title: 'Pastas', href: '/pastas', icon: Folders },
      { title: 'Mapa do Arquivo', href: '/mapa-arquivo', icon: Network },
    ],
  },
  {
    label: 'Cadastros',
    items: [
      { title: 'Empresas', href: '/empresas', icon: Building2 },
      { title: 'Pessoas', href: '/pessoas', icon: Users },
      { title: 'Imóveis', href: '/imoveis', icon: Home },
      { title: 'Veículos', href: '/veiculos', icon: Car },
      { title: 'Processos', href: '/processos', icon: Scale },
      { title: 'Funcionários', href: '/funcionarios', icon: UserCheck },
    ],
  },
  {
    label: 'Operação',
    items: [
      { title: 'Movimentações', href: '/movimentacoes', icon: ArrowLeftRight },
      { title: 'Inventário', href: '/inventario', icon: ClipboardCheck },
      { title: 'Retenção e Descarte', href: '/retencao', icon: ShieldAlert },
    ],
  },
  {
    label: 'Inteligência',
    items: [
      { title: 'Mapa Patrimonial', href: '/mapa-patrimonial', icon: GitFork },
      { title: 'Relatórios', href: '/relatorios', icon: FileSpreadsheet },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { title: 'Auditoria', href: '/auditoria', icon: History },
      { title: 'Revisão da Migração', href: '/revisao-migracao', icon: AlertTriangle, badge: '11' },
      { title: 'Configurações', href: '/configuracoes', icon: Settings },
    ],
  },
]

export default function Layout({ children }: { children?: React.ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [manualCode, setManualCode] = useState('')

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleScanSimulate = (code: string) => {
    setQrModalOpen(false)
    navigate(`/search?q=${encodeURIComponent(code)}`)
  }

  const renderNavLinks = () => (
    <div className="space-y-6">
      {navGroups.map((group) => (
        <div key={group.label} className="space-y-1">
          <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {group.label}
          </p>
          {group.items.map((item) => {
            const isActive = location.pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                  <span>{item.title}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex w-full">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-[260px] bg-white border-r border-slate-200 shrink-0 h-screen sticky top-0">
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-100">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs">
            <Folders className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-base leading-tight tracking-tight">
              FL Arquivos
            </h1>
            <p className="text-[11px] text-slate-400 leading-none">Gestão Físico-Digital</p>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">{renderNavLinks()}</div>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>FL Arquivos v1.0 MVP</span>
          <span
            className="inline-block w-2 h-2 rounded-full bg-emerald-500"
            title="Sistema online"
          ></span>
        </div>
      </aside>

      {/* Drawer Mobile */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-[280px]">
          <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
              <Folders className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-900 text-base">FL Arquivos</span>
          </div>
          <div className="overflow-y-auto px-4 py-4 max-h-[calc(100vh-64px)]">
            {renderNavLinks()}
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden shrink-0"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>

            {/* Global Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Buscar por código (N1, N4/01), placa, renavan, empresa, titular, caixa..."
                className="pl-9 pr-12 bg-slate-50 border-slate-200 text-sm focus-visible:ring-blue-500 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="hidden sm:inline-block text-[10px] text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 absolute right-2.5 top-1/2 -translate-y-1/2 bg-white">
                ENTER
              </span>
            </form>
          </div>

          <div className="flex items-center gap-2">
            {/* Scanner Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQrModalOpen(true)}
              className="flex items-center gap-2 border-slate-200 hover:bg-slate-50 text-slate-700"
              title="Ler QR Code ou Código de Barras"
            >
              <QrCode className="w-4 h-4 text-blue-600" />
              <span className="hidden md:inline text-xs font-medium">Escanear</span>
            </Button>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-slate-600">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-2">
                <DropdownMenuLabel className="text-xs font-semibold text-slate-500">
                  Notificações
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="space-y-2 py-1 text-xs">
                  <div className="p-2 bg-amber-50 rounded-md text-amber-900 border border-amber-100">
                    <p className="font-semibold">Revisão de Migração Pendente</p>
                    <p className="text-slate-600 mt-0.5">
                      11 itens legados da planilha requerem validação humana.
                    </p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-md text-blue-900 border border-blue-100">
                    <p className="font-semibold">Carga da Planilha Realizada</p>
                    <p className="text-slate-600 mt-0.5">
                      Dataset de pastas, caixas e veículos carregado com sucesso.
                    </p>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs border border-blue-200">
                    {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.name || 'Administrador'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email || 'admin@flarquivos.com'}
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded w-fit">
                      {user?.role || 'Administrador'}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/configuracoes')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Meus Dados</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/configuracoes')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto min-w-0 overflow-x-auto">
          {children || <Outlet />}
        </main>

        {/* Footer */}
        <footer className="py-4 px-8 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
          FL Arquivos © 2026 — Sistema Integrado de Gestão Física, Digital e Patrimonial
        </footer>
      </div>

      {/* Modal Leitor QR Code / Código de Barras */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-blue-600" />
              Scanner de QR Code e Código de Barras
            </DialogTitle>
            <DialogDescription>
              Aponte a câmera para a etiqueta física ou digite o código da pasta/caixa/localização.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center text-center">
              <QrCode className="w-16 h-16 text-slate-400 mb-2 animate-pulse" />
              <p className="text-sm font-medium text-slate-700">Leitor Óptico Ativo</p>
              <p className="text-xs text-slate-400 mt-1">
                Compatível com etiquetas impressas pelo sistema
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">
                Ou informe o código manualmente:
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: N1, N4/01, CX N2, G01..."
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && manualCode) {
                      handleScanSimulate(manualCode)
                    }
                  }}
                />
                <Button
                  onClick={() => {
                    if (manualCode) handleScanSimulate(manualCode)
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Localizar
                </Button>
              </div>
            </div>

            <div className="text-xs text-slate-400 flex flex-wrap gap-1.5 pt-2">
              <span>Sugestões rápidas:</span>
              <button
                type="button"
                onClick={() => handleScanSimulate('N1')}
                className="underline hover:text-blue-600"
              >
                N1
              </button>
              •
              <button
                type="button"
                onClick={() => handleScanSimulate('N4/01')}
                className="underline hover:text-blue-600"
              >
                N4/01
              </button>
              •
              <button
                type="button"
                onClick={() => handleScanSimulate('CX N8')}
                className="underline hover:text-blue-600"
              >
                CX N8
              </button>
              •
              <button
                type="button"
                onClick={() => handleScanSimulate('FFL-4D33')}
                className="underline hover:text-blue-600"
              >
                FFL-4D33
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
