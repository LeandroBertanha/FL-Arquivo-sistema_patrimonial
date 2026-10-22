import React, { useState, useEffect } from 'react'
import { Building2, Plus, Search, Edit, Trash2 } from 'lucide-react'
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
import { companiesService } from '@/services/api'
import type { Company } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { ViewModeToggle, getStoredViewMode, type ViewMode } from '@/components/ViewModeToggle'

export default function Empresas() {
  const { canEdit } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [viewMode, setViewMode] = useState<ViewMode>(() => getStoredViewMode('empresas', 'cards'))

  // Modal Empresa (Criar / Editar)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [name, setName] = useState('')
  const [tradeName, setTradeName] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [groupName, setGroupName] = useState('')
  const [capital, setCapital] = useState(0)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  // Modal Exclusão
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const list = await companiesService.getAll()
      setCompanies(list)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const openNew = () => {
    setEditingCompany(null)
    setName('')
    setTradeName('')
    setCnpj('')
    setGroupName('GRUPO VL')
    setCapital(0)
    setNotes('')
    setModalOpen(true)
  }

  const openEdit = (c: Company) => {
    setEditingCompany(c)
    setName(c.name || '')
    setTradeName(c.trade_name || '')
    setCnpj(c.cnpj || '')
    setGroupName(c.group_name || 'GRUPO VL')
    setCapital(c.capital || 0)
    setNotes(c.notes || '')
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload: Partial<Company> = {
        name,
        trade_name: tradeName || name,
        cnpj,
        group_name: groupName,
        capital: Number(capital),
        notes,
        status: 'Ativa',
      }

      if (editingCompany) {
        await companiesService.update(editingCompany.id, payload)
      } else {
        await companiesService.create(payload)
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
      await companiesService.delete(deleteTarget.id)
      setDeleteTarget(null)
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const filtered = companies.filter((c) => {
    const q = search.toLowerCase()
    return (
      !q ||
      c.name?.toLowerCase().includes(q) ||
      c.trade_name?.toLowerCase().includes(q) ||
      c.cnpj?.toLowerCase().includes(q) ||
      c.group_name?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            Empresas e Holdings do Acervo
          </h1>
          <p className="text-sm text-slate-500">
            Cadastros societários, participações societárias e vínculo com pastas físicas
          </p>
        </div>
        {canEdit && (
          <Button
            onClick={openNew}
            className="bg-[#1E2749] hover:bg-[#151D38] text-white text-xs font-semibold shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1" /> Nova Empresa
          </Button>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Buscar empresa por razão social, nome fantasia, CNPJ ou grupo..."
            className="pl-9 text-xs h-9 bg-slate-50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="text-xs text-slate-400 font-medium">{filtered.length} empresa(s)</span>
        <ViewModeToggle mode={viewMode} onChange={setViewMode} storageKey="empresas" />
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Carregando empresas...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs shadow-xs">
          Nenhuma empresa encontrada.
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <Card key={c.id} className="shadow-xs hover:border-blue-300 transition-colors">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-blue-50 text-blue-700 border-blue-200"
                    >
                      {c.group_name || 'EMPRESA'}
                    </Badge>
                    <CardTitle className="text-sm font-bold text-slate-900 mt-2">
                      {c.name}
                    </CardTitle>
                  </div>
                  {c.has_pendencies ? (
                    <Badge variant="destructive" className="text-[10px]">
                      Pendência
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200"
                    >
                      Regular
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-2 text-xs">
                <p className="text-slate-500 font-mono">CNPJ: {c.cnpj || 'Sob consulta'}</p>
                {c.capital ? (
                  <p className="text-slate-700">
                    Capital Social: <strong>R$ {c.capital.toLocaleString('pt-BR')}</strong>
                  </p>
                ) : null}
                {c.pendency_details && (
                  <div className="p-2 bg-amber-50 rounded text-amber-800 text-[11px] border border-amber-200">
                    {c.pendency_details}
                  </div>
                )}
                {c.notes && <p className="text-[11px] text-slate-400 italic">{c.notes}</p>}

                {/* Ações de Edição e Exclusão no Card */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1">
                  {canEdit ? (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(c)}
                        className="h-7 px-2 text-[#1E2749] hover:text-blue-800 text-xs"
                        title="Editar Empresa"
                      >
                        <Edit className="w-3.5 h-3.5 mr-1" /> Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteTarget(c)}
                        className="h-7 px-2 text-red-600 hover:text-red-800 text-xs"
                        title="Excluir Empresa"
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
                  <th className="py-3 px-4 whitespace-nowrap">Razão Social</th>
                  <th className="py-3 px-4 whitespace-nowrap">Nome Fantasia</th>
                  <th className="py-3 px-4 whitespace-nowrap">CNPJ</th>
                  <th className="py-3 px-4 whitespace-nowrap">Grupo / Holding</th>
                  <th className="py-3 px-4 whitespace-nowrap">Capital</th>
                  <th className="py-3 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {c.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {c.trade_name || '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {c.cnpj || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {c.group_name || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                      {c.capital ? `R$ ${c.capital.toLocaleString('pt-BR')}` : '—'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {c.has_pendencies ? (
                        <Badge variant="destructive" className="text-[10px]">
                          Pendência
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200"
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
                            onClick={() => openEdit(c)}
                            className="h-7 px-2 text-[#1E2749] hover:text-blue-800"
                          >
                            <Edit className="w-3.5 h-3.5 mr-1" /> Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteTarget(c)}
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
            <DialogTitle className="text-base text-[#1E2749]">
              {editingCompany ? 'Editar Empresa' : 'Cadastrar Empresa'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Preencha os dados societários e cadastrais da empresa do grupo.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Razão Social *</label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: EMPRESA HOLDING LTDA"
                className="text-xs h-9"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Nome Fantasia</label>
              <Input
                value={tradeName}
                onChange={(e) => setTradeName(e.target.value)}
                placeholder="Ex: HOLDING"
                className="text-xs h-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">CNPJ</label>
                <Input
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  placeholder="00.000.000/0000-00"
                  className="text-xs h-9 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Grupo / Holding</label>
                <Input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Ex: GRUPO VL"
                  className="text-xs h-9"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Capital Social (R$)</label>
              <Input
                type="number"
                value={capital}
                onChange={(e) => setCapital(Number(e.target.value))}
                className="text-xs h-9"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Observações</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anotações gerais..."
                className="text-xs h-9"
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
                className="bg-[#1E2749] hover:bg-[#151D38] text-white text-xs"
              >
                {saving ? 'Gravando...' : 'Salvar Empresa'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmação de Exclusão */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Empresa?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja excluir a empresa <strong>{deleteTarget?.name}</strong>{' '}
              (CNPJ: {deleteTarget?.cnpj || 'não informado'})? Esta ação será registrada na
              auditoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir Definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
