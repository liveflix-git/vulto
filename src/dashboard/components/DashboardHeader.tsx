import React, { useState } from 'react';
import {
  ArrowUpRight,
  LogOut,
  ChevronDown,
  User,
  RefreshCw,
} from 'lucide-react';
import { VultoOperator } from '../../services/vultoCoreService';

interface DashboardHeaderProps {
  activeOperator: VultoOperator | null;
  onChangeOperatorClick: () => void;
  onNavigatePublic: () => void;
  onRefreshData: () => Promise<void> | void;
  onSignOut: () => void;
}

export function DashboardHeader({
  activeOperator,
  onChangeOperatorClick,
  onNavigatePublic,
  onRefreshData,
  onSignOut,
}: DashboardHeaderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefreshData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <header className="h-16 border-b border-white/10 bg-[#0A0A0A]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-2.5 h-2.5 bg-[#C6FF00] rounded-none animate-pulse" />
        <span className="font-mono text-base font-bold tracking-wider text-white">
          VULTO LAB
        </span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Refresh button */}
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 text-white/50 hover:text-white hover:bg-[#141414] border border-white/10 transition-colors cursor-pointer"
          title="Recarregar dados do Supabase"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#C6FF00]' : ''}`} />
        </button>

        {/* Seletor de operador */}
        <button
          onClick={onChangeOperatorClick}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#141414] hover:bg-[#1C1C1C] border border-white/10 text-xs font-mono text-white transition-colors cursor-pointer"
          title="Clique para trocar operador"
        >
          <div className="w-5 h-5 bg-[#C6FF00]/15 border border-[#C6FF00]/40 text-[#C6FF00] text-[10px] font-bold flex items-center justify-center">
            {activeOperator?.name ? activeOperator.name.charAt(0) : <User className="w-3 h-3" />}
          </div>
          <span className="font-bold text-white">
            {activeOperator?.name || 'Selecionar'}
          </span>
          <ChevronDown className="w-3 h-3 text-white/40" />
        </button>

        {/* Site Público */}
        <button
          onClick={onNavigatePublic}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-transparent hover:bg-white/5 border border-white/10 text-xs font-mono text-white/70 hover:text-white transition-colors cursor-pointer"
          title="Retornar à página pública"
        >
          <span className="hidden sm:inline">SITE PÚBLICO</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>

        {/* Sair */}
        <button
          onClick={onSignOut}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 text-xs font-mono transition-colors cursor-pointer"
          title="Encerrar sessão"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">SAIR</span>
        </button>
      </div>
    </header>
  );
}
