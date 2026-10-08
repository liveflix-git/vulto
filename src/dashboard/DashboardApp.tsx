import React, { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import {
  DashboardTab,
  PartnerId,
  DashboardState,
  FinancialTransaction,
  DealItem,
  ClientRecord,
  VultoTapBatch,
  PipelineStage,
} from './types';
import {
  loadDashboardState,
  saveDashboardState,
  resetDashboardState,
} from './dashboardStorage';
import {
  persistSupabaseTransaction,
  persistSupabaseDeal,
  persistSupabaseClient,
} from '../lib/supabaseSync';
import { DashboardHeader } from './components/DashboardHeader';
import { DashboardSidebar } from './components/DashboardSidebar';
import { DashboardLogin } from './components/DashboardLogin';
import { OverviewView } from './components/OverviewView';
import { FinanceViewReal } from './components/FinanceViewReal';
import { FinanceView } from './components/FinanceView';
import { PipelineView } from './components/PipelineView';
import { CRMView } from './components/CRMView';
import { ClientsViewReal } from './components/ClientsViewReal';
import { ClientsView } from './components/ClientsView';
import { ServicesPricingView } from './components/ServicesPricingView';
import { ProjectsViewReal } from './components/ProjectsViewReal';
import { ProjectsView } from './components/ProjectsView';
import { VultoTapViewReal } from './components/VultoTapViewReal';
import { VultoTapView } from './components/VultoTapView';
import { GoalsViewReal } from './components/GoalsViewReal';
import { GoalsView } from './components/GoalsView';
import { ReportsView } from './components/ReportsView';
import { NewRecordModal } from './components/NewRecordModal';

interface DashboardAppProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  onNavigatePublic: (path?: string) => void;
}

export function DashboardApp({
  currentPath = '/dashboard',
  onNavigate,
  onNavigatePublic,
}: DashboardAppProps) {
  const [state, setState] = useState<DashboardState>(() => loadDashboardState());
  const [currentTab, setCurrentTab] = useState<DashboardTab>(() => {
    if (currentPath.includes('/crm')) return 'pipeline';
    if (currentPath.includes('/clientes')) return 'clients';
    if (currentPath.includes('/financeiro')) return 'finance';
    if (currentPath.includes('/vulto-tap')) return 'vulto_tap';
    if (currentPath.includes('/metas')) return 'goals';
    if (currentPath.includes('/projetos')) return 'projects';
    return 'overview';
  });

  // Sync tab when currentPath changes externally
  useEffect(() => {
    if (currentPath.includes('/crm')) {
      setCurrentTab('pipeline');
    } else if (currentPath.includes('/clientes')) {
      setCurrentTab('clients');
    } else if (currentPath.includes('/financeiro')) {
      setCurrentTab('finance');
    } else if (currentPath.includes('/vulto-tap')) {
      setCurrentTab('vulto_tap');
    } else if (currentPath.includes('/metas')) {
      setCurrentTab('goals');
    } else if (currentPath.includes('/projetos')) {
      setCurrentTab('projects');
    }
  }, [currentPath]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Real Supabase Auth State
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    // 1. Initial session verification
    supabase.auth
      .getSession()
      .then(({ data: { session: initialSession }, error }) => {
        if (error) {
          console.error('Erro ao verificar sessão Supabase:', error);
        }
        setSession(initialSession);
        setAuthUser(initialSession?.user ?? null);
        setIsAuthLoading(false);
      })
      .catch((err) => {
        console.error('Falha inesperada ao recuperar sessão:', err);
        setIsAuthLoading(false);
      });

    // 2. Real-time auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setAuthUser(currentSession?.user ?? null);
      setIsAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Save changes to local state storage whenever state updates
  useEffect(() => {
    saveDashboardState(state);
  }, [state]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Erro ao encerrar sessão Supabase:', err);
    }
    setSession(null);
    setAuthUser(null);
    if (onNavigate) {
      onNavigate('/dashboard/login');
    }
  };

  const handleLoginSuccess = () => {
    if (onNavigate && currentPath.includes('/login')) {
      onNavigate('/dashboard');
    }
  };

  const handleSwitchUser = (userId: PartnerId) => {
    setState((prev) => ({ ...prev, currentUser: userId }));
    localStorage.setItem('vulto_active_partner', userId);
  };

  const handleSelectTab = (tab: DashboardTab) => {
    setCurrentTab(tab);
    if (onNavigate) {
      if (tab === 'overview') onNavigate('/dashboard');
      else if (tab === 'finance') onNavigate('/dashboard/financeiro');
      else if (tab === 'pipeline') onNavigate('/dashboard/crm');
      else if (tab === 'clients') onNavigate('/dashboard/clientes');
      else if (tab === 'vulto_tap') onNavigate('/dashboard/vulto-tap');
      else if (tab === 'goals') onNavigate('/dashboard/metas');
      else if (tab === 'projects') onNavigate('/dashboard/projetos');
    }
  };

  const handleResetData = () => {
    const refreshed = resetDashboardState();
    setState(refreshed);
  };

  // Transaction handlers
  const handleAddTransaction = (newTx: FinancialTransaction) => {
    setState((prev) => ({
      ...prev,
      transactions: [newTx, ...prev.transactions],
    }));
    // Asynchronously try to persist in Supabase if table exists
    persistSupabaseTransaction(newTx).catch(() => {});
  };

  const handleUpdateTxStatus = (id: string, status: 'paid' | 'pending') => {
    setState((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) =>
        t.id === id ? { ...t, status } : t
      ),
    }));
  };

  // Deal handlers
  const handleAddDeal = (deal: DealItem) => {
    setState((prev) => ({
      ...prev,
      deals: [deal, ...prev.deals],
    }));
    persistSupabaseDeal(deal).catch(() => {});
  };

  const handleUpdateDealStage = (dealId: string, nextStage: PipelineStage) => {
    setState((prev) => ({
      ...prev,
      deals: prev.deals.map((d) =>
        d.id === dealId
          ? {
              ...d,
              stage: nextStage,
              probability: nextStage === 'won' ? 100 : nextStage === 'lost' ? 0 : d.probability,
              updatedAt: new Date().toISOString().slice(0, 10),
            }
          : d
      ),
    }));
  };

  // Client handlers
  const handleAddClient = (client: ClientRecord) => {
    setState((prev) => ({
      ...prev,
      clients: [client, ...prev.clients],
    }));
    persistSupabaseClient(client).catch(() => {});
  };

  // Batch handlers
  const handleAddBatch = (batch: VultoTapBatch) => {
    setState((prev) => ({
      ...prev,
      batches: [batch, ...prev.batches],
    }));
  };

  // Project task toggle
  const handleToggleTask = (projectId: string, taskId: string) => {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((proj) => {
        if (proj.id !== projectId) return proj;
        const updatedTasks = proj.tasks.map((t) =>
          t.id === taskId ? { ...t, completed: !t.completed } : t
        );
        const completedCount = updatedTasks.filter((t) => t.completed).length;
        const progressPercent = Math.round(
          (completedCount / updatedTasks.length) * 100
        );
        return {
          ...proj,
          tasks: updatedTasks,
          progressPercent,
          status: progressPercent === 100 ? 'delivered' : proj.status,
        };
      }),
    }));
  };

  // Pending counts for sidebar badges
  const pendingTransactionsCount = state.transactions.filter(
    (t) => t.status === 'pending'
  ).length;
  const activeDealsCount = state.deals.filter(
    (d) => d.stage !== 'won' && d.stage !== 'lost'
  ).length;
  const activeClientsCount = state.clients.filter(
    (c) => c.status === 'active'
  ).length;
  const activeProjectsCount = state.projects.filter(
    (p) => p.status === 'in_progress' || p.status === 'review'
  ).length;
  const activeTapBatchesCount = state.batches.filter(
    (b) => b.status === 'engraving' || b.status === 'shipped'
  ).length;

  // 1. Initial Authentication Check Screen (Zero-flash protection)
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-9 h-9 border-2 border-[#C6FF00] border-t-transparent animate-spin" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#C6FF00] animate-pulse" />
            <span className="font-mono text-xs font-bold tracking-widest text-white">
              VULTO LAB // CORE OS
            </span>
          </div>
          <p className="font-mono text-[11px] text-white/40 tracking-wider">
            VALIDANDO SESSÃO SUPABASE...
          </p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated State -> Show Protected Login Screen
  if (!session) {
    return (
      <DashboardLogin
        onSuccess={handleLoginSuccess}
        onNavigatePublic={() => onNavigatePublic('/')}
      />
    );
  }

  // 3. Authenticated State -> Render Full Executive Dashboard
  const renderActiveTab = () => {
    switch (currentTab) {
      case 'overview':
        return (
          <OverviewView
            state={state}
            onNavigateTab={setCurrentTab}
            currentUser={state.currentUser}
            onOpenNewRecord={() => setIsModalOpen(true)}
          />
        );
      case 'finance':
        return <FinanceViewReal />;
      case 'pipeline':
      case 'crm':
        return (
          <CRMView
            onOpenNewRecord={() => setIsModalOpen(true)}
            onNavigateClients={() => setCurrentTab('clients')}
          />
        );
      case 'clients':
        return <ClientsViewReal />;
      case 'pricing':
        return <ServicesPricingView />;
      case 'projects':
        return <ProjectsViewReal />;
      case 'vulto_tap':
        return <VultoTapViewReal />;
      case 'goals':
        return <GoalsViewReal />;
      case 'reports':
        return <ReportsView state={state} />;
      default:
        return (
          <OverviewView
            state={state}
            onNavigateTab={setCurrentTab}
            currentUser={state.currentUser}
            onOpenNewRecord={() => setIsModalOpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F4F4F1] flex flex-col selection:bg-[#C6FF00] selection:text-[#0A0A0A]">
      {/* Header */}
      <DashboardHeader
        currentUser={state.currentUser}
        userEmail={authUser?.email || session.user?.email}
        onSwitchUser={handleSwitchUser}
        onOpenNewRecord={() => setIsModalOpen(true)}
        onNavigatePublic={() => onNavigatePublic('/')}
        onResetData={handleResetData}
        onSignOut={handleSignOut}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <DashboardSidebar
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          currentUser={state.currentUser}
          counts={{
            pendingTransactions: pendingTransactionsCount,
            activeDeals: activeDealsCount,
            activeClients: activeClientsCount,
            activeProjects: activeProjectsCount,
            activeTapBatches: activeTapBatchesCount,
          }}
        />

        {/* Dynamic View Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#0D0D0D]">
          <div className="max-w-7xl mx-auto">{renderActiveTab()}</div>
        </main>
      </div>

      {/* Fast Record Creation Modal */}
      <NewRecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentUser={state.currentUser}
        onAddTransaction={handleAddTransaction}
        onAddDeal={handleAddDeal}
        onAddClient={handleAddClient}
        onAddBatch={handleAddBatch}
      />
    </div>
  );
}
