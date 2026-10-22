import React, { useState, useEffect } from 'react'
import { Home, Plus, Search, MapPin, DollarSign, AlertCircle } from 'lucide-react'
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
import { propertiesService } from '@/services/api'
import type { Property } from '@/types'

export default function Imoveis() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [description, setDescription] = useState('')
  const [type, setType] = useState<Property['type']>('Apartamento')
  const [address, setAddress] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [iptuAnnual, setIptuAnnual] = useState(0)
  const [generatesRevenue, setGeneratesRevenue] = useState(false)
  const [revenueValue, setRevenueValue] = useState(0)
  const [hasDebt, setHasDebt] = useState(false)
  const [debtDetails, setDebtDetails] = useState('')
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
      await propertiesService.create({
        description,
        type,
        address,
        owner_name: ownerName,
        iptu_annual: Number(iptuAnnual),
        generates_revenue: generatesRevenue,
        revenue_value: Number(revenueValue),
        has_debt: hasDebt,
        debt_details: debtDetails,
        status: 'Ativo',
      })
      setModalOpen(false)
      setDescription('')
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
      p.owner_name?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Home className="w-6 h-6 text-emerald-600" />
            Gestão de Imóveis e Escrituras
          </h1>
          <p className="text-sm text-slate-500">
            Escrituras, contratos de locação, IPTU e condomínio (CX N8 e CX N8/2)
          </p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-xs font-semibold"
        >
          <Plus className="w-4 h-4 mr-1" /> Novo Imóvel
        </Button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Buscar imóvel por descrição, endereço ou titular..."
            className="pl-9 text-xs h-9 bg-slate-50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="text-xs text-slate-400 font-medium">{filtered.length} imóvel(is)</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <Card
            key={p.id}
            className="shadow-xs hover:border-emerald-300 transition-colors flex flex-col justify-between"
          >
            <CardHeader className="p-4 pb-2">
              <div className="flex items-start justify-between">
                <Badge
                  variant="outline"
                  className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200"
                >
                  {p.type}
                </Badge>
                {p.status === 'Vendido' ? (
                  <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-600">
                    Vendido (CX N8/2)
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] bg-emerald-100 text-emerald-800">
                    Ativo
                  </Badge>
                )}
              </div>
              <CardTitle className="text-sm font-bold text-slate-900 mt-2">
                {p.description}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-2.5 text-xs">
              <div className="flex items-center gap-1.5 text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{p.address || 'Endereço sob consulta'}</span>
              </div>
              <p className="text-slate-600">
                Proprietário: <strong>{p.owner_name || 'Grupo VL'}</strong>
              </p>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {p.generates_revenue && (
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-amber-50 text-amber-800 border-amber-300 font-bold"
                  >
                    GERA RECEITA (R$ {p.revenue_value?.toLocaleString('pt-BR')}/mês)
                  </Badge>
                )}
                {p.has_debt && (
                  <Badge variant="destructive" className="text-[10px]">
                    {p.debt_details || 'DÍVIDA / IPTU PENDENTE'}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base text-slate-900">Cadastrar Imóvel</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Descrição / Título do Imóvel *</label>
              <Input
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
                <label className="font-semibold text-slate-700">Proprietário</label>
                <Input
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">IPTU Anual (R$)</label>
                <Input
                  type="number"
                  value={iptuAnnual}
                  onChange={(e) => setIptuAnnual(Number(e.target.value))}
                  className="text-xs h-9"
                />
              </div>
            </div>
            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={generatesRevenue}
                  onChange={(e) => setGeneratesRevenue(e.target.checked)}
                />
                <span>Gera Receita de Aluguel</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-red-700">
                <input
                  type="checkbox"
                  checked={hasDebt}
                  onChange={(e) => setHasDebt(e.target.checked)}
                />
                <span>Possui Pendência / Dívida</span>
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
                {saving ? 'Gravando...' : 'Salvar Imóvel'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
