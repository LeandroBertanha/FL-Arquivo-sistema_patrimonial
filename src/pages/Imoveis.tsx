import React, { useState, useEffect } from 'react'
import { Home, Plus, Search, Building2, MapPin } from 'lucide-react'
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
import { propertiesService, logAudit } from '@/services/api'
import type { Property } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { ViewModeToggle, getStoredViewMode, type ViewMode } from '@/components/ViewModeToggle'

export default function Imoveis() {
  const { canEdit } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [viewMode, setViewMode] = useState<ViewMode>(() => getStoredViewMode('imoveis', 'cards'))

  // Modal Novo Imóvel
  const [modalOpen, setModalOpen] = useState(false)
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [ownerName, setOwnerName] = useState('CAPANNONE')
  const [type, setType] = useState<Property['type']>('Conjunto Comercial')
  const [generatesRevenue, setGeneratesRevenue] = useState(false)
  const [revenueValue, setRevenueValue] = useState(0)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const list = await propertiesService.getAll()
      setProperties(list)
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
      const created = await propertiesService.create({
        description,
        address,
        owner_name: ownerName,
        type,
        generates_revenue: generatesRevenue,
        revenue_value: Number(revenueValue),
      })
      await logAudit(
        'CRIACAO_IMOVEL',
        'properties',
        created.id,
        `Imóvel cadastrado: ${description} (${address})`,
      )
      setModalOpen(false)
      setDescription('')
      setAddress('')
      loadData()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const filtered = properties.filter((p) => {
    const q = search.toLowerCase()
    return (
      !q ||
      p.description?.toLowerCase().includes(q) ||
      p.address?.toLowerCase().includes(q) ||
      p.owner_name?.toLowerCase().includes(q) ||
      p.registry_number?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Home className="w-6 h-6 text-emerald-600" />
            Imóveis e Patrimônio Imobiliário
          </h1>
          <p className="text-sm text-slate-500">
            Escrituras, contratos de locação e pastas físicas custodiadas (Caixa N8)
          </p>
        </div>
        {canEdit && (
          <Button
            onClick={() => setModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold"
          >
            <Plus className="w-4 h-4 mr-1" /> Novo Imóvel
          </Button>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Buscar por descrição, endereço, proprietário ou matrícula..."
            className="pl-9 text-xs h-9 bg-slate-50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="text-xs text-slate-400 font-medium">{filtered.length} imóvel(is)</span>
        <ViewModeToggle mode={viewMode} onChange={setViewMode} storageKey="imoveis" />
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Carregando imóveis...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs shadow-xs">
          Nenhum imóvel encontrado.
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <Card key={p.id} className="shadow-xs hover:border-emerald-300 transition-colors">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between">
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200"
                  >
                    {p.type}
                  </Badge>
                  {p.generates_revenue && (
                    <Badge className="bg-emerald-600 text-white text-[10px]">
                      Receita: R$ {p.revenue_value?.toLocaleString('pt-BR')}/mês
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 mt-2">
                  {p.description}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-1.5 text-xs text-slate-600">
                <p className="flex items-center gap-1.5 text-slate-500">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">{p.address || 'Endereço sob consulta'}</span>
                </p>
                <div className="flex justify-between border-t border-slate-100 pt-2 text-slate-500">
                  <span>
                    Proprietário: <strong>{p.owner_name || 'CAPANNONE'}</strong>
                  </span>
                  <span className="font-mono text-blue-700 font-bold">
                    {p.registry_number || 'CX N8'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Descrição</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Endereço</th>
                <th className="py-3 px-4">Proprietário / Titular</th>
                <th className="py-3 px-4">Matrícula / Registro</th>
                <th className="py-3 px-4">Receita / Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-semibold text-slate-900">{p.description}</td>
                  <td className="py-3 px-4 text-slate-600">{p.type}</td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{p.address || '—'}</td>
                  <td className="py-3 px-4 text-slate-700">{p.owner_name || '—'}</td>
                  <td className="py-3 px-4 font-mono font-bold text-blue-700">
                    {p.registry_number || 'CX N8'}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {p.generates_revenue ? (
                      <Badge className="bg-emerald-600 text-white text-[10px]">
                        R$ {p.revenue_value?.toLocaleString('pt-BR')}/mês
                      </Badge>
                    ) : (
                      <span className="text-slate-400">Regular</span>
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
            <DialogTitle className="text-base text-slate-900">Cadastrar Imóvel</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Descrição do Imóvel *</label>
              <Input
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Galpão Industrial Vila Leopoldina"
                className="text-xs h-9"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Endereço Completo</label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="text-xs h-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Tipo</label>
                <select
                  className="w-full h-9 border border-slate-200 rounded-md px-3 bg-white text-xs"
                  value={type}
                  onChange={(e: any) => setType(e.target.value)}
                >
                  <option value="Conjunto Comercial">Conjunto Comercial</option>
                  <option value="Apartamento">Apartamento</option>
                  <option value="Casa">Casa</option>
                  <option value="Lote/Terreno">Lote/Terreno</option>
                  <option value="Vaga de Garagem">Vaga de Garagem</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Proprietário</label>
                <Input
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Receita Mensal Estimada (R$)</label>
              <Input
                type="number"
                value={revenueValue}
                onChange={(e) => {
                  setRevenueValue(Number(e.target.value))
                  setGeneratesRevenue(Number(e.target.value) > 0)
                }}
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
                className="bg-emerald-600 hover:bg-emerald-700 text-xs"
              >
                {saving ? 'Gravando...' : 'Salvar Imóvel'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
