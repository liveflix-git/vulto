import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TrendingUp,
  Target,
  Calendar,
  DollarSign,
  Layers,
  Sparkles,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  BarChart2,
  Calculator,
  History,
  Info,
  Clock,
  Briefcase,
  ChevronRight,
  ShieldCheck,
  Check,
  Percent,
} from 'lucide-react';
import {
  fetchGoalsModuleData,
  saveMonthlyGoal,
  saveDailyGoal,
  calculateAndSetDailyGoalAutomatically,
  upsertServiceTarget,
  deleteServiceTarget,
  GoalsModuleData,
  GoalServiceTarget,
  ServicePerformanceComparison,
} from '../../services/goalsService';
import { formatCurrencyBRL } from '../../services/dashboardService';

export function GoalsViewReal() {
  const [data, setData] = useState<GoalsModuleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals state
  const [isMonthlyModalOpen, setIsMonthlyModalOpen] = useState(false);
  const [isDailyModalOpen, setIsDailyModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isAutoCalculating, setIsAutoCalculating] = useState(false);

  // Monthly Goal Form State
  const [monthTargetInput, setMonthTargetInput] = useState<string>('50000');
  const [monthTitleInput, setMonthTitleInput] = useState<string>('Meta Comercial Mensal');
  const [monthStartDateInput, setMonthStartDateInput] = useState<string>('');
  const [monthEndDateInput, setMonthEndDateInput] = useState<string>('');
  const [monthNotesInput, setMonthNotesInput] = useState<string>('');

  // Daily Goal Form State
  const [dailyTargetInput, setDailyTargetInput] = useState<string>('2000');
  const [dailyDateInput, setDailyDateInput] = useState<string>('');
  const [dailyNotesInput, setDailyNotesInput] = useState<string>('');

  // Service Target Form State
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [serviceNameInput, setServiceNameInput] = useState<string>('');
  const [targetQuantityInput, setTargetQuantityInput] = useState<string>('5');
  const [unitPriceInput, setUnitPriceInput] = useState<string>('3000');
  const [serviceNotesInput, setServiceNotesInput] = useState<string>('');
  const [editingTargetId, setEditingTargetId] = useState<string | null>(null);

  // Sub-tabs for the Metas view
  const [activeTab, setActiveTab] = useState<'geral' | 'servicos' | 'projecao' | 'historico'>('geral');

  const loadData = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await fetchGoalsModuleData();
      setData(res);

      // Pre-fill inputs when loaded
      if (res.monthlyGoal) {
        setMonthTargetInput(String(res.monthlyGoal.target_amount));
        setMonthTitleInput(res.monthlyGoal.title || 'Meta Comercial Mensal');
        setMonthStartDateInput(res.monthlyGoal.start_date);
        setMonthEndDateInput(res.monthlyGoal.end_date);
        setMonthNotesInput(res.monthlyGoal.notes || '');
      } else {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
        setMonthStartDateInput(`${year}-${month}-01`);
        setMonthEndDateInput(`${year}-${month}-${String(lastDay).padStart(2, '0')}`);
      }

      if (res.dailyGoal) {
        setDailyTargetInput(String(res.dailyGoal.target_amount));
        setDailyDateInput(res.dailyGoal.start_date);
        setDailyNotesInput(res.dailyGoal.notes || '');
      } else {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        setDailyDateInput(`${year}-${month}-${day}`);
      }
    } catch (err: any) {
      console.error('Erro ao carregar módulo de metas:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Auto calculate daily goal action
  const handleAutoCalculateDaily = async () => {
    setIsAutoCalculating(true);
    try {
      const result = await calculateAndSetDailyGoalAutomatically();
      showNotification('success', `Meta diária recalculada para R$ ${result.toLocaleString('pt-BR')}!`);
      await loadData(true);
    } catch (err: any) {
      showNotification('error', err.message || 'Erro ao calcular meta diária.');
    } finally {
      setIsAutoCalculating(false);
    }
  };

  // Save monthly goal
  const handleSaveMonthlyGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(monthTargetInput);
    if (isNaN(val) || val <= 0) {
      showNotification('error', 'Informe um valor válido para a meta mensal.');
      return;
    }

    try {
      await saveMonthlyGoal({
        id: data?.monthlyGoal?.id,
        target_amount: val,
        start_date: monthStartDateInput,
        end_date: monthEndDateInput,
        title: monthTitleInput,
        notes: monthNotesInput,
      });
      showNotification('success', 'Meta mensal atualizada com sucesso!');
      setIsMonthlyModalOpen(false);
      await loadData(true);
    } catch (err: any) {
      showNotification('error', err.message || 'Erro ao salvar meta mensal.');
    }
  };

  // Save daily goal
  const handleSaveDailyGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(dailyTargetInput);
    if (isNaN(val) || val < 0) {
      showNotification('error', 'Informe um valor válido para a meta diária.');
      return;
    }

    try {
      await saveDailyGoal({
        id: data?.dailyGoal?.id,
        target_amount: val,
        date: dailyDateInput,
        notes: dailyNotesInput,
      });
      showNotification('success', 'Meta diária salva com sucesso!');
      setIsDailyModalOpen(false);
      await loadData(true);
    } catch (err: any) {
      showNotification('error', err.message || 'Erro ao salvar meta diária.');
    }
  };

  // Handle service selection change in modal
  const handleSelectServiceChange = (srvId: string) => {
    setSelectedServiceId(srvId);
    if (srvId === 'custom') {
      setServiceNameInput('');
      setUnitPriceInput('1000');
    } else {
      const found = data?.availableServices.find((s) => s.id === srvId);
      if (found) {
        setServiceNameInput(found.name);
        setUnitPriceInput(String(found.price || 1000));
      }
    }
  };

  // Open Service Modal for creating or editing
  const handleOpenServiceModal = (item?: GoalServiceTarget) => {
    if (item) {
      setEditingTargetId(item.id);
      setSelectedServiceId(item.service_id || 'custom');
      setServiceNameInput(item.service_name);
      setTargetQuantityInput(String(item.target_quantity));
      setUnitPriceInput(String(item.unit_price));
      setServiceNotesInput(item.notes || '');
    } else {
      setEditingTargetId(null);
      if (data?.availableServices && data.availableServices.length > 0) {
        const first = data.availableServices[0];
        setSelectedServiceId(first.id);
        setServiceNameInput(first.name);
        setUnitPriceInput(String(first.price || 2500));
      } else {
        setSelectedServiceId('custom');
        setServiceNameInput('');
        setUnitPriceInput('3000');
      }
      setTargetQuantityInput('5');
      setServiceNotesInput('');
    }
    setIsServiceModalOpen(true);
  };

  // Save Service Target
  const handleSaveServiceTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.monthlyGoal?.id) {
      showNotification('error', 'Crie ou configure uma meta mensal primeiro.');
      return;
    }

    const qty = parseInt(targetQuantityInput, 10);
    const price = parseFloat(unitPriceInput);

    if (isNaN(qty) || qty <= 0 || isNaN(price) || price <= 0 || !serviceNameInput.trim()) {
      showNotification('error', 'Preencha os campos de serviço, quantidade e preço corretamente.');
      return;
    }

    try {
      await upsertServiceTarget({
        id: editingTargetId || undefined,
        goal_id: data.monthlyGoal.id,
        service_id: selectedServiceId !== 'custom' ? selectedServiceId : null,
        service_name: serviceNameInput.trim(),
        target_quantity: qty,
        unit_price: price,
        notes: serviceNotesInput.trim() || undefined,
      });

      showNotification('success', 'Planejamento do serviço salvo com sucesso!');
      setIsServiceModalOpen(false);
      await loadData(true);
    } catch (err: any) {
      showNotification('error', err.message || 'Erro ao salvar meta do serviço.');
    }
  };

  // Delete service target
  const handleDeleteServiceTarget = async (id: string, name: string) => {
    if (!confirm(`Remover planejamento para "${name}"?`)) return;
    try {
      await deleteServiceTarget(id);
      showNotification('success', `Planejamento de ${name} removido.`);
      await loadData(true);
    } catch (err: any) {
      showNotification('error', err.message || 'Erro ao remover meta do serviço.');
    }
  };

  const calcs = data?.calculations;
  const isGoalFinished = (calcs?.percentage || 0) >= 100;

  // Total planned in service targets
  const totalPlannedInServices = useMemo(() => {
    return (data?.serviceTargets || []).reduce((acc, st) => {
      return acc + (Number(st.total_expected) || st.target_quantity * st.unit_price);
    }, 0);
  }, [data?.serviceTargets]);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 border font-mono text-xs shadow-xl animate-in fade-in slide-in-from-top-2 duration-200 ${
            notification.type === 'success'
              ? 'bg-[#121A0F] border-emerald-500/50 text-emerald-300'
              : 'bg-[#1C1212] border-rose-500/50 text-rose-300'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-[#111111] border border-white/10 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-widest text-[#C6FF00] uppercase">
              // GESTÃO ESTRATÉGICA & VENDAS
            </span>
            <span className="text-white/20">•</span>
            <span className="text-[10px] font-mono text-white/50">
              SUPABASE LIVE DATA
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight flex items-center gap-2.5">
            <Target className="w-6 h-6 text-[#C6FF00]" />
            Metas & Plano Comercial
          </h1>
          <p className="text-xs text-white/60 font-sans mt-0.5">
            Transforme objetivos financeiros em plano de ação comercial com acompanhamento diário e por serviço.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="px-3 py-2 bg-[#181818] hover:bg-[#222222] border border-white/10 text-white/80 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Atualizar dados do Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#C6FF00]' : ''}`} />
            Sincronizar
          </button>

          <button
            onClick={handleAutoCalculateDaily}
            disabled={isAutoCalculating || !data?.monthlyGoal}
            className="px-3 py-2 bg-[#1a2212] hover:bg-[#243318] border border-[#C6FF00]/30 text-[#C6FF00] text-xs font-mono flex items-center gap-1.5 transition-colors disabled:opacity-40"
            title="Calcula: Restante / Dias Restantes"
          >
            <Calculator className={`w-3.5 h-3.5 ${isAutoCalculating ? 'animate-spin' : ''}`} />
            Calcular Diária Auto
          </button>

          <button
            onClick={() => setIsDailyModalOpen(true)}
            className="px-3 py-2 bg-[#181818] hover:bg-[#222] border border-white/20 text-white text-xs font-mono flex items-center gap-1.5 transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Meta do Dia
          </button>

          <button
            onClick={() => setIsMonthlyModalOpen(true)}
            className="px-4 py-2 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-bold text-xs font-mono flex items-center gap-1.5 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5 text-[#0A0A0A]" />
            Definir Meta Mês
          </button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-white/10 overflow-x-auto pb-px">
        {[
          { id: 'geral', label: 'Visão Geral & Mês', icon: LayoutDashboardIcon },
          { id: 'servicos', label: 'Planejamento por Serviço', icon: Layers },
          { id: 'projecao', label: 'Projeção & Ritmo', icon: TrendingUp },
          { id: 'historico', label: 'Histórico de Metas', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 text-xs font-mono font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-[#C6FF00] text-[#C6FF00] bg-white/[0.02]'
                  : 'border-transparent text-white/50 hover:text-white/80 hover:border-white/20'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="bg-[#111111] border border-white/10 p-12 text-center">
          <RefreshCw className="w-6 h-6 animate-spin text-[#C6FF00] mx-auto mb-3" />
          <div className="text-xs font-mono text-white/60">
            Carregando indicadores do Supabase...
          </div>
        </div>
      ) : (
        <>
          {/* TAB 1: VISÃO GERAL */}
          {activeTab === 'geral' && (
            <div className="space-y-6">
              {/* Top Monthly Goal Banner */}
              <div className="bg-[#111111] border border-white/10 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                  <Target className="w-48 h-48 text-white" />
                </div>

                <div className="relative z-10">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-[#181818] border border-white/10 text-[#C6FF00] uppercase">
                          {data?.monthlyGoal?.title || 'Meta do Mês'}
                        </span>
                        <span className="text-xs font-mono text-white/40">
                          {data?.monthlyGoal?.start_date} até {data?.monthlyGoal?.end_date}
                        </span>
                      </div>
                      <div className="text-2xl sm:text-3xl font-mono font-bold text-white mt-1">
                        {formatCurrencyBRL(calcs?.realizedAmount || 0)}
                        <span className="text-white/40 text-sm sm:text-base font-normal ml-2">
                          / {formatCurrencyBRL(calcs?.targetAmount || 0)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-[10px] font-mono text-white/40 uppercase">Atingimento</div>
                        <div
                          className={`text-2xl font-mono font-bold ${
                            isGoalFinished ? 'text-emerald-400' : 'text-[#C6FF00]'
                          }`}
                        >
                          {(calcs?.percentage || 0).toFixed(1)}%
                        </div>
                      </div>

                      <div className="w-px h-10 bg-white/10" />

                      <div className="text-right">
                        <div className="text-[10px] font-mono text-white/40 uppercase">Dias Restantes</div>
                        <div className="text-2xl font-mono font-bold text-white">
                          {calcs?.daysRemaining || 0}{' '}
                          <span className="text-xs text-white/40 font-normal">dias</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 mb-6">
                    <div className="h-3 w-full bg-[#181818] border border-white/5 overflow-hidden rounded-xs">
                      <div
                        style={{ width: `${Math.min(100, calcs?.percentage || 0)}%` }}
                        className={`h-full transition-all duration-700 ${
                          isGoalFinished ? 'bg-emerald-400' : 'bg-[#C6FF00]'
                        }`}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-mono text-white/50">
                      <span>0%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span className={isGoalFinished ? 'text-emerald-400 font-bold' : ''}>100% Meta</span>
                    </div>
                  </div>

                  {/* 6 Grid Metrics of Monthly Goal */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 border-t border-white/10">
                    <div className="bg-[#161616] border border-white/5 p-3">
                      <div className="text-[10px] font-mono text-white/40 uppercase">Meta</div>
                      <div className="text-sm sm:text-base font-mono font-bold text-white mt-1">
                        {formatCurrencyBRL(calcs?.targetAmount || 0)}
                      </div>
                    </div>

                    <div className="bg-[#161616] border border-white/5 p-3">
                      <div className="text-[10px] font-mono text-white/40 uppercase">Realizado</div>
                      <div className="text-sm sm:text-base font-mono font-bold text-emerald-400 mt-1">
                        {formatCurrencyBRL(calcs?.realizedAmount || 0)}
                      </div>
                    </div>

                    <div className="bg-[#161616] border border-white/5 p-3">
                      <div className="text-[10px] font-mono text-white/40 uppercase">Restante</div>
                      <div className="text-sm sm:text-base font-mono font-bold text-amber-400 mt-1">
                        {formatCurrencyBRL(calcs?.remainingAmount || 0)}
                      </div>
                    </div>

                    <div className="bg-[#161616] border border-white/5 p-3">
                      <div className="text-[10px] font-mono text-white/40 uppercase">Percentual</div>
                      <div className="text-sm sm:text-base font-mono font-bold text-[#C6FF00] mt-1">
                        {(calcs?.percentage || 0).toFixed(1)}%
                      </div>
                    </div>

                    <div className="bg-[#161616] border border-white/5 p-3">
                      <div className="text-[10px] font-mono text-white/40 uppercase">Dias Restantes</div>
                      <div className="text-sm sm:text-base font-mono font-bold text-white mt-1">
                        {calcs?.daysRemaining || 0} dias
                      </div>
                    </div>

                    <div className="bg-[#161616] border border-[#C6FF00]/20 p-3">
                      <div className="text-[10px] font-mono text-[#C6FF00] uppercase font-bold">
                        Média Diária Nec.
                      </div>
                      <div className="text-sm sm:text-base font-mono font-bold text-[#C6FF00] mt-1">
                        {formatCurrencyBRL(calcs?.dailyRequired || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Today's Goal Focus Card */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#111111] border border-white/10 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span className="text-[10px] font-mono tracking-widest text-white/50 uppercase">
                          // META DO DIA (HOJE)
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-white/40">
                        {data?.dailyGoal?.start_date || 'Data Atual'}
                      </span>
                    </div>

                    <h3 className="text-base font-mono font-bold text-white mb-1">
                      Operação do Dia
                    </h3>
                    <p className="text-xs text-white/60 font-sans mb-4">
                      Defina o alvo financeiro do dia manualmente ou calcule automaticamente com base no restante do mês.
                    </p>

                    <div className="bg-[#161616] border border-white/5 p-4 rounded-xs mb-4">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <div className="text-[10px] font-mono text-white/40 uppercase">Alvo de Hoje</div>
                          <div className="text-xl font-mono font-bold text-white mt-0.5">
                            {formatCurrencyBRL(data?.dailyGoal?.target_amount || 0)}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] font-mono text-white/40 uppercase">Média Ideal Calculada</div>
                          <div className="text-base font-mono font-bold text-[#C6FF00] mt-0.5">
                            {formatCurrencyBRL(calcs?.dailyRequired || 0)}
                          </div>
                        </div>
                      </div>

                      {data?.dailyGoal?.notes && (
                        <div className="mt-2.5 pt-2 border-t border-white/5 text-[11px] font-mono text-white/50">
                          Obs: {data.dailyGoal.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={handleAutoCalculateDaily}
                      disabled={isAutoCalculating}
                      className="flex-1 py-2 bg-[#1a2212] hover:bg-[#243318] border border-[#C6FF00]/30 text-[#C6FF00] font-mono text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Calculator className="w-3.5 h-3.5" />
                      Calcular Automaticamente
                    </button>
                    <button
                      onClick={() => setIsDailyModalOpen(true)}
                      className="px-3 py-2 bg-[#181818] hover:bg-[#222222] border border-white/10 text-white font-mono text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-white/60" />
                      Editar
                    </button>
                  </div>
                </div>

                {/* Planning Breakdown Summary */}
                <div className="bg-[#111111] border border-white/10 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[#C6FF00]" />
                        <span className="text-[10px] font-mono tracking-widest text-white/50 uppercase">
                          // RESUMO POR SERVIÇO
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#C6FF00]">
                        {data?.serviceTargets.length || 0} SERVIÇOS PLANEJADOS
                      </span>
                    </div>

                    <h3 className="text-base font-mono font-bold text-white mb-1">
                      Composição da Meta
                    </h3>
                    <p className="text-xs text-white/60 font-sans mb-4">
                      Soma dos serviços previstos vs meta total do mês.
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center text-xs font-mono py-1.5 border-b border-white/5">
                        <span className="text-white/60">Total Planejado em Serviços:</span>
                        <span className="text-white font-bold">{formatCurrencyBRL(totalPlannedInServices)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-mono py-1.5 border-b border-white/5">
                        <span className="text-white/60">Meta Financeira Geral:</span>
                        <span className="text-white font-bold">{formatCurrencyBRL(calcs?.targetAmount || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-mono py-1.5">
                        <span className="text-white/60">Alinhamento do Plano:</span>
                        <span
                          className={`font-bold ${
                            totalPlannedInServices >= (calcs?.targetAmount || 0)
                              ? 'text-emerald-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {totalPlannedInServices >= (calcs?.targetAmount || 0)
                            ? `+ ${formatCurrencyBRL(totalPlannedInServices - (calcs?.targetAmount || 0))} de folga`
                            : `- ${formatCurrencyBRL((calcs?.targetAmount || 0) - totalPlannedInServices)} a planejar`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('servicos')}
                    className="w-full py-2 bg-[#181818] hover:bg-[#222222] border border-white/10 text-white font-mono text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    Ver Detalhes do Plano Comercial
                    <ChevronRight className="w-3.5 h-3.5 text-[#C6FF00]" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PLANEJAMENTO POR SERVIÇO & REALIZADO */}
          {activeTab === 'servicos' && (
            <div className="space-y-6">
              {/* Service planning header action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111111] border border-white/10 p-4">
                <div>
                  <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#C6FF00]" />
                    Distribuição da Meta por Linha de Serviço
                  </h3>
                  <p className="text-xs text-white/50 font-sans mt-0.5">
                    Defina quantidade alvo e preço unitário para cada serviço comercializado pela Vulto Lab.
                  </p>
                </div>

                <button
                  onClick={() => handleOpenServiceModal()}
                  className="px-3.5 py-2 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-bold text-xs font-mono flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-[#0A0A0A]" />
                  + Novo Alvo de Serviço
                </button>
              </div>

              {/* Service Comparison Table / Cards */}
              {data?.serviceComparisons && data.serviceComparisons.length > 0 ? (
                <div className="bg-[#111111] border border-white/10 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 bg-[#161616] text-[10px] font-mono text-white/40 uppercase tracking-wider">
                          <th className="py-3 px-4">Serviço</th>
                          <th className="py-3 px-3 text-center">Alvo Qtd</th>
                          <th className="py-3 px-3 text-right">Preço Unit.</th>
                          <th className="py-3 px-4 text-right">Total Esperado</th>
                          <th className="py-3 px-3 text-center">Vendas Feitas</th>
                          <th className="py-3 px-4 text-right">Realizado</th>
                          <th className="py-3 px-4 text-center">Progresso</th>
                          <th className="py-3 px-3 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono text-xs">
                        {data.serviceComparisons.map((sc, idx) => {
                          const targetObj = data.serviceTargets.find(
                            (t) => t.service_name === sc.serviceName
                          );
                          const isCompleted = sc.progressPercent >= 100;

                          return (
                            <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                              <td className="py-3.5 px-4 font-bold text-white">
                                <div className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 bg-[#C6FF00] rounded-full" />
                                  {sc.serviceName}
                                </div>
                              </td>

                              <td className="py-3.5 px-3 text-center text-white/80">
                                {sc.targetQuantity} un
                              </td>

                              <td className="py-3.5 px-3 text-right text-white/60">
                                {formatCurrencyBRL(sc.unitPrice)}
                              </td>

                              <td className="py-3.5 px-4 text-right font-bold text-white">
                                {formatCurrencyBRL(sc.totalPlanned)}
                              </td>

                              <td className="py-3.5 px-3 text-center">
                                <span
                                  className={`px-2 py-0.5 border ${
                                    sc.realizedQuantity >= sc.targetQuantity
                                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold'
                                      : 'border-white/10 bg-white/5 text-white/80'
                                  }`}
                                >
                                  {sc.realizedQuantity} / {sc.targetQuantity}
                                </span>
                              </td>

                              <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
                                {formatCurrencyBRL(sc.realizedAmount)}
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="w-28 mx-auto space-y-1">
                                  <div className="flex justify-between text-[10px] text-white/60">
                                    <span
                                      className={
                                        isCompleted ? 'text-emerald-400 font-bold' : 'text-[#C6FF00]'
                                      }
                                    >
                                      {sc.progressPercent.toFixed(0)}%
                                    </span>
                                  </div>
                                  <div className="h-1.5 w-full bg-[#181818] overflow-hidden">
                                    <div
                                      style={{ width: `${Math.min(100, sc.progressPercent)}%` }}
                                      className={`h-full ${
                                        isCompleted ? 'bg-emerald-400' : 'bg-[#C6FF00]'
                                      }`}
                                    />
                                  </div>
                                </div>
                              </td>

                              <td className="py-3.5 px-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {targetObj && (
                                    <>
                                      <button
                                        onClick={() => handleOpenServiceModal(targetObj)}
                                        className="p-1 hover:bg-white/10 text-white/60 hover:text-white"
                                        title="Editar alvo deste serviço"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDeleteServiceTarget(targetObj.id, targetObj.service_name)
                                        }
                                        className="p-1 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300"
                                        title="Excluir alvo"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-4 bg-[#141414] border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs font-mono">
                    <span className="text-white/50">
                      Total Esperado Planejado: <strong className="text-white">{formatCurrencyBRL(totalPlannedInServices)}</strong>
                    </span>
                    <span className="text-white/50">
                      Total Realizado via Vendas (sales):{' '}
                      <strong className="text-emerald-400">
                        {formatCurrencyBRL(
                          data.serviceComparisons.reduce((acc, c) => acc + c.realizedAmount, 0)
                        )}
                      </strong>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-[#111111] border border-white/10 p-12 text-center">
                  <Layers className="w-8 h-8 text-white/20 mx-auto mb-3" />
                  <h4 className="text-sm font-mono font-bold text-white mb-1">
                    Nenhum serviço planejado para a meta atual
                  </h4>
                  <p className="text-xs text-white/50 font-sans max-w-md mx-auto mb-4">
                    Cadastre serviços como Paid Media, Sites & Sistemas ou VULTO TAP para acompanhar o plano comercial.
                  </p>
                  <button
                    onClick={() => handleOpenServiceModal()}
                    className="px-4 py-2 bg-[#C6FF00] text-[#0A0A0A] font-bold text-xs font-mono inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#0A0A0A]" />
                    Adicionar Primeiro Serviço
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PROJEÇÃO & RITMO */}
          {activeTab === 'projecao' && (
            <div className="space-y-6">
              <div className="bg-[#111111] border border-white/10 p-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono tracking-widest text-[#C6FF00] uppercase">
                    // PROJEÇÃO DE FECHAMENTO
                  </span>
                  <span className="text-white/20">•</span>
                  <span className="text-[10px] font-mono text-white/50">
                    BASEADO NO RITMO ATUAL (RUN-RATE)
                  </span>
                </div>
                <h3 className="text-lg font-mono font-bold text-white">
                  Ritmo Atual e Estimativa de Final de Mês
                </h3>
                <p className="text-xs text-white/60 font-sans mt-0.5">
                  Projeção matemática: Faturamento Realizado + (Média Diária Atual × Dias Restantes).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#111111] border border-white/10 p-5">
                  <div className="text-[10px] font-mono text-white/40 uppercase">Média Diária Realizada</div>
                  <div className="text-2xl font-mono font-bold text-white mt-1">
                    {formatCurrencyBRL(calcs?.currentDailyAverage || 0)}
                    <span className="text-xs text-white/40 font-normal ml-1">/ dia</span>
                  </div>
                  <p className="text-[11px] font-sans text-white/50 mt-2">
                    Com base nos {calcs?.daysPassed || 1} dias transcorridos deste mês.
                  </p>
                </div>

                <div className="bg-[#111111] border border-white/10 p-5">
                  <div className="text-[10px] font-mono text-white/40 uppercase">Projeção de Faturamento</div>
                  <div
                    className={`text-2xl font-mono font-bold mt-1 ${
                      calcs?.isProjectedToBeatGoal ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {formatCurrencyBRL(calcs?.projectedEndMonthAmount || 0)}
                  </div>
                  <p className="text-[11px] font-sans text-white/50 mt-2">
                    Estimativa se mantiver a média diária até o último dia.
                  </p>
                </div>

                <div className="bg-[#111111] border border-white/10 p-5">
                  <div className="text-[10px] font-mono text-white/40 uppercase">Saldo vs Meta</div>
                  <div
                    className={`text-2xl font-mono font-bold mt-1 ${
                      (calcs?.projectionDifference || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {(calcs?.projectionDifference || 0) >= 0 ? '+' : ''}
                    {formatCurrencyBRL(calcs?.projectionDifference || 0)}
                  </div>
                  <p className="text-[11px] font-sans text-white/50 mt-2">
                    {(calcs?.projectionDifference || 0) >= 0
                      ? 'No ritmo atual, a meta mensal será superada.'
                      : 'Necessário acelerar o fechamento de propostas.'}
                  </p>
                </div>
              </div>

              {/* Action Plan Guidance */}
              <div className="bg-[#111111] border border-white/10 p-5">
                <h4 className="text-sm font-mono font-bold text-white mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#C6FF00]" />
                  Diagnóstico Comercial & Próximas Ações
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div className="p-3 bg-[#161616] border border-white/5">
                    <span className="text-[10px] font-mono text-white/40 uppercase">
                      Para Atingir a Meta Exata
                    </span>
                    <p className="text-xs font-mono text-white/80 mt-1">
                      A Vulto Lab precisa vender uma média de{' '}
                      <strong className="text-[#C6FF00]">{formatCurrencyBRL(calcs?.dailyRequired || 0)}</strong>{' '}
                      por dia durante os próximos <strong>{calcs?.daysRemaining || 0} dias</strong>.
                    </p>
                  </div>

                  <div className="p-3 bg-[#161616] border border-white/5">
                    <span className="text-[10px] font-mono text-white/40 uppercase">
                      Estratégia Recomendada
                    </span>
                    <p className="text-xs font-mono text-white/80 mt-1">
                      Priorizar leads em fase de <strong>NEGOCIAÇÃO</strong> e fechamento de lotes{' '}
                      <strong>VULTO TAP</strong> para injeção rápida de caixa.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: HISTÓRICO DE METAS */}
          {activeTab === 'historico' && (
            <div className="space-y-6">
              <div className="bg-[#111111] border border-white/10 p-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono tracking-widest text-[#C6FF00] uppercase">
                    // REGISTRO HISTÓRICO
                  </span>
                  <span className="text-white/20">•</span>
                  <span className="text-[10px] font-mono text-white/50">
                    DESEMPENHO POR CICLO
                  </span>
                </div>
                <h3 className="text-lg font-mono font-bold text-white">
                  Histórico de Metas Mensais
                </h3>
                <p className="text-xs text-white/60 font-sans mt-0.5">
                  Consolidação dos ciclos comerciais anteriores e taxa de atingimento histórico.
                </p>
              </div>

              {data?.historicalGoals && data.historicalGoals.length > 0 ? (
                <div className="space-y-3">
                  {data.historicalGoals.map((hg) => {
                    const isPassed = hg.percentage >= 100;
                    return (
                      <div
                        key={hg.id}
                        className="bg-[#111111] border border-white/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="text-xs font-mono text-white/40 uppercase">Ciclo Mensal</div>
                          <h4 className="text-base font-mono font-bold text-white mt-0.5">
                            {hg.monthFormatted}
                          </h4>
                          <span className="text-xs font-mono text-white/60">
                            {hg.salesCount} vendas realizadas
                          </span>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="text-[10px] font-mono text-white/40 uppercase">Realizado / Meta</div>
                            <div className="text-sm font-mono font-bold text-white">
                              {formatCurrencyBRL(hg.realizedAmount)}{' '}
                              <span className="text-white/40 font-normal">/ {formatCurrencyBRL(hg.targetAmount)}</span>
                            </div>
                          </div>

                          <div className="text-right min-w-[70px]">
                            <div className="text-[10px] font-mono text-white/40 uppercase">Taxa</div>
                            <div
                              className={`text-lg font-mono font-bold ${
                                isPassed ? 'text-emerald-400' : 'text-[#C6FF00]'
                              }`}
                            >
                              {hg.percentage.toFixed(0)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-[#111111] border border-white/10 p-12 text-center text-xs font-mono text-white/40">
                  Nenhum ciclo histórico anterior registrado.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: DEFINIR META DO MÊS */}
      {/* ========================================================================= */}
      {isMonthlyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-white/20 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10">
              <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-[#C6FF00]" />
                Configurar Meta do Mês
              </h3>
              <button
                onClick={() => setIsMonthlyModalOpen(false)}
                className="text-white/40 hover:text-white font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMonthlyGoal} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-white/60 uppercase mb-1">
                  Título da Meta
                </label>
                <input
                  type="text"
                  value={monthTitleInput}
                  onChange={(e) => setMonthTitleInput(e.target.value)}
                  className="w-full bg-[#181818] border border-white/15 px-3 py-2 text-xs font-mono text-white focus:outline-hidden focus:border-[#C6FF00]"
                  placeholder="Ex: Meta Comercial de Outubro"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-white/60 uppercase mb-1">
                  Valor Alvo (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-mono text-white/40">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={monthTargetInput}
                    onChange={(e) => setMonthTargetInput(e.target.value)}
                    className="w-full bg-[#181818] border border-white/15 pl-9 pr-3 py-2 text-xs font-mono text-white focus:outline-hidden focus:border-[#C6FF00]"
                    placeholder="50000.00"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-white/60 uppercase mb-1">
                    Data Inicial
                  </label>
                  <input
                    type="date"
                    value={monthStartDateInput}
                    onChange={(e) => setMonthStartDateInput(e.target.value)}
                    className="w-full bg-[#181818] border border-white/15 px-3 py-2 text-xs font-mono text-white focus:outline-hidden focus:border-[#C6FF00]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-white/60 uppercase mb-1">
                    Data Final
                  </label>
                  <input
                    type="date"
                    value={monthEndDateInput}
                    onChange={(e) => setMonthEndDateInput(e.target.value)}
                    className="w-full bg-[#181818] border border-white/15 px-3 py-2 text-xs font-mono text-white focus:outline-hidden focus:border-[#C6FF00]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-white/60 uppercase mb-1">
                  Observações / Estratégia
                </label>
                <textarea
                  value={monthNotesInput}
                  onChange={(e) => setMonthNotesInput(e.target.value)}
                  rows={2}
                  className="w-full bg-[#181818] border border-white/15 px-3 py-2 text-xs font-mono text-white focus:outline-hidden focus:border-[#C6FF00]"
                  placeholder="Foco em contratos anuais e lote VULTO TAP"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsMonthlyModalOpen(false)}
                  className="px-3 py-2 bg-[#181818] text-white/60 hover:text-white text-xs font-mono"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#C6FF00] text-[#0A0A0A] font-bold text-xs font-mono hover:bg-[#b0e600]"
                >
                  Salvar Meta Mensal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DEFINIR META DO DIA */}
      {/* ========================================================================= */}
      {isDailyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-white/20 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10">
              <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Definir Meta do Dia
              </h3>
              <button
                onClick={() => setIsDailyModalOpen(false)}
                className="text-white/40 hover:text-white font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDailyGoal} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-white/60 uppercase mb-1">
                  Data
                </label>
                <input
                  type="date"
                  value={dailyDateInput}
                  onChange={(e) => setDailyDateInput(e.target.value)}
                  className="w-full bg-[#181818] border border-white/15 px-3 py-2 text-xs font-mono text-white focus:outline-hidden focus:border-[#C6FF00]"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-white/60 uppercase mb-1">
                  Valor do Alvo de Hoje (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-mono text-white/40">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={dailyTargetInput}
                    onChange={(e) => setDailyTargetInput(e.target.value)}
                    className="w-full bg-[#181818] border border-white/15 pl-9 pr-3 py-2 text-xs font-mono text-white focus:outline-hidden focus:border-[#C6FF00]"
                    placeholder="2000.00"
                    required
                  />
                </div>
              </div>

              {calcs && (
                <div className="p-3 bg-[#181818] border border-white/10 text-xs font-mono">
                  <div className="text-[10px] text-white/40 uppercase mb-1">Sugestão Automática:</div>
                  <div className="text-[#C6FF00] font-bold">
                    {formatCurrencyBRL(calcs.dailyRequired)}
                  </div>
                  <div className="text-[10px] text-white/50 mt-1">
                    (R$ {calcs.remainingAmount.toLocaleString('pt-BR')} restante / {calcs.daysRemaining} dias)
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-mono text-white/60 uppercase mb-1">
                  Anotações
                </label>
                <input
                  type="text"
                  value={dailyNotesInput}
                  onChange={(e) => setDailyNotesInput(e.target.value)}
                  className="w-full bg-[#181818] border border-white/15 px-3 py-2 text-xs font-mono text-white focus:outline-hidden focus:border-[#C6FF00]"
                  placeholder="Ex: Focar no fechamento do cliente X"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsDailyModalOpen(false)}
                  className="px-3 py-2 bg-[#181818] text-white/60 hover:text-white text-xs font-mono"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#C6FF00] text-[#0A0A0A] font-bold text-xs font-mono hover:bg-[#b0e600]"
                >
                  Salvar Meta do Dia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: NOVO / EDITAR ALVO DE SERVIÇO */}
      {/* ========================================================================= */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-white/20 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10">
              <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#C6FF00]" />
                {editingTargetId ? 'Editar Alvo de Serviço' : 'Novo Alvo por Serviço'}
              </h3>
              <button
                onClick={() => setIsServiceModalOpen(false)}
                className="text-white/40 hover:text-white font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveServiceTarget} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-white/60 uppercase mb-1">
                  Selecione o Serviço do Catálogo
                </label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => handleSelectServiceChange(e.target.value)}
                  className="w-full bg-[#181818] border border-white/15 px-3 py-2 text-xs font-mono text-white focus:outline-hidden focus:border-[#C6FF00]"
                >
                  {data?.availableServices.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (R$ {s.price.toLocaleString('pt-BR')})
                    </option>
                  ))}
                  <option value="custom">+ Outro / Personalizado</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-white/60 uppercase mb-1">
                  Nome do Serviço / Linha *
                </label>
                <input
                  type="text"
                  value={serviceNameInput}
                  onChange={(e) => setServiceNameInput(e.target.value)}
                  className="w-full bg-[#181818] border border-white/15 px-3 py-2 text-xs font-mono text-white focus:outline-hidden focus:border-[#C6FF00]"
                  placeholder="Ex: Paid Media / Tráfego Pago"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-white/60 uppercase mb-1">
                    Qtd Alvo (vendas) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={targetQuantityInput}
                    onChange={(e) => setTargetQuantityInput(e.target.value)}
                    className="w-full bg-[#181818] border border-white/15 px-3 py-2 text-xs font-mono text-white focus:outline-hidden focus:border-[#C6FF00]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-white/60 uppercase mb-1">
                    Preço Unitário (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={unitPriceInput}
                    onChange={(e) => setUnitPriceInput(e.target.value)}
                    className="w-full bg-[#181818] border border-white/15 px-3 py-2 text-xs font-mono text-white focus:outline-hidden focus:border-[#C6FF00]"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-[#181818] border border-white/5 text-xs font-mono">
                <div className="text-[10px] text-white/40 uppercase">Total Esperado:</div>
                <div className="text-base text-white font-bold mt-0.5">
                  {formatCurrencyBRL(
                    (parseInt(targetQuantityInput, 10) || 0) * (parseFloat(unitPriceInput) || 0)
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-white/60 uppercase mb-1">
                  Observações
                </label>
                <input
                  type="text"
                  value={serviceNotesInput}
                  onChange={(e) => setServiceNotesInput(e.target.value)}
                  className="w-full bg-[#181818] border border-white/15 px-3 py-2 text-xs font-mono text-white focus:outline-hidden focus:border-[#C6FF00]"
                  placeholder="Ex: Foco no plano bimestral"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="px-3 py-2 bg-[#181818] text-white/60 hover:text-white text-xs font-mono"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#C6FF00] text-[#0A0A0A] font-bold text-xs font-mono hover:bg-[#b0e600]"
                >
                  Salvar Alvo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function LayoutDashboardIcon(props: { className?: string }) {
  return (
    <svg
      className={props.className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}
