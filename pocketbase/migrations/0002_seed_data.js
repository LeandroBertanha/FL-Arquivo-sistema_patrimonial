migrate(
  (app) => {
    // 1. Seed Usuário Administrador
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'admin@flarquivos.com')
    } catch (_) {
      const admin = new Record(users)
      admin.setEmail('admin@flarquivos.com')
      admin.setPassword('Skip@Pass')
      admin.setVerified(true)
      admin.set('name', 'Administrador FL')
      admin.set('role', 'Administrador')
      admin.set('status', 'Ativo')
      app.save(admin)
    }

    // Idempotente para o usuário do projeto se existir
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'leandro.bertanha@gmail.com')
    } catch (_) {
      const user2 = new Record(users)
      user2.setEmail('leandro.bertanha@gmail.com')
      user2.setPassword('Skip@Pass')
      user2.setVerified(true)
      user2.set('name', 'Leandro Bertanha')
      user2.set('role', 'Administrador')
      user2.set('status', 'Ativo')
      app.save(user2)
    }

    // 2. Empresas do Excel e do Mapa Patrimonial
    const companiesCol = app.findCollectionByNameOrId('companies')
    const companiesData = [
      {
        name: 'Alpina Holding LTDA',
        trade_name: 'Alpina Holding',
        cnpj: '45.123.456/0001-90',
        group_name: 'HOLDING',
        capital: 5000000,
        has_pendencies: false,
      },
      {
        name: 'VL Intermediação e Participações em Negócios LTDA',
        trade_name: 'Grupo VL',
        cnpj: '12.345.678/0001-11',
        group_name: 'GRUPO VL',
        capital: 2500000,
        has_pendencies: false,
      },
      {
        name: 'Auto&Co Locação de Veículos LTDA',
        trade_name: 'Auto&Co',
        cnpj: '23.456.789/0001-22',
        group_name: 'AUTO&CO',
        capital: 1200000,
        has_pendencies: true,
        pendency_details: 'Multas e dívida ativa em veículos',
      },
      {
        name: 'Capannone Serviços Administrativos LTDA',
        trade_name: 'Capannone',
        cnpj: '34.567.890/0001-33',
        group_name: 'CAPANNONE',
        capital: 800000,
        has_pendencies: false,
      },
      {
        name: 'Romazzino INC LTDA',
        trade_name: 'Romazzino',
        cnpj: '56.789.012/0001-44',
        group_name: 'ROMAZZINO INC',
        capital: 950000,
        has_pendencies: false,
      },
      {
        name: 'Maggiore Consultoria e Serviços LTDA',
        trade_name: 'Maggiore',
        cnpj: '67.890.123/0001-55',
        group_name: 'CONSULTORIA',
        capital: 600000,
        has_pendencies: false,
      },
      {
        name: 'Martini Participações S.A.',
        trade_name: 'Martini S/A',
        cnpj: '78.901.234/0001-66',
        group_name: 'MARTINI',
        capital: 4200000,
        has_pendencies: false,
      },
      {
        name: 'Global Assessoria e Intermediação LTDA',
        trade_name: 'Global',
        cnpj: '89.012.345/0001-77',
        group_name: 'ASSESSORIA',
        capital: 450000,
        has_pendencies: false,
      },
      {
        name: 'BL Systems',
        trade_name: 'BL Systems',
        cnpj: '90.123.456/0001-88',
        group_name: 'TECNOLOGIA',
        capital: 350000,
        has_pendencies: false,
      },
      { name: 'BAY PORT', trade_name: 'Bay Port', group_name: 'BAY PORT' },
      { name: 'JD ACAPULCO', trade_name: 'Jd Acapulco', group_name: 'JD ACAPULCO' },
      { name: 'FELIPE', trade_name: 'Felipe Pessoal/Empresas', group_name: 'FELIPE' },
      { name: 'JADE', trade_name: 'Jade', group_name: 'JADE' },
    ]

    const companyMap = {}
    for (let i = 0; i < companiesData.length; i++) {
      const c = companiesData[i]
      let rec
      try {
        rec = app.findFirstRecordByData('companies', 'name', c.name)
      } catch (_) {
        rec = new Record(companiesCol)
        rec.set('name', c.name)
        rec.set('trade_name', c.trade_name || c.name)
        rec.set('cnpj', c.cnpj || '')
        rec.set('group_name', c.group_name || '')
        rec.set('status', 'Ativa')
        rec.set('capital', c.capital || 0)
        rec.set('has_pendencies', !!c.has_pendencies)
        rec.set('pendency_details', c.pendency_details || '')
        app.save(rec)
      }
      companyMap[c.name] = rec.id
      if (c.group_name) companyMap[c.group_name] = rec.id
      if (c.trade_name) companyMap[c.trade_name] = rec.id
    }

    // 3. Pessoas
    const peopleCol = app.findCollectionByNameOrId('people')
    const peopleData = ['NADIA', 'ODAIR', 'FILIPPO', 'GIULIANO', 'FELIPE']
    const peopleMap = {}
    for (let i = 0; i < peopleData.length; i++) {
      const pName = peopleData[i]
      let rec
      try {
        rec = app.findFirstRecordByData('people', 'name', pName)
      } catch (_) {
        rec = new Record(peopleCol)
        rec.set('name', pName)
        rec.set('group_name', 'PESSOAIS')
        app.save(rec)
      }
      peopleMap[pName] = rec.id
    }

    // 4. Estrutura Física Padrão
    const locCol = app.findCollectionByNameOrId('archive_locations')
    const defaultLocs = [
      {
        name: 'Arquivo Central',
        code: 'AC',
        type: 'Unidade',
        full_path: 'Arquivo Central',
        capacity: 5000,
        occupied: 350,
      },
      {
        name: 'Sala 01 - Arquivo Atual',
        code: 'S01',
        type: 'Sala',
        parent_name: 'Arquivo Central',
        full_path: 'Arquivo Central → Sala 01',
        capacity: 2000,
        occupied: 120,
      },
      {
        name: 'Sala 02 - Arquivo Morto',
        code: 'S02',
        type: 'Sala',
        parent_name: 'Arquivo Central',
        full_path: 'Arquivo Central → Sala 02',
        capacity: 3000,
        occupied: 230,
      },
      {
        name: 'Gaveteiro 01',
        code: 'G01',
        type: 'Gaveteiro',
        parent_name: 'Sala 01',
        full_path: 'Arquivo Central → Sala 01 → Gaveteiro 01',
        capacity: 200,
        occupied: 184,
      },
      {
        name: 'Gaveteiro 02',
        code: 'G02',
        type: 'Gaveteiro',
        parent_name: 'Sala 01',
        full_path: 'Arquivo Central → Sala 01 → Gaveteiro 02',
        capacity: 200,
        occupied: 148,
      },
      {
        name: 'Gaveteiro 03',
        code: 'G03',
        type: 'Gaveteiro',
        parent_name: 'Sala 01',
        full_path: 'Arquivo Central → Sala 01 → Gaveteiro 03',
        capacity: 200,
        occupied: 200,
      },
      {
        name: 'Gaveteiro 04',
        code: 'G04',
        type: 'Gaveteiro',
        parent_name: 'Sala 01',
        full_path: 'Arquivo Central → Sala 01 → Gaveteiro 04',
        capacity: 200,
        occupied: 76,
      },
      {
        name: 'Estante A',
        code: 'EST-A',
        type: 'Estante',
        parent_name: 'Sala 02',
        full_path: 'Arquivo Central → Sala 02 → Estante A',
        capacity: 100,
        occupied: 65,
      },
      {
        name: 'Estante B',
        code: 'EST-B',
        type: 'Estante',
        parent_name: 'Sala 02',
        full_path: 'Arquivo Central → Sala 02 → Estante B',
        capacity: 100,
        occupied: 45,
      },
    ]

    for (let i = 0; i < defaultLocs.length; i++) {
      const dl = defaultLocs[i]
      try {
        app.findFirstRecordByData('archive_locations', 'name', dl.name)
      } catch (_) {
        const rec = new Record(locCol)
        rec.set('name', dl.name)
        rec.set('code', dl.code)
        rec.set('type', dl.type)
        rec.set('parent_name', dl.parent_name || '')
        rec.set('full_path', dl.full_path)
        rec.set('capacity', dl.capacity)
        rec.set('occupied', dl.occupied)
        app.save(rec)
      }
    }

    // 5. Imóveis citados na CX N8 e N8/2
    const propCol = app.findCollectionByNameOrId('properties')
    const propertiesData = [
      {
        description: 'Escritura JD Acapulco Lotes 4, 5, 6',
        type: 'Lote/Terreno',
        address: 'Jardim Acapulco, Guarujá/SP - Lotes 4, 5, 6',
        owner_name: 'ODAIR LOCANTO',
        status: 'Ativo',
        generates_revenue: false,
        iptu_annual: 18500,
        iptu_status: 'Em dia',
        has_debt: false,
      },
      {
        description: 'Escritura JD Acapulco Lotes 17, 18, 19',
        type: 'Lote/Terreno',
        address: 'Jardim Acapulco, Guarujá/SP - Lotes 17, 18, 19',
        owner_name: 'ODAIR LOCANTO',
        status: 'Ativo',
        generates_revenue: false,
        iptu_annual: 22400,
        iptu_status: 'Em dia',
        has_debt: false,
      },
      {
        description: 'Apartamento Bay Port',
        type: 'Apartamento',
        address: 'Edifício Bay Port, Guarará/SP',
        owner_name: 'ODAIR / NADIA',
        status: 'Ativo',
        generates_revenue: true,
        revenue_value: 12000,
        iptu_annual: 14500,
        iptu_status: 'Em dia',
        condo_monthly: 3200,
        has_debt: false,
      },
      {
        description: 'Apartamento My Way',
        type: 'Apartamento',
        address: 'Edifício My Way, São Paulo/SP',
        owner_name: 'FELIPE',
        status: 'Ativo',
        generates_revenue: false,
        iptu_annual: 8900,
        iptu_status: 'Em dia',
        condo_monthly: 1800,
        has_debt: false,
      },
      {
        description: 'Apartamento Jade',
        type: 'Apartamento',
        address: 'Empreendimento Trisul Jade, SP',
        owner_name: 'GRUPO VL',
        status: 'Ativo',
        generates_revenue: true,
        revenue_value: 6500,
        iptu_annual: 6200,
        iptu_status: 'Em dia',
        condo_monthly: 1200,
        has_debt: false,
      },
      {
        description: 'Vagas Carla',
        type: 'Vaga de Garagem',
        address: 'Garagem Carla, Centro/SP',
        owner_name: 'ODAIR LOCANTO',
        status: 'Ativo',
        generates_revenue: true,
        revenue_value: 3500,
        iptu_annual: 3100,
        iptu_status: 'Pendente',
        has_debt: true,
        debt_details: 'IPTU pendente exercício 2025/2026',
      },
      {
        description: 'Escritura Grand Boulevard',
        type: 'Apartamento',
        address: 'Boulevard, São Paulo/SP',
        owner_name: 'FELIPE',
        status: 'Ativo',
        generates_revenue: false,
        iptu_annual: 11200,
        iptu_status: 'Em dia',
        condo_monthly: 2400,
        has_debt: false,
      },
      {
        description: 'Apartamento St Patrick',
        type: 'Apartamento',
        address: 'Edifício St Patrick, Santos/SP',
        owner_name: 'GRUPO VL',
        status: 'Vendido',
        generates_revenue: false,
        iptu_annual: 0,
        iptu_status: 'Em dia',
        has_debt: false,
      },
      {
        description: 'Conjuntos RJ Edifício Bartolomeu de Gusmão',
        type: 'Conjunto Comercial',
        address: 'Rio de Janeiro/RJ',
        owner_name: 'GRUPO VL',
        status: 'Vendido',
        generates_revenue: false,
        iptu_annual: 0,
        iptu_status: 'Em dia',
        has_debt: false,
      },
      {
        description: 'Escritura Campos do Jordão',
        type: 'Casa',
        address: 'Campos do Jordão/SP',
        owner_name: 'ODAIR LOCANTO',
        status: 'Vendido',
        generates_revenue: false,
        iptu_annual: 0,
        iptu_status: 'Em dia',
        has_debt: false,
      },
      {
        description: 'Escritura Rua Argentina',
        type: 'Casa',
        address: 'Rua Argentina, Jardim América, SP',
        owner_name: 'ODAIR / NADIA',
        status: 'Vendido',
        generates_revenue: false,
        iptu_annual: 0,
        iptu_status: 'Em dia',
        has_debt: false,
      },
    ]

    const propMap = {}
    for (let i = 0; i < propertiesData.length; i++) {
      const p = propertiesData[i]
      let rec
      try {
        rec = app.findFirstRecordByData('properties', 'description', p.description)
      } catch (_) {
        rec = new Record(propCol)
        rec.set('description', p.description)
        rec.set('type', p.type)
        rec.set('address', p.address)
        rec.set('owner_name', p.owner_name)
        rec.set('status', p.status)
        rec.set('generates_revenue', p.generates_revenue)
        rec.set('revenue_value', p.revenue_value || 0)
        rec.set('iptu_annual', p.iptu_annual || 0)
        rec.set('iptu_status', p.iptu_status || 'Em dia')
        rec.set('condo_monthly', p.condo_monthly || 0)
        rec.set('has_debt', p.has_debt)
        rec.set('debt_details', p.debt_details || '')
        if (companyMap['Auto&Co Locação de Veículos LTDA'] && p.owner_name.includes('AUTO')) {
          rec.set('owner_company', companyMap['Auto&Co Locação de Veículos LTDA'])
        } else if (
          companyMap['VL Intermediação e Participações em Negócios LTDA'] &&
          (p.owner_name.includes('VL') || p.owner_name.includes('GRUPO'))
        ) {
          rec.set('owner_company', companyMap['VL Intermediação e Participações em Negócios LTDA'])
        }
        app.save(rec)
      }
      propMap[p.description] = rec.id
    }

    // 6. Veículos (CARROS)
    const vehCol = app.findCollectionByNameOrId('vehicles')
    const vehiclesData = [
      {
        type: 'Carro',
        brand: 'CHEVROLET',
        model: 'CHEVROLET MALIBU',
        year_model: '2010/2011',
        renavam: '328777897',
        chassi: '1G1Z95EU2BF209044',
        plate: 'FFL-4D33',
        owner_name: 'AUTO&CO',
        folder_code: 'N01',
        estimated_value: 48000,
        has_pendencies: true,
        pendency_summary: 'Multas R$ 1.769,44 + IPVA 2026 R$ 1.775,50',
      },
      {
        type: 'Carro',
        brand: 'CHEVROLET',
        model: 'CHEVROLET SILVERADO',
        year_model: '1997/1998',
        renavam: '007.025.730.78',
        chassi: '8AG244NEWVA146065',
        plate: 'BVZ-1C98',
        owner_name: 'AUTO&CO',
        folder_code: 'N02',
        estimated_value: 85000,
        has_pendencies: true,
        pendency_summary: 'Multas R$ 970,43 + Licenciamento',
      },
      {
        type: 'Carro',
        brand: 'FIAT',
        model: 'FIAT 500 ABARTH (ODAIR)',
        year_model: '2015/2015',
        renavam: '010.974.869.47',
        chassi: '3C3CFFFH0FT726176',
        plate: 'PYI-3F45',
        owner_name: 'AUTO&CO',
        folder_code: 'N10',
        estimated_value: 92000,
        has_pendencies: true,
        pendency_summary: 'IPVA R$ 5.005,90 + Multas R$ 1.697,73',
      },
      {
        type: 'Carro',
        brand: 'FIAT',
        model: 'FIAT 500 ABARTH (FELIPE)',
        year_model: '2015/2015',
        renavam: '010.766.828.60',
        chassi: '3C3CFFFH5FT695846',
        plate: 'PXH-2I44',
        owner_name: 'AUTO&CO',
        folder_code: 'N19',
        estimated_value: 92000,
        has_pendencies: true,
        pendency_summary: '2024 e 2025 DÍVIDA ATIVA + IPVA 2026',
      },
      {
        type: 'Carro',
        brand: 'MITSUBISHI',
        model: 'MITSUBISHI PAJERO SPORT FLEX',
        year_model: '2010/2011',
        renavam: '002.334.168.38',
        chassi: '93XFRK99WBCA20922',
        plate: 'IRL-4C63',
        owner_name: 'SOGRO',
        folder_code: 'N20',
        estimated_value: 55000,
        has_pendencies: false,
        pendency_summary: 'Valores 2026 a preencher',
      },
      {
        type: 'Moto',
        brand: 'HONDA',
        model: 'HONDA GL 1000 GOLDWING',
        year_model: '1976',
        renavam: '004.143.752.20',
        chassi: 'GL12003366',
        plate: 'BVW-3257',
        owner_name: 'NADIA',
        folder_code: 'Sem número de pasta',
        estimated_value: 65000,
        has_pendencies: false,
        notes: 'OBSERVACAO GOLDWING',
      },
    ]

    const vehMap = {}
    for (let i = 0; i < vehiclesData.length; i++) {
      const v = vehiclesData[i]
      let rec
      try {
        rec = app.findFirstRecordByData('vehicles', 'plate', v.plate)
      } catch (_) {
        rec = new Record(vehCol)
        rec.set('type', v.type)
        rec.set('brand', v.brand)
        rec.set('model', v.model)
        rec.set('year_model', v.year_model)
        rec.set('renavam', v.renavam)
        rec.set('chassi', v.chassi)
        rec.set('plate', v.plate)
        rec.set('owner_name', v.owner_name)
        rec.set('folder_code', v.folder_code)
        rec.set('estimated_value', v.estimated_value)
        rec.set('has_pendencies', v.has_pendencies)
        rec.set('pendency_summary', v.pendency_summary || '')
        rec.set('notes', v.notes || '')
        if (v.owner_name === 'AUTO&CO' && companyMap['Auto&Co Locação de Veículos LTDA']) {
          rec.set('owner_company', companyMap['Auto&Co Locação de Veículos LTDA'])
        }
        app.save(rec)
      }
      vehMap[v.plate] = rec.id
    }

    // 7. IPVA e Obrigações Veiculares
    const obCol = app.findCollectionByNameOrId('vehicle_obligations')
    const obligationsData = [
      {
        plate: 'BVZ-1C98',
        name: 'CHEVROLET SILVERADO',
        year: 2026,
        licensing_value: 174.08,
        fines_value: 970.43,
        ipva_value: 0,
        is_active_debt: false,
        status: 'Pendente',
        notes: 'IPVA sem valor preenchido na planilha',
      },
      {
        plate: 'FFL-4D33',
        name: 'CHEVROLET MALIBU',
        year: 2026,
        licensing_value: 174.08,
        fines_value: 1769.44,
        ipva_value: 1775.5,
        is_active_debt: false,
        status: 'Pendente',
      },
      {
        plate: 'PYI-3F45',
        name: 'FIAT 500 ABARTH (ODAIR)',
        year: 2026,
        licensing_value: 174.08,
        fines_value: 1697.73,
        ipva_value: 5005.9,
        is_active_debt: false,
        status: 'Pendente',
      },
      {
        plate: 'PXH-2I44',
        name: 'FIAT 500 ABARTH (FELIPE)',
        year: 2024,
        licensing_value: 0,
        fines_value: 0,
        ipva_value: 4800.0,
        is_active_debt: true,
        status: 'Dívida Ativa',
        notes: '2024 DÍVIDA ATIVA',
      },
      {
        plate: 'PXH-2I44',
        name: 'FIAT 500 ABARTH (FELIPE)',
        year: 2025,
        licensing_value: 0,
        fines_value: 0,
        ipva_value: 4950.0,
        is_active_debt: true,
        status: 'Dívida Ativa',
        notes: '2025 DÍVIDA ATIVA',
      },
      {
        plate: 'PXH-2I44',
        name: 'FIAT 500 ABARTH (FELIPE)',
        year: 2026,
        licensing_value: 174.08,
        fines_value: 2100.85,
        ipva_value: 5005.9,
        is_active_debt: false,
        status: 'Pendente',
        notes: 'Multas 2.100,85 + IPVA 5.005,90',
      },
      {
        plate: 'IRL-4C63',
        name: 'MITSUBISHI PAJERO SPORT',
        year: 2026,
        licensing_value: 0,
        fines_value: 0,
        ipva_value: 0,
        is_active_debt: false,
        status: 'Pendente',
        notes: 'Registro existente, valores ainda não preenchidos',
      },
    ]

    for (let i = 0; i < obligationsData.length; i++) {
      const ob = obligationsData[i]
      const vehId = vehMap[ob.plate]
      if (!vehId) continue
      try {
        app.findFirstRecordByFilter(
          'vehicle_obligations',
          `vehicle = '${vehId}' && year = ${ob.year}`,
        )
      } catch (_) {
        const rec = new Record(obCol)
        rec.set('vehicle', vehId)
        rec.set('vehicle_name', ob.name)
        rec.set('year', ob.year)
        rec.set('licensing_value', ob.licensing_value)
        rec.set('fines_value', ob.fines_value)
        rec.set('ipva_value', ob.ipva_value)
        rec.set('is_active_debt', ob.is_active_debt)
        rec.set('status', ob.status)
        rec.set('notes', ob.notes || '')
        app.save(rec)
      }
    }

    // 8. Caixas de Arquivo Morto (CAIXAS ARQUIVOS)
    const boxesCol = app.findCollectionByNameOrId('boxes')
    const boxesData = [
      {
        code_legacy: 'CX N2',
        name: 'PROCESSOS TRABALHISTAS TERMINADOS',
        category: 'Processos',
        capacity: 30,
        location_text: 'Arquivo Central → Sala 02 → Estante A → Prateleira 1',
        responsible: 'Arquivo Jurídico',
      },
      {
        code_legacy: 'CX N3',
        name: 'EMPRESAS VENDIDAS',
        category: 'Societário / Empresas',
        capacity: 40,
        location_text: 'Arquivo Central → Sala 02 → Estante A → Prateleira 2',
        responsible: 'Fabio Rogerio',
      },
      {
        code_legacy: 'CX N4',
        name: 'PROCESSOS ATIVOS',
        category: 'Processos',
        capacity: 30,
        location_text: 'Arquivo Central → Sala 02 → Estante A → Prateleira 3',
        responsible: 'Dr. Sergio Nunes',
      },
      {
        code_legacy: 'CX N5/01',
        name: 'PROCESSOS TERMINADOS (PARTE 1)',
        category: 'Processos',
        capacity: 35,
        location_text: 'Arquivo Central → Sala 02 → Estante B → Prateleira 1',
        responsible: 'Arquivo Jurídico',
      },
      {
        code_legacy: 'CX N5/02',
        name: 'PROCESSOS TERMINADOS (PARTE 2)',
        category: 'Processos',
        capacity: 35,
        location_text: 'Arquivo Central → Sala 02 → Estante B → Prateleira 1',
        responsible: 'Arquivo Jurídico',
      },
      {
        code_legacy: 'CX N6',
        name: 'INSS NADIA E ODAIR',
        category: 'Previdenciário',
        capacity: 25,
        location_text: 'Arquivo Central → Sala 02 → Estante B → Prateleira 2',
        responsible: 'Gestão Pessoal',
      },
      {
        code_legacy: 'CX N7',
        name: 'EX FUNCIONARIOS (PARTE 1)',
        category: 'RH',
        capacity: 40,
        location_text: 'Arquivo Central → Sala 02 → Estante B → Prateleira 3',
        responsible: 'Recursos Humanos',
      },
      {
        code_legacy: 'CX N7/2',
        name: 'EX FUNCIONARIOS (PARTE 2)',
        category: 'RH',
        capacity: 40,
        location_text: 'Arquivo Central → Sala 02 → Estante B → Prateleira 3',
        responsible: 'Recursos Humanos',
      },
      {
        code_legacy: 'CX N8',
        name: 'IMOVEIS',
        category: 'Patrimonial / Imóveis',
        capacity: 30,
        location_text: 'Arquivo Central → Sala 02 → Estante A → Prateleira 4',
        responsible: 'Gestão Patrimonial',
      },
      {
        code_legacy: 'CX N8/2',
        name: 'IMOVEIS VENDIDOS',
        category: 'Patrimonial / Imóveis',
        capacity: 30,
        location_text: 'Arquivo Central → Sala 02 → Estante A → Prateleira 4',
        responsible: 'Gestão Patrimonial',
      },
      {
        code_legacy: 'CX N9',
        name: 'EUNICE / DOCUMENTOS DIVERSOS',
        category: 'Documentos Diversos',
        capacity: 30,
        location_text: 'Arquivo Central → Sala 02 → Estante B → Prateleira 4',
        responsible: 'Administrativo',
      },
      {
        code_legacy: 'CX N10',
        name: 'FUNCIONARIOS ATUAIS - ARQUIVO MORTO',
        category: 'RH',
        capacity: 25,
        location_text: 'Arquivo Central → Sala 02 → Estante B → Prateleira 5',
        responsible: 'Recursos Humanos',
      },
      {
        code_legacy: 'CX N11',
        name: 'MARTINI S/A',
        category: 'Societário',
        capacity: 20,
        location_text: 'Arquivo Central → Sala 02 → Estante A → Prateleira 5',
        responsible: 'Jurídico Societário',
      },
      {
        code_legacy: 'CX N12',
        name: 'FAMILIA',
        category: 'Familiar / Pessoal',
        capacity: 20,
        location_text: 'Arquivo Central → Sala 02 → Estante A → Prateleira 5',
        responsible: 'Família Locanto',
      },
    ]

    const boxMap = {}
    for (let i = 0; i < boxesData.length; i++) {
      const b = boxesData[i]
      let rec
      try {
        rec = app.findFirstRecordByData('boxes', 'code_legacy', b.code_legacy)
      } catch (_) {
        rec = new Record(boxesCol)
        rec.set('code_legacy', b.code_legacy)
        rec.set('name', b.name)
        rec.set('category', b.category)
        rec.set('capacity', b.capacity)
        rec.set('location_text', b.location_text)
        rec.set('responsible', b.responsible)
        rec.set('status', 'Ativa')
        app.save(rec)
      }
      boxMap[b.code_legacy] = rec.id
    }

    // 9. Processos, Funcionários e Ex-Funcionários específicos das Caixas
    const procCol = app.findCollectionByNameOrId('processes')
    const processesData = [
      { title: 'ELIAS E FRANCISCA', box_code: 'CX N2', type: 'Trabalhista', status: 'Terminado' },
      { title: 'MADALENA - GUARUJA', box_code: 'CX N2', type: 'Trabalhista', status: 'Terminado' },
      { title: 'TOTO - GUARUJA', box_code: 'CX N2', type: 'Trabalhista', status: 'Terminado' },
      { title: 'ZE LUIS', box_code: 'CX N2', type: 'Trabalhista', status: 'Terminado' },
      { title: 'ROSA - VELHA', box_code: 'CX N2', type: 'Trabalhista', status: 'Terminado' },
      {
        title: 'VIACAO SAO DIMAS',
        box_code: 'CX N3',
        type: 'Outro',
        status: 'Terminado',
        notes: 'PROMISSORIAS NA PASTA - TA COM FABIO',
      },
      { title: 'BREDA SOROCABA', box_code: 'CX N3', type: 'Outro', status: 'Terminado' },
      {
        title: 'ITABUNA - VIACAO CIDADE SORRISO - ESDRAS',
        box_code: 'CX N3',
        type: 'Outro',
        status: 'Terminado',
      },
      { title: 'PASSARO MARROM', box_code: 'CX N3', type: 'Outro', status: 'Terminado' },
      { title: 'VIACAO COMETA', box_code: 'CX N3', type: 'Outro', status: 'Terminado' },
      { title: 'VIACAO LIMEIRENSE', box_code: 'CX N3', type: 'Outro', status: 'Terminado' },
      { title: 'TECNIBUS - EXPOBUS', box_code: 'CX N3', type: 'Outro', status: 'Terminado' },
      { title: 'VILA GALVAO', box_code: 'CX N3', type: 'Outro', status: 'Terminado' },
      { title: 'TERRENO PALLAZINI', box_code: 'CX N3', type: 'Outro', status: 'Terminado' },
      { title: 'VL X IKATU - ZECA ROMANO', box_code: 'CX N3', type: 'Outro', status: 'Terminado' },
      {
        title: 'CAMURUJIPE - ADVOGADO SERGIO NUNES + GUIAS 2022',
        box_code: 'CX N4',
        type: 'Ativo',
        status: 'Ativo',
        lawyer: 'SERGIO NUNES',
        notes: 'INSTRUMENTO CESSAO CREDITO DALOCANS X VL',
      },
      { title: 'PROCESSOS GUARUJA - ACAPULCO', box_code: 'CX N4', type: 'Ativo', status: 'Ativo' },
      { title: 'MARCIO XAVIER', box_code: 'CX N4', type: 'Ativo', status: 'Ativo' },
      { title: 'BANCO AGRIMISA', box_code: 'CX N5/01', type: 'Terminado', status: 'Terminado' },
      { title: 'EVELINA MALUF', box_code: 'CX N5/01', type: 'Terminado', status: 'Terminado' },
      {
        title: 'MANOEL RODRIGUES - NETO',
        box_code: 'CX N5/01',
        type: 'Terminado',
        status: 'Terminado',
      },
      { title: 'CCW - GARY - OTM', box_code: 'CX N5/01', type: 'Terminado', status: 'Terminado' },
      {
        title: 'ELIANA OGER + CRISTIAN ADVOGADO ITAMARATI',
        box_code: 'CX N5/01',
        type: 'Terminado',
        status: 'Terminado',
        notes: '3 PASTAS',
      },
      { title: 'VALDIRENE', box_code: 'CX N5/01', type: 'Terminado', status: 'Terminado' },
      {
        title: 'BANCO TRICURY',
        box_code: 'CX N5/01',
        type: 'Terminado',
        status: 'Terminado',
        notes: '4 PASTAS: CONTRATOS, CITACOES, DEFESAS, DESPESAS',
      },
    ]

    const procMap = {}
    for (let i = 0; i < processesData.length; i++) {
      const pr = processesData[i]
      let rec
      try {
        rec = app.findFirstRecordByData('processes', 'title', pr.title)
      } catch (_) {
        rec = new Record(procCol)
        rec.set('title', pr.title)
        rec.set('box_code', pr.box_code)
        if (boxMap[pr.box_code]) rec.set('box', boxMap[pr.box_code])
        rec.set('type', pr.type)
        rec.set('status', pr.status)
        rec.set('lawyer', pr.lawyer || '')
        rec.set('notes', pr.notes || '')
        app.save(rec)
      }
      procMap[pr.title] = rec.id
    }

    // Funcionários
    const empCol = app.findCollectionByNameOrId('employees')
    const employeesData = [
      { name: 'CRISTIANE GUARUJA', situation: 'Ex-funcionário', box_code: 'CX N7' },
      { name: 'JAIR GUARUJA', situation: 'Ex-funcionário', box_code: 'CX N7' },
      { name: 'PRETA - IRANILDA', situation: 'Ex-funcionário', box_code: 'CX N7' },
      { name: 'LOURDES', situation: 'Ex-funcionário', box_code: 'CX N7' },
      { name: 'ELIAS', situation: 'Ex-funcionário', box_code: 'CX N7' },
      { name: 'HO', situation: 'Ex-funcionário', box_code: 'CX N7' },
      { name: 'MARINALVA', situation: 'Ex-funcionário', box_code: 'CX N7' },
      { name: 'MARIA BENEDITA - CAMPOS DO JORDAO', situation: 'Ex-funcionário', box_code: 'CX N7' },
      { name: 'IVONETE', situation: 'Ex-funcionário', box_code: 'CX N7' },
      { name: 'PEDRO', situation: 'Ex-funcionário', box_code: 'CX N7' },
      { name: 'GLORIA', situation: 'Ex-funcionário', box_code: 'CX N7' },
      { name: 'VIVIANE', situation: 'Ex-funcionário', box_code: 'CX N7' },
      { name: 'IRIS', situation: 'Ex-funcionário', box_code: 'CX N7' },
      { name: 'GUSTAVO', situation: 'Ex-funcionário', box_code: 'CX N7' },
      { name: 'ANDREA', situation: 'Ex-funcionário', box_code: 'CX N7' },
      { name: 'DANIEL', situation: 'Ex-funcionário', box_code: 'CX N7' },
      { name: 'MANOEL VICENTE NETO', situation: 'Ex-funcionário', box_code: 'CX N7' },
      { name: 'SANDRA', situation: 'Ex-funcionário', box_code: 'CX N7' },
      { name: 'MADALENA', situation: 'Ex-funcionário', box_code: 'CX N7' },
      { name: 'VALDINEI', situation: 'Atual', box_code: 'CX N10' },
      {
        name: 'VAZIO',
        situation: 'Atual',
        box_code: 'CX N10',
        notes: 'Registro vazio marcado na planilha',
        needs_review: true,
      },
      { name: 'ROSANA', situation: 'Atual', box_code: 'CX N10' },
      { name: 'TIHAGO', situation: 'Atual', box_code: 'CX N10' },
      { name: 'CARLOS', situation: 'Atual', box_code: 'CX N10' },
    ]

    const empMap = {}
    for (let i = 0; i < employeesData.length; i++) {
      const e = employeesData[i]
      let rec
      try {
        rec = app.findFirstRecordByData('employees', 'name', e.name)
      } catch (_) {
        rec = new Record(empCol)
        rec.set('name', e.name)
        rec.set('situation', e.situation)
        rec.set('box_code', e.box_code)
        if (boxMap[e.box_code]) rec.set('box', boxMap[e.box_code])
        rec.set('notes', e.notes || '')
        rec.set('needs_review', !!e.needs_review)
        app.save(rec)
      }
      empMap[e.name] = rec.id
    }

    // 10. Inconsistências de Migração para registro formal
    const issCol = app.findCollectionByNameOrId('migration_issues')
    const knownIssues = [
      {
        code_legacy: 'SEM CODIGO',
        original_content: 'AUTO&CO CONTRATO SOCIAL',
        origin_sheet: 'ARQUIVO ATUAL',
        origin_row: 14,
        issue_type: 'sem_codigo',
        description: 'Registro sem número de pasta na planilha original',
        status: 'Pendente',
      },
      {
        code_legacy: 'N4/01',
        original_content:
          'CAMURUJIPE - ADVOGADO SERGIO NUNES / CAMURUJIPE - RITA / CAMURUJIPE - RITA',
        origin_sheet: 'CAIXAS ARQUIVOS',
        origin_row: 28,
        issue_type: 'codigo_duplicado',
        description: 'Código N4/01 repetido 3 vezes na CX N4',
        status: 'Pendente',
      },
      {
        code_legacy: '*******',
        original_content: 'DOSSIE ANDRE CARPINTEIRO CX4',
        origin_sheet: 'CAIXAS ARQUIVOS',
        origin_row: 34,
        issue_type: 'formato_invalido',
        description: 'Código estranho ******* usado como marcador na CX N4 e CX N5',
        status: 'Pendente',
      },
      {
        code_legacy: 'N5/04',
        original_content: 'CCW - GARY - OTM (4x)',
        origin_sheet: 'CAIXAS ARQUIVOS',
        origin_row: 42,
        issue_type: 'codigo_duplicado',
        description: 'N5/04 CCW - GARY - OTM repetido 4 vezes na CX N5/01',
        status: 'Pendente',
      },
      {
        code_legacy: 'N5/07',
        original_content: 'BANCO TRICURY (PASTA 1, 2, 3, 4)',
        origin_sheet: 'CAIXAS ARQUIVOS',
        origin_row: 48,
        issue_type: 'necessita_decisao',
        description: 'N5/07 Banco Tricury dividido em 4 pastas físicas distintas com mesmo código',
        status: 'Pendente',
      },
      {
        code_legacy: 'N7/14',
        original_content: 'GUSTAVO / ANDREA / DANIEL',
        origin_sheet: 'CAIXAS ARQUIVOS',
        origin_row: 70,
        issue_type: 'codigo_duplicado',
        description: 'Código N7/14 atribuído a 3 ex-funcionários distintos',
        status: 'Pendente',
      },
      {
        code_legacy: 'N10/02',
        original_content: 'VAZIO',
        origin_sheet: 'CAIXAS ARQUIVOS',
        origin_row: 104,
        issue_type: 'registro_vazio',
        description: 'Registro marcado expressamente como VAZIO na planilha',
        status: 'Pendente',
      },
      {
        code_legacy: 'N3/01',
        original_content: 'VIACAO SAO DIMAS - PROMISSORIAS NA PASTA - TA COM FABIO',
        origin_sheet: 'CAIXAS ARQUIVOS',
        origin_row: 18,
        issue_type: 'observacao_detectada',
        description: "Observação 'TA COM FABIO' embutida no título do registro físico",
        status: 'Pendente',
      },
      {
        code_legacy: 'CX N11',
        original_content: 'LIVRETOS / ATA DE ASSEMBLEIA / DECLARACAO',
        origin_sheet: 'CAIXAS ARQUIVOS',
        origin_row: 110,
        issue_type: 'sem_codigo',
        description: 'Três itens na CX N11 Martini S/A sem subcódigo numérico',
        status: 'Pendente',
      },
      {
        code_legacy: 'MOTO',
        original_content: 'HONDA GL 1000 - 1976 - RENAVAN 004.143.752.20',
        origin_sheet: 'CARROS',
        origin_row: 7,
        issue_type: 'sem_codigo',
        description: 'Moto sem número de pasta atribuído',
        status: 'Pendente',
      },
      {
        code_legacy: 'N1 vs N01',
        original_content: 'N1 (Pastas várias) vs N01 (MALIBU)',
        origin_sheet: 'CARROS / ARQUIVO ATUAL',
        origin_row: 1,
        issue_type: 'necessita_decisao',
        description: 'Diferenciação intencional mantida entre N1 e N01 até validação humana',
        status: 'Pendente',
      },
    ]

    for (let i = 0; i < knownIssues.length; i++) {
      const iss = knownIssues[i]
      try {
        app.findFirstRecordByData('migration_issues', 'original_content', iss.original_content)
      } catch (_) {
        const rec = new Record(issCol)
        rec.set('code_legacy', iss.code_legacy)
        rec.set('original_content', iss.original_content)
        rec.set('origin_sheet', iss.origin_sheet)
        rec.set('origin_row', iss.origin_row)
        rec.set('issue_type', iss.issue_type)
        rec.set('description', iss.description)
        rec.set('status', iss.status)
        app.save(rec)
      }
    }

    // 11. Pastas do ARQUIVO ATUAL
    const foldersCol = app.findCollectionByNameOrId('folders')
    const atualFolders = [
      // GRUPO VL
      {
        code_legacy: 'N1',
        title: 'GRUPO VL CONTRATO SOCIAL',
        group_name: 'GRUPO VL',
        category: 'Societário',
      },
      {
        code_legacy: 'N2',
        title: 'ENEL VL',
        group_name: 'GRUPO VL',
        category: 'Contas de Consumo',
      },
      {
        code_legacy: 'N3',
        title: 'CONDOMINIO E IPTU ACH',
        group_name: 'GRUPO VL',
        category: 'Imobiliário',
      },
      { code_legacy: 'N4', title: 'ALUGUEL ACH', group_name: 'GRUPO VL', category: 'Locação' },
      {
        code_legacy: 'N5',
        title: 'VIVO 3062-3323 FIBRA',
        group_name: 'GRUPO VL',
        category: 'Telecomunicações',
      },
      {
        code_legacy: 'N6',
        title: 'GRAFICA LOGO GRUPO VL',
        group_name: 'GRUPO VL',
        category: 'Marketing / Identidade',
      },
      { code_legacy: 'N7', title: 'ADL4 GERAL', group_name: 'GRUPO VL', category: 'Geral' },
      {
        code_legacy: 'N8',
        title: 'SERVICOS FRS - FABIO ROGERIO',
        group_name: 'GRUPO VL',
        category: 'Prestação de Serviços',
      },
      {
        code_legacy: 'N9',
        title: 'IMPOSTOS TODAS EMPRESAS',
        group_name: 'GRUPO VL',
        category: 'Fiscal / Tributário',
      },
      {
        code_legacy: 'N10',
        title: 'DECLARACOES GRUPO VL',
        group_name: 'GRUPO VL',
        category: 'Declarações Oficiais',
      },
      { code_legacy: 'N11', title: 'CONTRATOS ACH', group_name: 'GRUPO VL', category: 'Contratos' },
      { code_legacy: 'N13', title: 'CONTRATOS VL', group_name: 'GRUPO VL', category: 'Contratos' },
      // AUTO&CO
      {
        code_legacy: '',
        title: 'AUTO&CO CONTRATO SOCIAL',
        group_name: 'AUTO&CO',
        category: 'Societário',
        needs_review: true,
        review_reason: 'Registro sem número de pasta na planilha original',
      },
      // CAPANNONE
      {
        code_legacy: 'N1',
        title: 'CAPANNONE BRADESCO',
        group_name: 'CAPANNONE',
        category: 'Bancário',
      },
      {
        code_legacy: 'N2',
        title: 'CAPANNONE CONTRATO SOCIAL',
        group_name: 'CAPANNONE',
        category: 'Societário',
      },
      {
        code_legacy: 'N3',
        title: 'NF CAPANNONE',
        group_name: 'CAPANNONE',
        category: 'Notas Fiscais',
      },
      {
        code_legacy: 'N5',
        title: 'CERTIDOES E PROCURACOES CAPANNONE',
        group_name: 'CAPANNONE',
        category: 'Certidões / Procurações',
      },
      {
        code_legacy: 'N6',
        title: 'IR CAPANNONE',
        group_name: 'CAPANNONE',
        category: 'Imposto de Renda',
      },
      {
        code_legacy: 'N7',
        title: 'CADASTROS CAPANNONE',
        group_name: 'CAPANNONE',
        category: 'Cadastros',
      },
      // ROMAZZINO INC
      {
        code_legacy: 'N1',
        title: 'ROMAZZINO CONTRATO SOCIAL',
        group_name: 'ROMAZZINO INC',
        category: 'Societário',
      },
      // PESSOAIS
      {
        code_legacy: 'N1',
        title: 'VIVO NADIA 99978-4248',
        group_name: 'PESSOAIS',
        category: 'Telecomunicações',
        person_name: 'NADIA',
      },
      {
        code_legacy: 'N2',
        title: 'VIVO ODAIR 99982-2446',
        group_name: 'PESSOAIS',
        category: 'Telecomunicações',
        person_name: 'ODAIR',
      },
      {
        code_legacy: 'N3',
        title: 'DEPOSITOS PESSOAIS',
        group_name: 'PESSOAIS',
        category: 'Bancário / Financeiro',
      },
      {
        code_legacy: 'N4',
        title: 'PAULISTANO ODAIR',
        group_name: 'PESSOAIS',
        category: 'Clube / Pessoal',
        person_name: 'ODAIR',
      },
      {
        code_legacy: 'N5',
        title: 'IMPOSTOS NADIA + ODAIR',
        group_name: 'PESSOAIS',
        category: 'Fiscal / Tributário',
        person_name: 'ODAIR',
      },
      {
        code_legacy: 'N8',
        title: 'SUL AMERICA SAUDE',
        group_name: 'PESSOAIS',
        category: 'Saúde / Convênios',
      },
      {
        code_legacy: 'N9',
        title: 'DOCS FILIPPO',
        group_name: 'PESSOAIS',
        category: 'Documentos Pessoais',
        person_name: 'FILIPPO',
      },
      {
        code_legacy: 'N11',
        title: 'DOCUMENTOS E IR ODAIR',
        group_name: 'PESSOAIS',
        category: 'IR / Documentos',
        person_name: 'ODAIR',
      },
      {
        code_legacy: 'N12',
        title: 'DOCUMENTOS E IR NADIA',
        group_name: 'PESSOAIS',
        category: 'IR / Documentos',
        person_name: 'NADIA',
      },
      {
        code_legacy: 'N13',
        title: 'DOCUMENTOS E IR GIULIANO',
        group_name: 'PESSOAIS',
        category: 'IR / Documentos',
        person_name: 'GIULIANO',
      },
      {
        code_legacy: 'N14',
        title: 'DOCUMENTOS E IR FELIPE',
        group_name: 'PESSOAIS',
        category: 'IR / Documentos',
        person_name: 'FELIPE',
      },
      {
        code_legacy: 'N17',
        title: 'BANCOS ODAIR',
        group_name: 'PESSOAIS',
        category: 'Bancário',
        person_name: 'ODAIR',
      },
      { code_legacy: 'N18', title: 'MOVIDA', group_name: 'PESSOAIS', category: 'Locação Veicular' },
      // BAY PORT
      {
        code_legacy: 'N1',
        title: 'VIVO GUARARA',
        group_name: 'BAY PORT',
        category: 'Telecomunicações',
      },
      {
        code_legacy: 'N2',
        title: 'CLARO NET',
        group_name: 'BAY PORT',
        category: 'Telecomunicações',
      },
      { code_legacy: 'N3', title: 'COMGAS', group_name: 'BAY PORT', category: 'Contas de Consumo' },
      { code_legacy: 'N4', title: 'ENEL', group_name: 'BAY PORT', category: 'Contas de Consumo' },
      {
        code_legacy: 'N6',
        title: 'COND BAY PORT APART',
        group_name: 'BAY PORT',
        category: 'Condomínio',
      },
      { code_legacy: 'N7', title: 'IPTU BAY PORT VAGAS', group_name: 'BAY PORT', category: 'IPTU' },
      {
        code_legacy: 'N8',
        title: 'IPTU BAY PORT APARTAMENTO',
        group_name: 'BAY PORT',
        category: 'IPTU',
      },
      {
        code_legacy: 'N10',
        title: 'COND BAY PORT VAGAS',
        group_name: 'BAY PORT',
        category: 'Condomínio',
      },
      // JD ACAPULCO
      {
        code_legacy: 'N1',
        title: 'VIVO FIBRA 2390',
        group_name: 'JD ACAPULCO',
        category: 'Telecomunicações',
      },
      { code_legacy: 'N2', title: 'SKY', group_name: 'JD ACAPULCO', category: 'TV por Assinatura' },
      {
        code_legacy: 'N3',
        title: 'ELEKTRO',
        group_name: 'JD ACAPULCO',
        category: 'Contas de Consumo',
      },
      {
        code_legacy: 'N4',
        title: 'SABESP RUA 49/50',
        group_name: 'JD ACAPULCO',
        category: 'Contas de Consumo',
      },
      {
        code_legacy: 'N6',
        title: 'COND JD ACAPULCO',
        group_name: 'JD ACAPULCO',
        category: 'Condomínio',
      },
      { code_legacy: 'N7', title: 'IPTU JD ACAPULCO', group_name: 'JD ACAPULCO', category: 'IPTU' },
      // FELIPE
      {
        code_legacy: 'N1',
        title: 'ALUGUEL BRAMBILLA',
        group_name: 'FELIPE',
        category: 'Locação',
        person_name: 'FELIPE',
      },
      {
        code_legacy: 'N2',
        title: 'CONDOMINIO MY WAY',
        group_name: 'FELIPE',
        category: 'Condomínio',
        person_name: 'FELIPE',
      },
      {
        code_legacy: 'N3',
        title: 'IPTU MY WAY',
        group_name: 'FELIPE',
        category: 'IPTU',
        person_name: 'FELIPE',
      },
      {
        code_legacy: 'N4',
        title: 'ENEL L MEIRELLES / MY WAY',
        group_name: 'FELIPE',
        category: 'Contas de Consumo',
        person_name: 'FELIPE',
      },
      {
        code_legacy: 'N5',
        title: 'CLARO L MEIRELLES / MY WAY',
        group_name: 'FELIPE',
        category: 'Telecomunicações',
        person_name: 'FELIPE',
      },
      {
        code_legacy: 'N6',
        title: 'EXTRAS',
        group_name: 'FELIPE',
        category: 'Diversos',
        person_name: 'FELIPE',
      },
      {
        code_legacy: 'N7',
        title: 'IPTU L MEIRELLES',
        group_name: 'FELIPE',
        category: 'IPTU',
        person_name: 'FELIPE',
      },
      {
        code_legacy: 'N8',
        title: 'CONDOMINIO L MEIRELLES',
        group_name: 'FELIPE',
        category: 'Condomínio',
        person_name: 'FELIPE',
      },
      {
        code_legacy: 'N9',
        title: 'VIVO',
        group_name: 'FELIPE',
        category: 'Telecomunicações',
        person_name: 'FELIPE',
      },
      {
        code_legacy: 'N10',
        title: 'PAULISTANO FELIPE',
        group_name: 'FELIPE',
        category: 'Clube / Pessoal',
        person_name: 'FELIPE',
      },
      {
        code_legacy: 'N11',
        title: 'COMGAS L MEIRELLES',
        group_name: 'FELIPE',
        category: 'Contas de Consumo',
        person_name: 'FELIPE',
      },
      {
        code_legacy: 'N12',
        title: 'AMIL',
        group_name: 'FELIPE',
        category: 'Saúde / Convênio',
        person_name: 'FELIPE',
      },
      {
        code_legacy: 'N13',
        title: 'VAL',
        group_name: 'FELIPE',
        category: 'Diversos',
        person_name: 'FELIPE',
      },
      {
        code_legacy: 'N14',
        title: 'GOOD STORAGE',
        group_name: 'FELIPE',
        category: 'Armazenamento',
        person_name: 'FELIPE',
      },
      // JADE
      {
        code_legacy: 'N5',
        title: 'TRISUL CREDITO',
        group_name: 'JADE',
        category: 'Crédito Imobiliário',
      },
    ]

    for (let i = 0; i < atualFolders.length; i++) {
      const f = atualFolders[i]
      try {
        app.findFirstRecordByFilter('folders', `title = '${f.title}' && archive_type = 'Atual'`)
      } catch (_) {
        const rec = new Record(foldersCol)
        rec.set('code_legacy', f.code_legacy || '')
        rec.set('title', f.title)
        rec.set('group_name', f.group_name)
        rec.set('archive_type', 'Atual')
        rec.set('status', 'No Arquivo')
        rec.set('confidentiality', 'Normal')
        rec.set('category', f.category || 'Geral')
        rec.set('cycle_status', 'Ativo')
        rec.set('location_text', `Arquivo Central → Sala 01 → Gaveteiro 01 → Gaveta 01`)
        rec.set('responsible', 'Arquivo Central')
        rec.set('import_source', 'PASTAS NUMERACAO.xlsx')
        rec.set('origin_sheet', 'ARQUIVO ATUAL')
        rec.set('origin_row', i + 2)
        rec.set('needs_review', !!f.needs_review)
        rec.set('review_reason', f.review_reason || '')
        if (companyMap[f.group_name]) rec.set('company', companyMap[f.group_name])
        if (f.person_name && peopleMap[f.person_name]) rec.set('person', peopleMap[f.person_name])
        app.save(rec)
      }
    }

    // 12. Pastas do ARQUIVO MORTO
    const mortoFolders = [
      // BAY PORT
      {
        code_legacy: 'N1',
        title: 'VIVO 7949',
        group_name: 'BAY PORT',
        category: 'Telecomunicações',
      },
      { code_legacy: 'N3', title: 'CLARO', group_name: 'BAY PORT', category: 'Telecomunicações' },
      { code_legacy: 'N4', title: 'COMGAS', group_name: 'BAY PORT', category: 'Contas de Consumo' },
      {
        code_legacy: 'N5',
        title: 'COND BAY PORT VAGAS',
        group_name: 'BAY PORT',
        category: 'Condomínio',
      },
      { code_legacy: 'N6', title: 'COND BAY PORT', group_name: 'BAY PORT', category: 'Condomínio' },
      { code_legacy: 'N7', title: 'ENEL', group_name: 'BAY PORT', category: 'Contas de Consumo' },
      { code_legacy: 'N8', title: 'IPTU BAY PORT', group_name: 'BAY PORT', category: 'IPTU' },
      { code_legacy: 'N9', title: 'IPTU VAGAS', group_name: 'BAY PORT', category: 'IPTU' },
      // JD ACAPULCO
      {
        code_legacy: 'N2',
        title: 'VIVO FIBRA 2390',
        group_name: 'JD ACAPULCO',
        category: 'Telecomunicações',
      },
      { code_legacy: 'N3', title: 'SKY', group_name: 'JD ACAPULCO', category: 'TV por Assinatura' },
      {
        code_legacy: 'N4',
        title: 'SABESP R49 - R50',
        group_name: 'JD ACAPULCO',
        category: 'Contas de Consumo',
      },
      {
        code_legacy: 'N6',
        title: 'ELEKTRO',
        group_name: 'JD ACAPULCO',
        category: 'Contas de Consumo',
      },
      { code_legacy: 'N7', title: 'IPTU JD ACAPULCO', group_name: 'JD ACAPULCO', category: 'IPTU' },
      // PESSOAIS
      {
        code_legacy: 'N1',
        title: 'VIVO ODAIR',
        group_name: 'PESSOAIS',
        category: 'Telecomunicações',
        person_name: 'ODAIR',
      },
      {
        code_legacy: 'N2',
        title: 'VIVO NADIA',
        group_name: 'PESSOAIS',
        category: 'Telecomunicações',
        person_name: 'NADIA',
      },
      {
        code_legacy: 'N3',
        title: 'DEPOSITOS PESSOAIS',
        group_name: 'PESSOAIS',
        category: 'Bancário',
      },
      {
        code_legacy: 'N4',
        title: 'NOTAS FISCAIS',
        group_name: 'PESSOAIS',
        category: 'Notas Fiscais',
      },
      {
        code_legacy: 'N5',
        title: 'IR FELIPE',
        group_name: 'PESSOAIS',
        category: 'Imposto de Renda',
        person_name: 'FELIPE',
      },
      {
        code_legacy: 'N7',
        title: 'IR NADIA',
        group_name: 'PESSOAIS',
        category: 'Imposto de Renda',
        person_name: 'NADIA',
      },
      {
        code_legacy: 'N8',
        title: 'IR ODAIR',
        group_name: 'PESSOAIS',
        category: 'Imposto de Renda',
        person_name: 'ODAIR',
      },
      {
        code_legacy: 'N9',
        title: 'SUL AMERICA',
        group_name: 'PESSOAIS',
        category: 'Saúde / Convênios',
      },
      {
        code_legacy: 'N10',
        title: 'PAULISTANO ODAIR',
        group_name: 'PESSOAIS',
        category: 'Clube / Pessoal',
        person_name: 'ODAIR',
      },
      // FELIPE
      {
        code_legacy: 'N2',
        title: 'COND MY WAY',
        group_name: 'FELIPE',
        category: 'Condomínio',
        person_name: 'FELIPE',
      },
      {
        code_legacy: 'N3',
        title: 'IPTU MY WAY',
        group_name: 'FELIPE',
        category: 'IPTU',
        person_name: 'FELIPE',
      },
      {
        code_legacy: 'N4',
        title: 'CLARO - BOULEVARD - MY WAY',
        group_name: 'FELIPE',
        category: 'Telecomunicações',
        person_name: 'FELIPE',
      },
      {
        code_legacy: 'N5',
        title: 'EXTRAS',
        group_name: 'FELIPE',
        category: 'Diversos',
        person_name: 'FELIPE',
      },
      {
        code_legacy: 'N6',
        title: 'VIVO',
        group_name: 'FELIPE',
        category: 'Telecomunicações',
        person_name: 'FELIPE',
      },
      {
        code_legacy: 'N7',
        title: 'COMGAS BOULEVARD',
        group_name: 'FELIPE',
        category: 'Contas de Consumo',
        person_name: 'FELIPE',
      },
      {
        code_legacy: 'N9',
        title: 'AMIL',
        group_name: 'FELIPE',
        category: 'Saúde',
        person_name: 'FELIPE',
      },
      {
        code_legacy: 'N10',
        title: 'PAULISTANO',
        group_name: 'FELIPE',
        category: 'Clube',
        person_name: 'FELIPE',
      },
      {
        code_legacy: 'N11',
        title: 'IPTU BOULEVARD',
        group_name: 'FELIPE',
        category: 'IPTU',
        person_name: 'FELIPE',
      },
      {
        code_legacy: 'N12',
        title: 'CONDOMINIO BOULEVARD',
        group_name: 'FELIPE',
        category: 'Condomínio',
        person_name: 'FELIPE',
      },
      {
        code_legacy: 'N13',
        title: 'ENEL BOULEVARD - MY WAY',
        group_name: 'FELIPE',
        category: 'Contas de Consumo',
        person_name: 'FELIPE',
      },
      // EMPRESAS -> GRUPO VL
      {
        code_legacy: 'N1',
        title: 'VIVO 3062-3323 FIBRA',
        group_name: 'GRUPO VL',
        category: 'Telecomunicações',
      },
      { code_legacy: 'N5', title: 'ENEL', group_name: 'GRUPO VL', category: 'Contas de Consumo' },
      { code_legacy: 'N6', title: 'ALUGUEL ACH', group_name: 'GRUPO VL', category: 'Locação' },
      { code_legacy: 'N7', title: 'ADL4 GERAL', group_name: 'GRUPO VL', category: 'Geral' },
      {
        code_legacy: 'N8',
        title: 'IPTU E COND ACH',
        group_name: 'GRUPO VL',
        category: 'IPTU / Condomínio',
      },
      // CAPANNONE
      {
        code_legacy: 'N2',
        title: 'CONTRATOS SOCIAIS',
        group_name: 'CAPANNONE',
        category: 'Societário',
      },
    ]

    for (let i = 0; i < mortoFolders.length; i++) {
      const f = mortoFolders[i]
      try {
        app.findFirstRecordByFilter(
          'folders',
          `title = '${f.title}' && archive_type = 'Morto' && group_name = '${f.group_name}'`,
        )
      } catch (_) {
        const rec = new Record(foldersCol)
        rec.set('code_legacy', f.code_legacy)
        rec.set('title', f.title)
        rec.set('group_name', f.group_name)
        rec.set('archive_type', 'Morto')
        rec.set('status', 'No Arquivo')
        rec.set('confidentiality', 'Normal')
        rec.set('category', f.category || 'Geral')
        rec.set('cycle_status', 'Arquivo Morto')
        rec.set('location_text', `Arquivo Central → Sala 02 → Estante A`)
        rec.set('responsible', 'Arquivo Morto')
        rec.set('import_source', 'PASTAS NUMERACAO.xlsx')
        rec.set('origin_sheet', 'ARQUIVO MORTO')
        rec.set('origin_row', i + 2)
        if (companyMap[f.group_name]) rec.set('company', companyMap[f.group_name])
        if (f.person_name && peopleMap[f.person_name]) rec.set('person', peopleMap[f.person_name])
        app.save(rec)
      }
    }

    // 13. Pastas vinculadas a Caixas Físicas (CAIXAS ARQUIVOS)
    const caixaPastas = [
      // CX N2
      { box_code: 'CX N2', code_legacy: 'N2/01', title: 'ELIAS E FRANCISCA' },
      { box_code: 'CX N2', code_legacy: 'N2/02', title: 'MADALENA - GUARUJA' },
      { box_code: 'CX N2', code_legacy: 'N2/03', title: 'TOTO - GUARUJA' },
      { box_code: 'CX N2', code_legacy: 'N2/04', title: 'ZE LUIS' },
      { box_code: 'CX N2', code_legacy: 'N2/05', title: 'ROSA - VELHA' },
      // CX N3
      {
        box_code: 'CX N3',
        code_legacy: 'N3/01',
        title: 'VIACAO SAO DIMAS - PROMISSORIAS NA PASTA - TA COM FABIO',
        notes: "Observação 'TA COM FABIO' detectada no conteúdo",
        needs_review: true,
        review_reason: 'Observação detectada',
      },
      { box_code: 'CX N3', code_legacy: 'N3/02', title: 'BREDA SOROCABA' },
      {
        box_code: 'CX N3',
        code_legacy: 'N3/03',
        title: 'ITABUNA - VIACAO CIDADE SORRISO - ESDRAS',
      },
      { box_code: 'CX N3', code_legacy: 'N3/04', title: 'PASSARO MARROM' },
      { box_code: 'CX N3', code_legacy: 'N3/05', title: 'VIACAO COMETA' },
      { box_code: 'CX N3', code_legacy: 'N3/06', title: 'VIACAO LIMEIRENSE' },
      { box_code: 'CX N3', code_legacy: 'N3/07', title: 'TECNIBUS - EXPOBUS' },
      { box_code: 'CX N3', code_legacy: 'N3/08', title: 'VILA GALVAO' },
      { box_code: 'CX N3', code_legacy: 'N3/09', title: 'TERRENO PALLAZINI' },
      { box_code: 'CX N3', code_legacy: 'N3/10', title: 'VL X IKATU - ZECA ROMANO' },
      // CX N4
      {
        box_code: 'CX N4',
        code_legacy: 'N4/01',
        title:
          'CAMURUJIPE - ADVOGADO SERGIO NUNES + GUIAS 2022 - INSTRUMENTO CESSAO CREDITO DALOCANS X VL',
        needs_review: true,
        review_reason: 'Código N4/01 repetido 3 vezes',
      },
      {
        box_code: 'CX N4',
        code_legacy: 'N4/01',
        title: 'CAMURUJIPE - RITA (PASTA 1)',
        needs_review: true,
        review_reason: 'Código N4/01 repetido 3 vezes',
      },
      {
        box_code: 'CX N4',
        code_legacy: 'N4/01',
        title: 'CAMURUJIPE - RITA (PASTA 2)',
        needs_review: true,
        review_reason: 'Código N4/01 repetido 3 vezes',
      },
      { box_code: 'CX N4', code_legacy: 'N4/04', title: 'PROCESSOS GUARUJA - ACAPULCO' },
      { box_code: 'CX N4', code_legacy: 'N4/05', title: 'MARCIO XAVIER' },
      {
        box_code: 'CX N4',
        code_legacy: '*******',
        title: 'DOSSIE ANDRE CARPINTEIRO CX4',
        needs_review: true,
        review_reason: 'Código legado estranho *******',
      },
      // CX N5/01 e N5/02
      { box_code: 'CX N5/01', code_legacy: 'N5/01', title: 'BANCO AGRIMISA' },
      { box_code: 'CX N5/01', code_legacy: 'N5/02', title: 'EVELINA MALUF' },
      { box_code: 'CX N5/01', code_legacy: 'N5/03', title: 'MANOEL RODRIGUES - NETO' },
      {
        box_code: 'CX N5/01',
        code_legacy: 'N5/04',
        title: 'CCW - GARY - OTM (VOL 1)',
        needs_review: true,
        review_reason: 'N5/04 repetido 4 vezes',
      },
      {
        box_code: 'CX N5/01',
        code_legacy: 'N5/04',
        title: 'CCW - GARY - OTM (VOL 2)',
        needs_review: true,
        review_reason: 'N5/04 repetido 4 vezes',
      },
      {
        box_code: 'CX N5/01',
        code_legacy: 'N5/04',
        title: 'CCW - GARY - OTM (VOL 3)',
        needs_review: true,
        review_reason: 'N5/04 repetido 4 vezes',
      },
      {
        box_code: 'CX N5/01',
        code_legacy: 'N5/04',
        title: 'CCW - GARY - OTM (VOL 4)',
        needs_review: true,
        review_reason: 'N5/04 repetido 4 vezes',
      },
      {
        box_code: 'CX N5/01',
        code_legacy: 'N5/05',
        title: 'ELIANA OGER + CRISTIAN ADVOGADO ITAMARATI - 3 PASTAS',
      },
      { box_code: 'CX N5/01', code_legacy: 'N5/06', title: 'VALDIRENE' },
      {
        box_code: 'CX N5/01',
        code_legacy: 'N5/07',
        title:
          'BANCO TRICURY - PASTA 1 - CONTRATOS - RECIBOS - PROCURACOES - CERTIDOES - DECLARACOES - EMAILS',
        needs_review: true,
        review_reason: 'N5/07 utilizado para 4 pastas distintas',
      },
      {
        box_code: 'CX N5/01',
        code_legacy: 'N5/07',
        title: 'BANCO TRICURY - PASTA 2 - CITACOES',
        needs_review: true,
        review_reason: 'N5/07 utilizado para 4 pastas distintas',
      },
      {
        box_code: 'CX N5/01',
        code_legacy: 'N5/07',
        title: 'BANCO TRICURY - PASTA 3 - DEFESAS - CONT COMPRA E VENDA - DOCS GERAIS',
        needs_review: true,
        review_reason: 'N5/07 utilizado para 4 pastas distintas',
      },
      {
        box_code: 'CX N5/01',
        code_legacy: 'N5/07',
        title: 'BANCO TRICURY - PASTA 4 - DESPESAS',
        needs_review: true,
        review_reason: 'N5/07 utilizado para 4 pastas distintas',
      },
      // CX N6
      {
        box_code: 'CX N6',
        code_legacy: 'N6/01',
        title: 'INSS NADIA 1982 A 1988',
        person_name: 'NADIA',
      },
      {
        box_code: 'CX N6',
        code_legacy: 'N6/02',
        title: 'INSS NADIA 1989 A 2015',
        person_name: 'NADIA',
      },
      {
        box_code: 'CX N6',
        code_legacy: 'N6/03',
        title: 'INSS ODAIR 1985 A 1990',
        person_name: 'ODAIR',
      },
      {
        box_code: 'CX N6',
        code_legacy: 'N6/04',
        title: 'INSS ODAIR 1991 A 1997',
        person_name: 'ODAIR',
      },
      { box_code: 'CX N6', code_legacy: 'N6/05', title: 'ODAIR CARNES', person_name: 'ODAIR' },
      { box_code: 'CX N6', code_legacy: 'N6/06', title: 'INSS GIULIANO', person_name: 'GIULIANO' },
      { box_code: 'CX N6', code_legacy: 'N6/07', title: 'INSS FELIPE', person_name: 'FELIPE' },
      // CX N7
      { box_code: 'CX N7', code_legacy: 'N7/01', title: 'CRISTIANE GUARUJA' },
      { box_code: 'CX N7', code_legacy: 'N7/02', title: 'JAIR GUARUJA' },
      { box_code: 'CX N7', code_legacy: 'N7/03', title: 'PRETA - IRANILDA' },
      { box_code: 'CX N7', code_legacy: 'N7/04', title: 'LOURDES' },
      { box_code: 'CX N7', code_legacy: 'N7/05', title: 'ELIAS' },
      { box_code: 'CX N7', code_legacy: 'N7/06', title: 'HO' },
      { box_code: 'CX N7', code_legacy: 'N7/07', title: 'MARINALVA' },
      { box_code: 'CX N7', code_legacy: 'N7/08', title: 'MARIA BENEDITA - CAMPOS DO JORDAO' },
      { box_code: 'CX N7', code_legacy: 'N7/09', title: 'IVONETE' },
      { box_code: 'CX N7', code_legacy: 'N7/10', title: 'PEDRO' },
      { box_code: 'CX N7', code_legacy: 'N7/11', title: 'GLORIA' },
      { box_code: 'CX N7', code_legacy: 'N7/12', title: 'VIVIANE' },
      { box_code: 'CX N7', code_legacy: 'N7/13', title: 'IRIS' },
      {
        box_code: 'CX N7',
        code_legacy: 'N7/14',
        title: 'GUSTAVO',
        needs_review: true,
        review_reason: 'N7/14 repetido 3x',
      },
      {
        box_code: 'CX N7',
        code_legacy: 'N7/14',
        title: 'ANDREA',
        needs_review: true,
        review_reason: 'N7/14 repetido 3x',
      },
      {
        box_code: 'CX N7',
        code_legacy: 'N7/14',
        title: 'DANIEL',
        needs_review: true,
        review_reason: 'N7/14 repetido 3x',
      },
      { box_code: 'CX N7', code_legacy: 'N7/15', title: 'MANOEL VICENTE NETO' },
      { box_code: 'CX N7', code_legacy: 'N7/16', title: 'SANDRA' },
      { box_code: 'CX N7', code_legacy: 'N7/17', title: 'MADALENA' },
      // CX N8
      {
        box_code: 'CX N8',
        code_legacy: 'N8/05',
        title: 'ESCRITURA JD ACAPULCO LOTES 4,5,6 ODAIR LOCANTO',
      },
      {
        box_code: 'CX N8',
        code_legacy: 'N8/06',
        title: 'ESCRITURA JD ACAPULCO LOTE 17,18,19 ODAIR LOCANTO',
      },
      { box_code: 'CX N8', code_legacy: 'N8/07', title: 'APARTAMENTO BAY PORT' },
      { box_code: 'CX N8', code_legacy: 'N8/12', title: 'APARTAMENTO MY WAY' },
      { box_code: 'CX N8', code_legacy: 'N8/13', title: 'APARTAMENTO JADE' },
      {
        box_code: 'CX N8',
        code_legacy: 'N8/14',
        title: 'VAGAS CARLA - RECIBOS - PROMISSORIA - ESCRITURA',
      },
      { box_code: 'CX N8', code_legacy: 'N8/15', title: 'ESCRITURA GRAND BOULEVARD' },
      // CX N8/2
      { box_code: 'CX N8/2', code_legacy: 'N8/08', title: 'APARTAMENTO ST PATRICK' },
      {
        box_code: 'CX N8/2',
        code_legacy: 'N8/09',
        title: 'CONJUNTOS RJ EDIFICIO BARTOLOMEU DE GUSMAO',
      },
      { box_code: 'CX N8/2', code_legacy: 'N8/10', title: 'ESCRITURA CAMPOS DO JORDAO' },
      { box_code: 'CX N8/2', code_legacy: 'N8/11', title: 'ESCRITURA RUA ARGENTINA' },
      // CX N9
      { box_code: 'CX N9', code_legacy: 'N9/01', title: 'DOCS PREFEITURA E CRA NADIA' },
      { box_code: 'CX N9', code_legacy: 'N9/02', title: 'PARCELAMENTO GARE E DARE NADIA' },
      { box_code: 'CX N9', code_legacy: 'N9/03', title: 'FABIO ROGERIO SOUZA' },
      {
        box_code: 'CX N9',
        code_legacy: 'N9/04',
        title: 'DUILIO - ORLANDO - DR. WILSON - ALBERTO - MAZON - CHACUR',
      },
      { box_code: 'CX N9', code_legacy: 'N9/05', title: 'DALOCANS - CONTRATO SOCIAL - ULTIMO' },
      { box_code: 'CX N9', code_legacy: 'N9/06', title: 'FL CONSTRUTORA' },
      {
        box_code: 'CX N9',
        code_legacy: 'N9/07',
        title: 'AUTOPOSTO MENINOS - SUSAN T - ZONA LIVRE',
      },
      { box_code: 'CX N9', code_legacy: 'N9/08', title: 'PACAEMBUS - REFORBUS' },
      { box_code: 'CX N9', code_legacy: 'N9/09', title: 'ATTIVO DOCUMENTOS' },
      { box_code: 'CX N9', code_legacy: 'N9/10', title: 'PETLAND' },
      // CX N10
      { box_code: 'CX N10', code_legacy: 'N10/01', title: 'VALDINEI' },
      {
        box_code: 'CX N10',
        code_legacy: 'N10/02',
        title: 'VAZIO',
        needs_review: true,
        review_reason: 'Registro vazio marcado na planilha',
      },
      { box_code: 'CX N10', code_legacy: 'N10/05', title: 'ROSANA' },
      { box_code: 'CX N10', code_legacy: 'N10/07', title: 'TIHAGO' },
      { box_code: 'CX N10', code_legacy: 'N10/08', title: 'CARLOS' },
      // CX N11
      {
        box_code: 'CX N11',
        code_legacy: 'CX11/01',
        title: 'LIVRETOS',
        needs_review: true,
        review_reason: 'Registro sem subcódigo na planilha',
      },
      {
        box_code: 'CX N11',
        code_legacy: 'CX11/02',
        title: 'ATA DE ASSEMBLEIA',
        needs_review: true,
        review_reason: 'Registro sem subcódigo na planilha',
      },
      {
        box_code: 'CX N11',
        code_legacy: 'CX11/03',
        title: 'DECLARACAO',
        needs_review: true,
        review_reason: 'Registro sem subcódigo na planilha',
      },
      // CX N12
      { box_code: 'CX N12', code_legacy: 'N12/01', title: 'BRASAO FAMILIA LOCANTO' },
      { box_code: 'CX N12', code_legacy: 'N12/02', title: 'INES FERRI E FAMILIA' },
      { box_code: 'CX N12', code_legacy: 'N12/03', title: 'ARACY DENORAH E FAMILIA' },
      { box_code: 'CX N12', code_legacy: 'N12/04', title: 'FAMILIA LOCANTO' },
    ]

    for (let i = 0; i < caixaPastas.length; i++) {
      const cp = caixaPastas[i]
      try {
        app.findFirstRecordByFilter(
          'folders',
          `title = '${cp.title}' && box_code = '${cp.box_code}'`,
        )
      } catch (_) {
        const rec = new Record(foldersCol)
        rec.set('code_legacy', cp.code_legacy)
        rec.set('title', cp.title)
        rec.set('box_code', cp.box_code)
        if (boxMap[cp.box_code]) rec.set('box', boxMap[cp.box_code])
        rec.set('archive_type', 'Morto')
        rec.set('status', 'No Arquivo')
        rec.set('category', 'Caixas de Arquivo')
        rec.set('cycle_status', 'Arquivo Morto')
        rec.set('location_text', `Caixa ${cp.box_code}`)
        rec.set('import_source', 'PASTAS NUMERACAO.xlsx')
        rec.set('origin_sheet', 'CAIXAS ARQUIVOS')
        rec.set('origin_row', i + 2)
        rec.set('needs_review', !!cp.needs_review)
        rec.set('review_reason', cp.review_reason || '')
        if (cp.person_name && peopleMap[cp.person_name])
          rec.set('person', peopleMap[cp.person_name])
        app.save(rec)
      }
    }

    // 14. Regras de retenção iniciais
    const retCol = app.findCollectionByNameOrId('retention_rules')
    const defaultRules = [
      {
        doc_type: 'Contrato Social / Societário',
        retention_years: 100,
        suggested_action: 'Guarda Permanente',
        notes: 'Documentos de constituição de empresa',
      },
      {
        doc_type: 'Trabalhista / RH (Geral)',
        retention_years: 5,
        suggested_action: 'Descarte',
        notes: 'Após o término do contrato de trabalho',
      },
      {
        doc_type: 'Previdenciário / INSS',
        retention_years: 30,
        suggested_action: 'Guarda Permanente',
        notes: 'Comprovação de tempo de contribuição',
      },
      {
        doc_type: 'Fiscal / Tributário / GARE',
        retention_years: 5,
        suggested_action: 'Descarte',
        notes: 'Prazo decadencial de 5 anos',
      },
      {
        doc_type: 'Imobiliário / Escritura',
        retention_years: 100,
        suggested_action: 'Guarda Permanente',
        notes: 'Escrituras e registros de imóveis',
      },
      {
        doc_type: 'Contas de Consumo (Luz, Gás, Tel)',
        retention_years: 5,
        suggested_action: 'Descarte',
        notes: 'Quitações anuais',
      },
    ]

    for (let i = 0; i < defaultRules.length; i++) {
      const dr = defaultRules[i]
      try {
        app.findFirstRecordByData('retention_rules', 'doc_type', dr.doc_type)
      } catch (_) {
        const rec = new Record(retCol)
        rec.set('doc_type', dr.doc_type)
        rec.set('retention_years', dr.retention_years)
        rec.set('suggested_action', dr.suggested_action)
        rec.set('notes', dr.notes)
        app.save(rec)
      }
    }

    // 15. Audit Log inicial da migração
    const auditCol = app.findCollectionByNameOrId('audit_logs')
    try {
      const logRec = new Record(auditCol)
      logRec.set('user_email', 'admin@flarquivos.com')
      logRec.set('user_name', 'Sistema de Migração')
      logRec.set('record_type', 'migration_batch')
      logRec.set('record_id', 'MIG-001')
      logRec.set('action', 'IMPORTACAO_EXCEL')
      logRec.set(
        'details',
        'Carga inicial dos dados da planilha PASTAS NUMERACAO.xlsx com preservação integral de códigos e inconsistências',
      )
      app.save(logRec)
    } catch (_) {}
  },
  (app) => {
    // rollback
  },
)
