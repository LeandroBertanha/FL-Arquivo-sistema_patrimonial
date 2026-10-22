import React, { useState, useEffect } from 'react'
import { Scale, Plus, Search, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { processesService, logAudit } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'
import type { ProcessItem } from '@/types'
import { ViewModeToggle, getStoredViewMode, type ViewMode } from '@/components/ViewModeToggle'

export default function Processos() {
  const { canEdit } = useAuth()
  const [processes, setProcesses] = useState<ProcessItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [typeFilter, setTypeFilter] = useState('todos')
  const [viewMode, setViewMode] = useState<ViewMode>(() => getStoredViewMode('processos', 'cards'))

  // Modal Criar/Editar
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProcess, setEditingProcess] = useState<ProcessItem | null>(null)
  const [title, setTitle] = useState('')
  const [number, setNumber] = useState('')
  const [parties, setParties] = useState('')
  const [type, setType] = useState<ProcessItem['type']>('Trabalhista')
  const [boxCode, setBoxCode] = useState('CX N2')
  const [lawyer, setLawyer] = useState('')
  const [status, setStatus] = useState<ProcessItem['status']>('Terminado')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  // Modal Exclusão
  const [deleteTarget, setDeleteTarget] = useState<ProcessItem | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const list = await processesService.getAll()
      setProcesses(list)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const openNew = () => {
    setEditingProcess(null)
    setTitle('')
    setNumber('')
    setParties('')
    setType('Trabalhista')
    setBoxCode('CX N2')
    setLawyer('')
    setStatus('Terminado')
    setNotes('')
    setModalOpen(true)
  }

  const openEdit = (p: ProcessItem) => {
    setEditingProcess(p)
    setTitle(p.title || '')
    setNumber(p.number || '')
    setParties(p.parties || '')
    setType(p.type || 'Trabalhista')
    setBoxCode(p.box_code || 'CX N2')
    setLawyer(p.lawyer || '')
    setStatus(p.status || 'Terminado')
    setNotes(p.notes || '')
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload: Partial<ProcessItem> = {
        title,
        number,
        parties,
        type,
        box_code: boxCode,
        lawyer,
        status,
        notes,
      }

      if (editingProcess) {
        await processesService.update(editingProcess.id, payload)
        await logAudit(
          'EDICAO_PROCESSO',
          'processes',
          editingProcess.id,
          `Processo atualizado: ${payload.title} (${payload.box_code || 'Sem caixa'})`,
        )
      } else {
        const created = await processesService.create(payload)
        await logAudit(
          'CRIACAO_PROCESSO',
          'processes',
          created.id,
          `Processo cadastrado: ${payload.title} (${payload.box_code || 'Sem caixa'})`,
        )
      }
      setModalOpen(false)
      loadData()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await processesService.delete(deleteTarget.id)
      await logAudit(
        'EXCLUSAO_PROCESSO',
        'processes',
        deleteTarget.id,
        `Processo excluído: ${deleteTarget.title} (${deleteTarget.box_code || 'Sem caixa'})`,
      )
      setDeleteTarget(null)
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const filtered = processes.filter((p) => {
    const q = search.toLowerCase()
    const matchQuery =
      !q ||
      p.title?.toLowerCase().includes(q) ||
      p.box_code?.toLowerCase().includes(q) ||
      p.lawyer?.toLowerCase().includes(q) ||
      p.number?.toLowerCase().includes(q) ||
      p.parties?.toLowerCase().includes(q)

    const matchStatus = statusFilter === 'todos' || p.status === statusFilter
    const matchType = typeFilter === 'todos' || p.type === typeFilter

    return matchQuery && matchStatus && matchType
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Scale className="w-6 h-6 text-blue-600" />
            Processos Jurídicos e Trabalhistas
          </h1>
          <p className="text-sm text-slate-500">
            Processos ativos, suspensos e terminados vinculados a caixas físicas (CX N2, CX N4, CX
            N5/01)
          </p>
        </div>
        {canEdit && (
          <Button onClick={openNew} className="bg-blue-600 hover:bg-blue-700 text-xs font-semibold">
            <Plus className="w-4 h-4 mr-1" /> Novo Processo
          </Button>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Buscar por nome do processo, advogado, número ou caixa..."
            className="pl-9 text-xs h-9 bg-slate-50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Filtro por Status */}
          <select
            className="h-9 border border-slate-200 rounded-md px-3 bg-white text-xs"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="todos">Todos Status</option>
            <option value="Ativo">Ativo</option>
            <option value="Terminado">Terminado</option>
            <option value="Suspenso">Suspenso</option>
            <option value="Arquivado">Arquivado</option>
          </select>

          {/* Filtro por Tipo */}
          <select
            className="h-9 border border-slate-200 rounded-md px-3 bg-white text-xs"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="todos">Todos Tipos</option>
            <option value="Trabalhista">Trabalhista</option>
            <option value="Cível">Cível</option>
            <option value="Tributário">Tributário</option>
            <option value="Ativo">Ativo</option>
            <option value="Terminado">Terminado</option>
            <option value="Outro">Outro</option>
          </select>

          <span className="text-xs text-slate-400 font-medium">{filtered.length} processo(s)</span>

          <ViewModeToggle mode={viewMode} onChange={setViewMode} storageKey="processos" />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Carregando processos...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs shadow-xs">
          Nenhum processo encontrado com os filtros aplicados.
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((pr) => (
            <Card
              key={pr.id}
              className="shadow-xs hover:border-blue-300 transition-colors flex flex-col justify-between"
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between">
                  <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {pr.box_code || 'Caixa Geral'}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      pr.status === 'Ativo'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold'
                        : pr.status === 'Suspenso'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {pr.status}
                  </Badge>
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 mt-2">{pr.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>
                    Tipo: <strong>{pr.type}</strong>
                  </span>
                  {pr.number && <span className="font-mono text-slate-400">Nº {pr.number}</span>}
                </div>
                {pr.lawyer && (
                  <p>
                    Advogado: <strong>{pr.lawyer}</strong>
                  </p>
                )}
                {pr.notes && <p className="text-[11px] text-slate-400 italic">{pr.notes}</p>}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1">
                  {canEdit ? (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(pr)}
                        className="h-7 px-2 text-blue-600 hover:text-blue-800 text-xs"
                      >
                        <Edit className="w-3.5 h-3.5 mr-1" /> Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteTarget(pr)}
                        className="h-7 px-2 text-red-600 hover:text-red-800 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir
                      </Button>
                    </>
                  ) : (
                    <span className="text-[11px] text-slate-400">Somente leitura</span>
                  )}
                </div>
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
                  <th className="py-3 px-4 whitespace-nowrap">Caixa</th>
                  <th className="py-3 px-4 min-w-[180px]">Título / Processo</th>
                  <th className="py-3 px-4 whitespace-nowrap">Número</th>
                  <th className="py-3 px-4 whitespace-nowrap">Tipo</th>
                  <th className="py-3 px-4 whitespace-nowrap">Advogado</th>
                  <th className="py-3 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((pr) => (
                  <tr key={pr.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-800 whitespace-nowrap">
                      {pr.box_code || '—'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 max-w-sm truncate">
                      {pr.title}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {pr.number || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{pr.type}</td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {pr.lawyer || '—'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          pr.status === 'Ativo'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : pr.status === 'Suspenso'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {pr.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {canEdit ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(pr)}
                            className="h-7 px-2 text-blue-600 hover:text-blue-800"
                          >
                            <Edit className="w-3.5 h-3.5 mr-1" /> Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteTarget(pr)}
                            className="h-7 px-2 text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">Somente leitura</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Criar / Editar */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base text-slate-900">
              {editingProcess ? 'Editar Processo' : 'Cadastrar Processo'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Preencha os detalhes do processo judicial ou administrativo e sua caixa física.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Título / Partes Envolvidas *</label>
              <Input
                required
                placeholder="Ex: RECLAMAÇÃO TRABALHISTA - SILVA VS CAPANNONE"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xs h-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Número do Processo</label>
                <Input
                  placeholder="Ex: 0010234-88.2023.5.02.0001"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  className="text-xs h-9 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Tipo de Ação</label>
                <select
                  className="w-full h-9 border border-slate-200 rounded-md px-3 bg-white text-xs"
                  value={type}
                  onChange={(e: any) => setType(e.target.value)}
                >
                  <option value="Trabalhista">Trabalhista</option>
                  <option value="Cível">Cível</option>
                  <option value="Tributário">Tributário</option>
                  <option value="Ativo">Ativo</option>
                  <option value="Terminado">Terminado</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Caixa Vinculada</label>
                <Input
                  value={boxCode}
                  onChange={(e) => setBoxCode(e.target.value)}
                  className="text-xs h-9 font-mono"
                  placeholder="Ex: CX N2, CX N4"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Status</label>
                <select
                  className="w-full h-9 border border-slate-200 rounded-md px-3 bg-white text-xs"
                  value={status}
                  onChange={(e: any) => setStatus(e.target.value)}
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Terminado">Terminado</option>
                  <option value="Suspenso">Suspenso</option>
                  <option value="Arquivado">Arquivado</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Advogado Responsável</label>
              <Input
                value={lawyer}
                onChange={(e) => setLawyer(e.target.value)}
                className="text-xs h-9"
                placeholder="Ex: Dr. Sérgio Nunes"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Observações</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs h-9"
                placeholder="Ex: Aguardando homologação de acordo..."
              />
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-xs"
              >
                {saving ? 'Gravando...' : 'Salvar Processo'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmação de Exclusão */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Processo?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja excluir o processo <strong>{deleteTarget?.title}</strong>?
              Esta ação removerá o registro do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
