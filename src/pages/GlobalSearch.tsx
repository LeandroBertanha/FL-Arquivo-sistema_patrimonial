import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Search,
  Folder,
  Box as BoxIcon,
  Car,
  Home,
  Building2,
  Scale,
  MapPin,
  ExternalLink,
  Filter,
  CheckCircle2,
  AlertTriangle,
  QrCode,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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
} from '@/components/ui/dialog'
import {
  foldersService,
  boxesService,
  vehiclesService,
  propertiesService,
  companiesService,
  processesService,
} from '@/services/api'
import type {
  Folder as FolderType,
  Box as BoxType,
  Vehicle,
  Property,
  Company,
  ProcessItem,
} from '@/types'
import { QRCodeSVG } from 'qrcode.react'

interface SearchResultItem {
  id: string
  title: string
  code?: string
  type: 'Pasta' | 'Caixa' | 'Veículo' | 'Imóvel' | 'Empresa' | 'Processo'
  group?: string
  status?: string
  archiveType?: string
  boxCode?: string
  location?: string
  responsible?: string
  raw: any
}

export default function GlobalSearch() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryParam = searchParams.get('q') || ''

  const [query, setQuery] = useState(queryParam)
  const [typeFilter, setTypeFilter] = useState<string>('todos')
  const [archiveFilter, setArchiveFilter] = useState<string>('todos')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchResultItem[]>([])

  // Modal de localização da pasta selecionada
  const [selectedFolder, setSelectedFolder] = useState<FolderType | null>(null)
  const [locModalOpen, setLocModalOpen] = useState(false)

  useEffect(() => {
    setQuery(queryParam)
    performSearch(queryParam)
  }, [queryParam])

  const performSearch = async (searchTerm: string) => {
    setLoading(true)
    try {
      const q = searchTerm.toLowerCase().trim()

      const [foldersRes, boxesRes, vehiclesRes, propertiesRes, companiesRes, processesRes] =
        await Promise.all([
          foldersService.getAll('', '-created', 1, 500),
          boxesService.getAll(),
          vehiclesService.getAll(),
          propertiesService.getAll(),
          companiesService.getAll(),
          processesService.getAll(),
        ])

      const items: SearchResultItem[] = []

      // 1. Pastas
      foldersRes.items?.forEach((f) => {
        const match =
          !q ||
          f.title?.toLowerCase().includes(q) ||
          f.code_legacy?.toLowerCase().includes(q) ||
          f.group_name?.toLowerCase().includes(q) ||
          f.location_text?.toLowerCase().includes(q) ||
          f.box_code?.toLowerCase().includes(q) ||
          f.category?.toLowerCase().includes(q) ||
          f.notes?.toLowerCase().includes(q)

        if (match) {
          items.push({
            id: f.id,
            title: f.title,
            code: f.code_legacy || 'Sem código',
            type: 'Pasta',
            group: f.group_name || 'Geral',
            status: f.status || 'No Arquivo',
            archiveType: f.archive_type || 'Atual',
            boxCode: f.box_code,
            location: f.location_text || 'Arquivo Central',
            responsible: f.responsible || 'Responsável Geral',
            raw: f,
          })
        }
      })

      // 2. Caixas
      boxesRes?.forEach((b) => {
        const match =
          !q ||
          b.name?.toLowerCase().includes(q) ||
          b.code_legacy?.toLowerCase().includes(q) ||
          b.category?.toLowerCase().includes(q) ||
          b.location_text?.toLowerCase().includes(q)

        if (match) {
          items.push({
            id: b.id,
            title: b.name,
            code: b.code_legacy,
            type: 'Caixa',
            group: b.category || 'Arquivo Morto',
            status: b.status || 'Ativa',
            archiveType: 'Morto',
            location: b.location_text,
            responsible: b.responsible,
            raw: b,
          })
        }
      })

      // 3. Veículos
      vehiclesRes?.forEach((v) => {
        const match =
          !q ||
          v.model?.toLowerCase().includes(q) ||
          v.plate?.toLowerCase().includes(q) ||
          v.renavam?.toLowerCase().includes(q) ||
          v.chassi?.toLowerCase().includes(q) ||
          v.folder_code?.toLowerCase().includes(q) ||
          v.owner_name?.toLowerCase().includes(q)

        if (match) {
          items.push({
            id: v.id,
            title: `${v.model} (${v.plate || 'Sem placa'})`,
            code: v.folder_code || v.plate,
            type: 'Veículo',
            group: v.owner_name || 'Veículos',
            status: v.has_pendencies ? 'Pendências' : 'Regular',
            location: v.folder_code ? `Pasta Física ${v.folder_code}` : 'Não informada',
            raw: v,
          })
        }
      })

      // 4. Imóveis
      propertiesRes?.forEach((p) => {
        const match =
          !q ||
          p.description?.toLowerCase().includes(q) ||
          p.address?.toLowerCase().includes(q) ||
          p.owner_name?.toLowerCase().includes(q)

        if (match) {
          items.push({
            id: p.id,
            title: p.description,
            code: p.type,
            type: 'Imóvel',
            group: p.owner_name || 'Patrimônio',
            status: p.status,
            location: p.address,
            raw: p,
          })
        }
      })

      // 5. Empresas
      companiesRes?.forEach((c) => {
        const match =
          !q ||
          c.name?.toLowerCase().includes(q) ||
          c.trade_name?.toLowerCase().includes(q) ||
          c.cnpj?.toLowerCase().includes(q) ||
          c.group_name?.toLowerCase().includes(q)

        if (match) {
          items.push({
            id: c.id,
            title: c.name,
            code: c.cnpj || c.group_name,
            type: 'Empresa',
            group: c.group_name,
            status: c.status,
            raw: c,
          })
        }
      })

      // 6. Processos
      processesRes?.forEach((pr) => {
        const match =
          !q ||
          pr.title?.toLowerCase().includes(q) ||
          pr.number?.toLowerCase().includes(q) ||
          pr.box_code?.toLowerCase().includes(q)

        if (match) {
          items.push({
            id: pr.id,
            title: pr.title,
            code: pr.box_code,
            type: 'Processo',
            group: pr.type,
            status: pr.status,
            boxCode: pr.box_code,
            location: pr.box_code ? `Caixa ${pr.box_code}` : 'Arquivo Jurídico',
            raw: pr,
          })
        }
      })

      setResults(items)
    } catch (err) {
      console.error('Erro na pesquisa global:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchParams({ q: query.trim() })
  }

  const handleLocalize = (item: SearchResultItem) => {
    if (item.type === 'Pasta') {
      setSelectedFolder(item.raw as FolderType)
      setLocModalOpen(true)
    } else if (item.type === 'Caixa') {
      navigate(`/caixas/${item.id}`)
    } else if (item.type === 'Veículo') {
      navigate(`/veiculos`)
    } else if (item.type === 'Imóvel') {
      navigate(`/imoveis`)
    } else if (item.type === 'Empresa') {
      navigate(`/empresas`)
    } else if (item.type === 'Processo') {
      navigate(`/processos`)
    }
  }

  // Filtragem local por tipo e arquivo
  const filteredResults = results.filter((r) => {
    if (typeFilter !== 'todos' && r.type !== typeFilter) return false
    if (archiveFilter !== 'todos' && r.archiveType !== archiveFilter) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Pesquisa Global Unificada
        </h1>
        <p className="text-sm text-slate-500">
          Localize qualquer pasta, caixa, veículo, imóvel, processo ou obrigação instantaneamente
        </p>
      </div>

      {/* Caixa de Busca com Filtros */}
      <Card className="shadow-xs border-slate-200">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Ex: N1, N4/01, FFL-4D33, Camurujipe, Acapulco, Auto&Co, CX N8..."
                className="pl-11 h-12 text-base bg-slate-50 focus-visible:ring-blue-500"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-sm font-semibold"
            >
              Pesquisar
            </Button>
          </form>

          {/* Filtros em linha */}
          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-600">
            <span className="flex items-center gap-1 font-semibold text-slate-700">
              <Filter className="w-3.5 h-3.5" /> Filtrar por:
            </span>

            <div className="w-36">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-8 text-xs bg-white">
                  <SelectValue placeholder="Tipo de Registro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Tipos</SelectItem>
                  <SelectItem value="Pasta">Pastas</SelectItem>
                  <SelectItem value="Caixa">Caixas</SelectItem>
                  <SelectItem value="Veículo">Veículos</SelectItem>
                  <SelectItem value="Imóvel">Imóveis</SelectItem>
                  <SelectItem value="Empresa">Empresas</SelectItem>
                  <SelectItem value="Processo">Processos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-36">
              <Select value={archiveFilter} onValueChange={setArchiveFilter}>
                <SelectTrigger className="h-8 text-xs bg-white">
                  <SelectValue placeholder="Arquivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Arquivos</SelectItem>
                  <SelectItem value="Atual">Arquivo Atual</SelectItem>
                  <SelectItem value="Morto">Arquivo Morto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(typeFilter !== 'todos' || archiveFilter !== 'todos' || query) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTypeFilter('todos')
                  setArchiveFilter('todos')
                  setQuery('')
                  setSearchParams({})
                }}
                className="h-8 text-xs text-slate-500 hover:text-slate-800"
              >
                Limpar Filtros
              </Button>
            )}

            <div className="ml-auto text-xs text-slate-400">
              {filteredResults.length} resultado(s) encontrado(s)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-xs text-slate-400 mt-2">Buscando em todo o banco de dados...</p>
        </div>
      ) : filteredResults.length === 0 ? (
        <Card className="text-center py-16 shadow-xs border-dashed">
          <CardContent className="space-y-3">
            <Search className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-semibold text-slate-700">Nenhum registro encontrado</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Ajuste os filtros ou tente outro termo (ex: placa do veículo, código legado da pasta,
              nome da empresa ou caixa).
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Título / Descrição</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Grupo / Categoria</th>
                  <th className="py-3 px-4">Arquivo</th>
                  <th className="py-3 px-4">Caixa</th>
                  <th className="py-3 px-4">Localização Física</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredResults.map((item) => (
                  <tr
                    key={`${item.type}-${item.id}`}
                    className="hover:bg-blue-50/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {item.code || '—'}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 max-w-xs truncate">
                      {item.title}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold ${
                          item.type === 'Pasta'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : item.type === 'Caixa'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : item.type === 'Veículo'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : item.type === 'Imóvel'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {item.type}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {item.group || '—'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {item.archiveType ? (
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.archiveType === 'Atual'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.archiveType}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {item.boxCode ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-amber-50 text-amber-900 border-amber-200"
                        >
                          {item.boxCode}
                        </Badge>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td
                      className="py-3 px-4 text-slate-600 max-w-[200px] truncate"
                      title={item.location}
                    >
                      {item.location || '—'}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Button
                        size="sm"
                        onClick={() => handleLocalize(item)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-7 px-3 shadow-xs"
                      >
                        <MapPin className="w-3.5 h-3.5 mr-1" />
                        LOCALIZAR
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Ficha e Trilha Física da Pasta */}
      <Dialog open={locModalOpen} onOpenChange={setLocModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 text-base">
              <Folder className="w-5 h-5 text-blue-600" />
              Ficha de Localização Física da Pasta
            </DialogTitle>
            <DialogDescription>
              Informações completas para retirada, identificação e controle de custódia
            </DialogDescription>
          </DialogHeader>

          {selectedFolder && (
            <div className="space-y-4 py-2">
              {/* Banner de status */}
              {selectedFolder.status === 'Fora do Arquivo' ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-900 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>PASTA FORA DO ARQUIVO — Em check-out de consulta</span>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>PASTA DISPONÍVEL NO ARQUIVO FÍSICO</span>
                </div>
              )}

              {/* Trilha de Localização Breadcrumb */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Trilha Física Exata:
                </span>
                <p className="text-xs font-semibold text-blue-900 leading-relaxed">
                  {selectedFolder.location_text || 'Arquivo Central → Sala 01 → Gaveteiro 01'}
                </p>
              </div>

              {/* Detalhes da Pasta */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-white border border-slate-200 rounded-md">
                  <span className="text-slate-400 block text-[10px]">CÓDIGO LEGADO</span>
                  <span className="font-mono font-bold text-blue-700 text-sm">
                    {selectedFolder.code_legacy || 'SEM CÓDIGO'}
                  </span>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-md">
                  <span className="text-slate-400 block text-[10px]">ARQUIVO</span>
                  <span className="font-semibold text-slate-800">
                    {selectedFolder.archive_type === 'Atual'
                      ? 'Arquivo Atual (Corrente)'
                      : 'Arquivo Morto'}
                  </span>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-md">
                  <span className="text-slate-400 block text-[10px]">GRUPO / TITULAR</span>
                  <span className="font-semibold text-slate-800">
                    {selectedFolder.group_name || '—'}
                  </span>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-md">
                  <span className="text-slate-400 block text-[10px]">CAIXA VINCULADA</span>
                  <span className="font-semibold text-amber-800">
                    {selectedFolder.box_code || 'Nenhuma (Pastas suspensas)'}
                  </span>
                </div>
              </div>

              {/* QR Code de Identificação Física */}
              <div className="p-4 border border-slate-200 rounded-lg flex items-center justify-between gap-4 bg-slate-50/50">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Etiqueta e Código QR</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Utilize o leitor móvel para identificação rápida no armário/gaveteiro.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.print()}
                    className="mt-3 text-xs h-7 border-slate-300"
                  >
                    Imprimir Etiqueta
                  </Button>
                </div>
                <div className="p-2 bg-white border border-slate-200 rounded-lg shrink-0">
                  <QRCodeSVG
                    value={`FL-PASTA:${selectedFolder.id}:${selectedFolder.code_legacy}`}
                    size={72}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocModalOpen(false)}
                  className="text-xs"
                >
                  Fechar
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setLocModalOpen(false)
                    navigate(`/pastas/${selectedFolder.id}`)
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-xs"
                >
                  Abrir Ficha Completa
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
