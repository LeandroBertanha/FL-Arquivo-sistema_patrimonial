import React, { useState, useEffect } from 'react'
import { FileWarning, CheckCircle2, AlertTriangle, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { migrationIssuesService, logAudit } from '@/services/api'
import type { MigrationIssue } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { ViewModeToggle, getStoredViewMode, type ViewMode } from '@/components/ViewModeToggle'
import { toast } from 'sonner'

export default function RevisaoMigracao() {
  const { canEdit } = useAuth()
  const [issues, setIssues] = useState<MigrationIssue[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendentes' | 'resolvidos'>(
    'pendentes',
  )
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    getStoredViewMode('revisao_migracao', 'table'),
  )

  useEffect(() => {
    loadIssues()
  }, [])

  const loadIssues = async () => {
    setLoading(true)
    try {
      const data = await migrationIssuesService.getAll()
      setIssues(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleResolveIssue = async (issue: MigrationIssue) => {
    if (!canEdit) return
    try {
      const isResolved = issue.status === 'Resolvida'
      const nextStatus: MigrationIssue['status'] = isResolved ? 'Pendente' : 'Resolvida'

      await migrationIssuesService.update(issue.id, {
        status: nextStatus,
        resolution_notes: `Homologado via interface do operador`,
      })

      await logAudit(
        nextStatus === 'Resolvida' ? 'REVISAO_MIGRACAO_RESOLVIDA' : 'REVISAO_MIGRACAO_PENDENTE',
        'migration_issues',
        issue.id,
        `Item de migração código ${issue.code_legacy || 'sem código'} marcado como ${nextStatus}`,
      )

      toast.success(`Status atualizado para: ${nextStatus}`)
      loadIssues()
    } catch (err) {
      console.error(err)
      toast.error('Falha ao atualizar status da revisão.')
    }
  }

  // Filtragem
  const filteredIssues = issues.filter((iss) => {
    const q = search.toLowerCase()
    const matchQuery =
      !q ||
      iss.code_legacy?.toLowerCase().includes(q) ||
      iss.original_content?.toLowerCase().includes(q) ||
      iss.description?.toLowerCase().includes(q) ||
      iss.origin_sheet?.toLowerCase().includes(q)

    const matchStatus =
      statusFilter === 'todos' ||
      (statusFilter === 'pendentes' && iss.status !== 'Resolvida') ||
      (statusFilter === 'resolvidos' && iss.status === 'Resolvida')

    return matchQuery && matchStatus
  })

  const totalPendentes = issues.filter((i) => i.status !== 'Resolvida').length
  const totalResolvidos = issues.filter((i) => i.status === 'Resolvida').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileWarning className="w-6 h-6 text-amber-600" />
            Revisão da Migração do Acervo Físico
          </h1>
          <p className="text-sm text-slate-500">
            Tratamento de códigos originais ambíguos (ex: N1 vs N01), duplicatas de planilha e
            pastas sem metadados
          </p>
        </div>
      </div>
      {/* Indicadores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">Inconsistências Mapeadas</span>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{issues.length}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">Pendentes de Homologação</span>
          <p className="text-xl font-bold text-amber-600 mt-0.5">{totalPendentes}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">Revisados e Aprovados</span>
          <p className="text-xl font-bold text-emerald-600 mt-0.5">{totalResolvidos}</p>
        </div>
      </div>
      {/* Caixa de Regra do Acervo */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-1">
        <p className="font-bold flex items-center gap-1.5 text-amber-950">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          Regra Estrita de Preservação dos Códigos do Excel:
        </p>
        <p>
          O sistema <strong>nunca renumera</strong> códigos físicos. Códigos como <code>N1</code> e{' '}
          <code>N01</code> são reconhecidos como registros distintos da planilha original. Códigos
          duplicados receberam ID interno único e estão aqui para confirmação do operador do
          arquivo.
        </p>
      </div>
      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Buscar por código (N1, N01, N7/01), conteúdo original ou tipo..."
            className="pl-9 text-xs h-9 bg-slate-50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="h-9 border border-slate-200 rounded-md px-3 bg-white text-xs"
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
          >
            <option value="pendentes">Apenas Pendentes ({totalPendentes})</option>
            <option value="resolvidos">Apenas Resolvidos ({totalResolvidos})</option>
            <option value="todos">Todos os Registros ({issues.length})</option>
          </select>

          <span className="text-xs text-slate-400 font-medium">
            {filteredIssues.length} registro(s)
          </span>

          <ViewModeToggle mode={viewMode} onChange={setViewMode} storageKey="revisao_migracao" />
        </div>
      </div>
      {/* Exibição */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">
          Carregando itens para revisão...
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs shadow-xs">
          Nenhuma pendência de migração encontrada para este filtro.
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIssues.map((iss) => {
            const isResolved = iss.status === 'Resolvida'

            return (
              <Card
                key={iss.id}
                className={`shadow-xs transition-colors flex flex-col justify-between ${
                  isResolved ? 'border-emerald-300 bg-emerald-50/15' : 'hover:border-amber-300'
                }`}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {iss.code_legacy || 'SEM CÓDIGO'}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        isResolved
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}
                    >
                      {iss.issue_type || iss.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-bold text-slate-900 mt-2">
                    {iss.original_content}
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-4 pt-1 space-y-2 text-xs text-slate-600">
                  <p className="text-slate-500">{iss.description}</p>
                  <p>
                    Aba Origem: <strong>{iss.origin_sheet || 'Geral'}</strong> (Linha{' '}
                    {iss.origin_row || '—'})
                  </p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                    {canEdit && (
                      <Button
                        size="sm"
                        variant={isResolved ? 'outline' : 'default'}
                        onClick={() => handleResolveIssue(iss)}
                        className={`h-7 px-2.5 text-xs font-semibold ${
                          isResolved
                            ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                            : 'bg-amber-600 hover:bg-amber-700 text-white'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        {isResolved ? 'Reabrir' : 'Marcar Homologado'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 whitespace-nowrap">Código Original</th>
                  <th className="py-3 px-4 min-w-[200px]">Conteúdo Identificado</th>
                  <th className="py-3 px-4 min-w-[160px]">Tipo Inconsistência</th>
                  <th className="py-3 px-4 whitespace-nowrap">Planilha Origem</th>
                  <th className="py-3 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIssues.map((iss) => {
                  const isResolved = iss.status === 'Resolvida'

                  return (
                    <tr
                      key={iss.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isResolved ? 'bg-emerald-50/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                        {iss.code_legacy || 'SEM CÓDIGO'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 max-w-sm">
                        {iss.original_content}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {iss.issue_type || iss.description}
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {iss.origin_sheet || '—'} (Linha {iss.origin_row || '—'})
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            isResolved
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}
                        >
                          {isResolved ? 'Homologado' : 'Pendente'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {canEdit && (
                          <Button
                            size="sm"
                            variant={isResolved ? 'outline' : 'default'}
                            onClick={() => handleResolveIssue(iss)}
                            className={`h-7 px-2.5 text-xs font-semibold ${
                              isResolved
                                ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                                : 'bg-amber-600 hover:bg-amber-700 text-white'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            {isResolved ? 'Reabrir' : 'Homologar'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}{' '}
    </div>
  )
}
