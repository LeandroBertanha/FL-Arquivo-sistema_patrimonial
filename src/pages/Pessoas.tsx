import React, { useState, useEffect } from 'react'
import { Users, Plus, Search, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { peopleService } from '@/services/api'
import type { Person } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { ViewModeToggle, getStoredViewMode, type ViewMode } from '@/components/ViewModeToggle'

export default function Pessoas() {
  const { canEdit } = useAuth()
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [viewMode, setViewMode] = useState<ViewMode>(() => getStoredViewMode('pessoas', 'cards'))

  // Modal Criar / Editar Pessoa
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPerson, setEditingPerson] = useState<Person | null>(null)
  const [name, setName] = useState('')
  const [cpf, setCpf] = useState('')
  const [groupName, setGroupName] = useState('Família / Sócios')
  const [contact, setContact] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  // Modal Exclusão
  const [deleteTarget, setDeleteTarget] = useState<Person | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const list = await peopleService.getAll()
      setPeople(list)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const openNew = () => {
    setEditingPerson(null)
    setName('')
    setCpf('')
    setGroupName('Família / Sócios')
    setContact('')
    setAddress('')
    setNotes('')
    setModalOpen(true)
  }

  const openEdit = (p: Person) => {
    setEditingPerson(p)
    setName(p.name || '')
    setCpf(p.cpf || '')
    setGroupName(p.group_name || 'Família / Sócios')
    setContact(p.contact || '')
    setAddress(p.address || '')
    setNotes(p.notes || '')
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload: Partial<Person> = {
        name,
        cpf,
        group_name: groupName,
        contact,
        address,
        notes,
      }

      if (editingPerson) {
        await peopleService.update(editingPerson.id, payload)
      } else {
        await peopleService.create(payload)
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
      await peopleService.delete(deleteTarget.id)
      setDeleteTarget(null)
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const filtered = people.filter((p) => {
    const q = search.toLowerCase()
    return (
      !q ||
      p.name?.toLowerCase().includes(q) ||
      p.cpf?.toLowerCase().includes(q) ||
      p.group_name?.toLowerCase().includes(q) ||
      p.notes?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Pessoas Físicas e Titulares
          </h1>
          <p className="text-sm text-slate-500">
            Sócios, herdeiros, procuradores e partes relacionadas com pastas no acervo
          </p>
        </div>
        {canEdit && (
          <Button
            onClick={openNew}
            className="bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1" /> Nova Pessoa
          </Button>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Buscar por nome, CPF, grupo ou anotações..."
            className="pl-9 text-xs h-9 bg-slate-50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="text-xs text-slate-400 font-medium">{filtered.length} pessoa(s)</span>
        <ViewModeToggle mode={viewMode} onChange={setViewMode} storageKey="pessoas" />
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Carregando pessoas...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs shadow-xs">
          Nenhuma pessoa física cadastrada.
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <Card key={p.id} className="shadow-xs hover:border-blue-300 transition-colors">
              <CardHeader className="p-4 pb-2">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                  {p.group_name || 'Parte Relacionada'}
                </span>
                <CardTitle className="text-sm font-bold text-slate-900 mt-1">{p.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-1 text-xs text-slate-600">
                <p className="font-mono">CPF: {p.cpf || 'Sob sigilo / Não informado'}</p>
                {p.notes && <p className="text-slate-400 italic text-[11px]">{p.notes}</p>}

                {/* Ações de Edição e Exclusão no Card */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1">
                  {canEdit ? (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(p)}
                        className="h-7 px-2 text-[#1E2749] hover:text-blue-800 text-xs"
                        title="Editar Pessoa"
                      >
                        <Edit className="w-3.5 h-3.5 mr-1" /> Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteTarget(p)}
                        className="h-7 px-2 text-red-600 hover:text-red-800 text-xs"
                        title="Excluir Pessoa"
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
            <table className="w-full min-w-[650px] text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 whitespace-nowrap">Nome Completo</th>
                  <th className="py-3 px-4 whitespace-nowrap">CPF</th>
                  <th className="py-3 px-4 whitespace-nowrap">Grupo / Vínculo</th>
                  <th className="py-3 px-4 min-w-[200px]">Observações</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {p.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {p.cpf || '—'}
                    </td>
                    <td className="py-3 px-4 text-[#1E2749] font-medium whitespace-nowrap">
                      {p.group_name || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{p.notes || '—'}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {canEdit ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(p)}
                            className="h-7 px-2 text-[#1E2749] hover:text-blue-800"
                          >
                            <Edit className="w-3.5 h-3.5 mr-1" /> Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteTarget(p)}
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
              {editingPerson ? 'Editar Pessoa Física' : 'Cadastrar Pessoa Física'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Preencha os dados do titular, sócio ou parte relacionada com o acervo.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Nome Completo *</label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: NOME DO TITULAR"
                className="text-xs h-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">CPF</label>
                <Input
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  placeholder="000.000.000-00"
                  className="text-xs h-9 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Grupo / Vínculo</label>
                <Input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Ex: Família / Sócios"
                  className="text-xs h-9"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Contato / Telefone</label>
              <Input
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Telefone ou e-mail..."
                className="text-xs h-9"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Observações</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações adicionais..."
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
                className="bg-primary hover:bg-primary/90 text-white text-xs"
              >
                {saving ? 'Gravando...' : 'Salvar Pessoa'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmação de Exclusão */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Pessoa?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja excluir o cadastro de <strong>{deleteTarget?.name}</strong>{' '}
              (CPF: {deleteTarget?.cpf || 'não informado'})? Esta ação será registrada na auditoria.
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
