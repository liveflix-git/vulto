import React from 'react';
import { motion } from 'motion/react';
import { CORE_PILLARS } from '../data/siteData';

const MARQUEE_ITEMS = [
  'PAID MEDIA',
  'COPY',
  'WEB',
  'NFC',
  'STRATEGY',
  'CONVERSION',
];

export const WhatWeDoSection: React.FC = () => {
  return (
    <section
      aria-labelledby="what-we-do-heading"
      className="bg-[#0A0A0A] border-b border-[#F4F4F1]/10 overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="border-b border-[#F4F4F1]/10 bg-[#1A1A1A]/30 py-3.5 overflow-hidden select-none"
      >
        <div className="animate-vulto-marquee flex items-center">
          {[0, 1, 2, 3].map((groupIndex) => (
            <div key={groupIndex} className="flex items-center shrink-0">
              {MARQUEE_ITEMS.map((word) => (
                <div key={`${groupIndex}-${word}`} className="flex items-center">
                  <span className="font-mono-tabular text-xs tracking-[0.24em] uppercase text-[#F4F4F1]/55 px-7">
                    {word}
                  </span>
                  <span className="w-1.5 h-1.5 bg-[#C6FF00] inline-block" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 py-20 sm:py-28 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end pb-16 sm:pb-20 border-b border-[#F4F4F1]/12">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3 mb-5">
              <span className="w-5 h-[1.5px] bg-[#C6FF00]" />
              <span className="font-mono-tabular text-xs uppercase tracking-[0.2em] text-[#F4F4F1]/60">
                POSICIONAMENTO &amp; TESE
              </span>
            </div>

            <motion.h2
              id="what-we-do-heading"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45 }}
              className="font-display font-bold uppercase text-3xl sm:text-5xl lg:text-6xl leading-[0.98] tracking-[-0.035em] text-[#F4F4F1]"
            >
              NÃO FAZEMOS MARKETING
              <br />
              <span className="text-[#F4F4F1]/85">POR FAZER</span>
              <span className="text-[#C6FF00]">.</span>
            </motion.h2>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="lg:col-span-5"
          >
            <p className="text-base sm:text-lg text-[#F4F4F1]/75 leading-relaxed">
              Construímos estruturas digitais pensadas para transformar atenção em oportunidade e
              oportunidade em venda.
            </p>
          </motion.div>
        </div>

        <div className="divide-y divide-[#F4F4F1]/12">
          {CORE_PILLARS.map((pillar, idx) => (
            <motion.article
              key={pillar.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="py-10 sm:py-14 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start group"
            >
              <div className="lg:col-span-2 flex items-center gap-3">
                <span className="font-mono-tabular text-sm text-[#C6FF00] font-medium">
                  {pillar.number}
                </span>
                <span className="w-6 h-[1px] bg-[#F4F4F1]/20 group-hover:w-10 group-hover:bg-[#C6FF00] transition-all duration-200" />
              </div>

              <div className="lg:col-span-5">
                <h3 className="font-display font-bold uppercase text-3xl sm:text-4xl lg:text-5xl tracking-[-0.035em] text-[#F4F4F1] group-hover:translate-x-1.5 transition-transform duration-200">
                  {pillar.title}
                </h3>
                <p className="mt-2 font-mono-tabular text-xs uppercase tracking-[0.14em] text-[#F4F4F1]/50">
                  {pillar.subtitle}
                </p>
              </div>

              <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                <p className="text-sm sm:text-base text-[#F4F4F1]/75 leading-relaxed">
                  {pillar.description}
                </p>
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-mono-tabular text-[#F4F4F1]/45 pt-1">
                  {pillar.keywords.map((kw, i) => (
                    <React.Fragment key={kw}>
                      <span>{kw}</span>
                      {i < pillar.keywords.length - 1 && (
                        <span aria-hidden="true" className="text-[#C6FF00]">
                          ·
                        </span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};
