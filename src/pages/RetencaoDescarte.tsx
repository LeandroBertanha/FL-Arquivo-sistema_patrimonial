import React, { useState, useEffect } from 'react'
import {
  ShieldAlert,
  Search,
  Lock,
  Trash2,
  Plus,
  CalendarClock,
  FileText,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { retentionService, foldersService, movementsService, logAudit } from '@/services/api'
import type { RetentionRule, Folder, DisposalRequest } from '@/types'
import { ViewModeToggle, getStoredViewMode, type ViewMode } from '@/components/ViewModeToggle'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export default function RetencaoDescarte() {
  const { user, canEdit } = useAuth()
  const [rules, setRules] = useState<RetentionRule[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [requests, setRequests] = useState<DisposalRequest[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>(() => getStoredViewMode('retencao', 'table'))

  // Modal Nova Regra
  const [ruleModalOpen, setRuleModalOpen] = useState(false)
  const [ruleDocType, setRuleDocType] = useState('')
  const [ruleYears, setRuleYears] = useState(5)
  const [ruleAction, setRuleAction] = useState<RetentionRule['suggested_action']>('Descarte')
  const [ruleNotes, setRuleNotes] = useState('')
  const [savingRule, setSavingRule] = useState(false)

  // Modal Solicitação de Descarte
  const [disposalModalOpen, setDisposalModalOpen] = useState(false)
  const [disposalFolder, setDisposalFolder] = useState<Folder | null>(null)
  const [disposalJustification, setDisposalJustification] = useState('')
  const [savingDisposal, setSavingDisposal] = useState(false)

  // Confirmação de Execução do Descarte
  const [deleteTarget, setDeleteTarget] = useState<DisposalRequest | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [rList, fRes, dList] = await Promise.all([
        retentionService.getRules(),
        foldersService.getAll('(deleted = false || deleted = null)', 'code_legacy', 1, 500),
        retentionService.getDisposalRequests(),
      ])
      setRules(rList)
      setFolders(fRes.items || [])
      setRequests(dList)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canEdit) return
    setSavingRule(true)
    try {
      await retentionService.createRule({
        doc_type: ruleDocType,
        retention_years: Number(ruleYears),
        suggested_action: ruleAction,
        notes: ruleNotes,
      })
      await logAudit(
        'CRIACAO_REGRA_RETENCAO',
        'retention_rule',
        'novo',
        `Regra criada: ${ruleDocType} por ${ruleYears} anos → ${ruleAction}`,
      )
      setRuleModalOpen(false)
      setRuleDocType('')
      loadData()
    } catch (err) {
      console.error(err)
    } finally {
      setSavingRule(false)
    }
  }

  const handleCreateDisposal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!disposalFolder || !canEdit) return
    setSavingDisposal(true)
    try {
      await retentionService.createDisposalRequest({
        folder: disposalFolder.id,
        folder_title: disposalFolder.title,
        folder_code: disposalFolder.code_legacy || 'Sem código',
        requester_name: user?.name || 'Operador',
        justification: disposalJustification,
        status: 'Pendente',
      })
      await logAudit(
        'SOLICITACAO_DESCARTE',
        'folder',
        disposalFolder.id,
        `Solicitação de descarte registrada para "${disposalFolder.title}" (${disposalFolder.code_legacy}). Motivo: ${disposalJustification}`,
      )
      setDisposalModalOpen(false)
      setDisposalFolder(null)
      setDisposalJustification('')
      loadData()
      toast.success('Solicitação de descarte registrada com sucesso.')
    } catch (err) {
      console.error(err)
      toast.error('Falha ao registrar solicitação de descarte.')
    } finally {
      setSavingDisposal(false)
    }
  }

  const handleExecuteDisposal = async () => {
    if (!deleteTarget || !canEdit) return
    try {
      // 1. Marca o pedido como executado
      await retentionService.updateDisposalRequest(deleteTarget.id, {
        status: 'Executado',
        executed_date: new Date().toISOString(),
      })

      // 2. Move a pasta para status de descartada (mantém histórico)
      if (deleteTarget.folder) {
        await foldersService.update(
          deleteTarget.folder,
          { status: 'Descartada', cycle_status: 'Descarte' },
          'Descarte físico executado após aprovação',
        )
      }

      // 3. Registra movimentação formal de descarte
      await movementsService.createMovement({
        folder: deleteTarget.folder,
        folder_title: deleteTarget.folder_title,
        folder_code: deleteTarget.folder_code,
        type: 'Retirada',
        user_name: user?.name || 'Operador',
        origin_location: 'Arquivo Morto',
        destination_location: 'DESCARTE DEFINITIVO',
        reason: `Descarte executado: ${deleteTarget.justification || 'Aprovado previamente'}`,
      })

      setDeleteTarget(null)
      loadData()
      toast.success('Descarte executado e registrado na auditoria.')
    } catch (err) {
      console.error(err)
      toast.error('Falha ao executar o descarte.')
    }
  }

  // ===== Análise de Elegibilidade =====
  const currentYear = new Date().getFullYear()

  const eligibleFolders = folders.filter((f) => {
    // Elegível: arquivo morto OU ciclo em análise/descarte, sem bloqueio, sem descarte já executado
    const isEligible =
      !f.disposal_blocked &&
      f.status !== 'Descartada' &&
      (f.archive_type === 'Morto' || f.cycle_status === 'Análise' || f.cycle_status === 'Descarte')

    const matchSearch =
      !search ||
      f.title?.toLowerCase().includes(search.toLowerCase()) ||
      f.code_legacy?.toLowerCase().includes(search.toLowerCase()) ||
      f.box_code?.toLowerCase().includes(search.toLowerCase())

    return isEligible && matchSearch
  })

  const blockedFolders = folders.filter((f) => {
    return (
      f.disposal_blocked ||
      f.cycle_status === 'Guarda Permanente' ||
      (f.status !== 'Descartada' &&
        f.expected_disposal_date &&
        new Date(f.expected_disposal_date).getFullYear() > currentYear)
    )
  })

  // Pastas com prazo de guarda já vencido mas ainda em guarda
  const expiredRetention = folders.filter((f) => {
    if (f.status === 'Descartada') return false
    if (!f.expected_disposal_date) return false
    return new Date(f.expected_disposal_date).getFullYear() <= currentYear
  })

  const disposalFolderIds = new Set(requests.map((r) => r.folder))

  const filteredEligible = eligibleFolders.filter((f) =>
    disposalFolderIds.has(f.id) ? false : true,
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-600" />
            Retenção, Guarda & Descarte de Acervo
          </h1>
          <p className="text-sm text-slate-500">
            Tabela de temporalidade, pastas elegíveis, bloqueios de descarte e histórico de
            eliminação
          </p>
        </div>

        {canEdit && (
          <Button
            onClick={() => setRuleModalOpen(true)}
            className="bg-rose-600 hover:bg-rose-700 text-xs font-semibold"
          >
            <Plus className="w-4 h-4 mr-1" /> Nova Regra de Temporalidade
          </Button>
        )}
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">Elegíveis para Descarte</span>
          <p className="text-xl font-bold text-rose-600 mt-0.5">{filteredEligible.length}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">
            Bloqueadas / Guarda Permanente
          </span>
          <p className="text-xl font-bold text-slate-700 mt-0.5">{blockedFolders.length}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">Prazo Vencido (Aguardando)</span>
          <p className="text-xl font-bold text-amber-600 mt-0.5">{expiredRetention.length}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">Regras Cadastradas</span>
          <p className="text-xl font-bold text-blue-600 mt-0.5">{rules.length}</p>
        </div>
      </div>

      <Tabs defaultValue="elegiveis" className="w-full">
        <TabsList className="bg-white border border-slate-200 p-1 rounded-xl shadow-xs">
          <TabsTrigger value="elegiveis" className="text-xs font-semibold">
            Elegíveis p/ Descarte ({filteredEligible.length})
          </TabsTrigger>
          <TabsTrigger value="bloqueadas" className="text-xs font-semibold">
            Bloqueadas ({blockedFolders.length})
          </TabsTrigger>
          <TabsTrigger value="solicitacoes" className="text-xs font-semibold">
            Solicitações ({requests.length})
          </TabsTrigger>
          <TabsTrigger value="regras" className="text-xs font-semibold">
            Regras de Temporalidade ({rules.length})
          </TabsTrigger>
        </TabsList>

        {/* ===== Aba Elegíveis ===== */}
        <TabsContent value="elegiveis" className="pt-2 space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Buscar por código, título ou caixa..."
                className="pl-9 text-xs h-9 bg-slate-50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-medium">
                {filteredEligible.length} pasta(s)
              </span>
              <ViewModeToggle mode={viewMode} onChange={setViewMode} storageKey="retencao" />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Carregando análise de descarte...
            </div>
          ) : filteredEligible.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs shadow-xs">
              Nenhuma pasta elegível para descarte no momento.
            </div>
          ) : viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEligible.map((f) => (
                <Card
                  key={f.id}
                  className="shadow-xs hover:border-rose-300 transition-colors flex flex-col justify-between"
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {f.code_legacy || 'SEM CÓDIGO'}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-rose-50 text-rose-700 border-rose-200"
                      >
                        {f.cycle_status || f.archive_type}
                      </Badge>
                    </div>
                    <CardTitle className="text-sm font-bold text-slate-900 mt-2">
                      {f.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-1 space-y-2 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>
                        Caixa: <strong>{f.box_code || '—'}</strong>
                      </span>
                      <span>
                        Arquivo: <strong>{f.archive_type}</strong>
                      </span>
                    </div>
                    {f.retention_period && (
                      <p>
                        Prazo: <strong>{f.retention_period}</strong>
                      </p>
                    )}
                    {f.expected_disposal_date && (
                      <p className="flex items-center gap-1.5 text-amber-700">
                        <CalendarClock className="w-3.5 h-3.5" />
                        Previsto p/ descarte:{' '}
                        <strong>
                          {new Date(f.expected_disposal_date).toLocaleDateString('pt-BR')}
                        </strong>
                      </p>
                    )}

                    {canEdit && (
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                        <Button
                          size="sm"
                          onClick={() => {
                            setDisposalFolder(f)
                            setDisposalJustification('')
                            setDisposalModalOpen(true)
                          }}
                          className="h-7 px-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Solicitar Descarte
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4 whitespace-nowrap">Código</th>
                      <th className="py-3 px-4 min-w-[180px]">Título</th>
                      <th className="py-3 px-4 whitespace-nowrap">Caixa</th>
                      <th className="py-3 px-4 whitespace-nowrap">Arquivo</th>
                      <th className="py-3 px-4 whitespace-nowrap">Prazo</th>
                      <th className="py-3 px-4 whitespace-nowrap">Descarte Previsto</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEligible.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                          {f.code_legacy || 'SEM CÓDIGO'}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs truncate">
                          {f.title}
                        </td>
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                          {f.box_code || '—'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">{f.archive_type}</td>
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                          {f.retention_period || '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                          {f.expected_disposal_date
                            ? new Date(f.expected_disposal_date).toLocaleDateString('pt-BR')
                            : '—'}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {canEdit && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setDisposalFolder(f)
                                setDisposalModalOpen(true)
                              }}
                              className="h-7 px-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" /> Solicitar
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ===== Aba Bloqueadas ===== */}
        <TabsContent value="bloqueadas" className="pt-2">
          {blockedFolders.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs shadow-xs">
              Nenhuma pasta bloqueada para descarte.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4 whitespace-nowrap">Código</th>
                      <th className="py-3 px-4 min-w-[180px]">Título</th>
                      <th className="py-3 px-4 whitespace-nowrap">Motivo do Bloqueio</th>
                      <th className="py-3 px-4 whitespace-nowrap">Status do Ciclo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {blockedFolders.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                          {f.code_legacy || 'SEM CÓDIGO'}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900 max-w-sm truncate">
                          {f.title}
                        </td>
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                          {f.disposal_blocked ? 'Bloqueio manual de descarte' : 'Guarda Permanente'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Badge variant="outline" className="text-[10px]">
                            {f.cycle_status || f.archive_type}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ===== Aba Solicitações ===== */}
        <TabsContent value="solicitacoes" className="pt-2">
          {requests.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs shadow-xs">
              Nenhuma solicitação de descarte registrada ainda.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[750px] text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4 min-w-[180px]">Pasta</th>
                      <th className="py-3 px-4 whitespace-nowrap">Código</th>
                      <th className="py-3 px-4 whitespace-nowrap">Solicitante</th>
                      <th className="py-3 px-4 min-w-[150px]">Justificativa</th>
                      <th className="py-3 px-4 whitespace-nowrap">Status</th>
                      <th className="py-3 px-4 whitespace-nowrap">Data</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {requests.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs truncate">
                          {r.folder_title}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                          {r.folder_code}
                        </td>
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                          {r.requester_name || '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-md truncate">
                          {r.justification || '—'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              r.status === 'Executado'
                                ? 'bg-slate-100 text-slate-600 border-slate-200'
                                : r.status === 'Aprovado'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : r.status === 'Rejeitado'
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {r.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                          {new Date(r.created).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {canEdit && r.status !== 'Executado' && (
                            <Button
                              size="sm"
                              onClick={() => setDeleteTarget(r)}
                              className="h-7 px-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" /> Executar Descarte
                            </Button>
                          )}
                          {r.status === 'Executado' && (
                            <span className="text-[10px] text-slate-400 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Concluído
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ===== Aba Regras ===== */}
        <TabsContent value="regras" className="pt-2">
          {rules.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs shadow-xs">
              Nenhuma regra de temporalidade cadastrada. Crie a primeira para nortear os descartes.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4 whitespace-nowrap">Tipo Documental</th>
                      <th className="py-3 px-4 whitespace-nowrap">Retenção (anos)</th>
                      <th className="py-3 px-4 whitespace-nowrap">Ação Sugerida</th>
                      <th className="py-3 px-4 min-w-[180px]">Observações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rules.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                          {r.doc_type}
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-bold whitespace-nowrap">
                          {r.retention_years}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              r.suggested_action === 'Descarte'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : r.suggested_action === 'Microfilmagem'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {r.suggested_action}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-slate-500 max-w-md truncate">
                          {r.notes || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal Nova Regra */}
      <Dialog open={ruleModalOpen} onOpenChange={setRuleModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base text-slate-900">
              Nova Regra de Temporalidade
            </DialogTitle>
            <DialogDescription className="text-xs">
              Defina o prazo de guarda por tipo documental conforme tabela de retenção.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateRule} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Tipo Documental *</label>
              <Input
                required
                placeholder="Ex: Contratos Sociais, Notas Fiscais, TRCT..."
                value={ruleDocType}
                onChange={(e) => setRuleDocType(e.target.value)}
                className="text-xs h-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Retenção (anos)</label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={ruleYears}
                  onChange={(e) => setRuleYears(Number(e.target.value))}
                  className="text-xs h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Ação Sugerida</label>
                <select
                  className="w-full h-9 border border-slate-200 rounded-md px-3 bg-white text-xs"
                  value={ruleAction}
                  onChange={(e: any) => setRuleAction(e.target.value)}
                >
                  <option value="Descarte">Descarte</option>
                  <option value="Guarda Permanente">Guarda Permanente</option>
                  <option value="Microfilmagem">Microfilmagem</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Observações</label>
              <Input
                placeholder="Base legal ou referência..."
                value={ruleNotes}
                onChange={(e) => setRuleNotes(e.target.value)}
                className="text-xs h-9"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRuleModalOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={savingRule}
                className="bg-rose-600 hover:bg-rose-700 text-xs"
              >
                {savingRule ? 'Gravando...' : 'Salvar Regra'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Solicitação de Descarte */}
      <Dialog open={disposalModalOpen} onOpenChange={setDisposalModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base text-slate-900">
              Solicitar Descarte de Pasta
            </DialogTitle>
            <DialogDescription className="text-xs">
              A solicitação fica pendente de aprovação e o descarte físico só é executado após
              confirmação explícita.
            </DialogDescription>
          </DialogHeader>
          {disposalFolder && (
            <form onSubmit={handleCreateDisposal} className="space-y-3 py-2 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <p className="font-bold text-slate-900">{disposalFolder.title}</p>
                <p className="font-mono text-blue-700 text-[11px]">
                  Código: {disposalFolder.code_legacy || 'Sem código'}
                </p>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Justificativa do Descarte *</label>
                <Input
                  required
                  placeholder="Ex: Prazo de guarda vencido conforme tabela de temporalidade"
                  value={disposalJustification}
                  onChange={(e) => setDisposalJustification(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDisposalModalOpen(false)}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={savingDisposal}
                  className="bg-rose-600 hover:bg-rose-700 text-xs"
                >
                  {savingDisposal ? 'Registrando...' : 'Registrar Solicitação'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmação de Execução do Descarte */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Executar Descarte Definitivo?</AlertDialogTitle>
            <AlertDialogDescription>
              Confirmar o descarte da pasta <strong>{deleteTarget?.folder_title}</strong> (
              {deleteTarget?.folder_code})? A pasta ficará com status <strong>Descartada</strong> e
              a ação será registrada na auditoria do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExecuteDisposal}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Confirmar Descarte
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
