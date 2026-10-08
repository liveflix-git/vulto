import React, { useState } from 'react';
import {
  Target,
  Plus,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  User,
  Filter,
} from 'lucide-react';
import { DealItem, PipelineStage, PartnerId } from '../types';

interface PipelineViewProps {
  deals: DealItem[];
  onUpdateDealStage: (dealId: string, nextStage: PipelineStage) => void;
  onOpenNewRecord: () => void;
  currentUser: PartnerId;
}

const STAGES: { id: PipelineStage; label: string; desc: string }[] = [
  { id: 'lead', label: '1. Lead / Entrada', desc: 'Primeiro contato' },
  { id: 'discovery', label: '2. Diagnóstico', desc: 'Reunião de briefing' },
  { id: 'proposal', label: '3. Proposta', desc: 'Escopo & valor enviado' },
  { id: 'negotiation', label: '4. Negociação', desc: 'Ajuste de contrato' },
  { id: 'won', label: '5. Fechado / Ganho', desc: 'Contrato assinado' },
  { id: 'lost', label: 'Perdido', desc: 'Arquivado' },
];

export function PipelineView({
  deals,
  onUpdateDealStage,
  onOpenNewRecord,
  currentUser,
}: PipelineViewProps) {
  const [partnerFilter, setPartnerFilter] = useState<'all' | PartnerId>('all');

  const filteredDeals = deals.filter((d) => {
    if (partnerFilter !== 'all' && d.owner !== partnerFilter) return false;
    return true;
  });

  // Calculate Pipeline Metrics
  const activeDeals = filteredDeals.filter(
    (d) => d.stage !== 'won' && d.stage !== 'lost'
  );
  const totalPipelineValue = activeDeals.reduce(
    (acc, d) => acc + d.totalEstimated,
    0
  );
  const wonDeals = filteredDeals.filter((d) => d.stage === 'won');
  const wonValue = wonDeals.reduce((acc, d) => acc + d.totalEstimated, 0);
  const avgTicket =
    wonDeals.length > 0 ? Math.round(wonValue / wonDeals.length) : 8500;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111111] border border-white/10 p-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-widest text-[#C6FF00] uppercase">
              // FUNIL COMERCIAL & CRM
            </span>
            <span className="text-white/20">•</span>
            <span className="text-[10px] font-mono text-white/50">
              PIPELINE DE VENDAS VULTO LAB
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono text-white">
            Pipeline de Negócios & Fechamentos
          </h1>
          <p className="text-xs text-white/60 font-sans mt-0.5">
            Acompanhamento das oportunidades desde o primeiro contato até o fechamento.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewRecord}
            className="px-4 py-2.5 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-mono font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>NOVO LEAD / OPORTUNIDADE</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#111111] border border-white/10 p-4">
          <div className="text-[11px] font-mono text-white/40 uppercase tracking-wider mb-1">
            Negócios Ativos no Funil
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {activeDeals.length} deals
          </div>
          <div className="text-[11px] font-mono text-amber-400 mt-1">
            Em andamento com Pietro/Felipe
          </div>
        </div>

        <div className="bg-[#111111] border border-white/10 p-4">
          <div className="text-[11px] font-mono text-white/40 uppercase tracking-wider mb-1">
            Valor Total em Aberto
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            R$ {totalPipelineValue.toLocaleString('pt-BR')},00
          </div>
          <div className="text-[11px] font-mono text-white/50 mt-1">
            Potencial contratual
          </div>
        </div>

        <div className="bg-[#111111] border border-white/10 p-4">
          <div className="text-[11px] font-mono text-white/40 uppercase tracking-wider mb-1">
            Ganhos / Fechados (Q4)
          </div>
          <div className="text-2xl font-bold font-mono text-[#C6FF00]">
            R$ {wonValue.toLocaleString('pt-BR')},00
          </div>
          <div className="text-[11px] font-mono text-[#C6FF00] mt-1">
            {wonDeals.length} contratos assinados
          </div>
        </div>

        <div className="bg-[#111111] border border-white/10 p-4">
          <div className="text-[11px] font-mono text-white/40 uppercase tracking-wider mb-1">
            Ticket Médio
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            R$ {avgTicket.toLocaleString('pt-BR')},00
          </div>
          <div className="text-[11px] font-mono text-white/50 mt-1">
            Setup + Retainer médio
          </div>
        </div>
      </div>

      {/* Partner Filter */}
      <div className="flex items-center gap-2 bg-[#111111] border border-white/10 p-3">
        <span className="text-xs font-mono text-white/40 flex items-center gap-1.5 mr-2">
          <Filter className="w-3.5 h-3.5" />
          FILTRAR RESPONSÁVEL:
        </span>
        <button
          onClick={() => setPartnerFilter('all')}
          className={`px-3 py-1 text-xs font-mono border transition-colors cursor-pointer ${
            partnerFilter === 'all'
              ? 'bg-[#C6FF00] text-[#0A0A0A] border-[#C6FF00] font-bold'
              : 'bg-[#161616] text-white/70 border-white/10 hover:text-white'
          }`}
        >
          Todos os Sócios
        </button>
        <button
          onClick={() => setPartnerFilter('pietro')}
          className={`px-3 py-1 text-xs font-mono border transition-colors cursor-pointer ${
            partnerFilter === 'pietro'
              ? 'bg-[#C6FF00] text-[#0A0A0A] border-[#C6FF00] font-bold'
              : 'bg-[#161616] text-white/70 border-white/10 hover:text-white'
          }`}
        >
          Pietro (Comercial)
        </button>
        <button
          onClick={() => setPartnerFilter('felipe')}
          className={`px-3 py-1 text-xs font-mono border transition-colors cursor-pointer ${
            partnerFilter === 'felipe'
              ? 'bg-[#C6FF00] text-[#0A0A0A] border-[#C6FF00] font-bold'
              : 'bg-[#161616] text-white/70 border-white/10 hover:text-white'
          }`}
        >
          Felipe (Projetos)
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {STAGES.map((stage) => {
          const stageDeals = filteredDeals.filter((d) => d.stage === stage.id);
          const stageTotal = stageDeals.reduce((acc, d) => acc + d.totalEstimated, 0);

          return (
            <div
              key={stage.id}
              className="bg-[#111111] border border-white/10 flex flex-col min-h-[480px]"
            >
              {/* Column Header */}
              <div className="p-3 border-b border-white/10 bg-[#161616]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-bold text-white tracking-wider truncate">
                    {stage.label}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#222] text-[#C6FF00] font-bold">
                    {stageDeals.length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-white/40">
                  <span>{stage.desc}</span>
                  <span>R$ {stageTotal.toLocaleString('pt-BR')}</span>
                </div>
              </div>

              {/* Deal Cards */}
              <div className="p-2 space-y-2.5 flex-1 overflow-y-auto">
                {stageDeals.length === 0 ? (
                  <div className="h-28 border border-dashed border-white/5 flex items-center justify-center text-[11px] font-mono text-white/20">
                    Vazio
                  </div>
                ) : (
                  stageDeals.map((deal) => {
                    const stageIndex = STAGES.findIndex((s) => s.id === deal.stage);
                    const canMovePrev = stageIndex > 0 && deal.stage !== 'lost';
                    const canMoveNext =
                      stageIndex < STAGES.length - 2 && deal.stage !== 'lost';

                    return (
                      <div
                        key={deal.id}
                        className="bg-[#181818] border border-white/10 p-3 hover:border-white/25 transition-all group"
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono text-white/40 mb-1">
                          <span className="text-[#C6FF00] font-bold">
                            {deal.probability}% prob.
                          </span>
                          <span className="uppercase text-[9px] bg-white/5 px-1 py-0.5 border border-white/5">
                            {deal.owner}
                          </span>
                        </div>

                        <h4 className="text-xs font-mono font-bold text-white mb-1 leading-snug">
                          {deal.companyName}
                        </h4>

                        <div className="text-[11px] font-sans text-white/60 mb-2 line-clamp-2">
                          {deal.service}
                        </div>

                        {deal.notes && (
                          <div className="p-2 bg-[#121212] border border-white/5 text-[10px] font-sans text-white/50 mb-2 leading-tight">
                            &quot;{deal.notes}&quot;
                          </div>
                        )}

                        <div className="pt-2 border-t border-white/5 flex items-center justify-between font-mono">
                          <span className="text-xs font-bold text-white">
                            R$ {deal.totalEstimated.toLocaleString('pt-BR')},00
                          </span>
                        </div>

                        {/* Stage Controls */}
                        <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between gap-1">
                          {canMovePrev && (
                            <button
                              onClick={() =>
                                onUpdateDealStage(
                                  deal.id,
                                  STAGES[stageIndex - 1].id
                                )
                              }
                              className="p-1 text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                              title="Recuar estágio"
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                          )}

                          {deal.stage !== 'won' && deal.stage !== 'lost' && (
                            <button
                              onClick={() => onUpdateDealStage(deal.id, 'won')}
                              className="px-2 py-0.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[9px] font-mono transition-colors cursor-pointer"
                              title="Marcar como Ganho"
                            >
                              Ganho
                            </button>
                          )}

                          {canMoveNext && (
                            <button
                              onClick={() =>
                                onUpdateDealStage(
                                  deal.id,
                                  STAGES[stageIndex + 1].id
                                )
                              }
                              className="p-1 text-[#C6FF00] hover:bg-[#C6FF00]/10 transition-colors cursor-pointer ml-auto"
                              title="Avançar estágio"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
