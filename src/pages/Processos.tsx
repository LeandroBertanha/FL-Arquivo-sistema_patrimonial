import React, { useState, useEffect } from 'react'
import { Scale, Plus, Search } from 'lucide-react'
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
import { processesService } from '@/services/api'
import type { ProcessItem } from '@/types'

export default function Processos() {
  const [processes, setProcesses] = useState<ProcessItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [type, setType] = useState<ProcessItem['type']>('Trabalhista')
  const [boxCode, setBoxCode] = useState('CX N2')
  const [lawyer, setLawyer] = useState('')
  const [status, setStatus] = useState<ProcessItem['status']>('Terminado')
  const [saving, setSaving] = useState(false)

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await processesService.create({
        title,
        type,
        box_code: boxCode,
        lawyer,
        status,
      })
      setModalOpen(false)
      setTitle('')
      loadData()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const filtered = processes.filter((p) => {
    const q = search.toLowerCase()
    return (
      !q ||
      p.title?.toLowerCase().includes(q) ||
      p.box_code?.toLowerCase().includes(q) ||
      p.lawyer?.toLowerCase().includes(q)
    )
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
            Processos ativos e terminados vinculados a caixas físicas (CX N2, CX N4, CX N5/01)
          </p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-xs font-semibold"
        >
          <Plus className="w-4 h-4 mr-1" /> Novo Processo
        </Button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Buscar por nome do processo, advogado ou caixa..."
            className="pl-9 text-xs h-9 bg-slate-50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="text-xs text-slate-400 font-medium">{filtered.length} processo(s)</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((pr) => (
          <Card key={pr.id} className="shadow-xs hover:border-blue-300 transition-colors">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-start justify-between">
                <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {pr.box_code || 'Caixa Geral'}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    pr.status === 'Ativo'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {pr.status}
                </Badge>
              </div>
              <CardTitle className="text-sm font-bold text-slate-900 mt-2">{pr.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-1.5 text-xs text-slate-600">
              <p>
                Tipo: <strong>{pr.type}</strong>
              </p>
              {pr.lawyer && (
                <p>
                  Advogado: <strong>{pr.lawyer}</strong>
                </p>
              )}
              {pr.notes && <p className="text-[11px] text-slate-400 italic">{pr.notes}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base text-slate-900">Cadastrar Processo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Título / Partes Envolvidas *</label>
              <Input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xs h-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Caixa Vinculada</label>
                <Input
                  value={boxCode}
                  onChange={(e) => setBoxCode(e.target.value)}
                  className="text-xs h-9 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Advogado Responsável</label>
                <Input
                  value={lawyer}
                  onChange={(e) => setLawyer(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
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
    </div>
  )
}
