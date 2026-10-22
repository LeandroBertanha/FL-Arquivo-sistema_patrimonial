import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box as BoxIcon,
  ArrowLeft,
  Printer,
  QrCode,
  Plus,
  MapPin,
  Folder,
  Search,
  ExternalLink,
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

export default function CaixaDetalhe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [box, setBox] = useState<BoxType | null>(null)
  const [folders, setFolders] = useState<FolderType[]>([])
  const [allFolders, setAllFolders] = useState<FolderType[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modal para adicionar pasta à caixa
  const [addModal, setAddModal] = useState(false)
  const [selectedFolderId, setSelectedFolderId] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (id) loadBoxData(id)
  }, [id])

  const loadBoxData = async (boxId: string) => {
    setLoading(true)
    try {
      const b = await boxesService.getById(boxId)
      setBox(b)
      // Busca pastas vinculadas por box_code ou box id
      const fRes = await foldersService.getAll(
        `box_code = '${b.code_legacy}' || box = '${b.id}'`,
        'code_legacy',
        1,
        200,
      )
      setFolders(fRes.items || [])

      // Busca pastas disponíveis sem caixa para vincular
      const allRes = await foldersService.getAll("box_code = ''", 'title', 1, 300)
      setAllFolders(allRes.items || [])
    } catch (err) {
      console.error('Erro ao carregar detalhes da caixa:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddFolderToBox = async () => {
    if (!selectedFolderId || !box) return
    setAdding(true)
    try {
      await foldersService.update(
        selectedFolderId,
        {
          box: box.id,
          box_code: box.code_legacy,
          archive_type: 'Morto',
          cycle_status: 'Arquivo Morto',
          location_text: `Caixa ${box.code_legacy} (${box.location_text || 'Arquivo Morto'})`,
        },
        `Pasta inserida na caixa ${box.code_legacy}`,
      )
      setAddModal(false)
      setSelectedFolderId('')
      if (id) loadBoxData(id)
    } catch (err) {
      console.error('Erro ao adicionar pasta na caixa:', err)
    } finally {
      setAdding(false)
    }
  }

  const filteredFolders = folders.filter((f) => {
    const q = search.toLowerCase()
    return (
      !q ||
      f.title?.toLowerCase().includes(q) ||
      f.code_legacy?.toLowerCase().includes(q) ||
      f.notes?.toLowerCase().includes(q)
    )
  })

  if (loading || !box) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-xs text-slate-400 mt-2">Carregando dados da caixa física...</p>
      </div>
    )
  }

  const count = folders.length
  const cap = box.capacity || 30
  const pct = Math.min(Math.round((count / cap) * 100), 100)

  return (
    <div className="space-y-6">
      {/* Botão Voltar */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/caixas')}
        className="text-xs text-slate-600 hover:text-slate-900 -ml-2"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Voltar para Lista de Caixas
      </Button>

      {/* Cartão de Detalhes da Caixa */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row justify-between gap-6">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-3">
            <span className="font-mono text-base font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
              {box.code_legacy}
            </span>
            <Badge variant="outline" className="text-xs">
              {box.category || 'Arquivo Morto'}
            </Badge>
            <Badge
              variant="outline"
              className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs"
            >
              {box.status || 'Ativa'}
            </Badge>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 leading-tight">{box.name}</h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>{box.location_text || 'Arquivo Central → Sala 02 → Estante A'}</span>
            </div>
            <div>
              Responsável: <strong className="text-slate-700">{box.responsible || 'Geral'}</strong>
            </div>
          </div>

          {/* Ocupação */}
          <div className="max-w-md space-y-1.5 pt-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-500">Capacidade Volumétrica:</span>
              <span className="text-slate-800">
                {count} de {cap} pastas ({pct}%)
              </span>
            </div>
            <Progress value={pct} className="h-2" />
          </div>
        </div>

        {/* QR Code e Ações */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl shrink-0 space-y-2 text-center">
          <QRCodeSVG value={`FL-CAIXA:${box.id}:${box.code_legacy}`} size={100} />
          <span className="text-[11px] font-mono text-slate-500 font-semibold">
            {box.code_legacy}
          </span>
          <Button
            size="sm"
            onClick={() => window.print()}
            className="text-xs h-7 bg-primary hover:bg-primary/90 w-full"
          >
            <Printer className="w-3.5 h-3.5 mr-1" />
            Imprimir Etiqueta
          </Button>
        </div>
      </div>

      {/* Itens Contidos na Caixa */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Folder className="w-5 h-5 text-blue-600" />
              Pastas e Documentos Contidos nesta Caixa ({count})
            </h2>
            <p className="text-xs text-slate-500">
              Listagem física detalhada com códigos originais preservados
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setAddModal(true)}
              className="bg-primary hover:bg-primary/90 text-xs font-semibold"
            >
              <Plus className="w-4 h-4 mr-1" />
              Adicionar Pasta a esta Caixa
            </Button>
          </div>
        </div>

        {/* Busca interna */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Buscar itens dentro desta caixa..."
            className="pl-9 text-xs h-9 bg-white border-slate-200 focus-visible:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Tabela de Itens */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 whitespace-nowrap">Código Legado</th>
                  <th className="py-3 px-4 min-w-[200px]">Título do Documento / Pasta</th>
                  <th className="py-3 px-4 whitespace-nowrap">Titular / Grupo</th>
                  <th className="py-3 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 whitespace-nowrap">Revisão</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFolders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Nenhum item encontrado nesta caixa.
                    </td>
                  </tr>
                ) : (
                  filteredFolders.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                        {f.code_legacy || '—'}
                      </td>
                      <td
                        className="py-3 px-4 font-semibold text-slate-900 cursor-pointer hover:underline max-w-md truncate"
                        onClick={() => navigate(`/pastas/${f.id}`)}
                      >
                        {f.title}
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {f.group_name || '—'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            f.status === 'No Arquivo'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {f.status || 'No Arquivo'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {f.needs_review && (
                          <Badge
                            variant="outline"
                            className="bg-amber-100 text-amber-800 border-amber-300 text-[10px]"
                          >
                            Revisar
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/pastas/${f.id}`)}
                          className="h-7 px-2 text-xs text-blue-600 hover:text-blue-800"
                        >
                          Ver Ficha →
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Adicionar Pasta */}
      <Dialog open={addModal} onOpenChange={setAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base text-slate-900">
              Vincular Pasta à Caixa {box.code_legacy}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Selecione uma pasta avulsa para arquivar nesta caixa física
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <label className="font-semibold text-slate-700">Selecione a Pasta:</label>
            <select
              className="w-full h-9 border border-slate-200 rounded-md px-3 bg-white text-xs focus:ring-1 focus:ring-blue-500"
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value)}
            >
              <option value="">Selecione...</option>
              {allFolders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.code_legacy ? `[${f.code_legacy}] ` : ''}
                  {f.title}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddModal(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              disabled={!selectedFolderId || adding}
              onClick={handleAddFolderToBox}
              className="bg-primary hover:bg-primary/90 text-xs"
            >
              {adding ? 'Vinculando...' : 'Confirmar Inclusão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
