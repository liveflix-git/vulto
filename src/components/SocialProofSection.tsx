import React from 'react';
import { motion } from 'motion/react';
import { CORPORATE_PARTNERS, CREATOR_PARTNERS } from '../data/siteData';

export const SocialProofSection: React.FC = () => {
  return (
    <section
      aria-labelledby="social-proof-heading"
      className="bg-[#0A0A0A] border-b border-[#F4F4F1]/10 py-20 sm:py-28"
    >
      <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-12">
        {/* Header da Seção */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-14 border-b border-[#F4F4F1]/12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-5 h-[1.5px] bg-[#C6FF00]" />
              <span className="font-mono-tabular text-xs uppercase tracking-[0.2em] text-[#C6FF00]">
                MARCAS &amp; PROJETOS
              </span>
            </div>
            <motion.h2
              id="social-proof-heading"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className="font-display font-bold uppercase text-3xl sm:text-5xl tracking-[-0.035em] text-[#F4F4F1] max-w-3xl"
            >
              EXPERIÊNCIA CONSTRUÍDA AO LADO DE MARCAS E AUDIÊNCIAS REAIS<span className="text-[#C6FF00]">.</span>
            </motion.h2>
          </div>

          <p className="font-mono-tabular text-xs uppercase tracking-[0.14em] text-[#F4F4F1]/60 max-w-sm leading-relaxed">
            Empresas, criadores e operações digitais no Brasil e em Portugal.
          </p>
        </div>

        {/* Grade de Marcas Corporativas */}
        <div className="pt-12">
          <span className="font-mono-tabular text-[11px] uppercase tracking-[0.2em] text-[#F4F4F1]/45 block mb-6">
            OPERAÇÕES CORPORATIVAS &amp; VAREJO
          </span>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 border border-[#F4F4F1]/12 divide-x divide-y md:divide-y-0 divide-[#F4F4F1]/12 bg-[#1A1A1A]/30">
            {CORPORATE_PARTNERS.map((brand) => (
              <div
                key={brand.id}
                className="p-6 sm:p-8 flex flex-col justify-between hover:bg-[#1A1A1A]/70 transition-colors group min-h-[120px]"
              >
                <div className="font-display font-black text-lg sm:text-xl text-[#F4F4F1] tracking-tight uppercase group-hover:text-[#C6FF00] transition-colors">
                  {brand.name}
                </div>
                <p className="font-mono-tabular text-[10px] text-[#F4F4F1]/45 uppercase tracking-wider mt-3">
                  {brand.subtext}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Grade de Criadores e Audiências Massivas */}
        <div className="pt-14">
          <span className="font-mono-tabular text-[11px] uppercase tracking-[0.2em] text-[#C6FF00] block mb-6">
            CRIADORES &amp; AUDIÊNCIAS MASSIVAS (+2 BI VIEWS)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-[#F4F4F1]/12 divide-y sm:divide-y-0 sm:divide-x divide-[#F4F4F1]/12 bg-[#1A1A1A]/30">
            {CREATOR_PARTNERS.map((creator) => (
              <div
                key={creator.id}
                className="p-6 sm:p-8 flex flex-col justify-between hover:bg-[#1A1A1A]/70 transition-colors group min-h-[120px]"
              >
                <div>
                  <span className="font-mono-tabular text-xs text-[#C6FF00] font-bold block mb-1">
                    {creator.logoLetter}
                  </span>
                  <h3 className="font-display font-bold text-xl text-[#F4F4F1] uppercase tracking-tight group-hover:translate-x-1 transition-transform">
                    {creator.name}
                  </h3>
                </div>
                <p className="font-mono-tabular text-xs text-[#F4F4F1]/55 uppercase tracking-wider mt-4">
                  {creator.subtext}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
