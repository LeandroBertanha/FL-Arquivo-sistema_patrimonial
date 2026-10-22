import React, { useState, useEffect } from 'react'
import { Users, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { peopleService, logAudit } from '@/services/api'
import type { Person } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { ViewModeToggle, getStoredViewMode, type ViewMode } from '@/components/ViewModeToggle'

export default function Pessoas() {
  const { canEdit } = useAuth()
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [viewMode, setViewMode] = useState<ViewMode>(() => getStoredViewMode('pessoas', 'cards'))

  // Modal Nova Pessoa
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [cpf, setCpf] = useState('')
  const [groupName, setGroupName] = useState('Família / Sócios')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const created = await peopleService.create({
        name,
        cpf,
        group_name: groupName,
        notes,
      })
      await logAudit(
        'CRIACAO_PESSOA',
        'people',
        created.id,
        `Pessoa física cadastrada: ${name} (CPF ${cpf || 'não informado'})`,
      )
      setModalOpen(false)
      setName('')
      setCpf('')
      setNotes('')
      loadData()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
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
            onClick={() => setModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-xs font-semibold"
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {p.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {p.cpf || '—'}
                    </td>
                    <td className="py-3 px-4 text-blue-700 font-medium whitespace-nowrap">
                      {p.group_name || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{p.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base text-slate-900">Cadastrar Pessoa Física</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Nome Completo *</label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xs h-9"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">CPF</label>
              <Input
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                className="text-xs h-9 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Grupo / Vínculo</label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="text-xs h-9"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Observações</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
                className="bg-blue-600 hover:bg-blue-700 text-xs"
              >
                {saving ? 'Gravando...' : 'Salvar Pessoa'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
