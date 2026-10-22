import React from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import logoGrupoVl from '@/assets/logogrupovlsemfundo-099cc.png'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Folders,
  FolderOpen,
  Archive,
  Box,
  Network,
  Car,
  Receipt,
  Search,
  ArrowRight,
  ShieldCheck,
  QrCode,
  ArrowLeftRight,
  CheckCircle2,
  Lock,
  Building2,
  Sparkles,
} from 'lucide-react'

export default function Apresentacao() {
  const { user, isLoading } = useAuth()

  // Se o usuário já estiver autenticado, redireciona direto para o Dashboard
  if (!isLoading && user) {
    return <Navigate to="/dashboard" replace />
  }

  const modules = [
    {
      title: 'Arquivo Atual',
      description:
        'Documentos em uso contínuo por empresas, titulares e condomínios com indexação rápida.',
      icon: FolderOpen,
      badge: 'Ativo',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      title: 'Arquivo Morto',
      description:
        'Guarda definitiva e histórica com regras de retenção, conferência e histórico preservado.',
      icon: Archive,
      badge: 'Histórico',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      title: 'Caixas & Pastas Físicas',
      description:
        'Controle individual de cada pasta (N1, N4/01...) e caixas organizadoras numeradas.',
      icon: Box,
      badge: 'Rastreabilidade',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      title: 'Veículos & IPVA',
      description:
        'Acompanhamento de frotas, licenciamento, débitos anuais, Renavam e chassis vinculados.',
      icon: Car,
      badge: 'Patrimonial',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      title: 'Mapa do Arquivo',
      description:
        'Localização topológica das gavetas, prateleiras, armários e estantes com visualização em grade.',
      icon: Network,
      badge: 'Geolocalização',
      badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    {
      title: 'Movimentações & QR Code',
      description:
        'Empréstimos, devoluções, auditoria com registro de responsável e leitura rápida por código.',
      icon: ArrowLeftRight,
      badge: 'Auditoria',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
  ]

  const highlights = [
    'Localização exata de qualquer pasta ou caixa em segundos',
    'Rastreamento de empréstimos e devoluções com responsável',
    'Conexão entre patrimônio físico, fiscal e societário',
    'Etiquetagem com QR Code e busca unificada instantânea',
  ]

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col selection:bg-[#1E2749] selection:text-white">
      {/* Topbar Institucional */}
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center">
              <img
                src={logoGrupoVl}
                alt="Grupo VL"
                className="h-12 sm:h-14 w-auto max-w-[100px] object-contain"
              />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-black tracking-tight text-[#1E2749] block leading-tight">
                Gestão Patrimonial
              </span>
              <span className="text-[11px] text-slate-500 font-semibold tracking-wide uppercase">
                Grupo VL • Acervo Físico & Digital
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-slate-700 hover:text-slate-900 text-xs sm:text-sm"
            >
              <Link to="/signup">Criar conta</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="bg-primary hover:bg-primary/90 text-white shadow-sm text-xs sm:text-sm font-semibold px-4"
            >
              <Link to="/login" className="flex items-center gap-1.5">
                <span>Entrar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-10 sm:pt-16 pb-14 sm:pb-20">
          {/* Subtle gradient backdrop */}
          <div className="absolute inset-0 bg-radial-[at_top] from-blue-50/70 via-transparent to-transparent pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="max-w-3xl mx-auto text-center space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#1E2749]/10 border border-[#1E2749]/20 text-[#1E2749] text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-[#1E2749]" />
                <span>Gestão Integrada Física & Digital • Grupo VL</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#1E2749] tracking-tight leading-[1.15]">
                Central corporativa de gestão do arquivo físico e patrimonial
              </h1>

              <p className="text-base sm:text-xl text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
                Localize, identifique, rastreie e controle cada pasta física, caixa de arquivo,
                empresa, titular, imóvel e veículo em uma única plataforma estruturada.
              </p>

              {/* CTAs */}
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <Button
                  asChild
                  size="lg"
                  className="w-full sm:w-auto h-12 px-7 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 text-base font-semibold transition-all"
                >
                  <Link to="/login" className="flex items-center justify-center gap-2">
                    <span>Acessar Gestão Patrimonial</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto h-12 px-6 border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 text-base font-medium"
                >
                  <Link to="/signup">Criar nova conta</Link>
                </Button>
              </div>

              {/* Highlights pills */}
              <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 text-left max-w-xl mx-auto">
                {highlights.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-xs sm:text-sm text-slate-600"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Preview / System Summary Mockup */}
            <div className="mt-12 sm:mt-16 rounded-2xl border border-slate-200/90 bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
              <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-xs text-slate-400 font-mono ml-2 hidden sm:inline">
                    grupovl.patrimonial/visao-geral
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>Ambiente Corporativo Seguro</span>
                </div>
              </div>

              {/* Inner preview card */}
              <div className="p-4 sm:p-8 bg-slate-50/50">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 uppercase">
                        Acervo Total
                      </span>
                      <Folders className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">100%</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Mapeado e indexado</p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 uppercase">
                        Arquivo Atual
                      </span>
                      <FolderOpen className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">Ativo</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Pastas em giro diário</p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 uppercase">
                        Arquivo Morto
                      </span>
                      <Archive className="w-4 h-4 text-amber-600" />
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">Custódia</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Caixas numeradas</p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 uppercase">
                        Patrimônio
                      </span>
                      <Building2 className="w-4 h-4 text-purple-600" />
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">Vinculado</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Imóveis, autos e docs</p>
                  </div>
                </div>

                {/* Search Bar mockup */}
                <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
                  <Search className="w-5 h-5 text-slate-400 shrink-0" />
                  <div className="flex-1 text-xs sm:text-sm text-slate-400">
                    Busca global por código, pasta física, empresa, titular, caixa ou placa...
                  </div>
                  <Badge
                    variant="outline"
                    className="hidden sm:inline-flex text-[10px] text-slate-500"
                  >
                    Atalho /
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Modules Grid */}
        <section className="py-12 sm:py-16 bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Módulos do Sistema
              </h2>
              <p className="text-sm sm:text-base text-slate-500 mt-2">
                Arquitetura pensada para refletir a organização física real das prateleiras, pastas
                e caixas da empresa.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {modules.map((m, idx) => {
                const Icon = m.icon
                return (
                  <div
                    key={idx}
                    className="p-5 sm:p-6 rounded-xl border border-slate-200 bg-[#FBFBFC] hover:bg-white hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <Icon className="w-5 h-5" />
                        </div>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${m.badgeColor}`}
                        >
                          {m.badge}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base mb-1.5 group-hover:text-blue-600 transition-colors">
                        {m.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {m.description}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center text-xs text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                      <span>Saiba mais no sistema</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Benefits strip */}
        <section className="py-12 sm:py-16 bg-[#F8F9FB]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <QrCode className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">Etiquetagem & Scanner</h4>
                <p className="text-xs text-slate-600">
                  Geração e leitura de QR Code direto na etiqueta física para localizar o registro
                  no sistema com um clique.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <Receipt className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">Obrigações & Prazos</h4>
                <p className="text-xs text-slate-600">
                  Controle preventivo de taxas, IPVA, contratos sociais, certidões e prazos de
                  retenção documental.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <Lock className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">Segurança & Auditoria</h4>
                <p className="text-xs text-slate-600">
                  Perfis de acesso por permissão (Administrador, Gestor e Operador) com registro
                  completo de quem retirou cada pasta.
                </p>
              </div>
            </div>

            {/* Bottom Call to Action banner */}
            <div className="mt-10 sm:mt-14 p-6 sm:p-10 rounded-2xl bg-gradient-to-r from-[#141C38] via-[#1E2749] to-[#2B396B] text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center md:text-left">
                <h3 className="text-xl sm:text-2xl font-bold">
                  Pronto para acessar o acervo do Grupo VL?
                </h3>
                <p className="text-xs sm:text-sm text-blue-200/90 max-w-xl">
                  Inicie sessão para pesquisar pastas físicas, caixas, empresas, imóveis, veículos e
                  movimentações.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-[#1E2749] hover:bg-slate-100 font-semibold shadow-md text-sm sm:text-base px-6 h-11"
                >
                  <Link to="/login" className="flex items-center gap-2">
                    <span>Acessar Gestão Patrimonial</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer discreto */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 px-2 py-1 rounded-md border border-slate-200 flex items-center justify-center">
              <img
                src={logoGrupoVl}
                alt="Grupo VL"
                className="h-8 w-auto max-w-[65px] object-contain"
              />
            </div>
            <span className="font-semibold text-[#1E2749]">Gestão Patrimonial</span>
            <span>— Grupo VL © 2026</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:text-[#1E2749] font-medium transition-colors">
              Login
            </Link>
            <span>•</span>
            <Link to="/signup" className="hover:text-[#1E2749] font-medium transition-colors">
              Criar conta
            </Link>
            <span>•</span>
            <Link
              to="/forgot-password"
              className="hover:text-[#1E2749] font-medium transition-colors"
            >
              Recuperar senha
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
