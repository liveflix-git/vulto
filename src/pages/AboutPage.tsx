import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AboutSection } from '../components/AboutSection';
import { WhatWeDoSection } from '../components/WhatWeDoSection';
import { ProcessSection } from '../components/ProcessSection';
import { ContactSection } from '../components/ContactSection';
import { VultoArchitecturalMonogram } from '../components/BrandLogo';
import { useLanguage } from '../context/LanguageContext';

interface PageProps {
  onNavigate: (path: string) => void;
}

type TabType = 'geral' | 'historia' | 'filosofia';

export const AboutPage: React.FC<PageProps> = ({ onNavigate }) => {
  const { dict } = useLanguage();
  const page = dict.pages.about;
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get('tab');
      if (tabParam === 'historia' || window.location.hash === '#historia') {
        return 'historia';
      }
      if (tabParam === 'filosofia' || window.location.hash === '#filosofia') {
        return 'filosofia';
      }
    }
    return 'geral';
  });

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const newUrl = tab === 'geral' ? '/sobre' : `/sobre?tab=${tab}`;
      window.history.replaceState({}, '', newUrl);
    }
    // Smooth scroll down to tab content if needed
    const tabContent = document.getElementById('about-tab-content');
    if (tabContent) {
      tabContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="bg-[#0A0A0A] text-[#F4F4F1] selection:bg-[#C6FF00] selection:text-[#0A0A0A]">
      {/* Hero Sobre */}
      <section className="pt-28 pb-16 sm:pt-36 sm:pb-24 border-b border-[#F4F4F1]/10 relative overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-6 h-[1.5px] bg-[#C6FF00]" />
                <span className="font-mono-tabular text-xs uppercase tracking-[0.2em] text-[#C6FF00] font-semibold">
                  {page.kicker}
                </span>
              </div>

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="font-display font-bold uppercase text-3xl sm:text-5xl lg:text-6xl xl:text-7xl leading-[0.96] tracking-[-0.04em] text-[#F4F4F1]"
              >
                {page.heroTitle1}
                <br />
                {page.heroTitle2}
                <br />
                {page.heroTitle3}
                <span className="text-[#C6FF00]">.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.08 }}
                className="mt-5 text-base sm:text-xl text-[#F4F4F1]/85 max-w-2xl leading-relaxed font-light"
              >
                {page.heroSubtitle}
              </motion.p>
            </div>

            <div className="lg:col-span-4 flex justify-start lg:justify-end">
              <div className="p-6 border border-[#F4F4F1]/12 bg-[#121212]/50">
                <VultoArchitecturalMonogram
                  className="w-36 h-36 sm:w-44 sm:h-44"
                  strokeColor="rgba(244,244,241,0.22)"
                  showLimeSlit={true}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* BARRA DE NAVEGAÇÃO DE ABAS (TABS LUXURY-TECH BRUTALISTA)       */}
      {/* ============================================================ */}
      <section className="sticky top-20 z-30 bg-[#080808]/95 backdrop-blur-md border-b border-[#F4F4F1]/15">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
          <nav
            aria-label="Abas da página Sobre"
            className="flex items-center overflow-x-auto no-scrollbar py-2.5 sm:py-3 gap-2 sm:gap-3"
          >
            <span className="font-mono-tabular text-[10px] uppercase tracking-[0.2em] text-[#F4F4F1]/45 mr-2 shrink-0 hidden md:inline">
              NAVEGAR POR:
            </span>

            {/* Aba 1: Geral / Todos */}
            <button
              type="button"
              onClick={() => handleTabChange('geral')}
              className={`px-4 py-2 font-mono-tabular text-xs uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer border ${
                activeTab === 'geral'
                  ? 'bg-[#C6FF00] text-[#0A0A0A] font-bold border-[#C6FF00]'
                  : 'bg-[#121212] text-[#F4F4F1]/70 hover:text-[#F4F4F1] border-[#F4F4F1]/10 hover:border-[#F4F4F1]/30'
              }`}
            >
              VISÃO GERAL
            </button>

            {/* Aba 2: História & Números */}
            <button
              type="button"
              onClick={() => handleTabChange('historia')}
              className={`px-4 py-2 font-mono-tabular text-xs uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer border ${
                activeTab === 'historia'
                  ? 'bg-[#C6FF00] text-[#0A0A0A] font-bold border-[#C6FF00]'
                  : 'bg-[#121212] text-[#F4F4F1]/70 hover:text-[#F4F4F1] border-[#F4F4F1]/10 hover:border-[#F4F4F1]/30'
              }`}
            >
              HISTÓRIA & NÚMEROS
            </button>

            {/* Aba 3: Filosofia & Processo */}
            <button
              type="button"
              onClick={() => handleTabChange('filosofia')}
              className={`px-4 py-2 font-mono-tabular text-xs uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer border ${
                activeTab === 'filosofia'
                  ? 'bg-[#C6FF00] text-[#0A0A0A] font-bold border-[#C6FF00]'
                  : 'bg-[#121212] text-[#F4F4F1]/70 hover:text-[#F4F4F1] border-[#F4F4F1]/10 hover:border-[#F4F4F1]/30'
              }`}
            >
              FILOSOFIA & MÉTODO
            </button>
          </nav>
        </div>
      </section>

      {/* ============================================================ */}
      {/* CONTEÚDO DAS ABAS                                             */}
      {/* ============================================================ */}
      <div id="about-tab-content">
        {/* ABA: HISTÓRIA & NÚMEROS */}
        {activeTab === 'historia' && (
          <motion.div
            key="tab-historia"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <section className="py-16 sm:py-24 border-b border-[#F4F4F1]/10">
              <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                  <div className="lg:col-span-6 space-y-6 text-base sm:text-lg text-[#F4F4F1]/80 leading-relaxed">
                    <p className="text-[#F4F4F1] font-semibold text-xl">
                      {page.historyP1}
                    </p>
                    <p>{page.historyP2}</p>
                    <div className="p-6 border-l-2 border-[#C6FF00] bg-[#1A1A1A]/30 font-display font-bold text-lg uppercase text-[#F4F4F1] mt-6">
                      "{page.quote}"
                    </div>
                  </div>

                  <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="p-8 border border-[#F4F4F1]/12 bg-[#1A1A1A]/30">
                      <p className="font-display font-black text-4xl text-[#C6FF00] mb-2">{page.stat1Number}</p>
                      <p className="font-mono-tabular text-xs text-[#F4F4F1]/60 uppercase tracking-widest">
                        {page.stat1Label}
                      </p>
                    </div>

                    <div className="p-8 border border-[#F4F4F1]/12 bg-[#1A1A1A]/30">
                      <p className="font-display font-black text-4xl text-[#C6FF00] mb-2">{page.stat2Number}</p>
                      <p className="font-mono-tabular text-xs text-[#F4F4F1]/60 uppercase tracking-widest">
                        {page.stat2Label}
                      </p>
                    </div>

                    <div className="p-8 border border-[#F4F4F1]/12 bg-[#1A1A1A]/30">
                      <p className="font-display font-black text-xl text-[#C6FF00] mb-2 mt-2">{page.stat3Number}</p>
                      <p className="font-mono-tabular text-xs text-[#F4F4F1]/60 uppercase tracking-widest">
                        {page.stat3Label}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <ContactSection />
          </motion.div>
        )}

        {/* ABA: FILOSOFIA & PROCESSO */}
        {activeTab === 'filosofia' && (
          <motion.div
            key="tab-filosofia"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AboutSection onNavigate={onNavigate} showMoreLink={false} />
            <WhatWeDoSection />
            <ProcessSection />
            <ContactSection />
          </motion.div>
        )}

        {/* ABA: VISÃO GERAL COMPLETA (PADRÃO) */}
        {activeTab === 'geral' && (
          <motion.div
            key="tab-geral"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {/* 1. História e Números */}
            <section className="py-16 sm:py-24 border-b border-[#F4F4F1]/10">
              <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                  <div className="lg:col-span-6 space-y-6 text-base sm:text-lg text-[#F4F4F1]/80 leading-relaxed">
                    <p className="text-[#F4F4F1] font-semibold text-xl">
                      {page.historyP1}
                    </p>
                    <p>{page.historyP2}</p>
                    <div className="p-6 border-l-2 border-[#C6FF00] bg-[#1A1A1A]/30 font-display font-bold text-lg uppercase text-[#F4F4F1] mt-6">
                      "{page.quote}"
                    </div>
                  </div>

                  <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="p-8 border border-[#F4F4F1]/12 bg-[#1A1A1A]/30">
                      <p className="font-display font-black text-4xl text-[#C6FF00] mb-2">{page.stat1Number}</p>
                      <p className="font-mono-tabular text-xs text-[#F4F4F1]/60 uppercase tracking-widest">
                        {page.stat1Label}
                      </p>
                    </div>

                    <div className="p-8 border border-[#F4F4F1]/12 bg-[#1A1A1A]/30">
                      <p className="font-display font-black text-4xl text-[#C6FF00] mb-2">{page.stat2Number}</p>
                      <p className="font-mono-tabular text-xs text-[#F4F4F1]/60 uppercase tracking-widest">
                        {page.stat2Label}
                      </p>
                    </div>

                    <div className="p-8 border border-[#F4F4F1]/12 bg-[#1A1A1A]/30">
                      <p className="font-display font-black text-xl text-[#C6FF00] mb-2 mt-2">{page.stat3Number}</p>
                      <p className="font-mono-tabular text-xs text-[#F4F4F1]/60 uppercase tracking-widest">
                        {page.stat3Label}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Filosofia e Pilares */}
            <AboutSection onNavigate={onNavigate} showMoreLink={false} />

            {/* 3. O que fazemos */}
            <WhatWeDoSection />

            {/* 4. Processo */}
            <ProcessSection />

            {/* 5. Contato */}
            <ContactSection />
          </motion.div>
        )}
      </div>
    </div>
  );
};
