import React, { useState, useEffect } from 'react'
import { Network, Sparkles, MapPin, Folder, ChevronRight, HardDrive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { locationsService, foldersService } from '@/services/api'
import type { ArchiveLocation, Folder as FolderType } from '@/types'

export default function MapaArquivo() {
  const [locations, setLocations] = useState<ArchiveLocation[]>([])
  const [folders, setFolders] = useState<FolderType[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLoc, setSelectedLoc] = useState<ArchiveLocation | null>(null)
  const [suggestion, setSuggestion] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [locs, fList] = await Promise.all([
        locationsService.getAll(),
        foldersService.getAll('', 'code_legacy', 1, 500),
      ])
      setLocations(locs)
      setFolders(fList.items || [])
      if (locs.length > 0) setSelectedLoc(locs[3] || locs[0])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSuggestLocation = () => {
    // Encontra o local com menor ocupação proporcional
    const available = locations.filter((l) => l.type === 'Gaveteiro' || l.type === 'Estante')
    if (available.length === 0) return

    let best = available[0]
    let minRatio = 1

    available.forEach((l) => {
      const cap = l.capacity || 200
      const occ = l.occupied || 0
      const ratio = occ / cap
      if (ratio < minRatio) {
        minRatio = ratio
        best = l
      }
    })

    setSuggestion(
      `Local sugerido com maior disponibilidade: ${best.full_path} (Apenas ${Math.round(minRatio * 100)}% ocupado)`,
    )
    setSelectedLoc(best)
  }

  const locFolders = folders.filter(
    (f) => selectedLoc && f.location_text?.includes(selectedLoc.name),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Network className="w-6 h-6 text-blue-600" />
            Mapa Físico do Arquivo e Capacidade
          </h1>
          <p className="text-sm text-slate-500">
            Hierarquia navegável (Unidade → Sala → Armário/Gaveteiro → Gaveta/Caixa) com percentual
            de ocupação
          </p>
        </div>
        <Button
          onClick={handleSuggestLocation}
          className="bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold shadow-xs"
        >
          <Sparkles className="w-4 h-4 mr-1.5" />
          Sugerir Melhor Localização Disponível
        </Button>
      </div>

      {suggestion && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{suggestion}</span>
          </div>
          <button
            onClick={() => setSuggestion(null)}
            className="text-slate-400 hover:text-slate-700"
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel da Estrutura Física */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-900">
                Estrutura Física Cadastrada (Navegável)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {locations.map((loc) => {
                const cap = loc.capacity || 200
                const occ = loc.occupied || 0
                const pct = Math.min(Math.round((occ / cap) * 100), 100)
                const isSelected = selectedLoc?.id === loc.id

                return (
                  <div
                    key={loc.id}
                    onClick={() => setSelectedLoc(loc)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <HardDrive
                          className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`}
                        />
                        <span className="font-bold text-xs text-slate-900">{loc.name}</span>
                        <span className="text-[10px] text-slate-400">({loc.type})</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-700">
                        {occ} / {cap} ({pct}%)
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

                    <p className="text-[11px] text-slate-400 mt-2 truncate">{loc.full_path}</p>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Painel Lateral com Itens do Local Selecionado */}
        <div className="space-y-4">
          <Card className="shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                Conteúdo do Local Selecionado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {selectedLoc ? (
                <>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="font-bold text-slate-900">{selectedLoc.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{selectedLoc.full_path}</p>
                  </div>

                  <span className="font-semibold text-slate-700 block">
                    Pastas alocadas nesta posição ({locFolders.length}):
                  </span>

                  <div className="space-y-1.5 max-h-[420px] overflow-y-auto">
                    {locFolders.length === 0 ? (
                      <p className="text-slate-400 py-4 text-center">
                        Nenhuma pasta cadastrada com este texto de localização.
                      </p>
                    ) : (
                      locFolders.map((f) => (
                        <div
                          key={f.id}
                          className="p-2 bg-white border border-slate-200 rounded-md flex justify-between gap-2 items-center"
                        >
                          <div className="truncate">
                            <span className="font-bold text-slate-800 truncate block">
                              {f.title}
                            </span>
                            <span className="text-[10px] text-slate-400">{f.group_name}</span>
                          </div>
                          <span className="font-mono text-blue-700 font-bold shrink-0">
                            {f.code_legacy}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <p className="text-slate-400 text-center py-8">
                  Selecione uma posição no mapa para inspecionar.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
