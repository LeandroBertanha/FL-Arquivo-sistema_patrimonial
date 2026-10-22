import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box as BoxIcon,
  Plus,
  Printer,
  QrCode,
  Search,
  ExternalLink,
  MapPin,
  CheckCircle2,
  Folder,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { boxesService, foldersService } from '@/services/api'
import type { Box as BoxType, Folder as FolderType } from '@/types'
import { QRCodeSVG } from 'qrcode.react'

export default function Caixas() {
  const navigate = useNavigate()
  const [boxes, setBoxes] = useState<BoxType[]>([])
  const [folders, setFolders] = useState<FolderType[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modal Nova Caixa
  const [newBoxModal, setNewBoxModal] = useState(false)
  const [codeLegacy, setCodeLegacy] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [capacity, setCapacity] = useState(30)
  const [locationText, setLocationText] = useState('Arquivo Central → Sala 02 → Estante A')
  const [responsible, setResponsible] = useState('Arquivo Morto')
  const [saving, setSaving] = useState(false)

  // Modal QR Code da Caixa
  const [qrBox, setQrBox] = useState<BoxType | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [bRes, fRes] = await Promise.all([
        boxesService.getAll(),
        foldersService.getAll("box_code != ''", 'code_legacy', 1, 500),
      ])
      setBoxes(bRes || [])
      setFolders(fRes.items || [])
    } catch (err) {
      console.error('Erro ao carregar caixas:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBox = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await boxesService.create({
        code_legacy: codeLegacy,
        name,
        category,
        capacity: Number(capacity),
        location_text: locationText,
        responsible,
        status: 'Ativa',
      })
      setNewBoxModal(false)
      setCodeLegacy('')
      setName('')
      loadData()
    } catch (err) {
      console.error('Erro ao criar caixa:', err)
    } finally {
      setSaving(false)
    }
  }

  const filteredBoxes = boxes.filter((b) => {
    const q = search.toLowerCase()
    return (
      !q ||
      b.code_legacy?.toLowerCase().includes(q) ||
      b.name?.toLowerCase().includes(q) ||
      b.category?.toLowerCase().includes(q) ||
      b.location_text?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BoxIcon className="w-6 h-6 text-amber-600" />
            Caixas de Arquivo Morto
          </h1>
          <p className="text-sm text-slate-500">
            Controle físico de caixas (CX N2 a CX N12), capacidade volumétrica e itens contidos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setNewBoxModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-xs font-semibold shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1" />
            Nova Caixa
          </Button>
        </div>
      </div>

      {/* Busca */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Buscar caixa por código (CX N2, CX N8...), nome ou categoria..."
            className="pl-9 text-xs h-9 bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="text-xs text-slate-400 font-medium">
          {filteredBoxes.length} caixa(s) encontrada(s)
        </div>
      </div>

      {/* Grid de Caixas em Cards */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-xs text-slate-400 mt-2">Carregando caixas do arquivo...</p>
        </div>
      ) : filteredBoxes.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
          Nenhuma caixa física encontrada.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBoxes.map((box) => {
            const itemsInBox = folders.filter((f) => f.box_code === box.code_legacy)
            const count = itemsInBox.length
            const cap = box.capacity || 30
            const pct = Math.min(Math.round((count / cap) * 100), 100)

            return (
              <Card
                key={box.id}
                className="shadow-xs hover:border-amber-300 transition-all flex flex-col justify-between"
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-sm font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {box.code_legacy}
                      </span>
                      <CardTitle className="text-sm font-bold text-slate-900 mt-2 leading-tight">
                        {box.name}
                      </CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQrBox(box)}
                      className="text-slate-400 hover:text-slate-700 h-8 w-8"
                      title="Ver QR Code / Etiqueta"
                    >
                      <QrCode className="w-4 h-4" />
                    </Button>
                  </div>
                  <Badge variant="outline" className="text-[10px] w-fit mt-1 text-slate-600">
                    {box.category || 'Geral'}
                  </Badge>
                </CardHeader>

                <CardContent className="p-4 pt-1 space-y-3">
                  <div
                    className="text-xs text-slate-500 flex items-center gap-1.5 truncate"
                    title={box.location_text}
                  >
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {box.location_text || 'Arquivo Central → Sala 02'}
                    </span>
                  </div>

                  {/* Barra de Ocupação */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Ocupação física:</span>
                      <span className="font-semibold text-slate-800">
                        {count} de {cap} pastas ({pct}%)
                      </span>
                    </div>
                    <Progress
                      value={pct}
                      className={`h-2 ${
                        pct > 90
                          ? '[&>div]:bg-red-500'
                          : pct > 70
                            ? '[&>div]:bg-amber-500'
                            : '[&>div]:bg-emerald-500'
                      }`}
                    />
                  </div>

                  {/* Resumo de itens contidos */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      {box.responsible || 'Resp: Arquivo Morto'}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/caixas/${box.id}`)}
                      className="text-xs h-7 px-2.5 text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      Ver Itens ({count}) →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal Criar Caixa */}
      <Dialog open={newBoxModal} onOpenChange={setNewBoxModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BoxIcon className="w-5 h-5 text-amber-600" />
              Cadastrar Nova Caixa Física
            </DialogTitle>
            <DialogDescription>
              Identifique a caixa para guarda em lote no Arquivo Morto
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateBox} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Código Físico da Caixa *</label>
              <Input
                required
                placeholder="Ex: CX N13, CX N14, CX EXTRA..."
                value={codeLegacy}
                onChange={(e) => setCodeLegacy(e.target.value)}
                className="text-xs h-9 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Nome / Descrição da Caixa *</label>
              <Input
                required
                placeholder="Ex: PROCESSOS ENCERRADOS 2025"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Categoria</label>
                <Input
                  placeholder="Ex: Jurídico, RH, Imóveis..."
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Capacidade Máxima</label>
                <Input
                  type="number"
                  min={5}
                  max={200}
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="text-xs h-9"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Localização Física no Prédio</label>
              <Input
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                placeholder="Ex: Sala 02 → Estante B → Prateleira 4"
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Responsável pelo Acervo</label>
              <Input
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                placeholder="Ex: Arquivo Geral, RH, Jurídico"
                className="text-xs h-9"
              />
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setNewBoxModal(false)}
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
                {saving ? 'Salvando...' : 'Cadastrar Caixa'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal QR Code da Caixa */}
      <Dialog open={!!qrBox} onOpenChange={() => setQrBox(null)}>
        <DialogContent className="sm:max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="text-base text-slate-900">
              Etiqueta de Caixa: {qrBox?.code_legacy}
            </DialogTitle>
            <DialogDescription className="text-xs">{qrBox?.name}</DialogDescription>
          </DialogHeader>

          {qrBox && (
            <div className="p-4 flex flex-col items-center justify-center space-y-4">
              <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
                <QRCodeSVG value={`FL-CAIXA:${qrBox.id}:${qrBox.code_legacy}`} size={140} />
              </div>
              <div className="text-xs font-mono font-bold text-slate-800 tracking-wider">
                {qrBox.code_legacy}
              </div>
              <p className="text-[11px] text-slate-400">
                {qrBox.location_text || 'Arquivo Central → Sala 02'}
              </p>
              <Button
                size="sm"
                onClick={() => window.print()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-xs"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5" />
                Imprimir Etiqueta da Caixa
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
