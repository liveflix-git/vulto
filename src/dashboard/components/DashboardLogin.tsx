import React, { useState } from 'react';
import { Lock, ArrowLeft, AlertCircle, Loader2, KeyRound, Mail, ShieldAlert } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface DashboardLoginProps {
  onSuccess: () => void;
  onNavigatePublic: () => void;
}

export function DashboardLogin({ onSuccess, onNavigatePublic }: DashboardLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage('Por favor, preencha o e-mail e a senha.');
      return;
    }

    if (!isSupabaseConfigured) {
      // In development or when env vars aren't injected
      setErrorMessage(
        'VITE_SUPABASE_URL ou VITE_SUPABASE_PUBLISHABLE_KEY não estão configuradas no ambiente. Verifique o painel do Cloudflare.'
      );
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        if (
          error.message.toLowerCase().includes('invalid login credentials') ||
          error.message.toLowerCase().includes('invalid credentials')
        ) {
          setErrorMessage('Credenciais inválidas. Verifique o e-mail e a senha informados.');
        } else if (error.message.toLowerCase().includes('email not confirmed')) {
          setErrorMessage('E-mail não confirmado no Supabase. Verifique a caixa de entrada.');
        } else {
          setErrorMessage(error.message || 'Falha ao autenticar. Tente novamente.');
        }
        setIsLoading(false);
        return;
      }

      if (data.session) {
        setIsLoading(false);
        onSuccess();
      } else {
        setIsLoading(false);
        setErrorMessage('Sessão não iniciada. Verifique os dados e tente novamente.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro inesperado na autenticação.';
      setErrorMessage(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4 selection:bg-[#C6FF00] selection:text-[#0A0A0A] relative">
      {/* Background ambient grid / dots */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Main card */}
      <div className="w-full max-w-md bg-[#111111] border border-white/10 p-6 sm:p-8 shadow-2xl relative z-10">
        {/* Top Header Indicators */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#C6FF00]" />
            <span className="font-mono text-xs font-bold tracking-widest text-white">
              VULTO LAB
            </span>
          </div>
          <span className="font-mono text-[10px] text-[#C6FF00] tracking-wider px-2 py-0.5 bg-[#C6FF00]/10 border border-[#C6FF00]/20">
            SUPABASE AUTH
          </span>
        </div>

        {/* Security Title */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-[#181818] border border-white/10 mx-auto flex items-center justify-center text-[#C6FF00] mb-3">
            <Lock className="w-5 h-5 stroke-[2]" />
          </div>
          <h1 className="text-xl font-bold font-mono tracking-tight text-[#F4F4F1] uppercase">
            COMMAND CENTER
          </h1>
          <p className="text-xs text-white/50 mt-1 font-mono tracking-wide">
            Acesso interno
          </p>
        </div>

        {/* Notice if Supabase env vars are not set */}
        {!isSupabaseConfigured && (
          <div className="mb-5 p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Aviso de Configuração</span>
            </div>
            <p className="text-[11px] text-amber-200/80 leading-relaxed font-sans">
              Variáveis de ambiente do Supabase (<code className="text-white">VITE_SUPABASE_URL</code> e{' '}
              <code className="text-white">VITE_SUPABASE_PUBLISHABLE_KEY</code>) ainda não detectadas. No Cloudflare, elas são injetadas durante o build.
            </p>
          </div>
        )}

        {/* Error message feedback */}
        {errorMessage && (
          <div className="mb-5 p-3 bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-mono flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono text-white/60 uppercase tracking-wider mb-1.5">
              E-mail
            </label>
            <div className="relative">
              <input
                type="email"
                required
                autoComplete="username"
                placeholder="admin@admin.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full bg-[#0A0A0A] border border-white/15 px-3 py-2.5 text-xs text-white placeholder-white/30 font-mono focus:border-[#C6FF00] focus:outline-none transition-colors disabled:opacity-50"
              />
              <Mail className="w-4 h-4 text-white/30 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-white/60 uppercase tracking-wider mb-1.5">
              Senha
            </label>
            <div className="relative">
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full bg-[#0A0A0A] border border-white/15 px-3 py-2.5 text-xs text-white placeholder-white/30 font-mono focus:border-[#C6FF00] focus:outline-none transition-colors disabled:opacity-50"
              />
              <KeyRound className="w-4 h-4 text-white/30 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#C6FF00] hover:bg-[#b0e600] disabled:bg-[#C6FF00]/50 text-[#0A0A0A] font-mono font-bold text-xs tracking-wider transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>AUTENTICANDO...</span>
              </>
            ) : (
              <span>ENTRAR</span>
            )}
          </button>
        </form>

        {/* Footer controls: Back to public site */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-white/40">
          <button
            type="button"
            onClick={onNavigatePublic}
            className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao site público</span>
          </button>

          <span className="text-[10px] text-white/30">ACESSO RESTRITO</span>
        </div>
      </div>
    </div>
  );
}
