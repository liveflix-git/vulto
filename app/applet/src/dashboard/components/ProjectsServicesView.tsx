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
  DollarSign,
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
  fetchVultoPriceTable,
  createVultoPriceItem,
  updateVultoPriceItem,
  deleteVultoPriceItem,
  fetchVultoOperators,
} from '../../services/vultoCoreService';
import { supabase } from '../../lib/supabase';

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
          showToast('Tarefa criada.');
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

  const handleOpenEditScript = (sc: VultoSalesScriptItem) => {
    setEditingScript(sc);
    setScriptTitle(sc.title);
    setScriptChannel(sc.channel);
    setScriptContent(sc.content);
    setScriptError(null);
    setIsScriptModalOpen(true);
  };

  const handleSubmitScript = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scriptTitle.trim() || !scriptContent.trim()) {
      setScriptError('Preencha o título e o conteúdo do script.');
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

  const handleOpenEditPrice = (item: VultoPriceItem) => {
    setEditingPrice(item);
    setPriceServiceName(item.service_name);
    setPriceDescription(item.description || '');
    setPriceValue(item.price.toString());
    setPriceBillingType(item.billing_type);
    setPriceActive(item.active);
    setPriceError(null);
    setIsPriceModalOpen(true);
  };

  const handleSubmitPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceServiceName.trim() || !priceValue) {
      setPriceError('Informe o nome do serviço e o preço.');
      return;
    }
    const numPrice = Number(priceValue);
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
          showToast('Erro ao atualizar serviço.', 'error');
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
                    updated_at: new Date().toISOString(),
                  }
                : p
            )
          );
          setIsPriceModalOpen(false);
          showToast('Serviço atualizado.');
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
          showToast('Erro ao cadastrar serviço.', 'error');
        } else if (res.data) {
          setPrices((prev) => [res.data!, ...prev]);
          setIsPriceModalOpen(false);
          showToast('Serviço cadastrado.');
        }
      }
    } catch (err: any) {
      setPriceError(err.message || 'Erro inesperado.');
      showToast('Erro inesperado.', 'error');
    } finally {
      setIsSubmittingPrice(false);
    }
  };

  const handleTogglePriceActive = async (item: VultoPriceItem) => {
    const nextActive = !item.active;
    setPrices((prev) =>
      prev.map((p) => (p.id === item.id ? { ...p, active: nextActive } : p))
    );
    const res = await updateVultoPriceItem(item.id, { active: nextActive });
    if (res.error) {
      showToast('Erro ao atualizar status do serviço.', 'error');
      setPrices((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, active: item.active } : p))
      );
    } else {
      showToast(nextActive ? 'Serviço ativado.' : 'Serviço inativado.');
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
          showToast('Não foi possível excluir o serviço: ' + res.error, 'error');
        } else {
          setPrices((prev) => prev.filter((p) => p.id !== itemToDelete.id));
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

  const filteredScripts = useMemo(() => {
    if (scriptChannelFilter === 'ALL') return scripts;
    return scripts.filter((s) => s.channel === scriptChannelFilter);
  }, [scripts, scriptChannelFilter]);

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
            Checklist operacional de entregas e repositório de scripts comerciais.
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
                <thead>
                  <tr className="border-b border-white/10 bg-[#0E0E0E] text-white/50 text-[10px] uppercase">
                    <th className="py-3 px-4 w-12 text-center">Status</th>
                    <th className="py-3 px-4">Título</th>
                    <th className="py-3 px-4">Observação</th>
                    <th className="py-3 px-4">Criado por</th>
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loadingTasks ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-white/40">
                        Carregando tarefas...
                      </td>
                    </tr>
                  ) : tasks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-white/40">
                        Nenhuma tarefa cadastrada.
                      </td>
                    </tr>
                  ) : (
                    tasks.map((task) => (
                      <tr key={task.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleTaskCompleted(task)}
                            className="cursor-pointer text-white/60 hover:text-white"
                          >
                            {task.completed ? (
                              <CheckSquare className="w-4 h-4 text-[#C6FF00]" />
                            ) : (
                              <Square className="w-4 h-4 text-white/30" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`font-bold ${
                              task.completed ? 'line-through text-white/40' : 'text-white'
                            }`}
                          >
                            {task.title}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-white/60">
                          {task.notes || <span className="text-white/20">-</span>}
                        </td>
                        <td className="py-3 px-4 text-white/80">
                          {getOperatorName(task.operator_id)}
                        </td>
                        <td className="py-3 px-4 text-white/50">
                          {new Date(task.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditTask(task)}
                              className="p-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-[#C6FF00] transition-colors cursor-pointer"
                              title="Editar"
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
                              className="p-1.5 bg-white/5 hover:bg-rose-500/20 text-white/70 hover:text-rose-400 transition-colors cursor-pointer"
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
      {/* ABA 2: SCRIPTS DE VENDA */}
      {/* ======================================================== */}
      {activeTab === 'scripts' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-white/50 uppercase">Filtrar Canal:</span>
              <select
                value={scriptChannelFilter}
                onChange={(e) => setScriptChannelFilter(e.target.value as any)}
                className="bg-[#161616] border border-white/10 px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-[#C6FF00] cursor-pointer"
              >
                <option value="ALL">Todos os Canais</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="E-mail">E-mail</option>
                <option value="Presencial">Presencial</option>
              </select>
            </div>
            <button
              onClick={handleOpenNewScript}
              className="px-4 py-2 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-mono font-bold text-xs tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ NOVO SCRIPT</span>
            </button>
          </div>

          {loadingScripts ? (
            <div className="py-12 text-center font-mono text-xs text-white/40 bg-[#111111] border border-white/10">
              Carregando scripts de venda...
            </div>
          ) : filteredScripts.length === 0 ? (
            <div className="py-12 text-center font-mono text-xs text-white/40 bg-[#111111] border border-white/10">
              Nenhum script encontrado.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredScripts.map((script) => (
                <div
                  key={script.id}
                  className="bg-[#111111] border border-white/10 p-5 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-white/5 text-white/70 border border-white/10 font-mono text-[10px] uppercase">
                        {script.channel}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopyScript(script)}
                          className="p-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-[#C6FF00] transition-colors cursor-pointer"
                          title="Copiar texto"
                        >
                          {copiedScriptId === script.id ? (
                            <Check className="w-3.5 h-3.5 text-[#C6FF00]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleOpenEditScript(script)}
                          className="p-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-[#C6FF00] transition-colors cursor-pointer"
                          title="Editar"
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
                          className="p-1.5 bg-white/5 hover:bg-rose-500/20 text-white/70 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <h3 className="font-mono text-sm font-bold text-white">{script.title}</h3>
                    <p className="text-xs font-sans text-white/70 whitespace-pre-wrap leading-relaxed bg-[#161616] p-3 border border-white/5 max-h-48 overflow-y-auto">
                      {script.content}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-white/40 pt-2 border-t border-white/5">
                    <span>Resp: {getOperatorName(script.operator_id)}</span>
                    <span>{new Date(script.created_at).toLocaleDateString('pt-BR')}</span>
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
            <div>
              <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                TABELA COMERCIAL
              </h2>
              <p className="text-xs text-white/50 font-sans mt-0.5">
                Valores oficiais, pisos comerciais e serviços da VULTO LAB.
              </p>
            </div>
            <button
              onClick={handleOpenNewPrice}
              className="px-4 py-2 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-mono font-bold text-xs tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ NOVO SERVIÇO</span>
            </button>
          </div>

          <div className="bg-[#111111] border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/10 bg-[#0E0E0E] text-white/50 text-[10px] uppercase">
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Serviço</th>
                    <th className="py-3 px-4">Descrição</th>
                    <th className="py-3 px-4">Valor</th>
                    <th className="py-3 px-4">Cobrança</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loadingPrices ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-white/40">
                        Carregando tabela de preços...
                      </td>
                    </tr>
                  ) : prices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-white/40 space-y-3">
                        <div className="font-bold uppercase tracking-wider">NENHUM PREÇO CADASTRADO</div>
                        <button
                          onClick={handleOpenNewPrice}
                          className="px-4 py-2 bg-[#C6FF00] text-[#0A0A0A] font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>+ NOVO SERVIÇO</span>
                        </button>
                      </td>
                    </tr>
                  ) : (
                    prices.map((item) => {
                      const formattedPrice = Number(item.price || 0).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      });
                      const billingLabel = item.billing_type === 'mensal' ? 'MENSAL' : 'PAGAMENTO ÚNICO';
                      const displayPrice = item.billing_type === 'mensal' ? `${formattedPrice} / MÊS` : formattedPrice;
                      return (
                        <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleTogglePriceActive(item)}
                              className={`px-2 py-0.5 text-[10px] uppercase font-bold border transition-colors cursor-pointer ${
                                item.active
                                  ? 'bg-[#C6FF00]/10 text-[#C6FF00] border-[#C6FF00]/30 hover:bg-[#C6FF00]/20'
                                  : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'
                              }`}
                            >
                              {item.active ? 'ATIVO' : 'INATIVO'}
                            </button>
                          </td>
                          <td className="py-3 px-4 font-bold text-white">{item.service_name}</td>
                          <td className="py-3 px-4 text-white/60 max-w-xs truncate">
                            {item.description || <span className="text-white/20">-</span>}
                          </td>
                          <td className="py-3 px-4 text-[#C6FF00] font-bold">{displayPrice}</td>
                          <td className="py-3 px-4 text-white/70">{billingLabel}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditPrice(item)}
                                className="p-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-[#C6FF00] transition-colors cursor-pointer"
                                title="Editar"
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
                                className="p-1.5 bg-white/5 hover:bg-rose-500/20 text-white/70 hover:text-rose-400 transition-colors cursor-pointer"
                                title="Excluir"
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
        </div>
      )}

      {/* MODAL: TAREFA */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#111111] border border-white/20 w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-mono text-sm font-bold text-white">
                {editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
              </h3>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="text-white/40 hover:text-white p-1"
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
                  placeholder="Ex: Entregar relatório quinzenal de tráfego"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00]"
                />
              </div>
              <div>
                <label className="block text-white/60 mb-1">Observação (opcional)</label>
                <textarea
                  rows={3}
                  placeholder="Instruções ou links adicionais"
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

      {/* MODAL: SCRIPT DE VENDA */}
      {isScriptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#111111] border border-white/20 w-full max-w-xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-mono text-sm font-bold text-white">
                {editingScript ? 'Editar Script de Venda' : 'Novo Script de Venda'}
              </h3>
              <button
                onClick={() => setIsScriptModalOpen(false)}
                className="text-white/40 hover:text-white p-1"
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
                    placeholder="Ex: Abordagem Inicial para Clínicas"
                    value={scriptTitle}
                    onChange={(e) => setScriptTitle(e.target.value)}
                    className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00]"
                  />
                </div>
                <div>
                  <label className="block text-white/60 mb-1">Canal *</label>
                  <select
                    value={scriptChannel}
                    onChange={(e) => setScriptChannel(e.target.value as VultoScriptChannel)}
                    className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00] cursor-pointer"
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="E-mail">E-mail</option>
                    <option value="Presencial">Presencial</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-white/60 mb-1">Conteúdo do Script (até 5.000 caracteres) *</label>
                <textarea
                  rows={8}
                  maxLength={5000}
                  required
                  placeholder="Escreva a mensagem completa, argumentos de contorno de objeções, tom de voz, proposta..."
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

      {/* MODAL: TABELA DE PREÇOS */}
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
                  placeholder="Ex: VULTO Site"
                  value={priceServiceName}
                  onChange={(e) => setPriceServiceName(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00]"
                />
              </div>
              <div>
                <label className="block text-white/60 mb-1">DESCRIÇÃO</label>
                <input
                  type="text"
                  placeholder="Ex: Criação de site profissional com painel"
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

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
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
