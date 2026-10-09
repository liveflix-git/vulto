import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { VultoArchitecturalMonogram } from './BrandLogo';
import { useLanguage } from '../context/LanguageContext';

interface HeroSectionProps {
  onNavigate: (path: string) => void;
  currentLocale?: 'pt-BR' | 'pt-PT';
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onNavigate }) => {
  const { dict } = useLanguage();
  const heroData = dict.hero;
  const wordsToType = heroData.typedWords;
  const [typedLines, setTypedLines] = useState<string[]>(['', '', '']);
  const [isTypingDone, setIsTypingOpen] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);

  useEffect(() => {
    setTypedLines(['', '', '']);
    setIsTypingOpen(false);
    setCurrentLineIndex(0);
  }, [heroData.typedWords]);

  useEffect(() => {
    if (isTypingDone) return;

    if (currentLineIndex >= wordsToType.length) {
      setIsTypingOpen(true);
      return;
    }

    const targetWord = wordsToType[currentLineIndex];
    let currentCharIndex = 0;

    const interval = setInterval(() => {
      if (currentCharIndex <= targetWord.length) {
        const textSlice = targetWord.slice(0, currentCharIndex);
        setTypedLines((prev) => {
          const next = [...prev];
          next[currentLineIndex] = textSlice;
          return next;
        });
        currentCharIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setCurrentLineIndex((prev) => prev + 1);
        }, 180);
      }
    }, 55);

    return () => clearInterval(interval);
  }, [currentLineIndex, isTypingDone, wordsToType]);

  const handleNav = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    onNavigate(path);
  };

  return (
    <section
      aria-label="Apresentação VULTO LAB"
      className="relative min-h-[92vh] pt-24 pb-12 sm:pt-36 sm:pb-24 lg:pt-40 lg:pb-28 bg-[#0D0D0D] lg:bg-[#0A0A0A] border-b border-[#F4F4F1]/10 overflow-hidden flex flex-col justify-between"
    >
      {/* Subtle Mobile Glow & Texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 right-0 w-80 h-80 bg-[#C6FF00]/[0.04] blur-[70px] lg:hidden"
      />

      {/* Grade de fundo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12"
      >
        <div className="w-full h-full border-x border-[#F4F4F1]/[0.05] grid grid-cols-4 lg:grid-cols-12">
          <div className="hidden lg:block lg:col-span-7 border-r border-[#F4F4F1]/[0.05] h-full" />
          <div className="hidden lg:block lg:col-span-5 h-full" />
        </div>
      </div>

      {/* Subtle Glow Desktop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/4 right-[18%] w-[2px] h-[380px] bg-[#C6FF00]/40 blur-[28px] hidden lg:block"
      />

      <div className="relative z-10 max-w-[1440px] w-full mx-auto px-5 sm:px-8 lg:px-12 my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          <div className="lg:col-span-8">
            {/* Eyebrow — Apenas Kicker sem badge de idioma */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-2.5 mb-5 sm:mb-8"
            >
              <span className="w-6 h-[1.5px] bg-[#C6FF00] inline-block shrink-0" />
              <span className="font-mono-tabular text-[11px] sm:text-xs tracking-[0.2em] uppercase text-[#F4F4F1]/80 font-semibold">
                {heroData.kicker}
              </span>
            </motion.div>

            {/* Headline com Digitação Sofisticada e Largura Controlada no Mobile */}
            <h1 className="font-display font-black uppercase text-[clamp(40px,12.5vw,56px)] sm:text-6xl md:text-7xl lg:text-[5.25rem] leading-[0.92] lg:leading-[0.96] tracking-[-0.04em] text-[#F4F4F1] max-w-[320px] sm:max-w-none min-h-[3.1em]">
              <span className="block text-[#F4F4F1]">
                {typedLines[0]}
                {currentLineIndex === 0 && !isTypingDone && (
                  <span className="inline-block w-[3px] h-[0.8em] bg-[#C6FF00] ml-1 animate-pulse align-middle" />
                )}
              </span>
              <span className="block text-[#F4F4F1]/90">
                {typedLines[1]}
                {currentLineIndex === 1 && !isTypingDone && (
                  <span className="inline-block w-[3px] h-[0.8em] bg-[#C6FF00] ml-1 animate-pulse align-middle" />
                )}
              </span>
              <span className="inline-flex items-baseline text-[#F4F4F1]">
                {typedLines[2]}
                {currentLineIndex === 2 && !isTypingDone && (
                  <span className="inline-block w-[3px] h-[0.8em] bg-[#C6FF00] ml-1 animate-pulse align-middle" />
                )}
              </span>
            </h1>

            {/* Divisor Sofisticado e Curto no Mobile */}
            <div className="w-16 h-[1px] bg-[#F4F4F1]/20 lg:w-full lg:max-w-xl my-6 sm:my-8" />

            {/* Supporting Copy ABAIXO da headline */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-[300px] sm:max-w-xl space-y-2"
            >
              <p className="text-[15px] sm:text-lg text-[#D0D0D0] lg:text-[#F4F4F1]/85 font-normal leading-relaxed">
                {heroData.support}
              </p>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="mt-7 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4"
            >
              <a
                href="/contato"
                onClick={(e) => handleNav(e, '/contato')}
                data-cursor="cta"
                className="inline-flex items-center justify-center gap-3 px-7 py-4 bg-[#C6FF00] text-[#0A0A0A] text-xs sm:text-sm font-bold uppercase tracking-[0.08em] hover:bg-[#d4ff33] transition-colors duration-150 whitespace-nowrap"
              >
                <span>{heroData.ctaTalk}</span>
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              </a>

              <a
                href="/servicos"
                onClick={(e) => handleNav(e, '/servicos')}
                className="inline-flex items-center justify-center gap-3 px-7 py-4 border border-[#F4F4F1]/20 text-[#F4F4F1] text-xs sm:text-sm font-semibold uppercase tracking-[0.08em] hover:border-[#C6FF00] hover:text-[#C6FF00] transition-colors duration-150 whitespace-nowrap"
              >
                <span>{heroData.ctaSolutions}</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </motion.div>
          </div>

          {/* Coluna Direita: Monograma Oficial Integrado */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-4 flex flex-col items-center lg:items-end justify-center"
          >
            <div className="relative w-full max-w-[340px] aspect-square border border-[#F4F4F1]/12 bg-[#1A1A1A]/35 p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] font-mono-tabular uppercase tracking-widest text-[#F4F4F1]/45">
                <span>VULTO LAB</span>
                <span>DIGITAL BUSINESS</span>
              </div>

              <div className="relative my-auto flex items-center justify-center py-4">
                <VultoArchitecturalMonogram
                  className="w-48 h-48 sm:w-56 sm:h-56"
                  strokeColor="rgba(244,244,241,0.18)"
                  showLimeSlit={true}
                />
              </div>

              <div className="pt-3 border-t border-[#F4F4F1]/10 flex items-center justify-between text-[11px] font-mono-tabular text-[#F4F4F1]/55">
                <span>ESTRATÉGIA</span>
                <span aria-hidden="true" className="text-[#C6FF00]">·</span>
                <span>CONVERSÃO</span>
                <span aria-hidden="true" className="text-[#C6FF00]">·</span>
                <span>TECNOLOGIA</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="relative z-10 max-w-[1440px] w-full mx-auto px-5 sm:px-8 lg:px-12 pt-8 sm:pt-12">
        {/* Versão Mobile em 2 Colunas */}
        <div className="lg:hidden grid grid-cols-2 gap-y-2.5 gap-x-4 max-w-[340px] text-[10px] font-mono-tabular uppercase tracking-[0.16em] text-[#C6FF00] font-semibold">
          <span>PAID MEDIA</span>
          <span>SITES &amp; SISTEMAS</span>
          <span>COPYWRITING</span>
          <span>VULTO TAP</span>
          <span className="col-span-2">INTELIGÊNCIA ARTIFICIAL</span>
        </div>

        {/* Versão Desktop */}
        <div className="hidden lg:flex flex-wrap items-center justify-between gap-4 text-xs font-mono-tabular text-[#F4F4F1]/45 uppercase tracking-widest">
          <span>PAID MEDIA · SITES &amp; SISTEMAS · COPY · VULTO TAP · IA</span>
          <span>ESTRUTURA DE PERFORMANCE</span>
        </div>
      </div>
    </section>
  );
};
