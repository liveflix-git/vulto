import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { ContactSection } from '../components/ContactSection';
import { CORPORATE_PARTNERS, CREATOR_PARTNERS } from '../data/siteData';

interface PageProps {
  onNavigate: (path: string) => void;
}

export const CasesPage: React.FC<PageProps> = ({ onNavigate }) => {
  return (
    <div className="bg-[#0A0A0A] text-[#F4F4F1]">
      {/* Hero da Página */}
      <section className="pt-32 pb-20 sm:pt-40 sm:pb-28 border-b border-[#F4F4F1]/10">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-6 h-[1.5px] bg-[#C6FF00]" />
            <span className="font-mono-tabular text-xs uppercase tracking-[0.2em] text-[#C6FF00] font-semibold">
              CASES &amp; EXPERIENCE
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
                RESULTADOS QUE EXISTEM
                <br />
                FORA DO POWERPOINT<span className="text-[#C6FF00]">.</span>
              </motion.h1>

              <p className="mt-6 text-lg sm:text-xl text-[#F4F4F1]/85 max-w-2xl leading-relaxed">
                Empresas, criadores e operações digitais atendidos com foco em aquisição, mensagem e engenharia de alta performance.
              </p>
            </div>

            <div className="lg:col-span-4 flex lg:justify-end">
              <a
                href="/contato"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/contato');
                }}
                data-cursor="cta"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#C6FF00] text-[#0A0A0A] text-xs font-bold uppercase tracking-[0.08em] hover:bg-[#d4ff33] transition-colors whitespace-nowrap"
              >
                <span>ESTRUTURAR MEU PROJETO</span>
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Seção CREATORS */}
      <section className="py-20 sm:py-28 border-b border-[#F4F4F1]/10">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-[#F4F4F1]/12">
            <div>
              <span className="font-mono-tabular text-xs uppercase tracking-[0.2em] text-[#C6FF00] block mb-3">
                AUDIÊNCIAS MASSIVAS
              </span>
              <h2 className="font-display font-bold uppercase text-3xl sm:text-5xl text-[#F4F4F1]">
                CREATORS<span className="text-[#C6FF00]">.</span>
              </h2>
            </div>

            <div className="bg-[#1A1A1A] border border-[#C6FF00]/40 p-4 inline-block">
              <p className="font-mono-tabular text-2xl font-black text-[#C6FF00]">+2 BILHÕES</p>
              <p className="font-mono-tabular text-[10px] text-[#F4F4F1]/60 uppercase tracking-widest">
                DE VISUALIZAÇÕES EM PROJETOS DE CONTEÚDO
              </p>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CREATOR_PARTNERS.map((creator) => (
              <div
                key={creator.id}
                className="p-8 border border-[#F4F4F1]/12 bg-[#1A1A1A]/30 hover:border-[#C6FF00]/50 transition-colors"
              >
                <span className="font-mono-tabular text-xs text-[#C6FF00] font-bold block mb-2">
                  {creator.logoLetter}
                </span>
                <h3 className="font-display font-bold text-2xl text-[#F4F4F1] uppercase mb-2">
                  {creator.name}
                </h3>
                <p className="font-mono-tabular text-xs text-[#F4F4F1]/60 uppercase tracking-wider">
                  {creator.subtext}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Seção BUSINESS */}
      <section className="py-20 sm:py-28 border-b border-[#F4F4F1]/10 bg-[#1A1A1A]/20">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-[#F4F4F1]/12">
            <div>
              <span className="font-mono-tabular text-xs uppercase tracking-[0.2em] text-[#C6FF00] block mb-3">
                OPERAÇÕES CORPORATIVAS
              </span>
              <h2 className="font-display font-bold uppercase text-3xl sm:text-5xl text-[#F4F4F1]">
                BUSINESS<span className="text-[#C6FF00]">.</span>
              </h2>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="bg-[#0A0A0A] border border-[#F4F4F1]/15 p-4">
                <p className="font-mono-tabular text-xl font-bold text-[#C6FF00]">+30</p>
                <p className="font-mono-tabular text-[10px] text-[#F4F4F1]/60 uppercase tracking-widest">
                  EMPRESAS ATENDIDAS
                </p>
              </div>
              <div className="bg-[#0A0A0A] border border-[#F4F4F1]/15 p-4">
                <p className="font-mono-tabular text-xl font-bold text-[#C6FF00]">+10 MIL</p>
                <p className="font-mono-tabular text-[10px] text-[#F4F4F1]/60 uppercase tracking-widest">
                  LEADS GERADOS
                </p>
              </div>
              <div className="bg-[#0A0A0A] border border-[#F4F4F1]/15 p-4">
                <p className="font-mono-tabular text-xl font-bold text-[#C6FF00]">+20 MI</p>
                <p className="font-mono-tabular text-[10px] text-[#F4F4F1]/60 uppercase tracking-widest">
                  IMPRESSÕES DIGITAIS
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CORPORATE_PARTNERS.map((brand) => (
              <div
                key={brand.id}
                className="p-8 border border-[#F4F4F1]/12 bg-[#0A0A0A] hover:border-[#C6FF00]/50 transition-colors"
              >
                <span className="font-mono-tabular text-xs text-[#C6FF00] font-bold block mb-2">
                  {brand.logoLetter}
                </span>
                <h3 className="font-display font-bold text-2xl text-[#F4F4F1] uppercase mb-2">
                  {brand.name}
                </h3>
                <p className="text-xs text-[#F4F4F1]/60 uppercase tracking-wider">{brand.subtext}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ContactSection />
    </div>
  );
};
