import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Printer,
  QrCode,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Folder,
  FileText,
  History,
  Shield,
  Building2,
  Car,
  Home,
  User,
  Scale,
  Edit,
  ArrowRightLeft,
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
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { foldersService, movementsService } from '@/services/api'
import type { Folder as FolderType, FolderMovement } from '@/types'
import { QRCodeSVG } from 'qrcode.react'

export default function PastaDetalhe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [folder, setFolder] = useState<FolderType | null>(null)
  const [movements, setMovements] = useState<FolderMovement[]>([])
  const [loading, setLoading] = useState(true)

  // Modal Check-out
  const [checkoutModal, setCheckoutModal] = useState(false)
  const [requesterName, setRequesterName] = useState('')
  const [purpose, setPurpose] = useState('Consulta interna / Auditoria')
  const [expectedReturnDate, setExpectedReturnDate] = useState('')
  const [checkingOut, setCheckingOut] = useState(false)

  // Modal Check-in
  const [checkinModal, setCheckinModal] = useState(false)
  const [returnReceiver, setReturnReceiver] = useState('Arquivo Central')
  const [newLocText, setNewLocText] = useState('')
  const [checkingIn, setCheckingIn] = useState(false)

  // Modal Edição Rápida
  const [editModal, setEditModal] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editCode, setEditCode] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editReason, setEditReason] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  useEffect(() => {
    if (id) loadData(id)
  }, [id])

  const loadData = async (folderId: string) => {
    setLoading(true)
    try {
      const f = await foldersService.getById(folderId)
      setFolder(f)
      setEditTitle(f.title)
      setEditCode(f.code_legacy || '')
      setEditLocation(f.location_text || '')
      setNewLocText(f.location_text || 'Arquivo Central → Sala 01 → Gaveteiro 01')

      // Movimentações da pasta
      const movs = await movementsService.getAll(`folder = '${folderId}'`, '-created')
      setMovements(movs)
    } catch (err) {
      console.error('Erro ao carregar pasta:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!folder) return
    setCheckingOut(true)
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
      setCheckoutModal(false)
      setRequesterName('')
      if (id) loadData(id)
    } catch (err) {
      console.error('Erro no check-out:', err)
    } finally {
      setCheckingOut(false)
    }
  }

  const handleCheckinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!folder) return
    setCheckingIn(true)
    try {
      await movementsService.createMovement({
        folder: folder.id,
        folder_title: folder.title,
        folder_code: folder.code_legacy || '',
        type: 'Devolução',
        user_name: returnReceiver,
        origin_location: 'Fora do Arquivo',
        destination_location: newLocText,
        reason: 'Check-in de retorno ao arquivo físico',
      })
      await foldersService.update(
        folder.id,
        {
          status: 'No Arquivo',
          location_text: newLocText,
        },
        `Retorno da pasta ao arquivo físico por ${returnReceiver}`,
      )
      setCheckinModal(false)
      if (id) loadData(id)
    } catch (err) {
      console.error('Erro no check-in:', err)
    } finally {
      setCheckingIn(false)
    }
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!folder) return
    setSavingEdit(true)
    try {
      await foldersService.update(
        folder.id,
        {
          title: editTitle,
          code_legacy: editCode,
          location_text: editLocation,
        },
        editReason || 'Atualização cadastral',
      )
      setEditModal(false)
      if (id) loadData(id)
    } catch (err) {
      console.error('Erro ao editar pasta:', err)
    } finally {
      setSavingEdit(false)
    }
  }

  if (loading || !folder) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-xs text-slate-400 mt-2">Carregando ficha da pasta...</p>
      </div>
    )
  }

  const isCheckedOut = folder.status === 'Fora do Arquivo'

  return (
    <div className="space-y-6">
      {/* Botão Voltar */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="text-xs text-slate-600 hover:text-slate-900 -ml-2"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Voltar
      </Button>

      {/* Banner de Check-out se fora do arquivo */}
      {isCheckedOut ? (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-red-600 shrink-0" />
            <div>
              <h3 className="font-bold text-sm">PASTA FORA DO ARQUIVO FÍSICO</h3>
              <p className="text-xs text-red-800 mt-0.5">
                Esta pasta está em posse de terceiros para consulta ou processo jurídico.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setCheckinModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
          >
            Registrar Retorno (Check-in)
          </Button>
        </div>
      ) : (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <h3 className="font-bold text-xs">PASTA PRESENTE NO ARQUIVO FÍSICO</h3>
              <p className="text-[11px] text-emerald-800">
                Disponível para consulta e retirada imediata no local cadastrado.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setCheckoutModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs"
          >
            Registrar Saída (Check-out)
          </Button>
        </div>
      )}

      {/* Cartão de Identificação Principal */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row justify-between gap-6">
        <div className="space-y-4 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-base font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded border border-blue-200">
              {folder.code_legacy || 'SEM CÓDIGO'}
            </span>
            <Badge
              variant="outline"
              className={`text-xs ${
                folder.archive_type === 'Atual'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-slate-100 text-slate-800 border-slate-200'
              }`}
            >
              {folder.archive_type === 'Atual' ? 'Arquivo Atual (Corrente)' : 'Arquivo Morto'}
            </Badge>
            <Badge variant="outline" className="text-xs text-slate-700">
              {folder.category || 'Geral'}
            </Badge>
            {folder.needs_review && (
              <Badge
                variant="outline"
                className="bg-amber-100 text-amber-900 border-amber-300 text-xs"
              >
                Inconsistência da Planilha
              </Badge>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">{folder.title}</h1>
            {folder.description && (
              <p className="text-xs text-slate-500 mt-1">{folder.description}</p>
            )}
          </div>

          {/* Trilha de Localização Breadcrumb em Destaque */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Trilha Física Exata no Arquivo:
            </span>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-900">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{folder.location_text || 'Arquivo Central → Sala 01 → Gaveteiro 01'}</span>
            </div>
          </div>

          {/* Dados rápidos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600 pt-1">
            <div>
              <span className="text-slate-400 block text-[10px]">GRUPO / TITULAR</span>
              <strong className="text-slate-800">{folder.group_name || '—'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">CAIXA FÍSICA</span>
              <strong className="text-amber-800">{folder.box_code || 'Avulsa'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">RESPONSÁVEL</span>
              <strong className="text-slate-800">{folder.responsible || 'Arquivo'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">CONFIDENCIALIDADE</span>
              <strong className="text-slate-800">{folder.confidentiality || 'Normal'}</strong>
            </div>
          </div>
        </div>

        {/* QR Code e Ações Rápidas */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl shrink-0 space-y-2 text-center min-w-[180px]">
          <QRCodeSVG value={`FL-PASTA:${folder.id}:${folder.code_legacy}`} size={96} />
          <span className="font-mono text-xs font-bold text-slate-700">
            {folder.code_legacy || 'FL-PASTA'}
          </span>
          <div className="flex gap-2 w-full pt-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.print()}
              className="text-xs h-7 flex-1 border-slate-300"
            >
              <Printer className="w-3.5 h-3.5 mr-1" />
              Etiqueta
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditModal(true)}
              className="text-xs h-7 flex-1 border-slate-300"
            >
              <Edit className="w-3.5 h-3.5 mr-1" />
              Editar
            </Button>
          </div>
        </div>
      </div>

      {/* Abas da Ficha Completa */}
      <Tabs defaultValue="identificacao" className="w-full">
        <TabsList className="bg-white border border-slate-200 p-1 rounded-xl h-auto flex flex-wrap gap-1 shadow-xs">
          <TabsTrigger value="identificacao" className="text-xs font-semibold">
            Identificação
          </TabsTrigger>
          <TabsTrigger value="vinculos" className="text-xs font-semibold">
            Vínculos Corporativos
          </TabsTrigger>
          <TabsTrigger value="localizacao" className="text-xs font-semibold">
            Localização e Trilha
          </TabsTrigger>
          <TabsTrigger value="retencao" className="text-xs font-semibold">
            Retenção e Descarte
          </TabsTrigger>
          <TabsTrigger value="documentos" className="text-xs font-semibold">
            Documentos Digitais
          </TabsTrigger>
          <TabsTrigger value="historico" className="text-xs font-semibold">
            Cadeia de Custódia ({movements.length})
          </TabsTrigger>
        </TabsList>

        {/* Aba Identificação */}
        <TabsContent value="identificacao">
          <Card className="shadow-xs">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-slate-900">
                Identificação Físico-Cadastral
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    ID Interno (UUID imutável)
                  </span>
                  <span className="font-mono text-slate-700 select-all">{folder.id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Código Físico Legado</span>
                  <span className="font-mono font-bold text-blue-700">
                    {folder.code_legacy || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Origem da Importação</span>
                  <span className="text-slate-700">
                    {folder.import_source || 'PASTAS NUMERACAO.xlsx'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Guia e Linha de Origem</span>
                  <span className="text-slate-700">
                    {folder.origin_sheet || 'ARQUIVO ATUAL'} — Linha {folder.origin_row || '—'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-slate-400 block text-[11px]">Status do Ciclo</span>
                  <Badge variant="outline" className="text-xs font-semibold">
                    {folder.cycle_status || 'Ativo'}
                  </Badge>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Nível de Confidencialidade
                  </span>
                  <span className="text-slate-700">{folder.confidentiality || 'Normal'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Observações / Notas</span>
                  <span className="text-slate-700">
                    {folder.notes || 'Nenhuma observação informada.'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Vínculos */}
        <TabsContent value="vinculos">
          <Card className="shadow-xs">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-slate-900">
                Vínculos Corporativos e Patrimoniais
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-400 block text-[10px] flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" /> EMPRESA / GRUPO
                </span>
                <span className="font-bold text-slate-900 mt-1 block">
                  {folder.group_name || 'Nenhuma'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-400 block text-[10px] flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> PESSOA FÍSICA
                </span>
                <span className="font-bold text-slate-900 mt-1 block">
                  {folder.person ? 'Pessoa Vinculada' : 'Nenhuma'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-400 block text-[10px] flex items-center gap-1">
                  <Car className="w-3.5 h-3.5" /> VEÍCULO
                </span>
                <span className="font-bold text-slate-900 mt-1 block">
                  {folder.vehicle ? 'Veículo Vinculado' : 'Nenhum'}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Localização */}
        <TabsContent value="localizacao">
          <Card className="shadow-xs">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-slate-900">
                Hierarquia Física de Armazenamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-2">
                <span className="text-xs font-bold text-blue-900">Rastreamento Físico:</span>
                <p className="text-sm font-semibold text-slate-800">
                  {folder.location_text || 'Arquivo Central → Sala 01 → Gaveteiro 01'}
                </p>
                <p className="text-[11px] text-slate-500">
                  Para alterar a posição física desta pasta, use o botão de edição ou registre uma
                  movimentação de transferência.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Retenção */}
        <TabsContent value="retencao">
          <Card className="shadow-xs">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-slate-900">
                Regras de Temporalidade e Descarte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 border border-slate-200 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">PRAZO DE GUARDA</span>
                  <span className="font-bold text-slate-900">
                    {folder.retention_period || '5 anos (Padrão)'}
                  </span>
                </div>
                <div className="p-3 border border-slate-200 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">
                    BLOQUEIO DE DESCARTE (LEGAL HOLD)
                  </span>
                  <Badge
                    variant="outline"
                    className={`mt-1 text-[10px] ${
                      folder.disposal_blocked
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {folder.disposal_blocked ? 'Bloqueado (Legal Hold)' : 'Desbloqueado'}
                  </Badge>
                </div>
                <div className="p-3 border border-slate-200 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">STATUS NO CICLO DE VIDA</span>
                  <span className="font-bold text-slate-900">{folder.cycle_status || 'Ativo'}</span>
                </div>
              </div>
              <p className="text-slate-400 text-[11px] pt-2">
                * Conforme as regras do sistema de Gestão Patrimonial, nenhum documento ou pasta
                física pode ser descartado sem aprovação humana formal e emissão de termo de
                descarte.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Documentos Digitais */}
        <TabsContent value="documentos">
          <Card className="shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-900">
                Documentos Digitais e Anexos Vinculados
              </CardTitle>
              <Button size="sm" variant="outline" className="text-xs">
                Anexar Documento
              </Button>
            </CardHeader>
            <CardContent className="text-center py-8 text-xs text-slate-400">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              Nenhum documento digital anexado a esta pasta no momento.
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Histórico / Cadeia de Custódia */}
        <TabsContent value="historico">
          <Card className="shadow-xs">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-slate-900">
                Timeline da Cadeia de Custódia
              </CardTitle>
            </CardHeader>
            <CardContent>
              {movements.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  Nenhuma movimentação registrada para esta pasta.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 text-xs">
                  {movements.map((m) => (
                    <div key={m.id} className="py-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-blue-50 text-blue-700 border-blue-200"
                        >
                          {m.type}
                        </Badge>
                        <span className="text-[10px] text-slate-400">
                          {new Date(m.created).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="font-medium text-slate-800">
                        {m.origin_location} → <strong>{m.destination_location}</strong>
                      </p>
                      <p className="text-slate-500">
                        Operador: {m.user_name || 'Sistema'}{' '}
                        {m.reason ? `— Motivo: ${m.reason}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Check-out */}
      <Dialog open={checkoutModal} onOpenChange={setCheckoutModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Registrar Retirada Física (Check-out)
            </DialogTitle>
            <DialogDescription>
              A pasta ficará marcada como "FORA DO ARQUIVO" até o retorno.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCheckoutSubmit} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Nome de quem está retirando *</label>
              <Input
                required
                placeholder="Ex: Dr. Sergio Nunes, Fabio Rogerio, Nadia..."
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">
                Finalidade / Motivo da Retirada
              </label>
              <Input
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Ex: Análise contratual, audiência trabalhista..."
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Previsão de Devolução</label>
              <Input
                type="date"
                value={expectedReturnDate}
                onChange={(e) => setExpectedReturnDate(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCheckoutModal(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={checkingOut}
                className="bg-blue-600 hover:bg-blue-700 text-xs"
              >
                {checkingOut ? 'Registrando...' : 'Confirmar Saída'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Check-in */}
      <Dialog open={checkinModal} onOpenChange={setCheckinModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Registrar Devolução Física (Check-in)
            </DialogTitle>
            <DialogDescription>
              Confirme o retorno físico da pasta e atualize sua localização no arquivo.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCheckinSubmit} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">
                Recebido por (Operador/Responsável) *
              </label>
              <Input
                required
                value={returnReceiver}
                onChange={(e) => setReturnReceiver(e.target.value)}
                placeholder="Ex: Arquivo Central / Operador"
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Localização Física de Retorno</label>
              <Input
                required
                value={newLocText}
                onChange={(e) => setNewLocText(e.target.value)}
                placeholder="Ex: Arquivo Central → Sala 01 → Gaveteiro 01 → Gaveta 02"
                className="text-xs h-9"
              />
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCheckinModal(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={checkingIn}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                {checkingIn ? 'Confirmando...' : 'Confirmar Retorno ao Arquivo'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Edição Rápida */}
      <Dialog open={editModal} onOpenChange={setEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base text-slate-900">Editar Dados da Pasta</DialogTitle>
            <DialogDescription className="text-xs">
              Todas as alterações geram registro na cadeia de auditoria
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Código Legado / Identificador</label>
              <Input
                value={editCode}
                onChange={(e) => setEditCode(e.target.value)}
                className="text-xs h-9 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Título da Pasta</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Localização Física</label>
              <Input
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Motivo da Alteração</label>
              <Input
                placeholder="Ex: Correção de dígito, renomeação de empresa"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditModal(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={savingEdit}
                className="bg-blue-600 hover:bg-blue-700 text-xs"
              >
                {savingEdit ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
