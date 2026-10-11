import { supabase, isSupabaseConfigured } from '../lib/supabase.ts';

// =====================================================================
// TIPOS EXATOS DAS TABELAS VULTO_*
// =====================================================================

export interface VultoOperator {
  id: string;
  name: string; // 'Felipe' | 'Pietro'
  active: boolean;
  created_at: string;
}

export type VultoFinanceType = 'entrada' | 'saida';
export type SettlementStatus = 'liquidado' | 'pendente';

export interface VultoFinanceItem {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  entry_type: VultoFinanceType;
  settlement_status?: SettlementStatus;
  operator_id: string | null;
  operator_name?: string;
  created_at: string;
  updated_at: string;
}

export interface VultoMonthlyExpenseItem {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  due_day: number | null;
  active: boolean;
  operator_id: string | null;
  operator_name?: string;
  created_at: string;
  updated_at: string;
}

export type VultoClientServiceType = 'trafego_pago' | 'vulto_nfc' | 'site';

export interface VultoClientItem {
  id: string;
  name: string;
  service_type: VultoClientServiceType;
  operator_id: string | null;
  operator_name?: string;
  created_at: string;
}

export interface VultoTaskItem {
  id: string;
  title: string;
  notes: string | null;
  completed: boolean;
  completed_at: string | null;
  operator_id: string | null;
  operator_name?: string;
  created_at: string;
  updated_at: string;
}

export type VultoScriptChannel = 'WhatsApp' | 'E-mail' | 'Presencial';

export interface VultoSalesScriptItem {
  id: string;
  title: string;
  channel: VultoScriptChannel;
  content: string;
  operator_id: string | null;
  operator_name?: string;
  created_at: string;
  updated_at: string;
}

export interface VultoInventoryItem {
  id: string;
  name: string;
  quantity: number;
  notes: string | null;
  operator_id: string | null;
  operator_name?: string;
  created_at: string;
  updated_at: string;
}
export type VultoBillingType = 'unico' | 'mensal';

export interface VultoPriceItem {
  id: string;
  service_name: string;
  description: string | null;
  price: number;
  billing_type: VultoBillingType;
  active: boolean;
  operator_id: string | null;
  operator_name?: string;
  created_at: string;
  updated_at: string;
}

export interface VultoAuditLogItem {
  id: string;
  operator_id: string | null;
  operator_name?: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: string | null;
  created_at: string;
}

// =====================================================================
// TIPOS PROSPECÇÃO / MINI CRM
// =====================================================================

export type ProspectStatus =
  | 'novo'
  | 'em_contato'
  | 'reuniao_agendada'
  | 'proposta_enviada'
  | 'fechado'
  | 'perdido';

export type ProspectPriority = 'baixa' | 'media' | 'alta' | 'urgente';

export const VALID_PROSPECT_CHANNELS = [
  'email',
  'whatsapp',
  'presencial',
  'instagram',
  'telefone',
  'outro',
] as const;

export type ProspectChannel = (typeof VALID_PROSPECT_CHANNELS)[number];

export function normalizeProspectChannel(raw?: string | null): ProspectChannel {
  if (!raw) return 'whatsapp';
  const clean = raw.trim().toLowerCase();
  if (clean === 'whatsapp') return 'whatsapp';
  if (clean === 'email' || clean === 'e-mail') return 'email';
  if (clean === 'instagram') return 'instagram';
  if (clean === 'telefone') return 'telefone';
  if (clean === 'presencial') return 'presencial';
  if (clean === 'outro') return 'outro';
  return 'whatsapp';
}

export interface VultoProspect {
  id: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  city: string | null;
  state: string | null;
  source: string | null;
  channel: string | null;
  service_interest: string | null;
  status: ProspectStatus;
  priority: ProspectPriority;
  last_contact_at: string | null;
  next_contact_at: string | null;
  proposal_amount: number | null;
  loss_reason: string | null;
  notes: string | null;
  converted_client_id: string | null;
  operator_id: string | null;
  operator_name?: string;
  created_at: string;
  updated_at: string;
}

export type InteractionType =
  | 'whatsapp'
  | 'email'
  | 'ligacao'
  | 'reuniao'
  | 'direct_instagram'
  | 'outro';

export interface VultoProspectInteraction {
  id: string;
  prospect_id: string;
  type: InteractionType;
  summary: string;
  details: string | null;
  interaction_at: string;
  operator_id: string | null;
  operator_name?: string;
  created_at: string;
}

export type ProspectingGoalScope = 'team' | 'operator';

export interface VultoProspectingGoal {
  id: string;
  month: string;
  scope: ProspectingGoalScope;
  target_operator_id: string | null;
  prospects_target: number;
  initial_contacts_target: number;
  followups_target: number;
  responses_target: number;
  proposals_target: number;
  closed_target: number;
  updated_by_operator_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface VultoOperatorNote {
  id: string;
  operator_id: string;
  slot: number; // 1, 2, 3, 4
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// Fallbacks locais e padrão de operadores
export const DEFAULT_OPERATORS: VultoOperator[] = [
  { id: 'felipe', name: 'Felipe', active: true, created_at: new Date().toISOString() },
  { id: 'pietro', name: 'Pietro', active: true, created_at: new Date().toISOString() },
];

const ACTIVE_OPERATOR_STORAGE_KEY = 'vulto_active_operator';

// =====================================================================
// OPERADORES & SESSÃO ATIVA
// =====================================================================

export function getActiveOperatorSession(): VultoOperator | null {
  try {
    const raw = sessionStorage.getItem(ACTIVE_OPERATOR_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Erro ao ler operador ativo:', e);
  }
  return null;
}

export function setActiveOperatorSession(op: VultoOperator) {
  try {
    sessionStorage.setItem(ACTIVE_OPERATOR_STORAGE_KEY, JSON.stringify(op));
  } catch (e) {
    console.error('Erro ao salvar operador ativo:', e);
  }
}

export function clearActiveOperatorSession() {
  try {
    sessionStorage.removeItem(ACTIVE_OPERATOR_STORAGE_KEY);
  } catch (e) {
    console.error('Erro ao limpar operador ativo:', e);
  }
}

/**
 * Busca os operadores da tabela vulto_operators.
 */
export async function fetchVultoOperators(): Promise<VultoOperator[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('vulto_operators')
        .select('*')
        .order('name', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as VultoOperator[];
      }

      if (!error && data && data.length === 0) {
        try {
          const { data: inserted } = await supabase
            .from('vulto_operators')
            .insert([
              { name: 'Felipe', active: true },
              { name: 'Pietro', active: true },
            ])
            .select();

          if (inserted && inserted.length > 0) {
            return inserted as VultoOperator[];
          }
        } catch (e) {}
      }
    } catch (e) {
      console.warn('Erro ao buscar vulto_operators:', e);
    }
  }
  return DEFAULT_OPERATORS;
}

// =====================================================================
// AUDITORIA (vulto_audit_logs)
// =====================================================================

export async function logVultoAudit(params: {
  action: string;
  entity_type: string;
  entity_id?: string | null;
  details?: string | null;
  operator_id?: string | null;
}) {
  const currentOp = getActiveOperatorSession();
  const opId = params.operator_id !== undefined ? params.operator_id : currentOp?.id || null;
  const opName = currentOp?.name || 'Operador';

  if (!isSupabaseConfigured) return;

  try {
    await supabase.from('vulto_audit_logs').insert([
      {
        operator_id: opId,
        action: params.action,
        entity_type: params.entity_type,
        entity_id: params.entity_id || null,
        details: params.details || `${opName} realizou ${params.action}`,
      },
    ]);
  } catch (err) {
    console.warn('Erro ao gravar log de auditoria:', err);
  }
}

export async function fetchVultoAuditLogs(limit = 100): Promise<VultoAuditLogItem[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('vulto_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data as VultoAuditLogItem[];
  } catch (e) {
    return [];
  }
}

// =====================================================================
// FINANCEIRO (vulto_finance)
// =====================================================================

export async function fetchVultoFinance(): Promise<{ data: VultoFinanceItem[]; error: string | null }> {
  if (!isSupabaseConfigured) return { data: [], error: 'Supabase não configurado' };
  try {
    const { data, error } = await supabase
      .from('vulto_finance')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return { data: [], error: error.message };
    const mapped = (data || []).map((item: any) => ({
      ...item,
      settlement_status: item.settlement_status || (item.entry_type === 'entrada' ? 'liquidado' : 'liquidado'),
    }));
    return { data: mapped as VultoFinanceItem[], error: null };
  } catch (e: any) {
    return { data: [], error: e.message || 'Erro ao carregar financeiro' };
  }
}

export async function createVultoFinance(payload: {
  title: string;
  description?: string | null;
  amount: number;
  entry_type: VultoFinanceType;
  settlement_status?: SettlementStatus;
}): Promise<{ data: VultoFinanceItem | null; error: string | null }> {
  const op = getActiveOperatorSession();
  const settlement = payload.entry_type === 'entrada' ? (payload.settlement_status || 'liquidado') : 'liquidado';

  const insertPayload = {
    title: payload.title.trim(),
    description: payload.description?.trim() || null,
    amount: Number(payload.amount),
    entry_type: payload.entry_type,
    settlement_status: settlement,
    operator_id: op?.id || null,
  };

  try {
    const { data, error } = await supabase
      .from('vulto_finance')
      .insert([insertPayload])
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    const actionName =
      payload.entry_type === 'entrada'
        ? settlement === 'pendente'
          ? 'finance_receivable_created'
          : 'Adicionou Entrada'
        : 'Adicionou Saída';

    await logVultoAudit({
      action: actionName,
      entity_type: 'vulto_finance',
      entity_id: data.id,
      details: `${op?.name || 'Operador'} adicionou ${payload.entry_type} (${settlement}): ${payload.title} (R$ ${payload.amount.toLocaleString('pt-BR')})`,
    });

    return {
      data: {
        ...(data as any),
        settlement_status: settlement,
      },
      error: null,
    };
  } catch (e: any) {
    return { data: null, error: e.message || 'Erro ao criar movimentação' };
  }
}

export async function updateVultoFinance(
  id: string,
  updates: {
    title?: string;
    description?: string | null;
    amount?: number;
    entry_type?: VultoFinanceType;
    settlement_status?: SettlementStatus;
  }
): Promise<{ success: boolean; error: string | null }> {
  const op = getActiveOperatorSession();
  const payload: any = {
    updated_at: new Date().toISOString(),
  };
  if (updates.title !== undefined) payload.title = updates.title.trim();
  if (updates.description !== undefined) payload.description = updates.description?.trim() || null;
  if (updates.amount !== undefined) payload.amount = Number(updates.amount);
  if (updates.entry_type !== undefined) payload.entry_type = updates.entry_type;
  if (updates.settlement_status !== undefined) payload.settlement_status = updates.settlement_status;

  try {
    const { error } = await supabase
      .from('vulto_finance')
      .update(payload)
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    await logVultoAudit({
      action: 'Editou Movimentação',
      entity_type: 'vulto_finance',
      entity_id: id,
      details: `${op?.name || 'Operador'} atualizou movimentação #${id.slice(0, 8)}`,
    });

    return { success: true, error: null };
  } catch (e: any) {
    return { success: false, error: e.message || 'Erro ao atualizar' };
  }
}

export async function deleteVultoFinance(id: string): Promise<{ success: boolean; error: string | null }> {
  const op = getActiveOperatorSession();
  try {
    const { error } = await supabase
      .from('vulto_finance')
      .delete()
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    await logVultoAudit({
      action: 'Excluiu Movimentação',
      entity_type: 'vulto_finance',
      entity_id: id,
      details: `${op?.name || 'Operador'} excluiu movimentação #${id.slice(0, 8)}`,
    });

    return { success: true, error: null };
  } catch (e: any) {
    return { success: false, error: e.message || 'Erro ao excluir' };
  }
}

// =====================================================================
// GASTOS MENSAIS (vulto_monthly_expenses)
// =====================================================================

export async function fetchVultoMonthlyExpenses(): Promise<{ data: VultoMonthlyExpenseItem[]; error: string | null }> {
  if (!isSupabaseConfigured) return { data: [], error: 'Supabase não configurado' };
  try {
    const { data, error } = await supabase
      .from('vulto_monthly_expenses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: (data || []) as VultoMonthlyExpenseItem[], error: null };
  } catch (e: any) {
    return { data: [], error: e.message || 'Erro ao buscar gastos' };
  }
}

export async function createVultoMonthlyExpense(payload: {
  title: string;
  description?: string | null;
  amount: number;
  due_day?: number | null;
  active?: boolean;
}): Promise<{ data: VultoMonthlyExpenseItem | null; error: string | null }> {
  const op = getActiveOperatorSession();
  const insertPayload = {
    title: payload.title.trim(),
    description: payload.description?.trim() || null,
    amount: Number(payload.amount),
    due_day: payload.due_day !== undefined && payload.due_day !== null ? Number(payload.due_day) : null,
    active: payload.active !== undefined ? payload.active : true,
    operator_id: op?.id || null,
  };

  try {
    const { data, error } = await supabase
      .from('vulto_monthly_expenses')
      .insert([insertPayload])
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    await logVultoAudit({
      action: 'Criou Gasto Mensal',
      entity_type: 'vulto_monthly_expenses',
      entity_id: data.id,
      details: `${op?.name || 'Operador'} cadastrou gasto fixo: ${payload.title} (R$ ${payload.amount.toLocaleString('pt-BR')})`,
    });

    return { data: data as VultoMonthlyExpenseItem, error: null };
  } catch (e: any) {
    return { data: null, error: e.message || 'Erro ao cadastrar gasto mensal' };
  }
}

export async function updateVultoMonthlyExpense(
  id: string,
  updates: {
    title?: string;
    description?: string | null;
    amount?: number;
    due_day?: number | null;
    active?: boolean;
  }
): Promise<{ success: boolean; error: string | null }> {
  const op = getActiveOperatorSession();
  const payload: any = {
    updated_at: new Date().toISOString(),
  };
  if (updates.title !== undefined) payload.title = updates.title.trim();
  if (updates.description !== undefined) payload.description = updates.description?.trim() || null;
  if (updates.amount !== undefined) payload.amount = Number(updates.amount);
  if (updates.due_day !== undefined) payload.due_day = updates.due_day !== null ? Number(updates.due_day) : null;
  if (updates.active !== undefined) payload.active = updates.active;

  try {
    const { error } = await supabase
      .from('vulto_monthly_expenses')
      .update(payload)
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    await logVultoAudit({
      action: 'Editou Gasto Mensal',
      entity_type: 'vulto_monthly_expenses',
      entity_id: id,
      details: `${op?.name || 'Operador'} editou gasto fixo #${id.slice(0, 8)}`,
    });

    return { success: true, error: null };
  } catch (e: any) {
    return { success: false, error: e.message || 'Erro ao atualizar gasto mensal' };
  }
}

export async function deleteVultoMonthlyExpense(id: string): Promise<{ success: boolean; error: string | null }> {
  const op = getActiveOperatorSession();
  try {
    const { error } = await supabase
      .from('vulto_monthly_expenses')
      .delete()
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    await logVultoAudit({
      action: 'Excluiu Gasto Mensal',
      entity_type: 'vulto_monthly_expenses',
      entity_id: id,
      details: `${op?.name || 'Operador'} excluiu gasto fixo #${id.slice(0, 8)}`,
    });

    return { success: true, error: null };
  } catch (e: any) {
    return { success: false, error: e.message || 'Erro ao excluir gasto mensal' };
  }
}

// =====================================================================
// CLIENTES (vulto_clients)
// =====================================================================

export async function fetchVultoClients(): Promise<{ data: VultoClientItem[]; error: string | null }> {
  if (!isSupabaseConfigured) return { data: [], error: 'Supabase não configurado' };
  try {
    const { data, error } = await supabase
      .from('vulto_clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: (data || []) as VultoClientItem[], error: null };
  } catch (e: any) {
    return { data: [], error: e.message || 'Erro ao carregar clientes' };
  }
}

export async function createVultoClient(payload: {
  name: string;
  service_type: VultoClientServiceType;
}): Promise<{ data: VultoClientItem | null; error: string | null }> {
  const op = getActiveOperatorSession();
  const insertPayload = {
    name: payload.name.trim(),
    service_type: payload.service_type,
    operator_id: op?.id || null,
  };

  try {
    const { data, error } = await supabase
      .from('vulto_clients')
      .insert([insertPayload])
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    await logVultoAudit({
      action: 'Adicionou Cliente',
      entity_type: 'vulto_clients',
      entity_id: data.id,
      details: `${op?.name || 'Operador'} cadastrou o cliente ${payload.name} (${payload.service_type})`,
    });

    return { data: data as VultoClientItem, error: null };
  } catch (e: any) {
    return { data: null, error: e.message || 'Erro ao cadastrar cliente' };
  }
}

export async function deleteVultoClient(id: string): Promise<{ success: boolean; error: string | null }> {
  const op = getActiveOperatorSession();
  try {
    const { error } = await supabase
      .from('vulto_clients')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    await logVultoAudit({
      action: 'Excluiu Cliente',
      entity_type: 'vulto_clients',
      entity_id: id,
      details: `${op?.name || 'Operador'} removeu o cliente #${id.slice(0, 8)}`,
    });

    return { success: true, error: null };
  } catch (e: any) {
    return { success: false, error: e.message || 'Erro ao excluir cliente' };
  }
}

// =====================================================================
// CHECKLIST DE TAREFAS (vulto_tasks)
// =====================================================================

export async function fetchVultoTasks(): Promise<{ data: VultoTaskItem[]; error: string | null }> {
  if (!isSupabaseConfigured) return { data: [], error: 'Supabase não configurado' };
  try {
    const { data, error } = await supabase
      .from('vulto_tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: (data || []) as VultoTaskItem[], error: null };
  } catch (e: any) {
    return { data: [], error: e.message || 'Erro ao carregar tarefas' };
  }
}

export async function createVultoTask(payload: {
  title: string;
  notes?: string | null;
}): Promise<{ data: VultoTaskItem | null; error: string | null }> {
  const op = getActiveOperatorSession();
  const insertPayload = {
    title: payload.title.trim(),
    notes: payload.notes?.trim() || null,
    completed: false,
    completed_at: null,
    operator_id: op?.id || null,
  };

  try {
    const { data, error } = await supabase
      .from('vulto_tasks')
      .insert([insertPayload])
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    await logVultoAudit({
      action: 'Criou Tarefa',
      entity_type: 'vulto_tasks',
      entity_id: data.id,
      details: `${op?.name || 'Operador'} adicionou a tarefa: ${payload.title}`,
    });

    return { data: data as VultoTaskItem, error: null };
  } catch (e: any) {
    return { data: null, error: e.message || 'Erro ao cadastrar tarefa' };
  }
}

export async function toggleVultoTask(
  id: string,
  completed: boolean
): Promise<{ success: boolean; error: string | null }> {
  const op = getActiveOperatorSession();
  const completed_at = completed ? new Date().toISOString() : null;
  const updated_at = new Date().toISOString();

  try {
    const { error } = await supabase
      .from('vulto_tasks')
      .update({ completed, completed_at, updated_at, operator_id: op?.id || null })
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    await logVultoAudit({
      action: completed ? 'Concluiu Tarefa' : 'Desmarcou Tarefa',
      entity_type: 'vulto_tasks',
      entity_id: id,
      details: `${op?.name || 'Operador'} marcou tarefa como ${completed ? 'concluída' : 'pendente'}`,
    });

    return { success: true, error: null };
  } catch (e: any) {
    return { success: false, error: e.message || 'Erro ao alterar tarefa' };
  }
}

export async function updateVultoTask(
  id: string,
  updates: { title?: string; notes?: string | null }
): Promise<{ success: boolean; error: string | null }> {
  const op = getActiveOperatorSession();
  const payload: any = { updated_at: new Date().toISOString(), operator_id: op?.id || null };
  if (updates.title !== undefined) payload.title = updates.title.trim();
  if (updates.notes !== undefined) payload.notes = updates.notes?.trim() || null;

  try {
    const { error } = await supabase
      .from('vulto_tasks')
      .update(payload)
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    await logVultoAudit({
      action: 'Editou Tarefa',
      entity_type: 'vulto_tasks',
      entity_id: id,
      details: `${op?.name || 'Operador'} editou tarefa #${id.slice(0, 8)}`,
    });

    return { success: true, error: null };
  } catch (e: any) {
    return { success: false, error: e.message || 'Erro ao editar tarefa' };
  }
}

export async function deleteVultoTask(id: string): Promise<{ success: boolean; error: string | null }> {
  const op = getActiveOperatorSession();
  try {
    const { error } = await supabase
      .from('vulto_tasks')
      .delete()
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    await logVultoAudit({
      action: 'Excluiu Tarefa',
      entity_type: 'vulto_tasks',
      entity_id: id,
      details: `${op?.name || 'Operador'} excluiu tarefa #${id.slice(0, 8)}`,
    });

    return { success: true, error: null };
  } catch (e: any) {
    return { success: false, error: e.message || 'Erro ao excluir tarefa' };
  }
}

// =====================================================================
// SCRIPTS DE VENDA (vulto_sales_scripts)
// =====================================================================

export async function fetchVultoSalesScripts(): Promise<{ data: VultoSalesScriptItem[]; error: string | null }> {
  if (!isSupabaseConfigured) return { data: [], error: 'Supabase não configurado' };
  try {
    const { data, error } = await supabase
      .from('vulto_sales_scripts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: (data || []) as VultoSalesScriptItem[], error: null };
  } catch (e: any) {
    return { data: [], error: e.message || 'Erro ao carregar scripts' };
  }
}

export async function createVultoSalesScript(payload: {
  title: string;
  channel: VultoScriptChannel;
  content: string;
}): Promise<{ data: VultoSalesScriptItem | null; error: string | null }> {
  const op = getActiveOperatorSession();
  const insertPayload = {
    title: payload.title.trim(),
    channel: payload.channel,
    content: payload.content,
    operator_id: op?.id || null,
  };

  try {
    const { data, error } = await supabase
      .from('vulto_sales_scripts')
      .insert([insertPayload])
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    await logVultoAudit({
      action: 'Criou Script de Venda',
      entity_type: 'vulto_sales_scripts',
      entity_id: data.id,
      details: `${op?.name || 'Operador'} cadastrou o script "${payload.title}" (${payload.channel})`,
    });

    return { data: data as VultoSalesScriptItem, error: null };
  } catch (e: any) {
    return { data: null, error: e.message || 'Erro ao cadastrar script' };
  }
}

export async function updateVultoSalesScript(
  id: string,
  updates: {
    title?: string;
    channel?: VultoScriptChannel;
    content?: string;
  }
): Promise<{ success: boolean; error: string | null }> {
  const op = getActiveOperatorSession();
  const payload: any = { updated_at: new Date().toISOString(), operator_id: op?.id || null };
  if (updates.title !== undefined) payload.title = updates.title.trim();
  if (updates.channel !== undefined) payload.channel = updates.channel;
  if (updates.content !== undefined) payload.content = updates.content;

  try {
    const { error } = await supabase
      .from('vulto_sales_scripts')
      .update(payload)
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    await logVultoAudit({
      action: 'Editou Script de Venda',
      entity_type: 'vulto_sales_scripts',
      entity_id: id,
      details: `${op?.name || 'Operador'} editou script #${id.slice(0, 8)}`,
    });

    return { success: true, error: null };
  } catch (e: any) {
    return { success: false, error: e.message || 'Erro ao editar script' };
  }
}

export async function deleteVultoSalesScript(id: string): Promise<{ success: boolean; error: string | null }> {
  const op = getActiveOperatorSession();
  try {
    const { error } = await supabase
      .from('vulto_sales_scripts')
      .delete()
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    await logVultoAudit({
      action: 'Excluiu Script de Venda',
      entity_type: 'vulto_sales_scripts',
      entity_id: id,
      details: `${op?.name || 'Operador'} excluiu script #${id.slice(0, 8)}`,
    });

    return { success: true, error: null };
  } catch (e: any) {
    return { success: false, error: e.message || 'Erro ao excluir script' };
  }
}

// =====================================================================
// ESTOQUE NFC (vulto_inventory)
// =====================================================================

export async function fetchVultoInventory(): Promise<{ data: VultoInventoryItem[]; error: string | null }> {
  if (!isSupabaseConfigured) return { data: [], error: 'Supabase não configurado' };
  try {
    const { data, error } = await supabase
      .from('vulto_inventory')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: (data || []) as VultoInventoryItem[], error: null };
  } catch (e: any) {
    return { data: [], error: e.message || 'Erro ao carregar estoque' };
  }
}

export async function createVultoInventoryItem(payload: {
  name: string;
  quantity: number;
  notes?: string | null;
}): Promise<{ data: VultoInventoryItem | null; error: string | null }> {
  const op = getActiveOperatorSession();
  const insertPayload = {
    name: payload.name.trim(),
    quantity: Math.max(0, Number(payload.quantity) || 0),
    notes: payload.notes?.trim() || null,
    operator_id: op?.id || null,
  };

  try {
    const { data, error } = await supabase
      .from('vulto_inventory')
      .insert([insertPayload])
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    await logVultoAudit({
      action: 'Adicionou Item Estoque',
      entity_type: 'vulto_inventory',
      entity_id: data.id,
      details: `${op?.name || 'Operador'} adicionou ${payload.name} (${insertPayload.quantity} un)`,
    });

    return { data: data as VultoInventoryItem, error: null };
  } catch (e: any) {
    return { data: null, error: e.message || 'Erro ao criar item de estoque' };
  }
}

export async function updateVultoInventoryItem(
  id: string,
  updates: {
    name?: string;
    quantity?: number;
    notes?: string | null;
  }
): Promise<{ success: boolean; error: string | null }> {
  const op = getActiveOperatorSession();
  const payload: any = { updated_at: new Date().toISOString(), operator_id: op?.id || null };
  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.quantity !== undefined) payload.quantity = Math.max(0, Number(updates.quantity) || 0);
  if (updates.notes !== undefined) payload.notes = updates.notes?.trim() || null;

  try {
    const { error } = await supabase
      .from('vulto_inventory')
      .update(payload)
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    await logVultoAudit({
      action: 'Alterou Estoque',
      entity_type: 'vulto_inventory',
      entity_id: id,
      details: `${op?.name || 'Operador'} atualizou o item #${id.slice(0, 8)}`,
    });

    return { success: true, error: null };
  } catch (e: any) {
    return { success: false, error: e.message || 'Erro ao atualizar estoque' };
  }
}

export async function deleteVultoInventoryItem(id: string): Promise<{ success: boolean; error: string | null }> {
  const op = getActiveOperatorSession();
  try {
    const { error } = await supabase
      .from('vulto_inventory')
      .delete()
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    await logVultoAudit({
      action: 'Excluiu Item Estoque',
      entity_type: 'vulto_inventory',
      entity_id: id,
      details: `${op?.name || 'Operador'} removeu o item de estoque #${id.slice(0, 8)}`,
    });

    return { success: true, error: null };
  } catch (e: any) {
    return { success: false, error: e.message || 'Erro ao excluir item de estoque' };
  }
}

// =====================================================================
// TABELA DE PREÇOS (vulto_price_table)
// =====================================================================// =====================================================================
// TABELA DE PREÇOS (vulto_price_table)
// =====================================================================

export async function fetchVultoPriceTable(): Promise<{ data: VultoPriceItem[]; error: string | null }> {
  if (!isSupabaseConfigured) return { data: [], error: 'Supabase não configurado' };
  try {
    const { data, error } = await supabase
      .from('vulto_price_table')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return { data: [], error: error.message };
    return { data: (data || []) as VultoPriceItem[], error: null };
  } catch (e: any) {
    return { data: [], error: e.message || 'Erro ao carregar tabela de preços' };
  }
}

export async function createVultoPriceItem(payload: {
  service_name: string;
  description?: string | null;
  price: number;
  billing_type: VultoBillingType;
  active?: boolean;
}): Promise<{ data: VultoPriceItem | null; error: string | null }> {
  const op = getActiveOperatorSession();
  const insertPayload = {
    service_name: payload.service_name.trim(),
    description: payload.description?.trim() || null,
    price: Number(payload.price) || 0,
    billing_type: payload.billing_type,
    active: payload.active !== undefined ? payload.active : true,
    operator_id: op?.id || null,
  };
  try {
    const { data, error } = await supabase
      .from('vulto_price_table')
      .insert([insertPayload])
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    await logVultoAudit({
      action: 'price_created',
      entity_type: 'vulto_price_table',
      entity_id: data.id,
      details: (op ? op.name : 'Operador') + ' cadastrou o serviço ' + payload.service_name,
    });
    return { data: data as VultoPriceItem, error: null };
  } catch (e: any) {
    return { data: null, error: e.message || 'Erro ao cadastrar preço' };
  }
}

export async function updateVultoPriceItem(
  id: string,
  updates: {
    service_name?: string;
    description?: string | null;
    price?: number;
    billing_type?: VultoBillingType;
    active?: boolean;
  }
): Promise<{ success: boolean; error: string | null }> {
  const op = getActiveOperatorSession();
  const payload: any = { updated_at: new Date().toISOString(), operator_id: op?.id || null };
  if (updates.service_name !== undefined) payload.service_name = updates.service_name.trim();
  if (updates.description !== undefined) payload.description = updates.description?.trim() || null;
  if (updates.price !== undefined) payload.price = Number(updates.price) || 0;
  if (updates.billing_type !== undefined) payload.billing_type = updates.billing_type;
  if (updates.active !== undefined) payload.active = updates.active;

  try {
    const { error } = await supabase
      .from('vulto_price_table')
      .update(payload)
      .eq('id', id);
    if (error) return { success: false, error: error.message };

    let actionName = 'price_updated';
    let detailMsg = (op ? op.name : "Operador") + " editou o preço #" + id.slice(0, 8);
    if (updates.active !== undefined) {
      actionName = updates.active ? 'price_activated' : 'price_deactivated';
      detailMsg = (op ? op.name : "Operador") + (updates.active ? " ativou" : " inativou") + " o serviço #" + id.slice(0, 8);
    }

    await logVultoAudit({
      action: actionName,
      entity_type: 'vulto_price_table',
      entity_id: id,
      details: detailMsg,
    });
    return { success: true, error: null };
  } catch (e: any) {
    return { success: false, error: e.message || 'Erro ao atualizar preço' };
  }
}

export async function deleteVultoPriceItem(id: string): Promise<{ success: boolean; error: string | null }> {
  const op = getActiveOperatorSession();
  try {
    const { error } = await supabase
      .from('vulto_price_table')
      .delete()
      .eq('id', id);
    if (error) return { success: false, error: error.message };
    await logVultoAudit({
      action: 'price_deleted',
      entity_type: 'vulto_price_table',
      entity_id: id,
      details: (op ? op.name : 'Operador') + ' excluiu o preço #' + id.slice(0, 8),
    });
    return { success: true, error: null };
  } catch (e: any) {
    return { success: false, error: e.message || 'Erro ao excluir preço' };
  }
}

// =====================================================================
// PROSPECÇÃO / MINI CRM - CRUD & PIPELINE
// =====================================================================

export async function fetchVultoProspects(): Promise<{ data: VultoProspect[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('vulto_prospects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Erro ao carregar prospects do Supabase:', error);
      return { data: [], error: error.message };
    }
    return { data: (data || []) as VultoProspect[], error: null };
  } catch (e: any) {
    console.error('Erro ao buscar prospects:', e);
    return { data: [], error: e.message || 'Erro inesperado ao buscar prospects' };
  }
}

export async function createVultoProspect(payload: {
  company_name: string;
  contact_name?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  instagram?: string | null;
  city?: string | null;
  state?: string | null;
  source?: string | null;
  channel?: string | null;
  service_interest?: string | null;
  status?: ProspectStatus;
  priority?: ProspectPriority;
  last_contact_at?: string | null;
  next_contact_at?: string | null;
  proposal_amount?: number | null;
  notes?: string | null;
}): Promise<{ data: VultoProspect | null; error: string | null }> {
  const op = getActiveOperatorSession();
  const validChannel = payload.channel ? normalizeProspectChannel(payload.channel) : 'whatsapp';
  const insertPayload = {
    company_name: payload.company_name.trim(),
    contact_name: payload.contact_name?.trim() || null,
    email: payload.email?.trim() || null,
    phone: payload.phone?.trim() || null,
    website: payload.website?.trim() || null,
    instagram: payload.instagram?.trim() || null,
    city: payload.city?.trim() || null,
    state: payload.state?.trim() || null,
    source: payload.source?.trim() || null,
    channel: validChannel,
    service_interest: payload.service_interest?.trim() || null,
    status: payload.status || 'novo',
    priority: payload.priority || 'media',
    last_contact_at: payload.last_contact_at || null,
    next_contact_at: payload.next_contact_at || null,
    proposal_amount: payload.proposal_amount !== undefined && payload.proposal_amount !== null ? Number(payload.proposal_amount) : null,
    notes: payload.notes?.trim() || null,
    operator_id: op?.id || null,
  };

  try {
    const { data, error } = await supabase
      .from('vulto_prospects')
      .insert([insertPayload])
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    await logVultoAudit({
      action: 'Adicionou Prospect',
      entity_type: 'vulto_prospects',
      entity_id: data.id,
      details: `${op?.name || 'Operador'} cadastrou o prospect ${payload.company_name}`,
    });

    return { data: data as VultoProspect, error: null };
  } catch (e: any) {
    return { data: null, error: e.message || 'Erro ao cadastrar prospect' };
  }
}

export async function updateVultoProspect(
  id: string,
  updates: Partial<Omit<VultoProspect, 'id' | 'created_at'>>
): Promise<{ success: boolean; error: string | null }> {
  const op = getActiveOperatorSession();
  const payload: any = {
    ...updates,
    updated_at: new Date().toISOString(),
    operator_id: op?.id || null,
  };

  if (updates.channel !== undefined) {
    payload.channel = updates.channel ? normalizeProspectChannel(updates.channel) : 'whatsapp';
  }

  try {
    const { error } = await supabase
      .from('vulto_prospects')
      .update(payload)
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    await logVultoAudit({
      action: 'Atualizou Prospect',
      entity_type: 'vulto_prospects',
      entity_id: id,
      details: `${op?.name || 'Operador'} atualizou o prospect #${id.slice(0, 8)}`,
    });

    return { success: true, error: null };
  } catch (e: any) {
    return { success: false, error: e.message || 'Erro ao atualizar prospect' };
  }
}

export async function deleteVultoProspect(id: string): Promise<{ success: boolean; error: string | null }> {
  const op = getActiveOperatorSession();
  try {
    // Excluir interações associadas primeiro
    await supabase.from('vulto_prospect_interactions').delete().eq('prospect_id', id);

    const { error } = await supabase
      .from('vulto_prospects')
      .delete()
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    await logVultoAudit({
      action: 'Excluiu Prospect',
      entity_type: 'vulto_prospects',
      entity_id: id,
      details: `${op?.name || 'Operador'} excluiu o prospect #${id.slice(0, 8)}`,
    });

    return { success: true, error: null };
  } catch (e: any) {
    return { success: false, error: e.message || 'Erro ao excluir prospect' };
  }
}

export async function convertProspectToClient(
  prospect: VultoProspect,
  serviceType: VultoClientServiceType
): Promise<{ client: VultoClientItem | null; error: string | null }> {
  const op = getActiveOperatorSession();
  try {
    // 1. Criar cliente na tabela vulto_clients
    const clientPayload = {
      name: prospect.company_name.trim(),
      service_type: serviceType,
      operator_id: op?.id || null,
    };

    const { data: clientData, error: clientError } = await supabase
      .from('vulto_clients')
      .insert([clientPayload])
      .select()
      .single();

    if (clientError) {
      return { client: null, error: `Erro ao criar cliente: ${clientError.message}` };
    }

    // 2. Atualizar prospect para status 'fechado' e gravar converted_client_id
    const { error: prospectError } = await supabase
      .from('vulto_prospects')
      .update({
        status: 'fechado',
        converted_client_id: clientData.id,
        updated_at: new Date().toISOString(),
        operator_id: op?.id || null,
      })
      .eq('id', prospect.id);

    if (prospectError) {
      console.warn('Cliente criado mas erro ao atualizar prospect:', prospectError);
    }

    // 3. Registrar auditoria de conversão
    await logVultoAudit({
      action: 'Converteu Prospect em Cliente',
      entity_type: 'vulto_prospects',
      entity_id: prospect.id,
      details: `${op?.name || 'Operador'} converteu "${prospect.company_name}" em cliente oficial (${serviceType})`,
    });

    return { client: clientData as VultoClientItem, error: null };
  } catch (e: any) {
    return { client: null, error: e.message || 'Erro ao converter prospect em cliente' };
  }
}

// =====================================================================
// INTERAÇÕES DE PROSPECÇÃO (TIMELINE)
// =====================================================================

export async function fetchProspectInteractions(
  prospectId: string
): Promise<{ data: VultoProspectInteraction[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('vulto_prospect_interactions')
      .select('*')
      .eq('prospect_id', prospectId)
      .order('interaction_at', { ascending: false });

    if (error) {
      console.warn('Erro ao carregar interações do Supabase:', error);
      return { data: [], error: error.message };
    }
    return { data: (data || []) as VultoProspectInteraction[], error: null };
  } catch (e: any) {
    console.error('Erro ao buscar interações:', e);
    return { data: [], error: e.message || 'Erro inesperado ao buscar interações' };
  }
}

export async function createProspectInteraction(payload: {
  prospect_id: string;
  type: InteractionType;
  summary: string;
  details?: string | null;
  interaction_at?: string;
}): Promise<{ data: VultoProspectInteraction | null; error: string | null }> {
  const op = getActiveOperatorSession();
  const interactionTime = payload.interaction_at || new Date().toISOString();

  const insertPayload = {
    prospect_id: payload.prospect_id,
    type: payload.type,
    summary: payload.summary.trim(),
    details: payload.details?.trim() || null,
    interaction_at: interactionTime,
    operator_id: op?.id || null,
  };

  try {
    const { data, error } = await supabase
      .from('vulto_prospect_interactions')
      .insert([insertPayload])
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    // Atualizar automaticamente last_contact_at no prospect
    await supabase
      .from('vulto_prospects')
      .update({
        last_contact_at: interactionTime,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.prospect_id);

    await logVultoAudit({
      action: 'Registrou Interação',
      entity_type: 'vulto_prospect_interactions',
      entity_id: data.id,
      details: `${op?.name || 'Operador'} registrou interação (${payload.type}) no prospect #${payload.prospect_id.slice(0, 8)}: ${payload.summary}`,
    });

    return { data: data as VultoProspectInteraction, error: null };
  } catch (e: any) {
    return { data: null, error: e.message || 'Erro ao registrar interação' };
  }
}

export async function deleteProspectInteraction(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  const op = getActiveOperatorSession();
  try {
    const { error } = await supabase
      .from('vulto_prospect_interactions')
      .delete()
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    await logVultoAudit({
      action: 'Excluiu Interação',
      entity_type: 'vulto_prospect_interactions',
      entity_id: id,
      details: `${op?.name || 'Operador'} excluiu interação #${id.slice(0, 8)}`,
    });

    return { success: true, error: null };
  } catch (e: any) {
    return { success: false, error: e.message || 'Erro ao excluir interação' };
  }
}

// =====================================================================
// METAS DE PROSPECÇÃO (vulto_prospecting_goals)
// =====================================================================

export async function fetchProspectingGoal(
  month: string,
  scope: ProspectingGoalScope = 'team',
  targetOperatorId: string | null = null
): Promise<{ data: VultoProspectingGoal | null; error: string | null }> {
  try {
    const monthPrefix = month.slice(0, 7); // 'YYYY-MM'

    let query = supabase
      .from('vulto_prospecting_goals')
      .select('*')
      .eq('scope', scope);

    if (scope === 'operator' && targetOperatorId) {
      query = query.eq('target_operator_id', targetOperatorId);
    } else {
      query = query.or('target_operator_id.is.null,target_operator_id.eq.');
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Erro ao carregar metas de prospecção do Supabase:', error);
      return { data: null, error: error.message };
    }

    if (data && data.length > 0) {
      const matched = data.find((row: any) => {
        if (!row.month) return false;
        return row.month === month || row.month.startsWith(monthPrefix);
      });
      if (matched) return { data: matched as VultoProspectingGoal, error: null };
    }

    return { data: null, error: null };
  } catch (e: any) {
    console.error('Erro ao buscar meta de prospecção:', e);
    return { data: null, error: e.message || 'Erro inesperado ao buscar metas de prospecção' };
  }
}

export async function upsertProspectingGoal(payload: {
  id?: string | null;
  month: string;
  scope: ProspectingGoalScope;
  target_operator_id?: string | null;
  prospects_target: number;
  initial_contacts_target: number;
  followups_target: number;
  responses_target: number;
  proposals_target: number;
  closed_target: number;
}): Promise<{ data: VultoProspectingGoal | null; error: string | null }> {
  const op = getActiveOperatorSession();
  const monthKey = payload.month.length === 7 ? payload.month : payload.month.slice(0, 7);

  const savePayload: any = {
    month: monthKey,
    scope: payload.scope,
    target_operator_id: payload.scope === 'operator' ? payload.target_operator_id || null : null,
    prospects_target: Math.max(0, Math.round(Number(payload.prospects_target) || 0)),
    initial_contacts_target: Math.max(0, Math.round(Number(payload.initial_contacts_target) || 0)),
    followups_target: Math.max(0, Math.round(Number(payload.followups_target) || 0)),
    responses_target: Math.max(0, Math.round(Number(payload.responses_target) || 0)),
    proposals_target: Math.max(0, Math.round(Number(payload.proposals_target) || 0)),
    closed_target: Math.max(0, Math.round(Number(payload.closed_target) || 0)),
    updated_by_operator_id: op?.id || null,
    updated_at: new Date().toISOString(),
  };

  try {
    let existingId = payload.id;

    if (!existingId) {
      let checkQuery = supabase
        .from('vulto_prospecting_goals')
        .select('id, month')
        .eq('scope', savePayload.scope);

      if (savePayload.scope === 'operator' && savePayload.target_operator_id) {
        checkQuery = checkQuery.eq('target_operator_id', savePayload.target_operator_id);
      } else {
        checkQuery = checkQuery.or('target_operator_id.is.null,target_operator_id.eq.');
      }

      const { data: rows } = await checkQuery;
      if (rows && rows.length > 0) {
        const found = rows.find((r: any) => r.month === monthKey || r.month?.startsWith(monthKey));
        if (found) existingId = found.id;
      }
    }

    let resultRecord: VultoProspectingGoal | null = null;

    if (existingId) {
      const { data, error } = await supabase
        .from('vulto_prospecting_goals')
        .update(savePayload)
        .eq('id', existingId)
        .select()
        .single();

      if (error) return { data: null, error: error.message };
      resultRecord = data as VultoProspectingGoal;
    } else {
      const { data, error } = await supabase
        .from('vulto_prospecting_goals')
        .insert([savePayload])
        .select()
        .single();

      if (error) {
        // Fallback tentar com month formato YYYY-MM-01 se for coluna do tipo date no postgres
        const fallbackPayload = { ...savePayload, month: `${monthKey}-01` };
        const fallbackRes = await supabase
          .from('vulto_prospecting_goals')
          .insert([fallbackPayload])
          .select()
          .single();
        if (fallbackRes.error) return { data: null, error: fallbackRes.error.message };
        resultRecord = fallbackRes.data as VultoProspectingGoal;
      } else {
        resultRecord = data as VultoProspectingGoal;
      }
    }

    await logVultoAudit({
      action: 'Definiu Metas de Prospecção',
      entity_type: 'vulto_prospecting_goals',
      entity_id: resultRecord?.id || null,
      details: `${op?.name || 'Operador'} atualizou as metas de prospecção para o mês ${monthKey} (Escopo: ${payload.scope === 'team' ? 'Equipe Geral' : 'Individual'})`,
    });

    return { data: resultRecord, error: null };
  } catch (e: any) {
    console.error('Erro ao salvar meta de prospecção:', e);
    return { data: null, error: e.message || 'Erro inesperado ao salvar metas' };
  }
}

export async function fetchAllProspectsAndInteractions(): Promise<{
  prospects: VultoProspect[];
  interactions: VultoProspectInteraction[];
  error: string | null;
}> {
  try {
    const [pRes, iRes] = await Promise.all([
      supabase.from('vulto_prospects').select('*').order('created_at', { ascending: false }),
      supabase.from('vulto_prospect_interactions').select('*').order('interaction_at', { ascending: false }),
    ]);

    return {
      prospects: (pRes.data || []) as VultoProspect[],
      interactions: (iRes.data || []) as VultoProspectInteraction[],
      error: pRes.error?.message || iRes.error?.message || null,
    };
  } catch (e: any) {
    return { prospects: [], interactions: [], error: e.message || 'Erro ao carregar dados do CRM' };
  }
}

// =====================================================================
// MINHAS NOTAS DO OPERADOR (vulto_operator_notes)
// 4 slots fixos por operador: operator_id + slot únicos
// =====================================================================

const LOCAL_NOTES_PREFIX = 'vulto_operator_notes_';

function getLocalNotes(operatorKey: string): VultoOperatorNote[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_NOTES_PREFIX}${operatorKey}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Erro ao ler notas locais:', e);
  }
  return [];
}

function setLocalNotes(operatorKey: string, notes: VultoOperatorNote[]) {
  try {
    localStorage.setItem(`${LOCAL_NOTES_PREFIX}${operatorKey}`, JSON.stringify(notes));
  } catch (e) {
    console.warn('Erro ao salvar notas locais:', e);
  }
}

export async function fetchOperatorNotes(
  operatorIdentifier: string
): Promise<{ data: VultoOperatorNote[]; error: string | null }> {
  if (!operatorIdentifier) {
    return { data: [], error: 'Operador não identificado' };
  }

  const normalizedKey = operatorIdentifier.trim();

  if (isSupabaseConfigured) {
    try {
      // Busca exata pelo operator_id configurado (ex: "Felipe" ou "Pietro" ou ID)
      const { data, error } = await supabase
        .from('vulto_operator_notes')
        .select('*')
        .eq('operator_id', normalizedKey)
        .order('slot', { ascending: true });

      if (error) {
        console.warn('Aviso ao consultar vulto_operator_notes:', error.message);
        // Fallback local se o banco falhar
        const fallback = getLocalNotes(normalizedKey);
        return { data: fallback, error: error.message };
      }

      if (data) {
        const typedData = data as VultoOperatorNote[];
        // Atualiza cache local
        setLocalNotes(normalizedKey, typedData);
        return { data: typedData, error: null };
      }
    } catch (err: any) {
      console.warn('Erro ao conectar ao Supabase para notas:', err);
      const fallback = getLocalNotes(normalizedKey);
      return { data: fallback, error: err.message || 'Erro de conexão' };
    }
  }

  // Ambiente offline / sem Supabase configurado
  const localNotes = getLocalNotes(normalizedKey);
  return { data: localNotes, error: null };
}

export async function saveOperatorNote(params: {
  operator_id: string;
  slot: number;
  title: string;
  content: string;
  id?: string;
}): Promise<{ success: boolean; data?: VultoOperatorNote; error: string | null }> {
  const operatorKey = params.operator_id?.trim();
  if (!operatorKey) {
    return { success: false, error: 'Identificador do operador é obrigatório.' };
  }

  if (params.slot < 1 || params.slot > 4) {
    return { success: false, error: 'Slot inválido. Deve ser entre 1 e 4.' };
  }

  const cleanTitle = (params.title || '').trim().slice(0, 80);
  const cleanContent = (params.content || '').slice(0, 1000);
  const now = new Date().toISOString();

  if (isSupabaseConfigured) {
    try {
      let savedNote: VultoOperatorNote | null = null;

      // 1. Se tem id direto, tenta update
      if (params.id) {
        const { data, error } = await supabase
          .from('vulto_operator_notes')
          .update({
            title: cleanTitle,
            content: cleanContent,
            updated_at: now,
          })
          .eq('id', params.id)
          .select()
          .single();

        if (!error && data) {
          savedNote = data as VultoOperatorNote;
        }
      }

      // 2. Se não tinha id ou o update não encontrou, busca se já existe registro com operator_id e slot
      if (!savedNote) {
        const { data: existing } = await supabase
          .from('vulto_operator_notes')
          .select('id')
          .eq('operator_id', operatorKey)
          .eq('slot', params.slot)
          .maybeSingle();

        if (existing?.id) {
          const { data: updated, error: updateErr } = await supabase
            .from('vulto_operator_notes')
            .update({
              title: cleanTitle,
              content: cleanContent,
              updated_at: now,
            })
            .eq('id', existing.id)
            .select()
            .single();

          if (updateErr) throw updateErr;
          savedNote = updated as VultoOperatorNote;
        } else {
          // Inserção de novo registro
          const { data: inserted, error: insertErr } = await supabase
            .from('vulto_operator_notes')
            .insert({
              operator_id: operatorKey,
              slot: params.slot,
              title: cleanTitle,
              content: cleanContent,
              created_at: now,
              updated_at: now,
            })
            .select()
            .single();

          if (insertErr) throw insertErr;
          savedNote = inserted as VultoOperatorNote;
        }
      }

      if (savedNote) {
        // Atualiza cache local
        const currentLocal = getLocalNotes(operatorKey);
        const filtered = currentLocal.filter((n) => n.slot !== params.slot);
        filtered.push(savedNote);
        setLocalNotes(operatorKey, filtered);

        await logVultoAudit({
          action: 'Atualizou Nota',
          entity_type: 'operator_notes',
          entity_id: savedNote.id,
          operator_id: operatorKey,
          details: `${operatorKey} salvou nota no Slot ${params.slot}: "${cleanTitle || '(Sem título)'}"`,
        });

        return { success: true, data: savedNote, error: null };
      }
    } catch (e: any) {
      console.warn('Erro ao salvar no Supabase, aplicando persistência local:', e);
    }
  }

  // Fallback local se Supabase offline
  const currentLocal = getLocalNotes(operatorKey);
  const existingIdx = currentLocal.findIndex((n) => n.slot === params.slot);
  const localNote: VultoOperatorNote = {
    id: params.id || (existingIdx >= 0 ? currentLocal[existingIdx].id : `local-note-${Date.now()}`),
    operator_id: operatorKey,
    slot: params.slot,
    title: cleanTitle,
    content: cleanContent,
    created_at: existingIdx >= 0 ? currentLocal[existingIdx].created_at : now,
    updated_at: now,
  };

  if (existingIdx >= 0) {
    currentLocal[existingIdx] = localNote;
  } else {
    currentLocal.push(localNote);
  }
  setLocalNotes(operatorKey, currentLocal);

  return { success: true, data: localNote, error: null };
}

export async function deleteOperatorNote(params: {
  operator_id: string;
  slot: number;
  id?: string;
}): Promise<{ success: boolean; error: string | null }> {
  const operatorKey = params.operator_id?.trim();
  if (!operatorKey) {
    return { success: false, error: 'Identificador do operador é obrigatório.' };
  }

  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('vulto_operator_notes').delete();
      if (params.id) {
        query = query.eq('id', params.id);
      } else {
        query = query.eq('operator_id', operatorKey).eq('slot', params.slot);
      }
      const { error } = await query;
      if (error) {
        console.warn('Erro ao deletar no Supabase:', error.message);
      }
    } catch (e: any) {
      console.warn('Falha na requisição de exclusão ao Supabase:', e);
    }
  }

  // Atualizar cache local
  const currentLocal = getLocalNotes(operatorKey);
  const filtered = currentLocal.filter((n) => n.slot !== params.slot);
  setLocalNotes(operatorKey, filtered);

  await logVultoAudit({
    action: 'Limpou Slot de Nota',
    entity_type: 'operator_notes',
    entity_id: params.id || null,
    operator_id: operatorKey,
    details: `${operatorKey} limpou o Slot ${params.slot} de suas notas pessoais.`,
  });

  return { success: true, error: null };
}

// =====================================================================
// FORMATAÇÃO DE DADOS OPERACIONAIS (ZONA DE PERIGO)
// =====================================================================

export async function formatOperationalData(): Promise<{ success: boolean; error: string | null }> {
  const op = getActiveOperatorSession();
  try {
    await Promise.all([
      supabase.from('vulto_finance').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('vulto_monthly_expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('vulto_clients').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('vulto_tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('vulto_sales_scripts').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('vulto_inventory').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('vulto_monthly_goals').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('vulto_price_table').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('vulto_prospect_interactions').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('vulto_prospects').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('vulto_audit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    ]);

    await logVultoAudit({
      action: 'Formatação de Dados',
      entity_type: 'system',
      details: `${op?.name || 'Operador'} formatou os dados operacionais do painel.`,
    });

    return { success: true, error: null };
  } catch (e: any) {
    return { success: false, error: e.message || 'Erro ao formatar dados' };
  }
}
