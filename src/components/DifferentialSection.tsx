import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface DifferentialSectionProps {
  onNavigate: (path: string) => void;
}

export const DifferentialSection: React.FC<DifferentialSectionProps> = ({ onNavigate }) => {
  const { dict, language } = useLanguage();
  const diff = dict.differential;

  const isPt = language === 'pt-PT';

  const localizedCases = [
    {
      id: 'case-01',
      sector: isPt ? 'AUTOMÓVEL & PERFORMANCE' : 'AUTOMOTIVO & PERFORMANCE',
      client: isPt ? 'CONCESSIONÁRIO & PAID MEDIA' : 'CONCESSIONÁRIA & MÍDIA PAGA',
      summary: isPt
        ? 'Estrutura completa de recolha de leads qualificados e acompanhamento de funil no sector automóvel.'
        : 'Estrutura completa de geração de leads qualificados e acompanhamento de funil no setor automotivo.',
    },
    {
      id: 'case-02',
      sector: isPt ? 'CRIADORES & AUDIÊNCIAS MASSIVAS' : 'CRIADORES & AUDIÊNCIAS MASSIVAS',
      client: isPt ? '+35M DE SUBSCRITORES' : '+35M DE INSCRITOS',
      summary: isPt
        ? 'Posicionamento de marca, copywriting e VULTO TAP para eventos presenciais e lançamentos.'
        : 'Posicionamento de marca, copywriting e VULTO TAP para eventos presenciais e lançamentos.',
    },
  ];

  return (
    <section
      aria-labelledby="differential-heading"
      className="bg-[#0A0A0A] border-b border-[#F4F4F1]/10 py-20 sm:py-28 lg:py-36 relative overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-20 bg-gradient-to-b from-[#C6FF00] to-transparent"
      />

      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-12 items-end">
          <div className="lg:col-span-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-5 h-[1.5px] bg-[#C6FF00]" />
              <span className="font-mono-tabular text-xs uppercase tracking-[0.2em] text-[#F4F4F1]/60">
                {diff.kicker}
              </span>
            </div>

            <motion.h2
              id="differential-heading"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5 }}
              className="font-display font-bold uppercase text-3xl sm:text-5xl md:text-6xl lg:text-[4.25rem] leading-[0.98] tracking-[-0.04em] text-[#F4F4F1]"
            >
              <span className="block text-[#F4F4F1]/55">{diff.headingLine1}</span>
              <span className="block text-[#F4F4F1]/55 mb-5 sm:mb-7">{diff.headingLine2}</span>
              <span className="block text-[#F4F4F1]">{diff.headingLine3}</span>
              <span className="inline-block relative">
                {diff.headingLine4}{' '}
                <span className="text-[#C6FF00] relative inline-block">
                  {diff.headingHighlight}
                  <span className="block h-[2px] w-full bg-[#C6FF00] mt-1" />
                </span>
              </span>
            </motion.h2>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.45, delay: 0.12 }}
            className="lg:col-span-4 space-y-6 border-l border-[#F4F4F1]/15 pl-6"
          >
            <p className="text-sm sm:text-base text-[#F4F4F1]/75 leading-relaxed">
              {diff.support}
            </p>
            <a
              href="/contato"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/contato');
              }}
              data-cursor="cta"
              className="inline-flex items-center gap-2 font-mono-tabular text-xs uppercase tracking-[0.14em] text-[#C6FF00] hover:underline underline-offset-4"
            >
              <span>{diff.cta}</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </motion.div>
        </div>

        <div className="mt-16 sm:mt-20 grid grid-cols-1 md:grid-cols-2 border border-[#F4F4F1]/12 divide-y md:divide-y-0 md:divide-x divide-[#F4F4F1]/12">
          <div className="p-7 sm:p-10 bg-[#0A0A0A]">
            <span className="font-mono-tabular text-xs uppercase tracking-[0.18em] text-[#F4F4F1]/40 block mb-6">
              {diff.conventionalTitle}
            </span>
            <ul className="space-y-4 text-sm sm:text-base text-[#F4F4F1]/55">
              {diff.conventionalItems.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="font-mono-tabular text-xs text-[#F4F4F1]/35 mt-1">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-7 sm:p-10 bg-[#1A1A1A]/45">
            <div className="flex items-center justify-between mb-6">
              <span className="font-mono-tabular text-xs uppercase tracking-[0.18em] text-[#C6FF00]">
                {diff.vultoTitle}
              </span>
              <span className="w-2 h-2 bg-[#C6FF00]" />
            </div>
            <ul className="space-y-4 text-sm sm:text-base text-[#F4F4F1]/90">
              {diff.vultoItems.map((item, i) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="font-mono-tabular text-xs text-[#C6FF00] mt-1">
                    0{i + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {localizedCases.length > 0 && (
          <div className="mt-16 pt-16 border-t border-[#F4F4F1]/12">
            <h3 className="font-display font-bold uppercase text-2xl text-[#F4F4F1] mb-8">
              {isPt ? 'PROJECTOS SELECCIONADOS' : 'PROJETOS SELECIONADOS'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {localizedCases.map((caseItem) => (
                <div
                  key={caseItem.id}
                  className="p-8 border border-[#F4F4F1]/15 bg-[#1A1A1A]/30"
                >
                  <p className="font-mono-tabular text-xs text-[#C6FF00] uppercase mb-2">
                    {caseItem.sector}
                  </p>
                  <h4 className="font-display font-bold text-xl text-[#F4F4F1] mb-3">
                    {caseItem.client}
                  </h4>
                  <p className="text-sm text-[#F4F4F1]/75">{caseItem.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
