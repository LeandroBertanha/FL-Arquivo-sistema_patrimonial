import React, { useState, useEffect } from 'react'
import { Home, Plus, Search, MapPin, Edit, Trash2 } from 'lucide-react'
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
  DialogDescription,
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
import { propertiesService } from '@/services/api'
import type { Property } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { ViewModeToggle, getStoredViewMode, type ViewMode } from '@/components/ViewModeToggle'

export default function Imoveis() {
  const { canEdit } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [viewMode, setViewMode] = useState<ViewMode>(() => getStoredViewMode('imoveis', 'cards'))
  const [statusFilter, setStatusFilter] = useState<
    'todos' | 'Ativo' | 'Vendido' | 'Em Transferência' | 'Em Reforma'
  >('todos')

  // Modal Criar / Editar Imóvel
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [ownerName, setOwnerName] = useState('CAPANNONE')
  const [registryNumber, setRegistryNumber] = useState('CX N8')
  const [type, setType] = useState<Property['type']>('Conjunto Comercial')
  const [status, setStatus] = useState<NonNullable<Property['status']>>('Ativo')
  const [generatesRevenue, setGeneratesRevenue] = useState(false)
  const [revenueValue, setRevenueValue] = useState(0)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  // Modal Exclusão
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null)

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

  const openNew = () => {
    setEditingProperty(null)
    setDescription('')
    setAddress('')
    setOwnerName('CAPANNONE')
    setRegistryNumber('CX N8')
    setType('Conjunto Comercial')
    setStatus('Ativo')
    setGeneratesRevenue(false)
    setRevenueValue(0)
    setNotes('')
    setModalOpen(true)
  }

  const openEdit = (p: Property) => {
    setEditingProperty(p)
    setDescription(p.description || '')
    setAddress(p.address || '')
    setOwnerName(p.owner_name || 'CAPANNONE')
    setRegistryNumber(p.registry_number || 'CX N8')
    setType(p.type || 'Conjunto Comercial')
    setStatus(p.status || 'Ativo')
    setGeneratesRevenue(!!p.generates_revenue)
    setRevenueValue(p.revenue_value || 0)
    setNotes(p.notes || '')
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload: Partial<Property> = {
        description,
        address,
        owner_name: ownerName,
        registry_number: registryNumber,
        type,
        status,
        generates_revenue: generatesRevenue,
        revenue_value: Number(revenueValue),
        notes,
      }

      if (editingProperty) {
        await propertiesService.update(editingProperty.id, payload)
      } else {
        await propertiesService.create(payload)
      }
      setModalOpen(false)
      loadData()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await propertiesService.delete(deleteTarget.id)
      setDeleteTarget(null)
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const filtered = properties.filter((p) => {
    const q = search.toLowerCase()
    const matchQuery =
      !q ||
      p.description?.toLowerCase().includes(q) ||
      p.address?.toLowerCase().includes(q) ||
      p.owner_name?.toLowerCase().includes(q) ||
      p.registry_number?.toLowerCase().includes(q)

    const propStatus = p.status || 'Ativo'
    const matchStatus = statusFilter === 'todos' || propStatus === statusFilter

    return matchQuery && matchStatus
  })

  const countAtivos = properties.filter((p) => (p.status || 'Ativo') === 'Ativo').length
  const countVendidos = properties.filter((p) => p.status === 'Vendido').length
  const countTransferencia = properties.filter((p) => p.status === 'Em Transferência').length
  const countReforma = properties.filter((p) => p.status === 'Em Reforma').length

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
            onClick={openNew}
            className="bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1" /> Novo Imóvel
          </Button>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Buscar por descrição, endereço, proprietário ou matrícula..."
            className="pl-9 text-xs h-9 bg-slate-50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Filtro por Status do Imóvel */}
          <select
            className="h-9 border border-slate-200 rounded-md px-3 bg-white text-xs text-slate-700"
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
          >
            <option value="todos">Todos Status ({properties.length})</option>
            <option value="Ativo">Ativos ({countAtivos})</option>
            <option value="Vendido">Vendidos ({countVendidos})</option>
            <option value="Em Transferência">Em Transferência ({countTransferencia})</option>
            <option value="Em Reforma">Em Reforma ({countReforma})</option>
          </select>

          <span className="text-xs text-slate-400 font-medium">{filtered.length} imóvel(is)</span>
          <ViewModeToggle mode={viewMode} onChange={setViewMode} storageKey="imoveis" />
        </div>
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
                    className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 font-medium"
                  >
                    {p.type}
                  </Badge>
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        (p.status || 'Ativo') === 'Ativo'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : p.status === 'Vendido'
                            ? 'bg-slate-100 text-slate-700 border-slate-200'
                            : p.status === 'Em Reforma'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {p.status || 'Ativo'}
                    </Badge>
                    {p.generates_revenue && (
                      <Badge className="bg-emerald-600 text-white text-[10px]">
                        R$ {p.revenue_value?.toLocaleString('pt-BR')}/mês
                      </Badge>
                    )}
                  </div>
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
                {p.notes && <p className="text-[11px] text-slate-400 italic">{p.notes}</p>}

                {/* Ações de Edição e Exclusão no Card */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1">
                  {canEdit ? (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(p)}
                        className="h-7 px-2 text-[#1E2749] hover:text-blue-800 text-xs"
                        title="Editar Imóvel"
                      >
                        <Edit className="w-3.5 h-3.5 mr-1" /> Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteTarget(p)}
                        className="h-7 px-2 text-red-600 hover:text-red-800 text-xs"
                        title="Excluir Imóvel"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir
                      </Button>
                    </>
                  ) : (
                    <span className="text-[11px] text-slate-400">Somente leitura</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 whitespace-nowrap">Descrição</th>
                  <th className="py-3 px-4 whitespace-nowrap">Tipo</th>
                  <th className="py-3 px-4 min-w-[150px]">Endereço</th>
                  <th className="py-3 px-4 whitespace-nowrap">Proprietário / Titular</th>
                  <th className="py-3 px-4 whitespace-nowrap">Matrícula / Registro</th>
                  <th className="py-3 px-4 whitespace-nowrap">Receita</th>
                  <th className="py-3 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {p.description}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{p.type}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {p.address || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                      {p.owner_name || '—'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {p.registry_number || 'CX N8'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {p.generates_revenue ? (
                        <Badge className="bg-emerald-600 text-white text-[10px]">
                          R$ {p.revenue_value?.toLocaleString('pt-BR')}/mês
                        </Badge>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          (p.status || 'Ativo') === 'Ativo'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : p.status === 'Vendido'
                              ? 'bg-slate-100 text-slate-700 border-slate-200'
                              : p.status === 'Em Reforma'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {p.status || 'Ativo'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {canEdit ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(p)}
                            className="h-7 px-2 text-[#1E2749] hover:text-blue-800"
                          >
                            <Edit className="w-3.5 h-3.5 mr-1" /> Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteTarget(p)}
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
      )}

      {/* Modal Criar / Editar */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base text-[#1E2749]">
              {editingProperty ? 'Editar Imóvel' : 'Cadastrar Imóvel'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Preencha os dados do imóvel, titular proprietário e caixa física vinculada.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-3 py-2 text-xs">
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
                placeholder="Rua, número, bairro, cidade..."
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
                <label className="font-semibold text-slate-700">Proprietário / Titular</label>
                <Input
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Ex: CAPANNONE"
                  className="text-xs h-9"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Matrícula / Caixa</label>
                <Input
                  value={registryNumber}
                  onChange={(e) => setRegistryNumber(e.target.value)}
                  placeholder="Ex: CX N8"
                  className="text-xs h-9 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Status</label>
                <select
                  className="w-full h-9 border border-slate-200 rounded-md px-3 bg-white text-xs"
                  value={status}
                  onChange={(e: any) => setStatus(e.target.value)}
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Vendido">Vendido</option>
                  <option value="Em Transferência">Em Transferência</option>
                  <option value="Em Reforma">Em Reforma</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Receita Mensal (R$)</label>
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
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Observações</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações do imóvel..."
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
                className="bg-primary hover:bg-primary/90 text-white text-xs"
              >
                {saving ? 'Gravando...' : 'Salvar Imóvel'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmação de Exclusão */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Imóvel?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja excluir o imóvel{' '}
              <strong>{deleteTarget?.description}</strong> (
              {deleteTarget?.address || 'sem endereço'})? Esta ação será registrada na auditoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir Definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
