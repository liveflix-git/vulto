import React from 'react';
import {
  LayoutDashboard,
  Wallet,
  Users,
  Layers,
  FolderGit2,
  CreditCard,
  FileText,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';
import { DashboardTab, PartnerId } from '../types';
import { PARTNERS } from '../dashboardStorage';

interface DashboardSidebarProps {
  currentTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  currentUser: PartnerId;
  counts: {
    pendingTransactions: number;
    activeDeals: number;
    activeClients: number;
    activeProjects: number;
    activeTapBatches: number;
  };
}

export function DashboardSidebar({
  currentTab,
  onSelectTab,
  currentUser,
  counts,
}: DashboardSidebarProps) {
  const otherPartner = currentUser === 'felipe' ? PARTNERS.pietro : PARTNERS.felipe;

  const NAV_ITEMS: {
    id: DashboardTab;
    label: string;
    sublabel: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    {
      id: 'overview',
      label: 'Visão Geral',
      sublabel: 'Resumo Executivo',
      icon: LayoutDashboard,
    },
    {
      id: 'finance',
      label: 'Financeiro',
      sublabel: 'Caixa, Vendas & Propostas',
      icon: Wallet,
      badge: counts.pendingTransactions > 0 ? counts.pendingTransactions : undefined,
    },
    {
      id: 'clients',
      label: 'Clientes',
      sublabel: 'Base Ativa & MRR',
      icon: Users,
      badge: counts.activeClients,
    },
    {
      id: 'projects',
      label: 'Projetos & Entregas',
      sublabel: 'Operação & Demandas',
      icon: FolderGit2,
      badge: counts.activeProjects,
    },
    {
      id: 'pricing',
      label: 'Serviços & Preços',
      sublabel: 'Tabela & Simulador',
      icon: Layers,
    },
    {
      id: 'vulto_tap',
      label: 'VULTO TAP (NFC)',
      sublabel: 'Estoque & Lotes Físicos',
      icon: CreditCard,
    },
    {
      id: 'reports',
      label: 'Relatórios',
      sublabel: 'Auditoria & Exportação',
      icon: FileText,
    },
  ];

  return (
    <aside className="w-64 border-r border-white/10 bg-[#0E0E0E] flex flex-col justify-between shrink-0">
      <div className="py-4">
        {/* Navigation list */}
        <div className="px-3 pb-2 text-[10px] font-mono tracking-widest text-white/40 uppercase">
          Módulos Operacionais
        </div>
        <nav className="space-y-1 px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-xs font-mono transition-colors duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#1C1C1C] text-white border-l-2 border-[#C6FF00] font-semibold'
                    : 'text-white/60 hover:text-white hover:bg-[#141414] border-l-2 border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-[#C6FF00]' : 'text-white/40'
                    }`}
                  />
                  <div className="truncate">
                    <span className="block leading-none">{item.label}</span>
                    <span className="text-[10px] text-white/30 block mt-0.5 font-sans font-normal truncate">
                      {item.sublabel}
                    </span>
                  </div>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 font-mono font-bold ${
                      isActive
                        ? 'bg-[#C6FF00] text-[#0A0A0A]'
                        : 'bg-white/10 text-white/60'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Partner Quick Communication Box */}
      <div className="p-3 border-t border-white/10 bg-[#0A0A0A]">
        <div className="text-[10px] font-mono text-white/40 mb-2 flex items-center justify-between">
          <span>ALINHAMENTO ENTRE SÓCIOS</span>
          <span className="text-[#C6FF00]">2/2 ON</span>
        </div>

        <a
          href={`https://wa.me/${otherPartner.whatsapp}?text=${encodeURIComponent(
            'Fala, sócio! Alinhando as demandas aqui pelo Dashboard Vulto Lab.'
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-2.5 bg-[#141414] hover:bg-[#1C1C1C] border border-white/10 text-xs font-mono text-white/80 transition-colors"
        >
          <div className="flex items-center gap-2 truncate">
            <MessageCircle className="w-3.5 h-3.5 text-[#C6FF00] shrink-0" />
            <div className="truncate">
              <span className="block text-[11px] font-bold text-white truncate">
                Chamar {otherPartner.name.split(' ')[0]}
              </span>
              <span className="text-[9px] text-white/40 block truncate">
                {otherPartner.role}
              </span>
            </div>
          </div>
          <ExternalLink className="w-3 h-3 text-white/30 shrink-0" />
        </a>

        <div className="mt-3 text-[9px] font-mono text-center text-white/30">
          VULTO LAB — ALL RIGHTS RESERVED 2026
        </div>
      </div>
    </aside>
  );
}
