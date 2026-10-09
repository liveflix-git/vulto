import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { logActivity } from './crmService';

export interface ServiceNoteItem {
  id: string;
  title: string;
  content: string;
  service_category: string | null;
  value: number | null;
  author_id: string | null;
  author_name?: string;
  created_at: string;
  updated_at: string;
}

const LOCAL_STORAGE_KEY = 'vulto_service_notes_data';

function getLocalNotes(): ServiceNoteItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Erro ao ler notas locais:', e);
  }
  return [];
}

function saveLocalNotes(notes: ServiceNoteItem[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notes));
  } catch (e) {
    console.error('Erro ao salvar notas locais:', e);
  }
}

/**
 * Busca todas as anotações comerciais e de serviços ordenadas pela última atualização.
 */
export async function fetchServiceNotes(): Promise<ServiceNoteItem[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('service_notes')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        // Se a tabela ainda não foi criada no Supabase, fallback para armazenamento local limpo
        console.warn('Tabela service_notes não encontrada ou erro no Supabase:', error.message);
        return getLocalNotes();
      }

      if (data) {
        return data.map((item: any) => ({
          id: item.id,
          title: item.title,
          content: item.content || '',
          service_category: item.service_category || null,
          value: item.value !== null && item.value !== undefined ? Number(item.value) : null,
          author_id: item.author_id || null,
          author_name: item.author_name || (item.author_id ? 'Sócio' : 'Equipe VULTO'),
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString(),
        }));
      }
    } catch (err) {
      console.error('Erro ao conectar ao Supabase em fetchServiceNotes:', err);
      return getLocalNotes();
    }
  }

  return getLocalNotes();
}

/**
 * Cria uma nova anotação / registro de serviço.
 */
export async function createServiceNote(payload: {
  title: string;
  content: string;
  service_category?: string | null;
  value?: number | null;
  author_name?: string;
}): Promise<{ data: ServiceNoteItem | null; error: string | null }> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  let author_id: string | null = null;
  if (isSupabaseConfigured) {
    try {
      const { data: authData } = await supabase.auth.getUser();
      author_id = authData.user?.id || null;
    } catch {
      // Ignora erro de auth
    }
  }

  const record: ServiceNoteItem = {
    id,
    title: payload.title.trim(),
    content: payload.content || '',
    service_category: payload.service_category?.trim() || null,
    value: payload.value !== undefined && payload.value !== null && !isNaN(payload.value) ? Number(payload.value) : null,
    author_id,
    author_name: payload.author_name || 'Felipe',
    created_at: now,
    updated_at: now,
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('service_notes')
        .insert([
          {
            id: record.id,
            title: record.title,
            content: record.content,
            service_category: record.service_category,
            value: record.value,
            author_id: record.author_id,
            created_at: now,
            updated_at: now,
          },
        ])
        .select()
        .single();

      if (error) {
        // Se a tabela não existir no Supabase, salvar localmente para não bloquear a experiência do usuário
        if (error.code === 'PGRST205' || error.message.includes('not find the table')) {
          const current = getLocalNotes();
          saveLocalNotes([record, ...current]);
          return { data: record, error: null };
        }
        return { data: null, error: error.message };
      }

      await logActivity('NOTA_CRIADA', `Anotação de serviço criada: ${record.title}`);
      return {
        data: {
          id: data.id,
          title: data.title,
          content: data.content || '',
          service_category: data.service_category,
          value: data.value !== null && data.value !== undefined ? Number(data.value) : null,
          author_id: data.author_id,
          author_name: record.author_name,
          created_at: data.created_at,
          updated_at: data.updated_at,
        },
        error: null,
      };
    } catch (err: any) {
      return { data: null, error: err.message || 'Erro inesperado ao criar registro' };
    }
  }

  const current = getLocalNotes();
  saveLocalNotes([record, ...current]);
  return { data: record, error: null };
}

/**
 * Atualiza uma anotação existente.
 */
export async function updateServiceNote(
  id: string,
  updates: {
    title?: string;
    content?: string;
    service_category?: string | null;
    value?: number | null;
  }
): Promise<{ success: boolean; error: string | null }> {
  const now = new Date().toISOString();
  const payload: any = {
    updated_at: now,
  };

  if (updates.title !== undefined) payload.title = updates.title.trim();
  if (updates.content !== undefined) payload.content = updates.content;
  if (updates.service_category !== undefined) payload.service_category = updates.service_category?.trim() || null;
  if (updates.value !== undefined) {
    payload.value = updates.value !== null && !isNaN(updates.value) ? Number(updates.value) : null;
  }

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('service_notes')
        .update(payload)
        .eq('id', id);

      if (error) {
        if (error.code === 'PGRST205' || error.message.includes('not find the table')) {
          const current = getLocalNotes();
          const updated = current.map((item) => (item.id === id ? { ...item, ...payload } : item));
          saveLocalNotes(updated);
          return { success: true, error: null };
        }
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao atualizar nota' };
    }
  }

  const current = getLocalNotes();
  const updated = current.map((item) => (item.id === id ? { ...item, ...payload } : item));
  saveLocalNotes(updated);
  return { success: true, error: null };
}

/**
 * Exclui uma anotação do banco de dados do Supabase.
 */
export async function deleteServiceNote(id: string): Promise<{ success: boolean; error: string | null }> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('service_notes').delete().eq('id', id);
      if (error) {
        if (error.code === 'PGRST205' || error.message.includes('not find the table')) {
          const current = getLocalNotes();
          saveLocalNotes(current.filter((item) => item.id !== id));
          return { success: true, error: null };
        }
        return { success: false, error: error.message };
      }
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao excluir nota' };
    }
  }

  const current = getLocalNotes();
  saveLocalNotes(current.filter((item) => item.id !== id));
  return { success: true, error: null };
}
