import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  CheckSquare,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Layers,
  RefreshCw,
  Clock,
} from 'lucide-react';
import {
  VultoFinanceItem,
  VultoMonthlyExpenseItem,
  VultoClientItem,
  VultoTaskItem,
  fetchVultoFinance,
  fetchVultoMonthlyExpenses,
  fetchVultoClients,
  fetchVultoTasks,
} from '../../services/vultoCoreService';
import { supabase } from '../../lib/supabase';
import { VultoTab } from './DashboardSidebar';

interface OverviewViewProps {
  onNavigateTab: (tab: VultoTab) => void;
}

export function OverviewView({ onNavigateTab }: OverviewViewProps) {
  const [financeItems, setFinanceItems] = useState<VultoFinanceItem[]>([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState<VultoMonthlyExpenseItem[]>([]);
  const [clients, setClients] = useState<VultoClientItem[]>([]);
  const [tasks, setTasks] = useState<VultoTaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [finRes, expRes, cliRes, tskRes] = await Promise.all([
        fetchVultoFinance(),
        fetchVultoMonthlyExpenses(),
        fetchVultoClients(),
        fetchVultoTasks(),
      ]);

      setFinanceItems(finRes.data);
      setMonthlyExpenses(expRes.data);
      setClients(cliRes.data);
      setTasks(tskRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Listener para evento central de refresh
  useEffect(() => {
    const handleGlobalRefresh = () => {
      loadAllData();
    };
    window.addEventListener('vulto:refresh', handleGlobalRefresh);
    return () => window.removeEventListener('vulto:refresh', handleGlobalRefresh);
  }, [loadAllData]);

  // Supabase Realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('vulto_overview_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vulto_finance' }, () => {
        fetchVultoFinance().then((res) => setFinanceItems(res.data));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vulto_monthly_expenses' }, () => {
        fetchVultoMonthlyExpenses().then((res) => setMonthlyExpenses(res.data));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vulto_clients' }, () => {
        fetchVultoClients().then((res) => setClients(res.data));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vulto_tasks' }, () => {
        fetchVultoTasks().then((res) => setTasks(res.data));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Cálculos do mês atual e Contas a Receber
  const { monthEntradas, monthSaidas, monthSaldo, fixedExpensesTotal, pendingTasksCount, receivablesTotal, receivablesCount } = useMemo(() => {
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let entradas = 0;
    let saidas = 0;
    let recTotal = 0;
    let recCount = 0;

    financeItems.forEach((item) => {
      const isPend = item.entry_type === 'entrada' && item.settlement_status === 'pendente';
      if (isPend) {
        recTotal += Number(item.amount || 0);
        recCount += 1;
      }

      if (item.created_at?.startsWith(currentMonthPrefix)) {
        if (item.entry_type === 'entrada' && (!item.settlement_status || item.settlement_status === 'liquidado')) {
          entradas += Number(item.amount || 0);
        } else if (item.entry_type === 'saida') {
          saidas += Number(item.amount || 0);
        }
      }
    });

    const fixedTotal = monthlyExpenses
      .filter((e) => e.active)
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    const pendingTasks = tasks.filter((t) => !t.completed).length;

    return {
      monthEntradas: entradas,
      monthSaidas: saidas,
      monthSaldo: entradas - saidas,
      fixedExpensesTotal: fixedTotal,
      pendingTasksCount: pendingTasks,
      receivablesTotal: recTotal,
      receivablesCount: recCount,
    };
  }, [financeItems, monthlyExpenses, tasks]);

  // Movimentações recentes
  const recentMovements = useMemo(() => {
    return financeItems.slice(0, 6);
  }, [financeItems]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-[#111111] border border-white/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono text-white">
            VISÃO GERAL
          </h1>
          <p className="text-xs text-white/50 font-sans mt-0.5">
            Acompanhamento central de fluxo, contas a receber, despesas e entregas operacionais.
          </p>
        </div>
      </div>

      {/* Cards de Métricas Principais (7 cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* ENTRADAS DO MÊS */}
        <div className="bg-[#111111] border border-white/10 p-4 space-y-1">
          <div className="text-[10px] font-mono text-white/40 uppercase">Entradas do Mês</div>
          <div className="text-base sm:text-lg font-bold font-mono text-emerald-400">
            R$ {monthEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] font-mono text-white/35">Mês corrente (realizado)</div>
        </div>

        {/* CONTAS A RECEBER */}
        <div
          onClick={() => onNavigateTab('finance')}
          className="bg-[#111111] border border-white/10 hover:border-white/20 p-4 space-y-1 cursor-pointer transition-colors"
        >
          <div className="text-[10px] font-mono text-white/40 uppercase">Contas a Receber</div>
          <div className="text-base sm:text-lg font-bold font-mono text-amber-400">
            R$ {receivablesTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] font-mono text-amber-400/90 flex items-center gap-1">
            <span>{receivablesCount} {receivablesCount === 1 ? 'recebimento' : 'recebimentos'}</span>
            <ArrowUpRight className="w-3 h-3" />
          </div>
        </div>

        {/* SAÍDAS DO MÊS */}
        <div className="bg-[#111111] border border-white/10 p-4 space-y-1">
          <div className="text-[10px] font-mono text-white/40 uppercase">Saídas do Mês</div>
          <div className="text-base sm:text-lg font-bold font-mono text-rose-400">
            R$ {monthSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] font-mono text-white/35">Realizadas</div>
        </div>

        {/* SALDO DO MÊS */}
        <div className="bg-[#111111] border border-white/10 p-4 space-y-1">
          <div className="text-[10px] font-mono text-white/40 uppercase">Saldo do Mês</div>
          <div className={`text-base sm:text-lg font-bold font-mono ${monthSaldo >= 0 ? 'text-[#C6FF00]' : 'text-rose-400'}`}>
            R$ {monthSaldo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] font-mono text-white/35">Entradas - Saídas</div>
        </div>

        {/* GASTOS MENSAIS FIXOS */}
        <div className="bg-[#111111] border border-white/10 p-4 space-y-1">
          <div className="text-[10px] font-mono text-white/40 uppercase">Gastos Mensais Fixos</div>
          <div className="text-base sm:text-lg font-bold font-mono text-white">
            R$ {fixedExpensesTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] font-mono text-white/35">Ativos cadastrados</div>
        </div>

        {/* CLIENTES */}
        <div
          onClick={() => onNavigateTab('clients')}
          className="bg-[#111111] border border-white/10 hover:border-white/20 p-4 space-y-1 cursor-pointer transition-colors"
        >
          <div className="text-[10px] font-mono text-white/40 uppercase">Clientes</div>
          <div className="text-base sm:text-lg font-bold font-mono text-white">
            {clients.length}
          </div>
          <div className="text-[10px] font-mono text-[#C6FF00] flex items-center gap-1">
            <span>Ver clientes</span>
            <ArrowUpRight className="w-3 h-3" />
          </div>
        </div>

        {/* TAREFAS PENDENTES */}
        <div
          onClick={() => onNavigateTab('projects_services')}
          className="bg-[#111111] border border-white/10 hover:border-white/20 p-4 space-y-1 cursor-pointer transition-colors"
        >
          <div className="text-[10px] font-mono text-white/40 uppercase">Tarefas Pendentes</div>
          <div className="text-base sm:text-lg font-bold font-mono text-white">
            {pendingTasksCount}
          </div>
          <div className="text-[10px] font-mono text-[#C6FF00] flex items-center gap-1">
            <span>Ver checklist</span>
            <ArrowUpRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* MOVIMENTAÇÕES RECENTES */}
      <div className="bg-[#111111] border border-white/10 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="font-mono text-sm font-bold text-white tracking-wider">
            MOVIMENTAÇÕES RECENTES
          </h2>
          <button
            onClick={() => onNavigateTab('finance')}
            className="text-xs font-mono text-[#C6FF00] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Acessar Financeiro</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center font-mono text-xs text-white/40">
            Carregando movimentações...
          </div>
        ) : recentMovements.length === 0 ? (
          <div className="p-8 text-center font-mono text-xs text-white/40">
            Nenhuma movimentação registrada até o momento.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {recentMovements.map((item) => {
              const isPend = item.entry_type === 'entrada' && item.settlement_status === 'pendente';
              return (
                <div
                  key={item.id}
                  className="py-3 flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 flex items-center justify-center border ${
                        item.entry_type === 'entrada'
                          ? isPend
                            ? 'border-amber-500/30 text-amber-400 bg-amber-950/20'
                            : 'border-emerald-500/30 text-emerald-400 bg-emerald-950/20'
                          : 'border-rose-500/30 text-rose-400 bg-rose-950/20'
                      }`}
                    >
                      {item.entry_type === 'entrada' ? (
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{item.title}</span>
                        {isPend && (
                          <span className="px-1.5 py-0.2 bg-amber-950/50 text-amber-300 border border-amber-500/30 text-[9px]">
                            A receber
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <div className="text-[11px] text-white/50">{item.description}</div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`font-bold ${
                        item.entry_type === 'entrada'
                          ? isPend
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {item.entry_type === 'entrada' ? '+' : '-'} R${' '}
                      {Number(item.amount).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <div className="text-[10px] text-white/35">
                      {new Date(item.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
