import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { logActivity } from './crmService';

export interface GoalRecord {
  id: string;
  type: 'monthly' | 'daily' | 'quarterly' | 'yearly' | string;
  target_amount: number;
  start_date: string;
  end_date: string;
  title: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoalServiceTarget {
  id: string;
  goal_id: string;
  service_id: string | null;
  service_name: string;
  target_quantity: number;
  unit_price: number;
  total_expected: number;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ServicePerformanceComparison {
  serviceId: string | null;
  serviceName: string;
  targetQuantity: number;
  unitPrice: number;
  totalPlanned: number;
  realizedQuantity: number;
  realizedAmount: number;
  progressPercent: number;
  quantityDiff: number;
  amountDiff: number;
}

export interface MonthlyGoalCalculations {
  monthlyGoal: GoalRecord | null;
  dailyGoal: GoalRecord | null;
  targetAmount: number;
  realizedAmount: number;
  remainingAmount: number;
  percentage: number;
  daysPassed: number;
  totalDays: number;
  daysRemaining: number;
  dailyRequired: number;
  currentDailyAverage: number;
  projectedEndMonthAmount: number;
  projectionDifference: number;
  isProjectedToBeatGoal: boolean;
}

export interface GoalsModuleData {
  isLoading: boolean;
  isConfigured: boolean;
  error: string | null;
  monthlyGoal: GoalRecord | null;
  dailyGoal: GoalRecord | null;
  serviceTargets: GoalServiceTarget[];
  serviceComparisons: ServicePerformanceComparison[];
  calculations: MonthlyGoalCalculations;
  availableServices: Array<{ id: string; name: string; price: number }>;
  historicalGoals: Array<{
    id: string;
    monthFormatted: string;
    targetAmount: number;
    realizedAmount: number;
    percentage: number;
    salesCount: number;
  }>;
}

/**
 * Helper to get dates for month and day
 */
export function getGoalBoundaries(customDate?: Date) {
  const d = customDate || new Date();
  const year = d.getFullYear();
  const monthNum = d.getMonth() + 1;
  const monthStr = String(monthNum).padStart(2, '0');
  const dayNum = d.getDate();
  const dayStr = String(dayNum).padStart(2, '0');

  const todayStr = `${year}-${monthStr}-${dayStr}`;
  const firstDayStr = `${year}-${monthStr}-01`;

  const lastDayObj = new Date(year, monthNum, 0);
  const totalDaysInMonth = lastDayObj.getDate();
  const lastDayStr = `${year}-${monthStr}-${String(totalDaysInMonth).padStart(2, '0')}`;

  const daysRemaining = Math.max(0, totalDaysInMonth - dayNum);
  const daysPassed = Math.max(1, dayNum);

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
    daysPassed,
  };
}

/**
 * Fetch all data for the Goals & Commercial Planning module
 */
export async function fetchGoalsModuleData(targetDate?: Date): Promise<GoalsModuleData> {
  const boundaries = getGoalBoundaries(targetDate);
  const { todayStr, firstDayStr, lastDayStr, totalDaysInMonth, daysRemaining, daysPassed } = boundaries;

  if (!isSupabaseConfigured) {
    return {
      isLoading: false,
      isConfigured: false,
      error: 'Supabase não configurado. Verifique as variáveis de ambiente.',
      monthlyGoal: null,
      dailyGoal: null,
      serviceTargets: [],
      serviceComparisons: [],
      calculations: getEmptyCalculations(boundaries),
      availableServices: [],
      historicalGoals: [],
    };
  }

  try {
    // 1. Parallel fetch of goals, sales, services, and service targets
    const [goalsRes, salesRes, servicesRes] = await Promise.all([
      supabase.from('goals').select('*').order('created_at', { ascending: false }),
      supabase.from('sales').select('*').order('date', { ascending: false }),
      supabase.from('services').select('id, name, price, active').order('name'),
    ]);

    const allGoals = (goalsRes.data || []) as GoalRecord[];
    const allSales = (salesRes.data || []) as Array<{
      id: string;
      amount: number;
      service_id: string | null;
      date: string;
      status: string;
    }>;

    // Filter sales for the current month
    const monthSales = allSales.filter(
      (s) => s.date >= firstDayStr && s.date <= lastDayStr && s.status !== 'cancelled'
    );
    const monthRealized = monthSales.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);

    // Sales for today
    const todaySales = allSales.filter(
      (s) => s.date === todayStr && s.status !== 'cancelled'
    );
    const todayRealized = todaySales.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);

    // Find current monthly goal
    const monthlyGoal =
      allGoals.find(
        (g) =>
          g.type === 'monthly' &&
          ((g.start_date <= todayStr && g.end_date >= todayStr) ||
            (g.start_date >= firstDayStr && g.start_date <= lastDayStr))
      ) || null;

    // Find current daily goal
    const dailyGoal =
      allGoals.find((g) => g.type === 'daily' && g.start_date === todayStr) || null;

    // Fetch service targets for the current monthly goal
    let serviceTargets: GoalServiceTarget[] = [];
    if (monthlyGoal) {
      const { data: stData, error: stErr } = await supabase
        .from('goal_service_targets')
        .select('*')
        .eq('goal_id', monthlyGoal.id)
        .order('created_at', { ascending: true });

      if (!stErr && stData) {
        serviceTargets = stData as GoalServiceTarget[];
      }
    }

    // Available services catalog
    const availableServices = ((servicesRes.data || []) as Array<{
      id: string;
      name: string;
      price: number;
      active?: boolean;
    }>).map((s) => ({
      id: s.id,
      name: s.name,
      price: Number(s.price) || 0,
    }));

    // 2. Perform Calculations
    const targetAmount = monthlyGoal ? Number(monthlyGoal.target_amount) || 0 : 0;
    const remainingAmount = Math.max(0, targetAmount - monthRealized);
    const percentage = targetAmount > 0 ? (monthRealized / targetAmount) * 100 : 0;
    const dailyRequired =
      daysRemaining > 0 ? remainingAmount / daysRemaining : remainingAmount;

    // Projeção baseada na média diária atual
    const currentDailyAverage = daysPassed > 0 ? monthRealized / daysPassed : 0;
    const projectedEndMonthAmount = monthRealized + currentDailyAverage * daysRemaining;
    const projectionDifference = projectedEndMonthAmount - targetAmount;
    const isProjectedToBeatGoal = projectedEndMonthAmount >= targetAmount;

    const calculations: MonthlyGoalCalculations = {
      monthlyGoal,
      dailyGoal,
      targetAmount,
      realizedAmount: monthRealized,
      remainingAmount,
      percentage,
      daysPassed,
      totalDays: totalDaysInMonth,
      daysRemaining,
      dailyRequired,
      currentDailyAverage,
      projectedEndMonthAmount,
      projectionDifference,
      isProjectedToBeatGoal,
    };

    // 3. Service Performance Comparison (Planned vs Realized)
    const serviceSalesAgg = new Map<string, { count: number; total: number }>();
    for (const sale of monthSales) {
      const key = sale.service_id || 'unknown';
      const existing = serviceSalesAgg.get(key) || { count: 0, total: 0 };
      existing.count += 1;
      existing.total += Number(sale.amount) || 0;
      serviceSalesAgg.set(key, existing);
    }

    const serviceComparisons: ServicePerformanceComparison[] = serviceTargets.map((st) => {
      const matchKey = st.service_id || 'none';
      const realized = serviceSalesAgg.get(matchKey) || { count: 0, total: 0 };
      const plannedTotal = Number(st.total_expected) || st.target_quantity * st.unit_price;
      const progress = plannedTotal > 0 ? (realized.total / plannedTotal) * 100 : 0;

      return {
        serviceId: st.service_id,
        serviceName: st.service_name,
        targetQuantity: st.target_quantity,
        unitPrice: st.unit_price,
        totalPlanned: plannedTotal,
        realizedQuantity: realized.count,
        realizedAmount: realized.total,
        progressPercent: progress,
        quantityDiff: realized.count - st.target_quantity,
        amountDiff: realized.total - plannedTotal,
      };
    });

    // 4. Historical Goals list (past monthly goals)
    const historicalMonthlyGoals = allGoals.filter((g) => g.type === 'monthly');
    const historicalGoals = historicalMonthlyGoals.map((hg) => {
      // Find sales in this goal's range
      const hSales = allSales.filter(
        (s) =>
          s.date >= hg.start_date &&
          s.date <= hg.end_date &&
          s.status !== 'cancelled'
      );
      const hRealized = hSales.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
      const hTarget = Number(hg.target_amount) || 0;
      const hPercent = hTarget > 0 ? (hRealized / hTarget) * 100 : 0;

      const dateObj = new Date(`${hg.start_date}T12:00:00Z`);
      const monthFormatted = !isNaN(dateObj.getTime())
        ? dateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
        : hg.start_date;

      return {
        id: hg.id,
        monthFormatted: monthFormatted.charAt(0).toUpperCase() + monthFormatted.slice(1),
        targetAmount: hTarget,
        realizedAmount: hRealized,
        percentage: hPercent,
        salesCount: hSales.length,
      };
    });

    return {
      isLoading: false,
      isConfigured: true,
      error: null,
      monthlyGoal,
      dailyGoal,
      serviceTargets,
      serviceComparisons,
      calculations,
      availableServices,
      historicalGoals,
    };
  } catch (err: any) {
    console.error('Erro ao buscar dados de metas:', err);
    return {
      isLoading: false,
      isConfigured: true,
      error: err?.message || 'Falha ao carregar metas.',
      monthlyGoal: null,
      dailyGoal: null,
      serviceTargets: [],
      serviceComparisons: [],
      calculations: getEmptyCalculations(boundaries),
      availableServices: [],
      historicalGoals: [],
    };
  }
}

function getEmptyCalculations(boundaries: ReturnType<typeof getGoalBoundaries>): MonthlyGoalCalculations {
  return {
    monthlyGoal: null,
    dailyGoal: null,
    targetAmount: 0,
    realizedAmount: 0,
    remainingAmount: 0,
    percentage: 0,
    daysPassed: boundaries.daysPassed,
    totalDays: boundaries.totalDaysInMonth,
    daysRemaining: boundaries.daysRemaining,
    dailyRequired: 0,
    currentDailyAverage: 0,
    projectedEndMonthAmount: 0,
    projectionDifference: 0,
    isProjectedToBeatGoal: false,
  };
}

/**
 * Save or update monthly goal
 */
export async function saveMonthlyGoal(data: {
  id?: string;
  target_amount: number;
  start_date: string;
  end_date: string;
  title?: string;
  notes?: string;
  serviceTargets?: Array<{
    service_id: string | null;
    service_name: string;
    target_quantity: number;
    unit_price: number;
    notes?: string;
  }>;
}) {
  if (!isSupabaseConfigured) throw new Error('Supabase não conectado.');

  let goalId = data.id;

  if (goalId) {
    const { error } = await supabase
      .from('goals')
      .update({
        target_amount: data.target_amount,
        start_date: data.start_date,
        end_date: data.end_date,
        title: data.title || 'Meta Mensal',
        notes: data.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', goalId);

    if (error) throw error;
  } else {
    const { data: newGoal, error } = await supabase
      .from('goals')
      .insert({
        type: 'monthly',
        target_amount: data.target_amount,
        start_date: data.start_date,
        end_date: data.end_date,
        title: data.title || 'Meta Mensal',
        notes: data.notes || null,
      })
      .select('id')
      .single();

    if (error) throw error;
    goalId = newGoal.id;
  }

  // Handle service targets if provided
  if (data.serviceTargets && goalId) {
    // Clean and replace service targets for this goal
    await supabase.from('goal_service_targets').delete().eq('goal_id', goalId);

    if (data.serviceTargets.length > 0) {
      const inserts = data.serviceTargets.map((st) => ({
        goal_id: goalId,
        service_id: st.service_id,
        service_name: st.service_name,
        target_quantity: st.target_quantity,
        unit_price: st.unit_price,
        notes: st.notes || null,
      }));

      const { error: insErr } = await supabase.from('goal_service_targets').insert(inserts);
      if (insErr) {
        console.error('Aviso: erro ao salvar alvos por serviço:', insErr);
      }
    }
  }

  await logActivity(
    'ATUALIZOU_META_MENSAL',
    `Definiu meta mensal de R$ ${data.target_amount.toLocaleString('pt-BR')}`
  );

  return goalId;
}

/**
 * Save or update daily goal
 */
export async function saveDailyGoal(data: {
  id?: string;
  target_amount: number;
  date: string;
  notes?: string;
}) {
  if (!isSupabaseConfigured) throw new Error('Supabase não conectado.');

  if (data.id) {
    const { error } = await supabase
      .from('goals')
      .update({
        target_amount: data.target_amount,
        notes: data.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.id);

    if (error) throw error;
  } else {
    const { error } = await supabase.from('goals').insert({
      type: 'daily',
      target_amount: data.target_amount,
      start_date: data.date,
      end_date: data.date,
      title: 'Meta do Dia',
      notes: data.notes || null,
    });

    if (error) throw error;
  }

  await logActivity(
    'ATUALIZOU_META_DIARIA',
    `Definiu meta diária de R$ ${data.target_amount.toLocaleString('pt-BR')} para ${data.date}`
  );
}

/**
 * Automatically calculate and set daily goal
 * Formula: restante da meta mensal / dias restantes
 */
export async function calculateAndSetDailyGoalAutomatically() {
  const boundaries = getGoalBoundaries();
  const { todayStr, firstDayStr, lastDayStr, daysRemaining } = boundaries;

  if (daysRemaining <= 0) {
    throw new Error('Não há dias restantes no mês corrente para cálculo automático.');
  }

  // 1. Fetch current monthly goal
  const { data: monthlyGoal, error: mErr } = await supabase
    .from('goals')
    .select('*')
    .eq('type', 'monthly')
    .lte('start_date', todayStr)
    .gte('end_date', todayStr)
    .maybeSingle();

  if (mErr) throw mErr;
  if (!monthlyGoal) {
    throw new Error('Não foi encontrada uma meta mensal ativa para calcular a diária.');
  }

  // 2. Fetch sales so far
  const { data: sales, error: sErr } = await supabase
    .from('sales')
    .select('amount, status')
    .gte('date', firstDayStr)
    .lte('date', lastDayStr);

  if (sErr) throw sErr;

  const realized = (sales || [])
    .filter((s) => s.status !== 'cancelled')
    .reduce((acc, s) => acc + (Number(s.amount) || 0), 0);

  const remaining = Math.max(0, Number(monthlyGoal.target_amount) - realized);
  const autoDailyTarget = Math.round(remaining / daysRemaining);

  // 3. Upsert today's daily goal
  const { data: existingDaily } = await supabase
    .from('goals')
    .select('id')
    .eq('type', 'daily')
    .eq('start_date', todayStr)
    .maybeSingle();

  if (existingDaily) {
    await supabase
      .from('goals')
      .update({
        target_amount: autoDailyTarget,
        notes: `Calculada automaticamente: R$ ${remaining.toLocaleString('pt-BR')} restantes / ${daysRemaining} dias`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingDaily.id);
  } else {
    await supabase.from('goals').insert({
      type: 'daily',
      target_amount: autoDailyTarget,
      start_date: todayStr,
      end_date: todayStr,
      title: 'Meta do Dia (Automática)',
      notes: `Calculada automaticamente: R$ ${remaining.toLocaleString('pt-BR')} restantes / ${daysRemaining} dias`,
    });
  }

  await logActivity(
    'CALCULOU_META_DIARIA_AUTO',
    `Meta diária ajustada para R$ ${autoDailyTarget.toLocaleString('pt-BR')} (${daysRemaining} dias restantes)`
  );

  return autoDailyTarget;
}

/**
 * Add or update single service target inside a goal
 */
export async function upsertServiceTarget(data: {
  id?: string;
  goal_id: string;
  service_id: string | null;
  service_name: string;
  target_quantity: number;
  unit_price: number;
  notes?: string;
}) {
  if (!isSupabaseConfigured) throw new Error('Supabase não conectado.');

  if (data.id) {
    const { error } = await supabase
      .from('goal_service_targets')
      .update({
        service_id: data.service_id,
        service_name: data.service_name,
        target_quantity: data.target_quantity,
        unit_price: data.unit_price,
        notes: data.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.id);

    if (error) throw error;
  } else {
    const { error } = await supabase.from('goal_service_targets').insert({
      goal_id: data.goal_id,
      service_id: data.service_id,
      service_name: data.service_name,
      target_quantity: data.target_quantity,
      unit_price: data.unit_price,
      notes: data.notes || null,
    });

    if (error) throw error;
  }

  await logActivity(
    'PLANEJAMENTO_SERVICO',
    `Definiu meta para ${data.service_name}: ${data.target_quantity} un x R$ ${data.unit_price.toLocaleString('pt-BR')}`
  );
}

/**
 * Delete a service target
 */
export async function deleteServiceTarget(id: string) {
  if (!isSupabaseConfigured) throw new Error('Supabase não conectado.');
  const { error } = await supabase.from('goal_service_targets').delete().eq('id', id);
  if (error) throw error;
}
