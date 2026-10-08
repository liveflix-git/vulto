import React, { useState } from 'react';
import { motion } from 'motion/react';
import { PROCESS_STEPS } from '../data/siteData';

export const ProcessSection: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  return (
    <section
      aria-labelledby="process-heading"
      className="bg-[#0A0A0A] border-b border-[#F4F4F1]/10 py-20 sm:py-28 lg:py-32"
    >
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-14 sm:pb-20">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-5 h-[1.5px] bg-[#C6FF00]" />
              <span className="font-mono-tabular text-xs uppercase tracking-[0.2em] text-[#F4F4F1]/60">
                METODOLOGIA &amp; OPERAÇÃO
              </span>
            </div>
            <h2
              id="process-heading"
              className="font-display font-bold uppercase text-3xl sm:text-5xl tracking-[-0.035em] text-[#F4F4F1]"
            >
              COMO TRABALHAMOS<span className="text-[#C6FF00]">.</span>
            </h2>
          </div>

          <p className="font-mono-tabular text-xs uppercase tracking-[0.14em] text-[#F4F4F1]/50">
            01 DIAGNÓSTICO → 04 OTIMIZAÇÃO CONTÍNUA
          </p>
        </div>

        <div className="relative">
          <div
            aria-hidden="true"
            className="hidden lg:block absolute top-6 left-0 right-0 h-[1px] bg-[#F4F4F1]/15"
          >
            <div
              className="h-full bg-[#C6FF00] transition-all duration-300 ease-out"
              style={{ width: `${((activeIndex + 1) / PROCESS_STEPS.length) * 100}%` }}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-0 lg:gap-8 relative">
            {PROCESS_STEPS.map((step, index) => {
              const isActive = index <= activeIndex;
              const isCurrent = index === activeIndex;

              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => setActiveIndex(index)}
                  className="relative pl-8 lg:pl-0 pb-12 lg:pb-0 last:pb-0 group cursor-pointer"
                >
                  {index < PROCESS_STEPS.length - 1 && (
                    <div
                      aria-hidden="true"
                      className={`lg:hidden absolute left-[11px] top-6 bottom-0 w-[1px] transition-colors duration-200 ${
                        index < activeIndex ? 'bg-[#C6FF00]' : 'bg-[#F4F4F1]/15'
                      }`}
                    />
                  )}

                  <div className="flex items-center gap-4 mb-6 lg:mb-8">
                    <div
                      className={`absolute left-0 lg:static w-6 h-6 lg:w-12 lg:h-12 flex items-center justify-center border transition-colors duration-200 bg-[#0A0A0A] z-10 ${
                        isCurrent
                          ? 'border-[#C6FF00] text-[#C6FF00]'
                          : isActive
                          ? 'border-[#C6FF00]/60 text-[#F4F4F1]'
                          : 'border-[#F4F4F1]/20 text-[#F4F4F1]/45'
                      }`}
                    >
                      <span className="font-mono-tabular text-[11px] lg:text-sm font-medium">
                        {step.number}
                      </span>
                    </div>

                    <span className="lg:hidden font-mono-tabular text-xs text-[#C6FF00]">
                      ETAPA {step.number}
                    </span>
                  </div>

                  <div
                    className={`p-6 border transition-colors duration-200 ${
                      isCurrent
                        ? 'border-[#C6FF00]/50 bg-[#1A1A1A]/60'
                        : 'border-[#F4F4F1]/10 bg-[#1A1A1A]/20 hover:border-[#F4F4F1]/25'
                    }`}
                  >
                    <div className="font-mono-tabular text-2xl sm:text-3xl font-light text-[#F4F4F1]/30 group-hover:text-[#C6FF00] transition-colors mb-3">
                      {step.number}
                    </div>
                    <h3 className="font-display font-bold uppercase text-xl sm:text-2xl tracking-[-0.025em] text-[#F4F4F1] mb-3">
                      {step.title}
                    </h3>
                    <p className="text-sm sm:text-base text-[#F4F4F1]/80 leading-relaxed mb-4">
                      {step.description}
                    </p>
                    <div className="pt-3 border-t border-[#F4F4F1]/10">
                      <p className="font-mono-tabular text-[11px] text-[#F4F4F1]/50 leading-relaxed">
                        {step.deliverableNote}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
