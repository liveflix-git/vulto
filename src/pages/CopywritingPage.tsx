import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { ContactSection } from '../components/ContactSection';
import { CREATOR_PARTNERS } from '../data/siteData';

interface PageProps {
  onNavigate: (path: string) => void;
}

export const CopywritingPage: React.FC<PageProps> = ({ onNavigate }) => {
  return (
    <div className="bg-[#0A0A0A] text-[#F4F4F1]">
      {/* Hero da Página */}
      <section className="pt-32 pb-20 sm:pt-40 sm:pb-28 border-b border-[#F4F4F1]/10">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-6 h-[1.5px] bg-[#C6FF00]" />
            <span className="font-mono-tabular text-xs uppercase tracking-[0.2em] text-[#C6FF00] font-semibold">
              COPYWRITING
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
                PALAVRAS TAMBÉM
                <br />
                SÃO INFRAESTRUTURA<span className="text-[#C6FF00]">.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.1 }}
                className="mt-6 text-lg sm:text-xl text-[#F4F4F1]/85 max-w-2xl leading-relaxed"
              >
                Mensagem, posicionamento e persuasão construídos para transformar atenção em ação.
              </motion.p>
            </div>

            <div className="lg:col-span-4 flex lg:justify-end">
              <a
                href="/contato?servico=Copywriting"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/contato?servico=Copywriting');
                }}
                data-cursor="cta"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#C6FF00] text-[#0A0A0A] text-xs font-bold uppercase tracking-[0.08em] hover:bg-[#d4ff33] transition-colors whitespace-nowrap"
              >
                <span>FORTALECER MINHA MENSAGEM</span>
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
                FILOSOFIA DE PERSUASÃO
              </span>
              <h2 className="font-display font-bold uppercase text-3xl sm:text-4xl tracking-[-0.03em] text-[#F4F4F1]">
                MENSAGENS QUE GERAM RESPOSTA<span className="text-[#C6FF00]">.</span>
              </h2>
            </div>

            <div className="lg:col-span-7 space-y-6 text-base sm:text-lg text-[#F4F4F1]/80 leading-relaxed">
              <p className="text-[#F4F4F1] font-semibold">
                Copywriting é uma das principais frentes da VULTO LAB.
              </p>
              <p>
                Criamos mensagens para anúncios, páginas, ofertas, roteiros, produtos e comunicação de marcas.
              </p>
              <p>
                Além de empresas de diferentes segmentos, já trabalhamos em projetos voltados para grandes canais do YouTube com audiências de milhões de pessoas.
              </p>
              <p className="border-l-2 border-[#C6FF00] pl-4 text-[#F4F4F1] font-semibold">
                Nossa função não é apenas escrever bem. É estruturar mensagens que sejam entendidas, lembradas e capazes de gerar resposta.
              </p>
            </div>
          </div>

          {/* Destaque Criadores */}
          <div className="mt-16 p-8 border border-[#F4F4F1]/12 bg-[#1A1A1A]/30">
            <span className="font-mono-tabular text-xs uppercase tracking-[0.2em] text-[#C6FF00] block mb-6">
              PROJETOS EM AUDIÊNCIAS MASSIVAS
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {CREATOR_PARTNERS.map((creator) => (
                <div key={creator.id} className="space-y-1">
                  <p className="font-display font-bold text-lg text-[#F4F4F1]">{creator.name}</p>
                  <p className="font-mono-tabular text-xs text-[#C6FF00]">{creator.subtext}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Aplicações */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-[#F4F4F1]/12">
            {[
              {
                title: 'ANÚNCIOS',
                desc: 'Copy para gerar atenção e ação.',
              },
              {
                title: 'LANDING PAGES',
                desc: 'Mensagem orientada à conversão.',
              },
              {
                title: 'OFERTAS',
                desc: 'Estruturação de valor, desejo e proposta.',
              },
              {
                title: 'ROTEIROS',
                desc: 'Conteúdo pensado para retenção e audiência.',
              },
              {
                title: 'TÍTULOS',
                desc: 'Ideias e headlines com alto poder de clique.',
              },
              {
                title: 'POSICIONAMENTO',
                desc: 'Comunicação que fortalece percepção de marca.',
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

      <ContactSection initialService="Copywriting" />
    </div>
  );
};
