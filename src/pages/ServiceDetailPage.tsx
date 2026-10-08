import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { SERVICES_DATA, ServiceItem } from '../data/siteData';
import { NfcShowcaseSection } from '../components/NfcShowcaseSection';
import { ContactSection } from '../components/ContactSection';

interface ServiceDetailPageProps {
  service: ServiceItem;
  onNavigate: (path: string) => void;
}

export const ServiceDetailPage: React.FC<ServiceDetailPageProps> = ({
  service,
  onNavigate,
}) => {
  const currentIndex = SERVICES_DATA.findIndex((s) => s.slug === service.slug);
  const prevService =
    currentIndex > 0
      ? SERVICES_DATA[currentIndex - 1]
      : SERVICES_DATA[SERVICES_DATA.length - 1];
  const nextService =
    currentIndex < SERVICES_DATA.length - 1
      ? SERVICES_DATA[currentIndex + 1]
      : SERVICES_DATA[0];

  const mappedContactService =
    service.dropdownLabel === 'Sites' ? 'Site' : service.dropdownLabel;

  return (
    <div className="bg-[#0A0A0A]">
      <section className="pt-32 pb-20 sm:pt-40 sm:pb-28 border-b border-[#F4F4F1]/10">
        <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-8 mb-10 border-b border-[#F4F4F1]/10">
            <a
              href="/servicos"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/servicos');
              }}
              className="inline-flex items-center gap-2 font-mono-tabular text-xs uppercase tracking-[0.16em] text-[#F4F4F1]/65 hover:text-[#C6FF00] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>VOLTAR PARA SERVIÇOS</span>
            </a>

            <div className="flex items-center gap-2 font-mono-tabular text-xs uppercase tracking-[0.18em] text-[#F4F4F1]/45">
              <span>VULTO LAB</span>
              <span className="text-[#C6FF00]">·</span>
              <span>SERVIÇO {service.number}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-end">
            <div className="lg:col-span-8">
              <span className="font-mono-tabular text-4xl sm:text-5xl text-[#C6FF00] font-light block mb-4">
                {service.number}
              </span>
              <motion.h1
                key={service.slug}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="font-display font-bold uppercase text-4xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-[-0.04em] text-[#F4F4F1]"
              >
                {service.title}
                <span className="text-[#C6FF00]">.</span>
              </motion.h1>

              {service.isNfcSpecial && (
                <div className="mt-6 inline-flex flex-wrap items-center gap-3 font-mono-tabular text-xs uppercase tracking-[0.16em] text-[#C6FF00]">
                  <span>CARD</span>
                  <span>→</span>
                  <span>APROXIMAÇÃO</span>
                  <span>→</span>
                  <span>PERFIL DIGITAL</span>
                </div>
              )}
            </div>

            <div className="lg:col-span-4 space-y-6">
              <p className="text-lg sm:text-xl text-[#F4F4F1] font-medium leading-snug">
                {service.shortDescription}
              </p>
              <a
                href="#contato"
                data-cursor="cta"
                className="inline-flex items-center gap-3 px-7 py-4 bg-[#C6FF00] text-[#0A0A0A] text-xs font-bold uppercase tracking-[0.08em] hover:bg-[#d4ff33] transition-colors whitespace-nowrap"
              >
                <span>SOLICITAR PROPOSTA</span>
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28 border-b border-[#F4F4F1]/10">
        <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-6 space-y-6">
              <div className="flex items-center gap-3">
                <span className="w-5 h-[1.5px] bg-[#C6FF00]" />
                <span className="font-mono-tabular text-xs uppercase tracking-[0.2em] text-[#F4F4F1]/60">
                  VISÃO ESTRATÉGICA
                </span>
              </div>
              <h2 className="font-display font-bold uppercase text-2xl sm:text-4xl tracking-[-0.03em] text-[#F4F4F1]">
                COMO OPERAMOS {service.title} NA VULTO LAB.
              </h2>
              <p className="text-base sm:text-lg text-[#F4F4F1]/75 leading-relaxed">
                {service.extendedDescription}
              </p>
            </div>

            <div className="lg:col-span-6 border border-[#F4F4F1]/12 bg-[#1A1A1A]/30 p-7 sm:p-10">
              <h3 className="font-mono-tabular text-xs uppercase tracking-[0.18em] text-[#C6FF00] mb-6">
                ITENS DE ESCOPO &amp; ESPECIALIDADES
              </h3>
              <ul className="divide-y divide-[#F4F4F1]/10">
                {service.capabilities.map((cap, idx) => (
                  <li
                    key={cap}
                    className="py-3.5 flex items-center justify-between text-sm sm:text-base text-[#F4F4F1]"
                  >
                    <span className="font-medium capitalize">{cap}</span>
                    <span className="font-mono-tabular text-xs text-[#F4F4F1]/40">
                      {service.number}.0{idx + 1}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-20">
            <div className="flex items-center gap-3 mb-8">
              <span className="w-5 h-[1.5px] bg-[#C6FF00]" />
              <span className="font-mono-tabular text-xs uppercase tracking-[0.2em] text-[#F4F4F1]/60">
                PILARES DE ENTREGA
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 border-t border-l border-[#F4F4F1]/12">
              {service.deliverables.map((deliv, i) => (
                <div
                  key={deliv.title}
                  className="p-7 sm:p-9 border-r border-b border-[#F4F4F1]/12 bg-[#0A0A0A] hover:bg-[#1A1A1A]/35 transition-colors flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-8">
                    <span className="font-mono-tabular text-xs text-[#C6FF00]">
                      PILAR 0{i + 1}
                    </span>
                    <span className="w-2 h-2 bg-[#C6FF00]" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold uppercase text-xl text-[#F4F4F1] mb-3">
                      {deliv.title}
                    </h3>
                    <p className="text-sm text-[#F4F4F1]/70 leading-relaxed">
                      {deliv.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-20 pt-16 border-t border-[#F4F4F1]/10">
            <div className="flex items-center gap-3 mb-10">
              <span className="w-5 h-[1.5px] bg-[#C6FF00]" />
              <span className="font-mono-tabular text-xs uppercase tracking-[0.2em] text-[#F4F4F1]/60">
                FLUXO DE IMPLEMENTAÇÃO
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {service.architectureSteps.map((stepItem) => (
                <div
                  key={stepItem.step}
                  className="p-7 border border-[#F4F4F1]/12 bg-[#1A1A1A]/20 relative"
                >
                  <span className="font-mono-tabular text-3xl text-[#F4F4F1]/25 block mb-4">
                    {stepItem.step}
                  </span>
                  <h4 className="font-display font-bold uppercase text-lg text-[#C6FF00] mb-2">
                    {stepItem.label}
                  </h4>
                  <p className="text-sm text-[#F4F4F1]/75 leading-relaxed">
                    {stepItem.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {service.slug === 'nfc-card' && <NfcShowcaseSection onNavigate={onNavigate} />}

      <section
        aria-label="Navegar entre outros serviços"
        className="border-b border-[#F4F4F1]/10 bg-[#1A1A1A]/20"
      >
        <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#F4F4F1]/10">
          <a
            href={`/servicos/${prevService.slug}`}
            onClick={(e) => {
              e.preventDefault();
              onNavigate(`/servicos/${prevService.slug}`);
            }}
            className="p-6 sm:p-8 flex items-center justify-between group hover:bg-[#1A1A1A]/60 transition-colors"
          >
            <div>
              <span className="font-mono-tabular text-[11px] uppercase tracking-widest text-[#F4F4F1]/45 block mb-1">
                ← SERVIÇO ANTERIOR
              </span>
              <span className="font-display font-bold uppercase text-lg sm:text-xl text-[#F4F4F1] group-hover:text-[#C6FF00] transition-colors">
                {prevService.number} · {prevService.title}
              </span>
            </div>
          </a>

          <a
            href={`/servicos/${nextService.slug}`}
            onClick={(e) => {
              e.preventDefault();
              onNavigate(`/servicos/${nextService.slug}`);
            }}
            className="p-6 sm:p-8 flex items-center justify-between text-right group hover:bg-[#1A1A1A]/60 transition-colors"
          >
            <div className="ml-auto">
              <span className="font-mono-tabular text-[11px] uppercase tracking-widest text-[#F4F4F1]/45 block mb-1">
                PRÓXIMO SERVIÇO →
              </span>
              <span className="font-display font-bold uppercase text-lg sm:text-xl text-[#F4F4F1] group-hover:text-[#C6FF00] transition-colors">
                {nextService.number} · {nextService.title}
              </span>
            </div>
            <ArrowRight className="w-5 h-5 text-[#C6FF00] ml-4 hidden sm:block group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </section>

      <ContactSection initialService={mappedContactService} />
    </div>
  );
};
