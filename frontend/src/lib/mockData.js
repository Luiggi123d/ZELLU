// ============================================================
// Zellu - Dados Mockados Realistas de Farmácia Brasileira
// ============================================================

export const mockContacts = [
  {
    id: '1',
    name: 'Maria Silva Santos',
    phone: '(11) 98765-4321',
    email: 'maria.silva@email.com',
    cpf: '123.456.789-00',
    birth_date: '1958-03-15',
    tags: ['hipertensão', 'diabetes', 'fidelidade'],
    status: 'active',
    relationship_score: 92,
    last_purchase_at: '2026-04-11T14:30:00',
    total_purchases: 47,
    total_spent: 4250.80,
    avg_ticket: 90.44,
    medications: ['Losartana 50mg', 'Metformina 850mg', 'AAS 100mg'],
    notes: 'Cliente fiel há 3 anos. Sempre compra no início do mês. Prefere genéricos.',
    history: [
      { date: '2026-04-11', type: 'purchase', description: 'Losartana 50mg + Metformina 850mg', value: 89.90 },
      { date: '2026-04-08', type: 'message', description: 'Lembrete de medicamento enviado' },
      { date: '2026-03-12', type: 'purchase', description: 'Losartana 50mg + AAS 100mg + Vitamina D', value: 125.50 },
      { date: '2026-03-01', type: 'campaign', description: 'Campanha Dia da Mulher - cupom 10%' },
      { date: '2026-02-10', type: 'purchase', description: 'Metformina 850mg', value: 42.90 },
    ],
  },
  {
    id: '2',
    name: 'João Carlos Oliveira',
    phone: '(11) 97654-3210',
    email: 'joao.oliveira@email.com',
    cpf: '234.567.890-11',
    birth_date: '1965-07-22',
    tags: ['hipertensão', 'colesterol'],
    status: 'cooling',
    relationship_score: 54,
    last_purchase_at: '2026-03-05T10:15:00',
    total_purchases: 23,
    total_spent: 2180.40,
    avg_ticket: 94.80,
    medications: ['Atenolol 25mg', 'Sinvastatina 20mg'],
    notes: 'Comprava todo mês, mas não aparece há mais de 30 dias. Possível migração para concorrente.',
    history: [
      { date: '2026-03-05', type: 'purchase', description: 'Atenolol 25mg + Sinvastatina 20mg', value: 78.60 },
      { date: '2026-02-03', type: 'purchase', description: 'Atenolol 25mg + Sinvastatina 20mg', value: 78.60 },
      { date: '2026-01-08', type: 'message', description: 'Perguntou sobre manipulados para colesterol' },
    ],
  },
  {
    id: '3',
    name: 'Ana Beatriz Ferreira',
    phone: '(11) 96543-2109',
    email: 'anabeatriz@email.com',
    cpf: '345.678.901-22',
    birth_date: '1982-11-30',
    tags: ['manipulados', 'dermatologia'],
    status: 'active',
    relationship_score: 88,
    last_purchase_at: '2026-04-10T16:45:00',
    total_purchases: 31,
    total_spent: 5670.00,
    avg_ticket: 182.90,
    medications: ['Ácido Hialurônico Creme', 'Vitamina C Sérum', 'Colágeno Hidrolisado'],
    notes: 'Compra manipulados regularmente. Ticket médio alto. Indicou 3 clientes.',
    history: [
      { date: '2026-04-10', type: 'purchase', description: 'Ácido Hialurônico + Vitamina C Sérum', value: 210.00 },
      { date: '2026-03-28', type: 'message', description: 'Pediu orçamento de fórmula manipulada' },
      { date: '2026-03-15', type: 'purchase', description: 'Colágeno Hidrolisado 30 sachês', value: 189.90 },
    ],
  },
  {
    id: '4',
    name: 'Carlos Eduardo Mendes',
    phone: '(11) 95432-1098',
    email: 'carlos.mendes@email.com',
    cpf: '456.789.012-33',
    birth_date: '1970-05-18',
    tags: ['diabetes', 'hipertensão', 'obesidade'],
    status: 'lost',
    relationship_score: 15,
    last_purchase_at: '2025-12-20T09:00:00',
    total_purchases: 18,
    total_spent: 1560.30,
    avg_ticket: 86.68,
    medications: ['Glifage XR 500mg', 'Losartana 100mg', 'Orlistate 120mg'],
    notes: 'Não compra há quase 4 meses. Última tentativa de contato sem resposta.',
    history: [
      { date: '2025-12-20', type: 'purchase', description: 'Glifage XR 500mg + Losartana 100mg', value: 112.40 },
      { date: '2026-01-15', type: 'message', description: 'Lembrete enviado - sem resposta' },
      { date: '2026-02-20', type: 'message', description: 'Oferta especial enviada - sem resposta' },
    ],
  },
  {
    id: '5',
    name: 'Francisca Lima Souza',
    phone: '(11) 94321-0987',
    email: null,
    cpf: '567.890.123-44',
    birth_date: '1950-01-08',
    tags: ['idoso', 'polifarmácia', 'fidelidade'],
    status: 'active',
    relationship_score: 95,
    last_purchase_at: '2026-04-12T11:20:00',
    total_purchases: 68,
    total_spent: 8920.50,
    avg_ticket: 131.18,
    medications: ['Omeprazol 20mg', 'Losartana 50mg', 'Metformina 500mg', 'Levotiroxina 50mcg', 'Cálcio + Vit D'],
    notes: 'Cliente mais antiga. Compra 5 medicamentos fixos. Filho busca todo dia 12.',
    history: [
      { date: '2026-04-12', type: 'purchase', description: '5 medicamentos do mês', value: 198.70 },
      { date: '2026-03-12', type: 'purchase', description: '5 medicamentos do mês', value: 198.70 },
      { date: '2026-02-12', type: 'purchase', description: '5 medicamentos do mês + Buscopan', value: 215.30 },
    ],
  },
  {
    id: '6',
    name: 'Pedro Henrique Costa',
    phone: '(11) 93210-9876',
    email: 'pedro.costa@email.com',
    cpf: '678.901.234-55',
    birth_date: '1990-09-25',
    tags: ['suplementos', 'fitness'],
    status: 'cooling',
    relationship_score: 42,
    last_purchase_at: '2026-03-01T15:30:00',
    total_purchases: 8,
    total_spent: 960.00,
    avg_ticket: 120.00,
    medications: ['Whey Protein', 'Creatina', 'Ômega 3'],
    notes: 'Compra suplementos esporadicamente. Sensível a preço.',
    history: [
      { date: '2026-03-01', type: 'purchase', description: 'Whey Protein 900g + Creatina', value: 189.90 },
      { date: '2026-01-15', type: 'purchase', description: 'Ômega 3 + Multivitamínico', value: 95.80 },
    ],
  },
  {
    id: '7',
    name: 'Lucia Fernanda Almeida',
    phone: '(11) 92109-8765',
    email: 'lucia.almeida@email.com',
    cpf: '789.012.345-66',
    birth_date: '1975-04-12',
    tags: ['ansiedade', 'insônia', 'manipulados'],
    status: 'active',
    relationship_score: 78,
    last_purchase_at: '2026-04-09T13:00:00',
    total_purchases: 15,
    total_spent: 2340.00,
    avg_ticket: 156.00,
    medications: ['Passiflora Composta', 'Melatonina 3mg', 'Magnésio Quelado'],
    notes: 'Prefere fitoterápicos e manipulados. Sempre consulta a farmacêutica antes de comprar.',
    history: [
      { date: '2026-04-09', type: 'purchase', description: 'Passiflora Composta + Melatonina', value: 145.00 },
      { date: '2026-03-20', type: 'message', description: 'Perguntou sobre magnésio para ansiedade' },
      { date: '2026-03-10', type: 'purchase', description: 'Magnésio Quelado + Ashwagandha', value: 168.00 },
    ],
  },
  {
    id: '8',
    name: 'Roberto Nascimento',
    phone: '(11) 91098-7654',
    email: null,
    cpf: '890.123.456-77',
    birth_date: '1962-12-03',
    tags: ['hipertensão', 'diabetes'],
    status: 'lost',
    relationship_score: 8,
    last_purchase_at: '2025-11-10T10:00:00',
    total_purchases: 12,
    total_spent: 890.40,
    avg_ticket: 74.20,
    medications: ['Losartana 50mg', 'Glibenclamida 5mg'],
    notes: 'Mudou de bairro. Provavelmente migrou para farmácia mais próxima.',
    history: [
      { date: '2025-11-10', type: 'purchase', description: 'Losartana + Glibenclamida', value: 65.80 },
      { date: '2026-01-05', type: 'message', description: 'Mensagem de boas-festas - visualizada, sem resposta' },
    ],
  },
  {
    id: '9',
    name: 'Mariana Rodrigues',
    phone: '(11) 90987-6543',
    email: 'mariana.rodrigues@email.com',
    cpf: '901.234.567-88',
    birth_date: '1988-06-20',
    tags: ['gestante', 'vitaminas'],
    status: 'active',
    relationship_score: 85,
    last_purchase_at: '2026-04-13T09:30:00',
    total_purchases: 6,
    total_spent: 780.00,
    avg_ticket: 130.00,
    medications: ['Ácido Fólico', 'Sulfato Ferroso', 'DHA Gestante', 'Vitamina B12'],
    notes: 'Gestante de 7 meses. Compra vitaminas pré-natais semanalmente. Parto previsto para junho.',
    history: [
      { date: '2026-04-13', type: 'purchase', description: 'DHA Gestante + Ácido Fólico', value: 135.00 },
      { date: '2026-04-06', type: 'purchase', description: 'Sulfato Ferroso + Vitamina B12', value: 88.50 },
      { date: '2026-03-30', type: 'message', description: 'Agradeceu a dica sobre DHA' },
    ],
  },
  {
    id: '10',
    name: 'Antônio José Barbosa',
    phone: '(11) 99876-5432',
    email: 'antonio.barbosa@email.com',
    cpf: '012.345.678-99',
    birth_date: '1955-08-14',
    tags: ['hipertensão', 'colesterol', 'fidelidade'],
    status: 'cooling',
    relationship_score: 48,
    last_purchase_at: '2026-03-10T08:45:00',
    total_purchases: 35,
    total_spent: 3150.60,
    avg_ticket: 90.02,
    medications: ['Anlodipino 5mg', 'Rosuvastatina 10mg', 'AAS 100mg'],
    notes: 'Cliente antigo, era muito fiel. Último mês não veio. Verificar se está tudo bem.',
    history: [
      { date: '2026-03-10', type: 'purchase', description: 'Anlodipino + Rosuvastatina + AAS', value: 92.30 },
      { date: '2026-02-08', type: 'purchase', description: 'Anlodipino + Rosuvastatina + AAS', value: 92.30 },
      { date: '2026-01-10', type: 'purchase', description: 'Anlodipino + Rosuvastatina + AAS + Vitamina D', value: 118.90 },
    ],
  },
  {
    id: '11',
    name: 'Renata Campos',
    phone: '(11) 98888-1234',
    email: 'renata.campos@email.com',
    cpf: '111.222.333-44',
    birth_date: '1985-02-28',
    tags: ['dermatologia', 'manipulados', 'estética'],
    status: 'active',
    relationship_score: 81,
    last_purchase_at: '2026-04-12T17:00:00',
    total_purchases: 19,
    total_spent: 4200.00,
    avg_ticket: 221.05,
    medications: ['Retinol Sérum 0.5%', 'Protetor Solar FPS 70', 'Niacinamida 10%'],
    notes: 'Dermatologista indicou. Compra fórmulas caras. Alto valor de ticket.',
    history: [
      { date: '2026-04-12', type: 'purchase', description: 'Retinol Sérum + Protetor Solar Manipulado', value: 265.00 },
      { date: '2026-03-25', type: 'purchase', description: 'Niacinamida + Ácido Hialurônico', value: 198.00 },
    ],
  },
  {
    id: '12',
    name: 'José Aparecido da Silva',
    phone: '(11) 97777-5678',
    email: null,
    cpf: '222.333.444-55',
    birth_date: '1948-10-05',
    tags: ['idoso', 'polifarmácia', 'entrega'],
    status: 'active',
    relationship_score: 90,
    last_purchase_at: '2026-04-11T10:00:00',
    total_purchases: 52,
    total_spent: 7800.00,
    avg_ticket: 150.00,
    medications: ['Enalapril 10mg', 'Hidroclorotiazida 25mg', 'Metformina 850mg', 'Omeprazol 20mg', 'Dorflex'],
    notes: 'Pede entrega em casa. Mora sozinho. Sempre pede para explicar a posologia.',
    history: [
      { date: '2026-04-11', type: 'purchase', description: 'Medicamentos do mês + Dorflex', value: 165.00 },
      { date: '2026-03-11', type: 'purchase', description: 'Medicamentos do mês', value: 148.00 },
    ],
  },
];

// ============================================================
// CONVERSATIONS
// ============================================================
export const mockConversations = [
  {
    id: 'conv-1',
    contact: mockContacts[0],
    status: 'open',
    unread_count: 2,
    last_message_at: '2026-04-13T10:30:00',
    last_message_preview: 'Bom dia! Meu remédio da pressão acabou, posso pegar hoje?',
    assigned_to: 'Farmacêutica Ana',
    minutes_without_response: 15,
    messages: [
      { id: 'm1', direction: 'inbound', content: 'Bom dia! Meu remédio da pressão acabou, posso pegar hoje?', created_at: '2026-04-13T10:30:00', status: 'read' },
      { id: 'm2', direction: 'inbound', content: 'É a Losartana 50mg e a Metformina', created_at: '2026-04-13T10:31:00', status: 'read' },
    ],
  },
  {
    id: 'conv-2',
    contact: mockContacts[2],
    status: 'open',
    unread_count: 1,
    last_message_at: '2026-04-13T09:45:00',
    last_message_preview: 'O sérum de vitamina C ficou pronto? Posso buscar depois das 15h?',
    assigned_to: 'Farmacêutica Ana',
    minutes_without_response: 60,
    messages: [
      { id: 'm3', direction: 'outbound', content: 'Oi Ana! Seu manipulado ficou pronto. Pode retirar a partir de amanhã.', created_at: '2026-04-12T16:00:00', status: 'read' },
      { id: 'm4', direction: 'inbound', content: 'O sérum de vitamina C ficou pronto? Posso buscar depois das 15h?', created_at: '2026-04-13T09:45:00', status: 'delivered' },
    ],
  },
  {
    id: 'conv-3',
    contact: mockContacts[8],
    status: 'open',
    unread_count: 0,
    last_message_at: '2026-04-13T09:30:00',
    last_message_preview: 'Separei tudo pra você! Pode vir buscar até as 18h.',
    assigned_to: 'Farmacêutica Ana',
    minutes_without_response: 0,
    messages: [
      { id: 'm5', direction: 'inbound', content: 'Oi! Preciso do DHA gestante e ácido fólico, tem aí?', created_at: '2026-04-13T09:15:00', status: 'read' },
      { id: 'm6', direction: 'outbound', content: 'Oi Mariana! Temos sim. Tudo pronto pra você!', created_at: '2026-04-13T09:20:00', status: 'read' },
      { id: 'm7', direction: 'outbound', content: 'Separei tudo pra você! Pode vir buscar até as 18h.', created_at: '2026-04-13T09:30:00', status: 'delivered' },
    ],
  },
  {
    id: 'conv-4',
    contact: mockContacts[4],
    status: 'open',
    unread_count: 1,
    last_message_at: '2026-04-13T08:00:00',
    last_message_preview: 'Bom dia, é o filho da Dona Francisca. Pode separar os remédios dela?',
    assigned_to: null,
    minutes_without_response: 165,
    messages: [
      { id: 'm8', direction: 'inbound', content: 'Bom dia, é o filho da Dona Francisca. Pode separar os remédios dela? Passo aí depois do almoço.', created_at: '2026-04-13T08:00:00', status: 'delivered' },
    ],
  },
  {
    id: 'conv-5',
    contact: mockContacts[6],
    status: 'closed',
    unread_count: 0,
    last_message_at: '2026-04-12T18:00:00',
    last_message_preview: 'Obrigada pela indicação! Vou experimentar o magnésio quelado.',
    assigned_to: 'Farmacêutica Ana',
    minutes_without_response: 0,
    messages: [
      { id: 'm9', direction: 'inbound', content: 'Oi, estou com muita ansiedade. Tem algo natural que ajude?', created_at: '2026-04-12T17:30:00', status: 'read' },
      { id: 'm10', direction: 'outbound', content: 'Oi Lucia! O magnésio quelado tem ajudado muitos clientes. Associado com passiflora, o efeito é ainda melhor.', created_at: '2026-04-12T17:45:00', status: 'read' },
      { id: 'm11', direction: 'inbound', content: 'Obrigada pela indicação! Vou experimentar o magnésio quelado.', created_at: '2026-04-12T18:00:00', status: 'read' },
    ],
  },
  {
    id: 'conv-6',
    contact: mockContacts[1],
    status: 'pending',
    unread_count: 0,
    last_message_at: '2026-04-10T14:00:00',
    last_message_preview: 'Oi João! Faz tempo que não te vemos. Tá tudo bem? Seus medicamentos estão separados aqui.',
    assigned_to: 'Farmacêutica Ana',
    minutes_without_response: 0,
    messages: [
      { id: 'm12', direction: 'outbound', content: 'Oi João! Faz tempo que não te vemos. Tá tudo bem? Seus medicamentos estão separados aqui.', created_at: '2026-04-10T14:00:00', status: 'delivered' },
    ],
  },
];

// ============================================================
// CAMPAIGNS
// ============================================================
export const mockCampaigns = [
  {
    id: 'camp-1',
    name: 'Lembrete de Recompra — Hipertensão',
    message_template: 'Olá {nome}! Notamos que seu {medicamento} deve estar acabando. Temos disponível aqui na farmácia. Quer que a gente separe pra você? 💊',
    target_tags: ['hipertensão'],
    status: 'pending',
    suggested_by: 'IA',
    reason: '3 clientes com hipertensão não compraram há mais de 25 dias',
    scheduled_at: null,
    total_recipients: 3,
    recipients: [mockContacts[1], mockContacts[3], mockContacts[9]],
    sent_count: 0,
    delivered_count: 0,
    read_count: 0,
    created_at: '2026-04-13T07:00:00',
  },
  {
    id: 'camp-2',
    name: 'Resgate de Clientes Perdidos',
    message_template: 'Oi {nome}! Sentimos sua falta aqui na farmácia. Preparamos um desconto especial de 15% nos seus medicamentos de uso contínuo. Válido até sexta! 🎁',
    target_tags: ['perdido'],
    status: 'pending',
    suggested_by: 'IA',
    reason: '2 clientes não compram há mais de 60 dias — risco de perda total',
    scheduled_at: null,
    total_recipients: 2,
    recipients: [mockContacts[3], mockContacts[7]],
    sent_count: 0,
    delivered_count: 0,
    read_count: 0,
    created_at: '2026-04-13T07:00:00',
  },
  {
    id: 'camp-3',
    name: 'Aniversariantes do Mês — Abril',
    message_template: 'Parabéns, {nome}! 🎂 A farmácia preparou um presente especial para você: 10% de desconto em qualquer compra esse mês. Passe aqui e comemore com a gente!',
    target_tags: ['aniversariante'],
    status: 'approved',
    suggested_by: 'IA',
    reason: '2 clientes fazem aniversário em abril',
    scheduled_at: '2026-04-14T09:00:00',
    total_recipients: 2,
    recipients: [mockContacts[6], mockContacts[9]],
    sent_count: 0,
    delivered_count: 0,
    read_count: 0,
    created_at: '2026-04-12T07:00:00',
  },
  {
    id: 'camp-4',
    name: 'Dica de Saúde — Outono e Imunidade',
    message_template: 'Oi {nome}! Com a chegada do outono, é hora de reforçar a imunidade. Vitamina C, D e Zinco são grandes aliados. Passe na farmácia para orientação gratuita! 🍊',
    target_tags: [],
    status: 'sent',
    suggested_by: 'manual',
    reason: null,
    scheduled_at: '2026-04-10T10:00:00',
    total_recipients: 12,
    recipients: mockContacts,
    sent_count: 12,
    delivered_count: 10,
    read_count: 7,
    created_at: '2026-04-09T15:00:00',
  },
  {
    id: 'camp-5',
    name: 'Gestante — Importância do DHA',
    message_template: 'Oi {nome}! Sabia que o DHA é essencial para o desenvolvimento do bebê? Converse com nossa farmacêutica sobre a suplementação ideal para essa fase. 🤰',
    target_tags: ['gestante'],
    status: 'sent',
    suggested_by: 'IA',
    reason: 'Cliente gestante identificada — oportunidade de venda consultiva',
    scheduled_at: '2026-04-06T09:00:00',
    total_recipients: 1,
    recipients: [mockContacts[8]],
    sent_count: 1,
    delivered_count: 1,
    read_count: 1,
    created_at: '2026-04-05T07:00:00',
  },
];

// ============================================================
// DASHBOARD METRICS
// ============================================================
export const mockDashboardMetrics = {
  total_contacts: 12,
  active_contacts: 7,
  cooling_contacts: 3,
  lost_contacts: 2,
  conversations_open: 4,
  messages_today: 14,
  campaigns_pending: 2,
  campaigns_sent_month: 3,
  revenue_month: 2485.60,
  revenue_potential_at_risk: 4180.20,
  avg_ticket: 128.45,
  retention_rate: 75,
  health_score: 72,
  health_history: [
    { month: 'Nov', score: 68 },
    { month: 'Dez', score: 65 },
    { month: 'Jan', score: 60 },
    { month: 'Fev', score: 64 },
    { month: 'Mar', score: 69 },
    { month: 'Abr', score: 72 },
  ],
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================
export function getStatusLabel(status) {
  const labels = { active: 'Ativo', cooling: 'Esfriando', lost: 'Perdido' };
  return labels[status] || status;
}

export function getStatusColor(status) {
  const colors = {
    active: 'bg-emerald-100 text-emerald-700',
    cooling: 'bg-amber-100 text-amber-700',
    lost: 'bg-red-100 text-red-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

export function getScoreColor(score) {
  if (score >= 70) return 'text-emerald-600';
  if (score >= 40) return 'text-amber-600';
  return 'text-red-600';
}

export function getScoreBarColor(score) {
  if (score >= 70) return 'bg-emerald-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-red-500';
}

export function timeAgo(dateString) {
  const now = new Date('2026-04-13T10:45:00');
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 30) return `${diffDays}d atrás`;
  return `${Math.floor(diffDays / 30)} meses atrás`;
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('pt-BR');
}
