import React, { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import {
  VultoOperator,
  getActiveOperatorSession,
  setActiveOperatorSession,
  clearActiveOperatorSession,
  fetchVultoOperators,
} from '../services/vultoCoreService';
import { DashboardHeader } from './components/DashboardHeader';
import { DashboardSidebar, VultoTab } from './components/DashboardSidebar';
import { DashboardLogin } from './components/DashboardLogin';
import { OperatorSelectModal } from './components/OperatorSelectModal';
import { OverviewView } from './components/OverviewView';
import { FinanceView } from './components/FinanceView';
import { ClientsView } from './components/ClientsView';
import { ProjectsServicesView } from './components/ProjectsServicesView';
import { InventoryNfcView } from './components/InventoryNfcView';
import { ReportsView } from './components/ReportsView';
import { Menu } from 'lucide-react';

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
  // Sessão Supabase
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Operador ativo (Felipe ou Pietro)
  const [activeOperator, setActiveOperator] = useState<VultoOperator | null>(() =>
    getActiveOperatorSession()
  );
  const [isOperatorModalOpen, setIsOperatorModalOpen] = useState(false);
  const [isChangingOperator, setIsChangingOperator] = useState(false);

  // Mobile drawer
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Aba ativa da nova sidebar limpa
  const [currentTab, setCurrentTab] = useState<VultoTab>(() => {
    if (currentPath.includes('/financeiro') || currentPath.includes('/crm') || currentPath.includes('/pipeline')) return 'finance';
    if (currentPath.includes('/clientes')) return 'clients';
    if (currentPath.includes('/projetos') || currentPath.includes('/servicos') || currentPath.includes('/precos')) return 'projects_services';
    if (currentPath.includes('/vulto-tap') || currentPath.includes('/estoque')) return 'inventory_nfc';
    if (currentPath.includes('/relatorios')) return 'reports';
    return 'overview';
  });

  // Sincronizar tab se a URL mudar
  useEffect(() => {
    if (currentPath.includes('/financeiro') || currentPath.includes('/crm') || currentPath.includes('/pipeline')) {
      setCurrentTab('finance');
    } else if (currentPath.includes('/clientes')) {
      setCurrentTab('clients');
    } else if (currentPath.includes('/projetos') || currentPath.includes('/servicos') || currentPath.includes('/precos')) {
      setCurrentTab('projects_services');
    } else if (currentPath.includes('/vulto-tap') || currentPath.includes('/estoque')) {
      setCurrentTab('inventory_nfc');
    } else if (currentPath.includes('/relatorios')) {
      setCurrentTab('reports');
    }
  }, [currentPath]);

  // Verificar Auth do Supabase
  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session: s } }) => {
        setSession(s);
        setAuthUser(s?.user ?? null);
        setIsAuthLoading(false);
      })
      .catch((err) => {
        console.error('Erro ao verificar sessão Supabase:', err);
        setIsAuthLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setAuthUser(s?.user ?? null);
      setIsAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Quando logado sem operador ativo, pedir para escolher quem está usando
  useEffect(() => {
    if (session && !activeOperator) {
      setIsOperatorModalOpen(true);
    }
  }, [session, activeOperator]);

  const handleSelectOperator = (op: VultoOperator) => {
    setActiveOperatorSession(op);
    setActiveOperator(op);
    setIsOperatorModalOpen(false);
    setIsChangingOperator(false);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error(err);
    }
    clearActiveOperatorSession();
    setActiveOperator(null);
    setSession(null);
    setAuthUser(null);
  };

  const handleSelectTab = (tab: VultoTab) => {
    setCurrentTab(tab);
    if (onNavigate) {
      if (tab === 'overview') onNavigate('/dashboard');
      else if (tab === 'finance') onNavigate('/dashboard/financeiro');
      else if (tab === 'clients') onNavigate('/dashboard/clientes');
      else if (tab === 'projects_services') onNavigate('/dashboard/projetos');
      else if (tab === 'inventory_nfc') onNavigate('/dashboard/vulto-tap');
      else if (tab === 'reports') onNavigate('/dashboard/relatorios');
    }
  };

  const handleGlobalRefresh = async () => {
    window.dispatchEvent(new CustomEvent('vulto:refresh'));
    await new Promise((resolve) => setTimeout(resolve, 400));
  };

  // 1. Tela de Carregamento
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center text-white">
        <div className="w-8 h-8 border-2 border-[#C6FF00] border-t-transparent animate-spin mb-4" />
        <span className="font-mono text-xs tracking-widest text-white/50">
          CARREGANDO PAINEL VULTO LAB...
        </span>
      </div>
    );
  }

  // 2. Tela de Login se não autenticado
  if (!session) {
    return (
      <DashboardLogin
        onSuccess={() => {}}
        onNavigatePublic={() => onNavigatePublic('/')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F4F4F1] flex flex-col selection:bg-[#C6FF00] selection:text-[#0A0A0A]">
      {/* Modal de Escolha de Operador Inicial ou Troca */}
      {(isOperatorModalOpen || isChangingOperator) && (
        <OperatorSelectModal
          isChangeMode={isChangingOperator}
          onClose={() => {
            if (activeOperator) {
              setIsChangingOperator(false);
              setIsOperatorModalOpen(false);
            }
          }}
          onSelect={handleSelectOperator}
        />
      )}

      {/* Header Limpo */}
      <DashboardHeader
        activeOperator={activeOperator}
        onChangeOperatorClick={() => setIsChangingOperator(true)}
        onNavigatePublic={() => onNavigatePublic('/')}
        onRefreshData={handleGlobalRefresh}
        onSignOut={handleSignOut}
      />

      {/* Barra mobile para abrir menu */}
      <div className="lg:hidden bg-[#111111] border-b border-white/10 px-4 py-2 flex items-center justify-between">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex items-center gap-2 text-xs font-mono text-white/70 hover:text-white"
        >
          <Menu className="w-4 h-4 text-[#C6FF00]" />
          <span>MENU NAVEGAÇÃO</span>
        </button>
        <span className="text-[10px] font-mono text-white/40 uppercase">
          {currentTab.replace('_', ' ')}
        </span>
      </div>

      {/* Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <DashboardSidebar
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Área Principal */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#0D0D0D]">
          <div className="max-w-7xl mx-auto space-y-6">
            {currentTab === 'overview' && (
              <OverviewView onNavigateTab={handleSelectTab} />
            )}
            {currentTab === 'finance' && <FinanceView />}
            {currentTab === 'clients' && <ClientsView />}
            {currentTab === 'projects_services' && <ProjectsServicesView />}
            {currentTab === 'inventory_nfc' && <InventoryNfcView />}
            {currentTab === 'reports' && <ReportsView />}
          </div>
        </main>
      </div>
    </div>
  );
}
