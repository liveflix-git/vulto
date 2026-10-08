import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { ContactSection } from '../components/ContactSection';

interface PageProps {
  onNavigate: (path: string) => void;
}

export const SitesSistemasPage: React.FC<PageProps> = ({ onNavigate }) => {
  return (
    <div className="bg-[#0A0A0A] text-[#F4F4F1]">
      {/* Hero da Página */}
      <section className="pt-32 pb-20 sm:pt-40 sm:pb-28 border-b border-[#F4F4F1]/10">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-6 h-[1.5px] bg-[#C6FF00]" />
            <span className="font-mono-tabular text-xs uppercase tracking-[0.2em] text-[#C6FF00] font-semibold">
              DIGITAL SYSTEMS
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
                INFRAESTRUTURA DIGITAL
                <br />
                PARA EMPRESAS QUE QUEREM CRESCER<span className="text-[#C6FF00]">.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.1 }}
                className="mt-6 text-lg sm:text-xl text-[#F4F4F1]/85 max-w-2xl leading-relaxed"
              >
                Sites, landing pages, sistemas, integrações e automações construídos para operar, converter e escalar.
              </motion.p>
            </div>

            <div className="lg:col-span-4 flex lg:justify-end">
              <a
                href="/contato?servico=Sites+%26+Sistemas"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/contato?servico=Sites+%26+Sistemas');
                }}
                data-cursor="cta"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#C6FF00] text-[#0A0A0A] text-xs font-bold uppercase tracking-[0.08em] hover:bg-[#d4ff33] transition-colors whitespace-nowrap"
              >
                <span>CONSTRUIR MINHA ESTRUTURA DIGITAL</span>
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
                ENGENHARIA WEB &amp; SISTEMAS
              </span>
              <h2 className="font-display font-bold uppercase text-3xl sm:text-4xl tracking-[-0.03em] text-[#F4F4F1]">
                DESENVOLVIMENTO PENSADO PARA NEGÓCIO<span className="text-[#C6FF00]">.</span>
              </h2>
            </div>

            <div className="lg:col-span-7 space-y-6 text-base sm:text-lg text-[#F4F4F1]/80 leading-relaxed">
              <p className="text-[#F4F4F1] font-semibold">
                Criamos soluções digitais utilizando tecnologias atuais, arquitetura organizada e experiências pensadas para negócio.
              </p>
              <p>
                Nosso time de desenvolvimento trabalha com foco em performance, experiência, velocidade e integração.
              </p>
              <p className="border-l-2 border-[#C6FF00] pl-4 text-[#F4F4F1] font-semibold">
                Nosso diferencial está na capacidade de entregar estruturas sofisticadas com excelente relação entre investimento, prazo e qualidade.
              </p>
            </div>
          </div>

          {/* Serviços */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-[#F4F4F1]/12">
            {[
              {
                title: 'SITES',
                desc: 'Sites institucionais modernos, responsivos e orientados à percepção de valor.',
              },
              {
                title: 'LANDING PAGES',
                desc: 'Páginas criadas para campanhas e conversão.',
              },
              {
                title: 'SISTEMAS',
                desc: 'Aplicações web e soluções personalizadas.',
              },
              {
                title: 'AUTOMAÇÕES',
                desc: 'Processos que eliminam tarefas repetitivas.',
              },
              {
                title: 'INTEGRAÇÕES',
                desc: 'APIs, CRMs, analytics e ferramentas externas.',
              },
              {
                title: 'ECOSSISTEMAS',
                desc: 'Múltiplas soluções trabalhando como uma única estrutura.',
              },
            ].map((block, idx) => (
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

      {/* Seção VELOCIDADE & INVESTIMENTO */}
      <section className="py-20 sm:py-28 border-b border-[#F4F4F1]/10 bg-[#1A1A1A]/20">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 sm:p-12 border border-[#F4F4F1]/12 bg-[#0A0A0A]">
            <span className="font-mono-tabular text-xs uppercase tracking-[0.2em] text-[#C6FF00] block mb-4">
              EFICIÊNCIA TÉCNICA
            </span>
            <h3 className="font-display font-bold uppercase text-2xl sm:text-3xl text-[#F4F4F1] mb-4">
              VELOCIDADE SEM IMPROVISO
            </h3>
            <p className="text-sm sm:text-base text-[#F4F4F1]/75 leading-relaxed">
              Processos bem definidos e tecnologia atual permitem reduzir prazos sem comprometer a qualidade.
            </p>
          </div>

          <div className="p-8 sm:p-12 border border-[#F4F4F1]/12 bg-[#0A0A0A]">
            <span className="font-mono-tabular text-xs uppercase tracking-[0.2em] text-[#C6FF00] block mb-4">
              ALTIDADE DE IMPACTO
            </span>
            <h3 className="font-display font-bold uppercase text-2xl sm:text-3xl text-[#F4F4F1] mb-4">
              INVESTIMENTO INTELIGENTE
            </h3>
            <p className="text-sm sm:text-base text-[#F4F4F1]/75 leading-relaxed">
              Operação enxuta e desenvolvimento eficiente permitem entregar soluções robustas com excelente custo-benefício.
            </p>
          </div>
        </div>
      </section>

      <ContactSection initialService="Sites & Sistemas" />
    </div>
  );
};
