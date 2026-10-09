import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { logActivity } from './crmService';

export type SaleStatus = 'PAGO' | 'PENDENTE' | 'ATRASADO';

export type ExpenseCategory =
  | 'Ads'
  | 'Software'
  | 'VULTO TAP'
  | 'Infraestrutura'
  | 'Domínio/Hospedagem'
  | 'Freelancer'
  | 'Transporte'
  | 'Impostos'
  | 'Comissões'
  | 'Outros';

export interface FinanceSaleItem {
  id: string;
  client_id: string | null;
  client_name?: string;
  service_id: string | null;
  service_name?: string;
  description: string;
  amount: number;
  date: string;
  status: SaleStatus;
  owner_id: string | null;
  owner_name?: string;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface FinanceExpenseItem {
  id: string;
  description: string;
  category: ExpenseCategory | string;
  amount: number;
  date: string;
  responsible_id: string | null;
  responsible_name?: string;
  created_at: string;
  updated_at?: string;
}

export interface FinanceOverviewKpis {
  totalRevenue: number;     // Entradas liquidadas (PAGO)
  totalExpenses: number;    // Despesas totais no período
  netProfit: number;        // Lucro = Receita - Despesas
  netMargin: number;        // Margem = (Lucro / Receita) * 100
  receivableAmount: number; // A Receber (PENDENTE / ATRASADO)
  payableAmount: number;    // A Pagar (despesas futuras / pendentes)
  totalSalesCount: number;
  totalExpensesCount: number;
}

export interface MonthlyProfitData {
  monthKey: string;      // 'YYYY-MM'
  label: string;         // 'Jan/26', 'Fev/26', etc.
  revenue: number;
  expenses: number;
  profit: number;
}

export interface ServiceRevenueData {
  serviceName: string;
  revenue: number;
  count: number;
  percentage: number;
}

export interface FinanceClientOption {
  id: string;
  company_name: string;
  contact_name: string;
}

export interface FinanceServiceOption {
  id: string;
  name: string;
  base_price?: number;
}

export interface FinanceResponsibleOption {
  id: string;
  full_name: string;
  email: string;
}

// -------------------------------------------------------------
// Fetch all Finance Data
// -------------------------------------------------------------
export async function fetchFinanceDashboardData(): Promise<{
  sales: FinanceSaleItem[];
  expenses: FinanceExpenseItem[];
  clients: FinanceClientOption[];
  services: FinanceServiceOption[];
  responsibles: FinanceResponsibleOption[];
  error: string | null;
}> {
  if (!isSupabaseConfigured) {
    return {
      sales: getMockSales(),
      expenses: getMockExpenses(),
      clients: [
        { id: 'c1', company_name: 'TechFlow Systems', contact_name: 'Rodrigo Silveira' },
        { id: 'c2', company_name: 'Grupo Alvorada Imóveis', contact_name: 'Camila Duarte' },
        { id: 'c3', company_name: 'Apex Consultoria', contact_name: 'Marcos Vinicius' },
      ],
      services: [
        { id: 's1', name: 'Plataforma Web & Software Custom' },
        { id: 's2', name: 'Gestão de Tráfego & Performance' },
        { id: 's3', name: 'Lote VULTO TAP NFC' },
        { id: 's4', name: 'Consultoria de Estratégia Digital' },
      ],
      responsibles: [
        { id: 'felipe', full_name: 'Felipe', email: 'felipe@vultolab.company' },
        { id: 'pietro', full_name: 'Pietro', email: 'pietro@vultolab.company' },
      ],
      error: 'Supabase não configurado. Exibindo ambiente local de demonstração.',
    };
  }

  try {
    const [salesRes, expensesRes, clientsRes, servicesRes, profilesRes] = await Promise.all([
      supabase.from('sales').select('*').order('date', { ascending: false }),
      supabase.from('expenses').select('*').order('date', { ascending: false }),
      supabase.from('clients').select('id, company_name, contact_name').order('company_name', { ascending: true }),
      supabase.from('services').select('id, name, base_price').order('name', { ascending: true }),
      supabase.from('profiles').select('id, full_name, email').order('full_name', { ascending: true }),
    ]);

    const clientMap = new Map<string, string>();
    (clientsRes.data || []).forEach((c: any) => {
      clientMap.set(c.id, c.company_name || c.contact_name);
    });

    const serviceMap = new Map<string, string>();
    (servicesRes.data || []).forEach((s: any) => {
      serviceMap.set(s.id, s.name);
    });

    const profileMap = new Map<string, string>();
    (profilesRes.data || []).forEach((p: any) => {
      const lower = (p.full_name || p.email || '').toLowerCase();
      const displayName = lower.includes('felipe') ? 'Felipe' : lower.includes('pietro') ? 'Pietro' : (p.full_name?.split(' ')[0] || 'Sócio');
      profileMap.set(p.id, displayName);
    });

    const mappedSales: FinanceSaleItem[] = (salesRes.data || []).map((s: any) => {
      let normStatus: SaleStatus = 'PAGO';
      const st = String(s.status || '').toUpperCase();
      if (st === 'PAID' || st === 'PAGO' || st === 'LIQUIDADO') {
        normStatus = 'PAGO';
      } else if (st === 'ATRASADO' || st === 'OVERDUE' || st === 'LATE') {
        normStatus = 'ATRASADO';
      } else {
        normStatus = 'PENDENTE';
      }

      // Check if overdue by date
      if (normStatus === 'PENDENTE' && s.date) {
        const txDate = new Date(s.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (txDate < today) {
          normStatus = 'ATRASADO';
        }
      }

      return {
        id: s.id,
        client_id: s.client_id || null,
        client_name: s.client_id ? (clientMap.get(s.client_id) || 'Cliente') : (s.client_name || 'Venda Direta'),
        service_id: s.service_id || null,
        service_name: s.service_id ? (serviceMap.get(s.service_id) || 'Serviço') : (s.service_name || s.description || 'Geral'),
        description: s.description || s.notes || 'Venda de Serviço',
        amount: Number(s.amount) || 0,
        date: s.date || new Date().toISOString().split('T')[0],
        status: normStatus,
        owner_id: s.owner_id || null,
        owner_name: s.owner_id ? (profileMap.get(s.owner_id) || 'Felipe') : 'Felipe',
        notes: s.notes || null,
        created_at: s.created_at || new Date().toISOString(),
      };
    });

    const mappedExpenses: FinanceExpenseItem[] = (expensesRes.data || []).map((e: any) => {
      return {
        id: e.id,
        description: e.description || 'Despesa Operacional',
        category: e.category || 'Outros',
        amount: Number(e.amount) || 0,
        date: e.date || new Date().toISOString().split('T')[0],
        responsible_id: e.responsible_id || e.user_id || null,
        responsible_name: e.responsible_id ? (profileMap.get(e.responsible_id) || 'Felipe') : 'Felipe',
        created_at: e.created_at || new Date().toISOString(),
      };
    });

    const clientOptions: FinanceClientOption[] = (clientsRes.data || []).map((c: any) => ({
      id: c.id,
      company_name: c.company_name,
      contact_name: c.contact_name,
    }));

    const serviceOptions: FinanceServiceOption[] = (servicesRes.data || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      base_price: Number(s.base_price) || 0,
    }));

    const responsibleOptions: FinanceResponsibleOption[] = (profilesRes.data || []).map((p: any) => {
      const lower = (p.full_name || p.email || '').toLowerCase();
      const displayName = lower.includes('felipe') ? 'Felipe' : lower.includes('pietro') ? 'Pietro' : (p.full_name?.split(' ')[0] || 'Felipe');
      return {
        id: p.id,
        full_name: displayName,
        email: p.email,
      };
    });

    // If database returned no entries yet, return defaults
    return {
      sales: mappedSales.length > 0 ? mappedSales : getMockSales(),
      expenses: mappedExpenses.length > 0 ? mappedExpenses : getMockExpenses(),
      clients: clientOptions.length > 0 ? clientOptions : [
        { id: 'c1', company_name: 'TechFlow Systems', contact_name: 'Rodrigo Silveira' },
        { id: 'c2', company_name: 'Grupo Alvorada Imóveis', contact_name: 'Camila Duarte' },
      ],
      services: serviceOptions.length > 0 ? serviceOptions : [
        { id: 's1', name: 'Plataforma Web & Software Custom' },
        { id: 's2', name: 'Gestão de Tráfego & Performance' },
      ],
      responsibles: responsibleOptions.length > 0 ? responsibleOptions : [
        { id: 'felipe', full_name: 'Felipe', email: 'felipe@vultolab.company' },
        { id: 'pietro', full_name: 'Pietro', email: 'pietro@vultolab.company' },
      ],
      error: null,
    };
  } catch (err: any) {
    console.error('Error fetching finance data:', err);
    return {
      sales: getMockSales(),
      expenses: getMockExpenses(),
      clients: [],
      services: [],
      responsibles: [],
      error: err.message || 'Erro ao sincronizar finanças',
    };
  }
}

// -------------------------------------------------------------
// Add New Sale
// -------------------------------------------------------------
export async function createFinanceSale(payload: {
  clientId?: string | null;
  serviceId?: string | null;
  description: string;
  amount: number;
  date: string;
  status: SaleStatus;
  ownerId?: string | null;
}): Promise<{ success: boolean; error: string | null; data?: any }> {
  if (!isSupabaseConfigured) {
    return { success: true, error: null };
  }

  try {
    const insertPayload: Record<string, any> = {
      description: payload.description,
      amount: payload.amount,
      date: payload.date,
      status: payload.status,
    };
    if (payload.clientId) insertPayload.client_id = payload.clientId;
    if (payload.serviceId) insertPayload.service_id = payload.serviceId;
    if (payload.ownerId) insertPayload.owner_id = payload.ownerId;

    const { data, error } = await supabase.from('sales').insert([insertPayload]).select().single();
    if (error) throw error;

    await logActivity('NOVA_VENDA', `Venda de R$ ${payload.amount.toLocaleString('pt-BR')} registrada: ${payload.description}`);
    return { success: true, error: null, data };
  } catch (err: any) {
    console.error('Erro ao criar venda:', err);
    return { success: false, error: err.message || 'Falha ao registrar venda' };
  }
}

// -------------------------------------------------------------
// Update Sale
// -------------------------------------------------------------
export async function updateFinanceSale(
  id: string,
  payload: Partial<{
    clientId: string | null;
    serviceId: string | null;
    description: string;
    amount: number;
    date: string;
    status: SaleStatus;
    ownerId: string | null;
  }>
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured) {
    return { success: true, error: null };
  }

  try {
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (payload.description !== undefined) updatePayload.description = payload.description;
    if (payload.amount !== undefined) updatePayload.amount = payload.amount;
    if (payload.date !== undefined) updatePayload.date = payload.date;
    if (payload.status !== undefined) updatePayload.status = payload.status;
    if (payload.clientId !== undefined) updatePayload.client_id = payload.clientId;
    if (payload.serviceId !== undefined) updatePayload.service_id = payload.serviceId;
    if (payload.ownerId !== undefined) updatePayload.owner_id = payload.ownerId;

    const { error } = await supabase.from('sales').update(updatePayload).eq('id', id);
    if (error) throw error;

    await logActivity('EDICAO_VENDA', `Venda atualizada: ${payload.description || id}`);
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Erro ao atualizar venda:', err);
    return { success: false, error: err.message || 'Falha ao atualizar venda' };
  }
}

// -------------------------------------------------------------
// Delete Sale (Requires confirmation)
// -------------------------------------------------------------
export async function deleteFinanceSale(id: string, desc?: string): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured) {
    return { success: true, error: null };
  }

  try {
    const { error } = await supabase.from('sales').delete().eq('id', id);
    if (error) throw error;

    await logActivity('EXCLUSAO_VENDA', `Venda removida do sistema: ${desc || id}`);
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Erro ao deletar venda:', err);
    return { success: false, error: err.message || 'Falha ao excluir venda' };
  }
}

// -------------------------------------------------------------
// Add New Expense
// -------------------------------------------------------------
export async function createFinanceExpense(payload: {
  description: string;
  category: ExpenseCategory | string;
  amount: number;
  date: string;
  responsibleId?: string | null;
}): Promise<{ success: boolean; error: string | null; data?: any }> {
  if (!isSupabaseConfigured) {
    return { success: true, error: null };
  }

  try {
    const insertPayload: Record<string, any> = {
      description: payload.description,
      category: payload.category,
      amount: payload.amount,
      date: payload.date,
    };
    if (payload.responsibleId) {
      insertPayload.responsible_id = payload.responsibleId;
    }

    const { data, error } = await supabase.from('expenses').insert([insertPayload]).select().single();
    if (error) throw error;

    await logActivity('NOVA_DESPESA', `Despesa de R$ ${payload.amount.toLocaleString('pt-BR')} registrada: ${payload.description} (${payload.category})`);
    return { success: true, error: null, data };
  } catch (err: any) {
    console.error('Erro ao criar despesa:', err);
    return { success: false, error: err.message || 'Falha ao registrar despesa' };
  }
}

// -------------------------------------------------------------
// Update Expense
// -------------------------------------------------------------
export async function updateFinanceExpense(
  id: string,
  payload: Partial<{
    description: string;
    category: ExpenseCategory | string;
    amount: number;
    date: string;
    responsibleId: string | null;
  }>
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured) {
    return { success: true, error: null };
  }

  try {
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (payload.description !== undefined) updatePayload.description = payload.description;
    if (payload.category !== undefined) updatePayload.category = payload.category;
    if (payload.amount !== undefined) updatePayload.amount = payload.amount;
    if (payload.date !== undefined) updatePayload.date = payload.date;
    if (payload.responsibleId !== undefined) updatePayload.responsible_id = payload.responsibleId;

    const { error } = await supabase.from('expenses').update(updatePayload).eq('id', id);
    if (error) throw error;

    await logActivity('EDICAO_DESPESA', `Despesa atualizada: ${payload.description || id}`);
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Erro ao atualizar despesa:', err);
    return { success: false, error: err.message || 'Falha ao atualizar despesa' };
  }
}

// -------------------------------------------------------------
// Delete Expense (Requires confirmation)
// -------------------------------------------------------------
export async function deleteFinanceExpense(id: string, desc?: string): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured) {
    return { success: true, error: null };
  }

  try {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw error;

    await logActivity('EXCLUSAO_DESPESA', `Despesa removida do sistema: ${desc || id}`);
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Erro ao deletar despesa:', err);
    return { success: false, error: err.message || 'Falha ao excluir despesa' };
  }
}

// -------------------------------------------------------------
// Mock fallbacks for offline development
// -------------------------------------------------------------
function getMockSales(): FinanceSaleItem[] {
  const today = new Date().toISOString().split('T')[0];
  return [
    {
      id: 's-1',
      client_id: 'c1',
      client_name: 'TechFlow Systems',
      service_id: 's1',
      service_name: 'Plataforma Web & Software Custom',
      description: 'Mensalidade Retainer + Squad Dedicada',
      amount: 14500,
      date: today,
      status: 'PAGO',
      owner_id: 'felipe',
      owner_name: 'Felipe',
      created_at: new Date().toISOString(),
    },
    {
      id: 's-2',
      client_id: 'c2',
      client_name: 'Grupo Alvorada Imóveis',
      service_id: 's2',
      service_name: 'Gestão de Tráfego & Performance',
      description: 'Fee Mensal de Campanhas Google & Meta Ads',
      amount: 4800,
      date: today,
      status: 'PAGO',
      owner_id: 'pietro',
      owner_name: 'Pietro',
      created_at: new Date().toISOString(),
    },
    {
      id: 's-3',
      client_id: 'c3',
      client_name: 'Apex Consultoria',
      service_id: 's3',
      service_name: 'Lote VULTO TAP NFC',
      description: 'Entrega 250 Unidades Cartões Metal Black NFC',
      amount: 7200,
      date: '2026-10-15',
      status: 'PENDENTE',
      owner_id: 'pietro',
      owner_name: 'Pietro',
      created_at: new Date().toISOString(),
    },
    {
      id: 's-4',
      client_id: 'c4',
      client_name: 'Lumina Health Clinic',
      service_id: 's1',
      service_name: 'Plataforma Web & Software Custom',
      description: 'Parcela 2/3 - Redesenho de Portal de Agendamento',
      amount: 6500,
      date: '2026-09-28',
      status: 'ATRASADO',
      owner_id: 'felipe',
      owner_name: 'Felipe',
      created_at: new Date().toISOString(),
    },
    {
      id: 's-5',
      client_id: 'c5',
      client_name: 'Vanguard Investimentos',
      service_id: 's4',
      service_name: 'Consultoria de Estratégia Digital',
      description: 'Diagnóstico Comercial e Auditoria de Funil',
      amount: 8900,
      date: '2026-09-15',
      status: 'PAGO',
      owner_id: 'felipe',
      owner_name: 'Felipe',
      created_at: new Date().toISOString(),
    },
  ];
}

function getMockExpenses(): FinanceExpenseItem[] {
  const today = new Date().toISOString().split('T')[0];
  return [
    {
      id: 'e-1',
      description: 'Servidores Cloud Vercel & Supabase Pro',
      category: 'Infraestrutura',
      amount: 540,
      date: today,
      responsible_id: 'felipe',
      responsible_name: 'Felipe',
      created_at: new Date().toISOString(),
    },
    {
      id: 'e-2',
      description: 'Tráfego Pago Institucional Meta & Google Ads',
      category: 'Ads',
      amount: 2200,
      date: today,
      responsible_id: 'pietro',
      responsible_name: 'Pietro',
      created_at: new Date().toISOString(),
    },
    {
      id: 'e-3',
      description: 'Assinaturas Figma, Linear, Slack e Typeform',
      category: 'Software',
      amount: 780,
      date: '2026-10-02',
      responsible_id: 'felipe',
      responsible_name: 'Felipe',
      created_at: new Date().toISOString(),
    },
    {
      id: 'e-4',
      description: 'Lote chips NTAG213 para VULTO TAP',
      category: 'VULTO TAP',
      amount: 1450,
      date: '2026-09-25',
      responsible_id: 'pietro',
      responsible_name: 'Pietro',
      created_at: new Date().toISOString(),
    },
    {
      id: 'e-5',
      description: 'Domínios Cloudflare e Certificados anuais',
      category: 'Domínio/Hospedagem',
      amount: 320,
      date: '2026-09-12',
      responsible_id: 'felipe',
      responsible_name: 'Felipe',
      created_at: new Date().toISOString(),
    },
    {
      id: 'e-6',
      description: 'Contabilidade & Emissão Notas Fiscais',
      category: 'Impostos',
      amount: 1100,
      date: '2026-09-05',
      responsible_id: 'felipe',
      responsible_name: 'Felipe',
      created_at: new Date().toISOString(),
    },
  ];
}
