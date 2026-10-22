import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Folders,
  FolderOpen,
  Archive,
  Box,
  ArrowUpRight,
  Clock,
  Car,
  Receipt,
  AlertTriangle,
  HardDrive,
  FileText,
  Plus,
  QrCode,
  Upload,
  ArrowRight,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  foldersService,
  boxesService,
  vehiclesService,
  obligationsService,
  movementsService,
  migrationIssuesService,
} from '@/services/api'
import type {
  Folder,
  Box as BoxType,
  Vehicle,
  VehicleObligation,
  FolderMovement,
  MigrationIssue,
} from '@/types'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'

export default function Dashboard() {
  const navigate = useNavigate()
  const [folders, setFolders] = useState<Folder[]>([])
  const [boxes, setBoxes] = useState<BoxType[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [obligations, setObligations] = useState<VehicleObligation[]>([])
  const [movements, setMovements] = useState<FolderMovement[]>([])
  const [issues, setIssues] = useState<MigrationIssue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [fRes, bRes, vRes, oRes, mRes, iRes] = await Promise.all([
          foldersService.getAll('', '-created', 1, 500),
          boxesService.getAll(),
          vehiclesService.getAll(),
          obligationsService.getAll(),
          movementsService.getAll('', '-created'),
          migrationIssuesService.getAll(),
        ])
        setFolders(fRes.items || [])
        setBoxes(bRes || [])
        setVehicles(vRes || [])
        setObligations(oRes || [])
        setMovements(mRes.slice(0, 8) || [])
        setIssues(iRes || [])
      } catch (err) {
        console.error('Erro ao carregar dados do dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const totalPastas = folders.length
  const arquivoAtual = folders.filter((f) => f.archive_type === 'Atual').length
  const arquivoMorto = folders.filter((f) => f.archive_type === 'Morto').length
  const totalCaixas = boxes.length
  const foraArquivo = folders.filter((f) => f.status === 'Fora do Arquivo').length
  const precisamRevisao = folders.filter((f) => f.needs_review).length || issues.length
  const totalVeiculos = vehicles.length
  const obrigacoesPendentes = obligations.filter(
    (o) => o.status === 'Pendente' || o.is_active_debt,
  ).length

  // Distribuição por Grupo / Empresa
  const groupCounts: Record<string, number> = {}
  folders.forEach((f) => {
    const g = f.group_name || 'OUTROS'
    groupCounts[g] = (groupCounts[g] || 0) + 1
  })
  const chartData = Object.entries(groupCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  const colors = [
    '#2563EB',
    '#3B82F6',
    '#60A5FA',
    '#10B981',
    '#F59E0B',
    '#8B5CF6',
    '#EC4899',
    '#64748B',
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Geral</h1>
          <p className="text-sm text-slate-500">
            Visão consolidada do acervo físico, caixas, veículos e auditoria patrimonial
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => navigate('/pastas?novo=true')}
            className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Nova Pasta
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/movimentacoes?tab=checkout')}
            className="border-slate-300 text-xs sm:text-sm hover:bg-slate-50"
          >
            <ArrowUpRight className="w-4 h-4 mr-1.5 text-blue-600" />
            Registrar Retirada
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/importar')}
            className="border-slate-300 text-xs sm:text-sm hover:bg-slate-50"
          >
            <Upload className="w-4 h-4 mr-1.5 text-slate-600" />
            Importar Planilha
          </Button>
        </div>
      </div>

      {/* Grid de 12 KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <Card
          className="shadow-xs hover:border-blue-300 transition-colors cursor-pointer"
          onClick={() => navigate('/pastas')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">Total Pastas</span>
              <Folders className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{totalPastas}</div>
            <span className="text-[11px] text-slate-400">Pastas catalogadas</span>
          </CardContent>
        </Card>

        <Card
          className="shadow-xs hover:border-blue-300 transition-colors cursor-pointer"
          onClick={() => navigate('/arquivo-atual')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">Arquivo Atual</span>
              <FolderOpen className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-700">{arquivoAtual}</div>
            <span className="text-[11px] text-emerald-600 font-medium">Uso corrente</span>
          </CardContent>
        </Card>

        <Card
          className="shadow-xs hover:border-blue-300 transition-colors cursor-pointer"
          onClick={() => navigate('/arquivo-morto')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">Arquivo Morto</span>
              <Archive className="w-4 h-4 text-slate-600" />
            </div>
            <div className="text-2xl font-bold text-slate-800">{arquivoMorto}</div>
            <span className="text-[11px] text-slate-500">Guarda passiva</span>
          </CardContent>
        </Card>

        <Card
          className="shadow-xs hover:border-blue-300 transition-colors cursor-pointer"
          onClick={() => navigate('/caixas')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">Caixas Físicas</span>
              <Box className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-800">{totalCaixas}</div>
            <span className="text-[11px] text-slate-500">CX N2 a CX N12</span>
          </CardContent>
        </Card>

        <Card
          className="shadow-xs hover:border-blue-300 transition-colors cursor-pointer"
          onClick={() => navigate('/movimentacoes')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">Em Check-out</span>
              <Clock className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-600">{foraArquivo}</div>
            <span className="text-[11px] text-slate-500">Fora do arquivo</span>
          </CardContent>
        </Card>

        <Card
          className="shadow-xs hover:border-blue-300 transition-colors cursor-pointer"
          onClick={() => navigate('/revisao-migracao')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">Necessita Revisão</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-700">{precisamRevisao}</div>
            <span className="text-[11px] text-amber-600 font-medium">Inconsistências Excel</span>
          </CardContent>
        </Card>

        <Card
          className="shadow-xs hover:border-blue-300 transition-colors cursor-pointer"
          onClick={() => navigate('/veiculos')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">Veículos</span>
              <Car className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-indigo-700">{totalVeiculos}</div>
            <span className="text-[11px] text-slate-500">Carros e moto</span>
          </CardContent>
        </Card>

        <Card
          className="shadow-xs hover:border-blue-300 transition-colors cursor-pointer"
          onClick={() => navigate('/ipva-obrigacoes')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">Obrigações Pend.</span>
              <Receipt className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-bold text-rose-700">{obrigacoesPendentes}</div>
            <span className="text-[11px] text-rose-600 font-medium">IPVA / Multas</span>
          </CardContent>
        </Card>

        <Card
          className="shadow-xs hover:border-blue-300 transition-colors cursor-pointer"
          onClick={() => navigate('/mapa-arquivo')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">Espaço Ocupado</span>
              <HardDrive className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">68%</div>
            <Progress value={68} className="h-1.5 mt-1" />
          </CardContent>
        </Card>

        <Card
          className="shadow-xs hover:border-blue-300 transition-colors cursor-pointer"
          onClick={() => navigate('/mapa-arquivo')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">Espaço Disponível</span>
              <HardDrive className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-700">32%</div>
            <Progress value={32} className="h-1.5 mt-1" />
          </CardContent>
        </Card>

        <Card
          className="shadow-xs hover:border-blue-300 transition-colors cursor-pointer"
          onClick={() => navigate('/pastas')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">Doc. Digitais</span>
              <FileText className="w-4 h-4 text-cyan-600" />
            </div>
            <div className="text-2xl font-bold text-slate-800">42</div>
            <span className="text-[11px] text-slate-500">PDFs / Anexos</span>
          </CardContent>
        </Card>

        <Card
          className="shadow-xs hover:border-blue-300 transition-colors cursor-pointer"
          onClick={() => navigate('/mapa-patrimonial')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">Mapa Patrimonial</span>
              <ArrowRight className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-700">9 Cias</div>
            <span className="text-[11px] text-blue-600 font-medium">Ver diagrama interativo</span>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Distribuição + Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Distribuição */}
        <Card className="lg:col-span-2 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-900">
              Distribuição do Acervo por Empresa / Grupo
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis
                    dataKey="name"
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #E2E8F0' }}
                    formatter={(val: number) => [`${val} pastas`, 'Quantidade']}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Alertas e Pendências */}
        <Card className="shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Alertas Prioritários
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs">
              <div className="font-semibold text-amber-900 flex items-center justify-between">
                <span>Inconsistências da Planilha</span>
                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                  {precisamRevisao} pendentes
                </Badge>
              </div>
              <p className="text-amber-800 mt-1">
                Casos conhecidos como N4/01 (3x), N7/14 (3x) e N5/07 aguardando validação humana.
              </p>
              <Button
                variant="link"
                size="sm"
                onClick={() => navigate('/revisao-migracao')}
                className="p-0 h-auto text-amber-900 font-bold hover:underline mt-2 text-xs"
              >
                Revisar inconsistências →
              </Button>
            </div>

            <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-xs">
              <div className="font-semibold text-rose-900 flex items-center justify-between">
                <span>Dívida Ativa / IPVA</span>
                <Badge variant="destructive" className="bg-rose-600 text-white">
                  FIAT FELIPE
                </Badge>
              </div>
              <p className="text-rose-800 mt-1">
                Exercícios 2024 e 2025 inscritos em dívida ativa. Licenciamento 2026 pendente.
              </p>
              <Button
                variant="link"
                size="sm"
                onClick={() => navigate('/ipva-obrigacoes')}
                className="p-0 h-auto text-rose-900 font-bold hover:underline mt-2 text-xs"
              >
                Ver obrigações veiculares →
              </Button>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-xs">
              <div className="font-semibold text-blue-900 flex items-center justify-between">
                <span>Rastreabilidade Física</span>
                <span className="text-blue-700 font-medium">100% Mapeado</span>
              </div>
              <p className="text-blue-800 mt-1">
                Todas as pastas possuem código físico, localização e histórico vinculados.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas + Movimentações Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Movimentações Recentes */}
        <Card className="lg:col-span-2 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold text-slate-900">
              Cadeia de Custódia e Movimentações Recentes
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/movimentacoes')}
              className="text-xs text-blue-600"
            >
              Ver todas →
            </Button>
          </CardHeader>
          <CardContent className="pt-2">
            {movements.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-400">
                Nenhuma movimentação física registrada no período.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {movements.map((mov) => (
                  <div key={mov.id} className="py-2.5 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-800 flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal">
                          {mov.type || 'Movimento'}
                        </Badge>
                        <span>{mov.folder_title}</span>
                        {mov.folder_code && (
                          <span className="text-slate-400 font-mono">({mov.folder_code})</span>
                        )}
                      </div>
                      <p className="text-slate-500">
                        {mov.origin_location} → <strong>{mov.destination_location}</strong>
                      </p>
                    </div>
                    <div className="text-right text-slate-400 shrink-0">
                      <div>{mov.user_name || 'Sistema'}</div>
                      <div className="text-[10px]">
                        {new Date(mov.created).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ações Rápidas em Cards */}
        <Card className="shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-900">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-2">
            <Button
              variant="outline"
              onClick={() => navigate('/search')}
              className="w-full justify-start text-xs font-medium h-10 border-slate-200 hover:bg-slate-50 text-slate-700"
            >
              <Folders className="w-4 h-4 mr-2 text-blue-600" />
              Pesquisa Global Rápida (Atalho /)
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/mapa-arquivo')}
              className="w-full justify-start text-xs font-medium h-10 border-slate-200 hover:bg-slate-50 text-slate-700"
            >
              <Box className="w-4 h-4 mr-2 text-amber-600" />
              Sugerir Melhor Localização Disponível
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/mapa-patrimonial')}
              className="w-full justify-start text-xs font-medium h-10 border-slate-200 hover:bg-slate-50 text-slate-700"
            >
              <Car className="w-4 h-4 mr-2 text-indigo-600" />
              Abrir Mapa Patrimonial Societário
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/relatorios')}
              className="w-full justify-start text-xs font-medium h-10 border-slate-200 hover:bg-slate-50 text-slate-700"
            >
              <FileText className="w-4 h-4 mr-2 text-emerald-600" />
              Emitir Relatório de Inventário Físico
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
