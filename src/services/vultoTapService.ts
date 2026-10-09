import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { logActivity } from './crmService';

export type VultoTapCardStatus = 'DISPONÍVEL' | 'INDISPONÍVEL' | 'EM PRODUÇÃO';

export interface VultoTapCardItem {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  status: VultoTapCardStatus;
  quantity: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const LOCAL_STORAGE_KEY = 'vulto_tap_cards_data';

function getLocalCards(): VultoTapCardItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Erro ao ler cartões locais:', e);
  }
  return [];
}

function saveLocalCards(cards: VultoTapCardItem[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cards));
  } catch (e) {
    console.error('Erro ao salvar cartões locais:', e);
  }
}

/**
 * Busca todos os cartões cadastrados pelo usuário. Inicialmente retorna lista vazia.
 */
export async function fetchVultoTapCards(): Promise<VultoTapCardItem[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('vulto_tap_cards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // Se a tabela vulto_tap_cards ainda não existir, tentar vulto_tap_models ou fallback local limpo
        if (error.code === 'PGRST205' || error.message.includes('not find the table')) {
          return getLocalCards();
        }
        console.warn('Erro ao buscar cartões VULTO TAP:', error.message);
        return getLocalCards();
      }

      if (data) {
        return data.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description || null,
          price: item.price !== null && item.price !== undefined ? Number(item.price) : null,
          status: (item.status as VultoTapCardStatus) || 'DISPONÍVEL',
          quantity: item.quantity !== null && item.quantity !== undefined ? Number(item.quantity) : null,
          notes: item.notes || null,
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString(),
        }));
      }
    } catch (err) {
      console.error('Falha de conexão com Supabase em fetchVultoTapCards:', err);
      return getLocalCards();
    }
  }

  return getLocalCards();
}

/**
 * Cria um novo cartão / placa VULTO TAP.
 */
export async function createVultoTapCard(payload: {
  name: string;
  description?: string | null;
  price?: number | null;
  status: VultoTapCardStatus;
  quantity?: number | null;
  notes?: string | null;
}): Promise<{ data: VultoTapCardItem | null; error: string | null }> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  const record: VultoTapCardItem = {
    id,
    name: payload.name.trim(),
    description: payload.description?.trim() || null,
    price: payload.price !== undefined && payload.price !== null && !isNaN(payload.price) ? Number(payload.price) : null,
    status: payload.status,
    quantity: payload.quantity !== undefined && payload.quantity !== null && !isNaN(payload.quantity) ? Number(payload.quantity) : null,
    notes: payload.notes?.trim() || null,
    created_at: now,
    updated_at: now,
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('vulto_tap_cards')
        .insert([
          {
            id: record.id,
            name: record.name,
            description: record.description,
            price: record.price,
            status: record.status,
            quantity: record.quantity,
            notes: record.notes,
            created_at: now,
            updated_at: now,
          },
        ])
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST205' || error.message.includes('not find the table')) {
          const current = getLocalCards();
          saveLocalCards([record, ...current]);
          return { data: record, error: null };
        }
        return { data: null, error: error.message };
      }

      await logActivity('CARTAO_CRIADO', `Novo cartão VULTO TAP cadastrado: ${record.name}`);
      return {
        data: {
          id: data.id,
          name: data.name,
          description: data.description,
          price: data.price !== null && data.price !== undefined ? Number(data.price) : null,
          status: data.status as VultoTapCardStatus,
          quantity: data.quantity !== null && data.quantity !== undefined ? Number(data.quantity) : null,
          notes: data.notes,
          created_at: data.created_at,
          updated_at: data.updated_at,
        },
        error: null,
      };
    } catch (err: any) {
      return { data: null, error: err.message || 'Erro inesperado' };
    }
  }

  const current = getLocalCards();
  saveLocalCards([record, ...current]);
  return { data: record, error: null };
}

/**
 * Atualiza um cartão existente.
 */
export async function updateVultoTapCard(
  id: string,
  updates: Partial<Omit<VultoTapCardItem, 'id' | 'created_at'>>
): Promise<{ success: boolean; error: string | null }> {
  const now = new Date().toISOString();
  const payload: any = {
    updated_at: now,
  };

  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.description !== undefined) payload.description = updates.description?.trim() || null;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.notes !== undefined) payload.notes = updates.notes?.trim() || null;
  if (updates.price !== undefined) {
    payload.price = updates.price !== null && !isNaN(updates.price) ? Number(updates.price) : null;
  }
  if (updates.quantity !== undefined) {
    payload.quantity = updates.quantity !== null && !isNaN(updates.quantity) ? Number(updates.quantity) : null;
  }

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('vulto_tap_cards')
        .update(payload)
        .eq('id', id);

      if (error) {
        if (error.code === 'PGRST205' || error.message.includes('not find the table')) {
          const current = getLocalCards();
          const updated = current.map((c) => (c.id === id ? { ...c, ...payload } : c));
          saveLocalCards(updated);
          return { success: true, error: null };
        }
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao atualizar cartão' };
    }
  }

  const current = getLocalCards();
  const updated = current.map((c) => (c.id === id ? { ...c, ...payload } : c));
  saveLocalCards(updated);
  return { success: true, error: null };
}

/**
 * Exclui um cartão do Supabase.
 */
export async function deleteVultoTapCard(id: string): Promise<{ success: boolean; error: string | null }> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('vulto_tap_cards').delete().eq('id', id);
      if (error) {
        if (error.code === 'PGRST205' || error.message.includes('not find the table')) {
          const current = getLocalCards();
          saveLocalCards(current.filter((c) => c.id !== id));
          return { success: true, error: null };
        }
        return { success: false, error: error.message };
      }
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao excluir' };
    }
  }

  const current = getLocalCards();
  saveLocalCards(current.filter((c) => c.id !== id));
  return { success: true, error: null };
}
