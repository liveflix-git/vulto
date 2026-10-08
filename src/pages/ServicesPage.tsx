import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { SERVICES_DATA } from '../data/siteData';
import { ServicesEditorialList } from '../components/ServicesEditorialList';
import { ProcessSection } from '../components/ProcessSection';
import { NfcShowcaseSection } from '../components/NfcShowcaseSection';
import { ContactSection } from '../components/ContactSection';

interface ServicesPageProps {
  onNavigate: (path: string) => void;
}

export const ServicesPage: React.FC<ServicesPageProps> = ({ onNavigate }) => {
  return (
    <div className="bg-[#0A0A0A]">
      <section className="pt-32 pb-20 sm:pt-40 sm:pb-28 border-b border-[#F4F4F1]/10">
        <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-6 h-[1.5px] bg-[#C6FF00]" />
            <span className="font-mono-tabular text-xs uppercase tracking-[0.2em] text-[#C6FF00]">
              VULTO LAB · ARQUITETURA DE SERVIÇOS
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="lg:col-span-8 font-display font-bold uppercase text-4xl sm:text-6xl lg:text-7xl leading-[0.96] tracking-[-0.04em] text-[#F4F4F1]"
            >
              SOLUÇÕES PENSADAS
              <br />
              PARA CONVERTER<span className="text-[#C6FF00]">.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="lg:col-span-4 text-base sm:text-lg text-[#F4F4F1]/75 leading-relaxed"
            >
              Cinco frentes complementares desenhadas para operar como um ecossistema único de
              aquisição, mensagem e presença digital.
            </motion.p>
          </div>
        </div>
      </section>

      <ServicesEditorialList onNavigate={onNavigate} showHeader={false} />

      <section
        aria-label="Detalhamento dos serviços"
        className="py-20 sm:py-28 border-b border-[#F4F4F1]/10"
      >
        <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 space-y-20 sm:space-y-28">
          {SERVICES_DATA.map((service) => (
            <div
              key={service.id}
              className="border border-[#F4F4F1]/12 bg-[#1A1A1A]/25 p-7 sm:p-10 lg:p-14"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
                <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="font-mono-tabular text-sm text-[#C6FF00] font-semibold">
                        {service.number}
                      </span>
                      <span className="w-6 h-[1px] bg-[#C6FF00]" />
                      <span className="font-mono-tabular text-xs uppercase tracking-[0.16em] text-[#F4F4F1]/55">
                        FRENTE DE ATUAÇÃO
                      </span>
                    </div>

                    <h2 className="font-display font-bold uppercase text-3xl sm:text-4xl tracking-[-0.03em] text-[#F4F4F1] mb-4">
                      {service.title}
                    </h2>

                    <p className="text-sm sm:text-base text-[#F4F4F1]/80 leading-relaxed">
                      {service.extendedDescription}
                    </p>

                    {service.isNfcSpecial && (
                      <div className="mt-6 p-4 border border-[#C6FF00]/40 bg-[#0A0A0A] inline-flex flex-wrap items-center gap-3 font-mono-tabular text-xs uppercase tracking-[0.14em] text-[#F4F4F1]">
                        <span className="text-[#C6FF00] font-semibold">CARD</span>
                        <span>→</span>
                        <span className="text-[#C6FF00] font-semibold">APROXIMAÇÃO</span>
                        <span>→</span>
                        <span className="text-[#C6FF00] font-semibold">PERFIL DIGITAL</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 flex flex-wrap items-center gap-4">
                    <a
                      href={`/servicos/${service.slug}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate(`/servicos/${service.slug}`);
                      }}
                      data-cursor="cta"
                      className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-[#C6FF00] text-[#0A0A0A] text-xs font-bold uppercase tracking-[0.08em] hover:bg-[#d4ff33] transition-colors"
                    >
                      <span>EXPLORAR {service.title}</span>
                      <ArrowRight className="w-4 h-4" />
                    </a>

                    <a
                      href={`/contato?servico=${encodeURIComponent(service.dropdownLabel)}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate(`/contato?servico=${encodeURIComponent(service.dropdownLabel)}`);
                      }}
                      className="inline-flex items-center gap-2 px-5 py-3.5 border border-[#F4F4F1]/20 text-xs font-mono-tabular uppercase tracking-wider text-[#F4F4F1] hover:border-[#C6FF00] hover:text-[#C6FF00] transition-colors"
                    >
                      <span>SOLICITAR ESCOPO</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div className="lg:col-span-7 space-y-8 border-t lg:border-t-0 lg:border-l border-[#F4F4F1]/12 pt-8 lg:pt-0 lg:pl-12">
                  <div>
                    <h3 className="font-mono-tabular text-xs uppercase tracking-[0.18em] text-[#F4F4F1]/50 mb-4">
                      ESCOPO &amp; APLICAÇÕES
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono-tabular text-xs sm:text-sm text-[#F4F4F1]">
                      {service.capabilities.map((cap, i) => (
                        <React.Fragment key={cap}>
                          <span>{cap}</span>
                          {i < service.capabilities.length - 1 && (
                            <span aria-hidden="true" className="text-[#C6FF00]">
                              ·
                            </span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    {service.deliverables.map((deliv, i) => (
                      <div
                        key={deliv.title}
                        className="p-5 border border-[#F4F4F1]/10 bg-[#0A0A0A] flex flex-col justify-between"
                      >
                        <span className="font-mono-tabular text-[11px] text-[#C6FF00] mb-3 block">
                          0{i + 1}
                        </span>
                        <div>
                          <h4 className="font-display font-bold text-sm uppercase tracking-tight text-[#F4F4F1] mb-2">
                            {deliv.title}
                          </h4>
                          <p className="text-xs text-[#F4F4F1]/65 leading-relaxed">
                            {deliv.detail}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <NfcShowcaseSection onNavigate={onNavigate} />
      <ProcessSection />
      <ContactSection />
    </div>
  );
};
