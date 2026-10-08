import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface DashboardSalesItem {
  id: string;
  client_id: string | null;
  service_id: string | null;
  owner_id: string | null;
  amount: number;
  status: string;
  date: string;
  notes: string | null;
  created_at: string;
  clientName: string;
  serviceName: string;
  ownerName: string;
}

export interface DashboardExpenseItem {
  id: string;
  category: string;
  amount: number;
  date: string;
  description: string | null;
  created_at: string;
}

export interface DashboardGoalItem {
  id: string;
  type: 'daily' | 'monthly' | string;
  target_amount: number;
  start_date: string;
  end_date: string;
}

export interface DashboardLeadItem {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  status: 'LEAD' | 'CONTATO' | 'PROPOSTA' | 'NEGOCIACAO' | 'FECHADO' | 'PERDIDO' | string;
  value: number | null;
  created_at: string;
}

export interface DashboardActivityItem {
  id: string;
  user_id: string | null;
  action: string;
  description: string;
  created_at: string;
  userName: string;
}

export interface DailyRevenueChartPoint {
  day: number;
  dayFormatted: string;
  dateStr: string;
  revenue: number;
  isToday: boolean;
  isPastOrToday: boolean;
}

export interface CommercialFunnelData {
  leadCount: number;
  contatoCount: number;
  propostaCount: number;
  negociacaoCount: number;
  fechadoCount: number;
  totalLeads: number;
  conversionRate: number; // percentage 0-100
}

export interface MonthlyGoalProgress {
  target: number;
  achieved: number;
  remaining: number;
  percentage: number;
  daysRemaining: number;
  dailyRequired: number;
}

export interface DailyGoalProgress {
  target: number;
  achieved: number;
  percentage: number;
}

export interface DashboardOverviewRealData {
  isLoading: boolean;
  isConfigured: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // HOJE
  todayRevenue: number;
  todayExpenses: number;
  todayProfit: number;
  todayGoal: DailyGoalProgress;

  // ESTE MÊS
  monthRevenue: number;
  monthExpenses: number;
  monthProfit: number;
  activeClientsCount: number;
  newClientsThisMonth: number;
  averageTicket: number;
  salesCount: number;
  monthGoalTarget: number;

  // META MENSAL DETALHADA
  monthlyGoalProgress: MonthlyGoalProgress;

  // FUNIL COMERCIAL
  funnel: CommercialFunnelData;

  // GRÁFICO DIÁRIO
  dailyChart: DailyRevenueChartPoint[];
  dailyChartMax: number;

  // LISTAS
  recentSales: DashboardSalesItem[];
  recentActivities: DashboardActivityItem[];

  // ESTADO GERAL
  isEmptyDatabase: boolean;
}

/**
 * Format currency in BRL standard: R$ 1.250,00
 */
export function formatCurrencyBRL(val: number): string {
  if (isNaN(val) || !isFinite(val)) return 'R$ 0,00';
  return val.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format relative or localized date/time
 */
export function formatDateTimeBR(dateStr?: string | null): string {
  if (!dateStr) return 'Data não informada';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    // If within 24 hours
    if (diffHours >= 0 && diffHours < 24 && d.getDate() === now.getDate()) {
      return `Hoje às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.getDate() === yesterday.getDate() && d.getMonth() === yesterday.getMonth() && d.getFullYear() === yesterday.getFullYear()) {
      return `Ontem às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }

    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format short date: DD/MM/AAAA
 */
export function formatDateOnlyBR(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    // If format is YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
}

/**
 * Helper to get date boundaries for current month and day
 */
export function getMonthDateBoundaries() {
  const now = new Date();
  const year = now.getFullYear();
  const monthNum = now.getMonth() + 1;
  const monthStr = String(monthNum).padStart(2, '0');
  const dayNum = now.getDate();
  const dayStr = String(dayNum).padStart(2, '0');

  const todayStr = `${year}-${monthStr}-${dayStr}`;
  const firstDayStr = `${year}-${monthStr}-01`;

  const lastDateObj = new Date(year, monthNum, 0);
  const totalDaysInMonth = lastDateObj.getDate();
  const lastDayStr = `${year}-${monthStr}-${String(totalDaysInMonth).padStart(2, '0')}`;

  const daysRemaining = Math.max(0, totalDaysInMonth - dayNum);

  return {
    year,
    monthNum,
    monthStr,
    dayNum,
    todayStr,
    firstDayStr,
    lastDayStr,
    totalDaysInMonth,
    daysRemaining,
  };
}

/**
 * Fetches all real Supabase dashboard data in optimized, parallel queries
 */
export async function fetchRealDashboardOverview(): Promise<DashboardOverviewRealData> {
  const boundaries = getMonthDateBoundaries();
  const { todayStr, firstDayStr, lastDayStr, totalDaysInMonth, dayNum, daysRemaining } = boundaries;

  if (!isSupabaseConfigured) {
    return getEmptyState(boundaries, 'Configurações VITE_SUPABASE_URL ou chave ausentes.');
  }

  try {
    // 1. Fetch tables in parallel using Promise.all to minimize latency
    const [
      salesRes,
      expensesRes,
      goalsRes,
      clientsRes,
      leadsRes,
      activitiesRes,
      profilesRes,
      servicesRes,
    ] = await Promise.all([
      // Sales for current month + recent
      supabase
        .from('sales')
        .select('*')
        .order('date', { ascending: false }),

      // Expenses for current month
      supabase
        .from('expenses')
        .select('*')
        .gte('date', firstDayStr)
        .lte('date', lastDayStr)
        .order('date', { ascending: false }),

      // Goals (daily and monthly)
      supabase
        .from('goals')
        .select('*'),

      // Clients
      supabase
        .from('clients')
        .select('*'),

      // Leads for commercial funnel
      supabase
        .from('leads')
        .select('*'),

      // Activities
      supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10),

      // Profiles (for mapping owner IDs to names)
      supabase
        .from('profiles')
        .select('id, full_name, email'),

      // Services (for mapping service IDs to names)
      supabase
        .from('services')
        .select('id, name'),
    ]);

    // Handle lookup maps safely
    const profileMap = new Map<string, string>();
    if (profilesRes.data) {
      for (const p of profilesRes.data) {
        profileMap.set(p.id, p.full_name || p.email || 'Admin');
      }
    }

    const serviceMap = new Map<string, string>();
    if (servicesRes.data) {
      for (const s of servicesRes.data) {
        serviceMap.set(s.id, s.name);
      }
    }

    const clientMap = new Map<string, string>();
    if (clientsRes.data) {
      for (const c of clientsRes.data) {
        clientMap.set(c.id, c.name || c.company || 'Cliente');
      }
    }

    // Sales data
    const allSales = (salesRes.data || []) as Array<{
      id: string;
      client_id: string | null;
      service_id: string | null;
      owner_id: string | null;
      amount: number | string;
      status: string;
      date: string;
      notes: string | null;
      created_at: string;
    }>;

    // Filter valid sales for this month (excluding cancelled)
    const monthSales = allSales.filter((s) => {
      const sDate = s.date;
      return sDate >= firstDayStr && sDate <= lastDayStr && s.status !== 'cancelled';
    });

    // Today sales
    const todaySales = allSales.filter((s) => {
      return s.date === todayStr && s.status !== 'cancelled';
    });

    const todayRevenue = todaySales.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
    const monthRevenue = monthSales.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
    const salesCount = monthSales.length;
    const averageTicket = salesCount > 0 ? monthRevenue / salesCount : 0;

    // Expenses data
    const allExpenses = (expensesRes.data || []) as Array<{
      id: string;
      category: string;
      amount: number | string;
      date: string;
      description: string | null;
      created_at: string;
    }>;

    const todayExpensesList = allExpenses.filter((e) => e.date === todayStr);
    const todayExpenses = todayExpensesList.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const monthExpenses = allExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

    const todayProfit = todayRevenue - todayExpenses;
    const monthProfit = monthRevenue - monthExpenses;

    // Goals data
    const allGoals = (goalsRes.data || []) as Array<{
      id: string;
      type: string;
      target_amount: number | string;
      start_date: string;
      end_date: string;
    }>;

    // Daily Goal
    const dailyGoalObj = allGoals.find((g) => {
      if (g.type !== 'daily') return false;
      return (
        g.start_date === todayStr ||
        (g.start_date <= todayStr && g.end_date >= todayStr)
      );
    });

    const todayGoalTarget = dailyGoalObj ? Number(dailyGoalObj.target_amount) || 0 : 0;
    const todayGoalPercent =
      todayGoalTarget > 0 ? (todayRevenue / todayGoalTarget) * 100 : 0;

    // Monthly Goal
    const monthlyGoalObj = allGoals.find((g) => {
      if (g.type !== 'monthly') return false;
      // Either exact month range or active today
      return (
        (g.start_date <= todayStr && g.end_date >= todayStr) ||
        (g.start_date >= firstDayStr && g.start_date <= lastDayStr)
      );
    });

    const monthGoalTarget = monthlyGoalObj
      ? Number(monthlyGoalObj.target_amount) || 0
      : 0;

    const remainingToTarget = Math.max(monthGoalTarget - monthRevenue, 0);
    const monthGoalPercent =
      monthGoalTarget > 0 ? (monthRevenue / monthGoalTarget) * 100 : 0;
    const dailyRequired =
      daysRemaining > 0 ? remainingToTarget / daysRemaining : remainingToTarget;

    // Clients
    const allClients = (clientsRes.data || []) as Array<{
      id: string;
      name: string;
      company: string | null;
      status: string;
      created_at: string;
    }>;

    const activeClientsCount = allClients.filter(
      (c) => c.status === 'active' || c.status === 'ativo'
    ).length;

    const newClientsThisMonth = allClients.filter((c) => {
      return c.created_at && c.created_at >= `${firstDayStr}T00:00:00Z`;
    }).length;

    // Commercial Funnel (Leads)
    const allLeads = (leadsRes.data || []) as Array<{
      id: string;
      name: string;
      company: string | null;
      status: string;
      value: number | string | null;
    }>;

    let leadCount = 0;
    let contatoCount = 0;
    let propostaCount = 0;
    let negociacaoCount = 0;
    let fechadoCount = 0;

    for (const l of allLeads) {
      const rawStatus = (l.status || '').toUpperCase().trim();
      if (rawStatus === 'LEAD') leadCount++;
      else if (rawStatus === 'CONTATO') contatoCount++;
      else if (rawStatus === 'PROPOSTA') propostaCount++;
      else if (rawStatus === 'NEGOCIACAO' || rawStatus === 'NEGOCIAÇÃO') negociacaoCount++;
      else if (rawStatus === 'FECHADO') fechadoCount++;
    }

    const totalLeads = allLeads.length;
    const conversionRate = totalLeads > 0 ? (fechadoCount / totalLeads) * 100 : 0;

    // Daily Chart: Revenue per day in current month
    // Map of sales by day
    const revenueByDayMap = new Map<string, number>();
    for (const s of monthSales) {
      const dayKey = s.date;
      const cur = revenueByDayMap.get(dayKey) || 0;
      revenueByDayMap.set(dayKey, cur + (Number(s.amount) || 0));
    }

    const dailyChart: DailyRevenueChartPoint[] = [];
    let maxDailyRev = 0;

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dayFormatted = String(day).padStart(2, '0');
      const dateStr = `${boundaries.year}-${boundaries.monthStr}-${dayFormatted}`;
      const rev = revenueByDayMap.get(dateStr) || 0;
      if (rev > maxDailyRev) maxDailyRev = rev;

      dailyChart.push({
        day,
        dayFormatted,
        dateStr,
        revenue: rev,
        isToday: dateStr === todayStr,
        isPastOrToday: day <= dayNum,
      });
    }

    // Recent Sales
    const recentSales: DashboardSalesItem[] = allSales.slice(0, 7).map((s) => ({
      id: s.id,
      client_id: s.client_id,
      service_id: s.service_id,
      owner_id: s.owner_id,
      amount: Number(s.amount) || 0,
      status: s.status || 'completed',
      date: s.date,
      notes: s.notes,
      created_at: s.created_at,
      clientName: (s.client_id && clientMap.get(s.client_id)) || 'Cliente Direto',
      serviceName: (s.service_id && serviceMap.get(s.service_id)) || 'Serviço Avulso',
      ownerName: (s.owner_id && profileMap.get(s.owner_id)) || 'Vulto Team',
    }));

    // Recent Activities
    const allActivities = (activitiesRes.data || []) as Array<{
      id: string;
      user_id: string | null;
      action: string;
      description: string;
      created_at: string;
    }>;

    const recentActivities: DashboardActivityItem[] = allActivities.slice(0, 8).map((a) => ({
      id: a.id,
      user_id: a.user_id,
      action: a.action || 'Ação',
      description: a.description || '',
      created_at: a.created_at,
      userName: (a.user_id && profileMap.get(a.user_id)) || 'Administrador',
    }));

    const isEmptyDatabase =
      allSales.length === 0 &&
      allExpenses.length === 0 &&
      allClients.length === 0 &&
      allLeads.length === 0;

    return {
      isLoading: false,
      isConfigured: true,
      error: null,
      lastUpdated: new Date(),

      todayRevenue,
      todayExpenses,
      todayProfit,
      todayGoal: {
        target: todayGoalTarget,
        achieved: todayRevenue,
        percentage: todayGoalPercent,
      },

      monthRevenue,
      monthExpenses,
      monthProfit,
      activeClientsCount,
      newClientsThisMonth,
      averageTicket,
      salesCount,
      monthGoalTarget,

      monthlyGoalProgress: {
        target: monthGoalTarget,
        achieved: monthRevenue,
        remaining: remainingToTarget,
        percentage: monthGoalPercent,
        daysRemaining,
        dailyRequired,
      },

      funnel: {
        leadCount,
        contatoCount,
        propostaCount,
        negociacaoCount,
        fechadoCount,
        totalLeads,
        conversionRate,
      },

      dailyChart,
      dailyChartMax: maxDailyRev,

      recentSales,
      recentActivities,
      isEmptyDatabase,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Falha ao sincronizar com Supabase';
    console.error('Erro ao buscar dados do dashboard:', err);
    return getEmptyState(boundaries, errorMsg);
  }
}

/**
 * Empty fallback state when database is clean or unconfigured
 */
function getEmptyState(
  boundaries: ReturnType<typeof getMonthDateBoundaries>,
  error: string | null
): DashboardOverviewRealData {
  const { todayStr, totalDaysInMonth, dayNum, daysRemaining } = boundaries;

  const dailyChart: DailyRevenueChartPoint[] = [];
  for (let day = 1; day <= totalDaysInMonth; day++) {
    const dayFormatted = String(day).padStart(2, '0');
    const dateStr = `${boundaries.year}-${boundaries.monthStr}-${dayFormatted}`;
    dailyChart.push({
      day,
      dayFormatted,
      dateStr,
      revenue: 0,
      isToday: dateStr === todayStr,
      isPastOrToday: day <= dayNum,
    });
  }

  return {
    isLoading: false,
    isConfigured: isSupabaseConfigured,
    error,
    lastUpdated: new Date(),

    todayRevenue: 0,
    todayExpenses: 0,
    todayProfit: 0,
    todayGoal: {
      target: 0,
      achieved: 0,
      percentage: 0,
    },

    monthRevenue: 0,
    monthExpenses: 0,
    monthProfit: 0,
    activeClientsCount: 0,
    newClientsThisMonth: 0,
    averageTicket: 0,
    salesCount: 0,
    monthGoalTarget: 0,

    monthlyGoalProgress: {
      target: 0,
      achieved: 0,
      remaining: 0,
      percentage: 0,
      daysRemaining,
      dailyRequired: 0,
    },

    funnel: {
      leadCount: 0,
      contatoCount: 0,
      propostaCount: 0,
      negociacaoCount: 0,
      fechadoCount: 0,
      totalLeads: 0,
      conversionRate: 0,
    },

    dailyChart,
    dailyChartMax: 0,

    recentSales: [],
    recentActivities: [],
    isEmptyDatabase: true,
  };
}
