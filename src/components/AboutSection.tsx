import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { ABOUT_CONCEPTS } from '../data/siteData';
import { VultoArchitecturalMonogram } from './BrandLogo';

interface AboutSectionProps {
  onNavigate?: (path: string) => void;
  showMoreLink?: boolean;
}

export const AboutSection: React.FC<AboutSectionProps> = ({
  onNavigate,
  showMoreLink = true,
}) => {
  return (
    <section
      aria-labelledby="about-vulto-heading"
      className="bg-[#0A0A0A] border-b border-[#F4F4F1]/10 py-20 sm:py-28 lg:py-32 relative overflow-hidden"
    >
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-6 space-y-8">
            <div className="flex items-center gap-3">
              <span className="w-5 h-[1.5px] bg-[#C6FF00]" />
              <span className="font-mono-tabular text-xs uppercase tracking-[0.22em] text-[#C6FF00]">
                VULTO LAB
              </span>
            </div>

            <motion.h2
              id="about-vulto-heading"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45 }}
              className="font-display font-bold uppercase text-3xl sm:text-5xl lg:text-6xl leading-[0.98] tracking-[-0.035em] text-[#F4F4F1]"
            >
              ESTRATÉGIA ANTES
              <br />
              DE EXECUÇÃO<span className="text-[#C6FF00]">.</span>
            </motion.h2>

            <div className="pt-4 hidden lg:flex items-center gap-6 border-t border-[#F4F4F1]/10">
              <VultoArchitecturalMonogram
                className="w-24 h-24 shrink-0"
                strokeColor="rgba(244,244,241,0.22)"
                showLimeSlit={true}
              />
              <div className="space-y-1.5">
                <p className="font-mono-tabular text-xs uppercase tracking-[0.16em] text-[#F4F4F1]/75">
                  LABORATÓRIO DE ESTRUTURA DIGITAL
                </p>
                <p className="text-xs text-[#F4F4F1]/50 max-w-xs leading-relaxed">
                  Projetos desenhados sob medida na interseção entre aquisição, mensagem e
                  engenharia web.
                </p>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="lg:col-span-6 space-y-6"
          >
            <div className="space-y-5 text-base sm:text-lg text-[#F4F4F1]/80 leading-relaxed">
              <p className="text-[#F4F4F1] font-medium text-lg sm:text-xl">
                A Vulto Lab nasce da interseção entre estratégia, comunicação e tecnologia.
              </p>
              <p>
                Criamos estruturas digitais pensadas para atrair atenção, construir percepção e
                transformar interesse em oportunidade.
              </p>
              <p className="border-l-2 border-[#C6FF00] pl-4 text-[#F4F4F1] font-medium">
                Não vendemos soluções genéricas.
              </p>
              <p>
                Cada projeto começa entendendo o negócio, o mercado e o objetivo.
              </p>
            </div>

            {showMoreLink && onNavigate && (
              <div className="pt-3">
                <a
                  href="/sobre"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('/sobre');
                  }}
                  className="inline-flex items-center gap-2 font-mono-tabular text-xs uppercase tracking-[0.16em] text-[#C6FF00] hover:underline underline-offset-4 whitespace-nowrap"
                >
                  <span>CONHECER A FILOSOFIA DA VULTO</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </motion.div>
        </div>

        <div className="mt-16 sm:mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-l border-[#F4F4F1]/12">
          {ABOUT_CONCEPTS.map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.35, delay: idx * 0.06 }}
              className="p-6 sm:p-8 border-r border-b border-[#F4F4F1]/12 bg-[#0A0A0A] hover:bg-[#1A1A1A]/40 transition-colors group"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="font-mono-tabular text-xs text-[#C6FF00]">
                  {item.index}
                </span>
                <span className="w-2 h-2 bg-[#F4F4F1]/20 group-hover:bg-[#C6FF00] transition-colors" />
              </div>
              <h3 className="font-display font-bold uppercase text-lg sm:text-xl tracking-[-0.02em] text-[#F4F4F1] mb-2.5">
                {item.title}
              </h3>
              <p className="text-xs sm:text-sm text-[#F4F4F1]/65 leading-relaxed">
                {item.detail}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
