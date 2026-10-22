import React, { useState, useEffect } from 'react'
import {
  ArrowLeftRight,
  Clock,
  CheckCircle2,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react'
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
import { movementsService, foldersService } from '@/services/api'
import type { FolderMovement, Checkout, Folder as FolderType } from '@/types'

export default function Movimentacoes() {
  const [movements, setMovements] = useState<FolderMovement[]>([])
  const [checkouts, setCheckouts] = useState<Checkout[]>([])
  const [folders, setFolders] = useState<FolderType[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modal Check-out
  const [modalCheckout, setModalCheckout] = useState(false)
  const [selectedFolderId, setSelectedFolderId] = useState('')
  const [requesterName, setRequesterName] = useState('')
  const [purpose, setPurpose] = useState('Consulta')
  const [expectedReturnDate, setExpectedReturnDate] = useState('')
  const [savingCheckout, setSavingCheckout] = useState(false)

  // Modal Check-in
  const [modalCheckin, setModalCheckin] = useState(false)
  const [activeCheckoutId, setActiveCheckoutId] = useState('')
  const [checkinFolderId, setCheckinFolderId] = useState('')
  const [returnReceiver, setReturnReceiver] = useState('Arquivo Central')
  const [newLocation, setNewLocation] = useState('Arquivo Central → Sala 01 → Gaveteiro 01')
  const [savingCheckin, setSavingCheckin] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [mList, cList, fList] = await Promise.all([
        movementsService.getAll('', '-created'),
        movementsService.getActiveCheckouts(),
        foldersService.getAll('', 'title', 1, 500),
      ])
      setMovements(mList)
      setCheckouts(cList)
      setFolders(fList.items || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const folder = folders.find((f) => f.id === selectedFolderId)
    if (!folder) return
    setSavingCheckout(true)
    try {
      await movementsService.registerCheckout({
        folderId: folder.id,
        folderTitle: folder.title,
        folderCode: folder.code_legacy || 'Sem código',
        requesterName,
        purpose,
        expectedReturnDate,
        originLocation: folder.location_text,
      })
      setModalCheckout(false)
      setSelectedFolderId('')
      setRequesterName('')
      loadData()
    } catch (err) {
      console.error(err)
    } finally {
      setSavingCheckout(false)
    }
  }

  const handleCheckinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingCheckin(true)
    try {
      await movementsService.registerCheckin(
        activeCheckoutId,
        checkinFolderId,
        newLocation,
        returnReceiver,
      )
      setModalCheckin(false)
      loadData()
    } catch (err) {
      console.error(err)
    } finally {
      setSavingCheckin(false)
    }
  }

  const openCheckinFor = (co: Checkout) => {
    setActiveCheckoutId(co.id)
    setCheckinFolderId(co.folder)
    setNewLocation(co.origin_location || 'Arquivo Central → Sala 01 → Gaveteiro 01')
    setModalCheckin(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-blue-600" />
            Movimentações Físicas & Custódia (Check-out/in)
          </h1>
          <p className="text-sm text-slate-500">
            Registro de retiradas, devoluções, transferências e rastreio de posse das pastas
          </p>
        </div>
        <Button
          onClick={() => setModalCheckout(true)}
          className="bg-blue-600 hover:bg-blue-700 text-xs font-semibold"
        >
          <ArrowUpRight className="w-4 h-4 mr-1" /> Registrar Retirada (Check-out)
        </Button>
      </div>

      <Tabs defaultValue="movimentos" className="w-full">
        <TabsList className="bg-white border border-slate-200 p-1 rounded-xl shadow-xs">
          <TabsTrigger value="movimentos" className="text-xs font-semibold">
            Todas as Movimentações ({movements.length})
          </TabsTrigger>
          <TabsTrigger value="checkouts" className="text-xs font-semibold">
            Pastas Fora do Arquivo ({checkouts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="movimentos" className="pt-2">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 whitespace-nowrap">Tipo</th>
                    <th className="py-3 px-4 min-w-[180px]">Pasta</th>
                    <th className="py-3 px-4 whitespace-nowrap">Código</th>
                    <th className="py-3 px-4 whitespace-nowrap">Origem → Destino</th>
                    <th className="py-3 px-4 whitespace-nowrap">Responsável / Usuário</th>
                    <th className="py-3 px-4 whitespace-nowrap">Data / Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-blue-50 text-blue-700 border-blue-200"
                        >
                          {m.type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs truncate">
                        {m.folder_title}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                        {m.folder_code || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {m.origin_location} → <strong>{m.destination_location}</strong>
                      </td>
                      <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                        {m.user_name || 'Sistema'}
                      </td>
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        {new Date(m.created).toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="checkouts" className="pt-2">
          {checkouts.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
              Nenhuma pasta está em check-out no momento. Todas estão no arquivo físico.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4 min-w-[180px]">Pasta</th>
                      <th className="py-3 px-4 whitespace-nowrap">Código</th>
                      <th className="py-3 px-4 whitespace-nowrap">Em Posse de</th>
                      <th className="py-3 px-4 whitespace-nowrap">Finalidade</th>
                      <th className="py-3 px-4 whitespace-nowrap">Data Saída</th>
                      <th className="py-3 px-4 whitespace-nowrap">Devolução Prevista</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {checkouts.map((co) => (
                      <tr key={co.id} className="hover:bg-red-50/20">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {co.folder_title}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                          {co.folder_code}
                        </td>
                        <td className="py-3 px-4 font-bold text-red-700 whitespace-nowrap">
                          {co.requester_name}
                        </td>
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{co.purpose}</td>
                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                          {co.checkout_date
                            ? new Date(co.checkout_date).toLocaleDateString('pt-BR')
                            : '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-semibold whitespace-nowrap">
                          {co.expected_return_date
                            ? new Date(co.expected_return_date).toLocaleDateString('pt-BR')
                            : 'Sem prazo'}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <Button
                            size="sm"
                            onClick={() => openCheckinFor(co)}
                            className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Devolver (Check-in)
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal Registrar Check-out */}
      <Dialog open={modalCheckout} onOpenChange={setModalCheckout}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base text-slate-900">
              Registrar Saída (Check-out)
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCheckoutSubmit} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Selecione a Pasta *</label>
              <select
                required
                className="w-full h-9 border border-slate-200 rounded-md px-3 bg-white text-xs"
                value={selectedFolderId}
                onChange={(e) => setSelectedFolderId(e.target.value)}
              >
                <option value="">Selecione...</option>
                {folders
                  .filter((f) => f.status !== 'Fora do Arquivo')
                  .map((f) => (
                    <option key={f.id} value={f.id}>
                      [{f.code_legacy || 'Sem código'}] {f.title}
                    </option>
                  ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Nome de quem está retirando *</label>
              <Input
                required
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                className="text-xs h-9"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Finalidade</label>
              <Input
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="text-xs h-9"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Data Prevista para Devolução</label>
              <Input
                type="date"
                value={expectedReturnDate}
                onChange={(e) => setExpectedReturnDate(e.target.value)}
                className="text-xs h-9"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalCheckout(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={savingCheckout || !selectedFolderId}
                className="bg-blue-600 hover:bg-blue-700 text-xs"
              >
                {savingCheckout ? 'Registrando...' : 'Confirmar Saída'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Devolver Check-in */}
      <Dialog open={modalCheckin} onOpenChange={setModalCheckin}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base text-slate-900">
              Registrar Retorno (Check-in)
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCheckinSubmit} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Recebido por</label>
              <Input
                required
                value={returnReceiver}
                onChange={(e) => setReturnReceiver(e.target.value)}
                className="text-xs h-9"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Localização Física de Retorno</label>
              <Input
                required
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                className="text-xs h-9"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalCheckin(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={savingCheckin}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                {savingCheckin ? 'Confirmando...' : 'Confirmar Retorno'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
