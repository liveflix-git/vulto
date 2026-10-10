import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Check,
  Calendar,
  User,
} from 'lucide-react';
import {
  VultoFinanceItem,
  VultoOperator,
  fetchVultoFinance,
  fetchVultoOperators,
  getActiveOperatorSession,
  logVultoAudit,
} from '../../services/vultoCoreService';
import { supabase } from '../../lib/supabase';

export function ReceivablesView() {
  const [receivables, setReceivables] = useState<VultoFinanceItem[]>([]);
  const [operators, setOperators] = useState<VultoOperator[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ops, finRes] = await Promise.all([
        fetchVultoOperators(),
        fetchVultoFinance(),
      ]);
      setOperators(ops);
      // Filtrar apenas entrada E pendente
      const pending = finRes.data.filter(
        (item) => item.entry_type === 'entrada' && item.settlement_status === 'pendente'
      );
      setReceivables(pending);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listener global refresh
  useEffect(() => {
    const handleGlobalRefresh = () => {
      loadData();
    };
    window.addEventListener('vulto:refresh', handleGlobalRefresh);
    return () => window.removeEventListener('vulto:refresh', handleGlobalRefresh);
  }, [loadData]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('vulto_receivables_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vulto_finance' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  const getOperatorName = (operatorId: string | null) => {
    if (!operatorId) return 'Operador';
    const match = operators.find((op) => op.id === operatorId);
    return match ? match.name : 'Operador';
  };

  // Marcar como recebido
  const handleMarkAsReceived = async (item: VultoFinanceItem) => {
    setIsUpdatingId(item.id);
    const op = getActiveOperatorSession();

    try {
      const { error } = await supabase
        .from('vulto_finance')
        .update({
          settlement_status: 'liquidado',
          updated_at: new Date().toISOString(),
          operator_id: op?.id || null,
        })
        .eq('id', item.id);

      if (error) {
        showToast('Erro ao atualizar pagamento: ' + error.message, 'error');
        console.error('Erro Supabase mark received:', error);
      } else {
        await logVultoAudit({
          action: 'finance_marked_received',
          entity_type: 'vulto_finance',
          entity_id: item.id,
          details: `${op?.name || 'Operador'} marcou a conta a receber "${item.title}" (R$ ${item.amount}) como recebida.`,
        });

        setReceivables((prev) => prev.filter((i) => i.id !== item.id));
        showToast('Pagamento marcado como recebido.');
        // Disparar refresh global para atualizar Visão Geral e Financeiro/Movimentações
        window.dispatchEvent(new CustomEvent('vulto:refresh'));
      }
    } catch (err: any) {
      showToast('Falha ao atualizar pagamento.', 'error');
      console.error(err);
    } finally {
      setIsUpdatingId(null);
    }
  };

  const totalAmount = receivables.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  return (
    <div className="space-y-4">
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 border font-mono text-xs flex items-center gap-2 shadow-2xl transition-all ${
            toastMessage.type === 'success'
              ? 'bg-[#121212] border-[#C6FF00] text-[#C6FF00]'
              : 'bg-rose-950/90 border-rose-500 text-rose-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <Check className="w-4 h-4 stroke-[2.5]" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span className="font-bold tracking-wider">{toastMessage.text}</span>
        </div>
      )}

      {/* Resumo no Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="bg-[#141414] border border-white/10 px-4 py-2.5 flex items-center gap-4 font-mono text-xs">
          <div>
            <span className="text-white/40 uppercase text-[10px] block">TOTAL A RECEBER:</span>
            <span className="text-base font-bold text-[#C6FF00]">
              R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="border-l border-white/10 pl-4">
            <span className="text-white/40 uppercase text-[10px] block">QUANTIDADE:</span>
            <span className="text-base font-bold text-white">{receivables.length} pendentes</span>
          </div>
        </div>

        <span className="text-xs font-mono text-white/50">
          Entradas pendentes de liquidação
        </span>
      </div>

      <div className="bg-[#111111] border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 bg-[#0E0E0E] text-white/50 text-[10px] uppercase">
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Título</th>
                <th className="py-3 px-4">Descrição</th>
                <th className="py-3 px-4">Operador</th>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4 text-right">Valor</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-white/40">
                    Carregando contas a receber...
                  </td>
                </tr>
              ) : receivables.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-white/40">
                    Nenhuma conta a receber pendente no momento.
                  </td>
                </tr>
              ) : (
                receivables.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-amber-950/40 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase">
                        A receber
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-white">{item.title}</td>
                    <td className="py-3 px-4 text-white/60">
                      {item.description || <span className="text-white/20">-</span>}
                    </td>
                    <td className="py-3 px-4 text-white/80">
                      {getOperatorName(item.operator_id)}
                    </td>
                    <td className="py-3 px-4 text-white/50">
                      {new Date(item.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400">
                      + R${' '}
                      {Number(item.amount).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleMarkAsReceived(item)}
                        disabled={isUpdatingId === item.id}
                        className="px-3 py-1.5 bg-[#C6FF00] hover:bg-[#b0e600] disabled:opacity-40 text-[#0A0A0A] font-bold text-[11px] tracking-wider transition-colors cursor-pointer inline-flex items-center gap-1 shadow-sm"
                        title="Marcar como recebido"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>{isUpdatingId === item.id ? 'Marcando...' : 'Marcar como recebido'}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
