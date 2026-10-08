import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { AboutSection } from '../components/AboutSection';
import { WhatWeDoSection } from '../components/WhatWeDoSection';
import { ProcessSection } from '../components/ProcessSection';
import { ContactSection } from '../components/ContactSection';
import { VultoArchitecturalMonogram } from '../components/BrandLogo';

interface PageProps {
  onNavigate: (path: string) => void;
}

export const AboutPage: React.FC<PageProps> = ({ onNavigate }) => {
  return (
    <div className="bg-[#0A0A0A] text-[#F4F4F1]">
      {/* Hero Sobre */}
      <section className="pt-32 pb-20 sm:pt-40 sm:pb-28 border-b border-[#F4F4F1]/10">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="w-6 h-[1.5px] bg-[#C6FF00]" />
                <span className="font-mono-tabular text-xs uppercase tracking-[0.2em] text-[#C6FF00] font-semibold">
                  SOBRE A VULTO LAB
                </span>
              </div>

              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="font-display font-bold uppercase text-4xl sm:text-6xl lg:text-7xl leading-[0.96] tracking-[-0.04em] text-[#F4F4F1]"
              >
                DOIS AMIGOS.
                <br />
                UMA OPERAÇÃO.
                <br />
                DOIS MERCADOS<span className="text-[#C6FF00]">.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.1 }}
                className="mt-6 text-lg sm:text-xl text-[#F4F4F1]/85 max-w-2xl leading-relaxed"
              >
                A VULTO LAB nasceu há cerca de dois anos a partir da união de dois amigos com experiências complementares em estratégia, tecnologia, mídia e comunicação.
              </motion.p>
            </div>

            <div className="lg:col-span-4 flex justify-start lg:justify-end">
              <div className="p-6 border border-[#F4F4F1]/12 bg-[#1A1A1A]/30">
                <VultoArchitecturalMonogram
                  className="w-40 h-40 sm:w-48 sm:h-48"
                  strokeColor="rgba(244,244,241,0.2)"
                  showLimeSlit={true}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* História e Números */}
      <section className="py-20 sm:py-28 border-b border-[#F4F4F1]/10">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-6 space-y-6 text-base sm:text-lg text-[#F4F4F1]/80 leading-relaxed">
              <p className="text-[#F4F4F1] font-semibold text-xl">
                O que começou como execução de projetos digitais evoluiu para uma operação que hoje já trabalhou com mais de 30 empresas e projetos no Brasil e em Portugal.
              </p>
              <p>
                Nosso foco sempre foi o mesmo: construir estruturas que realmente façam sentido para o negócio.
              </p>
              <div className="p-6 border-l-2 border-[#C6FF00] bg-[#1A1A1A]/30 font-display font-bold text-lg uppercase text-[#F4F4F1] mt-6">
                "Não vendemos serviços isolados quando o problema exige uma estrutura."
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-8 border border-[#F4F4F1]/12 bg-[#1A1A1A]/30">
                <p className="font-display font-black text-4xl text-[#C6FF00] mb-2">2+</p>
                <p className="font-mono-tabular text-xs text-[#F4F4F1]/60 uppercase tracking-widest">
                  ANOS DE TRAJETÓRIA
                </p>
              </div>

              <div className="p-8 border border-[#F4F4F1]/12 bg-[#1A1A1A]/30">
                <p className="font-display font-black text-4xl text-[#C6FF00] mb-2">30+</p>
                <p className="font-mono-tabular text-xs text-[#F4F4F1]/60 uppercase tracking-widest">
                  EMPRESAS
                </p>
              </div>

              <div className="p-8 border border-[#F4F4F1]/12 bg-[#1A1A1A]/30">
                <p className="font-display font-black text-xl text-[#C6FF00] mb-2 mt-2">BR + PT</p>
                <p className="font-mono-tabular text-xs text-[#F4F4F1]/60 uppercase tracking-widest">
                  DOIS MERCADOS
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AboutSection onNavigate={onNavigate} showMoreLink={false} />
      <WhatWeDoSection />
      <ProcessSection />
      <ContactSection />
    </div>
  );
};
