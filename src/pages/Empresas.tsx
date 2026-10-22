import React, { useState, useEffect } from 'react'
import { Building2, Plus, Search, CheckCircle2, AlertTriangle, FileText } from 'lucide-react'
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
import { companiesService } from '@/services/api'
import type { Company } from '@/types'

export default function Empresas() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modal Nova Empresa
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [tradeName, setTradeName] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [groupName, setGroupName] = useState('')
  const [capital, setCapital] = useState(0)
  const [saving, setSaving] = useState(false)

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await companiesService.create({
        name,
        trade_name: tradeName || name,
        cnpj,
        group_name: groupName,
        capital: Number(capital),
        status: 'Ativa',
      })
      setModalOpen(false)
      setName('')
      setCnpj('')
      loadData()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
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
        <Button
          onClick={() => setModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-xs font-semibold"
        >
          <Plus className="w-4 h-4 mr-1" /> Nova Empresa
        </Button>
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
      </div>

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
                  <CardTitle className="text-sm font-bold text-slate-900 mt-2">{c.name}</CardTitle>
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
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base text-slate-900">Cadastrar Empresa</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Razão Social *</label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xs h-9"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Nome Fantasia</label>
              <Input
                value={tradeName}
                onChange={(e) => setTradeName(e.target.value)}
                className="text-xs h-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">CNPJ</label>
                <Input
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  className="text-xs h-9 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Grupo / Holding</label>
                <Input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
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
                {saving ? 'Gravando...' : 'Salvar Empresa'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
