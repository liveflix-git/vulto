import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Check,
  AlertCircle,
  X,
  FileText,
  MessageSquare,
  Mail,
  UserCheck,
  Tag,
  DollarSign,
  Search,
} from 'lucide-react';
import {
  VultoTaskItem,
  VultoSalesScriptItem,
  VultoScriptChannel,
  VultoOperator,
  VultoPriceItem,
  VultoBillingType,
  fetchVultoTasks,
  createVultoTask,
  toggleVultoTask,
  updateVultoTask,
  deleteVultoTask,
  fetchVultoSalesScripts,
  createVultoSalesScript,
  updateVultoSalesScript,
  deleteVultoSalesScript,
  fetchVultoOperators,
  fetchVultoPriceTable,
  createVultoPriceItem,
  updateVultoPriceItem,
  deleteVultoPriceItem,
} from '../../services/vultoCoreService';
import { supabase } from '../../lib/supabase.ts';

export function ProjectsServicesView() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'scripts' | 'pricing'>('tasks');

  // Checklist de Tarefas
  const [tasks, setTasks] = useState<VultoTaskItem[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  // Scripts de Venda
  const [scripts, setScripts] = useState<VultoSalesScriptItem[]>([]);
  const [loadingScripts, setLoadingScripts] = useState(true);
  const [scriptChannelFilter, setScriptChannelFilter] = useState<'ALL' | VultoScriptChannel>('ALL');

  // Tabela de Preços
  const [prices, setPrices] = useState<VultoPriceItem[]>([]);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [priceSearch, setPriceSearch] = useState('');
  const [priceBillingFilter, setPriceBillingFilter] = useState<'ALL' | VultoBillingType>('ALL');

  // Operadores
  const [operators, setOperators] = useState<VultoOperator[]>([]);

  // Modal Tarefa
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<VultoTaskItem | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskNotes, setTaskNotes] = useState('');
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);

  // Modal Script
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [editingScript, setEditingScript] = useState<VultoSalesScriptItem | null>(null);
  const [scriptTitle, setScriptTitle] = useState('');
  const [scriptChannel, setScriptChannel] = useState<VultoScriptChannel>('WhatsApp');
  const [scriptContent, setScriptContent] = useState('');
  const [isSubmittingScript, setIsSubmittingScript] = useState(false);
  const [scriptError, setScriptError] = useState<string | null>(null);

  // Modal Preço
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<VultoPriceItem | null>(null);
  const [priceServiceName, setPriceServiceName] = useState('');
  const [priceDescription, setPriceDescription] = useState('');
  const [priceValue, setPriceValue] = useState('');
  const [priceBillingType, setPriceBillingType] = useState<VultoBillingType>('unico');
  const [priceActive, setPriceActive] = useState(true);
  const [isSubmittingPrice, setIsSubmittingPrice] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  // Confirmação Exclusão
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    type: 'task' | 'script' | 'price';
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Feedback Copiado & Toast
  const [copiedScriptId, setCopiedScriptId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = useCallback(async () => {
    try {
      const [ops, tskRes, scRes, prRes] = await Promise.all([
        fetchVultoOperators(),
        fetchVultoTasks(),
        fetchVultoSalesScripts(),
        fetchVultoPriceTable(),
      ]);
      setOperators(ops);
      setTasks(tskRes.data);
      setScripts(scRes.data);
      setPrices(prRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTasks(false);
      setLoadingScripts(false);
      setLoadingPrices(false);
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

  // Supabase Realtime
  useEffect(() => {
    const channel = supabase
      .channel('vulto_projects_services_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vulto_tasks' }, () => {
        fetchVultoTasks().then((res) => setTasks(res.data));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vulto_sales_scripts' }, () => {
        fetchVultoSalesScripts().then((res) => setScripts(res.data));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vulto_price_table' }, () => {
        fetchVultoPriceTable().then((res) => setPrices(res.data));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getOperatorName = (operatorId: string | null) => {
    if (!operatorId) return 'Operador';
    const match = operators.find((op) => op.id === operatorId);
    return match ? match.name : 'Operador';
  };

  // ==========================================
  // HANDLERS TAREFAS
  // ==========================================
  const handleToggleTaskCompleted = async (task: VultoTaskItem) => {
    const nextCompleted = !task.completed;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              completed: nextCompleted,
              completed_at: nextCompleted ? new Date().toISOString() : null,
            }
          : t
      )
    );

    const res = await toggleVultoTask(task.id, nextCompleted);
    if (res.error) {
      showToast('Erro ao atualizar status da tarefa.', 'error');
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: task.completed } : t))
      );
    }
  };

  const handleOpenNewTask = () => {
    setEditingTask(null);
    setTaskTitle('');
    setTaskNotes('');
    setTaskError(null);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task: VultoTaskItem) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskNotes(task.notes || '');
    setTaskError(null);
    setIsTaskModalOpen(true);
  };

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      setTaskError('Informe o título da tarefa.');
      return;
    }

    setIsSubmittingTask(true);
    setTaskError(null);

    try {
      if (editingTask) {
        const res = await updateVultoTask(editingTask.id, {
          title: taskTitle.trim(),
          notes: taskNotes.trim() || null,
        });

        if (res.error) {
          setTaskError(res.error);
        } else {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === editingTask.id
                ? { ...t, title: taskTitle.trim(), notes: taskNotes.trim() || null }
                : t
            )
          );
          setIsTaskModalOpen(false);
          showToast('Tarefa atualizada.');
        }
      } else {
        const res = await createVultoTask({
          title: taskTitle.trim(),
          notes: taskNotes.trim() || null,
        });

        if (res.error) {
          setTaskError(res.error);
        } else if (res.data) {
          setTasks((prev) => [res.data!, ...prev]);
          setIsTaskModalOpen(false);
          showToast('Tarefa adicionada.');
        }
      }
    } catch (err: any) {
      setTaskError(err.message || 'Erro inesperado.');
    } finally {
      setIsSubmittingTask(false);
    }
  };

  // ==========================================
  // HANDLERS SCRIPTS DE VENDA
  // ==========================================
  const handleOpenNewScript = () => {
    setEditingScript(null);
    setScriptTitle('');
    setScriptChannel('WhatsApp');
    setScriptContent('');
    setScriptError(null);
    setIsScriptModalOpen(true);
  };

  const handleOpenEditScript = (script: VultoSalesScriptItem) => {
    setEditingScript(script);
    setScriptTitle(script.title);
    setScriptChannel(script.channel);
    setScriptContent(script.content);
    setScriptError(null);
    setIsScriptModalOpen(true);
  };

  const handleSubmitScript = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scriptTitle.trim()) {
      setScriptError('Informe o título do script.');
      return;
    }
    if (!scriptContent.trim()) {
      setScriptError('Informe o conteúdo do script.');
      return;
    }

    setIsSubmittingScript(true);
    setScriptError(null);

    try {
      if (editingScript) {
        const res = await updateVultoSalesScript(editingScript.id, {
          title: scriptTitle.trim(),
          channel: scriptChannel,
          content: scriptContent,
        });

        if (res.error) {
          setScriptError(res.error);
        } else {
          setScripts((prev) =>
            prev.map((s) =>
              s.id === editingScript.id
                ? { ...s, title: scriptTitle.trim(), channel: scriptChannel, content: scriptContent }
                : s
            )
          );
          setIsScriptModalOpen(false);
          showToast('Script atualizado.');
        }
      } else {
        const res = await createVultoSalesScript({
          title: scriptTitle.trim(),
          channel: scriptChannel,
          content: scriptContent,
        });

        if (res.error) {
          setScriptError(res.error);
        } else if (res.data) {
          setScripts((prev) => [res.data!, ...prev]);
          setIsScriptModalOpen(false);
          showToast('Script cadastrado.');
        }
      }
    } catch (err: any) {
      setScriptError(err.message || 'Erro inesperado.');
    } finally {
      setIsSubmittingScript(false);
    }
  };

  const handleCopyScript = (script: VultoSalesScriptItem) => {
    navigator.clipboard.writeText(script.content);
    setCopiedScriptId(script.id);
    showToast('COPIADO');
    setTimeout(() => setCopiedScriptId(null), 2500);
  };

  // ==========================================
  // HANDLERS TABELA DE PREÇOS
  // ==========================================
  const handleOpenNewPrice = () => {
    setEditingPrice(null);
    setPriceServiceName('');
    setPriceDescription('');
    setPriceValue('');
    setPriceBillingType('unico');
    setPriceActive(true);
    setPriceError(null);
    setIsPriceModalOpen(true);
  };

  const handleOpenEditPrice = (price: VultoPriceItem) => {
    setEditingPrice(price);
    setPriceServiceName(price.service_name);
    setPriceDescription(price.description || '');
    setPriceValue(String(price.price));
    setPriceBillingType(price.billing_type);
    setPriceActive(price.active);
    setPriceError(null);
    setIsPriceModalOpen(true);
  };

  const handleTogglePriceActive = async (price: VultoPriceItem) => {
    const nextActive = !price.active;
    setPrices((prev) =>
      prev.map((p) => (p.id === price.id ? { ...p, active: nextActive } : p))
    );

    const res = await updateVultoPriceItem(price.id, { active: nextActive });
    if (res.error) {
      showToast('Erro ao alterar status do preço.', 'error');
      setPrices((prev) =>
        prev.map((p) => (p.id === price.id ? { ...p, active: price.active } : p))
      );
    } else {
      showToast(nextActive ? 'Serviço ativado.' : 'Serviço desativado.');
    }
  };

  const handleSubmitPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceServiceName.trim()) {
      setPriceError('Informe o nome do serviço.');
      return;
    }
    const numPrice = parseFloat(priceValue.replace(',', '.'));
    if (isNaN(numPrice) || numPrice < 0) {
      setPriceError('Informe um valor de preço válido.');
      return;
    }

    setIsSubmittingPrice(true);
    setPriceError(null);

    try {
      if (editingPrice) {
        const res = await updateVultoPriceItem(editingPrice.id, {
          service_name: priceServiceName.trim(),
          description: priceDescription.trim() || null,
          price: numPrice,
          billing_type: priceBillingType,
          active: priceActive,
        });

        if (res.error) {
          setPriceError(res.error);
        } else {
          setPrices((prev) =>
            prev.map((p) =>
              p.id === editingPrice.id
                ? {
                    ...p,
                    service_name: priceServiceName.trim(),
                    description: priceDescription.trim() || null,
                    price: numPrice,
                    billing_type: priceBillingType,
                    active: priceActive,
                  }
                : p
            )
          );
          setIsPriceModalOpen(false);
          showToast('Preço atualizado.');
        }
      } else {
        const res = await createVultoPriceItem({
          service_name: priceServiceName.trim(),
          description: priceDescription.trim() || null,
          price: numPrice,
          billing_type: priceBillingType,
          active: priceActive,
        });

        if (res.error) {
          setPriceError(res.error);
        } else if (res.data) {
          setPrices((prev) => [res.data!, ...prev]);
          setIsPriceModalOpen(false);
          showToast('Serviço cadastrado na tabela de preços.');
        }
      }
    } catch (err: any) {
      setPriceError(err.message || 'Erro inesperado.');
    } finally {
      setIsSubmittingPrice(false);
    }
  };

  // ==========================================
  // CONFIRMAÇÃO DE EXCLUSÃO
  // ==========================================
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);

    try {
      if (itemToDelete.type === 'task') {
        const res = await deleteVultoTask(itemToDelete.id);
        if (res.error) {
          showToast('Não foi possível excluir a tarefa: ' + res.error, 'error');
        } else {
          setTasks((prev) => prev.filter((t) => t.id !== itemToDelete.id));
          showToast('Registro excluído.');
          setItemToDelete(null);
        }
      } else if (itemToDelete.type === 'script') {
        const res = await deleteVultoSalesScript(itemToDelete.id);
        if (res.error) {
          showToast('Não foi possível excluir o script: ' + res.error, 'error');
        } else {
          setScripts((prev) => prev.filter((s) => s.id !== itemToDelete.id));
          showToast('Registro excluído.');
          setItemToDelete(null);
        }
      } else if (itemToDelete.type === 'price') {
        const res = await deleteVultoPriceItem(itemToDelete.id);
        if (res.error) {
          showToast('Não foi possível excluir o preço: ' + res.error, 'error');
        } else {
          setPrices((prev) => prev.filter((p) => p.id !== itemToDelete.id));
          showToast('Serviço excluído da tabela.');
          setItemToDelete(null);
        }
      }
    } catch (e: any) {
      showToast('Não foi possível excluir o registro.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredScripts = useMemo(() => {
    if (scriptChannelFilter === 'ALL') return scripts;
    return scripts.filter((s) => s.channel === scriptChannelFilter);
  }, [scripts, scriptChannelFilter]);

  const filteredPrices = useMemo(() => {
    return prices.filter((p) => {
      const matchSearch =
        p.service_name.toLowerCase().includes(priceSearch.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(priceSearch.toLowerCase()));
      const matchBilling = priceBillingFilter === 'ALL' || p.billing_type === priceBillingFilter;
      return matchSearch && matchBilling;
    });
  }, [prices, priceSearch, priceBillingFilter]);

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
            PROJETOS & SERVIÇOS
          </h1>
          <p className="text-xs text-white/50 font-sans mt-0.5">
            Checklist operacional de entregas, repositório de scripts comerciais e tabela de preços.
          </p>
        </div>

        {/* Abas */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 font-mono text-xs font-bold tracking-wider transition-colors cursor-pointer border ${
              activeTab === 'tasks'
                ? 'bg-[#161616] text-[#C6FF00] border-[#C6FF00]'
                : 'bg-transparent text-white/60 hover:text-white border-white/10'
            }`}
          >
            CHECKLIST DE TAREFAS
          </button>
          <button
            onClick={() => setActiveTab('scripts')}
            className={`px-4 py-2 font-mono text-xs font-bold tracking-wider transition-colors cursor-pointer border ${
              activeTab === 'scripts'
                ? 'bg-[#161616] text-[#C6FF00] border-[#C6FF00]'
                : 'bg-transparent text-white/60 hover:text-white border-white/10'
            }`}
          >
            SCRIPTS DE VENDA
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-4 py-2 font-mono text-xs font-bold tracking-wider transition-colors cursor-pointer border ${
              activeTab === 'pricing'
                ? 'bg-[#161616] text-[#C6FF00] border-[#C6FF00]'
                : 'bg-transparent text-white/60 hover:text-white border-white/10'
            }`}
          >
            TABELA DE PREÇOS
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ABA 1: CHECKLIST DE TAREFAS */}
      {/* ======================================================== */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-white/50 uppercase">
              Tarefas Operacionais e Entregas
            </span>
            <button
              onClick={handleOpenNewTask}
              className="px-4 py-2 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-mono font-bold text-xs tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ NOVA TAREFA</span>
            </button>
          </div>

          <div className="bg-[#111111] border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#161616] text-white/50 border-b border-white/10 uppercase">
                  <tr>
                    <th className="p-3 w-12 text-center">Status</th>
                    <th className="p-3">Título / Demanda</th>
                    <th className="p-3 hidden md:table-cell">Observações</th>
                    <th className="p-3 hidden sm:table-cell w-36">Operador</th>
                    <th className="p-3 text-right w-24">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loadingTasks ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-white/40">
                        Carregando tarefas operacionais...
                      </td>
                    </tr>
                  ) : tasks.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-white/40">
                        Nenhuma tarefa cadastrada. Clique em "+ NOVA TAREFA" para começar.
                      </td>
                    </tr>
                  ) : (
                    tasks.map((task) => (
                      <tr
                        key={task.id}
                        className={`hover:bg-white/[0.02] transition-colors ${
                          task.completed ? 'opacity-50' : ''
                        }`}
                      >
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleToggleTaskCompleted(task)}
                            className="cursor-pointer text-[#C6FF00] hover:opacity-80 transition-opacity inline-flex items-center justify-center"
                            title={task.completed ? 'Marcar como pendente' : 'Marcar como concluída'}
                          >
                            {task.completed ? (
                              <CheckSquare className="w-5 h-5" />
                            ) : (
                              <Square className="w-5 h-5 text-white/40 hover:text-white" />
                            )}
                          </button>
                        </td>
                        <td className="p-3">
                          <span
                            className={`font-medium ${
                              task.completed ? 'line-through text-white/50' : 'text-white'
                            }`}
                          >
                            {task.title}
                          </span>
                        </td>
                        <td className="p-3 hidden md:table-cell text-white/60 font-sans text-xs">
                          {task.notes || '—'}
                        </td>
                        <td className="p-3 hidden sm:table-cell text-white/60">
                          <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-none text-[11px]">
                            {getOperatorName(task.operator_id)}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditTask(task)}
                              className="p-1.5 text-white/60 hover:text-white hover:bg-white/5 cursor-pointer"
                              title="Editar Tarefa"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                setItemToDelete({
                                  id: task.id,
                                  type: 'task',
                                  title: task.title,
                                })
                              }
                              className="p-1.5 text-white/60 hover:text-rose-400 hover:bg-white/5 cursor-pointer"
                              title="Excluir Tarefa"
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
      {/* ABA 2: SCRIPTS DE VENDA */}
      {/* ======================================================== */}
      {activeTab === 'scripts' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filtros de Canal */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {(['ALL', 'WhatsApp', 'Instagram', 'Email'] as const).map((channel) => (
                <button
                  key={channel}
                  onClick={() => setScriptChannelFilter(channel)}
                  className={`px-3 py-1 font-mono text-xs font-semibold cursor-pointer border transition-colors ${
                    scriptChannelFilter === channel
                      ? 'bg-white/10 border-white/30 text-[#C6FF00]'
                      : 'bg-transparent border-white/10 text-white/50 hover:text-white'
                  }`}
                >
                  {channel === 'ALL' ? 'TODOS OS CANAIS' : channel.toUpperCase()}
                </button>
              ))}
            </div>

            <button
              onClick={handleOpenNewScript}
              className="px-4 py-2 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-mono font-bold text-xs tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ NOVO SCRIPT</span>
            </button>
          </div>

          {loadingScripts ? (
            <div className="bg-[#111111] border border-white/10 p-12 text-center text-white/40 font-mono text-xs">
              Carregando scripts comerciais...
            </div>
          ) : filteredScripts.length === 0 ? (
            <div className="bg-[#111111] border border-white/10 p-12 text-center text-white/40 font-mono text-xs">
              Nenhum script encontrado para este canal. Clique em "+ NOVO SCRIPT".
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredScripts.map((script) => (
                <div
                  key={script.id}
                  className="bg-[#111111] border border-white/10 p-4 flex flex-col justify-between hover:border-white/20 transition-colors group relative"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-bold text-[#C6FF00] px-2 py-0.5 bg-[#C6FF00]/10 border border-[#C6FF00]/20">
                        {script.channel}
                      </span>
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenEditScript(script)}
                          className="p-1 text-white/40 hover:text-white cursor-pointer"
                          title="Editar Script"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setItemToDelete({
                              id: script.id,
                              type: 'script',
                              title: script.title,
                            })
                          }
                          className="p-1 text-white/40 hover:text-rose-400 cursor-pointer"
                          title="Excluir Script"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-mono text-sm font-bold text-white mb-2 leading-tight">
                      {script.title}
                    </h3>

                    <div className="bg-[#0A0A0A] border border-white/5 p-3 text-xs text-white/70 font-sans whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto mb-3">
                      {script.content}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-white/40">
                      Por {getOperatorName(script.operator_id)}
                    </span>
                    <button
                      onClick={() => handleCopyScript(script)}
                      className={`px-3 py-1.5 font-mono text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                        copiedScriptId === script.id
                          ? 'bg-[#C6FF00] text-[#0A0A0A] border-[#C6FF00]'
                          : 'bg-[#161616] text-white hover:border-[#C6FF00] border-white/10'
                      }`}
                    >
                      {copiedScriptId === script.id ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>COPIADO</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>COPIAR</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* ABA 3: TABELA DE PREÇOS */}
      {/* ======================================================== */}
      {activeTab === 'pricing' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Busca & Filtros */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 max-w-xl">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar serviço ou descrição..."
                  value={priceSearch}
                  onChange={(e) => setPriceSearch(e.target.value)}
                  className="w-full bg-[#111111] border border-white/10 pl-9 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#C6FF00]"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto">
                <button
                  onClick={() => setPriceBillingFilter('ALL')}
                  className={`px-3 py-2 font-mono text-xs font-semibold cursor-pointer border transition-colors ${
                    priceBillingFilter === 'ALL'
                      ? 'bg-white/10 border-white/30 text-[#C6FF00]'
                      : 'bg-transparent border-white/10 text-white/50 hover:text-white'
                  }`}
                >
                  TODOS
                </button>
                <button
                  onClick={() => setPriceBillingFilter('unico')}
                  className={`px-3 py-2 font-mono text-xs font-semibold cursor-pointer border transition-colors ${
                    priceBillingFilter === 'unico'
                      ? 'bg-white/10 border-white/30 text-[#C6FF00]'
                      : 'bg-transparent border-white/10 text-white/50 hover:text-white'
                  }`}
                >
                  ÚNICO
                </button>
                <button
                  onClick={() => setPriceBillingFilter('mensal')}
                  className={`px-3 py-2 font-mono text-xs font-semibold cursor-pointer border transition-colors ${
                    priceBillingFilter === 'mensal'
                      ? 'bg-white/10 border-white/30 text-[#C6FF00]'
                      : 'bg-transparent border-white/10 text-white/50 hover:text-white'
                  }`}
                >
                  MENSAL
                </button>
              </div>
            </div>

            <button
              onClick={handleOpenNewPrice}
              className="px-4 py-2 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-mono font-bold text-xs tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ NOVO SERVIÇO</span>
            </button>
          </div>

          <div className="bg-[#111111] border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#161616] text-white/50 border-b border-white/10 uppercase">
                  <tr>
                    <th className="p-3">Serviço</th>
                    <th className="p-3 hidden md:table-cell">Descrição</th>
                    <th className="p-3">Preço</th>
                    <th className="p-3">Cobrança</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 hidden sm:table-cell">Responsável</th>
                    <th className="p-3 text-right w-24">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loadingPrices ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-white/40">
                        Carregando tabela de preços...
                      </td>
                    </tr>
                  ) : filteredPrices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-white/40">
                        Nenhum serviço cadastrado na tabela de preços. Clique em "+ NOVO SERVIÇO".
                      </td>
                    </tr>
                  ) : (
                    filteredPrices.map((item) => (
                      <tr
                        key={item.id}
                        className={`hover:bg-white/[0.02] transition-colors ${
                          !item.active ? 'opacity-50' : ''
                        }`}
                      >
                        <td className="p-3 font-bold text-white">
                          <div className="flex items-center gap-2">
                            <Tag className="w-3.5 h-3.5 text-[#C6FF00]" />
                            <span>{item.service_name}</span>
                          </div>
                        </td>
                        <td className="p-3 hidden md:table-cell text-white/60 font-sans text-xs max-w-xs truncate">
                          {item.description || '—'}
                        </td>
                        <td className="p-3 font-bold text-[#C6FF00]">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(item.price)}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-mono border ${
                              item.billing_type === 'mensal'
                                ? 'bg-purple-950/40 border-purple-500/30 text-purple-300'
                                : 'bg-cyan-950/40 border-cyan-500/30 text-cyan-300'
                            }`}
                          >
                            {item.billing_type === 'mensal' ? 'Mensal' : 'Pagamento único'}
                          </span>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => handleTogglePriceActive(item)}
                            className={`px-2 py-0.5 text-[10px] font-mono cursor-pointer border transition-colors ${
                              item.active
                                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/60'
                                : 'bg-white/5 border-white/20 text-white/40 hover:bg-white/10'
                            }`}
                            title={item.active ? 'Clique para inativar' : 'Clique para ativar'}
                          >
                            {item.active ? 'Ativo' : 'Inativo'}
                          </button>
                        </td>
                        <td className="p-3 hidden sm:table-cell text-white/60">
                          <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-none text-[11px]">
                            {getOperatorName(item.operator_id)}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditPrice(item)}
                              className="p-1.5 text-white/60 hover:text-white hover:bg-white/5 cursor-pointer"
                              title="Editar Serviço"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                setItemToDelete({
                                  id: item.id,
                                  type: 'price',
                                  title: item.service_name,
                                })
                              }
                              className="p-1.5 text-white/60 hover:text-rose-400 hover:bg-white/5 cursor-pointer"
                              title="Excluir Serviço"
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
      {/* MODAL: TAREFA */}
      {/* ======================================================== */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#111111] border border-white/20 w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-mono text-sm font-bold text-white uppercase">
                {editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
              </h3>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="text-white/40 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {taskError && (
              <div className="p-2.5 bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono">
                {taskError}
              </div>
            )}

            <form onSubmit={handleSubmitTask} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-white/60 mb-1">Título da Tarefa *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Subir campanha Meta Ads cliente X"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00]"
                />
              </div>

              <div>
                <label className="block text-white/60 mb-1">Observação (opcional)</label>
                <textarea
                  rows={3}
                  placeholder="Instruções adicionais, prazo, referências..."
                  value={taskNotes}
                  onChange={(e) => setTaskNotes(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-3 py-1.5 bg-white/5 text-white/70 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTask}
                  className="px-4 py-1.5 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-bold"
                >
                  {isSubmittingTask ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: SCRIPT DE VENDA */}
      {/* ======================================================== */}
      {isScriptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#111111] border border-white/20 w-full max-w-lg p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-mono text-sm font-bold text-white uppercase">
                {editingScript ? 'Editar Script Comercial' : 'Novo Script Comercial'}
              </h3>
              <button
                onClick={() => setIsScriptModalOpen(false)}
                className="text-white/40 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {scriptError && (
              <div className="p-2.5 bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono">
                {scriptError}
              </div>
            )}

            <form onSubmit={handleSubmitScript} className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 mb-1">Título do Script *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Abordagem Fria WhatsApp"
                    value={scriptTitle}
                    onChange={(e) => setScriptTitle(e.target.value)}
                    className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00]"
                  />
                </div>
                <div>
                  <label className="block text-white/60 mb-1">Canal de Contato *</label>
                  <select
                    value={scriptChannel}
                    onChange={(e) => setScriptChannel(e.target.value as VultoScriptChannel)}
                    className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00]"
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Email">Email</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-white/60 mb-1">Conteúdo do Script (até 5.000 caracteres) *</label>
                <textarea
                  rows={6}
                  required
                  placeholder="Escreva aqui a mensagem persuasiva..."
                  value={scriptContent}
                  onChange={(e) => setScriptContent(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 p-3 text-white focus:outline-none focus:border-[#C6FF00] leading-relaxed font-sans"
                />
                <div className="text-right text-[10px] text-white/40 mt-1">
                  {scriptContent.length} / 5000 caracteres
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsScriptModalOpen(false)}
                  className="px-3 py-1.5 bg-white/5 text-white/70 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingScript}
                  className="px-4 py-1.5 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-bold"
                >
                  {isSubmittingScript ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: TABELA DE PREÇOS */}
      {/* ======================================================== */}
      {isPriceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#111111] border border-white/20 w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-mono text-sm font-bold text-white uppercase">
                {editingPrice ? 'Editar Serviço' : 'Novo Serviço'}
              </h3>
              <button
                onClick={() => setIsPriceModalOpen(false)}
                className="text-white/40 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {priceError && (
              <div className="p-2.5 bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono">
                {priceError}
              </div>
            )}

            <form onSubmit={handleSubmitPrice} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-white/60 mb-1">NOME DO SERVIÇO *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: VULTO Site Institucional"
                  value={priceServiceName}
                  onChange={(e) => setPriceServiceName(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00]"
                />
              </div>

              <div>
                <label className="block text-white/60 mb-1">DESCRIÇÃO</label>
                <input
                  type="text"
                  placeholder="Ex: Criação de site profissional responsivo"
                  value={priceDescription}
                  onChange={(e) => setPriceDescription(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 mb-1">PREÇO (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="797"
                    value={priceValue}
                    onChange={(e) => setPriceValue(e.target.value)}
                    className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00]"
                  />
                </div>
                <div>
                  <label className="block text-white/60 mb-1">TIPO DE COBRANÇA *</label>
                  <select
                    value={priceBillingType}
                    onChange={(e) => setPriceBillingType(e.target.value as VultoBillingType)}
                    className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00] cursor-pointer"
                  >
                    <option value="unico">Pagamento único</option>
                    <option value="mensal">Mensal</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="priceActiveCheck"
                  checked={priceActive}
                  onChange={(e) => setPriceActive(e.target.checked)}
                  className="w-4 h-4 accent-[#C6FF00] bg-[#161616] border-white/10 cursor-pointer"
                />
                <label htmlFor="priceActiveCheck" className="text-white/80 cursor-pointer">
                  Serviço Ativo
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsPriceModalOpen(false)}
                  className="px-3 py-1.5 bg-white/5 text-white/70 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPrice}
                  className="px-4 py-1.5 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-bold cursor-pointer"
                >
                  {isSubmittingPrice ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {/* ======================================================== */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#111111] border border-rose-500/40 w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <h3 className="font-mono text-sm font-bold text-white uppercase">
              Confirmar Exclusão
            </h3>
            <p className="text-xs font-mono text-white/70">
              Tem certeza que deseja excluir o registro "{itemToDelete.title}"?
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={isDeleting}
                className="px-3 py-1.5 bg-white/5 text-white/70 hover:text-white font-mono text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs font-bold cursor-pointer"
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
