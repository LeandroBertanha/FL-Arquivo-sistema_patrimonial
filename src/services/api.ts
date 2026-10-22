import pb from '@/lib/pocketbase/client'
import type {
  Folder,
  Box,
  Company,
  Person,
  Property,
  Vehicle,
  VehicleObligation,
  ProcessItem,
  Employee,
  FolderMovement,
  Checkout,
  AuditLog,
  ArchiveLocation,
  MigrationIssue,
  DisposalRequest,
  RetentionRule,
  MapNodeRecord,
  InventorySession,
  DocumentItem,
  User,
} from '@/types'

// Helper para log de auditoria automático
export async function logAudit(
  action: string,
  recordType: string,
  recordId: string,
  details: string,
  prevValue?: string,
  newValue?: string,
) {
  try {
    const authUser = pb.authStore.model
    await pb.collection('audit_logs').create({
      user_email: authUser?.email || 'sistema',
      user_name: authUser?.name || 'Sistema FL',
      record_type: recordType,
      record_id: recordId,
      action,
      previous_value: prevValue || '',
      new_value: newValue || '',
      details,
    })
  } catch (err) {
    console.error('Falha ao registrar log de auditoria:', err)
  }
}

// ================= PASTAS =================
export const foldersService = {
  async getAll(filter = '', sort = '-created', page = 1, perPage = 200) {
    return pb.collection('folders').getList<Folder>(page, perPage, {
      filter,
      sort,
      expand: 'company,person,property,vehicle,process,employee,box,location_physical',
    })
  },
  async getById(id: string) {
    return pb.collection('folders').getOne<Folder>(id, {
      expand: 'company,person,property,vehicle,process,employee,box,location_physical',
    })
  },
  async create(data: Partial<Folder>) {
    const rec = await pb.collection('folders').create<Folder>(data)
    await logAudit(
      'CRIACAO_PASTA',
      'folder',
      rec.id,
      `Pasta criada: ${rec.title} (${rec.code_legacy || 'Sem código'})`,
    )
    return rec
  },
  async update(id: string, data: Partial<Folder>, reason = '') {
    const old = await pb.collection('folders').getOne<Folder>(id)
    const rec = await pb.collection('folders').update<Folder>(id, data)
    await logAudit(
      'EDICAO_PASTA',
      'folder',
      id,
      reason || `Pasta atualizada: ${rec.title}`,
      JSON.stringify({
        location: old.location_text,
        status: old.status,
        archive: old.archive_type,
      }),
      JSON.stringify({
        location: rec.location_text,
        status: rec.status,
        archive: rec.archive_type,
      }),
    )
    return rec
  },
  async softDelete(id: string) {
    const old = await pb.collection('folders').getOne<Folder>(id)
    const rec = await pb.collection('folders').update<Folder>(id, { deleted: true })
    await logAudit(
      'EXCLUSAO_LOGICA',
      'folder',
      id,
      `Pasta marcada como excluída (soft-delete): ${old.title}`,
    )
    return rec
  },
  async moveToArquivoMorto(id: string, newLocation: string, reason: string) {
    const old = await pb.collection('folders').getOne<Folder>(id)
    const updated = await pb.collection('folders').update<Folder>(id, {
      archive_type: 'Morto',
      cycle_status: 'Arquivo Morto',
      location_text: newLocation || 'Arquivo Central → Sala 02',
    })
    // Registra movimentação
    await pb.collection('folder_movements').create({
      folder: id,
      folder_title: old.title,
      folder_code: old.code_legacy || '',
      type: 'Transferência para Arquivo Morto',
      user_name: pb.authStore.model?.name || 'Usuário',
      origin_location: old.location_text || 'Arquivo Atual',
      destination_location: newLocation,
      reason,
    })
    await logAudit(
      'TRANSFERENCIA_ARQUIVO_MORTO',
      'folder',
      id,
      `Transferida para Arquivo Morto. Motivo: ${reason}`,
      old.location_text,
      newLocation,
    )
    return updated
  },
}

// ================= CAIXAS =================
export const boxesService = {
  async getAll(filter = '', sort = 'code_legacy') {
    return pb.collection('boxes').getFullList<Box>({ filter, sort })
  },
  async getById(id: string) {
    return pb.collection('boxes').getOne<Box>(id)
  },
  async create(data: Partial<Box>) {
    const rec = await pb.collection('boxes').create<Box>(data)
    await logAudit('CRIACAO_CAIXA', 'box', rec.id, `Caixa criada: ${rec.name} (${rec.code_legacy})`)
    return rec
  },
  async update(id: string, data: Partial<Box>) {
    const rec = await pb.collection('boxes').update<Box>(id, data)
    await logAudit('EDICAO_CAIXA', 'box', id, `Caixa atualizada: ${rec.name}`)
    return rec
  },
}

// ================= EMPRESAS =================
export const companiesService = {
  async getAll(filter = '', sort = 'name') {
    return pb.collection('companies').getFullList<Company>({ filter, sort })
  },
  async getById(id: string) {
    return pb.collection('companies').getOne<Company>(id)
  },
  async create(data: Partial<Company>) {
    const rec = await pb.collection('companies').create<Company>(data)
    await logAudit('CRIACAO_EMPRESA', 'companies', rec.id, `Empresa criada: ${rec.name}`)
    return rec
  },
  async update(id: string, data: Partial<Company>) {
    const rec = await pb.collection('companies').update<Company>(id, data)
    await logAudit('EDICAO_EMPRESA', 'companies', id, `Empresa atualizada: ${rec.name}`)
    return rec
  },
  async delete(id: string) {
    const old = await pb
      .collection('companies')
      .getOne<Company>(id)
      .catch(() => null)
    await pb.collection('companies').delete(id)
    await logAudit(
      'EXCLUSAO_EMPRESA',
      'companies',
      id,
      `Empresa excluída: ${old?.name || id} (CNPJ: ${old?.cnpj || 'não informado'})`,
    )
    return true
  },
}

// ================= PESSOAS =================
export const peopleService = {
  async getAll(filter = '', sort = 'name') {
    return pb.collection('people').getFullList<Person>({ filter, sort })
  },
  async getById(id: string) {
    return pb.collection('people').getOne<Person>(id)
  },
  async create(data: Partial<Person>) {
    const rec = await pb.collection('people').create<Person>(data)
    await logAudit('CRIACAO_PESSOA', 'people', rec.id, `Pessoa cadastrada: ${rec.name}`)
    return rec
  },
  async update(id: string, data: Partial<Person>) {
    const rec = await pb.collection('people').update<Person>(id, data)
    await logAudit('EDICAO_PESSOA', 'people', id, `Pessoa atualizada: ${rec.name}`)
    return rec
  },
  async delete(id: string) {
    const old = await pb
      .collection('people')
      .getOne<Person>(id)
      .catch(() => null)
    await pb.collection('people').delete(id)
    await logAudit(
      'EXCLUSAO_PESSOA',
      'people',
      id,
      `Pessoa excluída: ${old?.name || id} (CPF: ${old?.cpf || 'não informado'})`,
    )
    return true
  },
}

// ================= IMÓVEIS =================
export const propertiesService = {
  async getAll(filter = '', sort = 'description') {
    return pb.collection('properties').getFullList<Property>({ filter, sort })
  },
  async getById(id: string) {
    return pb.collection('properties').getOne<Property>(id)
  },
  async create(data: Partial<Property>) {
    const rec = await pb.collection('properties').create<Property>(data)
    await logAudit('CRIACAO_IMOVEL', 'properties', rec.id, `Imóvel cadastrado: ${rec.description}`)
    return rec
  },
  async update(id: string, data: Partial<Property>) {
    const rec = await pb.collection('properties').update<Property>(id, data)
    await logAudit('EDICAO_IMOVEL', 'properties', id, `Imóvel atualizado: ${rec.description}`)
    return rec
  },
  async delete(id: string) {
    const old = await pb
      .collection('properties')
      .getOne<Property>(id)
      .catch(() => null)
    await pb.collection('properties').delete(id)
    await logAudit(
      'EXCLUSAO_IMOVEL',
      'properties',
      id,
      `Imóvel excluído: ${old?.description || id} (${old?.address || 'sem endereço'})`,
    )
    return true
  },
}

// ================= VEÍCULOS =================
export const vehiclesService = {
  async getAll(filter = '', sort = 'model') {
    return pb.collection('vehicles').getFullList<Vehicle>({ filter, sort })
  },
  async getById(id: string) {
    return pb.collection('vehicles').getOne<Vehicle>(id)
  },
  async create(data: Partial<Vehicle>) {
    const rec = await pb.collection('vehicles').create<Vehicle>(data)
    await logAudit(
      'CRIACAO_VEICULO',
      'vehicle',
      rec.id,
      `Veículo cadastrado: ${rec.model} (${rec.plate || 'Sem placa'})`,
    )
    return rec
  },
  async update(id: string, data: Partial<Vehicle>) {
    const rec = await pb.collection('vehicles').update<Vehicle>(id, data)
    await logAudit('EDICAO_VEICULO', 'vehicle', id, `Veículo atualizado: ${rec.model}`)
    return rec
  },
  async delete(id: string) {
    const old = await pb
      .collection('vehicles')
      .getOne<Vehicle>(id)
      .catch(() => null)
    await pb.collection('vehicles').delete(id)
    await logAudit(
      'EXCLUSAO_VEICULO',
      'vehicle',
      id,
      `Veículo excluído: ${old?.model || id} (${old?.plate || 'Sem placa'})`,
    )
    return true
  },
}

// ================= OBRIGAÇÕES VEICULARES =================
export const obligationsService = {
  async getAll(filter = '', sort = '-year') {
    return pb.collection('vehicle_obligations').getFullList<VehicleObligation>({ filter, sort })
  },
  async getByVehicle(vehicleId: string) {
    return pb.collection('vehicle_obligations').getFullList<VehicleObligation>({
      filter: `vehicle = '${vehicleId}'`,
      sort: '-year',
    })
  },
  async create(data: Partial<VehicleObligation>) {
    const rec = await pb.collection('vehicle_obligations').create<VehicleObligation>(data)
    await logAudit(
      'CRIACAO_OBRIGACAO',
      'vehicle_obligation',
      rec.id,
      `Exercício ${rec.year} criado para veículo ${rec.vehicle_name || ''}`,
    )
    return rec
  },
  async update(id: string, data: Partial<VehicleObligation>) {
    const rec = await pb.collection('vehicle_obligations').update<VehicleObligation>(id, data)
    await logAudit('EDICAO_OBRIGACAO', 'vehicle_obligation', id, `Exercício ${rec.year} atualizado`)
    return rec
  },
  async delete(id: string) {
    const old = await pb
      .collection('vehicle_obligations')
      .getOne<VehicleObligation>(id)
      .catch(() => null)
    await pb.collection('vehicle_obligations').delete(id)
    await logAudit(
      'EXCLUSAO_OBRIGACAO',
      'vehicle_obligation',
      id,
      `Obrigação excluída: Exercício ${old?.year || ''} do veículo ${old?.vehicle_name || ''}`,
    )
    return true
  },
}

// ================= PROCESSOS =================
export const processesService = {
  async getAll(filter = '', sort = 'title') {
    return pb.collection('processes').getFullList<ProcessItem>({ filter, sort })
  },
  async getById(id: string) {
    return pb.collection('processes').getOne<ProcessItem>(id)
  },
  async create(data: Partial<ProcessItem>) {
    const rec = await pb.collection('processes').create<ProcessItem>(data)
    await logAudit('CRIACAO_PROCESSO', 'process', rec.id, `Processo criado: ${rec.title}`)
    return rec
  },
  async update(id: string, data: Partial<ProcessItem>) {
    const rec = await pb.collection('processes').update<ProcessItem>(id, data)
    await logAudit('EDICAO_PROCESSO', 'process', id, `Processo atualizado: ${rec.title}`)
    return rec
  },
  async delete(id: string) {
    const old = await pb
      .collection('processes')
      .getOne<ProcessItem>(id)
      .catch(() => null)
    await pb.collection('processes').delete(id)
    await logAudit('EXCLUSAO_PROCESSO', 'process', id, `Processo excluído: ${old?.title || id}`)
    return true
  },
}

// ================= FUNCIONÁRIOS =================
export const employeesService = {
  async getAll(filter = '', sort = 'name') {
    return pb.collection('employees').getFullList<Employee>({ filter, sort })
  },
  async getById(id: string) {
    return pb.collection('employees').getOne<Employee>(id)
  },
  async create(data: Partial<Employee>) {
    const rec = await pb.collection('employees').create<Employee>(data)
    await logAudit('CRIACAO_FUNCIONARIO', 'employee', rec.id, `Funcionário registrado: ${rec.name}`)
    return rec
  },
  async update(id: string, data: Partial<Employee>) {
    const rec = await pb.collection('employees').update<Employee>(id, data)
    await logAudit('EDICAO_FUNCIONARIO', 'employee', id, `Funcionário atualizado: ${rec.name}`)
    return rec
  },
  async delete(id: string) {
    const old = await pb
      .collection('employees')
      .getOne<Employee>(id)
      .catch(() => null)
    await pb.collection('employees').delete(id)
    await logAudit(
      'EXCLUSAO_FUNCIONARIO',
      'employee',
      id,
      `Funcionário excluído: ${old?.name || id}`,
    )
    return true
  },
}

// ================= MOVIMENTAÇÕES & CHECK-OUT/CHECK-IN =================
export const movementsService = {
  async getAll(filter = '', sort = '-created') {
    return pb.collection('folder_movements').getFullList<FolderMovement>({ filter, sort })
  },
  async createMovement(data: Partial<FolderMovement>) {
    const rec = await pb.collection('folder_movements').create<FolderMovement>(data)
    await logAudit(
      'MOVIMENTACAO_PASTA',
      'folder_movement',
      rec.id,
      `${rec.type}: ${rec.folder_title}`,
    )
    return rec
  },
  async registerCheckout(data: {
    folderId: string
    folderTitle: string
    folderCode: string
    requesterName: string
    purpose?: string
    expectedReturnDate?: string
    authorizedBy?: string
    originLocation?: string
  }) {
    // 1. Cria checkout
    const checkout = await pb.collection('checkouts').create<Checkout>({
      folder: data.folderId,
      folder_title: data.folderTitle,
      folder_code: data.folderCode,
      requester_name: data.requesterName,
      purpose: data.purpose || 'Consulta',
      checkout_date: new Date().toISOString(),
      expected_return_date: data.expectedReturnDate,
      authorized_by: data.authorizedBy || pb.authStore.model?.name || 'Administrador',
      origin_location: data.originLocation || '',
      status: 'Ativo',
    })

    // 2. Atualiza pasta para fora do arquivo
    await pb.collection('folders').update(data.folderId, {
      status: 'Fora do Arquivo',
    })

    // 3. Registra movimento
    await pb.collection('folder_movements').create({
      folder: data.folderId,
      folder_title: data.folderTitle,
      folder_code: data.folderCode,
      type: 'Retirada',
      user_name: data.requesterName,
      origin_location: data.originLocation || 'Arquivo',
      destination_location: `Em posse de: ${data.requesterName}`,
      reason: data.purpose || 'Check-out para consulta',
    })

    await logAudit(
      'CHECKOUT_PASTA',
      'folder',
      data.folderId,
      `Check-out registrado para ${data.requesterName}. Devolução prevista: ${data.expectedReturnDate || 'Não informada'}`,
    )

    return checkout
  },
  async registerCheckin(
    checkoutId: string,
    folderId: string,
    newLocation: string,
    receiverName: string,
  ) {
    // 1. Atualiza checkout
    await pb.collection('checkouts').update(checkoutId, {
      status: 'Devolvido',
      return_date: new Date().toISOString(),
      return_receiver: receiverName || pb.authStore.model?.name || 'Operador',
    })

    // 2. Atualiza pasta
    const folder = await pb.collection('folders').getOne<Folder>(folderId)
    await pb.collection('folders').update(folderId, {
      status: 'No Arquivo',
      location_text: newLocation || folder.location_text,
    })

    // 3. Movimento
    await pb.collection('folder_movements').create({
      folder: folderId,
      folder_title: folder.title,
      folder_code: folder.code_legacy || '',
      type: 'Devolução',
      user_name: receiverName || 'Operador',
      origin_location: 'Fora do Arquivo',
      destination_location: newLocation || folder.location_text || 'Arquivo Central',
      reason: 'Check-in concluído',
    })

    await logAudit(
      'CHECKIN_PASTA',
      'folder',
      folderId,
      `Check-in concluído. Recebido por: ${receiverName}`,
    )
  },
  async getActiveCheckouts() {
    return pb.collection('checkouts').getFullList<Checkout>({
      filter: "status = 'Ativo'",
      sort: '-created',
    })
  },
}

// ================= ESTRUTURA FÍSICA =================
export const locationsService = {
  async getAll(filter = '', sort = 'name') {
    return pb.collection('archive_locations').getFullList<ArchiveLocation>({ filter, sort })
  },
  async create(data: Partial<ArchiveLocation>) {
    const rec = await pb.collection('archive_locations').create<ArchiveLocation>(data)
    await logAudit(
      'CRIACAO_LOCALIZACAO',
      'archive_location',
      rec.id,
      `Localização criada: ${rec.name}`,
    )
    return rec
  },
  async update(id: string, data: Partial<ArchiveLocation>) {
    const rec = await pb.collection('archive_locations').update<ArchiveLocation>(id, data)
    await logAudit(
      'EDICAO_LOCALIZACAO',
      'archive_location',
      id,
      `Localização atualizada: ${rec.name}`,
    )
    return rec
  },
}

// ================= REVISÃO DE MIGRAÇÃO =================
export const migrationIssuesService = {
  async getAll(filter = '', sort = '-created') {
    return pb.collection('migration_issues').getFullList<MigrationIssue>({ filter, sort })
  },
  async update(id: string, data: Partial<MigrationIssue>) {
    const rec = await pb.collection('migration_issues').update<MigrationIssue>(id, data)
    await logAudit(
      'REVISAO_MIGRACAO',
      'migration_issue',
      id,
      `Item de revisão atualizado: status ${rec.status}`,
    )
    return rec
  },
}

// ================= AUDITORIA =================
export const auditService = {
  async getAll(filter = '', sort = '-created', limit = 100) {
    return pb.collection('audit_logs').getList<AuditLog>(1, limit, { filter, sort })
  },
}

// ================= RETENÇÃO & DESCARTE =================
export const retentionService = {
  async getRules() {
    return pb.collection('retention_rules').getFullList<RetentionRule>({ sort: 'doc_type' })
  },
  async createRule(data: Partial<RetentionRule>) {
    return pb.collection('retention_rules').create<RetentionRule>(data)
  },
  async getDisposalRequests(filter = '') {
    return pb
      .collection('disposal_requests')
      .getFullList<DisposalRequest>({ filter, sort: '-created' })
  },
  async createDisposalRequest(data: Partial<DisposalRequest>) {
    const rec = await pb.collection('disposal_requests').create<DisposalRequest>(data)
    await logAudit(
      'SOLICITACAO_DESCARTE',
      'disposal_request',
      rec.id,
      `Solicitação de descarte para pasta ${rec.folder_title}`,
    )
    return rec
  },
  async updateDisposalRequest(id: string, data: Partial<DisposalRequest>) {
    const rec = await pb.collection('disposal_requests').update<DisposalRequest>(id, data)
    await logAudit(
      'STATUS_DESCARTE',
      'disposal_request',
      id,
      `Status de descarte atualizado para: ${rec.status}`,
    )
    return rec
  },
}

// ================= MAPA PATRIMONIAL (NÓS SALVOS) =================
export const mapNodesService = {
  async getAll() {
    return pb.collection('map_nodes').getFullList<MapNodeRecord>()
  },
  async saveNodePosition(
    nodeKey: string,
    x: number,
    y: number,
    nodeType?: string,
    metadata?: Record<string, unknown>,
  ) {
    try {
      const existing = await pb
        .collection('map_nodes')
        .getFirstListItem<MapNodeRecord>(`node_key = '${nodeKey}'`)
      return await pb.collection('map_nodes').update<MapNodeRecord>(existing.id, { x, y, metadata })
    } catch (_) {
      return await pb.collection('map_nodes').create<MapNodeRecord>({
        node_key: nodeKey,
        x,
        y,
        node_type: nodeType || 'default',
        metadata: metadata || {},
      })
    }
  },
}

// ================= INVENTÁRIO =================
export const inventoryService = {
  async getAll() {
    return pb.collection('inventory_sessions').getFullList<InventorySession>({ sort: '-created' })
  },
  async create(data: Partial<InventorySession>) {
    return pb.collection('inventory_sessions').create<InventorySession>(data)
  },
  async update(id: string, data: Partial<InventorySession>) {
    return pb.collection('inventory_sessions').update<InventorySession>(id, data)
  },
}

// ================= USUÁRIOS (CONFIGURAÇÃO) =================
export const usersService = {
  async getAll() {
    return pb.collection('users').getFullList<User>({ sort: 'name' })
  },
  async update(id: string, data: Partial<User>) {
    const rec = await pb.collection('users').update<User>(id, data)
    await logAudit('EDICAO_USUARIO', 'user', id, `Usuário atualizado: ${rec.name} (${rec.role})`)
    return rec
  },
  async create(data: {
    email: string
    name: string
    password?: string
    passwordConfirm?: string
    role?: string
    status?: string
  }) {
    const defaultPassword = data.password || 'Mudar@1234'
    const rec = await pb.collection('users').create<User>({
      email: data.email,
      name: data.name,
      password: defaultPassword,
      passwordConfirm: defaultPassword,
      role: data.role || 'Consulta',
      status: data.status || 'Ativo',
    })
    await logAudit('CRIACAO_USUARIO', 'user', rec.id, `Novo usuário: ${rec.name} (${rec.email})`)
    return rec
  },
  async delete(id: string) {
    const old = await pb
      .collection('users')
      .getOne<User>(id)
      .catch(() => null)
    await pb.collection('users').delete(id)
    await logAudit('EXCLUSAO_USUARIO', 'user', id, `Usuário excluído: ${old?.name || id}`)
    return true
  },
}

// ================= DOCUMENTOS =================
export const documentsService = {
  async getAll(filter = '') {
    return pb.collection('documents').getFullList<DocumentItem>({ filter, sort: '-created' })
  },
  async create(formData: FormData) {
    return pb.collection('documents').create<DocumentItem>(formData)
  },
}
