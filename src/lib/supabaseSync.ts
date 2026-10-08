import { supabase, isSupabaseConfigured } from './supabase';
import {
  FinancialTransaction,
  DealItem,
  ClientRecord,
} from '../dashboard/types';

/**
 * Resilient Supabase data synchronization helper.
 * Directly maps frontend actions to the official Supabase tables:
 * - sales (for income)
 * - expenses (for expense)
 * - leads (for pipeline deals)
 * - clients (for client directory)
 * - activities (for operational log)
 */

export async function persistSupabaseTransaction(tx: FinancialTransaction): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    if (tx.type === 'income') {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id || null;

      const { error } = await supabase.from('sales').insert([
        {
          amount: tx.amount,
          status: tx.status === 'paid' ? 'completed' : 'pending',
          date: tx.date,
          notes: `${tx.description} (${tx.clientOrVendor})`,
          owner_id: userId,
        },
      ]);

      if (!error && userId) {
        await supabase.from('activities').insert([
          {
            user_id: userId,
            action: 'Nova Venda',
            description: `Venda registrada: ${tx.clientOrVendor} - R$ ${tx.amount.toLocaleString('pt-BR')}`,
          },
        ]);
      }
      return !error;
    } else {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id || null;

      const { error } = await supabase.from('expenses').insert([
        {
          category: tx.category,
          amount: tx.amount,
          date: tx.date,
          description: `${tx.description} (${tx.clientOrVendor})`,
        },
      ]);

      if (!error && userId) {
        await supabase.from('activities').insert([
          {
            user_id: userId,
            action: 'Nova Despesa',
            description: `Despesa registrada: ${tx.description} - R$ ${tx.amount.toLocaleString('pt-BR')}`,
          },
        ]);
      }
      return !error;
    }
  } catch (err) {
    console.warn('Erro ao persistir transação no Supabase:', err);
    return false;
  }
}

export async function persistSupabaseDeal(deal: DealItem): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    let leadStatus = 'LEAD';
    if (deal.stage === 'lead') leadStatus = 'LEAD';
    else if (deal.stage === 'discovery') leadStatus = 'CONTATO';
    else if (deal.stage === 'proposal') leadStatus = 'PROPOSTA';
    else if (deal.stage === 'negotiation') leadStatus = 'NEGOCIACAO';
    else if (deal.stage === 'won') leadStatus = 'FECHADO';
    else if (deal.stage === 'lost') leadStatus = 'PERDIDO';

    const { error } = await supabase.from('leads').insert([
      {
        name: deal.contactName || deal.companyName,
        company: deal.companyName,
        status: leadStatus,
        value: deal.totalEstimated,
      },
    ]);

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id || null;
    if (!error && userId) {
      await supabase.from('activities').insert([
        {
          user_id: userId,
          action: 'Novo Lead / Oportunidade',
          description: `Oportunidade adicionada: ${deal.companyName} (${leadStatus})`,
        },
      ]);
    }
    return !error;
  } catch (err) {
    console.warn('Erro ao persistir deal no Supabase:', err);
    return false;
  }
}

export async function persistSupabaseClient(client: ClientRecord): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('clients').insert([
      {
        name: client.contactName || client.companyName,
        company: client.companyName,
        email: client.email,
        phone: client.phone,
        status: client.status === 'active' ? 'active' : 'inactive',
      },
    ]);

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id || null;
    if (!error && userId) {
      await supabase.from('activities').insert([
        {
          user_id: userId,
          action: 'Novo Cliente',
          description: `Cliente cadastrado: ${client.companyName}`,
        },
      ]);
    }
    return !error;
  } catch (err) {
    console.warn('Erro ao persistir cliente no Supabase:', err);
    return false;
  }
}
