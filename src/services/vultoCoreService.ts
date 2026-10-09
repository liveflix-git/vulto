import { supabase, isSupabaseConfigured } from '../lib/supabase';

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

export interface VultoFinanceItem {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  entry_type: VultoFinanceType;
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
 * Se a tabela estiver vazia, tenta criar Felipe e Pietro ou retorna o fallback.
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

      // Se data estiver vazia, tentar inserir os 2 sócios
      if (!error && data && data.length === 0) {
        try {
          const { data: inserted, error: insertErr } = await supabase
            .from('vulto_operators')
            .insert([
              { name: 'Felipe', active: true },
              { name: 'Pietro', active: true },
            ])
            .select();

          if (!insertErr && inserted && inserted.length > 0) {
            return inserted as VultoOperator[];
          }
        } catch (e) {
          // Fallback seguro
        }
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
    return { data: (data || []) as VultoFinanceItem[], error: null };
  } catch (e: any) {
    return { data: [], error: e.message || 'Erro ao carregar financeiro' };
  }
}

export async function createVultoFinance(payload: {
  title: string;
  description?: string | null;
  amount: number;
  entry_type: VultoFinanceType;
}): Promise<{ data: VultoFinanceItem | null; error: string | null }> {
  const op = getActiveOperatorSession();
  const insertPayload = {
    title: payload.title.trim(),
    description: payload.description?.trim() || null,
    amount: Number(payload.amount),
    entry_type: payload.entry_type,
    operator_id: op?.id || null,
  };

  try {
    const { data, error } = await supabase
      .from('vulto_finance')
      .insert([insertPayload])
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    await logVultoAudit({
      action: payload.entry_type === 'entrada' ? 'Adicionou Entrada' : 'Adicionou Saída',
      entity_type: 'vulto_finance',
      entity_id: data.id,
      details: `${op?.name || 'Operador'} adicionou ${payload.entry_type}: ${payload.title} (R$ ${payload.amount.toLocaleString('pt-BR')})`,
    });

    return { data: data as VultoFinanceItem, error: null };
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
      console.error('Erro retornado pelo Supabase ao excluir cliente:', error);
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
      .update({ completed, completed_at, updated_at })
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
  const payload: any = { updated_at: new Date().toISOString() };
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
  const payload: any = { updated_at: new Date().toISOString() };
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
  const payload: any = { updated_at: new Date().toISOString() };
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
// FORMATAÇÃO DE DADOS OPERACIONAIS (ZONA DE PERIGO)
// =====================================================================

export async function formatOperationalData(): Promise<{ success: boolean; error: string | null }> {
  const op = getActiveOperatorSession();
  try {
    // Apaga apenas dados operacionais em ordem segura
    // NÃO apaga vulto_operators nem usuários nem configs
    await Promise.all([
      supabase.from('vulto_finance').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('vulto_monthly_expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('vulto_clients').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('vulto_tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('vulto_sales_scripts').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('vulto_inventory').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
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
