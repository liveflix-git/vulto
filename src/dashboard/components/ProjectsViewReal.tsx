import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ListFilter,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  DollarSign,
  User,
  Layers,
  Building,
  CheckSquare,
  Square,
  Trash2,
  Edit2,
  X,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Flame,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Check,
} from 'lucide-react';
import {
  ProjectItem,
  ProjectStatus,
  ProjectPriority,
  ProjectTask,
  PROJECT_STATUS_CONFIG,
  PROJECT_PRIORITY_CONFIG,
  fetchProjectsWithTasks,
  createProjectRecord,
  updateProjectStatus,
  updateProjectRecord,
  deleteProjectRecord,
  addProjectTask,
  toggleTaskCompletion,
  deleteTaskRecord,
  calculateProjectsMetrics,
  formatProjectCurrency,
  isProjectDelayed,
  getDaysDelayed,
} from '../../services/projectsService';
import {
  fetchClients,
  fetchServicesCatalog,
  fetchProfiles,
  ClientEntity,
  ServiceItem,
  ProfileUser,
} from '../../services/crmService';

const PROJECT_STAGES: ProjectStatus[] = [
  'BACKLOG',
  'A FAZER',
  'EM ANDAMENTO',
  'AGUARDANDO CLIENTE',
  'REVISÃO',
  'CONCLUÍDO',
];

export function ProjectsViewReal() {
  // State
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [clients, setClients] = useState<ClientEntity[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [profiles, setProfiles] = useState<ProfileUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [refreshStatus, setRefreshStatus] = useState<'idle' | 'updating' | 'success' | 'error'>('idle');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [delayedOnly, setDelayedOnly] = useState<boolean>(false);
  const [responsibleFilter, setResponsibleFilter] = useState<string>('ALL');

  // Modals & Selection
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState<boolean>(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);

  // Delete Project Confirmation Modal
  const [projectToDelete, setProjectToDelete] = useState<ProjectItem | null>(null);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  // Quick task input in detail drawer
  const [newQuickTaskTitle, setNewQuickTaskTitle] = useState<string>('');
  const [isAddingTask, setIsAddingTask] = useState<boolean>(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // -------------------------------------------------------------
  // CARREGAR DADOS
  // -------------------------------------------------------------
  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
      setRefreshStatus('updating');
    } else {
      setIsLoading(true);
    }

    try {
      const [projectsData, clientsData, servicesData, profilesData] = await Promise.all([
        fetchProjectsWithTasks(),
        fetchClients(),
        fetchServicesCatalog(),
        fetchProfiles(),
      ]);

      setProjects(projectsData);
      setClients(clientsData);
      setServices(servicesData);
      setProfiles(profilesData);

      if (showRefreshing) {
        setRefreshStatus('success');
        setTimeout(() => setRefreshStatus('idle'), 2000);
      }
    } catch (err) {
      console.error('Erro ao carregar módulo de projetos:', err);
      if (showRefreshing) {
        setRefreshStatus('error');
        showToast('Não foi possível atualizar os dados.', 'error');
        setTimeout(() => setRefreshStatus('idle'), 3000);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const handleGlobalRefresh = () => {
      loadData(true);
    };
    window.addEventListener('vulto:refresh', handleGlobalRefresh);
    return () => window.removeEventListener('vulto:refresh', handleGlobalRefresh);
  }, [loadData]);

  // Keep selectedProject in sync when projects change
  useEffect(() => {
    if (selectedProject) {
      const updated = projects.find((p) => p.id === selectedProject.id);
      if (updated) {
        setSelectedProject(updated);
      }
    }
  }, [projects, selectedProject]);

  // Metrics
  const metrics = useMemo(() => calculateProjectsMetrics(projects), [projects]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesClient = (p.client_name || '').toLowerCase().includes(query);
        const matchesDesc = (p.description || '').toLowerCase().includes(query);
        if (!matchesName && !matchesClient && !matchesDesc) return false;
      }

      // Status
      if (statusFilter !== 'ALL' && p.status !== statusFilter) {
        return false;
      }

      // Priority
      if (priorityFilter !== 'ALL' && p.priority !== priorityFilter) {
        return false;
      }

      // Delayed only
      if (delayedOnly && !p.is_delayed) {
        return false;
      }

      // Responsible
      if (responsibleFilter !== 'ALL') {
        const respLower = (p.responsible_name || '').toLowerCase();
        if (responsibleFilter === 'felipe' && !respLower.includes('felipe')) return false;
        if (responsibleFilter === 'pietro' && !respLower.includes('pietro')) return false;
      }

      return true;
    });
  }, [projects, searchTerm, statusFilter, priorityFilter, delayedOnly, responsibleFilter]);

  // -------------------------------------------------------------
  // HANDLERS: TASKS
  // -------------------------------------------------------------
  const handleToggleTask = async (projectId: string, taskId: string, currentCompleted: boolean) => {
    const newCompleted = !currentCompleted;

    // Optimistic update
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== projectId) return proj;
        const updatedTasks = proj.tasks.map((t) =>
          t.id === taskId ? { ...t, completed: newCompleted } : t
        );
        const compCount = updatedTasks.filter((t) => t.completed).length;
        const totCount = updatedTasks.length;
        return {
          ...proj,
          tasks: updatedTasks,
          tasks_completed: compCount,
          tasks_total: totCount,
          progress_percent: totCount > 0 ? Math.round((compCount / totCount) * 100) : 0,
        };
      })
    );

    await toggleTaskCompletion(taskId, newCompleted);
  };

  const handleAddQuickTask = async (projectId: string) => {
    if (!newQuickTaskTitle.trim()) return;
    setIsAddingTask(true);
    const title = newQuickTaskTitle.trim();
    setNewQuickTaskTitle('');

    const created = await addProjectTask(projectId, title, selectedProject?.responsible_user_id);
    if (created) {
      setProjects((prev) =>
        prev.map((proj) => {
          if (proj.id !== projectId) return proj;
          const updatedTasks = [...proj.tasks, created];
          const compCount = updatedTasks.filter((t) => t.completed).length;
          const totCount = updatedTasks.length;
          return {
            ...proj,
            tasks: updatedTasks,
            tasks_completed: compCount,
            tasks_total: totCount,
            progress_percent: totCount > 0 ? Math.round((compCount / totCount) * 100) : 0,
          };
        })
      );
      showToast('Etapa adicionada.');
    }
    setIsAddingTask(false);
  };

  const handleDeleteTask = async (projectId: string, taskId: string) => {
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== projectId) return proj;
        const updatedTasks = proj.tasks.filter((t) => t.id !== taskId);
        const compCount = updatedTasks.filter((t) => t.completed).length;
        const totCount = updatedTasks.length;
        return {
          ...proj,
          tasks: updatedTasks,
          tasks_completed: compCount,
          tasks_total: totCount,
          progress_percent: totCount > 0 ? Math.round((compCount / totCount) * 100) : 0,
        };
      })
    );

    const success = await deleteTaskRecord(taskId);
    if (!success) {
      showToast('Não foi possível excluir a tarefa.', 'error');
    }
  };

  // -------------------------------------------------------------
  // HANDLERS: PROJECT ACTIONS
  // -------------------------------------------------------------
  const handleMarkProjectCompleted = async (projectId: string) => {
    const success = await updateProjectStatus(projectId, 'CONCLUÍDO');
    if (success) {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, status: 'CONCLUÍDO', is_delayed: false } : p
        )
      );
      if (selectedProject?.id === projectId) {
        setSelectedProject((prev) =>
          prev ? { ...prev, status: 'CONCLUÍDO', is_delayed: false } : null
        );
      }
      showToast('Projeto concluído com sucesso!');
    } else {
      showToast('Não foi possível atualizar o status.', 'error');
    }
  };

  const handleConfirmDeleteProject = async () => {
    if (!projectToDelete) return;
    setIsDeletingProject(true);

    try {
      const success = await deleteProjectRecord(projectToDelete.id);
      if (success) {
        // Remover imediatamente da interface
        setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));
        if (selectedProject?.id === projectToDelete.id) {
          setSelectedProject(null);
        }
        showToast('Registro excluído.');
        setProjectToDelete(null);
      } else {
        showToast('Não foi possível excluir o registro.', 'error');
      }
    } catch (e) {
      showToast('Não foi possível excluir o registro.', 'error');
    } finally {
      setIsDeletingProject(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 border font-mono text-xs flex items-center gap-2 shadow-2xl transition-all duration-300 ${
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

      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111111] border border-white/10 p-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-widest text-[#C6FF00] uppercase">
              // OPERAÇÃO & SPRINTS
            </span>
            <span className="text-white/20">•</span>
            <span className="text-[10px] font-mono text-white/50">
              SUPABASE PROJECTS
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
            Gestão de Projetos & Entregas
          </h1>
          <p className="text-xs text-white/60 font-sans mt-0.5 max-w-2xl">
            Acompanhe o status de desenvolvimento, prazos de entrega e checklist técnico de cada cliente.
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Refresh button com feedback visual */}
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="px-3.5 py-2.5 bg-[#161616] hover:bg-[#202020] text-white/80 hover:text-white border border-white/10 text-xs font-mono flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            title="Recarregar projetos do Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#C6FF00]' : 'text-white/60'}`} />
            <span>
              {refreshStatus === 'updating'
                ? 'ATUALIZANDO...'
                : refreshStatus === 'success'
                ? 'ATUALIZADO'
                : 'ATUALIZAR'}
            </span>
          </button>

          {/* New Project Button */}
          <button
            onClick={() => {
              setEditingProject(null);
              setIsNewProjectModalOpen(true);
            }}
            className="px-4 py-2.5 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-mono font-bold text-xs tracking-wider flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>NOVO PROJETO</span>
          </button>
        </div>
      </div>

      {/* CARDS DE RESUMO OPERACIONAL */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Projetos */}
        <div className="bg-[#111111] border border-white/10 p-3.5">
          <div className="text-[10px] font-mono text-white/40 uppercase mb-1">Total Projetos</div>
          <div className="text-xl font-bold font-mono text-white">{metrics.totalProjects}</div>
          <div className="text-[10px] font-mono text-white/50 mt-1">Todas as demandas</div>
        </div>

        {/* Em Andamento */}
        <div className="bg-[#111111] border border-white/10 p-3.5">
          <div className="text-[10px] font-mono text-white/40 uppercase mb-1">Em Execução</div>
          <div className="text-xl font-bold font-mono text-amber-400">{metrics.activeProjects}</div>
          <div className="text-[10px] font-mono text-amber-400/80 mt-1">Sprints ativas</div>
        </div>

        {/* Concluídos */}
        <div className="bg-[#111111] border border-white/10 p-3.5">
          <div className="text-[10px] font-mono text-white/40 uppercase mb-1">Concluídos</div>
          <div className="text-xl font-bold font-mono text-emerald-400">{metrics.completedProjects}</div>
          <div className="text-[10px] font-mono text-emerald-400/80 mt-1">{metrics.completionRate}% de taxa</div>
        </div>

        {/* Atrasados */}
        <div className="bg-[#111111] border border-white/10 p-3.5">
          <div className="text-[10px] font-mono text-white/40 uppercase mb-1 flex items-center justify-between">
            <span>Atrasados</span>
            {metrics.delayedProjects > 0 && <Flame className="w-3 h-3 text-rose-500 animate-pulse" />}
          </div>
          <div className={`text-xl font-bold font-mono ${metrics.delayedProjects > 0 ? 'text-rose-400' : 'text-white/60'}`}>
            {metrics.delayedProjects}
          </div>
          <div className="text-[10px] font-mono text-white/50 mt-1">Requerem atenção</div>
        </div>

        {/* Valor em Contrato */}
        <div className="bg-[#111111] border border-white/10 p-3.5 col-span-2 sm:col-span-1 lg:col-span-2">
          <div className="text-[10px] font-mono text-white/40 uppercase mb-1">Valor Contratado em Sprints</div>
          <div className="text-xl font-bold font-mono text-[#C6FF00]">
            {formatProjectCurrency(metrics.totalContractValue)}
          </div>
          <div className="text-[10px] font-mono text-white/50 mt-1">Pipeline sob entrega técnica</div>
        </div>
      </div>

      {/* FILTROS E BUSCA */}
      <div className="bg-[#111111] border border-white/10 p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-white/40 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por projeto, cliente ou escopo técnico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#161616] border border-white/10 pl-9 pr-3 py-1.5 text-xs text-white placeholder-white/30 font-mono focus:outline-none focus:border-[#C6FF00]"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#161616] border border-white/10 px-2.5 py-1.5 text-white/80 focus:outline-none focus:border-[#C6FF00] cursor-pointer"
            >
              <option value="ALL">Status: Todos</option>
              {PROJECT_STAGES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>

            {/* Priority */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-[#161616] border border-white/10 px-2.5 py-1.5 text-white/80 focus:outline-none focus:border-[#C6FF00] cursor-pointer"
            >
              <option value="ALL">Prioridade: Todas</option>
              <option value="Baixa">Baixa</option>
              <option value="Normal">Normal</option>
              <option value="Alta">Alta</option>
              <option value="Urgente">Urgente</option>
            </select>

            {/* Responsible */}
            <select
              value={responsibleFilter}
              onChange={(e) => setResponsibleFilter(e.target.value)}
              className="bg-[#161616] border border-white/10 px-2.5 py-1.5 text-white/80 focus:outline-none focus:border-[#C6FF00] cursor-pointer"
            >
              <option value="ALL">Responsável: Todos</option>
              <option value="felipe">Felipe</option>
              <option value="pietro">Pietro</option>
            </select>

            {/* Delayed Checkbox */}
            <button
              onClick={() => setDelayedOnly(!delayedOnly)}
              className={`px-3 py-1.5 border text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
                delayedOnly
                  ? 'bg-rose-950/60 border-rose-500/80 text-rose-300 font-bold'
                  : 'bg-[#161616] border-white/10 text-white/60 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Apenas Atrasados</span>
            </button>
          </div>
        </div>
      </div>

      {/* TABELA PRINCIPAL DE PROJETOS */}
      <div className="bg-[#111111] border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-[#0E0E0E] text-white/50 text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4 font-bold">Projeto / Demanda</th>
                <th className="py-3 px-4 font-bold">Cliente</th>
                <th className="py-3 px-4 font-bold">Serviço</th>
                <th className="py-3 px-4 font-bold">Responsável</th>
                <th className="py-3 px-4 font-bold text-center">Status</th>
                <th className="py-3 px-4 font-bold text-center">Prioridade</th>
                <th className="py-3 px-4 font-bold">Prazo (Deadline)</th>
                <th className="py-3 px-4 font-bold text-center">Progresso</th>
                <th className="py-3 px-4 font-bold text-right">Valor</th>
                <th className="py-3 px-4 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-white/40">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#C6FF00]" />
                    Carregando entregas do Supabase...
                  </td>
                </tr>
              ) : filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-white/40">
                    Nenhum projeto encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((proj) => {
                  const statusCfg = PROJECT_STATUS_CONFIG[proj.status] || PROJECT_STATUS_CONFIG['A FAZER'];
                  const priorityCfg = PROJECT_PRIORITY_CONFIG[proj.priority] || PROJECT_PRIORITY_CONFIG['Normal'];
                  const daysDelayed = getDaysDelayed(proj.deadline);

                  return (
                    <tr
                      key={proj.id}
                      className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                    >
                      {/* Nome do Projeto */}
                      <td className="py-3.5 px-4" onClick={() => setSelectedProject(proj)}>
                        <div className="font-bold text-white group-hover:text-[#C6FF00] transition-colors">
                          {proj.name}
                        </div>
                        {proj.description && (
                          <div className="text-[11px] text-white/40 font-sans mt-0.5 line-clamp-1 max-w-xs">
                            {proj.description}
                          </div>
                        )}
                      </td>

                      {/* Cliente */}
                      <td className="py-3.5 px-4" onClick={() => setSelectedProject(proj)}>
                        <span className="text-white/80">{proj.client_name || 'Cliente Geral'}</span>
                      </td>

                      {/* Serviço */}
                      <td className="py-3.5 px-4" onClick={() => setSelectedProject(proj)}>
                        <span className="text-white/60">{proj.service_name || 'Especializado'}</span>
                      </td>

                      {/* Responsável */}
                      <td className="py-3.5 px-4" onClick={() => setSelectedProject(proj)}>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#C6FF00]" />
                          <span className="text-white/80">
                            {proj.responsible_name
                              ? proj.responsible_name.toLowerCase().includes('pietro')
                                ? 'Pietro'
                                : 'Felipe'
                              : 'Felipe'}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-mono uppercase font-bold border ${statusCfg.badgeBg}`}
                        >
                          {statusCfg.label}
                        </span>
                      </td>

                      {/* Prioridade */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono ${priorityCfg.badgeClass}`}
                        >
                          <span className={`w-1 h-1 rounded-full ${priorityCfg.dotClass}`} />
                          {priorityCfg.label}
                        </span>
                      </td>

                      {/* Prazo */}
                      <td className="py-3.5 px-4" onClick={() => setSelectedProject(proj)}>
                        <div className="flex flex-col">
                          <span
                            className={
                              proj.is_delayed
                                ? 'text-rose-400 font-bold flex items-center gap-1'
                                : 'text-white/70'
                            }
                          >
                            {proj.deadline
                              ? new Date(proj.deadline + 'T00:00:00').toLocaleDateString('pt-BR')
                              : 'Sem prazo'}
                          </span>
                          {proj.is_delayed && (
                            <span className="text-[10px] text-rose-400/80">
                              Atrasado há {daysDelayed}d
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Progresso de Tarefas */}
                      <td className="py-3.5 px-4 text-center" onClick={() => setSelectedProject(proj)}>
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] text-white/50">
                            {proj.tasks_completed}/{proj.tasks_total} ({proj.progress_percent}%)
                          </span>
                          <div className="w-16 h-1.5 bg-[#1C1C1C] overflow-hidden">
                            <div
                              style={{ width: `${proj.progress_percent}%` }}
                              className="h-full bg-[#C6FF00]"
                            />
                          </div>
                        </div>
                      </td>

                      {/* Valor */}
                      <td className="py-3.5 px-4 text-right font-bold text-white" onClick={() => setSelectedProject(proj)}>
                        {formatProjectCurrency(proj.value || 0)}
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedProject(proj)}
                            className="p-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                            title="Ver detalhes"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingProject(proj);
                              setIsNewProjectModalOpen(true);
                            }}
                            className="p-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-[#C6FF00] transition-colors cursor-pointer"
                            title="Editar projeto"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setProjectToDelete(proj)}
                            className="p-1.5 bg-rose-950/20 hover:bg-rose-950/50 text-rose-400 border border-rose-800/30 transition-colors cursor-pointer"
                            title="Excluir projeto do Supabase"
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

      {/* DRAWER / MODAL LATERAL DE DETALHES DO PROJETO */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full sm:max-w-2xl h-full sm:h-[95vh] bg-[#111111] border sm:border border-white/10 flex flex-col justify-between overflow-hidden shadow-2xl">
            {/* Drawer Header */}
            <div className="p-5 border-b border-white/10 bg-[#0E0E0E] flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase border ${
                      PROJECT_STATUS_CONFIG[selectedProject.status].badgeBg
                    }`}
                  >
                    {selectedProject.status}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono font-bold ${
                      PROJECT_PRIORITY_CONFIG[selectedProject.priority].badgeClass
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        PROJECT_PRIORITY_CONFIG[selectedProject.priority].dotClass
                      }`}
                    />
                    {selectedProject.priority}
                  </span>
                  {selectedProject.is_delayed && (
                    <span className="px-2 py-0.5 bg-rose-950/90 text-rose-300 border border-rose-600 text-[10px] font-mono font-bold animate-pulse">
                      ATRASADO ({getDaysDelayed(selectedProject.deadline)}d)
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-mono font-bold text-white tracking-tight">
                  {selectedProject.name}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-white/60">
                  <span className="flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-white/30" />
                    {selectedProject.client_name}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-[#C6FF00]" />
                    {selectedProject.service_name}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-[#C6FF00] font-bold">
                    <DollarSign className="w-3.5 h-3.5" />
                    {formatProjectCurrency(selectedProject.value || 0)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingProject(selectedProject);
                    setIsNewProjectModalOpen(true);
                  }}
                  className="p-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-[#C6FF00] transition-colors cursor-pointer"
                  title="Editar projeto"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="p-1.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs font-mono">
              {/* Quick Status Bar */}
              <div className="p-3 bg-[#161616] border border-white/5 space-y-2">
                <div className="text-[10px] text-white/40 uppercase">Mudar Etapa do Fluxo:</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {PROJECT_STAGES.map((st) => (
                    <button
                      key={st}
                      onClick={async () => {
                        await updateProjectStatus(selectedProject.id, st);
                        setProjects((prev) =>
                          prev.map((p) =>
                            p.id === selectedProject.id
                              ? {
                                  ...p,
                                  status: st,
                                  is_delayed: isProjectDelayed(p.deadline, st),
                                }
                              : p
                          )
                        );
                        setSelectedProject((prev) =>
                          prev
                            ? {
                                ...prev,
                                status: st,
                                is_delayed: isProjectDelayed(prev.deadline, st),
                              }
                            : null
                        );
                        showToast(`Status alterado para ${st}`);
                      }}
                      className={`p-1.5 text-[10px] text-center font-mono border transition-colors cursor-pointer ${
                        selectedProject.status === st
                          ? 'bg-[#C6FF00] text-[#0A0A0A] font-bold border-[#C6FF00]'
                          : 'bg-[#1C1C1C] text-white/60 hover:text-white border-white/5'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Informações Gerais Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-[#161616] border border-white/5">
                  <div className="text-[10px] text-white/40 uppercase mb-0.5">Responsável</div>
                  <div className="text-white font-bold flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-white/30" />
                    {selectedProject.responsible_name
                      ? selectedProject.responsible_name.toLowerCase().includes('pietro')
                        ? 'Pietro'
                        : 'Felipe'
                      : 'Felipe'}
                  </div>
                </div>

                <div className="p-3 bg-[#161616] border border-white/5">
                  <div className="text-[10px] text-white/40 uppercase mb-0.5">Início da Demanda</div>
                  <div className="text-white font-bold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-white/30" />
                    {selectedProject.start_date
                      ? new Date(selectedProject.start_date + 'T00:00:00').toLocaleDateString('pt-BR')
                      : 'Não informado'}
                  </div>
                </div>

                <div className="p-3 bg-[#161616] border border-white/5">
                  <div className="text-[10px] text-white/40 uppercase mb-0.5">Prazo de Entrega</div>
                  <div
                    className={`font-bold flex items-center gap-1.5 ${
                      selectedProject.is_delayed ? 'text-rose-400' : 'text-white'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {selectedProject.deadline
                      ? new Date(selectedProject.deadline + 'T00:00:00').toLocaleDateString('pt-BR')
                      : 'Sem data'}
                  </div>
                </div>
              </div>

              {/* Descrição */}
              {selectedProject.description && (
                <div className="space-y-1.5">
                  <div className="text-[10px] text-white/40 uppercase">Escopo / Descrição Técnica:</div>
                  <div className="p-3 bg-[#161616] border border-white/5 text-white/80 font-sans leading-relaxed">
                    {selectedProject.description}
                  </div>
                </div>
              )}

              {/* Notas e Observações */}
              {selectedProject.notes && (
                <div className="space-y-1.5">
                  <div className="text-[10px] text-white/40 uppercase">Notas & Observações Internas:</div>
                  <div className="p-3 bg-[#161616] border border-white/5 text-white/70 font-sans italic">
                    "{selectedProject.notes}"
                  </div>
                </div>
              )}

              {/* CHECKLIST E ENTREGÁVEIS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/40 uppercase font-mono tracking-wider">
                      Etapas & Checklist de Entrega
                    </span>
                    <span className="text-[10px] font-bold text-[#C6FF00] bg-[#C6FF00]/10 px-1.5 py-0.5">
                      {selectedProject.tasks_completed}/{selectedProject.tasks_total} ({selectedProject.progress_percent}%)
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full bg-[#181818] overflow-hidden border border-white/5">
                  <div
                    style={{ width: `${selectedProject.progress_percent}%` }}
                    className="h-full bg-[#C6FF00] transition-all duration-300"
                  />
                </div>

                {/* Task items list */}
                <div className="space-y-1.5">
                  {selectedProject.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-2.5 bg-[#161616] hover:bg-[#1A1A1A] border border-white/5 group transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleTask(selectedProject.id, task.id, task.completed)
                        }
                        className="flex items-center gap-2.5 text-left flex-1 cursor-pointer"
                      >
                        {task.completed ? (
                          <CheckSquare className="w-4 h-4 text-[#C6FF00] shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-white/30 group-hover:text-white/60 shrink-0" />
                        )}
                        <span
                          className={`text-xs ${
                            task.completed
                              ? 'line-through text-white/40'
                              : 'text-white/90 font-medium'
                          }`}
                        >
                          {task.title}
                        </span>
                      </button>

                      <button
                        onClick={() => handleDeleteTask(selectedProject.id, task.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-white/30 hover:text-rose-400 transition-opacity cursor-pointer"
                        title="Remover etapa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* Add Quick Task Inline */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={newQuickTaskTitle}
                      onChange={(e) => setNewQuickTaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddQuickTask(selectedProject.id);
                        }
                      }}
                      placeholder="+ Adicionar etapa no checklist (Enter para salvar)..."
                      className="flex-1 bg-[#161616] border border-white/10 px-3 py-1.5 text-xs text-white placeholder-white/30 font-mono focus:outline-none focus:border-[#C6FF00]"
                    />
                    <button
                      onClick={() => handleAddQuickTask(selectedProject.id)}
                      disabled={isAddingTask || !newQuickTaskTitle.trim()}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white text-xs font-mono transition-colors cursor-pointer"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-white/10 bg-[#0E0E0E] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setProjectToDelete(selectedProject)}
                  className="px-3 py-2 bg-rose-950/30 hover:bg-rose-950/60 text-rose-400 border border-rose-800/40 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {selectedProject.status !== 'CONCLUÍDO' && (
                  <button
                    onClick={() => handleMarkProjectCompleted(selectedProject.id)}
                    className="px-4 py-2 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-mono font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Concluir Projeto</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedProject(null)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-mono text-xs border border-white/10 transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CRIAR / EDITAR PROJETO */}
      {isNewProjectModalOpen && (
        <NewProjectModal
          clients={clients}
          services={services}
          profiles={profiles}
          projectToEdit={editingProject}
          onClose={() => {
            setIsNewProjectModalOpen(false);
            setEditingProject(null);
          }}
          onCreated={(newProj) => {
            setProjects((prev) => [newProj, ...prev]);
            setIsNewProjectModalOpen(false);
            setEditingProject(null);
            showToast('SALVO');
          }}
          onUpdated={(updatedProj) => {
            setProjects((prev) => prev.map((p) => (p.id === updatedProj.id ? updatedProj : p)));
            if (selectedProject?.id === updatedProj.id) {
              setSelectedProject(updatedProj);
            }
            setIsNewProjectModalOpen(false);
            setEditingProject(null);
            showToast('SALVO');
          }}
        />
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE PROJETO */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#111111] border border-rose-500/40 w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
                Confirmar Exclusão de Projeto
              </h3>
            </div>

            <p className="text-xs font-mono text-white/70 leading-relaxed">
              Tem certeza que deseja excluir o projeto{' '}
              <strong className="text-white">"{projectToDelete.name}"</strong> e todas as suas etapas?
              Esta operação removerá o item permanentemente do Supabase.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                disabled={isDeletingProject}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/80 font-mono text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProject}
                disabled={isDeletingProject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-mono font-bold text-xs tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
              >
                {isDeletingProject ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>EXCLUINDO...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>SIM, EXCLUIR</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// MODAL DE CRIAÇÃO / EDIÇÃO DE PROJETO
// -------------------------------------------------------------
interface NewProjectModalProps {
  clients: ClientEntity[];
  services: ServiceItem[];
  profiles: ProfileUser[];
  projectToEdit?: ProjectItem | null;
  onClose: () => void;
  onCreated: (proj: ProjectItem) => void;
  onUpdated: (proj: ProjectItem) => void;
}

function NewProjectModal({
  clients,
  services,
  profiles,
  projectToEdit,
  onClose,
  onCreated,
  onUpdated,
}: NewProjectModalProps) {
  const [name, setName] = useState(projectToEdit?.name || '');
  const [clientId, setClientId] = useState(projectToEdit?.client_id || '');
  const [serviceId, setServiceId] = useState(projectToEdit?.service_id || '');
  const [responsibleId, setResponsibleId] = useState(projectToEdit?.responsible_user_id || 'felipe');
  const [priority, setPriority] = useState<ProjectPriority>(projectToEdit?.priority || 'Normal');
  const [status, setStatus] = useState<ProjectStatus>(projectToEdit?.status || 'A FAZER');
  const [deadline, setDeadline] = useState(
    projectToEdit?.deadline || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  );
  const [value, setValue] = useState(projectToEdit?.value !== undefined ? String(projectToEdit.value) : '3500');
  const [description, setDescription] = useState(projectToEdit?.description || '');
  const [notes, setNotes] = useState(projectToEdit?.notes || '');

  // Tarefas
  const [taskInputs, setTaskInputs] = useState<string[]>(
    projectToEdit ? projectToEdit.tasks.map((t) => t.title) : [
      'Briefing técnico e alinhamento de escopo',
      'Execução dos entregáveis e validação interna',
      'Apresentação e aprovação com o cliente',
    ]
  );
  const [newTaskText, setNewTaskText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleServiceChange = (sId: string) => {
    setServiceId(sId);
    if (!projectToEdit) {
      const match = services.find((s) => s.id === sId);
      if (match?.base_price) {
        setValue(String(match.base_price));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Informe o nome do projeto.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      if (projectToEdit) {
        // Modo Edição
        const success = await updateProjectRecord(projectToEdit.id, {
          name: name.trim(),
          client_id: clientId || null,
          service_id: serviceId || null,
          responsible_user_id: responsibleId || null,
          description: description.trim() || null,
          priority,
          status,
          deadline: deadline || null,
          value: Number(value) || 0,
          notes: notes.trim() || null,
        });

        if (success) {
          const clientMatch = clients.find((c) => c.id === clientId);
          const serviceMatch = services.find((s) => s.id === serviceId);
          const updatedItem: ProjectItem = {
            ...projectToEdit,
            name: name.trim(),
            client_id: clientId || null,
            client_name: clientMatch ? clientMatch.company_name : projectToEdit.client_name,
            service_id: serviceId || null,
            service_name: serviceMatch ? serviceMatch.name : projectToEdit.service_name,
            responsible_user_id: responsibleId || null,
            description: description.trim() || null,
            priority,
            status,
            deadline: deadline || null,
            value: Number(value) || 0,
            notes: notes.trim() || null,
            is_delayed: isProjectDelayed(deadline, status),
            updated_at: new Date().toISOString(),
          };
          onUpdated(updatedItem);
        } else {
          setErrorMsg('Não foi possível salvar as alterações no Supabase.');
        }
      } else {
        // Modo Criação
        const created = await createProjectRecord({
          name: name.trim(),
          client_id: clientId || null,
          service_id: serviceId || null,
          responsible_user_id: responsibleId || null,
          description: description.trim() || null,
          priority,
          status,
          deadline: deadline || null,
          value: Number(value) || 0,
          notes: notes.trim() || null,
          initialTasks: taskInputs.filter((t) => t.trim().length > 0),
        });

        if (created) {
          onCreated(created);
        } else {
          setErrorMsg('Não foi possível cadastrar o projeto no Supabase.');
        }
      }
    } catch (err: any) {
      console.error('Erro ao salvar projeto:', err);
      setErrorMsg(err.message || 'Falha ao processar solicitação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="bg-[#111111] border border-white/20 w-full max-w-2xl max-h-[92vh] overflow-y-auto p-5 space-y-4 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <span className="text-[10px] font-mono text-[#C6FF00] uppercase">
              {projectToEdit ? '// EDITAR PROJETO' : '// NOVO PROJETO'}
            </span>
            <h3 className="font-mono text-base font-bold text-white">
              {projectToEdit ? 'Atualizar Dados da Sprint' : 'Cadastrar Demanda & Sprint'}
            </h3>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          {/* Nome do Projeto */}
          <div>
            <label className="block text-[10px] text-white/50 uppercase mb-1">
              Nome do Projeto *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Landing Page Alta Conversão + Tráfego Pago"
              className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00]"
            />
          </div>

          {/* Cliente e Serviço Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-white/50 uppercase mb-1">
                Cliente (da tabela clients)
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00] cursor-pointer"
              >
                <option value="">-- Selecione o Cliente --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name} ({c.contact_name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-white/50 uppercase mb-1">
                Serviço de Origem
              </label>
              <select
                value={serviceId}
                onChange={(e) => handleServiceChange(e.target.value)}
                className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00] cursor-pointer"
              >
                <option value="">-- Selecione o Serviço --</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Responsável, Prioridade e Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] text-white/50 uppercase mb-1">
                Responsável Técnico
              </label>
              <select
                value={responsibleId}
                onChange={(e) => setResponsibleId(e.target.value)}
                className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00] cursor-pointer"
              >
                <option value="felipe">Felipe</option>
                <option value="pietro">Pietro</option>
                {profiles
                  .filter((p) => p.id !== 'felipe' && p.id !== 'pietro')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name?.split(' ')[0] || p.full_name || p.email}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-white/50 uppercase mb-1">Prioridade</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ProjectPriority)}
                className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00] cursor-pointer"
              >
                <option value="Baixa">Baixa</option>
                <option value="Normal">Normal</option>
                <option value="Alta">Alta</option>
                <option value="Urgente">Urgente</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-white/50 uppercase mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00] cursor-pointer"
              >
                {PROJECT_STAGES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Prazo e Valor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-white/50 uppercase mb-1">
                Data Prazo (Deadline) *
              </label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00]"
              />
            </div>

            <div>
              <label className="block text-[10px] text-white/50 uppercase mb-1">
                Valor do Projeto (R$)
              </label>
              <input
                type="number"
                step="50"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00]"
              />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-[10px] text-white/50 uppercase mb-1">
              Escopo / Descrição
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva as entregas acordadas e especificações..."
              className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00]"
            />
          </div>

          {/* Tarefas Iniciais (apenas na criação) */}
          {!projectToEdit && (
            <div className="space-y-2">
              <label className="block text-[10px] text-white/50 uppercase">
                Checklist Inicial de Entregáveis:
              </label>
              <div className="space-y-1.5">
                {taskInputs.map((t, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-[10px] text-[#C6FF00] font-bold">{idx + 1}.</span>
                    <input
                      type="text"
                      value={t}
                      onChange={(e) => {
                        const updated = [...taskInputs];
                        updated[idx] = e.target.value;
                        setTaskInputs(updated);
                      }}
                      className="flex-1 bg-[#161616] border border-white/5 px-2.5 py-1.5 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setTaskInputs(taskInputs.filter((_, i) => i !== idx))}
                      className="text-white/30 hover:text-rose-400 p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newTaskText.trim()) {
                      e.preventDefault();
                      setTaskInputs([...taskInputs, newTaskText.trim()]);
                      setNewTaskText('');
                    }
                  }}
                  placeholder="+ Adicionar outra etapa..."
                  className="flex-1 bg-[#161616] border border-white/10 px-2.5 py-1.5 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newTaskText.trim()) {
                      setTaskInputs([...taskInputs, newTaskText.trim()]);
                      setNewTaskText('');
                    }
                  }}
                  className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-mono cursor-pointer"
                >
                  + Incluir
                </button>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-mono text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2 bg-[#C6FF00] hover:bg-[#b0e600] disabled:opacity-40 text-[#0A0A0A] font-mono font-bold text-xs tracking-wider flex items-center gap-2 transition-colors cursor-pointer shadow-md"
            >
              {isSubmitting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              )}
              <span>{projectToEdit ? 'SALVAR ALTERAÇÕES' : 'CRIAR PROJETO'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
