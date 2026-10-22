import React, { useState, useEffect } from 'react'
import {
  FileSpreadsheet,
  Download,
  Building2,
  MapPin,
  Clock,
  ArrowLeftRight,
  Filter,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  foldersService,
  boxesService,
  companiesService,
  movementsService,
  logAudit,
} from '@/services/api'
import type { Folder, Box, Company, FolderMovement } from '@/types'

export default function Relatorios() {
  const [folders, setFolders] = useState<Folder[]>([])
  const [boxes, setBoxes] = useState<Box[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [movements, setMovements] = useState<FolderMovement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [fRes, bRes, cRes, mRes] = await Promise.all([
        foldersService.getAll('(deleted = false || deleted = null)', 'code_legacy', 1, 500),
        boxesService.getAll(),
        companiesService.getAll(),
        movementsService.getAll('', '-created'),
      ])
      setFolders(fRes.items || [])
      setBoxes(bRes || [])
      setCompanies(cRes || [])
      setMovements(mRes || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Helper para download de CSV UTF-8 com BOM
  const exportToCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent =
      '\uFEFF' +
      [
        headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(';'),
        ...rows.map((row) =>
          row.map((val) => `"${String(val ?? '').replace(/"/g, '""')}"`).join(';'),
        ),
      ].join('\r\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    logAudit(
      'EXPORTACAO_RELATORIO',
      'relatorio',
      filename,
      `Relatório exportado em CSV: ${filename}`,
    )
  }

  // 1. Relatório por Empresa
  const exportEmpresas = () => {
    const headers = [
      'Código Pasta',
      'Título da Pasta',
      'Empresa / Grupo',
      'Arquivo',
      'Status',
      'Localização',
    ]
    const rows = folders.map((f) => [
      f.code_legacy || '',
      f.title || '',
      f.group_name || '',
      f.archive_type || '',
      f.status || '',
      f.location_text || '',
    ])
    exportToCsv('relatorio_pastas_por_empresa', headers, rows)
  }

  // 2. Relatório por Localização Física
  const exportLocalizacao = () => {
    const headers = ['Localização Física', 'Caixa', 'Código Pasta', 'Título', 'Arquivo']
    const rows = folders.map((f) => [
      f.location_text || 'Sem localização',
      f.box_code || '',
      f.code_legacy || '',
      f.title || '',
      f.archive_type || '',
    ])
    exportToCsv('relatorio_acervo_por_localizacao', headers, rows)
  }

  // 3. Relatório por Status e Ciclo
  const exportStatus = () => {
    const headers = [
      'Código',
      'Título',
      'Status Físico',
      'Ciclo de Vida',
      'Revisão Pendente',
      'Caixa',
    ]
    const rows = folders.map((f) => [
      f.code_legacy || '',
      f.title || '',
      f.status || '',
      f.cycle_status || '',
      f.needs_review ? 'Sim' : 'Não',
      f.box_code || '',
    ])
    exportToCsv('relatorio_status_ciclo_acervo', headers, rows)
  }

  // 4. Relatório de Movimentações
  const exportMovimentacoes = () => {
    const headers = [
      'Tipo',
      'Pasta',
      'Código',
      'Origem',
      'Destino',
      'Usuário / Responsável',
      'Data',
    ]
    const rows = movements.map((m) => [
      m.type || '',
      m.folder_title || '',
      m.folder_code || '',
      m.origin_location || '',
      m.destination_location || '',
      m.user_name || '',
      new Date(m.created).toLocaleString('pt-BR'),
    ])
    exportToCsv('relatorio_movimentacoes_acervo', headers, rows)
  }

  // Agrupamentos em memória para preview
  const countAtual = folders.filter((f) => f.archive_type === 'Atual').length
  const countMorto = folders.filter((f) => f.archive_type === 'Morto').length
  const countNoArquivo = folders.filter((f) => f.status === 'No Arquivo').length
  const countFora = folders.filter((f) => f.status === 'Fora do Arquivo').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
            Relatórios & Exportação do Acervo
          </h1>
          <p className="text-sm text-slate-500">
            Relatórios analíticos consolidados por empresa, localização, status e custódia física
          </p>
        </div>
      </div>

      {/* Grid de Relatórios Rápidos com Ação de Download */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-xs hover:border-emerald-300 transition-colors flex flex-col justify-between">
          <CardHeader className="p-4 pb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2">
              <Building2 className="w-4 h-4" />
            </div>
            <CardTitle className="text-sm font-bold text-slate-900">
              Acervo por Empresa & Titular
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 space-y-3 text-xs">
            <p className="text-slate-500">
              Listagem de todas as pastas segregadas por razão social, holding e pessoa física.
            </p>
            <Button
              onClick={exportEmpresas}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" /> Exportar CSV
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-xs hover:border-blue-300 transition-colors flex flex-col justify-between">
          <CardHeader className="p-4 pb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-2">
              <MapPin className="w-4 h-4" />
            </div>
            <CardTitle className="text-sm font-bold text-slate-900">
              Por Localização Física
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 space-y-3 text-xs">
            <p className="text-slate-500">
              Mapa do acervo organizado por sala, gaveteiro, estante e caixas físicas.
            </p>
            <Button
              onClick={exportLocalizacao}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" /> Exportar CSV
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-xs hover:border-amber-300 transition-colors flex flex-col justify-between">
          <CardHeader className="p-4 pb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-2">
              <Clock className="w-4 h-4" />
            </div>
            <CardTitle className="text-sm font-bold text-slate-900">
              Status & Ciclo de Vida
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 space-y-3 text-xs">
            <p className="text-slate-500">
              Pastas no arquivo, fora do arquivo, pendentes de revisão e prazos de guarda.
            </p>
            <Button
              onClick={exportStatus}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" /> Exportar CSV
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-xs hover:border-indigo-300 transition-colors flex flex-col justify-between">
          <CardHeader className="p-4 pb-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center mb-2">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <CardTitle className="text-sm font-bold text-slate-900">
              Movimentações Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 space-y-3 text-xs">
            <p className="text-slate-500">
              Histórico de saídas (check-out), retornos (check-in) e transferências de local.
            </p>
            <Button
              onClick={exportMovimentacoes}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" /> Exportar CSV
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Visualização de Síntese Numérica */}
      <Card className="shadow-xs border-slate-200">
        <CardHeader className="p-4 pb-2 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">
            Resumo Quantitativo Geral do Acervo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-500">Arquivo Atual (Corrente)</span>
              <p className="text-lg font-bold text-emerald-700 mt-1">{countAtual} pastas</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-500">Arquivo Morto (Passivo)</span>
              <p className="text-lg font-bold text-slate-800 mt-1">{countMorto} pastas</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-500">No Arquivo Físico</span>
              <p className="text-lg font-bold text-blue-700 mt-1">{countNoArquivo} pastas</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-500">Em Posse de Terceiros</span>
              <p className="text-lg font-bold text-red-600 mt-1">{countFora} pastas</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
