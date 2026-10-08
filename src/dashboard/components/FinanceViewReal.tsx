import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  TrendingUp,
  Percent,
  Calendar,
  Filter,
  Search,
  Plus,
  RefreshCw,
  Download,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  BarChart3,
  PieChart as PieChartIcon,
  X,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  fetchFinanceDashboardData,
  createFinanceSale,
  updateFinanceSale,
  deleteFinanceSale,
  createFinanceExpense,
  updateFinanceExpense,
  deleteFinanceExpense,
  FinanceSaleItem,
  FinanceExpenseItem,
  SaleStatus,
  ExpenseCategory,
  FinanceClientOption,
  FinanceServiceOption,
  FinanceResponsibleOption,
} from '../../services/financeService';
import { formatCurrencyBRL } from '../../services/dashboardService';

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Ads',
  'Software',
  'VULTO TAP',
  'Infraestrutura',
  'Domínio/Hospedagem',
  'Freelancer',
  'Transporte',
  'Impostos',
  'Comissões',
  'Outros',
];

export function FinanceViewReal() {
  const [sales, setSales] = useState<FinanceSaleItem[]>([]);
  const [expenses, setExpenses] = useState<FinanceExpenseItem[]>([]);
  const [clients, setClients] = useState<FinanceClientOption[]>([]);
  const [services, setServices] = useState<FinanceServiceOption[]>([]);
  const [responsibles, setResponsibles] = useState<FinanceResponsibleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Tab & Filters
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'expenses'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'month' | 'year' | 'custom'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | SaleStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [responsibleFilter, setResponsibleFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<FinanceSaleItem | null>(null);
  const [editingExpense, setEditingExpense] = useState<FinanceExpenseItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'sale' | 'expense';
    id: string;
    description: string;
  } | null>(null);

  // Load Data
  const loadData = useCallback(async () => {
    try {
      const res = await fetchFinanceDashboardData();
      setSales(res.sales);
      setExpenses(res.expenses);
      setClients(res.clients);
      setServices(res.services);
      setResponsibles(res.responsibles);
      if (res.error && !res.sales.length) {
        setErrorNotice(res.error);
      } else {
        setErrorNotice(null);
      }
    } catch (err: any) {
      console.error(err);
      setErrorNotice('Erro ao conectar ao Supabase.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Helper date checker
  const isInDateRange = useCallback(
    (itemDate: string) => {
      if (!itemDate) return true;
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth(); // 0-indexed

      const d = new Date(itemDate);
      if (isNaN(d.getTime())) return true;

      if (periodFilter === 'month') {
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      }
      if (periodFilter === 'year') {
        return d.getFullYear() === currentYear;
      }
      if (periodFilter === 'custom') {
        if (startDate && d < new Date(startDate)) return false;
        if (endDate) {
          const endD = new Date(endDate);
          endD.setHours(23, 59, 59, 999);
          if (d > endD) return false;
        }
        return true;
      }
      return true; // 'all'
    },
    [periodFilter, startDate, endDate]
  );

  // Filtered Sales
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      if (!isInDateRange(s.date)) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (responsibleFilter !== 'all') {
        const matchesOwner = s.owner_id === responsibleFilter || s.owner_name?.toLowerCase().includes(responsibleFilter.toLowerCase());
        if (!matchesOwner) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const client = (s.client_name || '').toLowerCase();
        const serv = (s.service_name || '').toLowerCase();
        const desc = (s.description || '').toLowerCase();
        if (!client.includes(q) && !serv.includes(q) && !desc.includes(q)) return false;
      }
      return true;
    });
  }, [sales, isInDateRange, statusFilter, responsibleFilter, searchQuery]);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (!isInDateRange(e.date)) return false;
      if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
      if (responsibleFilter !== 'all') {
        const matchesResp = e.responsible_id === responsibleFilter || e.responsible_name?.toLowerCase().includes(responsibleFilter.toLowerCase());
        if (!matchesResp) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const desc = (e.description || '').toLowerCase();
        const cat = (e.category || '').toLowerCase();
        if (!desc.includes(q) && !cat.includes(q)) return false;
      }
      return true;
    });
  }, [expenses, isInDateRange, categoryFilter, responsibleFilter, searchQuery]);

  // KPIs Calculations based on period filter
  const kpis = useMemo(() => {
    // Entradas recebidas (apenas status PAGO)
    const paidRevenue = filteredSales
      .filter((s) => s.status === 'PAGO')
      .reduce((acc, s) => acc + s.amount, 0);

    // A Receber (PENDENTE ou ATRASADO)
    const receivable = filteredSales
      .filter((s) => s.status === 'PENDENTE' || s.status === 'ATRASADO')
      .reduce((acc, s) => acc + s.amount, 0);

    // Total de Despesas
    const totalExp = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

    // Lucro = Receita Paga - Despesas
    const netProfit = paidRevenue - totalExp;

    // Margem de Lucro (%) = (Lucro / Receita Paga) * 100
    const netMargin = paidRevenue > 0 ? (netProfit / paidRevenue) * 100 : 0;

    // A Pagar (estimativa de despesas futuras do mês se houver, ou 0 caso não tenhamos despesa agendada)
    const aPagar = 0;

    return {
      paidRevenue,
      receivable,
      totalExp,
      netProfit,
      netMargin,
      aPagar,
    };
  }, [filteredSales, filteredExpenses]);

  // Monthly Chart Data (Receita vs Despesas vs Lucro)
  const monthlyChartData = useMemo(() => {
    const monthsMap = new Map<string, { label: string; revenue: number; expenses: number; profit: number }>();

    // Generate current year's months or all from transactions
    const monthsNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentYear = new Date().getFullYear();

    // Default to last 6 months or 2026 months
    for (let m = 0; m <= 11; m++) {
      const key = `${currentYear}-${String(m + 1).padStart(2, '0')}`;
      monthsMap.set(key, {
        label: `${monthsNames[m]}`,
        revenue: 0,
        expenses: 0,
        profit: 0,
      });
    }

    sales.forEach((s) => {
      if (s.status === 'PAGO' && s.date) {
        const key = s.date.slice(0, 7);
        if (monthsMap.has(key)) {
          const m = monthsMap.get(key)!;
          m.revenue += s.amount;
          m.profit = m.revenue - m.expenses;
        }
      }
    });

    expenses.forEach((e) => {
      if (e.date) {
        const key = e.date.slice(0, 7);
        if (monthsMap.has(key)) {
          const m = monthsMap.get(key)!;
          m.expenses += e.amount;
          m.profit = m.revenue - m.expenses;
        }
      }
    });

    return Array.from(monthsMap.entries())
      .map(([key, val]) => ({ key, ...val }))
      .slice(0, new Date().getMonth() + 2); // Show up to current/next month
  }, [sales, expenses]);

  // Revenue by Service Breakdown
  const serviceBreakdown = useMemo(() => {
    const map = new Map<string, { revenue: number; count: number }>();
    let totalRev = 0;

    sales
      .filter((s) => s.status === 'PAGO')
      .forEach((s) => {
        const servName = s.service_name || 'Outros Serviços';
        const current = map.get(servName) || { revenue: 0, count: 0 };
        current.revenue += s.amount;
        current.count += 1;
        totalRev += s.amount;
        map.set(servName, current);
      });

    return Array.from(map.entries())
      .map(([name, data]) => ({
        serviceName: name,
        revenue: data.revenue,
        count: data.count,
        percentage: totalRev > 0 ? (data.revenue / totalRev) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [sales]);

  // Expenses by Category Breakdown
  const expenseCategoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    let total = 0;

    expenses.forEach((e) => {
      const cat = e.category || 'Outros';
      const current = map.get(cat) || 0;
      map.set(cat, current + e.amount);
      total += e.amount;
    });

    return Array.from(map.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  // Maximum value for chart scaling
  const maxChartBar = useMemo(() => {
    let max = 1000;
    monthlyChartData.forEach((d) => {
      if (d.revenue > max) max = d.revenue;
      if (d.expenses > max) max = d.expenses;
    });
    return max * 1.15;
  }, [monthlyChartData]);

  // CSV Export
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (activeTab === 'expenses') {
      csvContent += 'Data;Descricao;Categoria;Valor;Responsavel\n';
      filteredExpenses.forEach((e) => {
        const line = [
          e.date,
          `"${(e.description || '').replace(/"/g, '""')}"`,
          `"${e.category}"`,
          e.amount.toFixed(2),
          `"${e.responsible_name || 'Vulto'}"`,
        ].join(';');
        csvContent += line + '\n';
      });
    } else {
      // Sales or Overview default
      csvContent += 'Tipo;Data;Cliente;Servico;Descricao;Valor;Status;Responsavel\n';
      filteredSales.forEach((s) => {
        const line = [
          'Entrada',
          s.date,
          `"${(s.client_name || '').replace(/"/g, '""')}"`,
          `"${(s.service_name || '').replace(/"/g, '""')}"`,
          `"${(s.description || '').replace(/"/g, '""')}"`,
          s.amount.toFixed(2),
          s.status,
          `"${s.owner_name || 'Vulto'}"`,
        ].join(';');
        csvContent += line + '\n';
      });
      filteredExpenses.forEach((e) => {
        const line = [
          'Despesa',
          e.date,
          '-',
          `"${e.category}"`,
          `"${(e.description || '').replace(/"/g, '""')}"`,
          (-e.amount).toFixed(2),
          'PAGO',
          `"${e.responsible_name || 'Vulto'}"`,
        ].join(';');
        csvContent += line + '\n';
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vulto_lab_financeiro_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Delete Action Handlers
  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === 'sale') {
        const res = await deleteFinanceSale(deleteConfirm.id, deleteConfirm.description);
        if (res.success) {
          setSales((prev) => prev.filter((s) => s.id !== deleteConfirm.id));
        } else {
          alert('Erro ao excluir venda: ' + res.error);
        }
      } else {
        const res = await deleteFinanceExpense(deleteConfirm.id, deleteConfirm.description);
        if (res.success) {
          setExpenses((prev) => prev.filter((e) => e.id !== deleteConfirm.id));
        } else {
          alert('Erro ao excluir despesa: ' + res.error);
        }
      }
    } catch (err: any) {
      alert('Erro ao excluir registro');
    } finally {
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111111] border border-white/10 p-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-widest text-[#C6FF00] uppercase">
              // MÓDULO FINANCEIRO
            </span>
            <span className="text-white/20">•</span>
            <span className="text-[10px] font-mono text-white/50">
              SUPABASE LIVE DATA
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
            Gestão Financeira & Fluxo de Caixa
          </h1>
          <p className="text-xs text-white/60 font-sans mt-0.5">
            Controle ágil e consolidado de faturamento, despesas operacionais, margens e recebíveis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 bg-[#161616] hover:bg-[#1E1E1E] border border-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            title="Atualizar dados do Supabase"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#C6FF00]' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-[#161616] hover:bg-[#1E1E1E] border border-white/10 text-white/80 hover:text-white font-mono text-xs flex items-center gap-2 transition-colors cursor-pointer"
            title="Exportar dados filtrados para planilha CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#C6FF00]" />
            <span>EXPORTAR CSV</span>
          </button>

          <button
            onClick={() => {
              setEditingSale(null);
              setIsSaleModalOpen(true);
            }}
            className="px-3.5 py-2 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-mono font-bold text-xs tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ NOVA VENDA</span>
          </button>

          <button
            onClick={() => {
              setEditingExpense(null);
              setIsExpenseModalOpen(true);
            }}
            className="px-3.5 py-2 bg-[#1C1C1C] hover:bg-[#252525] border border-red-500/30 text-red-400 font-mono font-bold text-xs tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ NOVA DESPESA</span>
          </button>
        </div>
      </div>

      {errorNotice && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-3 text-xs font-mono text-amber-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* RECEITA */}
        <div className="bg-[#111111] border border-white/10 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-white/40 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">RECEITA (PAGA)</span>
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-white">
            {formatCurrencyBRL(kpis.paidRevenue)}
          </div>
          <div className="text-[10px] font-mono text-emerald-400/90 mt-1">
            {filteredSales.filter((s) => s.status === 'PAGO').length} entradas pagas
          </div>
        </div>

        {/* DESPESAS */}
        <div className="bg-[#111111] border border-white/10 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-white/40 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">DESPESAS</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-white">
            {formatCurrencyBRL(kpis.totalExp)}
          </div>
          <div className="text-[10px] font-mono text-red-400/90 mt-1">
            {filteredExpenses.length} custos no período
          </div>
        </div>

        {/* LUCRO */}
        <div className="bg-[#111111] border border-white/10 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-white/40 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">LUCRO</span>
            <DollarSign className="w-3.5 h-3.5 text-[#C6FF00]" />
          </div>
          <div className={`text-lg sm:text-xl font-bold font-mono ${kpis.netProfit >= 0 ? 'text-[#C6FF00]' : 'text-red-400'}`}>
            {formatCurrencyBRL(kpis.netProfit)}
          </div>
          <div className="text-[10px] font-mono text-white/40 mt-1">
            Resultado líquido
          </div>
        </div>

        {/* MARGEM */}
        <div className="bg-[#111111] border border-white/10 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-white/40 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">MARGEM</span>
            <Percent className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-white">
            {kpis.netMargin.toFixed(1)}%
          </div>
          <div className="text-[10px] font-mono text-white/40 mt-1">
            Eficiência operacional
          </div>
        </div>

        {/* A RECEBER */}
        <div className="bg-[#111111] border border-white/10 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-white/40 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">A RECEBER</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-amber-400">
            {formatCurrencyBRL(kpis.receivable)}
          </div>
          <div className="text-[10px] font-mono text-white/40 mt-1">
            {filteredSales.filter((s) => s.status !== 'PAGO').length} pendentes/atrasados
          </div>
        </div>

        {/* A PAGAR */}
        <div className="bg-[#111111] border border-white/10 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-white/40 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider">A PAGAR</span>
            <AlertTriangle className="w-3.5 h-3.5 text-white/30" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-white">
            R$ 0,00
          </div>
          <div className="text-[10px] font-mono text-white/40 mt-1">
            Sem débitos vencendo
          </div>
        </div>
      </div>

      {/* Navigation Tabs & Global Filters */}
      <div className="bg-[#111111] border border-white/10 p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Main Navigation Switch */}
          <div className="flex items-center gap-1.5 p-1 bg-[#161616] border border-white/10">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 text-xs font-mono font-bold tracking-wider transition-colors cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-[#C6FF00] text-[#0A0A0A]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              VISÃO GERAL & GRÁFICOS
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`px-3 py-1.5 text-xs font-mono font-bold tracking-wider transition-colors cursor-pointer ${
                activeTab === 'sales'
                  ? 'bg-[#C6FF00] text-[#0A0A0A]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              ENTRADAS ({filteredSales.length})
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-3 py-1.5 text-xs font-mono font-bold tracking-wider transition-colors cursor-pointer ${
                activeTab === 'expenses'
                  ? 'bg-[#C6FF00] text-[#0A0A0A]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              DESPESAS ({filteredExpenses.length})
            </button>
          </div>

          {/* Period Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono text-white/40">PERÍODO:</span>
            <button
              onClick={() => setPeriodFilter('all')}
              className={`px-2.5 py-1 text-xs font-mono border transition-colors cursor-pointer ${
                periodFilter === 'all'
                  ? 'bg-white/10 border-[#C6FF00] text-[#C6FF00]'
                  : 'border-white/10 text-white/60 hover:text-white'
              }`}
            >
              Tudo
            </button>
            <button
              onClick={() => setPeriodFilter('month')}
              className={`px-2.5 py-1 text-xs font-mono border transition-colors cursor-pointer ${
                periodFilter === 'month'
                  ? 'bg-white/10 border-[#C6FF00] text-[#C6FF00]'
                  : 'border-white/10 text-white/60 hover:text-white'
              }`}
            >
              Este Mês
            </button>
            <button
              onClick={() => setPeriodFilter('year')}
              className={`px-2.5 py-1 text-xs font-mono border transition-colors cursor-pointer ${
                periodFilter === 'year'
                  ? 'bg-white/10 border-[#C6FF00] text-[#C6FF00]'
                  : 'border-white/10 text-white/60 hover:text-white'
              }`}
            >
              Este Ano
            </button>
            <button
              onClick={() => setPeriodFilter('custom')}
              className={`px-2.5 py-1 text-xs font-mono border transition-colors cursor-pointer ${
                periodFilter === 'custom'
                  ? 'bg-white/10 border-[#C6FF00] text-[#C6FF00]'
                  : 'border-white/10 text-white/60 hover:text-white'
              }`}
            >
              Personalizado
            </button>
          </div>
        </div>

        {/* Extended filters row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-white/5">
          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por cliente, serviço ou descrição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#161616] border border-white/10 pl-9 pr-3 py-1.5 text-xs text-white placeholder-white/30 font-mono focus:border-[#C6FF00] focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {periodFilter === 'custom' && (
              <div className="flex items-center gap-1.5 bg-[#161616] border border-white/10 px-2 py-1">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-[11px] font-mono text-white focus:outline-none"
                />
                <span className="text-white/30 text-xs">até</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-[11px] font-mono text-white focus:outline-none"
                />
              </div>
            )}

            {/* Status Filter for Sales */}
            {activeTab === 'sales' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-[#161616] border border-white/10 px-2.5 py-1.5 text-xs font-mono text-white focus:border-[#C6FF00] focus:outline-none"
              >
                <option value="all">Status: Todos</option>
                <option value="PAGO">Pago</option>
                <option value="PENDENTE">Pendente</option>
                <option value="ATRASADO">Atrasado</option>
              </select>
            )}

            {/* Category Filter for Expenses */}
            {activeTab === 'expenses' && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#161616] border border-white/10 px-2.5 py-1.5 text-xs font-mono text-white focus:border-[#C6FF00] focus:outline-none"
              >
                <option value="all">Categoria: Todas</option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}

            {/* Responsible Filter */}
            <select
              value={responsibleFilter}
              onChange={(e) => setResponsibleFilter(e.target.value)}
              className="bg-[#161616] border border-white/10 px-2.5 py-1.5 text-xs font-mono text-white focus:border-[#C6FF00] focus:outline-none"
            >
              <option value="all">Responsável: Todos</option>
              {responsibles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* TAB CONTENT: 1. OVERVIEW & CHARTS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Gráfico 1: Receita x Despesas & Lucro por Mês */}
          <div className="bg-[#111111] border border-white/10 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#C6FF00]" />
                  <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                    Evolução Mensal: Receita × Despesas
                  </h3>
                </div>
                <p className="text-xs text-white/50 font-sans mt-0.5">
                  Comparativo de entradas liquidadas e desembolsos operacionais da VULTO LAB.
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-emerald-400"></span>
                  <span className="text-white/70">Receita</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-red-400"></span>
                  <span className="text-white/70">Despesas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-[#C6FF00]"></span>
                  <span className="text-white/70">Lucro</span>
                </div>
              </div>
            </div>

            {/* Bar Chart Visualization */}
            <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 gap-2 h-52 items-end pt-4 border-b border-white/10 pb-2">
              {monthlyChartData.map((d) => {
                const revHeight = maxChartBar > 0 ? (d.revenue / maxChartBar) * 100 : 0;
                const expHeight = maxChartBar > 0 ? (d.expenses / maxChartBar) * 100 : 0;

                return (
                  <div key={d.key} className="flex flex-col items-center h-full justify-end group">
                    <div className="flex items-end gap-1 w-full justify-center h-full">
                      {/* Receita bar */}
                      <div
                        style={{ height: `${Math.max(4, revHeight)}%` }}
                        className="w-2.5 sm:w-3.5 bg-emerald-400 hover:brightness-110 transition-all rounded-t-xs relative"
                        title={`${d.label}: Receita ${formatCurrencyBRL(d.revenue)}`}
                      />
                      {/* Despesas bar */}
                      <div
                        style={{ height: `${Math.max(4, expHeight)}%` }}
                        className="w-2.5 sm:w-3.5 bg-red-400/90 hover:brightness-110 transition-all rounded-t-xs relative"
                        title={`${d.label}: Despesas ${formatCurrencyBRL(d.expenses)}`}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-white/40 mt-2 truncate w-full text-center">
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Monthly Profit table snippet */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 mt-4 pt-2">
              {monthlyChartData.slice(-6).map((d) => (
                <div key={d.key} className="bg-[#161616] p-2.5 border border-white/5">
                  <div className="text-[10px] font-mono text-white/40">{d.label}</div>
                  <div className={`text-xs font-mono font-bold mt-0.5 ${d.profit >= 0 ? 'text-[#C6FF00]' : 'text-red-400'}`}>
                    {formatCurrencyBRL(d.profit)}
                  </div>
                  <div className="text-[9px] font-mono text-white/30">
                    Rec: {formatCurrencyBRL(d.revenue)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gráfico 2 e 3: Receita por Serviço & Despesas por Categoria */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Receita por Serviço */}
            <div className="bg-[#111111] border border-white/10 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                      Receita por Serviço
                    </h3>
                  </div>
                  <p className="text-xs text-white/50 font-sans mt-0.5">
                    Participação de cada linha de produto/serviço no faturamento.
                  </p>
                </div>
              </div>

              {serviceBreakdown.length === 0 ? (
                <div className="py-8 text-center text-xs font-mono text-white/40">
                  Nenhuma receita liquidada no histórico.
                </div>
              ) : (
                <div className="space-y-3 mt-3">
                  {serviceBreakdown.map((s, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-white/90 truncate max-w-[200px]">{s.serviceName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold">{formatCurrencyBRL(s.revenue)}</span>
                          <span className="text-[#C6FF00] text-[11px] w-12 text-right">
                            {s.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-[#181818] overflow-hidden">
                        <div
                          style={{ width: `${s.percentage}%` }}
                          className="h-full bg-emerald-400 transition-all duration-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Despesas por Categoria */}
            <div className="bg-[#111111] border border-white/10 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-red-400" />
                    <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                      Despesas por Categoria
                    </h3>
                  </div>
                  <p className="text-xs text-white/50 font-sans mt-0.5">
                    Distribuição dos custos (Ads, Software, VULTO TAP, etc.).
                  </p>
                </div>
              </div>

              {expenseCategoryBreakdown.length === 0 ? (
                <div className="py-8 text-center text-xs font-mono text-white/40">
                  Nenhuma despesa cadastrada no histórico.
                </div>
              ) : (
                <div className="space-y-3 mt-3">
                  {expenseCategoryBreakdown.map((c, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-white/90 truncate">{c.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold">{formatCurrencyBRL(c.amount)}</span>
                          <span className="text-red-400 text-[11px] w-12 text-right">
                            {c.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-[#181818] overflow-hidden">
                        <div
                          style={{ width: `${c.percentage}%` }}
                          className="h-full bg-red-400 transition-all duration-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. ENTRADAS (SALES) */}
      {activeTab === 'sales' && (
        <div className="bg-[#111111] border border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#141414]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#C6FF00] font-bold uppercase">
                // REGISTRO DE VENDAS & ENTRADAS
              </span>
              <span className="text-white/30 text-xs">({filteredSales.length} registros)</span>
            </div>
            <button
              onClick={() => {
                setEditingSale(null);
                setIsSaleModalOpen(true);
              }}
              className="px-3 py-1.5 bg-[#C6FF00] text-[#0A0A0A] font-mono font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-[#b0e600]"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>+ NOVA VENDA</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-[#161616] text-[10px] font-mono uppercase text-white/40 tracking-wider">
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Serviço / Descrição</th>
                  <th className="py-3 px-4">Responsável</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-xs">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-white/40 text-xs">
                      Nenhuma venda encontrada com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((s) => {
                    const isPaid = s.status === 'PAGO';
                    const isOverdue = s.status === 'ATRASADO';

                    return (
                      <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4 text-white/50 text-[11px] whitespace-nowrap">
                          {s.date}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-white font-bold">{s.client_name}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-white font-medium">{s.service_name}</div>
                          <div className="text-[11px] text-white/40 font-sans mt-0.5">{s.description}</div>
                        </td>
                        <td className="py-3.5 px-4 text-white/70 text-[11px]">
                          {s.owner_name}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 font-bold ${
                              isPaid
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : isOverdue
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {isPaid ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                PAGO
                              </>
                            ) : isOverdue ? (
                              <>
                                <AlertTriangle className="w-3 h-3" />
                                ATRASADO
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3" />
                                PENDENTE
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold text-white">
                          <span className={isPaid ? 'text-emerald-400' : 'text-amber-400'}>
                            {formatCurrencyBRL(s.amount)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingSale(s);
                                setIsSaleModalOpen(true);
                              }}
                              className="p-1.5 bg-[#181818] hover:bg-[#252525] border border-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                              title="Editar venda"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                setDeleteConfirm({
                                  type: 'sale',
                                  id: s.id,
                                  description: `${s.client_name}: ${s.description} (${formatCurrencyBRL(s.amount)})`,
                                })
                              }
                              className="p-1.5 bg-[#181818] hover:bg-red-900/30 border border-red-500/20 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                              title="Excluir venda"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. DESPESAS (EXPENSES) */}
      {activeTab === 'expenses' && (
        <div className="bg-[#111111] border border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#141414]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-red-400 font-bold uppercase">
                // REGISTRO DE DESPESAS OPERACIONAIS
              </span>
              <span className="text-white/30 text-xs">({filteredExpenses.length} registros)</span>
            </div>
            <button
              onClick={() => {
                setEditingExpense(null);
                setIsExpenseModalOpen(true);
              }}
              className="px-3 py-1.5 bg-[#1C1C1C] hover:bg-[#252525] border border-red-500/30 text-red-400 font-mono font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>+ NOVA DESPESA</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-[#161616] text-[10px] font-mono uppercase text-white/40 tracking-wider">
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Responsável</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-xs">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-white/40 text-xs">
                      Nenhuma despesa encontrada com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((e) => {
                    return (
                      <tr key={e.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4 text-white/50 text-[11px] whitespace-nowrap">
                          {e.date}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-white font-medium">{e.description}</span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 bg-[#181818] border border-white/10 text-white/70 text-[10px]">
                            {e.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-white/70 text-[11px]">
                          {e.responsible_name}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold text-red-400">
                          - {formatCurrencyBRL(e.amount)}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingExpense(e);
                                setIsExpenseModalOpen(true);
                              }}
                              className="p-1.5 bg-[#181818] hover:bg-[#252525] border border-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                              title="Editar despesa"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                setDeleteConfirm({
                                  type: 'expense',
                                  id: e.id,
                                  description: `${e.description} (${e.category} - ${formatCurrencyBRL(e.amount)})`,
                                })
                              }
                              className="p-1.5 bg-[#181818] hover:bg-red-900/30 border border-red-500/20 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                              title="Excluir despesa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: NOVA / EDITAR VENDA */}
      {isSaleModalOpen && (
        <SaleFormModal
          isOpen={isSaleModalOpen}
          onClose={() => setIsSaleModalOpen(false)}
          saleToEdit={editingSale}
          clients={clients}
          services={services}
          responsibles={responsibles}
          onSaved={() => {
            setIsSaleModalOpen(false);
            loadData();
          }}
        />
      )}

      {/* MODAL: NOVA / EDITAR DESPESA */}
      {isExpenseModalOpen && (
        <ExpenseFormModal
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
          expenseToEdit={editingExpense}
          responsibles={responsibles}
          onSaved={() => {
            setIsExpenseModalOpen(false);
            loadData();
          }}
        />
      )}

      {/* MODAL: CONFIRMAÇÃO DE EXCLUSÃO (OBRIGATÓRIO) */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-red-500/40 p-6 max-w-md w-full space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-mono font-bold text-base text-white">
                Confirmar Exclusão de Registro
              </h3>
            </div>
            <p className="text-xs text-white/70 font-sans leading-relaxed">
              Você tem certeza de que deseja remover permanentemente este registro financeiro do Supabase?
            </p>
            <div className="p-3 bg-[#181818] border border-white/10 text-xs font-mono text-white/90">
              {deleteConfirm.description}
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-[#1C1C1C] hover:bg-[#252525] border border-white/10 text-xs font-mono text-white/70 transition-colors cursor-pointer"
              >
                CANCELAR
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-mono font-bold text-xs tracking-wider transition-colors cursor-pointer"
              >
                SIM, EXCLUIR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Subcomponent: Modal Form de Venda
// -------------------------------------------------------------
interface SaleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleToEdit: FinanceSaleItem | null;
  clients: FinanceClientOption[];
  services: FinanceServiceOption[];
  responsibles: FinanceResponsibleOption[];
  onSaved: () => void;
}

function SaleFormModal({
  onClose,
  saleToEdit,
  clients,
  services,
  responsibles,
  onSaved,
}: SaleFormModalProps) {
  const [clientId, setClientId] = useState(saleToEdit?.client_id || '');
  const [serviceId, setServiceId] = useState(saleToEdit?.service_id || '');
  const [description, setDescription] = useState(saleToEdit?.description || '');
  const [amount, setAmount] = useState<string>(saleToEdit ? String(saleToEdit.amount) : '');
  const [date, setDate] = useState(saleToEdit?.date || new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<SaleStatus>(saleToEdit?.status || 'PAGO');
  const [ownerId, setOwnerId] = useState(saleToEdit?.owner_id || responsibles[0]?.id || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto populate description if empty when service is selected
  const handleServiceChange = (id: string) => {
    setServiceId(id);
    const serv = services.find((s) => s.id === id);
    if (serv) {
      if (!description) setDescription(serv.name);
      if (!amount && serv.base_price) setAmount(String(serv.base_price));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Informe a descrição da venda.');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Informe um valor válido.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (saleToEdit) {
        const res = await updateFinanceSale(saleToEdit.id, {
          clientId: clientId || null,
          serviceId: serviceId || null,
          description,
          amount: numAmount,
          date,
          status,
          ownerId: ownerId || null,
        });
        if (res.success) {
          onSaved();
        } else {
          setError(res.error || 'Erro ao atualizar');
        }
      } else {
        const res = await createFinanceSale({
          clientId: clientId || null,
          serviceId: serviceId || null,
          description,
          amount: numAmount,
          date,
          status,
          ownerId: ownerId || null,
        });
        if (res.success) {
          onSaved();
        } else {
          setError(res.error || 'Erro ao registrar');
        }
      }
    } catch (err: any) {
      setError('Falha ao processar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#121212] border border-white/10 p-6 max-w-lg w-full my-8 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#C6FF00] font-bold">
              // {saleToEdit ? 'EDITAR VENDA' : 'NOVA VENDA'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/40 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 bg-red-500/10 border border-red-500/30 text-xs font-mono text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block text-white/50 mb-1">CLIENTE</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full bg-[#181818] border border-white/10 px-3 py-2 text-white focus:border-[#C6FF00] focus:outline-none"
            >
              <option value="">-- Selecione ou Venda Direta --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name} ({c.contact_name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-white/50 mb-1">SERVIÇO</label>
            <select
              value={serviceId}
              onChange={(e) => handleServiceChange(e.target.value)}
              className="w-full bg-[#181818] border border-white/10 px-3 py-2 text-white focus:border-[#C6FF00] focus:outline-none"
            >
              <option value="">-- Selecione o Serviço --</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-white/50 mb-1">DESCRIÇÃO / ESPECIFICAÇÃO *</label>
            <input
              type="text"
              required
              placeholder="Ex: Mensalidade Retainer, Parcela 1/2, Lote Vulto Tap"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#181818] border border-white/10 px-3 py-2 text-white placeholder-white/30 focus:border-[#C6FF00] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-white/50 mb-1">VALOR (R$) *</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-[#181818] border border-white/10 px-3 py-2 text-white placeholder-white/30 font-bold focus:border-[#C6FF00] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-white/50 mb-1">DATA DE COMPETÊNCIA *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#181818] border border-white/10 px-3 py-2 text-white focus:border-[#C6FF00] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-white/50 mb-1">STATUS</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SaleStatus)}
                className="w-full bg-[#181818] border border-white/10 px-3 py-2 text-white focus:border-[#C6FF00] focus:outline-none"
              >
                <option value="PAGO">PAGO</option>
                <option value="PENDENTE">PENDENTE</option>
                <option value="ATRASADO">ATRASADO</option>
              </select>
            </div>
            <div>
              <label className="block text-white/50 mb-1">RESPONSÁVEL</label>
              <select
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="w-full bg-[#181818] border border-white/10 px-3 py-2 text-white focus:border-[#C6FF00] focus:outline-none"
              >
                {responsibles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#1C1C1C] hover:bg-[#252525] border border-white/10 text-white/70 transition-colors cursor-pointer"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-bold tracking-wider transition-colors cursor-pointer flex items-center gap-2"
            >
              {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{saleToEdit ? 'SALVAR ALTERAÇÕES' : 'REGISTRAR VENDA'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Subcomponent: Modal Form de Despesa
// -------------------------------------------------------------
interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseToEdit: FinanceExpenseItem | null;
  responsibles: FinanceResponsibleOption[];
  onSaved: () => void;
}

function ExpenseFormModal({
  onClose,
  expenseToEdit,
  responsibles,
  onSaved,
}: ExpenseFormModalProps) {
  const [description, setDescription] = useState(expenseToEdit?.description || '');
  const [category, setCategory] = useState<ExpenseCategory>(
    (expenseToEdit?.category as ExpenseCategory) || 'Software'
  );
  const [amount, setAmount] = useState<string>(expenseToEdit ? String(expenseToEdit.amount) : '');
  const [date, setDate] = useState(expenseToEdit?.date || new Date().toISOString().split('T')[0]);
  const [responsibleId, setResponsibleId] = useState(
    expenseToEdit?.responsible_id || responsibles[0]?.id || ''
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Informe a descrição da despesa.');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Informe um valor válido.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (expenseToEdit) {
        const res = await updateFinanceExpense(expenseToEdit.id, {
          description,
          category,
          amount: numAmount,
          date,
          responsibleId: responsibleId || null,
        });
        if (res.success) {
          onSaved();
        } else {
          setError(res.error || 'Erro ao atualizar');
        }
      } else {
        const res = await createFinanceExpense({
          description,
          category,
          amount: numAmount,
          date,
          responsibleId: responsibleId || null,
        });
        if (res.success) {
          onSaved();
        } else {
          setError(res.error || 'Erro ao registrar');
        }
      }
    } catch (err: any) {
      setError('Falha ao processar despesa.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#121212] border border-red-500/30 p-6 max-w-lg w-full my-8 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-red-400 font-bold">
              // {expenseToEdit ? 'EDITAR DESPESA' : 'NOVA DESPESA'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/40 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 bg-red-500/10 border border-red-500/30 text-xs font-mono text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block text-white/50 mb-1">DESCRIÇÃO DA DESPESA *</label>
            <input
              type="text"
              required
              placeholder="Ex: Assinatura Figma Pro, Tráfego Meta Ads, Lote chips NFC"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#181818] border border-white/10 px-3 py-2 text-white placeholder-white/30 focus:border-red-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-white/50 mb-1">CATEGORIA *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full bg-[#181818] border border-white/10 px-3 py-2 text-white focus:border-red-400 focus:outline-none"
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-white/50 mb-1">VALOR (R$) *</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-[#181818] border border-white/10 px-3 py-2 text-white placeholder-white/30 font-bold focus:border-red-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-white/50 mb-1">DATA *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#181818] border border-white/10 px-3 py-2 text-white focus:border-red-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-white/50 mb-1">RESPONSÁVEL</label>
            <select
              value={responsibleId}
              onChange={(e) => setResponsibleId(e.target.value)}
              className="w-full bg-[#181818] border border-white/10 px-3 py-2 text-white focus:border-red-400 focus:outline-none"
            >
              {responsibles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#1C1C1C] hover:bg-[#252525] border border-white/10 text-white/70 transition-colors cursor-pointer"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold tracking-wider transition-colors cursor-pointer flex items-center gap-2"
            >
              {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{expenseToEdit ? 'SALVAR ALTERAÇÕES' : 'REGISTRAR DESPESA'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
