import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Target,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  UserPlus,
  Send,
  MessageSquare,
  MessageCircle,
  FileText,
  Award,
  Check,
  AlertCircle,
  RefreshCw,
  Clock,
  Calendar,
  Users,
  User,
  Zap,
  BarChart3,
  Layers,
  Save,
  ArrowUpRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  VultoOperator,
  VultoProspect,
  VultoProspectInteraction,
  VultoProspectingGoal,
  ProspectingGoalScope,
  fetchVultoOperators,
  fetchProspectingGoal,
  upsertProspectingGoal,
  fetchAllProspectsAndInteractions,
  getActiveOperatorSession,
  logVultoAudit,
} from '../../services/vultoCoreService';
import { supabase } from '../../lib/supabase';

interface MetricCalculation {
  id: string;
  key: keyof Pick<
    VultoProspectingGoal,
    | 'prospects_target'
    | 'initial_contacts_target'
    | 'followups_target'
    | 'responses_target'
    | 'proposals_target'
    | 'closed_target'
  >;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  target: number;
  realized: number;
  percent: number;
  gap: number;
  currentPacePerDay: number;
  neededPacePerDay: number;
  paceStatus: 'achieved' | 'on_pace' | 'warning' | 'behind';
  paceLabel: string;
}

export function ProspectingGoalsView() {
  // Operador da sessão
  const activeOperator = useMemo(() => getActiveOperatorSession(), []);

  // Mês selecionado (Date sempre no dia 1)
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  // Escopo selecionado: 'team' ou 'operator'
  const [selectedScope, setSelectedScope] = useState<ProspectingGoalScope>('team');
  // Se escopo 'operator', qual operador
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>('');

  // Operadores disponíveis
  const [operators, setOperators] = useState<VultoOperator[]>([]);

  // Registro de metas carregado do Supabase (vulto_prospecting_goals)
  const [goalRecord, setGoalRecord] = useState<VultoProspectingGoal | null>(null);

  // Dados brutos reais do CRM
  const [allProspects, setAllProspects] = useState<VultoProspect[]>([]);
  const [allInteractions, setAllInteractions] = useState<VultoProspectInteraction[]>([]);

  // Inputs editáveis das 6 metas
  const [prospectsTargetInput, setProspectsTargetInput] = useState<string>('60');
  const [initialContactsTargetInput, setInitialContactsTargetInput] = useState<string>('50');
  const [followupsTargetInput, setFollowupsTargetInput] = useState<string>('80');
  const [responsesTargetInput, setResponsesTargetInput] = useState<string>('30');
  const [proposalsTargetInput, setProposalsTargetInput] = useState<string>('15');
  const [closedTargetInput, setClosedTargetInput] = useState<string>('6');

  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [showAuditDrawer, setShowAuditDrawer] = useState<boolean>(false);
  const [auditTab, setAuditTab] = useState<'prospects' | 'interactions'>('prospects');

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // String chave do mês 'YYYY-MM'
  const monthKey = useMemo(() => {
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, [selectedDate]);

  // Labels de formatação de mês
  const monthLabel = useMemo(() => {
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

  // Informações sobre dias no mês e ritmo de tempo
  const timeInfo = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const isCurrentMonth =
      selectedDate.getFullYear() === currentYear && selectedDate.getMonth() === currentMonth;
    const isPastMonth =
      selectedDate.getFullYear() < currentYear ||
      (selectedDate.getFullYear() === currentYear && selectedDate.getMonth() < currentMonth);
    const isFutureMonth =
      selectedDate.getFullYear() > currentYear ||
      (selectedDate.getFullYear() === currentYear && selectedDate.getMonth() > currentMonth);

    // Total de dias no mês
    const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();

    let daysElapsed = 0;
    let daysRemaining = 0;

    if (isCurrentMonth) {
      daysElapsed = now.getDate();
      daysRemaining = Math.max(0, daysInMonth - daysElapsed);
    } else if (isPastMonth) {
      daysElapsed = daysInMonth;
      daysRemaining = 0;
    } else {
      daysElapsed = 0;
      daysRemaining = daysInMonth;
    }

    return {
      isCurrentMonth,
      isPastMonth,
      isFutureMonth,
      daysInMonth,
      daysElapsed,
      daysRemaining,
    };
  }, [selectedDate]);

  // 1. Carregar Operadores iniciais
  useEffect(() => {
    fetchVultoOperators().then((ops) => {
      setOperators(ops);
      if (ops.length > 0 && !selectedOperatorId) {
        // Se operador ativo da sessão estiver na lista, seleciona-o como sugestão
        const matched = ops.find((o) => o.id === activeOperator?.id || o.name === activeOperator?.name);
        setSelectedOperatorId(matched ? matched.id : ops[0].id);
      }
    });
  }, [activeOperator]);

  // 2. Carregar dados do Supabase
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [goalRes, crmRes] = await Promise.all([
        fetchProspectingGoal(
          monthKey,
          selectedScope,
          selectedScope === 'operator' ? selectedOperatorId : null
        ),
        fetchAllProspectsAndInteractions(),
      ]);

      setAllProspects(crmRes.prospects);
      setAllInteractions(crmRes.interactions);

      if (goalRes.data) {
        const g = goalRes.data;
        setGoalRecord(g);
        setProspectsTargetInput(String(g.prospects_target ?? 60));
        setInitialContactsTargetInput(String(g.initial_contacts_target ?? 50));
        setFollowupsTargetInput(String(g.followups_target ?? 80));
        setResponsesTargetInput(String(g.responses_target ?? 30));
        setProposalsTargetInput(String(g.proposals_target ?? 15));
        setClosedTargetInput(String(g.closed_target ?? 6));
      } else {
        setGoalRecord(null);
        // Valores padrão recomendados para início de mês
        if (selectedScope === 'team') {
          setProspectsTargetInput('60');
          setInitialContactsTargetInput('50');
          setFollowupsTargetInput('80');
          setResponsesTargetInput('30');
          setProposalsTargetInput('15');
          setClosedTargetInput('6');
        } else {
          setProspectsTargetInput('30');
          setInitialContactsTargetInput('25');
          setFollowupsTargetInput('40');
          setResponsesTargetInput('15');
          setProposalsTargetInput('8');
          setClosedTargetInput('3');
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados de metas:', err);
      showToast('Falha ao carregar dados do Supabase', 'error');
    } finally {
      setLoading(false);
    }
  }, [monthKey, selectedScope, selectedOperatorId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 3. Listener para Refresh Central
  useEffect(() => {
    const handleRefresh = () => {
      loadData();
    };
    window.addEventListener('vulto:refresh', handleRefresh);
    return () => window.removeEventListener('vulto:refresh', handleRefresh);
  }, [loadData]);

  // 4. Realtime do Supabase
  useEffect(() => {
    const channel = supabase
      .channel('vulto_prospecting_goals_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vulto_prospecting_goals' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vulto_prospects' }, () => {
        fetchAllProspectsAndInteractions().then((res) => {
          setAllProspects(res.prospects);
          setAllInteractions(res.interactions);
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vulto_prospect_interactions' }, () => {
        fetchAllProspectsAndInteractions().then((res) => {
          setAllProspects(res.prospects);
          setAllInteractions(res.interactions);
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  // 5. Filtrar dados do CRM para o Mês e Escopo Selecionados
  const filteredData = useMemo(() => {
    const targetOpId = selectedScope === 'operator' ? selectedOperatorId : null;

    // Filtrar prospects pertencentes ao operador (se escopo individual)
    const prospectsForScope = allProspects.filter((p) => {
      if (!targetOpId) return true;
      return p.operator_id === targetOpId;
    });

    // Filtrar interações pertencentes ao operador (se escopo individual)
    const interactionsForScope = allInteractions.filter((i) => {
      if (!targetOpId) return true;
      if (i.operator_id === targetOpId) return true;
      // Se a interação não tiver operator_id gravado, verificar se o prospect pertence ao operador
      const parent = allProspects.find((p) => p.id === i.prospect_id);
      return parent?.operator_id === targetOpId;
    });

    // 1. Novos Prospects Cadastrados no mês
    const prospectsCreatedInMonth = prospectsForScope.filter((p) => {
      return p.created_at && p.created_at.startsWith(monthKey);
    });

    // 2. Primeiros Contatos Realizados no mês
    // Um prospect teve o primeiro contato no mês se:
    // a) Teve sua primeira interação com data dentro do mês, OU
    // b) Foi cadastrado no mês com status diferente de 'novo' (ex: 'em_contato'), OU
    // c) Seu last_contact_at ocorreu dentro do mês e não possui interações antigas
    const prospectFirstContactMap = new Map<string, string>();
    allInteractions.forEach((i) => {
      const dt = i.interaction_at || i.created_at;
      if (!dt) return;
      const currentMin = prospectFirstContactMap.get(i.prospect_id);
      if (!currentMin || dt < currentMin) {
        prospectFirstContactMap.set(i.prospect_id, dt);
      }
    });

    const initialContactsInMonth = prospectsForScope.filter((p) => {
      const earliestInteraction = prospectFirstContactMap.get(p.id);
      if (earliestInteraction) {
        return earliestInteraction.startsWith(monthKey);
      }
      // Se não houver interações na tabela de interações, checa criação + status ou last_contact_at
      if (p.last_contact_at && p.last_contact_at.startsWith(monthKey)) {
        return true;
      }
      if (p.created_at && p.created_at.startsWith(monthKey) && p.status !== 'novo') {
        return true;
      }
      return false;
    });

    // 3. Follow-ups Realizados no mês
    // Total de interações registradas no mês (via timeline) ou toques em prospects prévios
    const interactionsInMonth = interactionsForScope.filter((i) => {
      const dt = i.interaction_at || i.created_at;
      return dt && dt.startsWith(monthKey);
    });

    // Follow-ups são interações realizadas (ou prospects tocados no mês)
    const followupsCount = interactionsInMonth.length;

    // 4. Respostas Obtidas no mês
    // Prospects que atingiram status avançado no funil (em_contato, reuniao_agendada, proposta_enviada, fechado)
    // atualizados ou com contato no mês selecionado
    const responsesInMonth = prospectsForScope.filter((p) => {
      const isAdvanced = ['em_contato', 'reuniao_agendada', 'proposta_enviada', 'fechado'].includes(p.status);
      if (!isAdvanced) return false;
      const wasUpdatedInMonth = p.updated_at && p.updated_at.startsWith(monthKey);
      const wasContactedInMonth = p.last_contact_at && p.last_contact_at.startsWith(monthKey);
      const wasCreatedInMonth = p.created_at && p.created_at.startsWith(monthKey);
      return wasUpdatedInMonth || wasContactedInMonth || wasCreatedInMonth;
    });

    // 5. Propostas Enviadas no mês
    const proposalsInMonth = prospectsForScope.filter((p) => {
      const isProposalStage = p.status === 'proposta_enviada' || p.status === 'fechado' || (p.proposal_amount && p.proposal_amount > 0);
      if (!isProposalStage) return false;
      const wasTouchedInMonth =
        (p.updated_at && p.updated_at.startsWith(monthKey)) ||
        (p.created_at && p.created_at.startsWith(monthKey));
      return wasTouchedInMonth;
    });

    // 6. Fechamentos no mês
    const closedInMonth = prospectsForScope.filter((p) => {
      const isClosed = p.status === 'fechado' || Boolean(p.converted_client_id);
      if (!isClosed) return false;
      const wasClosedInMonth =
        (p.updated_at && p.updated_at.startsWith(monthKey)) ||
        (p.created_at && p.created_at.startsWith(monthKey));
      return wasClosedInMonth;
    });

    return {
      prospectsCreatedInMonth,
      initialContactsInMonth,
      interactionsInMonth,
      followupsCount,
      responsesInMonth,
      proposalsInMonth,
      closedInMonth,
    };
  }, [allProspects, allInteractions, monthKey, selectedScope, selectedOperatorId]);

  // 6. Montagem e Cálculo dos 6 Indicadores com Ritmo
  const metrics: MetricCalculation[] = useMemo(() => {
    const daysElapsed = Math.max(1, timeInfo.daysElapsed || 1);
    const daysRemaining = Math.max(1, timeInfo.daysRemaining || 1);

    const calcMetric = (
      id: string,
      key: MetricCalculation['key'],
      title: string,
      subtitle: string,
      icon: React.ElementType,
      targetVal: number,
      realizedVal: number
    ): MetricCalculation => {
      const target = Math.max(0, targetVal);
      const realized = Math.max(0, realizedVal);
      const percent = target > 0 ? Math.round((realized / target) * 100) : 0;
      const gap = Math.max(0, target - realized);

      const currentPacePerDay = Number((realized / daysElapsed).toFixed(1));
      const neededPacePerDay = timeInfo.isPastMonth ? 0 : Number((gap / daysRemaining).toFixed(1));

      // Status de Ritmo
      let paceStatus: MetricCalculation['paceStatus'] = 'behind';
      let paceLabel = 'Abaixo do Ritmo';

      if (realized >= target && target > 0) {
        paceStatus = 'achieved';
        paceLabel = 'Meta Atingida 🎯';
      } else if (timeInfo.isPastMonth) {
        paceStatus = percent >= 100 ? 'achieved' : 'behind';
        paceLabel = percent >= 100 ? 'Meta Batida' : 'Encerrado s/ Meta';
      } else if (timeInfo.isFutureMonth) {
        paceStatus = 'on_pace';
        paceLabel = 'Mês Futuro';
      } else {
        // Mês vigente: calcular projeção
        const projectedTotal = currentPacePerDay * timeInfo.daysInMonth;
        if (projectedTotal >= target) {
          paceStatus = 'on_pace';
          paceLabel = 'No Ritmo ⚡';
        } else if (projectedTotal >= target * 0.75) {
          paceStatus = 'warning';
          paceLabel = 'Ritmo em Atenção ⚠️';
        } else {
          paceStatus = 'behind';
          paceLabel = 'Abaixo do Ritmo ⏳';
        }
      }

      return {
        id,
        key,
        title,
        subtitle,
        icon,
        target,
        realized,
        percent,
        gap,
        currentPacePerDay,
        neededPacePerDay,
        paceStatus,
        paceLabel,
      };
    };

    return [
      calcMetric(
        'm_prospects',
        'prospects_target',
        'PROSPECTS CADASTRADOS',
        'Novas empresas inseridas no pipeline',
        UserPlus,
        parseInt(prospectsTargetInput, 10) || 0,
        filteredData.prospectsCreatedInMonth.length
      ),
      calcMetric(
        'm_initial_contacts',
        'initial_contacts_target',
        'PRIMEIROS CONTATOS',
        'Abordagens iniciais realizadas',
        Send,
        parseInt(initialContactsTargetInput, 10) || 0,
        filteredData.initialContactsInMonth.length
      ),
      calcMetric(
        'm_followups',
        'followups_target',
        'FOLLOW-UPS REALIZADOS',
        'Toques e acompanhamentos na timeline',
        MessageSquare,
        parseInt(followupsTargetInput, 10) || 0,
        filteredData.followupsCount
      ),
      calcMetric(
        'm_responses',
        'responses_target',
        'RESPOSTAS OBTIDAS',
        'Prospects que responderam e avançaram',
        MessageCircle,
        parseInt(responsesTargetInput, 10) || 0,
        filteredData.responsesInMonth.length
      ),
      calcMetric(
        'm_proposals',
        'proposals_target',
        'PROPOSTAS ENVIADAS',
        'Apresentações comerciais enviadas',
        FileText,
        parseInt(proposalsTargetInput, 10) || 0,
        filteredData.proposalsInMonth.length
      ),
      calcMetric(
        'm_closed',
        'closed_target',
        'FECHAMENTOS CONCLUÍDOS',
        'Negócios fechados / convertidos',
        Award,
        parseInt(closedTargetInput, 10) || 0,
        filteredData.closedInMonth.length
      ),
    ];
  }, [
    prospectsTargetInput,
    initialContactsTargetInput,
    followupsTargetInput,
    responsesTargetInput,
    proposalsTargetInput,
    closedTargetInput,
    filteredData,
    timeInfo,
  ]);

  // Resumo Geral do Funil
  const funnelSummary = useMemo(() => {
    const goalsAchievedCount = metrics.filter((m) => m.paceStatus === 'achieved' || m.percent >= 100).length;
    const goalsOnPaceCount = metrics.filter((m) => m.paceStatus === 'on_pace').length;

    const totalTarget = metrics.reduce((acc, m) => acc + m.target, 0);
    const totalRealized = metrics.reduce((acc, m) => acc + m.realized, 0);
    const overallPercent = totalTarget > 0 ? Math.round((totalRealized / totalTarget) * 100) : 0;

    const conversionRate =
      filteredData.prospectsCreatedInMonth.length > 0
        ? ((filteredData.closedInMonth.length / filteredData.prospectsCreatedInMonth.length) * 100).toFixed(1)
        : '0.0';

    return {
      goalsAchievedCount,
      goalsOnPaceCount,
      overallPercent,
      conversionRate,
    };
  }, [metrics, filteredData]);

  // Salvar Metas no Supabase (vulto_prospecting_goals)
  const handleSaveGoals = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    try {
      const res = await upsertProspectingGoal({
        id: goalRecord?.id,
        month: monthKey,
        scope: selectedScope,
        target_operator_id: selectedScope === 'operator' ? selectedOperatorId : null,
        prospects_target: parseInt(prospectsTargetInput, 10) || 0,
        initial_contacts_target: parseInt(initialContactsTargetInput, 10) || 0,
        followups_target: parseInt(followupsTargetInput, 10) || 0,
        responses_target: parseInt(responsesTargetInput, 10) || 0,
        proposals_target: parseInt(proposalsTargetInput, 10) || 0,
        closed_target: parseInt(closedTargetInput, 10) || 0,
      });

      if (res.error) {
        showToast('Erro ao salvar metas: ' + res.error, 'error');
        return;
      }

      if (res.data) {
        setGoalRecord(res.data);
      }

      showToast(`Metas de ${monthLabel} salvas com sucesso no Supabase.`);
      loadData();
    } catch (err: any) {
      console.error(err);
      showToast('Falha inesperada ao gravar metas.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Navegação entre Meses
  const handlePrevMonth = () => {
    setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleCurrentMonth = () => {
    const d = new Date();
    setSelectedDate(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  const handleManualSync = async () => {
    setIsRefreshing(true);
    await loadData();
    showToast('Dados sincronizados com o CRM.');
    setIsRefreshing(false);
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 border font-mono text-xs flex items-center gap-2.5 shadow-2xl transition-all ${
            toastMessage.type === 'success'
              ? 'bg-[#121212] border-[#C6FF00] text-[#C6FF00]'
              : 'bg-rose-950/95 border-rose-500 text-rose-200'
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

      {/* HEADER DE COMANDO: MÊS, ESCOPO E SINCRONIZAÇÃO */}
      <div className="bg-[#111111] border border-white/10 p-5 space-y-4">
        {/* Linha Superior: Título + Navegação de Mês */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#C6FF00]/10 border border-[#C6FF00]/30 text-[#C6FF00]">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-mono text-base sm:text-lg font-bold tracking-wider text-white flex items-center gap-2">
                  METAS DE PROSPECÇÃO
                  <span className="text-[10px] px-2 py-0.5 bg-white/5 border border-white/10 text-white/50 font-normal">
                    CRM CORE
                  </span>
                </h1>
                <p className="text-xs text-white/50 mt-0.5 font-mono">
                  Definição de metas comerciais conectadas 100% aos dados reais do pipeline.
                </p>
              </div>
            </div>
          </div>

          {/* Navegador de Mês */}
          <div className="flex items-center gap-2 bg-[#0A0A0A] border border-white/10 p-1.5 self-start lg:self-auto">
            <button
              onClick={handlePrevMonth}
              title={`Ver ${prevMonthLabel}`}
              className="p-1.5 text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleCurrentMonth}
              className="px-3 py-1 font-mono text-xs tracking-wider font-bold text-white hover:text-[#C6FF00] transition-colors"
            >
              {monthLabel}
            </button>

            <button
              onClick={handleNextMonth}
              title={`Ver ${nextMonthLabel}`}
              className="p-1.5 text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {timeInfo.isCurrentMonth ? (
              <span className="ml-1 text-[10px] font-mono font-bold px-2 py-0.5 bg-[#C6FF00]/10 border border-[#C6FF00]/30 text-[#C6FF00]">
                MÊS VIGENTE
              </span>
            ) : timeInfo.isPastMonth ? (
              <span className="ml-1 text-[10px] font-mono px-2 py-0.5 bg-white/5 border border-white/10 text-white/40">
                HISTÓRICO
              </span>
            ) : (
              <span className="ml-1 text-[10px] font-mono px-2 py-0.5 bg-sky-500/10 border border-sky-500/30 text-sky-400">
                FUTURO
              </span>
            )}
          </div>
        </div>

        {/* Linha Inferior: Seletor de Escopo (Geral vs Individual) + Botões de Ação */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
          {/* Seletor de Escopo */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-white/40 uppercase tracking-wider mr-1">
              ESCOPO:
            </span>

            <button
              onClick={() => setSelectedScope('team')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-mono tracking-wider transition-all cursor-pointer ${
                selectedScope === 'team'
                  ? 'bg-[#181818] border border-[#C6FF00] text-[#C6FF00] font-bold shadow-sm'
                  : 'bg-[#0A0A0A] border border-white/10 text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>TIME GERAL (TODOS)</span>
            </button>

            {operators.map((op) => {
              const isSelected = selectedScope === 'operator' && selectedOperatorId === op.id;
              return (
                <button
                  key={op.id}
                  onClick={() => {
                    setSelectedScope('operator');
                    setSelectedOperatorId(op.id);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-mono tracking-wider transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#181818] border border-[#C6FF00] text-[#C6FF00] font-bold shadow-sm'
                      : 'bg-[#0A0A0A] border border-white/10 text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{op.name.toUpperCase()}</span>
                </button>
              );
            })}
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-2.5 self-end md:self-auto">
            <button
              onClick={handleManualSync}
              disabled={isRefreshing || loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#0A0A0A] border border-white/15 text-white/70 hover:text-white hover:border-white/30 text-xs font-mono tracking-wider transition-all cursor-pointer disabled:opacity-50"
              title="Recarregar dados do CRM em tempo real"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#C6FF00]' : ''}`} />
              <span className="hidden sm:inline">SINCRONIZAR CRM</span>
            </button>

            <button
              onClick={() => handleSaveGoals()}
              disabled={isSaving || loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#C6FF00] hover:bg-[#d4ff33] text-[#0A0A0A] font-mono text-xs font-bold tracking-wider transition-all shadow-lg shadow-[#C6FF00]/10 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>{isSaving ? 'SALVANDO...' : 'SALVAR METAS'}</span>
            </button>
          </div>
        </div>

        {/* Faixa Informativa de Pacing / Dias do Mês */}
        <div className="bg-[#0A0A0A] border border-white/5 p-3 flex flex-wrap items-center justify-between text-xs font-mono text-white/60 gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#C6FF00]" />
              {timeInfo.isCurrentMonth ? (
                <span>
                  Dia <strong className="text-white">{timeInfo.daysElapsed}</strong> de{' '}
                  <strong className="text-white">{timeInfo.daysInMonth}</strong> (Restam{' '}
                  <strong className="text-[#C6FF00]">{timeInfo.daysRemaining} dias</strong>)
                </span>
              ) : timeInfo.isPastMonth ? (
                <span className="text-white/40">Mês encerrado ({timeInfo.daysInMonth} dias decorridos)</span>
              ) : (
                <span className="text-white/40">Mês futuro ({timeInfo.daysInMonth} dias a planejar)</span>
              )}
            </span>

            {activeOperator && (
              <span className="hidden md:inline-flex items-center gap-1.5 border-l border-white/10 pl-4 text-white/40">
                <span>Operador ativo:</span>
                <span className="text-white font-bold">{activeOperator.name}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-white/40">Status no Supabase:</span>
            {goalRecord ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-3 h-3" /> Configurado
              </span>
            ) : (
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Padrão não salvo
              </span>
            )}
          </div>
        </div>
      </div>

      {/* CARDS RESUMO DO RITMO DO FUNIL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111111] border border-white/10 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-white/50 tracking-wider">METAS CONCLUÍDAS</span>
            <Target className="w-4 h-4 text-[#C6FF00]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-white">
              {funnelSummary.goalsAchievedCount}
            </span>
            <span className="font-mono text-xs text-white/40">/ 6 METAS</span>
          </div>
          <div className="text-[11px] font-mono text-white/40">
            {funnelSummary.goalsOnPaceCount > 0
              ? `+${funnelSummary.goalsOnPaceCount} no ritmo de fechamento`
              : 'Acelere o ritmo operacional'}
          </div>
        </div>

        <div className="bg-[#111111] border border-white/10 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-white/50 tracking-wider">CONVERSÃO GERAL</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-emerald-400">
              {funnelSummary.conversionRate}%
            </span>
            <span className="font-mono text-xs text-white/40">PROSPECT → FECHADO</span>
          </div>
          <div className="text-[11px] font-mono text-white/40">
            {filteredData.closedInMonth.length} fechamentos de {filteredData.prospectsCreatedInMonth.length} novos
          </div>
        </div>

        <div className="bg-[#111111] border border-white/10 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-white/50 tracking-wider">TOTAL DE INTERAÇÕES</span>
            <MessageSquare className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-white">
              {filteredData.interactionsInMonth.length}
            </span>
            <span className="font-mono text-xs text-white/40">TOQUES NO MÊS</span>
          </div>
          <div className="text-[11px] font-mono text-white/40">
            {timeInfo.isCurrentMonth
              ? `Média de ${(filteredData.interactionsInMonth.length / Math.max(1, timeInfo.daysElapsed)).toFixed(1)} ações/dia`
              : 'Interações consolidadas'}
          </div>
        </div>

        <div className="bg-[#111111] border border-white/10 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-white/50 tracking-wider">AUDITORIA CRM</span>
            <ShieldCheck className="w-4 h-4 text-[#C6FF00]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-sm font-bold text-[#C6FF00]">100% AUTOMÁTICO</span>
          </div>
          <div className="text-[11px] font-mono text-white/40">
            Sem contadores manuais. Dados extraídos das tabelas oficiais.
          </div>
        </div>
      </div>

      {/* GRID DOS 6 INDICADORES / METAS COM INPUT E RITMO */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-xs font-bold tracking-wider text-white/70 uppercase flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#C6FF00]" />
            <span>INDICADORES DO FUNIL (EDITE AS METAS E VEJA O RITMO)</span>
          </h2>
          <span className="font-mono text-[10px] text-white/40">
            Clique no campo META para ajustar o valor planejado
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            const isAchieved = metric.paceStatus === 'achieved' || metric.percent >= 100;
            const isWarning = metric.paceStatus === 'warning';
            const isOnPace = metric.paceStatus === 'on_pace';

            // Setter correspondente ao input
            const getInputValue = () => {
              if (metric.key === 'prospects_target') return prospectsTargetInput;
              if (metric.key === 'initial_contacts_target') return initialContactsTargetInput;
              if (metric.key === 'followups_target') return followupsTargetInput;
              if (metric.key === 'responses_target') return responsesTargetInput;
              if (metric.key === 'proposals_target') return proposalsTargetInput;
              if (metric.key === 'closed_target') return closedTargetInput;
              return '0';
            };

            const setInputValue = (val: string) => {
              if (metric.key === 'prospects_target') setProspectsTargetInput(val);
              if (metric.key === 'initial_contacts_target') setInitialContactsTargetInput(val);
              if (metric.key === 'followups_target') setFollowupsTargetInput(val);
              if (metric.key === 'responses_target') setResponsesTargetInput(val);
              if (metric.key === 'proposals_target') setProposalsTargetInput(val);
              if (metric.key === 'closed_target') setClosedTargetInput(val);
            };

            return (
              <div
                key={metric.id}
                className="bg-[#111111] border border-white/10 p-5 space-y-4 hover:border-white/20 transition-all flex flex-col justify-between"
              >
                {/* Cabeçalho do Card */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1.5 border ${
                          isAchieved
                            ? 'bg-[#C6FF00]/10 border-[#C6FF00]/40 text-[#C6FF00]'
                            : isOnPace
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                            : isWarning
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                            : 'bg-white/5 border-white/10 text-white/60'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-mono text-xs font-bold tracking-wider text-white">
                        {metric.title}
                      </span>
                    </div>

                    {/* Badge de Ritmo */}
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 border font-bold ${
                        isAchieved
                          ? 'bg-[#C6FF00]/10 border-[#C6FF00]/40 text-[#C6FF00]'
                          : isOnPace
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : isWarning
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      }`}
                    >
                      {metric.paceLabel}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/40 pl-8">{metric.subtitle}</p>
                </div>

                {/* Números: Realizado vs Meta Editável */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                  {/* Realizado (automático do CRM) */}
                  <div className="bg-[#0A0A0A] border border-white/5 p-2.5 space-y-1">
                    <span className="font-mono text-[10px] text-white/40 block">REALIZADO (CRM)</span>
                    <div className="flex items-baseline gap-1.5">
                      <span
                        className={`font-mono text-2xl font-bold ${
                          isAchieved ? 'text-[#C6FF00]' : 'text-white'
                        }`}
                      >
                        {metric.realized}
                      </span>
                      <span className="font-mono text-[10px] text-white/40">unidades</span>
                    </div>
                  </div>

                  {/* Meta (editável) */}
                  <div className="bg-[#0A0A0A] border border-white/10 p-2.5 space-y-1 focus-within:border-[#C6FF00]/60 transition-all">
                    <label className="font-mono text-[10px] text-white/50 block">META MENSAL</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={getInputValue()}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="w-full bg-transparent font-mono text-2xl font-bold text-white focus:outline-none focus:text-[#C6FF00]"
                      />
                    </div>
                  </div>
                </div>

                {/* Barra de Progresso */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-white/50">Progresso</span>
                    <span
                      className={`font-bold ${
                        isAchieved ? 'text-[#C6FF00]' : 'text-white'
                      }`}
                    >
                      {metric.percent}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#181818] border border-white/10 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isAchieved
                          ? 'bg-[#C6FF00]'
                          : isOnPace
                          ? 'bg-emerald-400'
                          : isWarning
                          ? 'bg-amber-400'
                          : 'bg-white/40'
                      }`}
                      style={{ width: `${Math.min(100, metric.percent)}%` }}
                    />
                  </div>
                </div>

                {/* Linha de Ritmo e Gap */}
                <div className="bg-[#0A0A0A] border border-white/5 p-2.5 space-y-2 text-[11px] font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-white/40">Faltam p/ a meta:</span>
                    <span
                      className={`font-bold ${
                        metric.gap === 0 ? 'text-[#C6FF00]' : 'text-white/80'
                      }`}
                    >
                      {metric.gap === 0 ? 'Superada! (+0)' : `${metric.gap} restantes`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    <span className="text-white/40">Ritmo atual:</span>
                    <span className="text-white font-bold">{metric.currentPacePerDay}/dia</span>
                  </div>

                  {!timeInfo.isPastMonth && (
                    <div className="flex items-center justify-between">
                      <span className="text-white/40">Ritmo necessário:</span>
                      <span
                        className={`font-bold ${
                          metric.neededPacePerDay <= metric.currentPacePerDay
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {metric.gap === 0 ? '0/dia (Batida)' : `${metric.neededPacePerDay}/dia`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SEÇÃO TRANSPARÊNCIA: AUDITORIA DOS DADOS REAIS DO CRM */}
      <div className="bg-[#111111] border border-white/10 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#C6FF00]" />
            <h3 className="font-mono text-xs font-bold tracking-wider text-white uppercase">
              TRANSPARÊNCIA DO CRM: PROSPECTS E INTERAÇÕES DO MÊS ({monthLabel})
            </h3>
          </div>

          <button
            onClick={() => setShowAuditDrawer(!showAuditDrawer)}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#0A0A0A] border border-white/10 text-white/70 hover:text-white font-mono text-xs cursor-pointer transition-colors"
          >
            <span>{showAuditDrawer ? 'OCULTAR REGISTROS' : 'VER REGISTROS DETALHADOS'}</span>
            {showAuditDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showAuditDrawer && (
          <div className="space-y-4 pt-3 border-t border-white/10">
            {/* Seletor de visualização */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAuditTab('prospects')}
                className={`px-3 py-1.5 font-mono text-xs cursor-pointer transition-all ${
                  auditTab === 'prospects'
                    ? 'bg-[#181818] border border-[#C6FF00] text-[#C6FF00] font-bold'
                    : 'bg-[#0A0A0A] border border-white/10 text-white/50 hover:text-white'
                }`}
              >
                PROSPECTS CADASTRADOS ({filteredData.prospectsCreatedInMonth.length})
              </button>

              <button
                onClick={() => setAuditTab('interactions')}
                className={`px-3 py-1.5 font-mono text-xs cursor-pointer transition-all ${
                  auditTab === 'interactions'
                    ? 'bg-[#181818] border border-[#C6FF00] text-[#C6FF00] font-bold'
                    : 'bg-[#0A0A0A] border border-white/10 text-white/50 hover:text-white'
                }`}
              >
                INTERAÇÕES E FOLLOW-UPS ({filteredData.interactionsInMonth.length})
              </button>
            </div>

            {/* Tabela de Prospects */}
            {auditTab === 'prospects' && (
              <div className="overflow-x-auto max-h-72 border border-white/10 bg-[#0A0A0A]">
                {filteredData.prospectsCreatedInMonth.length === 0 ? (
                  <div className="p-8 text-center text-white/40 font-mono text-xs">
                    Nenhum prospect cadastrado neste mês para o escopo selecionado.
                  </div>
                ) : (
                  <table className="w-full text-left font-mono text-xs text-white/70">
                    <thead className="bg-[#141414] text-[10px] text-white/40 uppercase sticky top-0 border-b border-white/10">
                      <tr>
                        <th className="p-2.5">EMPRESA</th>
                        <th className="p-2.5">CANAL</th>
                        <th className="p-2.5">STATUS</th>
                        <th className="p-2.5">CADASTRADO EM</th>
                        <th className="p-2.5">OPERADOR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredData.prospectsCreatedInMonth.map((p) => {
                        const op = operators.find((o) => o.id === p.operator_id);
                        return (
                          <tr key={p.id} className="hover:bg-white/5">
                            <td className="p-2.5 font-bold text-white">{p.company_name}</td>
                            <td className="p-2.5 text-white/50">{p.channel || 'Geral'}</td>
                            <td className="p-2.5">
                              <span className="px-1.5 py-0.5 text-[10px] bg-white/5 border border-white/10 text-[#C6FF00]">
                                {p.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="p-2.5 text-white/40">
                              {p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : '-'}
                            </td>
                            <td className="p-2.5 text-white/60">{op?.name || p.operator_id || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Tabela de Interações */}
            {auditTab === 'interactions' && (
              <div className="overflow-x-auto max-h-72 border border-white/10 bg-[#0A0A0A]">
                {filteredData.interactionsInMonth.length === 0 ? (
                  <div className="p-8 text-center text-white/40 font-mono text-xs">
                    Nenhuma interação ou follow-up registrado neste mês para o escopo selecionado.
                  </div>
                ) : (
                  <table className="w-full text-left font-mono text-xs text-white/70">
                    <thead className="bg-[#141414] text-[10px] text-white/40 uppercase sticky top-0 border-b border-white/10">
                      <tr>
                        <th className="p-2.5">DATA / HORA</th>
                        <th className="p-2.5">TIPO</th>
                        <th className="p-2.5">PROSPECT ID</th>
                        <th className="p-2.5">RESUMO</th>
                        <th className="p-2.5">OPERADOR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredData.interactionsInMonth.map((i) => {
                        const targetProspect = allProspects.find((p) => p.id === i.prospect_id);
                        const op = operators.find((o) => o.id === i.operator_id);
                        return (
                          <tr key={i.id} className="hover:bg-white/5">
                            <td className="p-2.5 text-white/40">
                              {new Date(i.interaction_at || i.created_at).toLocaleString('pt-BR')}
                            </td>
                            <td className="p-2.5">
                              <span className="px-1.5 py-0.5 text-[10px] bg-white/5 border border-white/10 text-sky-400">
                                {i.type.toUpperCase()}
                              </span>
                            </td>
                            <td className="p-2.5 text-white font-medium">
                              {targetProspect?.company_name || `#${i.prospect_id.slice(0, 8)}`}
                            </td>
                            <td className="p-2.5 text-white/70 truncate max-w-xs">{i.summary}</td>
                            <td className="p-2.5 text-white/50">{op?.name || i.operator_id || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
