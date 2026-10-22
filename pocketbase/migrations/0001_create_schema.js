migrate(
  (app) => {
    // Atualizar a coleção users com perfil (role) e status
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    if (!users.fields.getByName('role')) {
      users.fields.add(
        new SelectField({
          name: 'role',
          values: ['Administrador', 'Gestor do Arquivo', 'Operador', 'Consulta', 'Auditor'],
          maxSelect: 1,
        }),
      )
    }

    if (!users.fields.getByName('status')) {
      users.fields.add(
        new SelectField({
          name: 'status',
          values: ['Ativo', 'Inativo'],
          maxSelect: 1,
        }),
      )
    }

    if (!users.fields.getByName('permissions')) {
      users.fields.add(
        new JSONField({
          name: 'permissions',
        }),
      )
    }

    app.save(users)

    // 1. companies
    const companies = new Collection({
      name: 'companies',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'trade_name', type: 'text' },
        { name: 'cnpj', type: 'text' },
        { name: 'state_registration', type: 'text' },
        { name: 'group_name', type: 'text' },
        { name: 'status', type: 'select', values: ['Ativa', 'Inativa'], maxSelect: 1 },
        { name: 'capital', type: 'number' },
        { name: 'address', type: 'text' },
        { name: 'contact', type: 'text' },
        { name: 'notes', type: 'text' },
        { name: 'has_pendencies', type: 'bool' },
        { name: 'pendency_details', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_companies_name ON companies (name)',
        'CREATE INDEX idx_companies_cnpj ON companies (cnpj)',
      ],
    })
    app.save(companies)

    // 2. people
    const people = new Collection({
      name: 'people',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'cpf', type: 'text' },
        { name: 'rg', type: 'text' },
        { name: 'group_name', type: 'text' },
        { name: 'contact', type: 'text' },
        { name: 'address', type: 'text' },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_people_name ON people (name)'],
    })
    app.save(people)

    // 3. archive_locations
    const archiveLocations = new Collection({
      name: 'archive_locations',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'code', type: 'text' },
        {
          name: 'type',
          type: 'select',
          values: [
            'Unidade',
            'Sala',
            'Armario',
            'Gaveteiro',
            'Estante',
            'Gaveta',
            'Prateleira',
            'Posicao',
          ],
          maxSelect: 1,
        },
        { name: 'parent_name', type: 'text' },
        { name: 'parent_id', type: 'text' },
        { name: 'full_path', type: 'text' },
        { name: 'capacity', type: 'number' },
        { name: 'occupied', type: 'number' },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_arch_loc_name ON archive_locations (name)',
        'CREATE INDEX idx_arch_loc_type ON archive_locations (type)',
      ],
    })
    app.save(archiveLocations)

    // 4. boxes
    const boxes = new Collection({
      name: 'boxes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'code_legacy', type: 'text', required: true },
        { name: 'code_current', type: 'text' },
        { name: 'name', type: 'text', required: true },
        { name: 'category', type: 'text' },
        { name: 'location_text', type: 'text' },
        { name: 'capacity', type: 'number' },
        {
          name: 'status',
          type: 'select',
          values: ['Ativa', 'Cheia', 'Emprestada', 'Arquivada', 'Descartada'],
          maxSelect: 1,
        },
        { name: 'notes', type: 'text' },
        { name: 'responsible', type: 'text' },
        { name: 'items_summary', type: 'text' },
        { name: 'needs_review', type: 'bool' },
        { name: 'review_notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_boxes_code_legacy ON boxes (code_legacy)'],
    })
    app.save(boxes)

    // 5. properties
    const properties = new Collection({
      name: 'properties',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'description', type: 'text', required: true },
        {
          name: 'type',
          type: 'select',
          values: [
            'Apartamento',
            'Casa',
            'Lote/Terreno',
            'Vaga de Garagem',
            'Conjunto Comercial',
            'Outro',
          ],
          maxSelect: 1,
        },
        { name: 'address', type: 'text' },
        { name: 'registry_number', type: 'text' },
        { name: 'owner_company', type: 'relation', collectionId: companies.id, maxSelect: 1 },
        { name: 'owner_person', type: 'relation', collectionId: people.id, maxSelect: 1 },
        { name: 'owner_name', type: 'text' },
        { name: 'estimated_value', type: 'number' },
        { name: 'generates_revenue', type: 'bool' },
        { name: 'revenue_value', type: 'number' },
        { name: 'iptu_annual', type: 'number' },
        {
          name: 'iptu_status',
          type: 'select',
          values: ['Em dia', 'Pendente', 'Dívida Ativa'],
          maxSelect: 1,
        },
        { name: 'condo_monthly', type: 'number' },
        { name: 'has_debt', type: 'bool' },
        { name: 'debt_details', type: 'text' },
        { name: 'transfer_target', type: 'text' },
        {
          name: 'status',
          type: 'select',
          values: ['Ativo', 'Vendido', 'Em Transferência', 'Em Reforma'],
          maxSelect: 1,
        },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(properties)

    // 6. vehicles
    const vehicles = new Collection({
      name: 'vehicles',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'type',
          type: 'select',
          values: ['Carro', 'Moto', 'Caminhão', 'Outro'],
          maxSelect: 1,
        },
        { name: 'brand', type: 'text' },
        { name: 'model', type: 'text', required: true },
        { name: 'year_model', type: 'text' },
        { name: 'plate', type: 'text' },
        { name: 'renavam', type: 'text' },
        { name: 'chassi', type: 'text' },
        { name: 'folder_code', type: 'text' },
        { name: 'owner_company', type: 'relation', collectionId: companies.id, maxSelect: 1 },
        { name: 'owner_name', type: 'text' },
        { name: 'estimated_value', type: 'number' },
        { name: 'has_pendencies', type: 'bool' },
        { name: 'pendency_summary', type: 'text' },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_veh_plate ON vehicles (plate)',
        'CREATE INDEX idx_veh_renavam ON vehicles (renavam)',
      ],
    })
    app.save(vehicles)

    // 7. vehicle_obligations
    const vehicleObligations = new Collection({
      name: 'vehicle_obligations',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'vehicle',
          type: 'relation',
          collectionId: vehicles.id,
          required: true,
          maxSelect: 1,
        },
        { name: 'vehicle_name', type: 'text' },
        { name: 'year', type: 'number', required: true },
        { name: 'licensing_value', type: 'number' },
        { name: 'fines_value', type: 'number' },
        { name: 'ipva_value', type: 'number' },
        { name: 'is_active_debt', type: 'bool' },
        {
          name: 'status',
          type: 'select',
          values: ['Pendente', 'Pago', 'Dívida Ativa', 'Isento'],
          maxSelect: 1,
        },
        { name: 'due_date', type: 'date' },
        { name: 'payment_date', type: 'date' },
        { name: 'paid_value', type: 'number' },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_veh_ob_veh_yr ON vehicle_obligations (vehicle, year)'],
    })
    app.save(vehicleObligations)

    // 8. processes
    const processes = new Collection({
      name: 'processes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'number', type: 'text' },
        { name: 'parties', type: 'text' },
        {
          name: 'type',
          type: 'select',
          values: ['Trabalhista', 'Cível', 'Tributário', 'Ativo', 'Terminado', 'Outro'],
          maxSelect: 1,
        },
        { name: 'box_code', type: 'text' },
        { name: 'box', type: 'relation', collectionId: boxes.id, maxSelect: 1 },
        { name: 'lawyer', type: 'text' },
        {
          name: 'status',
          type: 'select',
          values: ['Ativo', 'Terminado', 'Suspenso', 'Arquivado'],
          maxSelect: 1,
        },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(processes)

    // 9. employees
    const employees = new Collection({
      name: 'employees',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'role', type: 'text' },
        { name: 'company_name', type: 'text' },
        { name: 'company', type: 'relation', collectionId: companies.id, maxSelect: 1 },
        { name: 'situation', type: 'select', values: ['Atual', 'Ex-funcionário'], maxSelect: 1 },
        { name: 'box_code', type: 'text' },
        { name: 'box', type: 'relation', collectionId: boxes.id, maxSelect: 1 },
        { name: 'notes', type: 'text' },
        { name: 'needs_review', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(employees)

    // 10. folders
    const folders = new Collection({
      name: 'folders',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'code_legacy', type: 'text' },
        { name: 'code_current', type: 'text' },
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'text' },
        { name: 'group_name', type: 'text' },
        { name: 'company', type: 'relation', collectionId: companies.id, maxSelect: 1 },
        { name: 'person', type: 'relation', collectionId: people.id, maxSelect: 1 },
        { name: 'property', type: 'relation', collectionId: properties.id, maxSelect: 1 },
        { name: 'vehicle', type: 'relation', collectionId: vehicles.id, maxSelect: 1 },
        { name: 'process', type: 'relation', collectionId: processes.id, maxSelect: 1 },
        { name: 'employee', type: 'relation', collectionId: employees.id, maxSelect: 1 },
        { name: 'box', type: 'relation', collectionId: boxes.id, maxSelect: 1 },
        { name: 'box_code', type: 'text' },
        { name: 'category', type: 'text' },
        { name: 'subcategory', type: 'text' },
        { name: 'archive_type', type: 'select', values: ['Atual', 'Morto'], maxSelect: 1 },
        {
          name: 'status',
          type: 'select',
          values: ['No Arquivo', 'Fora do Arquivo', 'Em Trânsito', 'Emprestada', 'Descartada'],
          maxSelect: 1,
        },
        {
          name: 'confidentiality',
          type: 'select',
          values: ['Normal', 'Interno', 'Confidencial', 'Restrito'],
          maxSelect: 1,
        },
        { name: 'location_text', type: 'text' },
        {
          name: 'location_physical',
          type: 'relation',
          collectionId: archiveLocations.id,
          maxSelect: 1,
        },
        { name: 'responsible', type: 'text' },
        { name: 'open_date', type: 'date' },
        { name: 'close_date', type: 'date' },
        { name: 'retention_period', type: 'text' },
        { name: 'expected_disposal_date', type: 'date' },
        { name: 'disposal_blocked', type: 'bool' },
        {
          name: 'cycle_status',
          type: 'select',
          values: ['Ativo', 'Inativo', 'Arquivo Morto', 'Análise', 'Descarte', 'Guarda Permanente'],
          maxSelect: 1,
        },
        { name: 'notes', type: 'text' },
        { name: 'tags', type: 'text' },
        { name: 'import_source', type: 'text' },
        { name: 'origin_sheet', type: 'text' },
        { name: 'origin_row', type: 'number' },
        { name: 'needs_review', type: 'bool' },
        { name: 'review_reason', type: 'text' },
        { name: 'deleted', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_folders_code_legacy ON folders (code_legacy)',
        'CREATE INDEX idx_folders_archive_type ON folders (archive_type)',
        'CREATE INDEX idx_folders_group ON folders (group_name)',
        'CREATE INDEX idx_folders_needs_rev ON folders (needs_review)',
      ],
    })
    app.save(folders)

    // 11. folder_movements
    const folderMovements = new Collection({
      name: 'folder_movements',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'folder',
          type: 'relation',
          collectionId: folders.id,
          required: true,
          maxSelect: 1,
        },
        { name: 'folder_title', type: 'text' },
        { name: 'folder_code', type: 'text' },
        {
          name: 'type',
          type: 'select',
          values: [
            'Retirada',
            'Devolução',
            'Transferência de Local',
            'Transferência para Arquivo Morto',
            'Inclusão em Caixa',
            'Retirada de Caixa',
          ],
          maxSelect: 1,
        },
        { name: 'user_name', type: 'text' },
        { name: 'origin_location', type: 'text' },
        { name: 'destination_location', type: 'text' },
        { name: 'reason', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_mov_folder ON folder_movements (folder)'],
    })
    app.save(folderMovements)

    // 12. checkouts
    const checkouts = new Collection({
      name: 'checkouts',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'folder',
          type: 'relation',
          collectionId: folders.id,
          required: true,
          maxSelect: 1,
        },
        { name: 'folder_title', type: 'text' },
        { name: 'folder_code', type: 'text' },
        { name: 'requester_name', type: 'text', required: true },
        { name: 'purpose', type: 'text' },
        { name: 'checkout_date', type: 'date' },
        { name: 'expected_return_date', type: 'date' },
        { name: 'return_date', type: 'date' },
        { name: 'authorized_by', type: 'text' },
        { name: 'origin_location', type: 'text' },
        { name: 'return_receiver', type: 'text' },
        {
          name: 'status',
          type: 'select',
          values: ['Ativo', 'Devolvido', 'Atrasado'],
          maxSelect: 1,
        },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(checkouts)

    // 13. audit_logs
    const auditLogs = new Collection({
      name: 'audit_logs',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: null, // imutavel
      deleteRule: null, // imutavel
      fields: [
        { name: 'user_email', type: 'text' },
        { name: 'user_name', type: 'text' },
        { name: 'record_type', type: 'text', required: true },
        { name: 'record_id', type: 'text' },
        { name: 'action', type: 'text', required: true },
        { name: 'previous_value', type: 'text' },
        { name: 'new_value', type: 'text' },
        { name: 'details', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_audit_record ON audit_logs (record_type, record_id)'],
    })
    app.save(auditLogs)

    // 14. documents
    const documents = new Collection({
      name: 'documents',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'file', type: 'file', maxSelect: 1 },
        { name: 'folder', type: 'relation', collectionId: folders.id, maxSelect: 1 },
        { name: 'company', type: 'relation', collectionId: companies.id, maxSelect: 1 },
        { name: 'vehicle', type: 'relation', collectionId: vehicles.id, maxSelect: 1 },
        { name: 'property', type: 'relation', collectionId: properties.id, maxSelect: 1 },
        { name: 'type', type: 'text' },
        { name: 'ocr_content', type: 'text' },
        { name: 'ai_suggestions', type: 'json' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(documents)

    // 15. map_nodes (salvar posições e dados do Mapa Patrimonial)
    const mapNodes = new Collection({
      name: 'map_nodes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'node_key', type: 'text', required: true },
        { name: 'x', type: 'number', required: true },
        { name: 'y', type: 'number', required: true },
        { name: 'node_type', type: 'text' },
        { name: 'metadata', type: 'json' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_map_node_key ON map_nodes (node_key)'],
    })
    app.save(mapNodes)

    // 16. migration_issues
    const migrationIssues = new Collection({
      name: 'migration_issues',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'code_legacy', type: 'text' },
        { name: 'original_content', type: 'text', required: true },
        { name: 'origin_sheet', type: 'text' },
        { name: 'origin_row', type: 'number' },
        {
          name: 'issue_type',
          type: 'select',
          values: [
            'sem_codigo',
            'codigo_duplicado',
            'possivel_duplicidade',
            'formato_invalido',
            'observacao_detectada',
            'vinculo_pendente',
            'registro_vazio',
            'necessita_decisao',
          ],
          maxSelect: 1,
        },
        { name: 'description', type: 'text' },
        {
          name: 'status',
          type: 'select',
          values: ['Pendente', 'Em Análise', 'Resolvida', 'Ignorada'],
          maxSelect: 1,
        },
        { name: 'resolution_notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(migrationIssues)

    // 17. inventory_sessions
    const inventorySessions = new Collection({
      name: 'inventory_sessions',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'location_name', type: 'text' },
        { name: 'operator_name', type: 'text' },
        {
          name: 'status',
          type: 'select',
          values: ['Em Andamento', 'Concluído', 'Cancelado'],
          maxSelect: 1,
        },
        { name: 'items_expected', type: 'number' },
        { name: 'items_scanned', type: 'number' },
        { name: 'discrepancies', type: 'json' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(inventorySessions)

    // 18. disposal_requests
    const disposalRequests = new Collection({
      name: 'disposal_requests',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'folder',
          type: 'relation',
          collectionId: folders.id,
          required: true,
          maxSelect: 1,
        },
        { name: 'folder_title', type: 'text' },
        { name: 'folder_code', type: 'text' },
        { name: 'requester_name', type: 'text' },
        { name: 'approver_name', type: 'text' },
        { name: 'justification', type: 'text' },
        {
          name: 'status',
          type: 'select',
          values: ['Pendente', 'Aprovado', 'Rejeitado', 'Executado'],
          maxSelect: 1,
        },
        { name: 'disposal_certificate', type: 'text' },
        { name: 'executed_date', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(disposalRequests)

    // 19. import_batches
    const importBatches = new Collection({
      name: 'import_batches',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'source_file', type: 'text' },
        {
          name: 'status',
          type: 'select',
          values: ['Rascunho', 'Em Homologação', 'Homologado', 'Desfeito'],
          maxSelect: 1,
        },
        { name: 'total_rows', type: 'number' },
        { name: 'issues_count', type: 'number' },
        { name: 'imported_by', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(importBatches)

    // 20. retention_rules
    const retentionRules = new Collection({
      name: 'retention_rules',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'doc_type', type: 'text', required: true },
        { name: 'retention_years', type: 'number', required: true },
        {
          name: 'suggested_action',
          type: 'select',
          values: ['Descarte', 'Guarda Permanente', 'Microfilmagem'],
          maxSelect: 1,
        },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(retentionRules)
  },
  (app) => {
    // rollback
    const names = [
      'retention_rules',
      'import_batches',
      'disposal_requests',
      'inventory_sessions',
      'migration_issues',
      'map_nodes',
      'documents',
      'audit_logs',
      'checkouts',
      'folder_movements',
      'folders',
      'employees',
      'processes',
      'vehicle_obligations',
      'vehicles',
      'properties',
      'boxes',
      'archive_locations',
      'people',
      'companies',
    ]
    for (let i = 0; i < names.length; i++) {
      try {
        const col = app.findCollectionByNameOrId(names[i])
        app.delete(col)
      } catch (_) {}
    }
  },
)
