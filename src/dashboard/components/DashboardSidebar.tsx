import React from 'react';
import {
  LayoutDashboard,
  DollarSign,
  Users,
  UserPlus,
  FolderGit2,
  Package,
  FileBarChart,
  Target,
  StickyNote,
  LogOut,
  X,
} from 'lucide-react';

export type VultoTab =
  | 'overview'
  | 'finance'
  | 'prospects'
  | 'prospecting_goals'
  | 'clients'
  | 'projects_services'
  | 'inventory_nfc'
  | 'operator_notes'
  | 'reports';

interface DashboardSidebarProps {
  currentTab: VultoTab;
  onSelectTab: (tab: VultoTab) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

const NAV_ITEMS: { id: VultoTab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'VISÃO GERAL', icon: LayoutDashboard },
  { id: 'finance', label: 'FINANCEIRO', icon: DollarSign },
  { id: 'prospects', label: 'PROSPECÇÃO', icon: UserPlus },
  { id: 'prospecting_goals', label: 'METAS DE PROSPECÇÃO', icon: Target },
  { id: 'clients', label: 'CLIENTES', icon: Users },
  { id: 'projects_services', label: 'PROJETOS & SERVIÇOS', icon: FolderGit2 },
  { id: 'inventory_nfc', label: 'ESTOQUE NFC', icon: Package },
  { id: 'operator_notes', label: 'MINHAS NOTAS', icon: StickyNote },
  { id: 'reports', label: 'RELATÓRIOS', icon: FileBarChart },
];

export function DashboardSidebar({
  currentTab,
  onSelectTab,
  isOpenMobile = false,
  onCloseMobile,
}: DashboardSidebarProps) {
  const content = (
    <div className="h-full flex flex-col justify-between p-4 bg-[#0A0A0A] border-r border-white/10 select-none">
      {/* Top Nav */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-white/10 lg:hidden">
          <span className="font-mono text-xs text-white/50 tracking-wider">MENU DASHBOARD</span>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="text-white/40 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <nav className="space-y-1.5 font-mono">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 text-xs tracking-wider transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-[#141414] text-[#C6FF00] border-l-2 border-[#C6FF00] font-bold'
                    : 'text-white/60 hover:text-white hover:bg-[#121212] border-l-2 border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#C6FF00]' : 'text-white/40'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Minimal */}
      <div className="pt-4 border-t border-white/10 font-mono text-[10px] text-white/30 text-center">
        VULTO LAB CORE
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-[calc(100vh-4rem)] sticky top-16">
        {content}
      </aside>

      {/* Mobile drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div className="fixed inset-0 bg-black/80" onClick={onCloseMobile} />
          <div className="relative w-64 max-w-[80vw] h-full z-50">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
