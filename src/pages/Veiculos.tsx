import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Car,
  Receipt,
  Plus,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  FileText,
  DollarSign,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { vehiclesService, obligationsService, logAudit } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'
import type { Vehicle, VehicleObligation } from '@/types'
import { ViewModeToggle, getStoredViewMode, type ViewMode } from '@/components/ViewModeToggle'

export default function Veiculos() {
  const { canEdit } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('aba') === 'ipva' ? 'ipva' : 'veiculos'
  const [activeTab, setActiveTab] = useState<'veiculos' | 'ipva'>(initialTab)

  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [obligations, setObligations] = useState<VehicleObligation[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [searchVehicles, setSearchVehicles] = useState('')
  const [searchObligations, setSearchObligations] = useState('')
  const [statusFilterObligations, setStatusFilterObligations] = useState('todos')

  // Modos de visualização
  const [vehiclesViewMode, setVehiclesViewMode] = useState<ViewMode>(() =>
    getStoredViewMode('veiculos', 'cards'),
  )
  const [obligationsViewMode, setObligationsViewMode] = useState<ViewMode>(() =>
    getStoredViewMode('ipva_obrigacoes', 'table'),
  )

  // Modal Veículo (Criar/Editar)
  const [vehModalOpen, setVehModalOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [vehModel, setVehModel] = useState('')
  const [vehBrand, setVehBrand] = useState('')
  const [vehYearModel, setVehYearModel] = useState('')
  const [vehPlate, setVehPlate] = useState('')
  const [vehRenavam, setVehRenavam] = useState('')
  const [vehChassi, setVehChassi] = useState('')
  const [vehFolderCode, setVehFolderCode] = useState('')
  const [vehOwnerName, setVehOwnerName] = useState('AUTO&CO')
  const [vehType, setVehType] = useState<Vehicle['type']>('Carro')
  const [vehNotes, setVehNotes] = useState('')
  const [savingVeh, setSavingVeh] = useState(false)

  // Delete Veículo
  const [deleteVehTarget, setDeleteVehTarget] = useState<Vehicle | null>(null)

  // Modal Obrigação (Criar/Editar)
  const [obModalOpen, setObModalOpen] = useState(false)
  const [editingObligation, setEditingObligation] = useState<VehicleObligation | null>(null)
  const [obVehicleId, setObVehicleId] = useState('')
  const [obVehicleName, setObVehicleName] = useState('')
  const [obYear, setObYear] = useState<number>(new Date().getFullYear())
  const [obLicensingVal, setObLicensingVal] = useState<number>(0)
  const [obFinesVal, setObFinesVal] = useState<number>(0)
  const [obIpvaVal, setObIpvaVal] = useState<number>(0)
  const [obStatus, setObStatus] = useState<VehicleObligation['status']>('Pendente')
  const [obIsActiveDebt, setObIsActiveDebt] = useState(false)
  const [obNotes, setObNotes] = useState('')
  const [savingOb, setSavingOb] = useState(false)

  // Delete Obrigação
  const [deleteObTarget, setDeleteObTarget] = useState<VehicleObligation | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  // Sincroniza query param com aba
  useEffect(() => {
    const tab = searchParams.get('aba')
    if (tab === 'ipva' && activeTab !== 'ipva') {
      setActiveTab('ipva')
    } else if (!tab && activeTab !== 'veiculos') {
      // noop
    }
  }, [searchParams])

  const handleTabChange = (val: string) => {
    const tab = val as 'veiculos' | 'ipva'
    setActiveTab(tab)
    if (tab === 'ipva') {
      setSearchParams({ aba: 'ipva' })
    } else {
      setSearchParams({})
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [vList, oList] = await Promise.all([
        vehiclesService.getAll('', 'model'),
        obligationsService.getAll('', '-year'),
      ])
      setVehicles(vList)
      setObligations(oList)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // ===== VEÍCULOS CRUD =====
  const openNewVehicle = () => {
    setEditingVehicle(null)
    setVehModel('')
    setVehBrand('')
    setVehYearModel('')
    setVehPlate('')
    setVehRenavam('')
    setVehChassi('')
    setVehFolderCode('')
    setVehOwnerName('AUTO&CO')
    setVehType('Carro')
    setVehNotes('')
    setVehModalOpen(true)
  }

  const openEditVehicle = (v: Vehicle) => {
    setEditingVehicle(v)
    setVehModel(v.model || '')
    setVehBrand(v.brand || '')
    setVehYearModel(v.year_model || '')
    setVehPlate(v.plate || '')
    setVehRenavam(v.renavam || '')
    setVehChassi(v.chassi || '')
    setVehFolderCode(v.folder_code || '')
    setVehOwnerName(v.owner_name || 'AUTO&CO')
    setVehType(v.type || 'Carro')
    setVehNotes(v.notes || '')
    setVehModalOpen(true)
  }

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingVeh(true)
    try {
      const payload: Partial<Vehicle> = {
        model: vehModel,
        brand: vehBrand,
        year_model: vehYearModel,
        plate: vehPlate,
        renavam: vehRenavam,
        chassi: vehChassi,
        folder_code: vehFolderCode,
        owner_name: vehOwnerName,
        type: vehType,
        notes: vehNotes,
      }

      if (editingVehicle) {
        await vehiclesService.update(editingVehicle.id, payload)
        await logAudit(
          'EDICAO_VEICULO',
          'vehicles',
          editingVehicle.id,
          `Veículo atualizado: ${payload.model} (${payload.plate || 'Sem placa'})`,
        )
      } else {
        const created = await vehiclesService.create(payload)
        await logAudit(
          'CRIACAO_VEICULO',
          'vehicles',
          created.id,
          `Veículo cadastrado: ${payload.model} (${payload.plate || 'Sem placa'})`,
        )
      }
      setVehModalOpen(false)
      loadData()
    } catch (err) {
      console.error(err)
    } finally {
      setSavingVeh(false)
    }
  }

  const handleConfirmDeleteVehicle = async () => {
    if (!deleteVehTarget) return
    try {
      await vehiclesService.delete(deleteVehTarget.id)
      await logAudit(
        'EXCLUSAO_VEICULO',
        'vehicles',
        deleteVehTarget.id,
        `Veículo excluído: ${deleteVehTarget.model} (${deleteVehTarget.plate || 'Sem placa'})`,
      )
      setDeleteVehTarget(null)
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  // ===== OBRIGAÇÕES CRUD =====
  const openNewObligation = (prefillVehicleId?: string) => {
    setEditingObligation(null)
    const defVeh = vehicles.find((v) => v.id === prefillVehicleId) || vehicles[0]
    setObVehicleId(defVeh?.id || '')
    setObVehicleName(defVeh ? `${defVeh.model} (${defVeh.plate || 'Sem placa'})` : '')
    setObYear(new Date().getFullYear())
    setObLicensingVal(174.08)
    setObFinesVal(0)
    setObIpvaVal(0)
    setObStatus('Pendente')
    setObIsActiveDebt(false)
    setObNotes('')
    setObModalOpen(true)
  }

  const openEditObligation = (ob: VehicleObligation) => {
    setEditingObligation(ob)
    setObVehicleId(ob.vehicle || '')
    setObVehicleName(ob.vehicle_name || '')
    setObYear(ob.year)
    setObLicensingVal(ob.licensing_value || 0)
    setObFinesVal(ob.fines_value || 0)
    setObIpvaVal(ob.ipva_value || 0)
    setObStatus(ob.status || 'Pendente')
    setObIsActiveDebt(!!ob.is_active_debt)
    setObNotes(ob.notes || '')
    setObModalOpen(true)
  }

  const handleSaveObligation = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingOb(true)
    try {
      const selectedVeh = vehicles.find((v) => v.id === obVehicleId)
      const computedName = selectedVeh
        ? `${selectedVeh.model}${selectedVeh.plate ? ` (${selectedVeh.plate})` : ''}`
        : obVehicleName || 'Veículo'

      const payload: Partial<VehicleObligation> = {
        vehicle: obVehicleId,
        vehicle_name: computedName,
        year: Number(obYear),
        licensing_value: Number(obLicensingVal),
        fines_value: Number(obFinesVal),
        ipva_value: Number(obIpvaVal),
        status: obStatus,
        is_active_debt: obIsActiveDebt,
        notes: obNotes,
      }

      if (editingObligation) {
        await obligationsService.update(editingObligation.id, payload)
        await logAudit(
          'EDICAO_OBRIGACAO',
          'vehicle_obligations',
          editingObligation.id,
          `Obrigação exercício ${payload.year} atualizada para ${computedName}`,
        )
      } else {
        const created = await obligationsService.create(payload)
        await logAudit(
          'CRIACAO_OBRIGACAO',
          'vehicle_obligations',
          created.id,
          `Obrigação exercício ${payload.year} criada para ${computedName}`,
        )
      }
      setObModalOpen(false)
      loadData()
    } catch (err) {
      console.error(err)
    } finally {
      setSavingOb(false)
    }
  }

  const handleConfirmDeleteObligation = async () => {
    if (!deleteObTarget) return
    try {
      await obligationsService.delete(deleteObTarget.id)
      await logAudit(
        'EXCLUSAO_OBRIGACAO',
        'vehicle_obligations',
        deleteObTarget.id,
        `Obrigação exercício ${deleteObTarget.year} excluída (${deleteObTarget.vehicle_name})`,
      )
      setDeleteObTarget(null)
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  // Filtragens
  const filteredVehicles = vehicles.filter((v) => {
    const q = searchVehicles.toLowerCase()
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

  const filteredObligations = obligations.filter((o) => {
    const q = searchObligations.toLowerCase()
    const matchQuery =
      !q ||
      o.vehicle_name?.toLowerCase().includes(q) ||
      o.year.toString().includes(q) ||
      o.status?.toLowerCase().includes(q) ||
      o.notes?.toLowerCase().includes(q)

    const matchStatus =
      statusFilterObligations === 'todos' ||
      (statusFilterObligations === 'divida' && o.is_active_debt) ||
      (statusFilterObligations !== 'divida' && o.status === statusFilterObligations)

    return matchQuery && matchStatus
  })

  // Totais financeiros das obrigações
  const totalIpva = filteredObligations.reduce((acc, o) => acc + (o.ipva_value || 0), 0)
  const totalMultas = filteredObligations.reduce((acc, o) => acc + (o.fines_value || 0), 0)
  const totalLicenc = filteredObligations.reduce((acc, o) => acc + (o.licensing_value || 0), 0)
  const totalGeral = totalIpva + totalMultas + totalLicenc

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Car className="w-6 h-6 text-indigo-600" />
            Veículos, IPVA e Obrigações
          </h1>
          <p className="text-sm text-slate-500">
            Frota patrimonial, histórico de IPVA/licenciamento, dívida ativa e pastas vinculadas
          </p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            {activeTab === 'veiculos' ? (
              <Button
                onClick={openNewVehicle}
                className="bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-xs"
              >
                <Plus className="w-4 h-4 mr-1" /> Novo Veículo
              </Button>
            ) : (
              <Button
                onClick={() => openNewObligation()}
                className="bg-rose-600 hover:bg-rose-700 text-xs font-semibold"
              >
                <Plus className="w-4 h-4 mr-1" /> Nova Obrigação / Exercício
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Tabs Principais */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="bg-white border border-slate-200 p-1 rounded-xl shadow-xs">
          <TabsTrigger value="veiculos" className="text-xs font-semibold flex items-center gap-2">
            <Car className="w-4 h-4 text-indigo-600" />
            Veículos ({vehicles.length})
          </TabsTrigger>
          <TabsTrigger value="ipva" className="text-xs font-semibold flex items-center gap-2">
            <Receipt className="w-4 h-4 text-rose-600" />
            IPVA e Obrigações ({obligations.length})
          </TabsTrigger>
        </TabsList>

        {/* ================= ABA VEÍCULOS ================= */}
        <TabsContent value="veiculos" className="space-y-4 pt-2">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Buscar por placa, modelo, RENAVAN, chassi, titular ou pasta..."
                className="pl-9 text-xs h-9 bg-slate-50 border-slate-200"
                value={searchVehicles}
                onChange={(e) => setSearchVehicles(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-medium">
                {filteredVehicles.length} veículo(s)
              </span>
              <ViewModeToggle
                mode={vehiclesViewMode}
                onChange={setVehiclesViewMode}
                storageKey="veiculos"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs">Carregando veículos...</div>
          ) : filteredVehicles.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
              Nenhum veículo encontrado para a busca.
            </div>
          ) : vehiclesViewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVehicles.map((v) => {
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
                      <CardTitle className="text-sm font-bold text-slate-900 mt-2">
                        {v.model}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-1 space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-2 text-slate-600">
                        <div>
                          Ano/Mod: <strong>{v.year_model || '—'}</strong>
                        </div>
                        <div>
                          Titular: <strong>{v.owner_name}</strong>
                        </div>
                        <div className="truncate font-mono">RENAVAN: {v.renavam || '—'}</div>
                        <div className="truncate font-mono">
                          Pasta: <strong className="text-blue-700">{v.folder_code || '—'}</strong>
                        </div>
                      </div>

                      {v.pendency_summary && (
                        <div className="p-2 bg-amber-50 rounded text-amber-900 text-[11px] border border-amber-200">
                          {v.pendency_summary}
                        </div>
                      )}
                      {v.notes && <p className="text-[11px] text-slate-400 italic">{v.notes}</p>}

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setActiveTab('ipva')
                            setSearchParams({ aba: 'ipva' })
                            setSearchObligations(v.plate || v.model)
                          }}
                          className="h-7 px-2 text-[11px] text-rose-600 border-rose-200 hover:bg-rose-50"
                        >
                          <Receipt className="w-3.5 h-3.5 mr-1" />
                          Exercícios ({vehObs.length})
                        </Button>
                        {canEdit && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditVehicle(v)}
                              className="h-7 px-2 text-slate-600 hover:text-blue-600"
                              title="Editar Veículo"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteVehTarget(v)}
                              className="h-7 px-2 text-slate-600 hover:text-red-600"
                              title="Excluir Veículo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4 whitespace-nowrap">Placa</th>
                      <th className="py-3 px-4 min-w-[150px]">Modelo</th>
                      <th className="py-3 px-4 whitespace-nowrap">Tipo</th>
                      <th className="py-3 px-4 whitespace-nowrap">Ano/Mod</th>
                      <th className="py-3 px-4 whitespace-nowrap">RENAVAN</th>
                      <th className="py-3 px-4 whitespace-nowrap">Titular</th>
                      <th className="py-3 px-4 whitespace-nowrap">Pasta</th>
                      <th className="py-3 px-4 whitespace-nowrap">Status</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredVehicles.map((v) => {
                      const vehObs = obligations.filter((o) => o.vehicle === v.id)
                      const hasActiveDebt = vehObs.some((o) => o.is_active_debt)

                      return (
                        <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-indigo-700 whitespace-nowrap">
                            {v.plate || 'SEM PLACA'}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900">{v.model}</td>
                          <td className="py-3 px-4 text-slate-600">{v.type || 'Carro'}</td>
                          <td className="py-3 px-4 text-slate-600">{v.year_model || '—'}</td>
                          <td className="py-3 px-4 font-mono text-slate-600">{v.renavam || '—'}</td>
                          <td className="py-3 px-4 text-slate-700">{v.owner_name}</td>
                          <td className="py-3 px-4 font-mono font-bold text-blue-700">
                            {v.folder_code || '—'}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
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
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {canEdit ? (
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openEditVehicle(v)}
                                  className="h-7 px-2 text-blue-600 hover:text-blue-800"
                                >
                                  <Edit className="w-3.5 h-3.5 mr-1" /> Editar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setDeleteVehTarget(v)}
                                  className="h-7 px-2 text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400">Somente leitura</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ================= ABA IPVA E OBRIGAÇÕES ================= */}
        <TabsContent value="ipva" className="space-y-4 pt-2">
          {/* Cards de Resumo Financeiro */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-medium">Total IPVA</span>
              <p className="text-lg font-bold text-slate-900">
                R$ {totalIpva.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-medium">Total Multas</span>
              <p className="text-lg font-bold text-amber-700">
                R$ {totalMultas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-medium">Total Licenciamento</span>
              <p className="text-lg font-bold text-blue-700">
                R$ {totalLicenc.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-medium">Encargos Totais</span>
              <p className="text-lg font-bold text-slate-900">
                R$ {totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Buscar por veículo, exercício (2024, 2025...), observações..."
                className="pl-9 text-xs h-9 bg-slate-50 border-slate-200"
                value={searchObligations}
                onChange={(e) => setSearchObligations(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                className="h-9 border border-slate-200 rounded-md px-3 bg-white text-xs"
                value={statusFilterObligations}
                onChange={(e) => setStatusFilterObligations(e.target.value)}
              >
                <option value="todos">Todos Status</option>
                <option value="Pendente">Pendente</option>
                <option value="Pago">Pago</option>
                <option value="divida">Dívida Ativa</option>
                <option value="Isento">Isento</option>
              </select>
              <span className="text-xs text-slate-400 font-medium">
                {filteredObligations.length} registro(s)
              </span>
              <ViewModeToggle
                mode={obligationsViewMode}
                onChange={setObligationsViewMode}
                storageKey="ipva_obrigacoes"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs">Carregando obrigações...</div>
          ) : filteredObligations.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
              Nenhuma obrigação encontrada para o filtro.
            </div>
          ) : obligationsViewMode === 'table' ? (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[750px] text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4 min-w-[150px]">Veículo Vinculado</th>
                      <th className="py-3 px-4 whitespace-nowrap">Exercício</th>
                      <th className="py-3 px-4 whitespace-nowrap">Licenciamento</th>
                      <th className="py-3 px-4 whitespace-nowrap">Multas</th>
                      <th className="py-3 px-4 whitespace-nowrap">IPVA</th>
                      <th className="py-3 px-4 whitespace-nowrap">Status</th>
                      <th className="py-3 px-4 min-w-[150px]">Observações</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredObligations.map((ob) => (
                      <tr key={ob.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {ob.vehicle_name || 'Veículo'}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">{ob.year}</td>
                        <td className="py-3 px-4 text-slate-700">
                          {ob.licensing_value
                            ? `R$ ${ob.licensing_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                            : '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {ob.fines_value
                            ? `R$ ${ob.fines_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                            : '—'}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {ob.ipva_value
                            ? `R$ ${ob.ipva_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                            : 'Sem valor'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
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
                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                          {ob.notes || '—'}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {canEdit ? (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openEditObligation(ob)}
                                className="h-7 px-2 text-blue-600 hover:text-blue-800"
                              >
                                <Edit className="w-3.5 h-3.5 mr-1" /> Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeleteObTarget(ob)}
                                className="h-7 px-2 text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">Somente leitura</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredObligations.map((ob) => (
                <Card
                  key={ob.id}
                  className="shadow-xs hover:border-rose-300 transition-colors flex flex-col justify-between"
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between">
                      <span className="font-mono text-sm font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        Exercício {ob.year}
                      </span>
                      {ob.is_active_debt ? (
                        <Badge variant="destructive" className="text-[10px]">
                          DÍVIDA ATIVA
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">
                          {ob.status}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-sm font-bold text-slate-900 mt-2">
                      {ob.vehicle_name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-1 space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-2 text-slate-600">
                      <div>
                        IPVA:{' '}
                        <strong>
                          {ob.ipva_value ? `R$ ${ob.ipva_value.toFixed(2)}` : 'Sem valor'}
                        </strong>
                      </div>
                      <div>
                        Licenc.:{' '}
                        <strong>
                          {ob.licensing_value ? `R$ ${ob.licensing_value.toFixed(2)}` : '—'}
                        </strong>
                      </div>
                      <div>
                        Multas:{' '}
                        <strong>{ob.fines_value ? `R$ ${ob.fines_value.toFixed(2)}` : '—'}</strong>
                      </div>
                      <div>
                        Status: <strong>{ob.status}</strong>
                      </div>
                    </div>
                    {ob.notes && <p className="text-[11px] text-slate-400 italic">{ob.notes}</p>}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditObligation(ob)}
                        className="h-7 px-2 text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="w-3.5 h-3.5 mr-1" /> Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteObTarget(ob)}
                        className="h-7 px-2 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ================= MODAL NOVO/EDITAR VEÍCULO ================= */}
      <Dialog open={vehModalOpen} onOpenChange={setVehModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base text-slate-900">
              {editingVehicle ? 'Editar Veículo' : 'Cadastrar Veículo'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Preencha os dados do veículo, placa e pasta física vinculada.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveVehicle} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Modelo do Veículo *</label>
              <Input
                required
                placeholder="Ex: CHEVROLET CRUZE"
                value={vehModel}
                onChange={(e) => setVehModel(e.target.value)}
                className="text-xs h-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Marca</label>
                <Input
                  placeholder="Ex: CHEVROLET"
                  value={vehBrand}
                  onChange={(e) => setVehBrand(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Tipo</label>
                <select
                  className="w-full h-9 border border-slate-200 rounded-md px-3 bg-white text-xs"
                  value={vehType}
                  onChange={(e: any) => setVehType(e.target.value)}
                >
                  <option value="Carro">Carro</option>
                  <option value="Moto">Moto</option>
                  <option value="Caminhão">Caminhão</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Ano / Modelo</label>
                <Input
                  placeholder="Ex: 2015/2015"
                  value={vehYearModel}
                  onChange={(e) => setVehYearModel(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Placa</label>
                <Input
                  placeholder="Ex: FFL-4D33"
                  value={vehPlate}
                  onChange={(e) => setVehPlate(e.target.value)}
                  className="text-xs h-9 font-mono uppercase"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">RENAVAN (Texto Legado)</label>
                <Input
                  placeholder="Ex: 007.025.730.78"
                  value={vehRenavam}
                  onChange={(e) => setVehRenavam(e.target.value)}
                  className="text-xs h-9 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Chassi</label>
                <Input
                  placeholder="Chassi"
                  value={vehChassi}
                  onChange={(e) => setVehChassi(e.target.value)}
                  className="text-xs h-9 font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Código da Pasta Física</label>
                <Input
                  placeholder="Ex: N01, N10..."
                  value={vehFolderCode}
                  onChange={(e) => setVehFolderCode(e.target.value)}
                  className="text-xs h-9 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Proprietário / Titular</label>
                <Input
                  value={vehOwnerName}
                  onChange={(e) => setVehOwnerName(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Observações</label>
              <Input
                placeholder="Observações do veículo..."
                value={vehNotes}
                onChange={(e) => setVehNotes(e.target.value)}
                className="text-xs h-9"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setVehModalOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={savingVeh}
                className="bg-primary hover:bg-primary/90 text-white text-xs"
              >
                {savingVeh ? 'Gravando...' : 'Salvar Veículo'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL NOVO/EDITAR OBRIGAÇÃO ================= */}
      <Dialog open={obModalOpen} onOpenChange={setObModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base text-slate-900">
              {editingObligation
                ? `Editar Obrigação (${editingObligation.year})`
                : 'Cadastrar Obrigação / IPVA'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Vincule a um veículo e registre os valores de IPVA, multas e licenciamento.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveObligation} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Veículo Vinculado *</label>
              <select
                required
                className="w-full h-9 border border-slate-200 rounded-md px-3 bg-white text-xs"
                value={obVehicleId}
                onChange={(e) => {
                  setObVehicleId(e.target.value)
                  const v = vehicles.find((x) => x.id === e.target.value)
                  if (v) setObVehicleName(`${v.model} (${v.plate || 'Sem placa'})`)
                }}
              >
                <option value="">Selecione o veículo...</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plate ? `[${v.plate}] ` : ''}
                    {v.model} ({v.owner_name})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Exercício / Ano *</label>
                <Input
                  required
                  type="number"
                  min={1980}
                  max={2035}
                  value={obYear}
                  onChange={(e) => setObYear(Number(e.target.value))}
                  className="text-xs h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Status</label>
                <select
                  className="w-full h-9 border border-slate-200 rounded-md px-3 bg-white text-xs"
                  value={obStatus}
                  onChange={(e: any) => setObStatus(e.target.value)}
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Pago">Pago</option>
                  <option value="Dívida Ativa">Dívida Ativa</option>
                  <option value="Isento">Isento</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">IPVA (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={obIpvaVal}
                  onChange={(e) => setObIpvaVal(Number(e.target.value))}
                  className="text-xs h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Licenc. (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={obLicensingVal}
                  onChange={(e) => setObLicensingVal(Number(e.target.value))}
                  className="text-xs h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Multas (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={obFinesVal}
                  onChange={(e) => setObFinesVal(Number(e.target.value))}
                  className="text-xs h-9"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-red-600">
                <input
                  type="checkbox"
                  checked={obIsActiveDebt}
                  onChange={(e) => setObIsActiveDebt(e.target.checked)}
                />
                <span>Inscrito em Dívida Ativa</span>
              </label>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Observações</label>
              <Input
                placeholder="Ex: Parcela única paga, multa em recurso..."
                value={obNotes}
                onChange={(e) => setObNotes(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setObModalOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={savingOb}
                className="bg-primary hover:bg-primary/90 text-xs"
              >
                {savingOb ? 'Gravando...' : 'Salvar Exercício'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ================= CONFIRMAÇÃO EXCLUIR VEÍCULO ================= */}
      <AlertDialog open={!!deleteVehTarget} onOpenChange={() => setDeleteVehTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Veículo?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja excluir o veículo <strong>{deleteVehTarget?.model}</strong>{' '}
              (Placa: {deleteVehTarget?.plate || 'Sem placa'})? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteVehicle}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir Definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ================= CONFIRMAÇÃO EXCLUIR OBRIGAÇÃO ================= */}
      <AlertDialog open={!!deleteObTarget} onOpenChange={() => setDeleteObTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Obrigação?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja excluir o registro do exercício{' '}
              <strong>{deleteObTarget?.year}</strong> do veículo{' '}
              <strong>{deleteObTarget?.vehicle_name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteObligation}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir Obrigação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
