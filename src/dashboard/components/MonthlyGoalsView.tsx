import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Target,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Plus,
  Minus,
  Check,
  AlertCircle,
  RefreshCw,
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

interface MonthlyGoalRecord {
  id: string;
  month: string; // 'YYYY-MM-01'
  revenue_target: number;
  prospects_target: number;
  prospects_current: number;
  operator_id: string | null;
  created_at: string;
  updated_at: string;
}

export function MonthlyGoalsView() {
  // Estado do mês selecionado (sempre yyyy-mm-01)
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [goalsRecord, setGoalsRecord] = useState<MonthlyGoalRecord | null>(null);
  const [financeItems, setFinanceItems] = useState<VultoFinanceItem[]>([]);
  const [operators, setOperators] = useState<VultoOperator[]>([]);
  const [loading, setLoading] = useState(true);

  // Inputs locais editáveis
  const [revenueTargetInput, setRevenueTargetInput] = useState('5000');
  const [prospectsTargetInput, setProspectsTargetInput] = useState('300');
  const [isSavingTarget, setIsSavingTarget] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const monthKey = useMemo(() => {
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-01`;
  }, [selectedDate]);

  const monthFormattedLabel = useMemo(() => {
    return selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
  }, [selectedDate]);

  const prevMonthLabel = useMemo(() => {
    const d = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1);
    return d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).toUpperCase();
  }, [selectedDate]);

  const nextMonthLabel = useMemo(() => {
    const d = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1);
    return d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).toUpperCase();
  }, [selectedDate]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ops, finRes, goalRes] = await Promise.all([
        fetchVultoOperators(),
        fetchVultoFinance(),
        supabase.from('vulto_monthly_goals').select('*').eq('month', monthKey).maybeSingle(),
      ]);

      setOperators(ops);
      setFinanceItems(finRes.data);

      if (goalRes.data) {
        const rec = goalRes.data as MonthlyGoalRecord;
        setGoalsRecord(rec);
        setRevenueTargetInput(String(rec.revenue_target || 0));
        setProspectsTargetInput(String(rec.prospects_target || 0));
      } else {
        setGoalsRecord(null);
        setRevenueTargetInput('5000');
        setProspectsTargetInput('300');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [monthKey]);

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
      .channel('vulto_goals_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vulto_monthly_goals' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vulto_finance' }, () => {
        fetchVultoFinance().then((res) => setFinanceItems(res.data));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  // Realizado Real no Mês (entradas com settlement_status = liquidado)
  const realizedRevenue = useMemo(() => {
    const prefix = monthKey.slice(0, 7); // 'YYYY-MM'
    let total = 0;
    financeItems.forEach((item) => {
      if (item.created_at?.startsWith(prefix)) {
        if (item.entry_type === 'entrada' && (item.settlement_status === 'liquidado' || !item.settlement_status)) {
          total += Number(item.amount || 0);
        }
      }
    });
    return total;
  }, [financeItems, monthKey]);

  const targetRevenue = Number(revenueTargetInput) || 0;
  const missingRevenue = Math.max(0, targetRevenue - realizedRevenue);
  const revenueProgressPercent = targetRevenue > 0 ? Math.round((realizedRevenue / targetRevenue) * 100) : 0;

  // Prospecção
  const prospectsTarget = Number(prospectsTargetInput) || 0;
  const prospectsCurrent = goalsRecord ? Number(goalsRecord.prospects_current || 0) : 0;
  const prospectsProgressPercent = prospectsTarget > 0 ? Math.round((prospectsCurrent / prospectsTarget) * 100) : 0;

  // Salvar metas gerais (Revenue e Prospects Target)
  const handleSaveTargets = async (e: React.FormEvent) => {
    e.preventDefault();
    const op = getActiveOperatorSession();
    const revT = parseFloat(revenueTargetInput.replace(',', '.')) || 0;
    const prosT = parseInt(prospectsTargetInput, 10) || 0;

    const payload = {
      month: monthKey,
      revenue_target: revT,
      prospects_target: prosT,
      prospects_current: prospectsCurrent,
      operator_id: op?.id || null,
      updated_at: new Date().toISOString(),
    };

    try {
      if (goalsRecord) {
        const { error } = await supabase
          .from('vulto_monthly_goals')
          .update(payload)
          .eq('id', goalsRecord.id);

        if (error) {
          showToast('Erro ao atualizar metas: ' + error.message, 'error');
          return;
        }
      } else {
        const { data, error } = await supabase
          .from('vulto_monthly_goals')
          .insert([payload])
          .select()
          .single();

        if (error) {
          showToast('Erro ao criar metas: ' + error.message, 'error');
          return;
        }
        if (data) setGoalsRecord(data as MonthlyGoalRecord);
      }

      await logVultoAudit({
        action: goalsRecord ? 'monthly_goal_updated' : 'monthly_goal_created',
        entity_type: 'vulto_monthly_goals',
        details: `${op?.name || 'Operador'} atualizou metas para o mês ${monthKey}`,
      });

      showToast('Meta mensal atualizada.');
      loadData();
    } catch (err: any) {
      showToast('Falha ao salvar metas.', 'error');
    }
  };

  // Ajustar prospects_current (+1 / -1)
  const handleUpdateProspectsCurrent = async (delta: number) => {
    const op = getActiveOperatorSession();
    const nextCurrent = Math.max(0, prospectsCurrent + delta);

    try {
      if (goalsRecord) {
        const { error } = await supabase
          .from('vulto_monthly_goals')
          .update({
            prospects_current: nextCurrent,
            updated_at: new Date().toISOString(),
            operator_id: op?.id || null,
          })
          .eq('id', goalsRecord.id);

        if (error) {
          showToast('Erro ao atualizar prospecção.', 'error');
          return;
        }
      } else {
        // Criar registro automaticamente caso não exista
        const { data, error } = await supabase
          .from('vulto_monthly_goals')
          .insert([
            {
              month: monthKey,
              revenue_target: parseFloat(revenueTargetInput) || 5000,
              prospects_target: parseInt(prospectsTargetInput, 10) || 300,
              prospects_current: nextCurrent,
              operator_id: op?.id || null,
            },
          ])
          .select()
          .single();

        if (error) {
          showToast('Erro ao criar registro de meta.', 'error');
          return;
        }
        if (data) setGoalsRecord(data as MonthlyGoalRecord);
      }

      await logVultoAudit({
        action: 'prospect_count_updated',
        entity_type: 'vulto_monthly_goals',
        details: `${op?.name || 'Operador'} alterou prospecções para ${nextCurrent} (${monthKey})`,
      });

      setGoalsRecord((prev) => (prev ? { ...prev, prospects_current: nextCurrent } : null));
      showToast('Quantidade de prospectados atualizada.');
    } catch (err) {
      showToast('Falha ao atualizar prospecção.', 'error');
    }
  };

  const handlePrevMonth = () => {
    setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  return (
    <div className="space-y-6">
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

      {/* Header & Seletor de Mês */}
      <div className="bg-[#111111] border border-white/10 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono text-white">
            METAS MENSAIS
          </h1>
          <p className="text-xs text-white/50 font-sans mt-0.5">
            Acompanhamento de faturamento realizado (recebidos) e prospecção comercial.
          </p>
        </div>

        {/* Navegação de Mês */}
        <div className="flex items-center gap-2 bg-[#161616] border border-white/10 p-1 font-mono text-xs">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            title="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="px-3 font-bold text-[#C6FF00] tracking-wider uppercase">
            {monthFormattedLabel}
          </div>
          <button
            onClick={handleNextMonth}
            className="p-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            title="Próximo mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-[#111111] border border-white/10 p-12 text-center font-mono text-xs text-white/40">
          Carregando metas do mês...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* BLOCO 1: META DE FATURAMENTO */}
          <div className="bg-[#111111] border border-white/10 p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#C6FF00]" />
                <h2 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                  Meta de Faturamento
                </h2>
              </div>
              <span className="text-[10px] font-mono text-white/40 uppercase">
                Apenas Liquidado / Recebido
              </span>
            </div>

            {/* Inputs de Configuração da Meta */}
            <form onSubmit={handleSaveTargets} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-white/60 mb-1">Meta do Mês (R$)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={revenueTargetInput}
                    onChange={(e) => setRevenueTargetInput(e.target.value)}
                    className="flex-1 bg-[#161616] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-bold tracking-wider cursor-pointer transition-colors"
                  >
                    Salvar Meta
                  </button>
                </div>
              </div>
            </form>

            {/* Métricas de Faturamento */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="bg-[#161616] border border-white/5 p-3 space-y-1">
                <div className="text-[10px] font-mono text-white/40 uppercase">Meta</div>
                <div className="text-sm font-bold font-mono text-white">
                  R$ {targetRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="bg-[#161616] border border-white/5 p-3 space-y-1">
                <div className="text-[10px] font-mono text-white/40 uppercase">Realizado</div>
                <div className="text-sm font-bold font-mono text-emerald-400">
                  R$ {realizedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="bg-[#161616] border border-white/5 p-3 space-y-1">
                <div className="text-[10px] font-mono text-white/40 uppercase">Falta</div>
                <div className="text-sm font-bold font-mono text-amber-400">
                  R$ {missingRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Barra de Progresso Faturamento */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-white/60">Progresso do Faturamento</span>
                <span className="font-bold text-[#C6FF00]">{revenueProgressPercent}%</span>
              </div>
              <div className="h-3 w-full bg-[#161616] border border-white/10 overflow-hidden">
                <div
                  style={{ width: `${Math.min(100, revenueProgressPercent)}%` }}
                  className="h-full bg-[#C6FF00] transition-all duration-300"
                />
              </div>
            </div>
          </div>

          {/* BLOCO 2: META DE PROSPECÇÃO */}
          <div className="bg-[#111111] border border-white/10 p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#C6FF00]" />
                <h2 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                  Meta de Prospecção
                </h2>
              </div>
              <span className="text-[10px] font-mono text-white/40 uppercase">
                Controle Comercial
              </span>
            </div>

            <form onSubmit={handleSaveTargets} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-white/60 mb-1">Meta de Prospects</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    required
                    value={prospectsTargetInput}
                    onChange={(e) => setProspectsTargetInput(e.target.value)}
                    className="flex-1 bg-[#161616] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-bold tracking-wider cursor-pointer transition-colors"
                  >
                    Salvar Meta
                  </button>
                </div>
              </div>
            </form>

            {/* Contador de Prospecção & Controles Rápidos */}
            <div className="bg-[#161616] border border-white/5 p-4 flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-[10px] font-mono text-white/40 uppercase">Prospectados / Meta</div>
                <div className="text-2xl font-bold font-mono text-white">
                  {prospectsCurrent} <span className="text-white/30 text-lg">/ {prospectsTarget}</span>
                </div>
                <div className="text-xs font-mono text-[#C6FF00]">
                  {prospectsProgressPercent}% alcançado
                </div>
              </div>

              {/* Controles +1 / -1 */}
              <div className="flex items-center gap-2 font-mono">
                <button
                  type="button"
                  onClick={() => handleUpdateProspectsCurrent(-1)}
                  className="w-10 h-10 bg-[#1C1C1C] hover:bg-[#252525] border border-white/10 text-white font-bold flex items-center justify-center transition-colors cursor-pointer text-base"
                  title="Decrementar 1"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateProspectsCurrent(1)}
                  className="w-10 h-10 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-bold flex items-center justify-center transition-colors cursor-pointer text-base shadow-sm"
                  title="Incrementar 1"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Barra de Progresso Prospecção */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-white/60">Progresso da Prospecção</span>
                <span className="font-bold text-[#C6FF00]">{prospectsProgressPercent}%</span>
              </div>
              <div className="h-3 w-full bg-[#161616] border border-white/10 overflow-hidden">
                <div
                  style={{ width: `${Math.min(100, prospectsProgressPercent)}%` }}
                  className="h-full bg-[#C6FF00] transition-all duration-300"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
