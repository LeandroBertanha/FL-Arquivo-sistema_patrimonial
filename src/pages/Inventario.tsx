import React, { useState, useEffect } from 'react'
import {
  ClipboardCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  Play,
  Plus,
  RefreshCw,
  Box,
  Folders,
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
  inventoryService,
  foldersService,
  boxesService,
  locationsService,
  logAudit,
} from '@/services/api'
import type { InventorySession, Folder, Box as BoxType, ArchiveLocation } from '@/types'
import { ViewModeToggle, getStoredViewMode, type ViewMode } from '@/components/ViewModeToggle'
import { useAuth } from '@/contexts/AuthContext'

export default function Inventario() {
  const { user, canEdit } = useAuth()
  const [sessions, setSessions] = useState<InventorySession[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [boxes, setBoxes] = useState<BoxType[]>([])
  const [locations, setLocations] = useState<ArchiveLocation[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [search, setSearch] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('todas')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [viewMode, setViewMode] = useState<ViewMode>(() => getStoredViewMode('inventario', 'cards'))

  // Modal Nova Sessão
  const [newModalOpen, setNewModalOpen] = useState(false)
  const [sessionTitle, setSessionTitle] = useState('')
  const [sessionLocation, setSessionLocation] = useState('Arquivo Central → Sala 01')
  const [savingSession, setSavingSession] = useState(false)

  // Conferência Rápida / Auditoria de Posição
  const [conferencingId, setConferencingId] = useState<string | null>(null)
  const [verifiedFolderIds, setVerifiedFolderIds] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('fl_inventario_conferidos')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [sessList, fRes, bList, locList] = await Promise.all([
        inventoryService.getAll(),
        foldersService.getAll('(deleted = false || deleted = null)', 'code_legacy', 1, 500),
        boxesService.getAll(),
        locationsService.getAll(),
      ])
      setSessions(sessList)
      setFolders(fRes.items || [])
      setBoxes(bList)
      setLocations(locList)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canEdit) return
    setSavingSession(true)
    try {
      // Conta itens esperados naquela localização
      const expectedCount = folders.filter((f) =>
        f.location_text?.toLowerCase().includes(sessionLocation.toLowerCase()),
      ).length

      await inventoryService.create({
        title: sessionTitle,
        location_name: sessionLocation,
        operator_name: user?.name || 'Operador',
        status: 'Em Andamento',
        items_expected: expectedCount || 10,
        items_scanned: 0,
        discrepancies: [],
      })

      await logAudit(
        'INICIO_INVENTARIO',
        'inventory_session',
        'novo',
        `Sessão de conferência aberta: "${sessionTitle}" em ${sessionLocation}`,
      )

      setNewModalOpen(false)
      setSessionTitle('')
      loadData()
    } catch (err) {
      console.error(err)
    } finally {
      setSavingSession(false)
    }
  }

  const handleToggleVerifyFolder = async (folder: Folder) => {
    const nextState = !verifiedFolderIds[folder.id]
    const updated = { ...verifiedFolderIds, [folder.id]: nextState }
    setVerifiedFolderIds(updated)
    try {
      localStorage.setItem('fl_inventario_conferidos', JSON.stringify(updated))
    } catch {
      // ignore
    }

    await logAudit(
      nextState ? 'CONFERENCIA_PASTA_OK' : 'DESMARCAR_CONFERENCIA',
      'folder',
      folder.id,
      `Conferência física da pasta ${folder.title} (${folder.code_legacy || 'Sem código'}) marcada como ${
        nextState ? 'Conferida' : 'Pendente'
      }`,
    )
  }

  // Filtragem de pastas para conferência
  const filteredFolders = folders.filter((f) => {
    const q = search.toLowerCase()
    const matchQuery =
      !q ||
      f.title?.toLowerCase().includes(q) ||
      f.code_legacy?.toLowerCase().includes(q) ||
      f.location_text?.toLowerCase().includes(q) ||
      f.box_code?.toLowerCase().includes(q)

    const matchLoc =
      selectedLocation === 'todas' ||
      f.location_text?.toLowerCase().includes(selectedLocation.toLowerCase())

    const isVerified = !!verifiedFolderIds[f.id]
    const matchStatus =
      statusFilter === 'todos' ||
      (statusFilter === 'conferido' && isVerified) ||
      (statusFilter === 'pendente' && !isVerified)

    return matchQuery && matchLoc && matchStatus
  })

  const totalConferidos = folders.filter((f) => verifiedFolderIds[f.id]).length
  const pctConferido = folders.length > 0 ? Math.round((totalConferidos / folders.length) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-blue-600" />
            Inventário & Conferência Física do Acervo
          </h1>
          <p className="text-sm text-slate-500">
            Batimento físico de caixas, gaveteiros, prateleiras e conferência de pastas in loco
          </p>
        </div>

        {canEdit && (
          <Button
            onClick={() => setNewModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-xs font-semibold"
          >
            <Plus className="w-4 h-4 mr-1" /> Nova Sessão de Inventário
          </Button>
        )}
      </div>

      {/* Métricas do Inventário Geral */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">Total de Pastas Físicas</span>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{folders.length}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">Conferidas no Local</span>
          <p className="text-xl font-bold text-emerald-600 mt-0.5">{totalConferidos}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">Pendentes de Checagem</span>
          <p className="text-xl font-bold text-amber-600 mt-0.5">
            {folders.length - totalConferidos}
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">Progresso Global</span>
          <p className="text-xl font-bold text-blue-600 mt-0.5">{pctConferido}%</p>
        </div>
      </div>

      {/* Sessões Abertas no PocketBase */}
      {sessions.length > 0 && (
        <Card className="shadow-xs border-blue-100 bg-blue-50/20">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Play className="w-4 h-4 text-blue-600" />
              Sessões de Inventário em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{s.title}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        s.status === 'Concluído'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {s.status}
                    </Badge>
                  </div>
                  <p className="text-slate-500 truncate">Local: {s.location_name || 'Geral'}</p>
                  <p className="text-slate-400 text-[11px]">
                    Operador: {s.operator_name || 'Arquivo'}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros da Lista de Conferência */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Buscar por código (N1, N4/01), título, caixa ou sala..."
            className="pl-9 text-xs h-9 bg-slate-50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="h-9 border border-slate-200 rounded-md px-3 bg-white text-xs"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
          >
            <option value="todas">Todas as Localizações</option>
            <option value="Sala 01">Sala 01 (Arquivo Corrente)</option>
            <option value="Sala 02">Sala 02 (Arquivo Morto)</option>
            <option value="Gaveteiro">Gaveteiros</option>
            <option value="Estante">Estantes</option>
          </select>

          <select
            className="h-9 border border-slate-200 rounded-md px-3 bg-white text-xs"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="todos">Status de Conferência (Todos)</option>
            <option value="conferido">Apenas Conferidos ({totalConferidos})</option>
            <option value="pendente">Apenas Pendentes ({folders.length - totalConferidos})</option>
          </select>

          <span className="text-xs text-slate-400 font-medium">
            {filteredFolders.length} item(ns)
          </span>

          <ViewModeToggle mode={viewMode} onChange={setViewMode} storageKey="inventario" />
        </div>
      </div>

      {/* Listagem em Cards ou Tabela */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">
          Carregando acervo para inventário...
        </div>
      ) : filteredFolders.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs shadow-xs">
          Nenhuma pasta física encontrada para os critérios selecionados.
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFolders.map((f) => {
            const isVerified = !!verifiedFolderIds[f.id]

            return (
              <Card
                key={f.id}
                className={`shadow-xs transition-colors flex flex-col justify-between ${
                  isVerified ? 'border-emerald-300 bg-emerald-50/15' : 'hover:border-slate-300'
                }`}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {f.code_legacy || 'SEM CÓDIGO'}
                    </span>
                    {isVerified ? (
                      <Badge className="bg-emerald-600 text-white text-[10px]">
                        <CheckCircle2 className="w-3 h-3 mr-1 inline" /> Conferido
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[10px] text-amber-700 border-amber-300 bg-amber-50"
                      >
                        Pendente
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-sm font-bold text-slate-900 mt-2">{f.title}</CardTitle>
                </CardHeader>

                <CardContent className="p-4 pt-1 space-y-2 text-xs text-slate-600">
                  <p className="truncate">
                    Localização: <strong>{f.location_text || 'Arquivo Central'}</strong>
                  </p>
                  <div className="flex justify-between text-slate-500">
                    <span>
                      Caixa: <strong>{f.box_code || 'Avulso'}</strong>
                    </span>
                    <span>
                      Arquivo: <strong>{f.archive_type}</strong>
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Status físico: {f.status || 'No Arquivo'}
                    </span>
                    {canEdit && (
                      <Button
                        size="sm"
                        variant={isVerified ? 'outline' : 'default'}
                        onClick={() => handleToggleVerifyFolder(f)}
                        className={`h-7 px-2.5 text-xs font-semibold ${
                          isVerified
                            ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        {isVerified ? 'Desmarcar' : 'Validar Presença'}
                      </Button>
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
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 whitespace-nowrap">Código</th>
                  <th className="py-3 px-4 min-w-[180px]">Título da Pasta</th>
                  <th className="py-3 px-4 whitespace-nowrap">Caixa</th>
                  <th className="py-3 px-4 min-w-[150px]">Localização Física</th>
                  <th className="py-3 px-4 whitespace-nowrap">Arquivo</th>
                  <th className="py-3 px-4 whitespace-nowrap">Status Conferência</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFolders.map((f) => {
                  const isVerified = !!verifiedFolderIds[f.id]

                  return (
                    <tr
                      key={f.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isVerified ? 'bg-emerald-50/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                        {f.code_legacy || 'SEM CÓDIGO'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 max-w-sm truncate">
                        {f.title}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{f.box_code || '—'}</td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {f.location_text || '—'}
                      </td>
                      <td className="py-3 px-4">{f.archive_type}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isVerified ? (
                          <Badge className="bg-emerald-600 text-white text-[10px]">
                            <CheckCircle2 className="w-3 h-3 mr-1 inline" /> Conferido
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] text-amber-700 border-amber-300 bg-amber-50"
                          >
                            Pendente
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {canEdit && (
                          <Button
                            size="sm"
                            variant={isVerified ? 'outline' : 'default'}
                            onClick={() => handleToggleVerifyFolder(f)}
                            className={`h-7 px-2.5 text-xs font-semibold ${
                              isVerified
                                ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            {isVerified ? 'Desmarcar' : 'Conferir'}
                          </Button>
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

      {/* Modal Nova Sessão */}
      <Dialog open={newModalOpen} onOpenChange={setNewModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base text-slate-900">
              Iniciar Sessão de Inventário
            </DialogTitle>
            <DialogDescription className="text-xs">
              Abra uma sessão formal de checagem para registrar o operador, localização e
              discrepâncias.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSession} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Título / Descrição da Sessão *</label>
              <Input
                required
                placeholder="Ex: Auditoria Semestral - Sala 01 Gaveteiros"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                className="text-xs h-9"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Localização Alvo</label>
              <Input
                value={sessionLocation}
                onChange={(e) => setSessionLocation(e.target.value)}
                placeholder="Ex: Sala 01 → Gaveteiro 01"
                className="text-xs h-9"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setNewModalOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={savingSession}
                className="bg-primary hover:bg-primary/90 text-xs"
              >
                {savingSession ? 'Abrindo Sessão...' : 'Iniciar Inventário'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
