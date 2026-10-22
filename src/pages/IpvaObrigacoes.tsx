import React, { useState, useEffect } from 'react'
import { Receipt, Plus, Search, AlertCircle, Edit, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { obligationsService, vehiclesService } from '@/services/api'
import type { VehicleObligation, Vehicle } from '@/types'

export default function IpvaObrigacoes() {
  const [obligations, setObligations] = useState<VehicleObligation[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modal Editar Obrigação
  const [editModal, setEditModal] = useState(false)
  const [currentOb, setCurrentOb] = useState<VehicleObligation | null>(null)
  const [licensingVal, setLicensingVal] = useState(0)
  const [finesVal, setFinesVal] = useState(0)
  const [ipvaVal, setIpvaVal] = useState(0)
  const [status, setStatus] = useState<VehicleObligation['status']>('Pendente')
  const [isActiveDebt, setIsActiveDebt] = useState(false)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [oList, vList] = await Promise.all([
        obligationsService.getAll(),
        vehiclesService.getAll(),
      ])
      setObligations(oList)
      setVehicles(vList)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const openEdit = (ob: VehicleObligation) => {
    setCurrentOb(ob)
    setLicensingVal(ob.licensing_value || 0)
    setFinesVal(ob.fines_value || 0)
    setIpvaVal(ob.ipva_value || 0)
    setStatus(ob.status || 'Pendente')
    setIsActiveDebt(!!ob.is_active_debt)
    setNotes(ob.notes || '')
    setEditModal(true)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentOb) return
    setSaving(true)
    try {
      await obligationsService.update(currentOb.id, {
        licensing_value: Number(licensingVal),
        fines_value: Number(finesVal),
        ipva_value: Number(ipvaVal),
        status,
        is_active_debt: isActiveDebt,
        notes,
      })
      setEditModal(false)
      loadData()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const filtered = obligations.filter((o) => {
    const q = search.toLowerCase()
    return (
      !q ||
      o.vehicle_name?.toLowerCase().includes(q) ||
      o.year.toString().includes(q) ||
      o.status?.toLowerCase().includes(q) ||
      o.notes?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-rose-600" />
            IPVA, Licenciamento e Multas Veiculares
          </h1>
          <p className="text-sm text-slate-500">
            Histórico financeiro anual por exercício, dívida ativa e taxas (Guia IPVA do Excel)
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Buscar por veículo, exercício (2024, 2025, 2026) ou status..."
            className="pl-9 text-xs h-9 bg-slate-50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="text-xs text-slate-400 font-medium">{filtered.length} registro(s)</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Veículo</th>
              <th className="py-3 px-4">Exercício</th>
              <th className="py-3 px-4">Licenciamento</th>
              <th className="py-3 px-4">Multas</th>
              <th className="py-3 px-4">IPVA</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Observações</th>
              <th className="py-3 px-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((ob) => (
              <tr key={ob.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-4 font-semibold text-slate-900">
                  {ob.vehicle_name || 'Veículo'}
                </td>
                <td className="py-3 px-4 font-mono font-bold text-slate-700">{ob.year}</td>
                <td className="py-3 px-4 text-slate-700">
                  {ob.licensing_value ? `R$ ${ob.licensing_value.toFixed(2)}` : '—'}
                </td>
                <td className="py-3 px-4 text-slate-700">
                  {ob.fines_value ? `R$ ${ob.fines_value.toFixed(2)}` : '—'}
                </td>
                <td className="py-3 px-4 font-bold text-slate-900">
                  {ob.ipva_value ? `R$ ${ob.ipva_value.toFixed(2)}` : 'Sem valor'}
                </td>
                <td className="py-3 px-4">
                  {ob.is_active_debt ? (
                    <Badge variant="destructive" className="text-[10px]">
                      DÍVIDA ATIVA
                    </Badge>
                  ) : ob.status === 'Pago' ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200"
                    >
                      Pago
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-amber-50 text-amber-800 border-amber-200"
                    >
                      Pendente
                    </Badge>
                  )}
                </td>
                <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{ob.notes || '—'}</td>
                <td className="py-3 px-4 text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEdit(ob)}
                    className="h-7 px-2 text-xs text-blue-600 hover:text-blue-800"
                  >
                    <Edit className="w-3.5 h-3.5 mr-1" /> Editar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={editModal} onOpenChange={setEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base text-slate-900">
              Editar Obrigação {currentOb?.vehicle_name} ({currentOb?.year})
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-3 py-2 text-xs">
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Licenciamento (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={licensingVal}
                  onChange={(e) => setLicensingVal(Number(e.target.value))}
                  className="text-xs h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Multas (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={finesVal}
                  onChange={(e) => setFinesVal(Number(e.target.value))}
                  className="text-xs h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">IPVA (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={ipvaVal}
                  onChange={(e) => setIpvaVal(Number(e.target.value))}
                  className="text-xs h-9"
                />
              </div>
            </div>
            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-red-600">
                <input
                  type="checkbox"
                  checked={isActiveDebt}
                  onChange={(e) => setIsActiveDebt(e.target.checked)}
                />
                <span>Inscrito em Dívida Ativa</span>
              </label>
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
                onClick={() => setEditModal(false)}
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
                {saving ? 'Gravando...' : 'Salvar Exercício'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
