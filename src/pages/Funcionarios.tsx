import React, { useState, useEffect } from 'react'
import { UserCheck, Plus, Search, Edit, Trash2 } from 'lucide-react'
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
import { employeesService, logAudit } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'
import type { Employee } from '@/types'
import { ViewModeToggle, getStoredViewMode, type ViewMode } from '@/components/ViewModeToggle'

export default function Funcionarios() {
  const { canEdit } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'todos' | 'Atual' | 'Ex-funcionário'>('todos')
  const [reviewFilter, setReviewFilter] = useState('todos')
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    getStoredViewMode('funcionarios', 'cards'),
  )

  // Modal Criar / Editar
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [situation, setSituation] = useState<'Atual' | 'Ex-funcionário'>('Ex-funcionário')
  const [boxCode, setBoxCode] = useState('CX N7')
  const [notes, setNotes] = useState('')
  const [needsReview, setNeedsReview] = useState(false)
  const [saving, setSaving] = useState(false)

  // Modal Exclusão
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const list = await employeesService.getAll()
      setEmployees(list)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const openNew = () => {
    setEditingEmployee(null)
    setName('')
    setRole('')
    setCompanyName('')
    setSituation('Ex-funcionário')
    setBoxCode('CX N7')
    setNotes('')
    setNeedsReview(false)
    setModalOpen(true)
  }

  const openEdit = (emp: Employee) => {
    setEditingEmployee(emp)
    setName(emp.name || '')
    setRole(emp.role || '')
    setCompanyName(emp.company_name || '')
    setSituation(emp.situation || 'Ex-funcionário')
    setBoxCode(emp.box_code || (emp.situation === 'Atual' ? 'CX N10' : 'CX N7'))
    setNotes(emp.notes || '')
    setNeedsReview(!!emp.needs_review)
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload: Partial<Employee> = {
        name,
        role,
        company_name: companyName,
        situation,
        box_code: boxCode,
        notes,
        needs_review: needsReview,
      }

      if (editingEmployee) {
        await employeesService.update(editingEmployee.id, payload)
        await logAudit(
          'EDICAO_FUNCIONARIO',
          'employees',
          editingEmployee.id,
          `Prontuário atualizado: ${payload.name} (${payload.situation})`,
        )
      } else {
        const created = await employeesService.create(payload)
        await logAudit(
          'CRIACAO_FUNCIONARIO',
          'employees',
          created.id,
          `Prontuário cadastrado: ${payload.name} (${payload.situation})`,
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
      await employeesService.delete(deleteTarget.id)
      await logAudit(
        'EXCLUSAO_FUNCIONARIO',
        'employees',
        deleteTarget.id,
        `Prontuário excluído: ${deleteTarget.name} (${deleteTarget.situation})`,
      )
      setDeleteTarget(null)
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase()
    const matchQuery =
      !q ||
      e.name?.toLowerCase().includes(q) ||
      e.box_code?.toLowerCase().includes(q) ||
      e.company_name?.toLowerCase().includes(q) ||
      e.role?.toLowerCase().includes(q)

    const matchStatus = statusFilter === 'todos' || e.situation === statusFilter
    const matchReview =
      reviewFilter === 'todos' ||
      (reviewFilter === 'sim' && e.needs_review) ||
      (reviewFilter === 'nao' && !e.needs_review)

    return matchQuery && matchStatus && matchReview
  })

  const countEx = employees.filter((e) => e.situation === 'Ex-funcionário').length
  const countAtuais = employees.filter((e) => e.situation === 'Atual').length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-blue-600" />
            Funcionários e Ex-Funcionários
          </h1>
          <p className="text-sm text-slate-500">
            Controle de prontuários em caixas físicas (CX N7 ex-colaboradores e CX N10 atuais)
          </p>
        </div>
        {canEdit && (
          <Button onClick={openNew} className="bg-blue-600 hover:bg-blue-700 text-xs font-semibold">
            <Plus className="w-4 h-4 mr-1" /> Novo Funcionário
          </Button>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Buscar por nome do funcionário, cargo, empresa ou caixa..."
            className="pl-9 text-xs h-9 bg-slate-50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Filtro por Situação / Status */}
          <select
            className="h-9 border border-slate-200 rounded-md px-3 bg-white text-xs"
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
          >
            <option value="todos">Todos Status ({employees.length})</option>
            <option value="Ex-funcionário">Ex-Funcionários ({countEx})</option>
            <option value="Atual">Funcionários Atuais ({countAtuais})</option>
          </select>

          {/* Filtro por Revisão */}
          <select
            className="h-9 border border-slate-200 rounded-md px-3 bg-white text-xs"
            value={reviewFilter}
            onChange={(e) => setReviewFilter(e.target.value)}
          >
            <option value="todos">Todas</option>
            <option value="sim">Em Revisão</option>
            <option value="nao">Normalizados</option>
          </select>

          <span className="text-xs text-slate-400 font-medium">{filtered.length} registro(s)</span>

          <ViewModeToggle mode={viewMode} onChange={setViewMode} storageKey="funcionarios" />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Carregando prontuários...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs shadow-xs">
          Nenhum prontuário encontrado para os filtros selecionados.
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((emp) => (
            <Card
              key={emp.id}
              className="shadow-xs hover:border-blue-300 transition-colors flex flex-col justify-between"
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between">
                  <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {emp.box_code || 'Caixa'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {emp.needs_review && (
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-amber-100 text-amber-800 border-amber-300"
                      >
                        Revisão
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        emp.situation === 'Atual'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {emp.situation}
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 mt-2">{emp.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-1.5 text-xs text-slate-500">
                {emp.role && (
                  <p>
                    Função: <strong className="text-slate-700">{emp.role}</strong>
                  </p>
                )}
                {emp.company_name && (
                  <p>
                    Empresa: <strong className="text-slate-700">{emp.company_name}</strong>
                  </p>
                )}
                {emp.notes && <p className="text-[11px] text-slate-400 italic">{emp.notes}</p>}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1">
                  {canEdit ? (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(emp)}
                        className="h-7 px-2 text-blue-600 hover:text-blue-800 text-xs"
                      >
                        <Edit className="w-3.5 h-3.5 mr-1" /> Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteTarget(emp)}
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
                  <th className="py-3 px-4 min-w-[180px]">Nome do Funcionário</th>
                  <th className="py-3 px-4 whitespace-nowrap">Cargo / Função</th>
                  <th className="py-3 px-4 whitespace-nowrap">Empresa</th>
                  <th className="py-3 px-4 whitespace-nowrap">Situação</th>
                  <th className="py-3 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-800 whitespace-nowrap">
                      {emp.box_code || '—'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{emp.name}</td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {emp.role || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {emp.company_name || '—'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          emp.situation === 'Atual'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {emp.situation}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {emp.needs_review ? (
                        <Badge
                          variant="outline"
                          className="bg-amber-100 text-amber-800 border-amber-300 text-[10px]"
                        >
                          Revisão
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                        >
                          Regular
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {canEdit ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(emp)}
                            className="h-7 px-2 text-blue-600 hover:text-blue-800"
                          >
                            <Edit className="w-3.5 h-3.5 mr-1" /> Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteTarget(emp)}
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
              {editingEmployee ? 'Editar Prontuário' : 'Cadastrar Prontuário'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Informe os dados do colaborador e a caixa física onde a pasta reside.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Nome Completo *</label>
              <Input
                required
                placeholder="Ex: Carlos Eduardo dos Santos"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xs h-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Cargo / Função</label>
                <Input
                  placeholder="Ex: Motorista, Auxiliar"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Empresa Contratante</label>
                <Input
                  placeholder="Ex: AUTO&CO, CAPANNONE"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Situação</label>
                <select
                  className="w-full h-9 border border-slate-200 rounded-md px-3 bg-white text-xs"
                  value={situation}
                  onChange={(e: any) => {
                    const sit = e.target.value
                    setSituation(sit)
                    if (!editingEmployee) {
                      setBoxCode(sit === 'Atual' ? 'CX N10' : 'CX N7')
                    }
                  }}
                >
                  <option value="Ex-funcionário">Ex-funcionário (CX N7)</option>
                  <option value="Atual">Atual (CX N10)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Caixa Física</label>
                <Input
                  value={boxCode}
                  onChange={(e) => setBoxCode(e.target.value)}
                  className="text-xs h-9 font-mono"
                  placeholder="Ex: CX N7, CX N10"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Observações</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs h-9"
                placeholder="Ex: TRCT anexado, folha ponto..."
              />
            </div>
            <div className="pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={needsReview}
                  onChange={(e) => setNeedsReview(e.target.checked)}
                />
                <span>Marcar para revisão humana (inconsistência ou duplicidade de código)</span>
              </label>
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
                {saving ? 'Gravando...' : 'Salvar Prontuário'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmação de Exclusão */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Funcionário?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja excluir o cadastro do funcionário{' '}
              <strong>{deleteTarget?.name}</strong>?
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
