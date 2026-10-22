import React, { useState, useEffect } from 'react'
import { Users, Plus, Search, Folder } from 'lucide-react'
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
} from '@/components/ui/dialog'
import { peopleService, foldersService } from '@/services/api'
import type { Person, Folder as FolderType } from '@/types'

export default function Pessoas() {
  const [people, setPeople] = useState<Person[]>([])
  const [folders, setFolders] = useState<FolderType[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [cpf, setCpf] = useState('')
  const [groupName, setGroupName] = useState('PESSOAIS')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [pList, fList] = await Promise.all([
        peopleService.getAll(),
        foldersService.getAll("group_name = 'PESSOAIS' || person != ''", 'code_legacy', 1, 300),
      ])
      setPeople(pList)
      setFolders(fList.items || [])
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
      await peopleService.create({ name, cpf, group_name: groupName })
      setModalOpen(false)
      setName('')
      loadData()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const filtered = people.filter((p) => {
    const q = search.toLowerCase()
    return !q || p.name?.toLowerCase().includes(q) || p.cpf?.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Pessoas Físicas e Documentos Pessoais
          </h1>
          <p className="text-sm text-slate-500">
            Controle de pastas familiares e pessoais (Nádia, Odair, Filippo, Giuliano, Felipe)
          </p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-xs font-semibold"
        >
          <Plus className="w-4 h-4 mr-1" /> Nova Pessoa
        </Button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Buscar por nome da pessoa..."
            className="pl-9 text-xs h-9 bg-slate-50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="text-xs text-slate-400 font-medium">{filtered.length} pessoa(s)</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => {
          const personFolders = folders.filter(
            (f) => f.title?.toUpperCase().includes(p.name.toUpperCase()) || f.person === p.id,
          )
          return (
            <Card key={p.id} className="shadow-xs hover:border-blue-300 transition-colors">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-blue-50 text-blue-700 border-blue-200"
                  >
                    PESSOAL
                  </Badge>
                  <span className="text-xs text-slate-400 font-semibold">
                    {personFolders.length} pasta(s)
                  </span>
                </div>
                <CardTitle className="text-base font-bold text-slate-900 mt-2">{p.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-2 text-xs">
                <p className="text-slate-500">Documentação vinculada:</p>
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {personFolders.slice(0, 5).map((f) => (
                    <div
                      key={f.id}
                      className="p-1.5 bg-slate-50 rounded text-[11px] flex justify-between gap-2 border border-slate-100"
                    >
                      <span className="font-semibold text-slate-700 truncate">{f.title}</span>
                      <span className="font-mono text-blue-600 shrink-0">{f.code_legacy}</span>
                    </div>
                  ))}
                  {personFolders.length > 5 && (
                    <span className="text-[10px] text-slate-400 block text-center">
                      + {personFolders.length - 5} outras pastas no acervo
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base text-slate-900">Cadastrar Pessoa</DialogTitle>
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
