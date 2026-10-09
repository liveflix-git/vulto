import React, { useState } from 'react';
import {
  ShieldCheck,
  ArrowUpRight,
  Plus,
  RefreshCw,
  LogOut,
  ChevronDown,
  Check,
  AlertCircle,
} from 'lucide-react';
import { PartnerId, PartnerUser } from '../types';
import { PARTNERS } from '../dashboardStorage';

interface DashboardHeaderProps {
  currentUser: PartnerId;
  userEmail?: string | null;
  onSwitchUser: (userId: PartnerId) => void;
  onOpenNewRecord: () => void;
  onNavigatePublic: () => void;
  onRefreshData?: () => Promise<void> | void;
  onResetData: () => void;
  onSignOut: () => void;
}

export function DashboardHeader({
  currentUser,
  userEmail,
  onSwitchUser,
  onOpenNewRecord,
  onNavigatePublic,
  onRefreshData,
  onResetData,
  onSignOut,
}: DashboardHeaderProps) {
  const activePartner: PartnerUser = PARTNERS[currentUser] || PARTNERS.felipe;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState<'idle' | 'updating' | 'success' | 'error'>('idle');

  const handleGlobalRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setRefreshStatus('updating');

    try {
      if (onRefreshData) {
        await onRefreshData();
      } else {
        // Disparar evento para componentes ouvirem se necessário
        window.dispatchEvent(new CustomEvent('vulto:refresh'));
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
      setRefreshStatus('success');
      setTimeout(() => setRefreshStatus('idle'), 2000);
    } catch (err) {
      console.error('Erro ao atualizar dados:', err);
      setRefreshStatus('error');
      setTimeout(() => setRefreshStatus('idle'), 3000);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <header className="h-16 border-b border-white/10 bg-[#0A0A0A]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Brand & Mode info */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-[#C6FF00] rounded-none animate-pulse" />
          <span className="font-mono text-sm sm:text-base font-bold tracking-wider text-white">
            VULTO LAB
          </span>
          <span className="font-mono text-[10px] sm:text-xs text-white/40 tracking-widest px-1.5 py-0.5 border border-white/10 bg-[#141414]">
            CORE_OS v1.0
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono text-[#C6FF00]/90 px-2 py-0.5 bg-[#C6FF00]/5 border border-[#C6FF00]/20">
          <ShieldCheck className="w-3 h-3" />
          <span>ACESSO EXCLUSIVO // SÓCIOS</span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Botão Central de Atualizar Dados */}
        <button
          onClick={handleGlobalRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141414] hover:bg-[#1E1E1E] border border-white/10 text-white/80 hover:text-white text-xs font-mono transition-colors cursor-pointer disabled:opacity-50"
          title="Recarregar dados do Supabase"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${
              isRefreshing ? 'animate-spin text-[#C6FF00]' : refreshStatus === 'success' ? 'text-[#C6FF00]' : 'text-white/60'
            }`}
          />
          <span className="hidden sm:inline">
            {refreshStatus === 'updating'
              ? 'ATUALIZANDO...'
              : refreshStatus === 'success'
              ? 'ATUALIZADO'
              : refreshStatus === 'error'
              ? 'ERRO AO ATUALIZAR'
              : 'ATUALIZAR'}
          </span>
        </button>

        {/* Quick New Record */}
        <button
          onClick={onOpenNewRecord}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] text-xs font-mono font-bold tracking-wider transition-colors duration-150 cursor-pointer shadow-sm"
          title="Inserir nova transação, lead, cliente ou lote"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="hidden sm:inline">NOVO REGISTRO</span>
          <span className="sm:hidden">NOVO</span>
        </button>

        {/* User email badge if present */}
        {userEmail && (
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-[#141414] border border-white/10 text-[11px] font-mono text-white/70">
            <div className="w-1.5 h-1.5 rounded-full bg-[#C6FF00]" />
            <span className="truncate max-w-[140px]">{userEmail}</span>
          </div>
        )}

        {/* Partner profile switcher */}
        <div className="relative group">
          <button
            onClick={() => onSwitchUser(currentUser === 'felipe' ? 'pietro' : 'felipe')}
            className="flex items-center gap-2 px-2.5 py-1.5 bg-[#141414] hover:bg-[#1C1C1C] border border-white/10 text-xs font-mono text-[#F4F4F1] transition-colors cursor-pointer"
            title="Clique para alternar visão de sócio (Felipe / Pietro)"
          >
            <div className="w-5 h-5 bg-[#C6FF00]/15 border border-[#C6FF00]/40 text-[#C6FF00] text-[10px] font-bold flex items-center justify-center">
              {activePartner.avatarInitials}
            </div>
            <div className="text-left hidden md:block leading-tight">
              <span className="font-bold text-white block text-[11px]">
                {activePartner.name.split(' ')[0]}
              </span>
              <span className="text-[9px] text-white/50 block">
                {activePartner.role.split('&')[0].trim()}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-white/40" />
          </button>
        </div>

        {/* Return to Public Site */}
        <button
          onClick={onNavigatePublic}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-transparent hover:bg-white/5 border border-white/10 text-xs font-mono text-white/70 hover:text-white transition-colors cursor-pointer"
          title="Retornar à página pública da Vulto Lab"
        >
          <span className="hidden sm:inline">SITE PÚBLICO</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>

        {/* Sign Out / Exit */}
        <button
          onClick={onSignOut}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 text-xs font-mono transition-colors cursor-pointer"
          title="Encerrar sessão no Supabase"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">SAIR</span>
        </button>
      </div>
    </header>
  );
}
