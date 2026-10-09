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
  Edit3,
  X,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Flame,
  ArrowRight,
  TrendingUp,
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

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [delayedOnly, setDelayedOnly] = useState<boolean>(false);
  const [responsibleFilter, setResponsibleFilter] = useState<string>('ALL');

  // Modals & Selection
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState<boolean>(false);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);

  // Quick task input in detail drawer
  const [newQuickTaskTitle, setNewQuickTaskTitle] = useState<string>('');
  const [isAddingTask, setIsAddingTask] = useState<boolean>(false);

  // -------------------------------------------------------------
  // CARREGAR DADOS
  // -------------------------------------------------------------
  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);

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
    } catch (err) {
      console.error('Erro ao carregar módulo de projetos:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
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
        const matchesService = (p.service_name || '').toLowerCase().includes(query);
        const matchesResp = (p.responsible_name || '').toLowerCase().includes(query);
        if (!matchesName && !matchesClient && !matchesService && !matchesResp) {
          return false;
        }
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
        if (p.responsible_user_id !== responsibleFilter && p.responsible_name !== responsibleFilter) {
          return false;
        }
      }

      return true;
    });
  }, [projects, searchTerm, statusFilter, priorityFilter, delayedOnly, responsibleFilter]);

  // -------------------------------------------------------------
  // HANDLERS: TASKS
  // -------------------------------------------------------------
  const handleToggleTask = async (projectId: string, taskId: string, currentCompleted: boolean) => {
    // Optimistic toggle
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== projectId) return proj;
        const updatedTasks = proj.tasks.map((t) =>
          t.id === taskId ? { ...t, completed: !currentCompleted } : t
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

    await toggleTaskCompletion(taskId, currentCompleted);
  };

  const handleAddNewTaskToProject = async (projectId: string) => {
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
    }
    setIsAddingTask(false);
  };

  const handleDeleteTask = async (projectId: string, taskId: string) => {
    // Optimistic
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

    await deleteTaskRecord(taskId);
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
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este projeto e todas as suas tarefas?')) {
      return;
    }
    const success = await deleteProjectRecord(projectId);
    if (success) {
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* HEADER PRINCIPAL */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#111111] border border-white/10 p-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-widest text-[#C6FF00] uppercase">
              // OPERAÇÃO & DEMANDAS
            </span>
            <span className="text-white/20">•</span>
            <span className="text-[10px] font-mono text-white/50 uppercase">
              ENTREGAS VULTO LAB
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
          {/* Refresh button */}
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#C6FF00]' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>

          {/* New Project Button */}
          <button
            onClick={() => setIsNewProjectModalOpen(true)}
            className="px-4 py-2 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-mono font-bold text-xs tracking-wider flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>NOVO PROJETO</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* CARDS DE RESUMO OPERACIONAL */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Projetos */}
        <div className="bg-[#111111] border border-white/10 p-3.5">
          <div className="text-[10px] font-mono text-white/40 uppercase mb-1">Total Projetos</div>
          <div className="text-xl font-bold font-mono text-white">{metrics.totalProjects}</div>
          <div className="text-[10px] font-mono text-white/50 mt-1">Todas as demandas</div>
        </div>

        {/* Em Execução */}
        <div className="bg-[#111111] border border-white/10 p-3.5">
          <div className="text-[10px] font-mono text-amber-400/80 uppercase mb-1">Em Execução</div>
          <div className="text-xl font-bold font-mono text-amber-400">{metrics.inProgressCount}</div>
          <div className="text-[10px] font-mono text-white/50 mt-1">Sprints ativas</div>
        </div>

        {/* Atrasados Alerta */}
        <div
          className={`p-3.5 border transition-all ${
            metrics.delayedCount > 0
              ? 'bg-rose-950/20 border-rose-600/50 text-rose-300'
              : 'bg-[#111111] border-white/10 text-white'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] font-mono uppercase mb-1">
            <span className={metrics.delayedCount > 0 ? 'text-rose-400 font-bold' : 'text-white/40'}>
              Atrasados
            </span>
            {metrics.delayedCount > 0 && <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />}
          </div>
          <div className={`text-xl font-bold font-mono ${metrics.delayedCount > 0 ? 'text-rose-400' : ''}`}>
            {metrics.delayedCount}
          </div>
          <div className="text-[10px] font-mono text-white/50 mt-1">
            {metrics.delayedCount > 0 ? 'Exigem ação imediata' : 'Nenhum atraso'}
          </div>
        </div>

        {/* Concluídos */}
        <div className="bg-[#111111] border border-white/10 p-3.5">
          <div className="text-[10px] font-mono text-[#C6FF00]/80 uppercase mb-1">Concluídos</div>
          <div className="text-xl font-bold font-mono text-[#C6FF00]">{metrics.completedCount}</div>
          <div className="text-[10px] font-mono text-white/50 mt-1">Entregas finalizadas</div>
        </div>

        {/* Valor em Execução */}
        <div className="bg-[#111111] border border-white/10 p-3.5">
          <div className="text-[10px] font-mono text-white/40 uppercase mb-1">Pipeline Valor</div>
          <div className="text-xl font-bold font-mono text-white">
            {formatProjectCurrency(metrics.totalPipelineValue)}
          </div>
          <div className="text-[10px] font-mono text-white/50 mt-1">Em produção ativa</div>
        </div>

        {/* Tarefas Entregues */}
        <div className="bg-[#111111] border border-white/10 p-3.5">
          <div className="text-[10px] font-mono text-white/40 uppercase mb-1">Taxa de Tarefas</div>
          <div className="text-xl font-bold font-mono text-white">
            {metrics.totalTasksCount > 0
              ? `${Math.round((metrics.completedTasksCount / metrics.totalTasksCount) * 100)}%`
              : '0%'}
          </div>
          <div className="text-[10px] font-mono text-white/50 mt-1">
            {metrics.completedTasksCount}/{metrics.totalTasksCount} etapas
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* BARRA DE FILTROS & BUSCA */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#111111] border border-white/10 p-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por projeto, cliente, serviço ou responsável..."
            className="w-full bg-[#161616] border border-white/10 pl-9 pr-4 py-2 text-xs font-mono text-white placeholder-white/40 focus:outline-none focus:border-[#C6FF00]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Priority filter */}
          <div className="flex items-center gap-1.5 bg-[#161616] border border-white/10 px-2.5 py-1.5">
            <span className="text-[10px] font-mono text-white/40">Prioridade:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent text-xs font-mono text-white focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#161616]">Todas</option>
              <option value="Baixa" className="bg-[#161616]">Baixa</option>
              <option value="Normal" className="bg-[#161616]">Normal</option>
              <option value="Alta" className="bg-[#161616]">Alta</option>
              <option value="Urgente" className="bg-[#161616]">Urgente</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5 bg-[#161616] border border-white/10 px-2.5 py-1.5">
            <span className="text-[10px] font-mono text-white/40">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-mono text-white focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#161616]">Todos</option>
              {PROJECT_STAGES.map((st) => (
                <option key={st} value={st} className="bg-[#161616]">
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Responsible filter */}
          <div className="flex items-center gap-1.5 bg-[#161616] border border-white/10 px-2.5 py-1.5">
            <span className="text-[10px] font-mono text-white/40">Líder:</span>
            <select
              value={responsibleFilter}
              onChange={(e) => setResponsibleFilter(e.target.value)}
              className="bg-transparent text-xs font-mono text-white focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#161616]">Todos</option>
              <option value="felipe" className="bg-[#161616]">Felipe</option>
              <option value="pietro" className="bg-[#161616]">Pietro</option>
            </select>
          </div>

          {/* Delayed only toggle */}
          <button
            onClick={() => setDelayedOnly(!delayedOnly)}
            className={`px-2.5 py-1.5 text-xs font-mono flex items-center gap-1.5 border transition-colors cursor-pointer ${
              delayedOnly
                ? 'bg-rose-950/40 border-rose-600/70 text-rose-300 font-bold'
                : 'bg-[#161616] border-white/10 text-white/60 hover:text-white'
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${delayedOnly ? 'text-rose-400' : 'text-white/40'}`} />
            <span>Apenas Atrasados</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* VISUALIZAÇÃO: LISTA DE PROJETOS */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-[#111111] border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/10 bg-[#0E0E0E] text-[10px] text-white/40 uppercase tracking-wider">
                  <th className="py-3 px-4">Projeto</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Serviço</th>
                  <th className="py-3 px-4">Líder</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Prioridade</th>
                  <th className="py-3 px-4">Prazo / Entrega</th>
                  <th className="py-3 px-4">Tarefas</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-white/40 font-mono text-xs">
                      Nenhum projeto encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((proj) => {
                    const statusConf = PROJECT_STATUS_CONFIG[proj.status];
                    const priorityConf = PROJECT_PRIORITY_CONFIG[proj.priority];

                    return (
                      <tr
                        key={proj.id}
                        className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                        onClick={() => setSelectedProject(proj)}
                      >
                        {/* Nome do Projeto */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-white group-hover:text-[#C6FF00] transition-colors flex items-center gap-2">
                            <span>{proj.name}</span>
                            {proj.is_delayed && (
                              <span className="px-1.5 py-0.2 bg-rose-950/80 text-rose-300 border border-rose-600/70 text-[9px] font-bold">
                                ATRASADO
                              </span>
                            )}
                          </div>
                          {proj.description && (
                            <div className="text-[11px] text-white/50 truncate max-w-xs font-sans mt-0.5">
                              {proj.description}
                            </div>
                          )}
                        </td>

                        {/* Cliente */}
                        <td className="py-3 px-4 text-white/80">
                          <span className="flex items-center gap-1.5">
                            <Building className="w-3 h-3 text-white/30" />
                            {proj.client_name}
                          </span>
                        </td>

                        {/* Serviço */}
                        <td className="py-3 px-4 text-white/70">
                          <span className="flex items-center gap-1.5">
                            <Layers className="w-3 h-3 text-[#C6FF00]/50" />
                            {proj.service_name}
                          </span>
                        </td>

                        {/* Responsável */}
                        <td className="py-3 px-4 text-white/70">
                          <span className="flex items-center gap-1.5">
                            <User className="w-3 h-3 text-white/30" />
                            {proj.responsible_name ? (proj.responsible_name.toLowerCase().includes('pietro') ? 'Pietro' : 'Felipe') : 'Felipe'}
                          </span>
                        </td>

                        {/* Status (dropdown rápido) */}
                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={proj.status}
                            onChange={async (e) => {
                              const newSt = e.target.value as ProjectStatus;
                              await updateProjectStatus(proj.id, newSt);
                              setProjects((prev) =>
                                prev.map((p) =>
                                  p.id === proj.id
                                    ? {
                                        ...p,
                                        status: newSt,
                                        is_delayed: isProjectDelayed(p.deadline, newSt),
                                      }
                                    : p
                                )
                              );
                            }}
                            className={`px-2 py-1 text-[10px] font-bold border bg-[#161616] cursor-pointer focus:outline-none ${statusConf.badgeBg}`}
                          >
                            {PROJECT_STAGES.map((st) => (
                              <option key={st} value={st} className="bg-[#161616] text-white">
                                {st}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Prioridade */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold ${priorityConf.badgeClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${priorityConf.dotClass}`} />
                            {proj.priority}
                          </span>
                        </td>

                        {/* Prazo */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-white/40" />
                            <span
                              className={
                                proj.is_delayed
                                  ? 'text-rose-400 font-bold'
                                  : 'text-white/80'
                              }
                            >
                              {proj.deadline
                                ? new Date(proj.deadline + 'T00:00:00').toLocaleDateString('pt-BR')
                                : 'Sem data'}
                            </span>
                          </div>
                          {proj.is_delayed && (
                            <div className="text-[10px] text-rose-400/90 font-mono mt-0.5">
                              {getDaysDelayed(proj.deadline)} dias de atraso
                            </div>
                          )}
                        </td>

                        {/* Tarefas */}
                        <td className="py-3 px-4">
                          <div className="w-28 space-y-1">
                            <div className="flex justify-between text-[10px] text-white/60">
                              <span>
                                {proj.tasks_completed}/{proj.tasks_total}
                              </span>
                              <span className="text-[#C6FF00] font-bold">{proj.progress_percent}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-[#1C1C1C] overflow-hidden">
                              <div
                                style={{ width: `${proj.progress_percent}%` }}
                                className="h-full bg-[#C6FF00] transition-all"
                              />
                            </div>
                          </div>
                        </td>

                        {/* Valor */}
                        <td className="py-3 px-4 text-right font-bold text-white">
                          {formatProjectCurrency(proj.value)}
                        </td>

                        {/* Ações */}
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedProject(proj)}
                              className="p-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                              title="Ver detalhes"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProject(proj.id)}
                              className="p-1.5 bg-rose-950/20 hover:bg-rose-950/50 text-rose-400 border border-rose-800/30 transition-colors cursor-pointer"
                              title="Excluir projeto"
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

      {/* ------------------------------------------------------------- */}
      {/* DRAWER / MODAL: DETALHES DO PROJETO */}
      {/* ------------------------------------------------------------- */}
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
                    {formatProjectCurrency(selectedProject.value)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedProject(null)}
                className="p-1.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
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

              {/* ------------------------------------------------------------- */}
              {/* LISTA DE TAREFAS / SUB-ENTREGAS */}
              {/* ------------------------------------------------------------- */}
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
                          handleAddNewTaskToProject(selectedProject.id);
                        }
                      }}
                      placeholder="+ Adicionar nova etapa (pressione Enter)..."
                      className="flex-1 bg-[#161616] border border-white/10 px-3 py-2 text-xs font-mono text-white placeholder-white/40 focus:outline-none focus:border-[#C6FF00]"
                    />
                    <button
                      onClick={() => handleAddNewTaskToProject(selectedProject.id)}
                      disabled={isAddingTask || !newQuickTaskTitle.trim()}
                      className="px-3 py-2 bg-[#C6FF00] hover:bg-[#b0e600] disabled:opacity-40 text-[#0A0A0A] font-bold text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Adicionar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-white/10 bg-[#0E0E0E] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeleteProject(selectedProject.id)}
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

      {/* ------------------------------------------------------------- */}
      {/* MODAL: NOVO PROJETO */}
      {/* ------------------------------------------------------------- */}
      {isNewProjectModalOpen && (
        <NewProjectModal
          clients={clients}
          services={services}
          profiles={profiles}
          onClose={() => setIsNewProjectModalOpen(false)}
          onCreated={(newProj) => {
            setProjects((prev) => [newProj, ...prev]);
            setIsNewProjectModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

// -------------------------------------------------------------
// MODAL DE CRIAÇÃO DE NOVO PROJETO
// -------------------------------------------------------------
interface NewProjectModalProps {
  clients: ClientEntity[];
  services: ServiceItem[];
  profiles: ProfileUser[];
  onClose: () => void;
  onCreated: (proj: ProjectItem) => void;
}

function NewProjectModal({
  clients,
  services,
  profiles,
  onClose,
  onCreated,
}: NewProjectModalProps) {
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState<string>(clients[0]?.id || '');
  const [serviceId, setServiceId] = useState<string>(services[0]?.id || '');
  const [responsibleId, setResponsibleId] = useState<string>(profiles[0]?.id || '');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<ProjectPriority>('Normal');
  const [status, setStatus] = useState<ProjectStatus>('A FAZER');
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [value, setValue] = useState<string>('3500');
  const [notes, setNotes] = useState('');

  // Initial tasks
  const [taskInputs, setTaskInputs] = useState<string[]>([
    'Kickoff & alinhamento de escopo',
    'Desenvolvimento & produção técnica',
    'Homologação com o parceiro',
  ]);
  const [newTaskText, setNewTaskText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fill price based on selected service
  const handleServiceChange = (sId: string) => {
    setServiceId(sId);
    const matched = services.find((s) => s.id === sId);
    if (matched && matched.base_price) {
      setValue(matched.base_price.toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
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
      }
    } catch (err) {
      console.error('Erro ao criar projeto:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-[#111111] border border-white/10 p-5 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <span className="text-[10px] font-mono text-[#C6FF00] uppercase">// NOVO PROJETO</span>
            <h3 className="font-mono text-base font-bold text-white">Cadastrar Demanda & Sprint</h3>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

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
                <option value="">-- Selecione --</option>
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
              <label className="block text-[10px] text-white/50 uppercase mb-1">Status Inicial</label>
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

          {/* Tarefas Iniciais */}
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
                    className="text-white/30 hover:text-rose-400 p-1"
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
                className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-mono"
              >
                + Incluir
              </button>
            </div>
          </div>

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
              <span>CRIAR PROJETO</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
