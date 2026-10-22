import React, { useState, useEffect } from 'react'
import {
  GitFork,
  Building2,
  Home,
  Car,
  Scale,
  Users,
  Search,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  companiesService,
  propertiesService,
  vehiclesService,
  processesService,
  obligationsService,
} from '@/services/api'
import type { Company, Property, Vehicle, ProcessItem, VehicleObligation } from '@/types'
import { useNavigate } from 'react-router-dom'
import { ViewModeToggle, getStoredViewMode, type ViewMode } from '@/components/ViewModeToggle'

export default function MapaPatrimonial() {
  const navigate = useNavigate()
  const [companies, setCompanies] = useState<Company[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [processes, setProcesses] = useState<ProcessItem[]>([])
  const [obligations, setObligations] = useState<VehicleObligation[]>([])
  const [loading, setLoading] = useState(true)

  // Filtro
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    getStoredViewMode('mapa_patrimonial', 'cards'),
  )

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [cList, pList, vList, prList, oList] = await Promise.all([
        companiesService.getAll(),
        propertiesService.getAll(),
        vehiclesService.getAll(),
        processesService.getAll(),
        obligationsService.getAll(),
      ])
      setCompanies(cList)
      setProperties(pList)
      setVehicles(vList)
      setProcesses(prList)
      setObligations(oList)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Agrupamento por Holding / Grupo Patrimonial
  const groups = [
    {
      name: 'GRUPO VL / AUTO&CO',
      key: 'vl',
      description: 'Holdings operacionais, concessionárias e bens veiculares',
    },
    {
      name: 'CAPANNONE & PARTICIPAÇÕES',
      key: 'capannone',
      description: 'Estruturas imobiliárias, aluguéis e patrimônio societário',
    },
    {
      name: 'PATRIMÔNIO FAMILIAR E PESSOAL',
      key: 'pessoal',
      description: 'Bens e pastas de titularidade pessoal da família fundadora',
    },
  ]

  // Totais
  const totalImoveisReceita = properties.filter((p) => p.generates_revenue).length
  const totalImoveisDivida = properties.filter((p) => p.has_debt).length
  const totalVeiculosDividaAtiva = obligations.filter((o) => o.is_active_debt).length
  const totalProcessosAtivos = processes.filter((pr) => pr.status === 'Ativo').length

  const filteredCompanies = companies.filter(
    (c) =>
      !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.cnpj?.toLowerCase().includes(search.toLowerCase()),
  )

  const filteredProperties = properties.filter(
    (p) =>
      !search ||
      p.description?.toLowerCase().includes(search.toLowerCase()) ||
      p.address?.toLowerCase().includes(search.toLowerCase()),
  )

  const filteredVehicles = vehicles.filter(
    (v) =>
      !search ||
      v.model?.toLowerCase().includes(search.toLowerCase()) ||
      v.plate?.toLowerCase().includes(search.toLowerCase()),
  )

  const filteredProcesses = processes.filter(
    (pr) =>
      !search ||
      pr.title?.toLowerCase().includes(search.toLowerCase()) ||
      pr.box_code?.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <GitFork className="w-6 h-6 text-indigo-600" />
            Mapa Patrimonial & Consolidação de Ativos
          </h1>
          <p className="text-sm text-slate-500">
            Visão consolidada 360° do ecossistema societário, imóveis, frotas veiculares e riscos
            jurídicos
          </p>
        </div>
      </div>

      {/* Cards de Indicadores Consolidados */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div
          onClick={() => navigate('/empresas')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-400 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Empresas
            </span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">{companies.length}</p>
          <span className="text-[11px] text-slate-400">Sociedades e holdings ativas</span>
        </div>

        <div
          onClick={() => navigate('/imoveis')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-400 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Imóveis
            </span>
            <Home className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">{properties.length}</p>
          <span className="text-[11px] text-emerald-700 font-medium">
            {totalImoveisReceita} gerando receita ({totalImoveisDivida} c/ pendência)
          </span>
        </div>

        <div
          onClick={() => navigate('/veiculos')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-400 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Veículos
            </span>
            <Car className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">{vehicles.length}</p>
          <span className="text-[11px] text-rose-600 font-medium">
            {totalVeiculosDividaAtiva > 0
              ? `${totalVeiculosDividaAtiva} c/ dívida ativa`
              : 'Sem dívida ativa'}
          </span>
        </div>

        <div
          onClick={() => navigate('/processos')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-400 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Processos
            </span>
            <Scale className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">{processes.length}</p>
          <span className="text-[11px] text-slate-500 font-medium">
            {totalProcessosAtivos} processos judiciais ativos
          </span>
        </div>
      </div>

      {/* Busca e Toggle de Modo */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Filtrar por nome de empresa, imóvel, placa de veículo ou processo..."
            className="pl-9 text-xs h-9 bg-slate-50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <ViewModeToggle mode={viewMode} onChange={setViewMode} storageKey="mapa_patrimonial" />
      </div>

      {/* Tabs com os Pilares Patrimoniais */}
      <Tabs defaultValue="todos" className="w-full">
        <TabsList className="bg-white border border-slate-200 p-1 rounded-xl shadow-xs">
          <TabsTrigger value="todos" className="text-xs font-semibold">
            Visão Geral Consolidada
          </TabsTrigger>
          <TabsTrigger value="empresas" className="text-xs font-semibold">
            Empresas ({filteredCompanies.length})
          </TabsTrigger>
          <TabsTrigger value="imoveis" className="text-xs font-semibold">
            Imóveis ({filteredProperties.length})
          </TabsTrigger>
          <TabsTrigger value="veiculos" className="text-xs font-semibold">
            Veículos ({filteredVehicles.length})
          </TabsTrigger>
          <TabsTrigger value="processos" className="text-xs font-semibold">
            Processos ({filteredProcesses.length})
          </TabsTrigger>
        </TabsList>

        {/* ===== Visão Geral Consolidada ===== */}
        <TabsContent value="todos" className="pt-2 space-y-6">
          {groups.map((grp) => (
            <Card key={grp.key} className="shadow-xs border-slate-200">
              <CardHeader className="p-4 pb-2 border-b border-slate-100 bg-slate-50/60">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">{grp.name}</CardTitle>
                    <p className="text-xs text-slate-500">{grp.description}</p>
                  </div>
                  <Badge variant="outline" className="text-xs bg-white text-slate-700">
                    Núcleo Estrutural
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" /> Empresas
                    </span>
                    <p className="text-slate-500 text-[11px]">
                      {companies
                        .filter((c) =>
                          grp.key === 'vl'
                            ? c.name.includes('AUTO') || c.name.includes('VL')
                            : grp.key === 'capannone'
                              ? c.name.includes('CAPANNONE') || c.name.includes('MARTINI')
                              : true,
                        )
                        .slice(0, 3)
                        .map((c) => c.name)
                        .join(', ') || 'Empresas do grupo'}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                      <Home className="w-3.5 h-3.5 text-emerald-600" /> Imóveis
                    </span>
                    <p className="text-slate-500 text-[11px]">
                      {properties.length} imóveis sob gestão e custódia física (CX N8)
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                      <Car className="w-3.5 h-3.5 text-indigo-600" /> Frota Veicular
                    </span>
                    <p className="text-slate-500 text-[11px]">
                      {vehicles.length} veículos cadastrados com rastreio de IPVA
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                      <Scale className="w-3.5 h-3.5 text-blue-600" /> Contencioso
                    </span>
                    <p className="text-slate-500 text-[11px]">
                      {processes.length} processos físicos arquivados (CX N2, N4, N5)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ===== Aba Empresas ===== */}
        <TabsContent value="empresas" className="pt-2">
          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCompanies.map((c) => (
                <Card key={c.id} className="shadow-xs hover:border-blue-300 transition-colors">
                  <CardHeader className="p-4 pb-2">
                    <Badge variant="outline" className="text-[10px] w-fit bg-blue-50 text-blue-700">
                      {c.group_name || 'EMPRESA'}
                    </Badge>
                    <CardTitle className="text-sm font-bold text-slate-900 mt-2">
                      {c.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-1 space-y-1.5 text-xs text-slate-600">
                    <p className="font-mono">CNPJ: {c.cnpj || 'Sob consulta'}</p>
                    {c.capital && (
                      <p>
                        Capital: <strong>R$ {c.capital.toLocaleString('pt-BR')}</strong>
                      </p>
                    )}
                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate('/empresas')}
                        className="h-7 px-2 text-blue-600 text-xs"
                      >
                        Ver Detalhes →
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                  <tr>
                    <th className="py-3 px-4">Razão Social</th>
                    <th className="py-3 px-4">CNPJ</th>
                    <th className="py-3 px-4">Grupo</th>
                    <th className="py-3 px-4">Capital Social</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCompanies.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-900">{c.name}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{c.cnpj || '—'}</td>
                      <td className="py-3 px-4 text-slate-600">{c.group_name || '—'}</td>
                      <td className="py-3 px-4 text-slate-700">
                        {c.capital ? `R$ ${c.capital.toLocaleString('pt-BR')}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ===== Aba Imóveis ===== */}
        <TabsContent value="imoveis" className="pt-2">
          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProperties.map((p) => (
                <Card key={p.id} className="shadow-xs hover:border-emerald-300 transition-colors">
                  <CardHeader className="p-4 pb-2">
                    <Badge
                      variant="outline"
                      className="text-[10px] w-fit bg-emerald-50 text-emerald-800"
                    >
                      {p.type}
                    </Badge>
                    <CardTitle className="text-sm font-bold text-slate-900 mt-2">
                      {p.description}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-1 space-y-1.5 text-xs text-slate-600">
                    <p className="truncate">{p.address || 'Endereço sob consulta'}</p>
                    <p>
                      Proprietário: <strong>{p.owner_name || 'Grupo VL'}</strong>
                    </p>
                    {p.generates_revenue && (
                      <Badge className="bg-emerald-600 text-white text-[10px]">
                        Receita: R$ {p.revenue_value?.toLocaleString('pt-BR')}/mês
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                  <tr>
                    <th className="py-3 px-4">Descrição</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Endereço</th>
                    <th className="py-3 px-4">Proprietário</th>
                    <th className="py-3 px-4">Receita / Pendência</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProperties.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-900">{p.description}</td>
                      <td className="py-3 px-4 text-slate-600">{p.type}</td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {p.address || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{p.owner_name || '—'}</td>
                      <td className="py-3 px-4">
                        {p.generates_revenue ? (
                          <Badge className="bg-emerald-600 text-white text-[10px]">
                            R$ {p.revenue_value?.toLocaleString('pt-BR')}/mês
                          </Badge>
                        ) : p.has_debt ? (
                          <Badge variant="destructive" className="text-[10px]">
                            Dívida / Pendência
                          </Badge>
                        ) : (
                          'Regular'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ===== Aba Veículos ===== */}
        <TabsContent value="veiculos" className="pt-2">
          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVehicles.map((v) => (
                <Card key={v.id} className="shadow-xs hover:border-indigo-300 transition-colors">
                  <CardHeader className="p-4 pb-2">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 w-fit">
                      {v.plate || 'SEM PLACA'}
                    </span>
                    <CardTitle className="text-sm font-bold text-slate-900 mt-2">
                      {v.model}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-1 space-y-1.5 text-xs text-slate-600">
                    <p>
                      Ano/Mod: <strong>{v.year_model || '—'}</strong>
                    </p>
                    <p>
                      Titular: <strong>{v.owner_name}</strong>
                    </p>
                    <p className="font-mono">
                      Pasta Física:{' '}
                      <strong className="text-blue-700">{v.folder_code || '—'}</strong>
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                  <tr>
                    <th className="py-3 px-4">Placa</th>
                    <th className="py-3 px-4">Modelo</th>
                    <th className="py-3 px-4">Ano/Mod</th>
                    <th className="py-3 px-4">Titular</th>
                    <th className="py-3 px-4">Pasta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredVehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                        {v.plate || 'SEM PLACA'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{v.model}</td>
                      <td className="py-3 px-4 text-slate-600">{v.year_model || '—'}</td>
                      <td className="py-3 px-4 text-slate-700">{v.owner_name}</td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">
                        {v.folder_code || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ===== Aba Processos ===== */}
        <TabsContent value="processos" className="pt-2">
          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProcesses.map((pr) => (
                <Card key={pr.id} className="shadow-xs hover:border-blue-300 transition-colors">
                  <CardHeader className="p-4 pb-2">
                    <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 w-fit">
                      {pr.box_code || 'Caixa'}
                    </span>
                    <CardTitle className="text-sm font-bold text-slate-900 mt-2">
                      {pr.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-1 space-y-1.5 text-xs text-slate-600">
                    <p>
                      Tipo: <strong>{pr.type}</strong>
                    </p>
                    <p>
                      Status: <strong>{pr.status}</strong>
                    </p>
                    {pr.lawyer && (
                      <p>
                        Advogado: <strong>{pr.lawyer}</strong>
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                  <tr>
                    <th className="py-3 px-4">Caixa</th>
                    <th className="py-3 px-4">Processo</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Advogado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProcesses.map((pr) => (
                    <tr key={pr.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-amber-800">
                        {pr.box_code || '—'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{pr.title}</td>
                      <td className="py-3 px-4 text-slate-600">{pr.type}</td>
                      <td className="py-3 px-4">{pr.status}</td>
                      <td className="py-3 px-4 text-slate-600">{pr.lawyer || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
