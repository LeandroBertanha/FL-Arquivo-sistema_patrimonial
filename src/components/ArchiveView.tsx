import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderOpen, Plus, Printer, Archive, Search, CheckSquare, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { foldersService } from '@/services/api'
import type { Folder } from '@/types'

interface ArchiveViewProps {
  archiveType: 'Atual' | 'Morto'
  title: string
  description: string
}

export default function ArchiveView({ archiveType, title, description }: ArchiveViewProps) {
  const navigate = useNavigate()
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [groupFilter, setGroupFilter] = useState('todos')
  const [needsReviewFilter, setNeedsReviewFilter] = useState('todos')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Modal para transferir para Arquivo Morto
  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [folderToTransfer, setFolderToTransfer] = useState<Folder | null>(null)
  const [transferReason, setTransferReason] = useState('')
  const [transferLocation, setTransferLocation] = useState('Arquivo Central → Sala 02 → Estante A')
  const [transferring, setTransferring] = useState(false)

  useEffect(() => {
    loadFolders()
  }, [archiveType])

  const loadFolders = async () => {
    setLoading(true)
    try {
      const res = await foldersService.getAll(
        `archive_type = '${archiveType}' && (deleted = false || deleted = null)`,
        'code_legacy',
        1,
        500,
      )
      setFolders(res.items || [])
    } catch (err) {
      console.error('Erro ao carregar pastas:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredFolders = folders.filter((f) => {
    const q = searchTerm.toLowerCase()
    const matchSearch =
      !q ||
      f.title?.toLowerCase().includes(q) ||
      f.code_legacy?.toLowerCase().includes(q) ||
      f.group_name?.toLowerCase().includes(q) ||
      f.location_text?.toLowerCase().includes(q) ||
      f.box_code?.toLowerCase().includes(q)

    const matchGroup = groupFilter === 'todos' || f.group_name === groupFilter
    const matchReview =
      needsReviewFilter === 'todos' ||
      (needsReviewFilter === 'sim' && f.needs_review) ||
      (needsReviewFilter === 'nao' && !f.needs_review)

    return matchSearch && matchGroup && matchReview
  })

  const availableGroups = Array.from(new Set(folders.map((f) => f.group_name).filter(Boolean)))

  const handleSelectAll = () => {
    if (selectedIds.length === filteredFolders.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredFolders.map((f) => f.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const handleTransferToMorto = async () => {
    if (!folderToTransfer) return
    setTransferring(true)
    try {
      await foldersService.moveToArquivoMorto(
        folderToTransfer.id,
        transferLocation,
        transferReason || 'Transferência administrativa para arquivo passivo',
      )
      setTransferModalOpen(false)
      setFolderToTransfer(null)
      setTransferReason('')
      loadFolders()
    } catch (err) {
      console.error('Erro ao transferir pasta:', err)
    } finally {
      setTransferring(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            {archiveType === 'Atual' ? (
              <FolderOpen className="w-6 h-6 text-emerald-600" />
            ) : (
              <Archive className="w-6 h-6 text-slate-700" />
            )}
            {title}
          </h1>
          <p className="text-sm text-slate-500">{description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="border-slate-300 text-xs font-semibold hover:bg-slate-50"
            >
              <Printer className="w-4 h-4 mr-1 text-slate-600" />
              Imprimir ({selectedIds.length}) Etiquetas
            </Button>
          )}

          <Button
            onClick={() => navigate('/pastas?novo=true')}
            className="bg-blue-600 hover:bg-blue-700 text-xs font-semibold shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1" />
            Nova Pasta
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Buscar por código, título ou localização..."
            className="pl-9 text-xs h-9 bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="w-44">
          <Select value={groupFilter} onValueChange={setGroupFilter}>
            <SelectTrigger className="h-9 text-xs bg-white">
              <SelectValue placeholder="Grupo / Titular" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Grupos</SelectItem>
              {availableGroups.map((g) => (
                <SelectItem key={g} value={g as string}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-44">
          <Select value={needsReviewFilter} onValueChange={setNeedsReviewFilter}>
            <SelectTrigger className="h-9 text-xs bg-white">
              <SelectValue placeholder="Revisão da Migração" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Registros</SelectItem>
              <SelectItem value="sim">Necessita Revisão</SelectItem>
              <SelectItem value="nao">Normalizados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(searchTerm || groupFilter !== 'todos' || needsReviewFilter !== 'todos') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchTerm('')
              setGroupFilter('todos')
              setNeedsReviewFilter('todos')
            }}
            className="text-xs text-slate-500 hover:text-slate-800"
          >
            Limpar
          </Button>
        )}

        <div className="ml-auto text-xs text-slate-400 font-medium">
          {filteredFolders.length} pasta(s) listada(s)
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-xs text-slate-400 mt-2">Carregando acervo...</p>
        </div>
      ) : filteredFolders.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs shadow-xs">
          Nenhuma pasta encontrada com os filtros selecionados.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3 w-8">
                    <button
                      onClick={handleSelectAll}
                      className="text-slate-500 hover:text-slate-700"
                    >
                      {selectedIds.length === filteredFolders.length ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4 whitespace-nowrap">Código Legado</th>
                  <th className="py-3 px-4 min-w-[200px]">Título da Pasta</th>
                  <th className="py-3 px-4 whitespace-nowrap">Grupo / Titular</th>
                  <th className="py-3 px-4 whitespace-nowrap">Caixa</th>
                  <th className="py-3 px-4 min-w-[150px]">Localização Física</th>
                  <th className="py-3 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 whitespace-nowrap">Revisão</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFolders.map((folder) => {
                  const isSelected = selectedIds.includes(folder.id)
                  return (
                    <tr
                      key={folder.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <td className="py-3 px-3">
                        <button
                          onClick={() => toggleSelect(folder.id)}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                        {folder.code_legacy || (
                          <span className="text-amber-600 italic">Sem código</span>
                        )}
                      </td>
                      <td
                        className="py-3 px-4 font-semibold text-slate-900 max-w-sm truncate cursor-pointer hover:underline"
                        onClick={() => navigate(`/pastas/${folder.id}`)}
                      >
                        {folder.title}
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {folder.group_name || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {folder.box_code ? (
                          <Badge
                            variant="outline"
                            className="bg-amber-50 text-amber-900 border-amber-200 text-[10px]"
                          >
                            {folder.box_code}
                          </Badge>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td
                        className="py-3 px-4 text-slate-600 max-w-[180px] truncate"
                        title={folder.location_text}
                      >
                        {folder.location_text || '—'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            folder.status === 'No Arquivo'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {folder.status || 'No Arquivo'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {folder.needs_review && (
                          <Badge
                            variant="outline"
                            className="bg-amber-100 text-amber-800 border-amber-300 text-[10px]"
                          >
                            Revisar
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/pastas/${folder.id}`)}
                          className="h-7 px-2 text-xs text-blue-600 hover:text-blue-800"
                        >
                          Abrir
                        </Button>
                        {archiveType === 'Atual' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setFolderToTransfer(folder)
                              setTransferModalOpen(true)
                            }}
                            className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900 border-slate-200"
                          >
                            Mover p/ Morto
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

      <Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Archive className="w-5 h-5 text-slate-700" />
              Transferência para Arquivo Morto
            </DialogTitle>
            <DialogDescription>
              Esta ação registrará o movimento na cadeia de custódia e alterará o status do ciclo de
              vida.
            </DialogDescription>
          </DialogHeader>

          {folderToTransfer && (
            <div className="space-y-4 py-2 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <span className="text-slate-400">Pasta selecionada:</span>
                <p className="font-bold text-slate-900">{folderToTransfer.title}</p>
                <p className="font-mono text-blue-700">
                  Código: {folderToTransfer.code_legacy || 'Sem código'}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Nova Localização Física:</label>
                <Input
                  value={transferLocation}
                  onChange={(e) => setTransferLocation(e.target.value)}
                  placeholder="Ex: Arquivo Central → Sala 02 → Estante A → Prateleira 2"
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Motivo da Transferência:</label>
                <Input
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="Ex: Encerramento do exercício contábil, inatividade ou arquivamento definitivo"
                  className="text-xs h-9"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTransferModalOpen(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              disabled={transferring}
              onClick={handleTransferToMorto}
              className="bg-blue-600 hover:bg-blue-700 text-xs"
            >
              {transferring ? 'Gravando...' : 'Confirmar Transferência'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
