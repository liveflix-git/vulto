import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { SERVICES_DATA } from '../data/siteData';

interface ServicesEditorialListProps {
  onNavigate: (path: string) => void;
  showHeader?: boolean;
}

export const ServicesEditorialList: React.FC<ServicesEditorialListProps> = ({
  onNavigate,
  showHeader = true,
}) => {
  const handleServiceClick = (e: React.MouseEvent, slug: string) => {
    e.preventDefault();
    onNavigate(`/${slug}`);
  };

  return (
    <section
      aria-labelledby="services-editorial-heading"
      className="bg-[#0A0A0A] border-b border-[#F4F4F1]/10 py-20 sm:py-28 lg:py-32"
    >
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12">
        {showHeader && (
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-14 sm:pb-16 border-b border-[#F4F4F1]/15">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-5 h-[1.5px] bg-[#C6FF00]" />
                <span className="font-mono-tabular text-xs uppercase tracking-[0.2em] text-[#F4F4F1]/60">
                  CAPACIDADES &amp; ESCOPO
                </span>
              </div>
              <h2
                id="services-editorial-heading"
                className="font-display font-bold uppercase text-3xl sm:text-5xl tracking-[-0.035em] text-[#F4F4F1]"
              >
                SERVIÇOS<span className="text-[#C6FF00]">.</span>
              </h2>
            </div>

            <a
              href="/servicos"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/servicos');
              }}
              className="inline-flex items-center gap-2 text-xs font-mono-tabular uppercase tracking-[0.14em] text-[#F4F4F1]/75 hover:text-[#C6FF00] transition-colors self-start md:self-auto whitespace-nowrap"
            >
              <span>VER ARQUITETURA COMPLETA DE SERVIÇOS</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        )}

        <div className="divide-y divide-[#F4F4F1]/12 border-b border-[#F4F4F1]/12">
          {SERVICES_DATA.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
              className="group relative"
            >
              <span
                aria-hidden="true"
                className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#C6FF00] scale-y-0 group-hover:scale-y-100 transition-transform duration-200 origin-top"
              />

              <a
                href={`/${service.slug}`}
                onClick={(e) => handleServiceClick(e, service.slug)}
                className="block py-10 sm:py-12 lg:py-14 px-2 sm:px-6 transition-colors duration-200 group-hover:bg-[#1A1A1A]/40 focus-visible:outline-none"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start lg:items-center">
                  <div className="lg:col-span-2 flex items-center gap-4">
                    <span className="font-mono-tabular text-3xl sm:text-4xl lg:text-5xl font-light text-[#F4F4F1]/35 group-hover:text-[#C6FF00] transition-colors duration-200">
                      {service.number}
                    </span>
                  </div>

                  <div className="lg:col-span-4">
                    <h3 className="font-display font-bold uppercase text-2xl sm:text-3xl lg:text-4xl tracking-[-0.03em] text-[#F4F4F1] group-hover:translate-x-2 transition-transform duration-200">
                      {service.title}
                    </h3>

                    {service.isNfcSpecial && (
                      <div className="mt-3 inline-flex flex-wrap items-center gap-2 font-mono-tabular text-[11px] tracking-[0.14em] uppercase text-[#C6FF00]">
                        <span>CARD</span>
                        <span aria-hidden="true">→</span>
                        <span>APROXIMAÇÃO</span>
                        <span aria-hidden="true">→</span>
                        <span>PERFIL DIGITAL</span>
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-4 space-y-3">
                    <p className="text-sm sm:text-base text-[#F4F4F1]/80 leading-relaxed">
                      {service.shortDescription}
                    </p>
                    <p className="font-mono-tabular text-xs text-[#F4F4F1]/50 leading-relaxed">
                      {service.capabilities.map((cap, idx) => (
                        <React.Fragment key={cap}>
                          <span>{cap}</span>
                          {idx < service.capabilities.length - 1 && (
                            <span aria-hidden="true" className="text-[#C6FF00] mx-2">
                              ·
                            </span>
                          )}
                        </React.Fragment>
                      ))}
                    </p>
                  </div>

                  <div className="lg:col-span-2 flex lg:justify-end pt-2 lg:pt-0">
                    <span className="inline-flex items-center gap-2 font-mono-tabular text-xs uppercase tracking-[0.12em] text-[#F4F4F1]/70 group-hover:text-[#C6FF00] transition-colors whitespace-nowrap">
                      <span>VER SERVIÇO</span>
                      <ArrowRight className="w-4 h-4 text-[#C6FF00] transition-transform duration-200 group-hover:translate-x-1.5" />
                    </span>
                  </div>
                </div>
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
