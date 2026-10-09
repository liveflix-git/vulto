import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DollarSign,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  AlertCircle,
  Check,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  RefreshCw,
} from 'lucide-react';
import {
  VultoFinanceItem,
  VultoMonthlyExpenseItem,
  VultoFinanceType,
  VultoOperator,
  fetchVultoFinance,
  createVultoFinance,
  updateVultoFinance,
  deleteVultoFinance,
  fetchVultoMonthlyExpenses,
  createVultoMonthlyExpense,
  updateVultoMonthlyExpense,
  deleteVultoMonthlyExpense,
  fetchVultoOperators,
} from '../../services/vultoCoreService';
import { supabase } from '../../lib/supabase';

export function FinanceView() {
  const [activeTab, setActiveTab] = useState<'movimentacoes' | 'gastos_mensais'>('movimentacoes');

  // Estado Movimentações
  const [financeItems, setFinanceItems] = useState<VultoFinanceItem[]>([]);
  const [loadingFinance, setLoadingFinance] = useState(true);

  // Estado Gastos Mensais
  const [monthlyExpenses, setMonthlyExpenses] = useState<VultoMonthlyExpenseItem[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);

  // Operadores para mapeamento de nomes
  const [operators, setOperators] = useState<VultoOperator[]>([]);

  // Modal Movimentação
  const [isFinModalOpen, setIsFinModalOpen] = useState(false);
  const [editingFin, setEditingFin] = useState<VultoFinanceItem | null>(null);
  const [finTitle, setFinTitle] = useState('');
  const [finDescription, setFinDescription] = useState('');
  const [finAmount, setFinAmount] = useState('');
  const [finType, setFinType] = useState<VultoFinanceType>('entrada');
  const [isSubmittingFin, setIsSubmittingFin] = useState(false);
  const [finError, setFinError] = useState<string | null>(null);

  // Modal Gasto Mensal
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
  const [editingExp, setEditingExp] = useState<VultoMonthlyExpenseItem | null>(null);
  const [expTitle, setExpTitle] = useState('');
  const [expDescription, setExpDescription] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expDueDay, setExpDueDay] = useState('');
  const [expActive, setExpActive] = useState(true);
  const [isSubmittingExp, setIsSubmittingExp] = useState(false);
  const [expError, setExpError] = useState<string | null>(null);

  // Modal Exclusão
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    type: 'finance' | 'expense';
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = useCallback(async () => {
    try {
      const [ops, finRes, expRes] = await Promise.all([
        fetchVultoOperators(),
        fetchVultoFinance(),
        fetchVultoMonthlyExpenses(),
      ]);
      setOperators(ops);
      setFinanceItems(finRes.data);
      setMonthlyExpenses(expRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingFinance(false);
      setLoadingExpenses(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listener para refresh global
  useEffect(() => {
    const handleGlobalRefresh = () => {
      loadData();
    };
    window.addEventListener('vulto:refresh', handleGlobalRefresh);
    return () => window.removeEventListener('vulto:refresh', handleGlobalRefresh);
  }, [loadData]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('vulto_finance_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vulto_finance' }, () => {
        fetchVultoFinance().then((res) => setFinanceItems(res.data));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vulto_monthly_expenses' }, () => {
        fetchVultoMonthlyExpenses().then((res) => setMonthlyExpenses(res.data));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Helper operador
  const getOperatorName = (operatorId: string | null) => {
    if (!operatorId) return 'Operador';
    const match = operators.find((op) => op.id === operatorId);
    return match ? match.name : 'Operador';
  };

  // ==========================================
  // HANDLERS MOVIMENTAÇÃO
  // ==========================================
  const handleOpenNewFin = () => {
    setEditingFin(null);
    setFinTitle('');
    setFinDescription('');
    setFinAmount('');
    setFinType('entrada');
    setFinError(null);
    setIsFinModalOpen(true);
  };

  const handleOpenEditFin = (item: VultoFinanceItem) => {
    setEditingFin(item);
    setFinTitle(item.title);
    setFinDescription(item.description || '');
    setFinAmount(String(item.amount));
    setFinType(item.entry_type);
    setFinError(null);
    setIsFinModalOpen(true);
  };

  const handleSubmitFin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finTitle.trim() || !finAmount) {
      setFinError('Preencha título e valor.');
      return;
    }
    const amountVal = parseFloat(finAmount.replace(',', '.'));
    if (isNaN(amountVal) || amountVal <= 0) {
      setFinError('Informe um valor válido.');
      return;
    }

    setIsSubmittingFin(true);
    setFinError(null);

    try {
      if (editingFin) {
        const res = await updateVultoFinance(editingFin.id, {
          title: finTitle.trim(),
          description: finDescription.trim() || null,
          amount: amountVal,
          entry_type: finType,
        });

        if (res.error) {
          setFinError(res.error);
        } else {
          setFinanceItems((prev) =>
            prev.map((item) =>
              item.id === editingFin.id
                ? {
                    ...item,
                    title: finTitle.trim(),
                    description: finDescription.trim() || null,
                    amount: amountVal,
                    entry_type: finType,
                  }
                : item
            )
          );
          setIsFinModalOpen(false);
          showToast('Movimentação atualizada.');
        }
      } else {
        const res = await createVultoFinance({
          title: finTitle.trim(),
          description: finDescription.trim() || null,
          amount: amountVal,
          entry_type: finType,
        });

        if (res.error) {
          setFinError(res.error);
        } else if (res.data) {
          setFinanceItems((prev) => [res.data!, ...prev]);
          setIsFinModalOpen(false);
          showToast('Movimentação adicionada.');
        }
      }
    } catch (err: any) {
      setFinError(err.message || 'Erro inesperado.');
    } finally {
      setIsSubmittingFin(false);
    }
  };

  // ==========================================
  // HANDLERS GASTOS MENSAIS
  // ==========================================
  const handleOpenNewExp = () => {
    setEditingExp(null);
    setExpTitle('');
    setExpDescription('');
    setExpAmount('');
    setExpDueDay('');
    setExpActive(true);
    setExpError(null);
    setIsExpModalOpen(true);
  };

  const handleOpenEditExp = (item: VultoMonthlyExpenseItem) => {
    setEditingExp(item);
    setExpTitle(item.title);
    setExpDescription(item.description || '');
    setExpAmount(String(item.amount));
    setExpDueDay(item.due_day !== null && item.due_day !== undefined ? String(item.due_day) : '');
    setExpActive(item.active);
    setExpError(null);
    setIsExpModalOpen(true);
  };

  const handleSubmitExp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim() || !expAmount) {
      setExpError('Preencha título e valor.');
      return;
    }
    const amountVal = parseFloat(expAmount.replace(',', '.'));
    if (isNaN(amountVal) || amountVal <= 0) {
      setExpError('Informe um valor válido.');
      return;
    }
    const dueDayVal = expDueDay.trim() ? parseInt(expDueDay, 10) : null;

    setIsSubmittingExp(true);
    setExpError(null);

    try {
      if (editingExp) {
        const res = await updateVultoMonthlyExpense(editingExp.id, {
          title: expTitle.trim(),
          description: expDescription.trim() || null,
          amount: amountVal,
          due_day: dueDayVal,
          active: expActive,
        });

        if (res.error) {
          setExpError(res.error);
        } else {
          setMonthlyExpenses((prev) =>
            prev.map((item) =>
              item.id === editingExp.id
                ? {
                    ...item,
                    title: expTitle.trim(),
                    description: expDescription.trim() || null,
                    amount: amountVal,
                    due_day: dueDayVal,
                    active: expActive,
                  }
                : item
            )
          );
          setIsExpModalOpen(false);
          showToast('Gasto mensal atualizado.');
        }
      } else {
        const res = await createVultoMonthlyExpense({
          title: expTitle.trim(),
          description: expDescription.trim() || null,
          amount: amountVal,
          due_day: dueDayVal,
          active: expActive,
        });

        if (res.error) {
          setExpError(res.error);
        } else if (res.data) {
          setMonthlyExpenses((prev) => [res.data!, ...prev]);
          setIsExpModalOpen(false);
          showToast('Gasto mensal cadastrado.');
        }
      }
    } catch (err: any) {
      setExpError(err.message || 'Erro inesperado.');
    } finally {
      setIsSubmittingExp(false);
    }
  };

  // ==========================================
  // CONFIRMAÇÃO DE EXCLUSÃO
  // ==========================================
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);

    try {
      if (itemToDelete.type === 'finance') {
        const res = await deleteVultoFinance(itemToDelete.id);
        if (res.error) {
          showToast('Não foi possível excluir: ' + res.error, 'error');
        } else {
          setFinanceItems((prev) => prev.filter((i) => i.id !== itemToDelete.id));
          showToast('Registro excluído.');
          setItemToDelete(null);
        }
      } else {
        const res = await deleteVultoMonthlyExpense(itemToDelete.id);
        if (res.error) {
          showToast('Não foi possível excluir: ' + res.error, 'error');
        } else {
          setMonthlyExpenses((prev) => prev.filter((i) => i.id !== itemToDelete.id));
          showToast('Registro excluído.');
          setItemToDelete(null);
        }
      }
    } catch (e: any) {
      showToast('Não foi possível excluir o registro.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Total de gastos mensais ativos
  const totalMonthlyExpenses = useMemo(() => {
    return monthlyExpenses
      .filter((e) => e.active)
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [monthlyExpenses]);

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

      {/* Header com Abas */}
      <div className="bg-[#111111] border border-white/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono text-white">
            FINANCEIRO
          </h1>
          <p className="text-xs text-white/50 font-sans mt-0.5">
            Gestão simplificada de entradas, saídas reais e despesas mensais recorrentes.
          </p>
        </div>

        {/* Abas */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('movimentacoes')}
            className={`px-4 py-2 font-mono text-xs font-bold tracking-wider transition-colors cursor-pointer border ${
              activeTab === 'movimentacoes'
                ? 'bg-[#161616] text-[#C6FF00] border-[#C6FF00]'
                : 'bg-transparent text-white/60 hover:text-white border-white/10'
            }`}
          >
            MOVIMENTAÇÕES
          </button>
          <button
            onClick={() => setActiveTab('gastos_mensais')}
            className={`px-4 py-2 font-mono text-xs font-bold tracking-wider transition-colors cursor-pointer border ${
              activeTab === 'gastos_mensais'
                ? 'bg-[#161616] text-[#C6FF00] border-[#C6FF00]'
                : 'bg-transparent text-white/60 hover:text-white border-white/10'
            }`}
          >
            GASTOS MENSAIS
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ABA 1: MOVIMENTAÇÕES */}
      {/* ======================================================== */}
      {activeTab === 'movimentacoes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-white/50 uppercase">
              Histórico de Entradas e Saídas
            </span>
            <button
              onClick={handleOpenNewFin}
              className="px-4 py-2 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-mono font-bold text-xs tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ NOVA MOVIMENTAÇÃO</span>
            </button>
          </div>

          <div className="bg-[#111111] border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/10 bg-[#0E0E0E] text-white/50 text-[10px] uppercase">
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Título</th>
                    <th className="py-3 px-4">Descrição</th>
                    <th className="py-3 px-4">Operador</th>
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4 text-right">Valor</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loadingFinance ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-white/40">
                        Carregando movimentações...
                      </td>
                    </tr>
                  ) : financeItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-white/40">
                        Nenhuma movimentação registrada.
                      </td>
                    </tr>
                  ) : (
                    financeItems.map((item) => (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold border uppercase ${
                              item.entry_type === 'entrada'
                                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                                : 'bg-rose-950/40 text-rose-400 border-rose-500/30'
                            }`}
                          >
                            {item.entry_type}
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
                        <td
                          className={`py-3 px-4 text-right font-bold ${
                            item.entry_type === 'entrada' ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {item.entry_type === 'entrada' ? '+' : '-'} R${' '}
                          {Number(item.amount).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditFin(item)}
                              className="p-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-[#C6FF00] transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                setItemToDelete({
                                  id: item.id,
                                  type: 'finance',
                                  title: item.title,
                                })
                              }
                              className="p-1.5 bg-rose-950/20 hover:bg-rose-950/50 text-rose-400 border border-rose-800/30 transition-colors cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ABA 2: GASTOS MENSAIS */}
      {/* ======================================================== */}
      {activeTab === 'gastos_mensais' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="bg-[#141414] border border-white/10 px-4 py-2 flex items-center gap-3">
              <span className="text-[11px] font-mono text-white/50 uppercase">TOTAL MENSAL FIXO:</span>
              <span className="text-base font-mono font-bold text-[#C6FF00]">
                R$ {totalMonthlyExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <button
              onClick={handleOpenNewExp}
              className="px-4 py-2 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-mono font-bold text-xs tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ NOVO GASTO MENSAL</span>
            </button>
          </div>

          <div className="bg-[#111111] border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/10 bg-[#0E0E0E] text-white/50 text-[10px] uppercase">
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Título</th>
                    <th className="py-3 px-4">Descrição</th>
                    <th className="py-3 px-4">Vencimento</th>
                    <th className="py-3 px-4">Operador</th>
                    <th className="py-3 px-4 text-right">Valor</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loadingExpenses ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-white/40">
                        Carregando gastos mensais...
                      </td>
                    </tr>
                  ) : monthlyExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-white/40">
                        Nenhum gasto mensal cadastrado.
                      </td>
                    </tr>
                  ) : (
                    monthlyExpenses.map((item) => (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold border uppercase ${
                              item.active
                                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                                : 'bg-white/5 text-white/40 border-white/10'
                            }`}
                          >
                            {item.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-white">{item.title}</td>
                        <td className="py-3 px-4 text-white/60">
                          {item.description || <span className="text-white/20">-</span>}
                        </td>
                        <td className="py-3 px-4 text-white/80">
                          {item.due_day ? `Dia ${item.due_day}` : <span className="text-white/30">-</span>}
                        </td>
                        <td className="py-3 px-4 text-white/80">
                          {getOperatorName(item.operator_id)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-white">
                          R${' '}
                          {Number(item.amount).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditExp(item)}
                              className="p-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-[#C6FF00] transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                setItemToDelete({
                                  id: item.id,
                                  type: 'expense',
                                  title: item.title,
                                })
                              }
                              className="p-1.5 bg-rose-950/20 hover:bg-rose-950/50 text-rose-400 border border-rose-800/30 transition-colors cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MOVIMENTAÇÃO */}
      {isFinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#111111] border border-white/20 w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-mono text-sm font-bold text-white">
                {editingFin ? 'Editar Movimentação' : 'Nova Movimentação'}
              </h3>
              <button
                onClick={() => setIsFinModalOpen(false)}
                className="text-white/40 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {finError && (
              <div className="p-2.5 bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono">
                {finError}
              </div>
            )}

            <form onSubmit={handleSubmitFin} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-white/60 mb-1">Tipo *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFinType('entrada')}
                    className={`py-2 border font-bold transition-colors cursor-pointer ${
                      finType === 'entrada'
                        ? 'bg-emerald-950/50 text-emerald-400 border-emerald-500'
                        : 'bg-[#161616] text-white/40 border-white/10'
                    }`}
                  >
                    ENTRADA
                  </button>
                  <button
                    type="button"
                    onClick={() => setFinType('saida')}
                    className={`py-2 border font-bold transition-colors cursor-pointer ${
                      finType === 'saida'
                        ? 'bg-rose-950/50 text-rose-400 border-rose-500'
                        : 'bg-[#161616] text-white/40 border-white/10'
                    }`}
                  >
                    SAÍDA
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-white/60 mb-1">Título *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mensalidade Cliente Alpha"
                  value={finTitle}
                  onChange={(e) => setFinTitle(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00]"
                />
              </div>

              <div>
                <label className="block text-white/60 mb-1">Valor (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={finAmount}
                  onChange={(e) => setFinAmount(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00]"
                />
              </div>

              <div>
                <label className="block text-white/60 mb-1">Descrição (opcional)</label>
                <input
                  type="text"
                  placeholder="Detalhes ou observações"
                  value={finDescription}
                  onChange={(e) => setFinDescription(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsFinModalOpen(false)}
                  className="px-3 py-1.5 bg-white/5 text-white/70 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFin}
                  className="px-4 py-1.5 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-bold"
                >
                  {isSubmittingFin ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GASTO MENSAL */}
      {isExpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#111111] border border-white/20 w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-mono text-sm font-bold text-white">
                {editingExp ? 'Editar Gasto Mensal' : 'Novo Gasto Mensal'}
              </h3>
              <button
                onClick={() => setIsExpModalOpen(false)}
                className="text-white/40 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {expError && (
              <div className="p-2.5 bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono">
                {expError}
              </div>
            )}

            <form onSubmit={handleSubmitExp} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-white/60 mb-1">Título *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Assinatura OpenAI / Servidor"
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 mb-1">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00]"
                  />
                </div>
                <div>
                  <label className="block text-white/60 mb-1">Dia Vencimento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="Ex: 10"
                    value={expDueDay}
                    onChange={(e) => setExpDueDay(e.target.value)}
                    className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/60 mb-1">Descrição (opcional)</label>
                <input
                  type="text"
                  placeholder="Finalidade ou plano"
                  value={expDescription}
                  onChange={(e) => setExpDescription(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="expActive"
                  checked={expActive}
                  onChange={(e) => setExpActive(e.target.checked)}
                  className="accent-[#C6FF00] cursor-pointer"
                />
                <label htmlFor="expActive" className="text-white/80 cursor-pointer">
                  Gasto ativo no cálculo mensal
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsExpModalOpen(false)}
                  className="px-3 py-1.5 bg-white/5 text-white/70 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingExp}
                  className="px-4 py-1.5 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-bold"
                >
                  {isSubmittingExp ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#111111] border border-rose-500/40 w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <h3 className="font-mono text-sm font-bold text-white uppercase">
              Confirmar Exclusão
            </h3>
            <p className="text-xs font-mono text-white/70">
              Tem certeza que deseja excluir o registro "{itemToDelete.title}"? Esta operação é definitiva.
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={isDeleting}
                className="px-3 py-1.5 bg-white/5 text-white/70 hover:text-white font-mono text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs font-bold"
              >
                {isDeleting ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
