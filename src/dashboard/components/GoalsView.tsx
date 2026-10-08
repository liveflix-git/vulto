import React from 'react';
import { TrendingUp, Target, Award, ArrowUpRight } from 'lucide-react';
import { GoalItem, PartnerId } from '../types';

interface GoalsViewProps {
  goals: GoalItem[];
  currentUser: PartnerId;
}

export function GoalsView({ goals }: GoalsViewProps) {
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-[#111111] border border-white/10 p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono tracking-widest text-[#C6FF00] uppercase">
            // METAS & INDICADORES CHAVE (OKRs)
          </span>
          <span className="text-white/20">•</span>
          <span className="text-[10px] font-mono text-white/50">
            METAS DE CRESCIMENTO Q4
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold font-mono text-white">
          Metas Estratégicas dos Sócios
        </h1>
        <p className="text-xs text-white/60 font-sans mt-0.5">
          Acompanhamento dos alvos de faturamento, novos contratos e expansão do ecossistema.
        </p>
      </div>

      {/* Goals Cards */}
      <div className="space-y-4">
        {goals.map((g) => {
          const percent = Math.min(
            100,
            Math.round((g.current / g.target) * 100)
          );
          const isFinished = percent >= 100;

          return (
            <div
              key={g.id}
              className="bg-[#111111] border border-white/10 p-5 flex flex-col justify-between"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-[#181818] border border-white/10 text-white/70 uppercase">
                      {g.category}
                    </span>
                    <span className="text-xs font-mono text-white/40">
                      Prazo: {g.deadline}
                    </span>
                  </div>
                  <h3 className="text-base font-mono font-bold text-white mt-1">
                    {g.title}
                  </h3>
                </div>

                <div className="text-right font-mono">
                  <div className="text-lg font-bold text-white">
                    {g.unit === 'R$'
                      ? `R$ ${g.current.toLocaleString('pt-BR')}`
                      : `${g.current} ${g.unit}`}{' '}
                    <span className="text-white/40 text-xs">
                      / {g.unit === 'R$' ? `R$ ${g.target.toLocaleString('pt-BR')}` : `${g.target} ${g.unit}`}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-bold ${
                      isFinished ? 'text-emerald-400' : 'text-[#C6FF00]'
                    }`}
                  >
                    {percent}% atingido
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full bg-[#181818] overflow-hidden">
                <div
                  style={{ width: `${percent}%` }}
                  className={`h-full transition-all duration-500 ${
                    isFinished ? 'bg-emerald-400' : 'bg-[#C6FF00]'
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
