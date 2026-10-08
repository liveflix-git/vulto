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
  responsible_user_id: string | null;
  responsible_name?: string;
  created_at: string;
  updated_at?: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  client_id: string | null;
  client_name?: string;
  service_id: string | null;
  service_name?: string;
  description: string | null;
  responsible_user_id: string | null;
  responsible_name?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  start_date: string | null;
  deadline: string | null;
  value: number;
  notes: string | null;
  created_at: string;
  updated_at?: string;
  tasks: ProjectTask[];
  // Computed
  is_delayed?: boolean;
  tasks_completed?: number;
  tasks_total?: number;
  progress_percent?: number;
}

export interface ProjectsMetrics {
  totalProjects: number;
  inProgressCount: number;
  delayedCount: number;
  completedCount: number;
  totalPipelineValue: number;
  totalTasksCount: number;
  completedTasksCount: number;
}

export const PROJECT_STATUS_CONFIG: Record<
  ProjectStatus,
  {
    label: string;
    color: string;
    badgeBg: string;
    border: string;
    description: string;
  }
> = {
  BACKLOG: {
    label: 'BACKLOG',
    color: 'text-zinc-400',
    badgeBg: 'bg-zinc-800/80 text-zinc-300 border-zinc-700/60',
    border: 'border-zinc-700/40',
    description: 'Demandas mapeadas aguardando priorização e briefing',
  },
  'A FAZER': {
    label: 'A FAZER',
    color: 'text-blue-400',
    badgeBg: 'bg-blue-950/60 text-blue-300 border-blue-800/50',
    border: 'border-blue-900/40',
    description: 'Demandas aprovadas e prontas para início da sprint',
  },
  'EM ANDAMENTO': {
    label: 'EM ANDAMENTO',
    color: 'text-amber-400',
    badgeBg: 'bg-amber-950/60 text-amber-300 border-amber-800/50',
    border: 'border-amber-900/40',
    description: 'Em produção ativa pelo time de desenvolvimento / mídia',
  },
  'AGUARDANDO CLIENTE': {
    label: 'AGUARDANDO CLIENTE',
    color: 'text-purple-400',
    badgeBg: 'bg-purple-950/60 text-purple-300 border-purple-800/50',
    border: 'border-purple-900/40',
    description: 'Aguardando aprovação de arte, acessos, domínios ou feedbacks',
  },
  REVISÃO: {
    label: 'REVISÃO',
    color: 'text-cyan-400',
    badgeBg: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/50',
    border: 'border-cyan-900/40',
    description: 'Controle de qualidade e testes de homologação pré-entrega',
  },
  CONCLUÍDO: {
    label: 'CONCLUÍDO',
    color: 'text-[#C6FF00]',
    badgeBg: 'bg-[#C6FF00]/10 text-[#C6FF00] border-[#C6FF00]/30',
    border: 'border-[#C6FF00]/30',
    description: 'Entregue com sucesso e validado pelo parceiro',
  },
};

export const PROJECT_PRIORITY_CONFIG: Record<
  ProjectPriority,
  { label: string; badgeClass: string; dotClass: string }
> = {
  Baixa: {
    label: 'Baixa',
    badgeClass: 'bg-zinc-800/80 text-zinc-300 border border-zinc-700/50',
    dotClass: 'bg-zinc-400',
  },
  Normal: {
    label: 'Normal',
    badgeClass: 'bg-blue-950/50 text-blue-300 border border-blue-800/40',
    dotClass: 'bg-blue-400',
  },
  Alta: {
    label: 'Alta',
    badgeClass: 'bg-amber-950/50 text-amber-300 border border-amber-700/50',
    dotClass: 'bg-amber-400',
  },
  Urgente: {
    label: 'Urgente',
    badgeClass: 'bg-rose-950/80 text-rose-300 border border-rose-600/70 animate-pulse',
    dotClass: 'bg-rose-500',
  },
};

// Helper para verificar atraso
export function isProjectDelayed(deadline: string | null | undefined, status: ProjectStatus): boolean {
  if (!deadline || status === 'CONCLUÍDO') return false;
  // Comparar no fuso local: ano, mês, dia
  const todayStr = new Date().toISOString().split('T')[0];
  return deadline < todayStr;
}

// Helper para calcular dias em atraso
export function getDaysDelayed(deadline: string | null | undefined): number {
  if (!deadline) return 0;
  const deadlineDate = new Date(deadline + 'T23:59:59');
  const now = new Date();
  const diffMs = now.getTime() - deadlineDate.getTime();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

// Formatar moeda
export function formatProjectCurrency(val: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(val || 0);
}

// -------------------------------------------------------------
// BUSCA COMPLETA DE PROJETOS E TAREFAS
// -------------------------------------------------------------
export async function fetchProjectsWithTasks(): Promise<ProjectItem[]> {
  if (!isSupabaseConfigured) {
    return getFallbackProjects();
  }

  try {
    // 1. Buscar projetos
    const { data: rawProjects, error: projError } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (projError || !rawProjects) {
      console.warn('Tabela projects ainda não configurada no Supabase:', projError?.message);
      return getFallbackProjects();
    }

    // 2. Buscar tarefas
    let rawTasks: any[] = [];
    try {
      const { data: tasksData, error: taskError } = await supabase
        .from('project_tasks')
        .select('*')
        .order('created_at', { ascending: true });

      if (!taskError && tasksData) {
        rawTasks = tasksData;
      }
    } catch (e) {
      console.warn('Tabela project_tasks não disponível ou vazia:', e);
    }

    // 3. Buscar nomes auxiliares (clientes, serviços, perfis)
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

    // 4. Mapear projetos com tarefas acopladas e estatísticas
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
        service_name: p.service_id ? servicesMap[p.service_id] || 'Serviço Vulto' : 'Serviço Vulto',
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

    return projects;
  } catch (err) {
    console.error('Erro ao buscar projetos do Supabase:', err);
    return getFallbackProjects();
  }
}

// -------------------------------------------------------------
// CRIAR PROJETO
// -------------------------------------------------------------
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
    name: project.name,
    client_id: project.client_id || null,
    service_id: project.service_id || null,
    description: project.description || null,
    responsible_user_id: project.responsible_user_id || null,
    status: project.status || 'A FAZER',
    priority: project.priority || 'Normal',
    start_date: project.start_date || new Date().toISOString().split('T')[0],
    deadline: project.deadline || null,
    value: Number(project.value || 0),
    notes: project.notes || null,
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
        console.error('Erro ao inserir projeto no Supabase:', error);
        throw error;
      }

      // Inserir tarefas iniciais caso enviadas
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
        }
      }

      await logActivity(
        'Criou projeto',
        `Novo projeto "${project.name}" cadastrado com valor ${formatProjectCurrency(
          Number(project.value || 0)
        )}`
      );

      return {
        ...data,
        tasks: createdTasks,
        is_delayed: isProjectDelayed(data.deadline, data.status),
        tasks_completed: 0,
        tasks_total: createdTasks.length,
        progress_percent: 0,
      };
    } catch (e) {
      console.warn('Falha na inserção remota de projeto, salvando em fallback local:', e);
    }
  }

  // Fallback local
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

  saveProjectToLocalStorage(fallbackProject);
  return fallbackProject;
}

// -------------------------------------------------------------
// ATUALIZAR STATUS DO PROJETO (Drag and drop / Kanban)
// -------------------------------------------------------------
export async function updateProjectStatus(
  projectId: string,
  newStatus: ProjectStatus
): Promise<boolean> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', projectId);

      if (error) {
        console.error('Erro ao atualizar status do projeto:', error);
        return false;
      }

      await logActivity('Atualizou projeto', `Status alterado para ${newStatus}`);
      return true;
    } catch (e) {
      console.error('Falha de rede ao atualizar status:', e);
      return false;
    }
  }
  return true;
}

// -------------------------------------------------------------
// ATUALIZAR DADOS GERAIS DO PROJETO
// -------------------------------------------------------------
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
  return true;
}

// -------------------------------------------------------------
// EXCLUIR PROJETO
// -------------------------------------------------------------
export async function deleteProjectRecord(projectId: string): Promise<boolean> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('projects').delete().eq('id', projectId);
      if (error) {
        console.error('Erro ao excluir projeto:', error);
        return false;
      }
      await logActivity('Excluiu projeto', `Projeto ${projectId} removido`);
      return true;
    } catch (e) {
      console.error('Erro ao excluir projeto:', e);
      return false;
    }
  }
  return true;
}

// -------------------------------------------------------------
// GESTÃO DE TAREFAS (project_tasks)
// -------------------------------------------------------------
export async function addProjectTask(
  projectId: string,
  title: string,
  responsibleUserId?: string | null
): Promise<ProjectTask | null> {
  const newId = crypto.randomUUID();
  const now = new Date().toISOString();

  const taskPayload = {
    id: newId,
    project_id: projectId,
    title: title.trim(),
    completed: false,
    responsible_user_id: responsibleUserId || null,
    created_at: now,
    updated_at: now,
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('project_tasks')
        .insert([taskPayload])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar tarefa no Supabase:', error);
        throw error;
      }

      return {
        id: data.id,
        project_id: data.project_id,
        title: data.title,
        completed: data.completed,
        responsible_user_id: data.responsible_user_id,
        created_at: data.created_at,
      };
    } catch (e) {
      console.warn('Erro ao inserir tarefa no Supabase, retornando local:', e);
    }
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

export async function toggleTaskCompletion(
  taskId: string,
  currentCompleted: boolean
): Promise<boolean> {
  const newStatus = !currentCompleted;

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('project_tasks')
        .update({ completed: newStatus, updated_at: new Date().toISOString() })
        .eq('id', taskId);

      if (error) {
        console.error('Erro ao alternar status da tarefa:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Erro ao alternar status da tarefa no Supabase:', e);
      return false;
    }
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

// -------------------------------------------------------------
// CÁLCULO DE MÉTRICAS OPERACIONAIS
// -------------------------------------------------------------
export function calculateProjectsMetrics(projects: ProjectItem[]): ProjectsMetrics {
  const totalProjects = projects.length;
  let inProgressCount = 0;
  let delayedCount = 0;
  let completedCount = 0;
  let totalPipelineValue = 0;
  let totalTasksCount = 0;
  let completedTasksCount = 0;

  projects.forEach((p) => {
    if (p.status === 'CONCLUÍDO') {
      completedCount++;
    } else {
      inProgressCount++;
      totalPipelineValue += p.value || 0;
      if (p.is_delayed) {
        delayedCount++;
      }
    }

    if (p.tasks && p.tasks.length > 0) {
      totalTasksCount += p.tasks.length;
      completedTasksCount += p.tasks.filter((t) => t.completed).length;
    }
  });

  return {
    totalProjects,
    inProgressCount,
    delayedCount,
    completedCount,
    totalPipelineValue,
    totalTasksCount,
    completedTasksCount,
  };
}

// -------------------------------------------------------------
// FALLBACK LOCAL INTELIGENTE
// -------------------------------------------------------------
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

  // Projetos padrão
  const defaultProjects: ProjectItem[] = [
    {
      id: 'proj-demo-1',
      name: 'Portal Institucional & E-commerce Headless',
      client_id: null,
      client_name: 'Atlas Capital Corp',
      service_id: null,
      service_name: 'Sites & Sistemas',
      description:
        'Desenvolvimento completo da nova plataforma institucional com integração Supabase e checkout Pix/Cartão.',
      responsible_user_id: null,
      responsible_name: 'Pietro R.',
      status: 'EM ANDAMENTO',
      priority: 'Alta',
      start_date: '2026-09-25',
      deadline: '2026-10-15',
      value: 6500,
      notes: 'Fase final de integração com gateway de pagamento e homologação.',
      created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
      tasks: [
        {
          id: 'tsk-1',
          project_id: 'proj-demo-1',
          title: 'Arquitetura e banco de dados Supabase',
          completed: true,
          responsible_user_id: null,
          created_at: new Date().toISOString(),
        },
        {
          id: 'tsk-2',
          project_id: 'proj-demo-1',
          title: 'Design System e componentes Tailwind CSS',
          completed: true,
          responsible_user_id: null,
          created_at: new Date().toISOString(),
        },
        {
          id: 'tsk-3',
          project_id: 'proj-demo-1',
          title: 'Integração de checkout Stripe / Pix',
          completed: false,
          responsible_user_id: null,
          created_at: new Date().toISOString(),
        },
        {
          id: 'tsk-4',
          project_id: 'proj-demo-1',
          title: 'Homologação e testes cross-browser',
          completed: false,
          responsible_user_id: null,
          created_at: new Date().toISOString(),
        },
      ],
      is_delayed: false,
      tasks_completed: 2,
      tasks_total: 4,
      progress_percent: 50,
    },
    {
      id: 'proj-demo-2',
      name: 'Escala de Tráfego Pago Q4 — Meta & Google Ads',
      client_id: null,
      client_name: 'Nexus Tech Consultoria',
      service_id: null,
      service_name: 'Paid Media (Performance)',
      description:
        'Estruturação dos conjuntos de anúncios CBO, testes de criativos em vídeo e tracking CAPI com Pixel.',
      responsible_user_id: null,
      responsible_name: 'Felipe M.',
      status: 'A FAZER',
      priority: 'Normal',
      start_date: '2026-10-06',
      deadline: '2026-10-20',
      value: 3500,
      notes: 'Aguardando aprovação de verba de mídia complementar pelo financeiro do cliente.',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      tasks: [
        {
          id: 'tsk-5',
          project_id: 'proj-demo-2',
          title: 'Briefing de criativos e roteiros de vídeo',
          completed: true,
          responsible_user_id: null,
          created_at: new Date().toISOString(),
        },
        {
          id: 'tsk-6',
          project_id: 'proj-demo-2',
          title: 'Configuração da API de Conversões Meta (CAPI)',
          completed: false,
          responsible_user_id: null,
          created_at: new Date().toISOString(),
        },
      ],
      is_delayed: false,
      tasks_completed: 1,
      tasks_total: 2,
      progress_percent: 50,
    },
    {
      id: 'proj-demo-3',
      name: 'Lote Corporativo 60 VULTO TAP + Hub NFC',
      client_id: null,
      client_name: 'Lumina Odontologia',
      service_id: null,
      service_name: 'VULTO TAP (NFC)',
      description:
        'Confecção de cartões metálicos com corte a laser personalizado e codificação de chip NTAG213.',
      responsible_user_id: null,
      responsible_name: 'Pietro R.',
      status: 'REVISÃO',
      priority: 'Normal',
      start_date: '2026-09-30',
      deadline: '2026-10-10',
      value: 3900,
      notes: 'Testes de leitura NFC realizados em 100% das unidades fabricadas.',
      created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
      tasks: [
        {
          id: 'tsk-7',
          project_id: 'proj-demo-3',
          title: 'Validação de mockups com o cliente',
          completed: true,
          responsible_user_id: null,
          created_at: new Date().toISOString(),
        },
        {
          id: 'tsk-8',
          project_id: 'proj-demo-3',
          title: 'Gravação a laser dos cartões metálicos',
          completed: true,
          responsible_user_id: null,
          created_at: new Date().toISOString(),
        },
        {
          id: 'tsk-9',
          project_id: 'proj-demo-3',
          title: 'Codificação das tags NTAG213 e trava de memória',
          completed: true,
          responsible_user_id: null,
          created_at: new Date().toISOString(),
        },
        {
          id: 'tsk-10',
          project_id: 'proj-demo-3',
          title: 'Embalagem premium e emissão de envio',
          completed: false,
          responsible_user_id: null,
          created_at: new Date().toISOString(),
        },
      ],
      is_delayed: false,
      tasks_completed: 3,
      tasks_total: 4,
      progress_percent: 75,
    },
    {
      id: 'proj-demo-4',
      name: 'Agente IA WhatsApp Suporte N1 & Qualificação',
      client_id: null,
      client_name: 'Atlas Capital Corp',
      service_id: null,
      service_name: 'Inteligência Artificial & Bots',
      description:
        'Integração da Evolution API com modelo Gemini Flash para qualificação e roteamento 24/7 de leads.',
      responsible_user_id: null,
      responsible_name: 'Felipe M.',
      status: 'EM ANDAMENTO',
      priority: 'Urgente',
      start_date: '2026-09-15',
      deadline: '2026-10-05', // Data no passado -> ATRASADO
      value: 4200,
      notes: 'Aguardando liberação de webhook da Meta para ativação do chip oficial.',
      created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
      tasks: [
        {
          id: 'tsk-11',
          project_id: 'proj-demo-4',
          title: 'Desenho do fluxo conversacional e persona',
          completed: true,
          responsible_user_id: null,
          created_at: new Date().toISOString(),
        },
        {
          id: 'tsk-12',
          project_id: 'proj-demo-4',
          title: 'Integração do endpoint webhook WhatsApp',
          completed: false,
          responsible_user_id: null,
          created_at: new Date().toISOString(),
        },
        {
          id: 'tsk-13',
          project_id: 'proj-demo-4',
          title: 'Testes de stress com 50 conversas simultâneas',
          completed: false,
          responsible_user_id: null,
          created_at: new Date().toISOString(),
        },
      ],
      is_delayed: true,
      tasks_completed: 1,
      tasks_total: 3,
      progress_percent: 33,
    },
    {
      id: 'proj-demo-5',
      name: 'Otimização de Conversão (CRO) & Copywriting LP',
      client_id: null,
      client_name: 'Nexus Tech Consultoria',
      service_id: null,
      service_name: 'Sites & Sistemas',
      description:
        'Refatoração do copy de vendas, prova social interativa e redução de fricção no checkout.',
      responsible_user_id: null,
      responsible_name: 'Felipe M.',
      status: 'CONCLUÍDO',
      priority: 'Normal',
      start_date: '2026-09-10',
      deadline: '2026-10-01',
      value: 2800,
      notes: 'Entrega homologada com aumento de 32% no conversion rate dos leads.',
      created_at: new Date(Date.now() - 28 * 86400000).toISOString(),
      tasks: [
        {
          id: 'tsk-14',
          project_id: 'proj-demo-5',
          title: 'Análise de mapas de calor Hotjar',
          completed: true,
          responsible_user_id: null,
          created_at: new Date().toISOString(),
        },
        {
          id: 'tsk-15',
          project_id: 'proj-demo-5',
          title: 'Redação de novo copy orientado a dor e contraste',
          completed: true,
          responsible_user_id: null,
          created_at: new Date().toISOString(),
        },
        {
          id: 'tsk-16',
          project_id: 'proj-demo-5',
          title: 'Deploy e acompanhamento das métricas de teste A/B',
          completed: true,
          responsible_user_id: null,
          created_at: new Date().toISOString(),
        },
      ],
      is_delayed: false,
      tasks_completed: 3,
      tasks_total: 3,
      progress_percent: 100,
    },
  ];

  return defaultProjects;
}

function saveProjectToLocalStorage(project: ProjectItem) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing: ProjectItem[] = raw ? JSON.parse(raw) : getFallbackProjects();
    const updated = [project, ...existing.filter((p) => p.id !== project.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {}
}
