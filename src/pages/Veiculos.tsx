import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Car, Plus, Search, AlertTriangle, CheckCircle2, Receipt, FileText } from 'lucide-react'
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
import { vehiclesService, obligationsService } from '@/services/api'
import type { Vehicle, VehicleObligation } from '@/types'

export default function Veiculos() {
  const navigate = useNavigate()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [obligations, setObligations] = useState<VehicleObligation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modal Novo Veículo
  const [modalOpen, setModalOpen] = useState(false)
  const [model, setModel] = useState('')
  const [brand, setBrand] = useState('')
  const [yearModel, setYearModel] = useState('')
  const [plate, setPlate] = useState('')
  const [renavam, setRenavam] = useState('')
  const [chassi, setChassi] = useState('')
  const [folderCode, setFolderCode] = useState('')
  const [ownerName, setOwnerName] = useState('AUTO&CO')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [vList, oList] = await Promise.all([
        vehiclesService.getAll(),
        obligationsService.getAll(),
      ])
      setVehicles(vList)
      setObligations(oList)
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
      await vehiclesService.create({
        model,
        brand,
        year_model: yearModel,
        plate,
        renavam,
        chassi,
        folder_code: folderCode,
        owner_name: ownerName,
        type:
          model.toLowerCase().includes('moto') || brand.toLowerCase().includes('honda')
            ? 'Moto'
            : 'Carro',
      })
      setModalOpen(false)
      setModel('')
      setPlate('')
      loadData()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const filtered = vehicles.filter((v) => {
    const q = search.toLowerCase()
    return (
      !q ||
      v.model?.toLowerCase().includes(q) ||
      v.plate?.toLowerCase().includes(q) ||
      v.renavam?.toLowerCase().includes(q) ||
      v.chassi?.toLowerCase().includes(q) ||
      v.owner_name?.toLowerCase().includes(q) ||
      v.folder_code?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Car className="w-6 h-6 text-indigo-600" />
            Gestão de Veículos (Carros e Motos)
          </h1>
          <p className="text-sm text-slate-500">
            Controle de frota, RENAVAN textual legado, placas e pasta física vinculada (Guia CARROS)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/ipva-obrigacoes')}
            className="text-xs font-semibold border-slate-300"
          >
            <Receipt className="w-4 h-4 mr-1 text-rose-600" /> Ver IPVA e Obrigações
          </Button>
          <Button
            onClick={() => setModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-xs font-semibold"
          >
            <Plus className="w-4 h-4 mr-1" /> Novo Veículo
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Buscar por placa, modelo, RENAVAN, chassi, titular ou pasta..."
            className="pl-9 text-xs h-9 bg-slate-50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="text-xs text-slate-400 font-medium">{filtered.length} veículo(s)</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((v) => {
          const vehObs = obligations.filter((o) => o.vehicle === v.id)
          const hasActiveDebt = vehObs.some((o) => o.is_active_debt)

          return (
            <Card
              key={v.id}
              className="shadow-xs hover:border-indigo-300 transition-colors flex flex-col justify-between"
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between">
                  <span className="font-mono text-sm font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {v.plate || 'SEM PLACA'}
                  </span>
                  {hasActiveDebt ? (
                    <Badge variant="destructive" className="text-[10px]">
                      DÍVIDA ATIVA
                    </Badge>
                  ) : v.has_pendencies ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-rose-50 text-rose-700 border-rose-200"
                    >
                      Pendências
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
                <CardTitle className="text-sm font-bold text-slate-900 mt-2">{v.model}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div>
                    Ano/Modelo: <strong>{v.year_model || '—'}</strong>
                  </div>
                  <div>
                    Proprietário: <strong>{v.owner_name}</strong>
                  </div>
                  <div className="truncate font-mono">RENAVAN: {v.renavam}</div>
                  <div className="truncate font-mono">
                    Pasta: <strong className="text-blue-700">{v.folder_code || 'Avulso'}</strong>
                  </div>
                </div>

                {v.pendency_summary && (
                  <div className="p-2 bg-amber-50 rounded text-amber-900 text-[11px] border border-amber-200">
                    {v.pendency_summary}
                  </div>
                )}
                {v.notes && <p className="text-[11px] text-slate-400 italic">{v.notes}</p>}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base text-slate-900">Cadastrar Veículo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Modelo do Veículo *</label>
              <Input
                required
                placeholder="Ex: CHEVROLET CRUZE"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="text-xs h-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Marca</label>
                <Input
                  placeholder="Ex: CHEVROLET"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Ano / Modelo</label>
                <Input
                  placeholder="Ex: 2015/2015"
                  value={yearModel}
                  onChange={(e) => setYearModel(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Placa</label>
                <Input
                  placeholder="Ex: FFL-4D33"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  className="text-xs h-9 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">RENAVAN (Texto Legado)</label>
                <Input
                  placeholder="Ex: 007.025.730.78"
                  value={renavam}
                  onChange={(e) => setRenavam(e.target.value)}
                  className="text-xs h-9 font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Código da Pasta Física</label>
                <Input
                  placeholder="Ex: N01, N10..."
                  value={folderCode}
                  onChange={(e) => setFolderCode(e.target.value)}
                  className="text-xs h-9 font-mono"
                />
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
                {saving ? 'Gravando...' : 'Salvar Veículo'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
