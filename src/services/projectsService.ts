import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { logActivity } from './crmService';

export type ProjectStatus =
  | 'BACKLOG'
  | 'A FAZER'
  | 'EM ANDAMENTO'
  | 'AGUARDANDO CLIENTE'
  | 'REVISÃO'
  | 'CONCLUÍDO';

export type ProjectPriority = 'Baixa' | 'Normal' | 'Alta' | 'Urgente';

export interface ProjectTask {
  id: string;
  project_id: string;
  title: string;
  completed: boolean;
  responsible_user_id?: string | null;
  responsible_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  client_id?: string | null;
  client_name?: string;
  service_id?: string | null;
  service_name?: string;
  description?: string | null;
  responsible_user_id?: string | null;
  responsible_name?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  start_date?: string | null;
  deadline?: string | null;
  value?: number;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
  // Propriedades calculadas e tarefas
  tasks: ProjectTask[];
  tasks_completed: number;
  tasks_total: number;
  progress_percent: number;
  is_delayed: boolean;
}

export interface ProjectsMetrics {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  delayedProjects: number;
  totalContractValue: number;
  completionRate: number;
}

export const PROJECT_STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; badgeBg: string; textClass: string; dotClass: string }
> = {
  BACKLOG: {
    label: 'Backlog',
    badgeBg: 'bg-white/5 border-white/10 text-white/50',
    textClass: 'text-white/50',
    dotClass: 'bg-white/40',
  },
  'A FAZER': {
    label: 'A Fazer',
    badgeBg: 'bg-blue-950/40 border-blue-500/30 text-blue-400',
    textClass: 'text-blue-400',
    dotClass: 'bg-blue-400',
  },
  'EM ANDAMENTO': {
    label: 'Em Andamento',
    badgeBg: 'bg-amber-950/40 border-amber-500/30 text-amber-400',
    textClass: 'text-amber-400',
    dotClass: 'bg-amber-400',
  },
  'AGUARDANDO CLIENTE': {
    label: 'Aguardando Cliente',
    badgeBg: 'bg-purple-950/40 border-purple-500/30 text-purple-400',
    textClass: 'text-purple-400',
    dotClass: 'bg-purple-400',
  },
  REVISÃO: {
    label: 'Revisão',
    badgeBg: 'bg-cyan-950/40 border-cyan-500/30 text-cyan-400',
    textClass: 'text-cyan-400',
    dotClass: 'bg-cyan-400',
  },
  CONCLUÍDO: {
    label: 'Concluído',
    badgeBg: 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400',
    textClass: 'text-emerald-400',
    dotClass: 'bg-emerald-400',
  },
};

export const PROJECT_PRIORITY_CONFIG: Record<
  ProjectPriority,
  { label: string; badgeClass: string; dotClass: string }
> = {
  Baixa: {
    label: 'Baixa',
    badgeClass: 'bg-white/5 text-white/50 border border-white/10',
    dotClass: 'bg-white/40',
  },
  Normal: {
    label: 'Normal',
    badgeClass: 'bg-blue-950/30 text-blue-300 border border-blue-500/30',
    dotClass: 'bg-blue-400',
  },
  Alta: {
    label: 'Alta',
    badgeClass: 'bg-amber-950/30 text-amber-300 border border-amber-500/30',
    dotClass: 'bg-amber-400',
  },
  Urgente: {
    label: 'Urgente',
    badgeClass: 'bg-rose-950/40 text-rose-300 border border-rose-500/40',
    dotClass: 'bg-rose-400 animate-pulse',
  },
};

const STORAGE_KEY = 'vulto_projects_cache';

function getFallbackProjects(): ProjectItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p) => ({
          ...p,
          is_delayed: isProjectDelayed(p.deadline, p.status),
          tasks_total: p.tasks?.length || 0,
          tasks_completed: p.tasks?.filter((t: any) => t.completed)?.length || 0,
          progress_percent:
            p.tasks && p.tasks.length > 0
              ? Math.round((p.tasks.filter((t: any) => t.completed).length / p.tasks.length) * 100)
              : 0,
        }));
      }
    }
  } catch (e) {}
  return [];
}

function saveProjectsToLocalStorage(projects: ProjectItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {}
}

export function isProjectDelayed(deadline?: string | null, status?: ProjectStatus): boolean {
  if (!deadline) return false;
  if (status === 'CONCLUÍDO') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dead = new Date(deadline + 'T00:00:00');
  return dead < today;
}

export function getDaysDelayed(deadline?: string | null): number {
  if (!deadline) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dead = new Date(deadline + 'T00:00:00');
  const diffTime = today.getTime() - dead.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

/**
 * Busca todos os projetos com suas respectivas tarefas e metadados.
 */
export async function fetchProjectsWithTasks(): Promise<ProjectItem[]> {
  if (isSupabaseConfigured) {
    try {
      const { data: rawProjects, error: projError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (projError) {
        if (projError.code === 'PGRST205' || projError.message.includes('not find the table')) {
          return getFallbackProjects();
        }
        console.warn('Erro ao buscar projetos do Supabase:', projError.message);
        return getFallbackProjects();
      }

      if (rawProjects) {
        let rawTasks: any[] = [];
        try {
          const { data: tasksData, error: taskError } = await supabase
            .from('project_tasks')
            .select('*')
            .order('created_at', { ascending: true });
          if (!taskError && tasksData) {
            rawTasks = tasksData;
          }
        } catch (e) {}

        const [clientsRes, servicesRes, profilesRes] = await Promise.allSettled([
          supabase.from('clients').select('id, company_name'),
          supabase.from('services').select('id, name'),
          supabase.from('profiles').select('id, full_name, email'),
        ]);

        const clientsMap: Record<string, string> = {};
        if (clientsRes.status === 'fulfilled' && clientsRes.value.data) {
          clientsRes.value.data.forEach((c: any) => {
            clientsMap[c.id] = c.company_name;
          });
        }

        const servicesMap: Record<string, string> = {};
        if (servicesRes.status === 'fulfilled' && servicesRes.value.data) {
          servicesRes.value.data.forEach((s: any) => {
            servicesMap[s.id] = s.name;
          });
        }

        const profilesMap: Record<string, string> = {};
        if (profilesRes.status === 'fulfilled' && profilesRes.value.data) {
          profilesRes.value.data.forEach((p: any) => {
            profilesMap[p.id] = p.full_name || p.email?.split('@')[0] || 'Membro';
          });
        }

        const projects: ProjectItem[] = rawProjects.map((p: any) => {
          const projectTasks: ProjectTask[] = rawTasks
            .filter((t: any) => t.project_id === p.id)
            .map((t: any) => ({
              id: t.id,
              project_id: t.project_id,
              title: t.title,
              completed: !!t.completed,
              responsible_user_id: t.responsible_user_id || null,
              responsible_name: t.responsible_user_id ? profilesMap[t.responsible_user_id] : undefined,
              created_at: t.created_at,
              updated_at: t.updated_at,
            }));

          const tasksTotal = projectTasks.length;
          const tasksCompleted = projectTasks.filter((t) => t.completed).length;
          const progressPercent = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;
          const status = (p.status || 'A FAZER') as ProjectStatus;
          const isDelayed = isProjectDelayed(p.deadline, status);

          return {
            id: p.id,
            name: p.name || 'Projeto sem título',
            client_id: p.client_id || null,
            client_name: p.client_id ? clientsMap[p.client_id] || 'Cliente Vulto' : 'Cliente Vulto',
            service_id: p.service_id || null,
            service_name: p.service_id ? servicesMap[p.service_id] || 'Serviço Especializado' : 'Serviço Especializado',
            description: p.description || null,
            responsible_user_id: p.responsible_user_id || null,
            responsible_name: p.responsible_user_id
              ? profilesMap[p.responsible_user_id] || 'Responsável'
              : 'Não atribuído',
            status,
            priority: (p.priority || 'Normal') as ProjectPriority,
            start_date: p.start_date || null,
            deadline: p.deadline || null,
            value: Number(p.value || 0),
            notes: p.notes || null,
            created_at: p.created_at,
            updated_at: p.updated_at,
            tasks: projectTasks,
            is_delayed: isDelayed,
            tasks_completed: tasksCompleted,
            tasks_total: tasksTotal,
            progress_percent: progressPercent,
          };
        });

        saveProjectsToLocalStorage(projects);
        return projects;
      }
    } catch (err) {
      console.error('Erro ao buscar projetos do Supabase:', err);
      return getFallbackProjects();
    }
  }

  return getFallbackProjects();
}

/**
 * Cria um novo projeto e suas tarefas iniciais no Supabase.
 */
export async function createProjectRecord(project: {
  name: string;
  client_id?: string | null;
  service_id?: string | null;
  description?: string | null;
  responsible_user_id?: string | null;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  start_date?: string | null;
  deadline?: string | null;
  value?: number;
  notes?: string | null;
  initialTasks?: string[];
}): Promise<ProjectItem | null> {
  const newId = crypto.randomUUID();
  const now = new Date().toISOString();

  const insertPayload = {
    id: newId,
    name: project.name.trim(),
    client_id: project.client_id || null,
    service_id: project.service_id || null,
    description: project.description?.trim() || null,
    responsible_user_id: project.responsible_user_id || null,
    status: project.status || 'A FAZER',
    priority: project.priority || 'Normal',
    start_date: project.start_date || new Date().toISOString().split('T')[0],
    deadline: project.deadline || null,
    value: Number(project.value || 0),
    notes: project.notes?.trim() || null,
    created_at: now,
    updated_at: now,
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([insertPayload])
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST205' || error.message.includes('not find the table')) {
          const fallbackProject: ProjectItem = {
            ...insertPayload,
            tasks: (project.initialTasks || []).map((t, idx) => ({
              id: `task-${Date.now()}-${idx}`,
              project_id: newId,
              title: t,
              completed: false,
              responsible_user_id: project.responsible_user_id || null,
              created_at: now,
            })),
            is_delayed: isProjectDelayed(insertPayload.deadline, insertPayload.status),
            tasks_completed: 0,
            tasks_total: (project.initialTasks || []).length,
            progress_percent: 0,
          };
          const current = getFallbackProjects();
          saveProjectsToLocalStorage([fallbackProject, ...current]);
          return fallbackProject;
        }
        console.error('Erro ao inserir projeto no Supabase:', error);
        throw error;
      }

      const createdTasks: ProjectTask[] = [];
      if (project.initialTasks && project.initialTasks.length > 0) {
        const taskInserts = project.initialTasks
          .filter((t) => t.trim().length > 0)
          .map((title) => ({
            id: crypto.randomUUID(),
            project_id: data.id,
            title: title.trim(),
            completed: false,
            responsible_user_id: project.responsible_user_id || null,
            created_at: new Date().toISOString(),
          }));

        if (taskInserts.length > 0) {
          try {
            const { data: insertedTasks } = await supabase
              .from('project_tasks')
              .insert(taskInserts)
              .select();
            if (insertedTasks) {
              insertedTasks.forEach((it: any) => {
                createdTasks.push({
                  id: it.id,
                  project_id: it.project_id,
                  title: it.title,
                  completed: it.completed,
                  responsible_user_id: it.responsible_user_id,
                  created_at: it.created_at,
                });
              });
            }
          } catch (e) {}
        }
      }

      await logActivity(
        'Criou projeto',
        `Novo projeto "${project.name}" cadastrado com valor ${formatProjectCurrency(Number(project.value || 0))}`
      );

      const createdItem: ProjectItem = {
        ...data,
        tasks: createdTasks,
        is_delayed: isProjectDelayed(data.deadline, data.status),
        tasks_completed: 0,
        tasks_total: createdTasks.length,
        progress_percent: 0,
      };

      const current = getFallbackProjects();
      saveProjectsToLocalStorage([createdItem, ...current]);
      return createdItem;
    } catch (e: any) {
      console.warn('Erro ao salvar projeto no Supabase:', e);
      throw e;
    }
  }

  const fallbackProject: ProjectItem = {
    ...insertPayload,
    tasks: (project.initialTasks || []).map((t, idx) => ({
      id: `task-${Date.now()}-${idx}`,
      project_id: newId,
      title: t,
      completed: false,
      responsible_user_id: project.responsible_user_id || null,
      created_at: now,
    })),
    is_delayed: isProjectDelayed(insertPayload.deadline, insertPayload.status),
    tasks_completed: 0,
    tasks_total: (project.initialTasks || []).length,
    progress_percent: 0,
  };
  const current = getFallbackProjects();
  saveProjectsToLocalStorage([fallbackProject, ...current]);
  return fallbackProject;
}

/**
 * Atualiza o status do projeto.
 */
export async function updateProjectStatus(
  projectId: string,
  newStatus: ProjectStatus
): Promise<boolean> {
  const now = new Date().toISOString();
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus, updated_at: now })
        .eq('id', projectId);

      if (error) {
        if (error.code === 'PGRST205' || error.message.includes('not find the table')) {
          const current = getFallbackProjects();
          saveProjectsToLocalStorage(
            current.map((p) =>
              p.id === projectId
                ? { ...p, status: newStatus, is_delayed: isProjectDelayed(p.deadline, newStatus), updated_at: now }
                : p
            )
          );
          return true;
        }
        console.error('Erro ao atualizar status do projeto:', error);
        return false;
      }

      await logActivity('Atualizou projeto', `Status alterado para ${newStatus}`);
      return true;
    } catch (e) {
      console.error('Falha ao atualizar status:', e);
      return false;
    }
  }

  const current = getFallbackProjects();
  saveProjectsToLocalStorage(
    current.map((p) =>
      p.id === projectId
        ? { ...p, status: newStatus, is_delayed: isProjectDelayed(p.deadline, newStatus), updated_at: now }
        : p
    )
  );
  return true;
}

/**
 * Atualiza campos do projeto (edição livre).
 */
export async function updateProjectRecord(
  projectId: string,
  updates: Partial<ProjectItem>
): Promise<boolean> {
  const payload: any = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  delete payload.tasks;
  delete payload.is_delayed;
  delete payload.tasks_completed;
  delete payload.tasks_total;
  delete payload.progress_percent;
  delete payload.client_name;
  delete payload.service_name;
  delete payload.responsible_name;

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('projects')
        .update(payload)
        .eq('id', projectId);

      if (error) {
        if (error.code === 'PGRST205' || error.message.includes('not find the table')) {
          const current = getFallbackProjects();
          saveProjectsToLocalStorage(
            current.map((p) => (p.id === projectId ? { ...p, ...updates, updated_at: payload.updated_at } : p))
          );
          return true;
        }
        console.error('Erro ao atualizar projeto:', error);
        return false;
      }

      await logActivity('Editou projeto', `Dados do projeto atualizados`);
      return true;
    } catch (e) {
      console.error('Erro ao salvar atualização no Supabase:', e);
      return false;
    }
  }

  const current = getFallbackProjects();
  saveProjectsToLocalStorage(
    current.map((p) => (p.id === projectId ? { ...p, ...updates, updated_at: payload.updated_at } : p))
  );
  return true;
}

/**
 * Exclui um projeto e todas as suas tarefas do Supabase.
 */
export async function deleteProjectRecord(projectId: string): Promise<boolean> {
  // 1. Sempre atualizar o cache local para refletir imediatamente
  const current = getFallbackProjects();
  saveProjectsToLocalStorage(current.filter((p) => p.id !== projectId));

  if (isSupabaseConfigured) {
    try {
      // Deletar tarefas filhas primeiro para evitar violações de FK se cascata não configurada
      try {
        await supabase.from('project_tasks').delete().eq('project_id', projectId);
      } catch (e) {}

      const { error } = await supabase.from('projects').delete().eq('id', projectId);
      if (error) {
        if (error.code === 'PGRST205' || error.message.includes('not find the table')) {
          return true;
        }
        console.error('Erro retornado pelo Supabase ao excluir projeto:', error);
        return false;
      }

      await logActivity('Excluiu projeto', `Projeto ${projectId} removido`);
      return true;
    } catch (e) {
      console.error('Erro ao excluir projeto no Supabase:', e);
      return false;
    }
  }

  return true;
}

export async function addProjectTask(
  projectId: string,
  title: string,
  responsibleUserId?: string | null
): Promise<ProjectTask | null> {
  const newId = crypto.randomUUID();
  const now = new Date().toISOString();

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('project_tasks')
        .insert([
          {
            id: newId,
            project_id: projectId,
            title: title.trim(),
            completed: false,
            responsible_user_id: responsibleUserId || null,
            created_at: now,
          },
        ])
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          project_id: data.project_id,
          title: data.title,
          completed: data.completed,
          responsible_user_id: data.responsible_user_id,
          created_at: data.created_at,
        };
      }
    } catch (e) {}
  }

  return {
    id: newId,
    project_id: projectId,
    title: title.trim(),
    completed: false,
    responsible_user_id: responsibleUserId || null,
    created_at: now,
  };
}

export async function toggleTaskCompletion(taskId: string, completed: boolean): Promise<boolean> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('project_tasks')
        .update({ completed, updated_at: new Date().toISOString() })
        .eq('id', taskId);

      if (!error) return true;
    } catch (e) {}
  }
  return true;
}

export async function deleteTaskRecord(taskId: string): Promise<boolean> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('project_tasks').delete().eq('id', taskId);
      if (error) {
        console.error('Erro ao excluir tarefa:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Erro ao excluir tarefa:', e);
      return false;
    }
  }
  return true;
}

export function calculateProjectsMetrics(projects: ProjectItem[]): ProjectsMetrics {
  const totalProjects = projects.length;
  const activeProjects = projects.filter(
    (p) => p.status !== 'CONCLUÍDO' && p.status !== 'BACKLOG'
  ).length;
  const completedProjects = projects.filter((p) => p.status === 'CONCLUÍDO').length;
  const delayedProjects = projects.filter((p) => p.is_delayed).length;
  const totalContractValue = projects.reduce((acc, p) => acc + (p.value || 0), 0);
  const completionRate =
    totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;

  return {
    totalProjects,
    activeProjects,
    completedProjects,
    delayedProjects,
    totalContractValue,
    completionRate,
  };
}

export function formatProjectCurrency(val: number): string {
  return (
    'R$ ' +
    Number(val || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}
