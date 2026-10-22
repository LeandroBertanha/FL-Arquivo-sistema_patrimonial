import React, { useState, useEffect } from 'react'
import { History, Search, Filter, User, Clock, ShieldCheck, FileCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import pb from '@/lib/pocketbase/client'
import type { AuditLog } from '@/types'
import { ViewModeToggle, getStoredViewMode, type ViewMode } from '@/components/ViewModeToggle'

export default function Auditoria() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('todos')
  const [viewMode, setViewMode] = useState<ViewMode>(() => getStoredViewMode('auditoria', 'table'))

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async () => {
    setLoading(true)
    try {
      const res = await pb.collection('audit_logs').getList<AuditLog>(1, 300, {
        sort: '-created',
      })
      setLogs(res.items || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Filtragem
  const filteredLogs = logs.filter((log) => {
    const q = search.toLowerCase()
    const matchQuery =
      !q ||
      log.action?.toLowerCase().includes(q) ||
      log.user_name?.toLowerCase().includes(q) ||
      log.details?.toLowerCase().includes(q) ||
      log.record_id?.toLowerCase().includes(q) ||
      log.record_type?.toLowerCase().includes(q)

    const matchAction =
      actionFilter === 'todos' || log.action?.toLowerCase().includes(actionFilter.toLowerCase())

    return matchQuery && matchAction
  })

  // Cores de Ação
  const getActionBadge = (action: string) => {
    const act = action.toUpperCase()
    if (act.includes('DELETE') || act.includes('EXCLUSAO') || act.includes('DESCARTE')) {
      return (
        <Badge variant="destructive" className="text-[10px]">
          {action}
        </Badge>
      )
    }
    if (act.includes('UPDATE') || act.includes('EDICAO') || act.includes('MODIFIC')) {
      return (
        <Badge
          variant="outline"
          className="text-[10px] bg-amber-50 text-amber-800 border-amber-300"
        >
          {action}
        </Badge>
      )
    }
    if (act.includes('CREATE') || act.includes('CRIACAO') || act.includes('NOVO')) {
      return (
        <Badge
          variant="outline"
          className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-300"
        >
          {action}
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-700">
        {action}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-blue-600" />
            Trilha de Auditoria & Segurança
          </h1>
          <p className="text-sm text-slate-500">
            Registro imutável de todas as ações no acervo: quem, quando, qual entidade e detalhes
          </p>
        </div>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">Eventos Auditados</span>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{logs.length}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">Usuários Distintos</span>
          <p className="text-xl font-bold text-blue-600 mt-0.5">
            {new Set(logs.map((l) => l.user_name || 'Sistema')).size}
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">Integridade da Trilha</span>
          <p className="text-xl font-bold text-emerald-600 mt-0.5 flex items-center gap-1.5">
            <ShieldCheck className="w-5 h-5" /> Ativa & Conectada
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Buscar por usuário, ação, ID de registro ou texto..."
            className="pl-9 text-xs h-9 bg-slate-50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="h-9 border border-slate-200 rounded-md px-3 bg-white text-xs"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="todos">Todas as Ações</option>
            <option value="CREATE">Criações</option>
            <option value="UPDATE">Edições</option>
            <option value="DELETE">Exclusões</option>
            <option value="DESCARTE">Descartes</option>
          </select>

          <span className="text-xs text-slate-400 font-medium">
            {filteredLogs.length} registro(s)
          </span>

          <ViewModeToggle mode={viewMode} onChange={setViewMode} storageKey="auditoria" />
        </div>
      </div>

      {/* Exibição em Tabela ou Cards */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">
          Carregando trilha de auditoria...
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs shadow-xs">
          Nenhum log de auditoria encontrado para os critérios.
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLogs.map((log) => (
            <Card key={log.id} className="shadow-xs hover:border-slate-300 transition-colors">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  {getActionBadge(log.action)}
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(log.created).toLocaleString('pt-BR')}
                  </span>
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 mt-2 truncate">
                  {log.details || log.action}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-1.5 text-xs text-slate-600">
                <p className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Operador: <strong>{log.user_name || 'Sistema'}</strong>
                </p>
                <p className="flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-slate-400" />
                  Entidade: <span className="font-mono">{log.record_type}</span>
                </p>
                {log.record_id && (
                  <p className="font-mono text-[11px] text-slate-400 truncate">
                    ID Registro: {log.record_id}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Data / Hora</th>
                <th className="py-3 px-4">Usuário</th>
                <th className="py-3 px-4">Ação</th>
                <th className="py-3 px-4">Tipo de Registro</th>
                <th className="py-3 px-4">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap font-mono">
                    {new Date(log.created).toLocaleString('pt-BR')}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                    {log.user_name || 'Sistema'}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">{getActionBadge(log.action)}</td>
                  <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                    {log.record_type}
                  </td>
                  <td className="py-3 px-4 text-slate-700 max-w-md truncate" title={log.details}>
                    {log.details || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
