import React, { useState, useEffect } from 'react'
import { Building2, Plus, Search, TableIcon, LayoutGrid, Pencil, Trash2 } from 'lucide-react'
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
import { companiesService, logAudit } from '@/services/api'
import type { Company } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { ViewModeToggle, getStoredViewMode, type ViewMode } from '@/components/ViewModeToggle'

export default function Empresas() {
  const { canEdit } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [viewMode, setViewMode] = useState<ViewMode>(() => getStoredViewMode('empresas', 'cards'))

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
      const created = await companiesService.create({
        name,
        trade_name: tradeName || name,
        cnpj,
        group_name: groupName,
        capital: Number(capital),
        status: 'Ativa',
      })
      await logAudit(
        'CRIACAO_EMPRESA',
        'companies',
        created.id,
        `Empresa cadastrada: ${name} (CNPJ ${cnpj || 'não informado'})`,
      )
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
        {canEdit && (
          <Button
            onClick={() => setModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-xs font-semibold"
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
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Razão Social</th>
                <th className="py-3 px-4">Nome Fantasia</th>
                <th className="py-3 px-4">CNPJ</th>
                <th className="py-3 px-4">Grupo / Holding</th>
                <th className="py-3 px-4">Capital</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-semibold text-slate-900">{c.name}</td>
                  <td className="py-3 px-4 text-slate-600">{c.trade_name || '—'}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{c.cnpj || '—'}</td>
                  <td className="py-3 px-4 text-slate-600">{c.group_name || '—'}</td>
                  <td className="py-3 px-4 text-slate-700">
                    {c.capital ? `R$ ${c.capital.toLocaleString('pt-BR')}` : '—'}
                  </td>
                  <td className="py-3 px-4">
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
