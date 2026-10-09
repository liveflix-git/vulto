import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Users,
  Target,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Calendar,
  Layers,
  ArrowRight,
  UserCheck,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { DashboardState, DashboardTab, PartnerId } from '../types';
import { PARTNERS } from '../dashboardStorage';
import { useDashboardData } from '../../hooks/useDashboardData';
import {
  formatCurrencyBRL,
  formatDateOnlyBR,
  formatDateTimeBR,
  getMonthDateBoundaries,
} from '../../services/dashboardService';

interface OverviewViewProps {
  state: DashboardState;
  onNavigateTab: (tab: DashboardTab) => void;
  currentUser: PartnerId;
  onOpenNewRecord?: () => void;
}

export function OverviewView({
  state,
  onNavigateTab,
  currentUser,
  onOpenNewRecord,
}: OverviewViewProps) {
  const currentPartner = PARTNERS[currentUser] || PARTNERS.felipe;
  const { data, loading, refreshing, refetch } = useDashboardData();
  const [hoveredChartDay, setHoveredChartDay] = useState<{
    day: number;
    dateStr: string;
    revenue: number;
  } | null>(null);

  const boundaries = getMonthDateBoundaries();
  const monthNameUpper = new Date()
    .toLocaleString('pt-BR', { month: 'long' })
    .toUpperCase();

  // If initial load is running
  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="bg-[#111111] border border-white/10 p-8 flex flex-col items-center justify-center min-h-[360px] text-center">
          <RefreshCw className="w-8 h-8 text-[#C6FF00] animate-spin mb-3" />
          <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
            Sincronizando dados com Supabase...
          </h2>
          <p className="text-xs text-white/50 font-sans mt-1">
            Consultando tabelas reais: sales, expenses, goals, leads e activities.
          </p>
        </div>
      </div>
    );
  }

  // Fallback safe reference
  const d = data;
  const todayRevenue = d?.todayRevenue ?? 0;
  const todayExpenses = d?.todayExpenses ?? 0;
  const todayProfit = d?.todayProfit ?? 0;
  const todayGoal = d?.todayGoal ?? { target: 0, achieved: 0, percentage: 0 };

  const monthRevenue = d?.monthRevenue ?? 0;
  const monthExpenses = d?.monthExpenses ?? 0;
  const monthProfit = d?.monthProfit ?? 0;
  const activeClientsCount = d?.activeClientsCount ?? 0;
  const newClientsThisMonth = d?.newClientsThisMonth ?? 0;
  const averageTicket = d?.averageTicket ?? 0;
  const salesCount = d?.salesCount ?? 0;
  const monthGoalTarget = d?.monthGoalTarget ?? 0;

  const monthlyGoalProgress = d?.monthlyGoalProgress ?? {
    target: 0,
    achieved: 0,
    remaining: 0,
    percentage: 0,
    daysRemaining: boundaries.daysRemaining,
    dailyRequired: 0,
  };

  const funnel = d?.funnel ?? {
    leadCount: 0,
    contatoCount: 0,
    propostaCount: 0,
    negociacaoCount: 0,
    fechadoCount: 0,
    totalLeads: 0,
    conversionRate: 0,
  };

  const dailyChart = d?.dailyChart ?? [];
  const dailyChartMax = Math.max(d?.dailyChartMax ?? 0, 100);

  const recentSales = d?.recentSales ?? [];
  const recentActivities = d?.recentActivities ?? [];
  const isEmptyDb = d?.isEmptyDatabase ?? false;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header / Live Sync Banner */}
      <div className="bg-[#111111] border border-white/10 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[10px] font-mono tracking-widest text-[#C6FF00] uppercase font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C6FF00] animate-pulse" />
              // VISÃO GERAL EXECUTIVA • SUPABASE REAL
            </span>
            <span className="text-white/20">•</span>
            <span className="text-[10px] font-mono text-white/50 uppercase">
              {monthNameUpper} {boundaries.year}
            </span>
            <span className="text-white/20">•</span>
            <span className="text-[10px] font-mono text-[#C6FF00]/90 bg-[#C6FF00]/10 px-1.5 py-0.5 border border-[#C6FF00]/20">
              RLS ATIVO • DADOS PRIVADOS
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold font-mono text-white">
            Painel Executivo — Situação em Tempo Real
          </h1>
          <p className="text-xs text-white/60 font-sans mt-0.5">
            Sócio conectado:{' '}
            <strong className="text-white font-mono">{currentPartner.name}</strong> ({currentPartner.role}). Todos os indicadores sincronizados via queries diretas.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => refetch()}
            disabled={refreshing}
            className="px-3 py-2 bg-[#171717] hover:bg-[#202020] border border-white/10 text-xs font-mono text-white flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="Atualizar dados agora"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#C6FF00] ${
                refreshing ? 'animate-spin' : ''
              }`}
            />
            <span>{refreshing ? 'Atualizando...' : 'Recarregar'}</span>
          </button>

          {onOpenNewRecord && (
            <button
              onClick={onOpenNewRecord}
              className="px-3.5 py-2 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Registro</span>
            </button>
          )}

          <button
            onClick={() => onNavigateTab('finance')}
            className="px-3 py-2 bg-[#1C1C1C] hover:bg-[#252525] border border-white/10 text-xs font-mono text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Fluxo Completo</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#C6FF00]" />
          </button>
        </div>
      </div>

      {/* Database Empty Alert (Strict non-mock transparency) */}
      {isEmptyDb && (
        <div className="bg-[#141414] border border-[#C6FF00]/30 p-4 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#C6FF00] shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              BANCO DE DADOS CONECTADO // TABELAS PRONTAS
            </h3>
            <p className="text-xs text-white/60 font-sans mt-0.5">
              O Supabase está configurado e as tabelas estão prontas para receber dados.
              Como nenhum registro foi inserido ainda, todos os valores refletem rigorosamente{' '}
              <strong className="text-white font-mono">R$ 0,00</strong> e{' '}
              <strong className="text-white font-mono">Nenhum registro ainda</strong>, sem valores fictícios.
            </p>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* SEÇÃO 1: HOJE                                                    */}
      {/* ================================================================ */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-3 bg-[#C6FF00]" />
            <h2 className="text-xs font-mono uppercase tracking-widest text-white/70 font-bold">
              HOJE // {formatDateOnlyBR(boundaries.todayStr)}
            </h2>
          </div>
          <span className="text-[11px] font-mono text-white/40">
            MOVIMENTAÇÕES DO DIA ATUAL
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* RECEITA HOJE */}
          <div className="bg-[#111111] border border-white/10 p-4 hover:border-white/20 transition-colors">
            <div className="flex items-center justify-between text-white/50 mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider">
                RECEITA HOJE
              </span>
              <DollarSign className="w-4 h-4 text-[#C6FF00]" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
              {formatCurrencyBRL(todayRevenue)}
            </div>
            <div className="text-[11px] font-mono text-white/40 mt-1 flex items-center justify-between">
              <span>Somatório de sales.amount</span>
              <span className="text-[#C6FF00]">
                {todayRevenue > 0 ? 'Entrada ativa' : 'Sem vendas'}
              </span>
            </div>
          </div>

          {/* DESPESAS HOJE */}
          <div className="bg-[#111111] border border-white/10 p-4 hover:border-white/20 transition-colors">
            <div className="flex items-center justify-between text-white/50 mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider">
                DESPESAS HOJE
              </span>
              <DollarSign className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
              {formatCurrencyBRL(todayExpenses)}
            </div>
            <div className="text-[11px] font-mono text-white/40 mt-1 flex items-center justify-between">
              <span>Somatório de expenses.amount</span>
              <span className={todayExpenses > 0 ? 'text-rose-400' : 'text-white/40'}>
                {todayExpenses > 0 ? 'Débito registrado' : 'Sem despesa'}
              </span>
            </div>
          </div>

          {/* LUCRO HOJE */}
          <div className="bg-[#111111] border border-white/10 p-4 hover:border-white/20 transition-colors">
            <div className="flex items-center justify-between text-white/50 mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider">
                LUCRO HOJE
              </span>
              <TrendingUp
                className={`w-4 h-4 ${
                  todayProfit >= 0 ? 'text-[#C6FF00]' : 'text-rose-400'
                }`}
              />
            </div>
            <div
              className={`text-xl sm:text-2xl font-bold font-mono tracking-tight ${
                todayProfit > 0
                  ? 'text-[#C6FF00]'
                  : todayProfit < 0
                  ? 'text-rose-400'
                  : 'text-white'
              }`}
            >
              {formatCurrencyBRL(todayProfit)}
            </div>
            <div className="text-[11px] font-mono text-white/40 mt-1 flex items-center justify-between">
              <span>Receita - Despesas</span>
              <span className="text-white/60">
                {todayProfit > 0 ? 'Saldo positivo' : 'Equilíbrio / 0'}
              </span>
            </div>
          </div>

          {/* PROJETOS ATIVOS */}
          <div className="bg-[#111111] border border-white/10 p-4 hover:border-white/20 transition-colors">
            <div className="flex items-center justify-between text-white/50 mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider">
                PROJETOS ATIVOS
              </span>
              <Layers className="w-4 h-4 text-[#C6FF00]" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
              {state.projects.filter((p) => p.status === 'in_progress' || p.status === 'review').length}
            </div>
            <div className="text-[11px] font-mono text-white/40 mt-1 flex items-center justify-between">
              <span>Sprints em execução</span>
              <span className="text-[#C6FF00] font-bold">Operação ativa</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* SEÇÃO 2: ESTE MÊS (CARDS)                                        */}
      {/* ================================================================ */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-3 bg-white/70" />
            <h2 className="text-xs font-mono uppercase tracking-widest text-white/70 font-bold">
              ESTE MÊS // {monthNameUpper} {boundaries.year}
            </h2>
          </div>
          <span className="text-[11px] font-mono text-white/40">
            INDICADORES ACUMULADOS NO MÊS
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* RECEITA */}
          <div className="bg-[#111111] border border-white/10 p-4">
            <div className="text-[11px] font-mono uppercase text-white/40 mb-1.5">
              RECEITA
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-white">
              {formatCurrencyBRL(monthRevenue)}
            </div>
            <div className="text-[10px] font-mono text-white/40 mt-1">
              Faturamento bruto do mês
            </div>
          </div>

          {/* DESPESAS */}
          <div className="bg-[#111111] border border-white/10 p-4">
            <div className="text-[11px] font-mono uppercase text-white/40 mb-1.5">
              DESPESAS
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-white">
              {formatCurrencyBRL(monthExpenses)}
            </div>
            <div className="text-[10px] font-mono text-white/40 mt-1">
              Custos operacionais
            </div>
          </div>

          {/* LUCRO */}
          <div className="bg-[#111111] border border-white/10 p-4">
            <div className="text-[11px] font-mono uppercase text-white/40 mb-1.5">
              LUCRO
            </div>
            <div
              className={`text-lg sm:text-xl font-bold font-mono ${
                monthProfit > 0
                  ? 'text-[#C6FF00]'
                  : monthProfit < 0
                  ? 'text-rose-400'
                  : 'text-white'
              }`}
            >
              {formatCurrencyBRL(monthProfit)}
            </div>
            <div className="text-[10px] font-mono text-white/40 mt-1">
              Margem líquida do negócio
            </div>
          </div>

          {/* CLIENTES ATIVOS */}
          <div className="bg-[#111111] border border-white/10 p-4">
            <div className="text-[11px] font-mono uppercase text-white/40 mb-1.5 flex items-center justify-between">
              <span>CLIENTES ATIVOS</span>
              <Users className="w-3.5 h-3.5 text-white/40" />
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-white">
              {activeClientsCount}
            </div>
            <div className="text-[10px] font-mono text-white/40 mt-1">
              status = 'active'
            </div>
          </div>

          {/* NOVOS CLIENTES */}
          <div className="bg-[#111111] border border-white/10 p-4">
            <div className="text-[11px] font-mono uppercase text-white/40 mb-1.5 flex items-center justify-between">
              <span>NOVOS CLIENTES</span>
              <UserCheck className="w-3.5 h-3.5 text-[#C6FF00]" />
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-white">
              {newClientsThisMonth}
            </div>
            <div className="text-[10px] font-mono text-white/40 mt-1">
              Adicionados neste mês
            </div>
          </div>

          {/* TICKET MÉDIO */}
          <div className="bg-[#111111] border border-white/10 p-4">
            <div className="text-[11px] font-mono uppercase text-white/40 mb-1.5">
              TICKET MÉDIO
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-white">
              {formatCurrencyBRL(averageTicket)}
            </div>
            <div className="text-[10px] font-mono text-white/40 mt-1">
              {salesCount > 0 ? `${salesCount} vendas realizadas` : 'Sem vendas no mês'}
            </div>
          </div>

          {/* VENDAS */}
          <div className="bg-[#111111] border border-white/10 p-4">
            <div className="text-[11px] font-mono uppercase text-white/40 mb-1.5">
              VENDAS
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-white">
              {salesCount}
            </div>
            <div className="text-[10px] font-mono text-white/40 mt-1">
              Contratos & pedidos fechados
            </div>
          </div>

          {/* TOTAL PROJETOS */}
          <div className="bg-[#111111] border border-white/10 p-4">
            <div className="text-[11px] font-mono uppercase text-white/40 mb-1.5 flex items-center justify-between">
              <span>TOTAL PROJETOS</span>
              <Layers className="w-3.5 h-3.5 text-[#C6FF00]" />
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-white">
              {state.projects.length}
            </div>
            <div className="text-[10px] font-mono text-white/40 mt-1">
              Carteira operacional
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* SEÇÃO 3 & 4: DEMANDAS OPERACIONAIS & PIPELINE COMERCIAL          */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BLOCO: PROJETOS & SPRINT DELIVERY */}
        <div className="bg-[#111111] border border-white/10 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
              <div>
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#C6FF00]" />
                  <span>PROJETOS & SPRINT DELIVERY</span>
                </h3>
                <p className="text-[11px] text-white/40 font-sans mt-0.5">
                  Demandas e prazos operacionais da VULTO LAB
                </p>
              </div>

              <span className="text-xs font-mono px-2 py-0.5 bg-[#141414] border border-white/10 text-[#C6FF00] font-bold">
                {state.projects.filter((p) => p.status === 'in_progress' || p.status === 'review').length} ATIVOS
              </span>
            </div>

            {/* Grid de status rápido de projetos */}
            <div className="grid grid-cols-3 gap-2.5 mb-4">
              <div className="bg-[#141414] border border-white/5 p-3">
                <span className="text-[10px] font-mono uppercase text-white/40 block mb-1">
                  Em Andamento
                </span>
                <span className="text-base font-mono font-bold text-amber-400 block">
                  {state.projects.filter((p) => p.status === 'in_progress').length}
                </span>
              </div>
              <div className="bg-[#141414] border border-white/5 p-3">
                <span className="text-[10px] font-mono uppercase text-white/40 block mb-1">
                  Em Revisão
                </span>
                <span className="text-base font-mono font-bold text-cyan-400 block">
                  {state.projects.filter((p) => p.status === 'review').length}
                </span>
              </div>
              <div className="bg-[#141414] border border-white/5 p-3">
                <span className="text-[10px] font-mono uppercase text-white/40 block mb-1">
                  Entregues
                </span>
                <span className="text-base font-mono font-bold text-[#C6FF00] block">
                  {state.projects.filter((p) => p.status === 'delivered').length}
                </span>
              </div>
            </div>

            {/* Lista dos projetos mais recentes */}
            <div className="space-y-2">
              {state.projects.slice(0, 3).map((proj) => (
                <div
                  key={proj.id}
                  className="p-2.5 bg-[#141414] border border-white/5 flex items-center justify-between gap-3 text-xs font-mono"
                >
                  <div className="truncate flex-1">
                    <span className="text-white font-bold block truncate">{proj.title}</span>
                    <span className="text-[10px] text-white/40 block truncate">
                      {proj.clientName} • Sócio: {proj.leadPartner === 'pietro' ? 'Pietro' : 'Felipe'}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono text-[#C6FF00] font-bold block">
                      {proj.progressPercent}%
                    </span>
                    <span className="text-[9px] text-white/30 block">
                      {proj.status === 'in_progress' ? 'Em produção' : proj.status === 'delivered' ? 'Entregue' : 'Revisão'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-white/50">
            <span>
              Total de Demandas: <strong className="text-white">{state.projects.length}</strong>
            </span>
            <button
              onClick={() => onNavigateTab('projects')}
              className="text-[#C6FF00] hover:underline flex items-center gap-1 cursor-pointer font-bold"
            >
              <span>Ver Projetos & Entregas</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* BLOCO: FUNIL COMERCIAL */}
        <div className="bg-[#111111] border border-white/10 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
              <div>
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#C6FF00]" />
                  <span>FUNIL COMERCIAL (LEADS SUPABASE)</span>
                </h3>
                <p className="text-[11px] text-white/40 font-sans mt-0.5">
                  Distribuição por status na tabela leads
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono text-white/40 uppercase block">
                  Taxa de Conversão
                </span>
                <span className="text-sm font-mono font-bold text-[#C6FF00]">
                  {funnel.conversionRate.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Etapas do Funil com contagem real */}
            <div className="space-y-2">
              {[
                { label: 'LEAD', count: funnel.leadCount, color: 'bg-white/40' },
                { label: 'CONTATO', count: funnel.contatoCount, color: 'bg-white/60' },
                { label: 'PROPOSTA', count: funnel.propostaCount, color: 'bg-cyan-400' },
                { label: 'NEGOCIAÇÃO', count: funnel.negociacaoCount, color: 'bg-amber-400' },
                { label: 'FECHADO', count: funnel.fechadoCount, color: 'bg-[#C6FF00]' },
              ].map((stage, idx) => {
                const percentOfTotal =
                  funnel.totalLeads > 0
                    ? Math.round((stage.count / funnel.totalLeads) * 100)
                    : 0;

                return (
                  <div
                    key={idx}
                    className="p-2.5 bg-[#141414] border border-white/5 flex items-center justify-between gap-3 text-xs font-mono"
                  >
                    <div className="flex items-center gap-2.5 w-32 shrink-0">
                      <span className={`w-2 h-2 ${stage.color}`} />
                      <span className="text-white/80 font-bold">{stage.label}</span>
                    </div>

                    <div className="flex-1 bg-[#1A1A1A] h-1.5 overflow-hidden">
                      <div
                        className={`${stage.color} h-full transition-all`}
                        style={{ width: `${percentOfTotal}%` }}
                      />
                    </div>

                    <div className="w-20 text-right shrink-0">
                      <span className="text-white font-bold">{stage.count}</span>{' '}
                      <span className="text-white/30 text-[10px]">
                        ({percentOfTotal}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-white/50">
            <span>Total de Leads Registrados: <strong className="text-white">{funnel.totalLeads}</strong></span>
            <button
              onClick={() => onNavigateTab('finance')}
              className="text-[#C6FF00] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Ver Oportunidades & Propostas</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* SEÇÃO 5: GRÁFICO — RECEITA POR DIA NO MÊS ATUAL                  */}
      {/* ================================================================ */}
      <div className="bg-[#111111] border border-white/10 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-white/10 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-3 bg-[#C6FF00]" />
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                RECEITA POR DIA // {monthNameUpper} {boundaries.year}
              </h3>
            </div>
            <p className="text-[11px] text-white/40 font-sans mt-0.5">
              Evolução diária de vendas confirmadas (sales.amount)
            </p>
          </div>

          {/* Destaque do hover ou total */}
          <div className="text-left sm:text-right font-mono">
            {hoveredChartDay ? (
              <div>
                <span className="text-[10px] text-white/40 uppercase block">
                  Dia {hoveredChartDay.day} ({formatDateOnlyBR(hoveredChartDay.dateStr)})
                </span>
                <span className="text-sm font-bold text-[#C6FF00]">
                  {formatCurrencyBRL(hoveredChartDay.revenue)}
                </span>
              </div>
            ) : (
              <div>
                <span className="text-[10px] text-white/40 uppercase block">
                  Total Acumulado no Mês
                </span>
                <span className="text-sm font-bold text-[#C6FF00]">
                  {formatCurrencyBRL(monthRevenue)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Gráfico Minimalista VULTO LAB */}
        <div className="h-56 w-full pt-4 flex flex-col justify-end">
          <div className="h-44 flex items-end justify-between gap-1 sm:gap-1.5 px-1 border-b border-white/10 relative">
            {dailyChart.map((point) => {
              const heightPercent =
                point.revenue > 0
                  ? Math.max(12, (point.revenue / dailyChartMax) * 100)
                  : point.isToday
                  ? 4
                  : 2;

              return (
                <div
                  key={point.day}
                  onMouseEnter={() =>
                    setHoveredChartDay({
                      day: point.day,
                      dateStr: point.dateStr,
                      revenue: point.revenue,
                    })
                  }
                  onMouseLeave={() => setHoveredChartDay(null)}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                >
                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-[#161616] border border-white/20 px-2 py-1 text-[10px] font-mono text-white whitespace-nowrap z-20 pointer-events-none shadow-xl">
                    <span className="text-[#C6FF00] font-bold">
                      {formatCurrencyBRL(point.revenue)}
                    </span>
                    <span className="text-white/40 ml-1">({point.dayFormatted})</span>
                  </div>

                  {/* Barra do Dia */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[14px] transition-all duration-200 ${
                      point.revenue > 0
                        ? 'bg-[#C6FF00] group-hover:bg-[#d4ff33]'
                        : point.isToday
                        ? 'bg-white/40 group-hover:bg-white/60'
                        : point.isPastOrToday
                        ? 'bg-white/10 group-hover:bg-white/20'
                        : 'bg-white/5'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          {/* Eixo de Dias */}
          <div className="flex items-center justify-between text-[10px] font-mono text-white/40 pt-2 px-1">
            <span>Dia 01</span>
            <span>Dia 05</span>
            <span>Dia 10</span>
            <span>Dia 15</span>
            <span>Dia 20</span>
            <span>Dia 25</span>
            <span>Dia {boundaries.totalDaysInMonth}</span>
          </div>
        </div>

        {monthRevenue === 0 && (
          <div className="text-center py-3 text-xs font-mono text-white/40">
            Nenhuma receita registrada no mês atual até o momento.
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/* SEÇÃO 6 & 7: VENDAS RECENTES + ATIVIDADE RECENTE                 */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* VENDAS RECENTES (2 colunas) */}
        <div className="lg:col-span-2 bg-[#111111] border border-white/10 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
              <div>
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#C6FF00]" />
                  <span>VENDAS RECENTES (SALES)</span>
                </h3>
                <p className="text-[11px] text-white/40 font-sans mt-0.5">
                  Últimos contratos e faturamentos registrados no Supabase
                </p>
              </div>

              <span className="text-[10px] font-mono text-white/40">
                {recentSales.length} registros
              </span>
            </div>

            {recentSales.length === 0 ? (
              <div className="py-12 text-center text-xs font-mono text-white/40 bg-[#141414] border border-white/5">
                Nenhum registro ainda.
              </div>
            ) : (
              <div className="space-y-2">
                {/* Desktop Table Header */}
                <div className="hidden md:grid grid-cols-12 gap-2 text-[10px] font-mono uppercase text-white/40 px-3 py-1.5 border-b border-white/5">
                  <span className="col-span-3">Cliente</span>
                  <span className="col-span-3">Serviço</span>
                  <span className="col-span-2">Responsável</span>
                  <span className="col-span-2 text-right">Valor</span>
                  <span className="col-span-1 text-center">Data</span>
                  <span className="col-span-1 text-right">Status</span>
                </div>

                {recentSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="p-3 bg-[#141414] border border-white/5 hover:border-white/20 transition-colors flex flex-col md:grid md:grid-cols-12 gap-2 items-start md:items-center text-xs font-mono"
                  >
                    {/* Cliente */}
                    <div className="md:col-span-3 font-bold text-white truncate w-full">
                      {sale.clientName}
                    </div>

                    {/* Serviço */}
                    <div className="md:col-span-3 text-white/60 truncate w-full text-[11px]">
                      {sale.serviceName}
                    </div>

                    {/* Responsável */}
                    <div className="md:col-span-2 text-white/40 truncate w-full text-[11px]">
                      {sale.ownerName}
                    </div>

                    {/* Valor */}
                    <div className="md:col-span-2 text-white font-bold md:text-right w-full">
                      {formatCurrencyBRL(sale.amount)}
                    </div>

                    {/* Data */}
                    <div className="md:col-span-1 text-white/40 md:text-center text-[10px]">
                      {formatDateOnlyBR(sale.date)}
                    </div>

                    {/* Status */}
                    <div className="md:col-span-1 md:text-right">
                      <span
                        className={`text-[9px] uppercase px-1.5 py-0.5 font-bold ${
                          sale.status === 'completed'
                            ? 'bg-[#C6FF00]/10 text-[#C6FF00] border border-[#C6FF00]/30'
                            : sale.status === 'pending'
                            ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30'
                            : 'bg-white/10 text-white/60'
                        }`}
                      >
                        {sale.status === 'completed'
                          ? 'Concluída'
                          : sale.status === 'pending'
                          ? 'Pendente'
                          : sale.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-[11px] font-mono">
            <span className="text-white/40">
              Registros ordenados por data decrescente
            </span>
            <button
              onClick={() => onNavigateTab('finance')}
              className="text-[#C6FF00] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Ver Todas as Transações</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* ATIVIDADE RECENTE (1 coluna) */}
        <div className="bg-[#111111] border border-white/10 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
              <div>
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#C6FF00]" />
                  <span>ATIVIDADE RECENTE</span>
                </h3>
                <p className="text-[11px] text-white/40 font-sans mt-0.5">
                  Logs da tabela activities
                </p>
              </div>

              <span className="text-[10px] font-mono text-white/40">
                {recentActivities.length} logs
              </span>
            </div>

            {recentActivities.length === 0 ? (
              <div className="py-12 text-center text-xs font-mono text-white/40 bg-[#141414] border border-white/5">
                Nenhum registro ainda.
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentActivities.map((act) => (
                  <div
                    key={act.id}
                    className="p-2.5 bg-[#141414] border border-white/5 hover:border-white/20 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-white/40 mb-1">
                      <span className="text-[#C6FF00] font-bold">
                        {act.userName}
                      </span>
                      <span>{formatDateTimeBR(act.created_at)}</span>
                    </div>
                    <p className="text-xs font-mono text-white/80 leading-snug">
                      {act.description || act.action}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-white/40">
            <span>Sincronização contínua</span>
            <button
              onClick={() => onNavigateTab('reports')}
              className="text-[#C6FF00] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Ver Relatórios</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
