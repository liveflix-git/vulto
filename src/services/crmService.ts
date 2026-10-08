import { supabase, isSupabaseConfigured } from '../lib/supabase';

export type LeadStage = 'LEADS' | 'CONTATO' | 'PROPOSTA' | 'NEGOCIACAO' | 'FECHADOS' | 'PERDIDOS';

export type LeadSource =
  | 'Prospecção presencial'
  | 'Instagram'
  | 'WhatsApp'
  | 'Indicação'
  | 'Site'
  | 'Google'
  | 'Outbound'
  | 'Outro';

export interface CrmLead {
  id: string;
  name: string; // Contato
  company: string; // Empresa
  phone: string | null;
  email: string | null;
  instagram: string | null;
  source: LeadSource | string | null;
  service_interest: string | null; // Serviço de interesse
  estimated_value: number; // Valor estimado
  assigned_to: string | null; // Responsável (id ou nome)
  assigned_name?: string; // Nome resolvido do responsável
  notes: string | null;
  next_follow_up: string | null; // Data do próximo follow-up
  status: LeadStage; // LEADS, CONTATO, PROPOSTA, NEGOCIACAO, FECHADOS, PERDIDOS
  created_at: string;
  updated_at?: string;
}

export interface ClientEntity {
  id: string;
  company_name: string;
  contact_name: string;
  email: string | null;
  phone: string | null;
  status: 'active' | 'onboarding' | 'paused' | 'churned';
  monthly_fee: number; // MRR
  setup_fee?: number;
  services: string[]; // array ou string
  primary_service?: string | null;
  start_date: string;
  created_at: string;
  updated_at?: string;
  notes?: string | null;
}

export interface ProfileUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  base_price?: number;
  monthly_price?: number;
}

export interface CrmMetrics {
  totalLeads: number;
  totalPipelineValue: number;
  closedMonthCount: number;
  closedMonthValue: number;
  lostCount: number;
}

export interface ClientsMetrics {
  totalClients: number;
  activeClients: number;
  onboardingClients: number;
  totalMrr: number;
}

// -------------------------------------------------------------
// Log activity helper
// -------------------------------------------------------------
export async function logActivity(action: string, description: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from('activities').insert([
      {
        user_id: user?.id ?? null,
        action,
        description,
        created_at: new Date().toISOString(),
      },
    ]);
  } catch (err) {
    console.warn('Erro ao registrar atividade:', err);
  }
}

// -------------------------------------------------------------
// CRM LEADS SERVICES
// -------------------------------------------------------------

export async function fetchCrmLeads(): Promise<CrmLead[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Erro ao carregar leads do Supabase:', error.message);
      return [];
    }

    if (!data) return [];

    return data.map((item: any) => {
      // Normalizar status para as etapas previstas
      let rawStatus = (item.status || 'LEADS').toUpperCase().trim();
      if (rawStatus === 'LEAD') rawStatus = 'LEADS';
      if (rawStatus === 'NEGOCIAÇÃO') rawStatus = 'NEGOCIACAO';
      if (rawStatus === 'FECHADO') rawStatus = 'FECHADOS';
      if (rawStatus === 'PERDIDO') rawStatus = 'PERDIDOS';

      return {
        id: item.id,
        name: item.name || item.contact_name || item.contact || 'Contato não informado',
        company: item.company || item.company_name || 'Empresa não informada',
        phone: item.phone || item.whatsapp || null,
        email: item.email || null,
        instagram: item.instagram || null,
        source: item.source || item.origin || 'Site',
        service_interest: item.service_interest || item.service || item.service_name || 'Geral',
        estimated_value: Number(item.estimated_value || item.value || 0),
        assigned_to: item.assigned_to || item.responsible || item.owner_id || null,
        notes: item.notes || item.observations || null,
        next_follow_up: item.next_follow_up || item.follow_up || item.followup_date || null,
        status: (rawStatus as LeadStage) || 'LEADS',
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at,
      };
    });
  } catch (err) {
    console.error('Falha ao buscar leads:', err);
    return [];
  }
}

export async function createCrmLead(lead: {
  company: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  instagram?: string | null;
  source: string;
  service_interest?: string | null;
  estimated_value: number;
  assigned_to?: string | null;
  notes?: string | null;
  next_follow_up?: string | null;
}): Promise<{ data: CrmLead | null; error: string | null }> {
  if (!isSupabaseConfigured) {
    return { data: null, error: 'Supabase não configurado' };
  }

  try {
    const payload: any = {
      name: lead.name,
      company: lead.company,
      phone: lead.phone || null,
      email: lead.email || null,
      instagram: lead.instagram || null,
      source: lead.source,
      service_interest: lead.service_interest || null,
      estimated_value: lead.estimated_value || 0,
      value: lead.estimated_value || 0,
      assigned_to: lead.assigned_to || null,
      notes: lead.notes || null,
      next_follow_up: lead.next_follow_up || null,
      status: 'LEADS',
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('leads').insert([payload]).select().single();

    if (error) {
      return { data: null, error: error.message };
    }

    await logActivity(
      'LEAD_CRIADO',
      `Novo lead adicionado: ${lead.company} (${lead.name}) - R$ ${Number(lead.estimated_value || 0).toLocaleString('pt-BR')}`
    );

    return {
      data: {
        id: data.id,
        name: data.name,
        company: data.company,
        phone: data.phone,
        email: data.email,
        instagram: data.instagram,
        source: data.source,
        service_interest: data.service_interest,
        estimated_value: Number(data.estimated_value || 0),
        assigned_to: data.assigned_to,
        notes: data.notes,
        next_follow_up: data.next_follow_up,
        status: 'LEADS',
        created_at: data.created_at,
      },
      error: null,
    };
  } catch (err: any) {
    return { data: null, error: err.message || 'Erro inesperado' };
  }
}

export async function updateLeadStage(
  leadId: string,
  newStage: LeadStage,
  companyName?: string
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase não configurado' };
  }

  try {
    const { error } = await supabase
      .from('leads')
      .update({
        status: newStage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId);

    if (error) {
      return { success: false, error: error.message };
    }

    await logActivity(
      'LEAD_ETAPA_ATUALIZADA',
      `Lead "${companyName || leadId}" movido para etapa ${newStage}`
    );

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Falha ao atualizar lead' };
  }
}

// -------------------------------------------------------------
// CONVERT LEAD TO CLIENT AND SALE
// -------------------------------------------------------------
export async function convertLeadToClientAndSale(params: {
  leadId: string;
  leadCompany: string;
  leadContact: string;
  leadEmail?: string | null;
  leadPhone?: string | null;
  finalValue: number;
  service: string;
  date: string;
  createClient: boolean;
  createSale: boolean;
}): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase não configurado' };
  }

  try {
    let clientId: string | null = null;

    // 1. Atualizar lead para FECHADOS
    const { error: leadErr } = await supabase
      .from('leads')
      .update({
        status: 'FECHADOS',
        value: params.finalValue,
        estimated_value: params.finalValue,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.leadId);

    if (leadErr) {
      return { success: false, error: `Falha ao atualizar lead: ${leadErr.message}` };
    }

    // 2. Criar cliente caso solicitado
    if (params.createClient) {
      const { data: newClient, error: clientErr } = await supabase
        .from('clients')
        .insert([
          {
            company_name: params.leadCompany,
            contact_name: params.leadContact,
            email: params.leadEmail || null,
            phone: params.leadPhone || null,
            status: 'active',
            monthly_fee: params.finalValue,
            services: [params.service],
            start_date: params.date,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (clientErr) {
        console.warn('Erro ao criar cliente associado:', clientErr.message);
      } else if (newClient) {
        clientId = newClient.id;
        await logActivity(
          'CLIENTE_CRIADO',
          `Lead convertido em cliente: ${params.leadCompany} (MRR/Valor: R$ ${params.finalValue.toLocaleString('pt-BR')})`
        );
      }
    }

    // 3. Registrar venda caso solicitado
    if (params.createSale) {
      const { error: saleErr } = await supabase.from('sales').insert([
        {
          client_id: clientId,
          amount: params.finalValue,
          status: 'paid',
          date: params.date,
          notes: `Fechamento do lead: ${params.leadCompany} - ${params.service}`,
          created_at: new Date().toISOString(),
        },
      ]);

      if (saleErr) {
        console.warn('Erro ao registrar venda:', saleErr.message);
      } else {
        await logActivity(
          'VENDA_REGISTRADA',
          `Venda registrada com sucesso: ${params.leadCompany} - R$ ${params.finalValue.toLocaleString('pt-BR')} (${params.service})`
        );
      }
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Falha na conversão de lead' };
  }
}

// -------------------------------------------------------------
// CLIENTS SERVICES
// -------------------------------------------------------------

export async function fetchClients(): Promise<ClientEntity[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Erro ao carregar clientes do Supabase:', error.message);
      return [];
    }

    if (!data) return [];

    return data.map((item: any) => {
      let servicesList: string[] = [];
      if (Array.isArray(item.services)) {
        servicesList = item.services;
      } else if (typeof item.services === 'string' && item.services.trim()) {
        try {
          const parsed = JSON.parse(item.services);
          servicesList = Array.isArray(parsed) ? parsed : [item.services];
        } catch {
          servicesList = item.services.split(',').map((s: string) => s.trim());
        }
      } else if (item.primary_service) {
        servicesList = [item.primary_service];
      }

      return {
        id: item.id,
        company_name: item.company_name || item.name || 'Empresa sem nome',
        contact_name: item.contact_name || item.contact || 'Contato principal',
        email: item.email || null,
        phone: item.phone || item.whatsapp || null,
        status: (item.status as any) || 'active',
        monthly_fee: Number(item.monthly_fee || item.mrr || item.value || 0),
        setup_fee: Number(item.setup_fee || 0),
        services: servicesList.length > 0 ? servicesList : ['Full Digital / Estratégia'],
        start_date: item.start_date || item.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        created_at: item.created_at || new Date().toISOString(),
        notes: item.notes || null,
      };
    });
  } catch (err) {
    console.error('Falha ao buscar clientes:', err);
    return [];
  }
}

export async function createClient(client: {
  company_name: string;
  contact_name: string;
  email?: string | null;
  phone?: string | null;
  status: 'active' | 'onboarding' | 'paused' | 'churned';
  monthly_fee: number;
  setup_fee?: number;
  services: string[];
  start_date: string;
  notes?: string | null;
}): Promise<{ data: ClientEntity | null; error: string | null }> {
  if (!isSupabaseConfigured) {
    return { data: null, error: 'Supabase não configurado' };
  }

  try {
    const payload = {
      company_name: client.company_name,
      contact_name: client.contact_name,
      email: client.email || null,
      phone: client.phone || null,
      status: client.status,
      monthly_fee: client.monthly_fee,
      setup_fee: client.setup_fee || 0,
      services: client.services,
      start_date: client.start_date,
      notes: client.notes || null,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('clients').insert([payload]).select().single();

    if (error) {
      return { data: null, error: error.message };
    }

    await logActivity(
      'CLIENTE_CRIADO',
      `Novo cliente adicionado: ${client.company_name} (Mensal: R$ ${client.monthly_fee.toLocaleString('pt-BR')})`
    );

    return {
      data: {
        id: data.id,
        company_name: data.company_name,
        contact_name: data.contact_name,
        email: data.email,
        phone: data.phone,
        status: data.status,
        monthly_fee: Number(data.monthly_fee || 0),
        setup_fee: Number(data.setup_fee || 0),
        services: Array.isArray(data.services) ? data.services : [client.services.join(', ')],
        start_date: data.start_date,
        created_at: data.created_at,
        notes: data.notes,
      },
      error: null,
    };
  } catch (err: any) {
    return { data: null, error: err.message || 'Erro inesperado' };
  }
}

// -------------------------------------------------------------
// AUXILIARY LISTS (PROFILES & SERVICES)
// -------------------------------------------------------------
export async function fetchProfiles(): Promise<ProfileUser[]> {
  if (!isSupabaseConfigured) {
    return [
      { id: 'felipe', full_name: 'Felipe Ramos', email: 'felipe@vultolab.company', role: 'admin' },
      { id: 'pietro', full_name: 'Pietro Fontana', email: 'pietro@vultolab.company', role: 'admin' },
    ];
  }

  try {
    const { data, error } = await supabase.from('profiles').select('id, full_name, email, role');
    if (error || !data || data.length === 0) {
      return [
        { id: 'felipe', full_name: 'Felipe Ramos', email: 'felipe@vultolab.company', role: 'admin' },
        { id: 'pietro', full_name: 'Pietro Fontana', email: 'pietro@vultolab.company', role: 'admin' },
      ];
    }
    return data;
  } catch {
    return [
      { id: 'felipe', full_name: 'Felipe Ramos', email: 'felipe@vultolab.company', role: 'admin' },
      { id: 'pietro', full_name: 'Pietro Fontana', email: 'pietro@vultolab.company', role: 'admin' },
    ];
  }
}

export async function fetchServicesCatalog(): Promise<ServiceItem[]> {
  if (!isSupabaseConfigured) {
    return [
      { id: 's1', name: 'Paid Media (Tráfego Pago)', base_price: 3500 },
      { id: 's2', name: 'Sites & Sistemas de Alta Conversão', base_price: 6500 },
      { id: 's3', name: 'Copywriting Estratégico', base_price: 2500 },
      { id: 's4', name: 'VULTO TAP (NFC Corporativo)', base_price: 1800 },
      { id: 's5', name: 'Inteligência Artificial & Automações', base_price: 4500 },
      { id: 's6', name: 'Aceleração Completa / Full Retainer', base_price: 9000 },
    ];
  }

  try {
    const { data, error } = await supabase.from('services').select('id, name, base_price, monthly_price');
    if (error || !data || data.length === 0) {
      return [
        { id: 's1', name: 'Paid Media (Tráfego Pago)', base_price: 3500 },
        { id: 's2', name: 'Sites & Sistemas de Alta Conversão', base_price: 6500 },
        { id: 's3', name: 'Copywriting Estratégico', base_price: 2500 },
        { id: 's4', name: 'VULTO TAP (NFC Corporativo)', base_price: 1800 },
        { id: 's5', name: 'Inteligência Artificial & Automações', base_price: 4500 },
        { id: 's6', name: 'Aceleração Completa / Full Retainer', base_price: 9000 },
      ];
    }
    return data;
  } catch {
    return [
      { id: 's1', name: 'Paid Media (Tráfego Pago)', base_price: 3500 },
      { id: 's2', name: 'Sites & Sistemas de Alta Conversão', base_price: 6500 },
      { id: 's3', name: 'Copywriting Estratégico', base_price: 2500 },
      { id: 's4', name: 'VULTO TAP (NFC Corporativo)', base_price: 1800 },
      { id: 's5', name: 'Inteligência Artificial & Automações', base_price: 4500 },
      { id: 's6', name: 'Aceleração Completa / Full Retainer', base_price: 9000 },
    ];
  }
}
