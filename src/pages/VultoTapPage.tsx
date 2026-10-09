import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { ContactSection } from '../components/ContactSection';
import { NfcShowcaseSection } from '../components/NfcShowcaseSection';
import { useLanguage } from '../context/LanguageContext';

interface PageProps {
  onNavigate: (path: string) => void;
}

export const VultoTapPage: React.FC<PageProps> = ({ onNavigate }) => {
  const { dict } = useLanguage();
  const page = dict.pages.vultoTap;

  return (
    <div className="bg-[#0A0A0A] text-[#F4F4F1]">
      {/* Hero da Página */}
      <section className="pt-32 pb-20 sm:pt-40 sm:pb-28 border-b border-[#F4F4F1]/10">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-6 h-[1.5px] bg-[#C6FF00]" />
            <span className="font-mono-tabular text-xs uppercase tracking-[0.2em] text-[#C6FF00] font-semibold">
              {page.kicker}
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
                {page.heroTitle1}
                <br />
                {page.heroTitle2}<span className="text-[#C6FF00]">.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.1 }}
                className="mt-6 text-lg sm:text-xl text-[#F4F4F1]/85 max-w-2xl leading-relaxed"
              >
                {page.heroSubtitle}
              </motion.p>
            </div>

            <div className="lg:col-span-4 flex lg:justify-end">
              <a
                href="/contato?servico=VULTO+TAP"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/contato?servico=VULTO+TAP');
                }}
                data-cursor="cta"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#C6FF00] text-[#0A0A0A] text-xs font-bold uppercase tracking-[0.08em] hover:bg-[#d4ff33] transition-colors whitespace-nowrap"
              >
                <span>{page.heroCta}</span>
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Texto Institucional */}
      <section className="py-20 sm:py-28 border-b border-[#F4F4F1]/10">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-5">
              <span className="font-mono-tabular text-xs uppercase tracking-[0.2em] text-[#F4F4F1]/45 block mb-4">
                {page.visionKicker}
              </span>
              <h2 className="font-display font-bold uppercase text-3xl sm:text-4xl tracking-[-0.03em] text-[#F4F4F1]">
                {page.visionTitle}<span className="text-[#C6FF00]">.</span>
              </h2>
            </div>

            <div className="lg:col-span-7 space-y-6 text-base sm:text-lg text-[#F4F4F1]/80 leading-relaxed">
              <p className="text-[#F4F4F1] font-semibold">
                {page.p1}
              </p>
              <p>
                {page.p2}
              </p>
            </div>
          </div>

          {/* Funcionalidades */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-t border-l border-[#F4F4F1]/12">
            {page.capabilities.map((block, idx) => (
              <div
                key={block.title}
                className="p-8 border-r border-b border-[#F4F4F1]/12 bg-[#0A0A0A] hover:bg-[#1A1A1A]/40 transition-colors"
              >
                <span className="font-mono-tabular text-xs text-[#C6FF00] block mb-4">
                  0{idx + 1}
                </span>
                <h3 className="font-display font-bold uppercase text-lg text-[#F4F4F1] mb-2">
                  {block.title}
                </h3>
                <p className="text-sm text-[#F4F4F1]/65 leading-relaxed">{block.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fluxo Visual: APROXIME -> LEITURA NFC -> AÇÃO INSTANTÂNEA */}
      <section className="py-20 sm:py-28 border-b border-[#F4F4F1]/10 bg-[#1A1A1A]/20">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="font-mono-tabular text-xs uppercase tracking-[0.2em] text-[#C6FF00] block mb-3">
              COMO FUNCIONA
            </span>
            <h2 className="font-display font-bold uppercase text-3xl sm:text-4xl text-[#F4F4F1]">
              FLUXO VULTO TAP<span className="text-[#C6FF00]">.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'APROXIME', desc: 'O cliente aproxima qualquer smartphone do dispositivo VULTO TAP.' },
              { step: '02', title: 'LEITURA NFC', desc: 'A leitura ocorre em milissegundos sem necessidade de baixar aplicativos.' },
              { step: '03', title: 'AÇÃO INSTANTÂNEA', desc: 'Abre imediatamente a avaliação, Wi-Fi, WhatsApp ou perfil configurado.' },
            ].map((item) => (
              <div key={item.step} className="p-8 border border-[#F4F4F1]/12 bg-[#0A0A0A] text-center">
                <span className="font-mono-tabular text-2xl text-[#C6FF00] block mb-3">{item.step}</span>
                <h3 className="font-display font-bold uppercase text-xl text-[#F4F4F1] mb-2">{item.title}</h3>
                <p className="text-sm text-[#F4F4F1]/70 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <NfcShowcaseSection onNavigate={onNavigate} showSpecsButton={false} />
      <ContactSection initialService="VULTO TAP (NFC)" />
    </div>
  );
};
