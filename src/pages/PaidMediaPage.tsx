import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, CheckCircle2, ArrowRight } from 'lucide-react';
import { ContactSection } from '../components/ContactSection';

interface PageProps {
  onNavigate: (path: string) => void;
}

export const PaidMediaPage: React.FC<PageProps> = ({ onNavigate }) => {
  return (
    <div className="bg-[#0A0A0A] text-[#F4F4F1]">
      {/* Hero da Página */}
      <section className="pt-32 pb-20 sm:pt-40 sm:pb-28 border-b border-[#F4F4F1]/10">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-6 h-[1.5px] bg-[#C6FF00]" />
            <span className="font-mono-tabular text-xs uppercase tracking-[0.2em] text-[#C6FF00] font-semibold">
              PAID MEDIA
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-end">
            <div className="lg:col-span-8">
              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="font-display font-bold uppercase text-4xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-[-0.04em] text-[#F4F4F1]"
              >
                TRÁFEGO É DISTRIBUIÇÃO.
                <br />
                PERFORMANCE É ESTRATÉGIA<span className="text-[#C6FF00]">.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.1 }}
                className="mt-6 text-lg sm:text-xl text-[#F4F4F1]/85 max-w-2xl leading-relaxed"
              >
                Criamos e otimizamos campanhas para transformar investimento em oportunidades reais de negócio.
              </motion.p>
            </div>

            <div className="lg:col-span-4 flex lg:justify-end">
              <a
                href="/contato?servico=Paid+Media"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/contato?servico=Paid+Media');
                }}
                data-cursor="cta"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#C6FF00] text-[#0A0A0A] text-xs font-bold uppercase tracking-[0.08em] hover:bg-[#d4ff33] transition-colors whitespace-nowrap"
              >
                <span>QUERO ESTRUTURAR MINHAS CAMPANHAS</span>
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Texto Institucional */}
      <section className="py-20 sm:py-28 border-b border-[#F4F4F1]/10">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-5">
              <span className="font-mono-tabular text-xs uppercase tracking-[0.2em] text-[#F4F4F1]/45 block mb-4">
                VISÃO DE MÍDIA PAGA
              </span>
              <h2 className="font-display font-bold uppercase text-3xl sm:text-4xl tracking-[-0.03em] text-[#F4F4F1]">
                NÃO PARAMOS NO CLIQUE<span className="text-[#C6FF00]">.</span>
              </h2>
            </div>

            <div className="lg:col-span-7 space-y-6 text-base sm:text-lg text-[#F4F4F1]/80 leading-relaxed">
              <p className="text-[#F4F4F1] font-semibold">
                Paid Media é uma das principais frentes da VULTO LAB.
              </p>
              <p>
                Planejamos, estruturamos e otimizamos campanhas em plataformas como Meta Ads e Google Ads para empresas de diferentes segmentos.
              </p>
              <p>
                Nosso trabalho não termina no clique. Analisamos oferta, copy, criativo, página, rastreamento e jornada do usuário para identificar o que realmente influencia o resultado.
              </p>
              <p className="border-l-2 border-[#C6FF00] pl-4 text-[#F4F4F1] font-semibold">
                A mídia paga funciona melhor quando todo o sistema está preparado para converter.
              </p>
            </div>
          </div>

          {/* Blocos de Capacidades */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-[#F4F4F1]/12">
            {[
              {
                title: 'ESTRATÉGIA DE MÍDIA',
                desc: 'Planejamento de campanhas baseado no estágio e objetivo da empresa.',
              },
              {
                title: 'META ADS',
                desc: 'Aquisição, remarketing, geração de leads e campanhas orientadas a resultado.',
              },
              {
                title: 'GOOGLE ADS',
                desc: 'Pesquisa, intenção de compra, remarketing e presença em momentos de alta demanda.',
              },
              {
                title: 'TRACKING',
                desc: 'Pixels, eventos, analytics e acompanhamento de conversões.',
              },
              {
                title: 'OTIMIZAÇÃO',
                desc: 'Análise constante de campanhas, públicos, criativos e custos.',
              },
              {
                title: 'LEAD GENERATION',
                desc: 'Foco em oportunidades comerciais reais e não apenas métricas de vaidade.',
              },
            ].map((block, idx) => (
              <div
                key={block.title}
                className="p-8 border-r border-b border-[#F4F4F1]/12 bg-[#0A0A0A] hover:bg-[#1A1A1A]/40 transition-colors"
              >
                <span className="font-mono-tabular text-xs text-[#C6FF00] block mb-4">
                  0{idx + 1}
                </span>
                <h3 className="font-display font-bold uppercase text-lg text-[#F4F4F1] mb-2">
                  {block.title}
                </h3>
                <p className="text-sm text-[#F4F4F1]/65 leading-relaxed">{block.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fluxo Visual: DA IMPRESSÃO À OPORTUNIDADE */}
      <section className="py-20 sm:py-28 border-b border-[#F4F4F1]/10 bg-[#1A1A1A]/20">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="font-mono-tabular text-xs uppercase tracking-[0.2em] text-[#C6FF00] block mb-3">
              JORNADA DE AQUISIÇÃO
            </span>
            <h2 className="font-display font-bold uppercase text-3xl sm:text-4xl text-[#F4F4F1]">
              DA IMPRESSÃO À OPORTUNIDADE<span className="text-[#C6FF00]">.</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {['ANÚNCIO', 'PÁGINA', 'OFERTA', 'LEAD', 'ATENDIMENTO', 'CONVERSÃO'].map(
              (step, index) => (
                <div
                  key={step}
                  className="p-6 border border-[#F4F4F1]/12 bg-[#0A0A0A] text-center relative group"
                >
                  <span className="font-mono-tabular text-[11px] text-[#C6FF00] block mb-2">
                    ETAPA 0{index + 1}
                  </span>
                  <p className="font-display font-bold text-sm uppercase text-[#F4F4F1] tracking-wider">
                    {step}
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      <ContactSection initialService="Paid Media" />
    </div>
  );
};
