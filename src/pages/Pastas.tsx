import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Folders,
  Plus,
  Printer,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  MapPin,
} from 'lucide-react'
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
import { foldersService, companiesService, boxesService } from '@/services/api'
import type { Folder, Company, Box } from '@/types'

export default function Pastas() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const openNew = searchParams.get('novo') === 'true'

  const [folders, setFolders] = useState<Folder[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [boxes, setBoxes] = useState<Box[]>([])
  const [loading, setLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState('')
  const [archiveFilter, setArchiveFilter] = useState('todos')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [reviewFilter, setReviewFilter] = useState('todos')

  // Modal Nova Pasta
  const [newModalOpen, setNewModalOpen] = useState(openNew)
  const [codeLegacy, setCodeLegacy] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [groupName, setGroupName] = useState('GRUPO VL')
  const [archiveType, setArchiveType] = useState<'Atual' | 'Morto'>('Atual')
  const [category, setCategory] = useState('Societário')
  const [locationText, setLocationText] = useState('Arquivo Central → Sala 01 → Gaveteiro 01')
  const [boxCode, setBoxCode] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [fRes, cRes, bRes] = await Promise.all([
        foldersService.getAll('(deleted = false || deleted = null)', 'code_legacy', 1, 500),
        companiesService.getAll(),
        boxesService.getAll(),
      ])
      setFolders(fRes.items || [])
      setCompanies(cRes || [])
      setBoxes(bRes || [])
    } catch (err) {
      console.error('Erro ao carregar pastas:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await foldersService.create({
        code_legacy: codeLegacy,
        title,
        description,
        group_name: groupName,
        archive_type: archiveType,
        category,
        location_text: locationText,
        box_code: boxCode,
        status: 'No Arquivo',
        confidentiality: 'Normal',
        cycle_status: archiveType === 'Atual' ? 'Ativo' : 'Arquivo Morto',
        responsible: 'Arquivo Central',
      })
      setNewModalOpen(false)
      setTitle('')
      setCodeLegacy('')
      loadData()
    } catch (err) {
      console.error('Erro ao criar pasta:', err)
    } finally {
      setSaving(false)
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

    const matchArchive = archiveFilter === 'todos' || f.archive_type === archiveFilter
    const matchStatus = statusFilter === 'todos' || f.status === statusFilter
    const matchReview =
      reviewFilter === 'todos' ||
      (reviewFilter === 'sim' && f.needs_review) ||
      (reviewFilter === 'nao' && !f.needs_review)

    return matchSearch && matchArchive && matchStatus && matchReview
  })

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Folders className="w-6 h-6 text-blue-600" />
            Gestão Geral de Pastas Físicas
          </h1>
          <p className="text-sm text-slate-500">
            Fichas cadastrais, códigos físicos, vínculos corporativos e cadeia de custódia
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setNewModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-xs font-semibold shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1" />
            Nova Pasta Física
          </Button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Buscar por código, título, empresa, caixa ou localização..."
            className="pl-9 text-xs h-9 bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="w-36">
          <Select value={archiveFilter} onValueChange={setArchiveFilter}>
            <SelectTrigger className="h-9 text-xs bg-white">
              <SelectValue placeholder="Arquivo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Arquivos</SelectItem>
              <SelectItem value="Atual">Arquivo Atual</SelectItem>
              <SelectItem value="Morto">Arquivo Morto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-36">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 text-xs bg-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Status</SelectItem>
              <SelectItem value="No Arquivo">No Arquivo</SelectItem>
              <SelectItem value="Fora do Arquivo">Fora do Arquivo</SelectItem>
              <SelectItem value="Em Trânsito">Em Trânsito</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-36">
          <Select value={reviewFilter} onValueChange={setReviewFilter}>
            <SelectTrigger className="h-9 text-xs bg-white">
              <SelectValue placeholder="Revisão" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas</SelectItem>
              <SelectItem value="sim">Necessita Revisão</SelectItem>
              <SelectItem value="nao">Normalizadas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(searchTerm ||
          archiveFilter !== 'todos' ||
          statusFilter !== 'todos' ||
          reviewFilter !== 'todos') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchTerm('')
              setArchiveFilter('todos')
              setStatusFilter('todos')
              setReviewFilter('todos')
            }}
            className="text-xs text-slate-500 hover:text-slate-800"
          >
            Limpar
          </Button>
        )}

        <div className="ml-auto text-xs text-slate-400 font-medium">
          {filteredFolders.length} pasta(s)
        </div>
      </div>

      {/* Tabela de Pastas Geral */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-xs text-slate-400 mt-2">Carregando acervo de pastas...</p>
        </div>
      ) : filteredFolders.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs shadow-xs">
          Nenhuma pasta física encontrada para os filtros aplicados.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Título da Pasta</th>
                  <th className="py-3 px-4">Grupo / Titular</th>
                  <th className="py-3 px-4">Arquivo</th>
                  <th className="py-3 px-4">Caixa</th>
                  <th className="py-3 px-4">Localização Física</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Revisão</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFolders.map((folder) => (
                  <tr key={folder.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {folder.code_legacy || (
                        <span className="text-amber-600 italic">Sem código</span>
                      )}
                    </td>
                    <td
                      className="py-3 px-4 font-semibold text-slate-900 cursor-pointer hover:underline max-w-sm truncate"
                      onClick={() => navigate(`/pastas/${folder.id}`)}
                    >
                      {folder.title}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {folder.group_name || '—'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          folder.archive_type === 'Atual'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {folder.archive_type}
                      </span>
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
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/pastas/${folder.id}`)}
                        className="h-7 px-2 text-xs text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        Ver Ficha →
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Criar Pasta */}
      <Dialog open={newModalOpen} onOpenChange={setNewModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Folders className="w-5 h-5 text-blue-600" />
              Cadastrar Nova Pasta Física
            </DialogTitle>
            <DialogDescription>
              Preencha os identificadores físicos e localização no arquivo
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateFolder} className="space-y-3 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">
                  Código Físico (Legado ou Atual)
                </label>
                <Input
                  placeholder="Ex: N14, N21, N8/16..."
                  value={codeLegacy}
                  onChange={(e) => setCodeLegacy(e.target.value)}
                  className="text-xs h-9 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Arquivo de Destino</label>
                <Select value={archiveType} onValueChange={(v: any) => setArchiveType(v)}>
                  <SelectTrigger className="h-9 text-xs bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Atual">Arquivo Atual (Corrente)</SelectItem>
                    <SelectItem value="Morto">Arquivo Morto (Passivo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Título da Pasta *</label>
              <Input
                required
                placeholder="Ex: GRUPO VL CONTRATOS 2026, IMPOSTOS CAPANNONE..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Grupo / Empresa</label>
                <Input
                  placeholder="Ex: GRUPO VL, CAPANNONE, PESSOAIS..."
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Categoria Documental</label>
                <Input
                  placeholder="Ex: Societário, Contas, IR..."
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Localização Física Completa</label>
              <Input
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                placeholder="Ex: Arquivo Central → Sala 01 → Gaveteiro 02 → Gaveta 03"
                className="text-xs h-9"
              />
            </div>

            {archiveType === 'Morto' && (
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Caixa Vinculada (Opcional)</label>
                <select
                  className="w-full h-9 border border-slate-200 rounded-md px-3 bg-white text-xs"
                  value={boxCode}
                  onChange={(e) => setBoxCode(e.target.value)}
                >
                  <option value="">Nenhuma caixa</option>
                  {boxes.map((b) => (
                    <option key={b.id} value={b.code_legacy}>
                      {b.code_legacy} - {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <DialogFooter className="pt-3">
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
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-xs font-semibold"
              >
                {saving ? 'Gravando...' : 'Cadastrar Pasta'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
