export type Role = 'Administrador' | 'Gestor do Arquivo' | 'Operador' | 'Consulta' | 'Auditor'

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role?: Role
  status?: 'Ativo' | 'Inativo'
  permissions?: string[]
  created: string
  updated: string
}

export interface Company {
  id: string
  name: string
  trade_name?: string
  cnpj?: string
  state_registration?: string
  group_name?: string
  status?: 'Ativa' | 'Inativa'
  capital?: number
  address?: string
  contact?: string
  notes?: string
  has_pendencies?: boolean
  pendency_details?: string
  created: string
  updated: string
}

export interface Person {
  id: string
  name: string
  cpf?: string
  rg?: string
  group_name?: string
  contact?: string
  address?: string
  notes?: string
  created: string
  updated: string
}

export interface ArchiveLocation {
  id: string
  name: string
  code?: string
  type:
    | 'Unidade'
    | 'Sala'
    | 'Armario'
    | 'Gaveteiro'
    | 'Estante'
    | 'Gaveta'
    | 'Prateleira'
    | 'Posicao'
  parent_name?: string
  parent_id?: string
  full_path?: string
  capacity?: number
  occupied?: number
  notes?: string
  created: string
  updated: string
}

export interface Box {
  id: string
  code_legacy: string
  code_current?: string
  name: string
  category?: string
  location_text?: string
  capacity?: number
  status?: 'Ativa' | 'Cheia' | 'Emprestada' | 'Arquivada' | 'Descartada'
  notes?: string
  responsible?: string
  items_summary?: string
  needs_review?: boolean
  review_notes?: string
  created: string
  updated: string
}

export interface Property {
  id: string
  description: string
  type: 'Apartamento' | 'Casa' | 'Lote/Terreno' | 'Vaga de Garagem' | 'Conjunto Comercial' | 'Outro'
  address?: string
  registry_number?: string
  owner_company?: string
  owner_person?: string
  owner_name?: string
  estimated_value?: number
  generates_revenue?: boolean
  revenue_value?: number
  iptu_annual?: number
  iptu_status?: 'Em dia' | 'Pendente' | 'Dívida Ativa'
  condo_monthly?: number
  has_debt?: boolean
  debt_details?: string
  transfer_target?: string
  status?: 'Ativo' | 'Vendido' | 'Em Transferência' | 'Em Reforma'
  notes?: string
  created: string
  updated: string
}

export interface Vehicle {
  id: string
  type?: 'Carro' | 'Moto' | 'Caminhão' | 'Outro'
  brand?: string
  model: string
  year_model?: string
  plate?: string
  renavam?: string
  chassi?: string
  folder_code?: string
  owner_company?: string
  owner_name?: string
  estimated_value?: number
  has_pendencies?: boolean
  pendency_summary?: string
  notes?: string
  created: string
  updated: string
}

export interface VehicleObligation {
  id: string
  vehicle: string
  vehicle_name?: string
  year: number
  licensing_value?: number
  fines_value?: number
  ipva_value?: number
  is_active_debt?: boolean
  status?: 'Pendente' | 'Pago' | 'Dívida Ativa' | 'Isento'
  due_date?: string
  payment_date?: string
  paid_value?: number
  notes?: string
  created: string
  updated: string
}

export interface ProcessItem {
  id: string
  title: string
  number?: string
  parties?: string
  type?: 'Trabalhista' | 'Cível' | 'Tributário' | 'Ativo' | 'Terminado' | 'Outro'
  box_code?: string
  box?: string
  lawyer?: string
  status?: 'Ativo' | 'Terminado' | 'Suspenso' | 'Arquivado'
  notes?: string
  created: string
  updated: string
}

export interface Employee {
  id: string
  name: string
  role?: string
  company_name?: string
  company?: string
  situation?: 'Atual' | 'Ex-funcionário'
  box_code?: string
  box?: string
  notes?: string
  needs_review?: boolean
  created: string
  updated: string
}

export interface Folder {
  id: string
  code_legacy?: string
  code_current?: string
  title: string
  description?: string
  group_name?: string
  company?: string
  person?: string
  property?: string
  vehicle?: string
  process?: string
  employee?: string
  box?: string
  box_code?: string
  category?: string
  subcategory?: string
  archive_type?: 'Atual' | 'Morto'
  status?: 'No Arquivo' | 'Fora do Arquivo' | 'Em Trânsito' | 'Emprestada' | 'Descartada'
  confidentiality?: 'Normal' | 'Interno' | 'Confidencial' | 'Restrito'
  location_text?: string
  location_physical?: string
  responsible?: string
  open_date?: string
  close_date?: string
  retention_period?: string
  expected_disposal_date?: string
  disposal_blocked?: boolean
  cycle_status?:
    | 'Ativo'
    | 'Inativo'
    | 'Arquivo Morto'
    | 'Análise'
    | 'Descarte'
    | 'Guarda Permanente'
  notes?: string
  tags?: string
  import_source?: string
  origin_sheet?: string
  origin_row?: number
  needs_review?: boolean
  review_reason?: string
  deleted?: boolean
  created: string
  updated: string
}

export interface FolderMovement {
  id: string
  folder: string
  folder_title?: string
  folder_code?: string
  type?:
    | 'Retirada'
    | 'Devolução'
    | 'Transferência de Local'
    | 'Transferência para Arquivo Morto'
    | 'Inclusão em Caixa'
    | 'Retirada de Caixa'
  user_name?: string
  origin_location?: string
  destination_location?: string
  reason?: string
  created: string
  updated: string
}

export interface Checkout {
  id: string
  folder: string
  folder_title?: string
  folder_code?: string
  requester_name: string
  purpose?: string
  checkout_date?: string
  expected_return_date?: string
  return_date?: string
  authorized_by?: string
  origin_location?: string
  return_receiver?: string
  status?: 'Ativo' | 'Devolvido' | 'Atrasado'
  notes?: string
  created: string
  updated: string
}

export interface AuditLog {
  id: string
  user_email?: string
  user_name?: string
  record_type: string
  record_id?: string
  action: string
  previous_value?: string
  new_value?: string
  details?: string
  created: string
  updated: string
}

export interface DocumentItem {
  id: string
  title: string
  file?: string
  folder?: string
  company?: string
  vehicle?: string
  property?: string
  type?: string
  ocr_content?: string
  ai_suggestions?: Record<string, unknown>
  created: string
  updated: string
}

export interface MapNodeRecord {
  id: string
  node_key: string
  x: number
  y: number
  node_type?: string
  metadata?: Record<string, unknown>
  created: string
  updated: string
}

export interface MigrationIssue {
  id: string
  code_legacy?: string
  original_content: string
  origin_sheet?: string
  origin_row?: number
  issue_type?:
    | 'sem_codigo'
    | 'codigo_duplicado'
    | 'possivel_duplicidade'
    | 'formato_invalido'
    | 'observacao_detectada'
    | 'vinculo_pendente'
    | 'registro_vazio'
    | 'necessita_decisao'
  description?: string
  status?: 'Pendente' | 'Em Análise' | 'Resolvida' | 'Ignorada'
  resolution_notes?: string
  created: string
  updated: string
}

export interface InventorySession {
  id: string
  title: string
  location_name?: string
  operator_name?: string
  status?: 'Em Andamento' | 'Concluído' | 'Cancelado'
  items_expected?: number
  items_scanned?: number
  discrepancies?: unknown[]
  created: string
  updated: string
}

export interface DisposalRequest {
  id: string
  folder: string
  folder_title?: string
  folder_code?: string
  requester_name?: string
  approver_name?: string
  justification?: string
  status?: 'Pendente' | 'Aprovado' | 'Rejeitado' | 'Executado'
  disposal_certificate?: string
  executed_date?: string
  created: string
  updated: string
}

export interface RetentionRule {
  id: string
  doc_type: string
  retention_years: number
  suggested_action?: 'Descarte' | 'Guarda Permanente' | 'Microfilmagem'
  notes?: string
  created: string
  updated: string
}
