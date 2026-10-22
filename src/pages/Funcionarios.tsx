import React, { useState, useEffect } from 'react'
import { UserCheck, Plus, Search, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { employeesService } from '@/services/api'
import type { Employee } from '@/types'

export default function Funcionarios() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [situation, setSituation] = useState<'Atual' | 'Ex-funcionário'>('Ex-funcionário')
  const [boxCode, setBoxCode] = useState('CX N7')
  const [saving, setSaving] = useState(false)

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await employeesService.create({ name, situation, box_code: boxCode })
      setModalOpen(false)
      setName('')
      loadData()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase()
    return !q || e.name?.toLowerCase().includes(q) || e.box_code?.toLowerCase().includes(q)
  })

  const exFuncionarios = filtered.filter((e) => e.situation === 'Ex-funcionário')
  const atuais = filtered.filter((e) => e.situation === 'Atual')

  const renderGrid = (list: Employee[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
      {list.map((emp) => (
        <Card key={emp.id} className="shadow-xs hover:border-blue-300 transition-colors">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-start justify-between">
              <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {emp.box_code || 'Caixa'}
              </span>
              {emp.needs_review && (
                <Badge
                  variant="outline"
                  className="text-[10px] bg-amber-100 text-amber-800 border-amber-300"
                >
                  Revisão
                </Badge>
              )}
            </div>
            <CardTitle className="text-sm font-bold text-slate-900 mt-2">{emp.name}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 space-y-1 text-xs text-slate-500">
            <p>
              Situação: <strong className="text-slate-700">{emp.situation}</strong>
            </p>
            {emp.notes && <p className="text-[11px] text-slate-400 italic">{emp.notes}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-blue-600" />
            Funcionários e Ex-Funcionários
          </h1>
          <p className="text-sm text-slate-500">
            Controle de prontuários em caixas físicas (CX N7 e CX N10)
          </p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-xs font-semibold"
        >
          <Plus className="w-4 h-4 mr-1" /> Novo Funcionário
        </Button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Buscar por nome do funcionário ou caixa..."
            className="pl-9 text-xs h-9 bg-slate-50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="text-xs text-slate-400 font-medium">{filtered.length} funcionário(s)</span>
      </div>

      <Tabs defaultValue="ex" className="w-full">
        <TabsList className="bg-white border border-slate-200 p-1 rounded-xl shadow-xs">
          <TabsTrigger value="ex" className="text-xs font-semibold">
            Ex-Funcionários ({exFuncionarios.length})
          </TabsTrigger>
          <TabsTrigger value="atuais" className="text-xs font-semibold">
            Funcionários Atuais ({atuais.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="ex">{renderGrid(exFuncionarios)}</TabsContent>
        <TabsContent value="atuais">{renderGrid(atuais)}</TabsContent>
      </Tabs>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base text-slate-900">Cadastrar Prontuário</DialogTitle>
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Situação</label>
                <select
                  className="w-full h-9 border border-slate-200 rounded-md px-3 bg-white text-xs"
                  value={situation}
                  onChange={(e: any) => setSituation(e.target.value)}
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
                {saving ? 'Gravando...' : 'Salvar Prontuário'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
