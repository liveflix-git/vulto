import React from 'react';
import { motion } from 'motion/react';
import { VULTO_METRICS } from '../data/siteData';

export const MetricsBar: React.FC = () => {
  return (
    <section
      aria-label="Diferenciais e métricas da Vulto Lab"
      className="bg-[#0A0A0A] border-b border-[#F4F4F1]/10"
    >
      <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#F4F4F1]/10 border-x border-[#F4F4F1]/[0.05]">
          {VULTO_METRICS.map((metric, idx) => (
            <motion.div
              key={metric.index}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: idx * 0.07 }}
              className="p-7 sm:p-8 lg:p-10 group hover:bg-[#1A1A1A]/50 transition-colors duration-200 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="font-mono-tabular text-xs text-[#F4F4F1]/40">
                  {metric.index}
                </span>
                <span className="w-4 h-[1.5px] bg-[#F4F4F1]/20 group-hover:bg-[#C6FF00] group-hover:w-7 transition-all duration-200" />
              </div>

              <div>
                <div className="font-display font-black text-3xl sm:text-4xl lg:text-[2.5rem] tracking-[-0.03em] text-[#C6FF00] uppercase leading-tight mb-2">
                  {metric.value}
                </div>
                <div className="font-display font-bold text-xs sm:text-sm tracking-[0.14em] text-[#F4F4F1] uppercase mb-2.5">
                  {metric.label}
                </div>
                <p className="text-xs sm:text-sm text-[#F4F4F1]/65 leading-relaxed">
                  {metric.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
