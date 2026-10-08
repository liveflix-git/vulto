import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, Wifi } from 'lucide-react';
import { NFC_FEATURES } from '../data/siteData';
import { BrandLogo } from './BrandLogo';

interface NfcShowcaseSectionProps {
  onNavigate: (path: string) => void;
}

export const NfcShowcaseSection: React.FC<NfcShowcaseSectionProps> = ({ onNavigate }) => {
  const [selectedFeature, setSelectedFeature] = useState(NFC_FEATURES[0]);

  return (
    <section
      aria-labelledby="nfc-showcase-heading"
      className="bg-[#F4F4F1] text-[#0A0A0A] border-b border-[#0A0A0A]/15 py-20 sm:py-28 lg:py-36 relative overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12"
      >
        <div className="w-full h-full border-x border-[#0A0A0A]/[0.06]" />
      </div>

      <div className="relative z-10 max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-8 mb-12 sm:mb-16 border-b border-[#0A0A0A]/15">
          <div className="flex items-center gap-3">
            <span className="w-5 h-[2px] bg-[#0A0A0A]" />
            <span className="font-mono-tabular text-xs uppercase tracking-[0.2em] text-[#0A0A0A]/70 font-medium">
              04 · VULTO NFC CARD
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono-tabular text-xs uppercase tracking-[0.14em] text-[#0A0A0A]">
            <span className="font-semibold">CARD</span>
            <span aria-hidden="true" className="text-[#0A0A0A]/40">
              →
            </span>
            <span className="font-semibold">APROXIMAÇÃO</span>
            <span aria-hidden="true" className="text-[#0A0A0A]/40">
              →
            </span>
            <span className="bg-[#C6FF00] px-2 py-0.5 font-bold text-[#0A0A0A]">
              PERFIL DIGITAL
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-6 space-y-8">
            <motion.h2
              id="nfc-showcase-heading"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45 }}
              className="font-display font-bold uppercase text-4xl sm:text-5xl lg:text-6xl leading-[0.96] tracking-[-0.04em] text-[#0A0A0A]"
            >
              SEU CONTATO.
              <br />
              EM UM TOQUE<span className="inline-block w-3 h-3 bg-[#C6FF00] ml-1.5 align-baseline" />
            </motion.h2>

            <p className="text-base sm:text-lg text-[#0A0A0A]/85 leading-relaxed max-w-xl">
              Desenvolvemos cartões físicos NFC personalizados para conectar sua marca ao digital
              com rapidez, praticidade e presença. Cada cartão pode ser configurado para uma função
              específica, como avaliações no Google, redirecionamento para WhatsApp, conexão ao
              Wi-Fi, páginas institucionais ou outras experiências digitais.
            </p>

            <div className="pt-2">
              <p className="font-mono-tabular text-[11px] uppercase tracking-[0.18em] text-[#0A0A0A]/50 mb-4">
                CONEXÕES DISPONÍVEIS NO PERFIL DIGITAL (CLIQUE PARA VISUALIZAR):
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {NFC_FEATURES.map((feat, idx) => {
                  const isSelected = selectedFeature.id === feat.id;
                  return (
                    <button
                      key={feat.id}
                      type="button"
                      onClick={() => setSelectedFeature(feat)}
                      onMouseEnter={() => setSelectedFeature(feat)}
                      className={`text-left px-4 py-3 border transition-all duration-150 flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#0A0A0A] text-[#F4F4F1] border-[#0A0A0A]'
                          : 'bg-transparent text-[#0A0A0A] border-[#0A0A0A]/15 hover:border-[#0A0A0A]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`font-mono-tabular text-xs ${
                            isSelected ? 'text-[#C6FF00]' : 'text-[#0A0A0A]/45'
                          }`}
                        >
                          0{idx + 1}
                        </span>
                        <span className="text-sm font-semibold tracking-tight">
                          {feat.label}
                        </span>
                      </div>
                      <span
                        className={`w-2 h-2 ${
                          isSelected ? 'bg-[#C6FF00]' : 'bg-[#0A0A0A]/20'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <a
                href="/contato?servico=NFC+Card"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/contato?servico=NFC+Card');
                }}
                data-cursor="cta"
                className="inline-flex items-center justify-center gap-3 px-7 py-4 bg-[#0A0A0A] text-[#F4F4F1] text-xs sm:text-sm font-bold uppercase tracking-[0.08em] hover:bg-[#1A1A1A] transition-colors whitespace-nowrap group"
              >
                <span>QUERO MEU NFC CARD</span>
                <span className="w-5 h-5 bg-[#C6FF00] text-[#0A0A0A] inline-flex items-center justify-center">
                  <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </span>
              </a>

              <a
                href="/servicos/nfc-card"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/servicos/nfc-card');
                }}
                className="inline-flex items-center justify-center gap-2 px-6 py-4 border border-[#0A0A0A]/20 text-[#0A0A0A] text-xs font-mono-tabular uppercase tracking-[0.12em] hover:border-[#0A0A0A] transition-colors whitespace-nowrap"
              >
                <span>ESPECIFICAÇÕES DO CARTÃO</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-col items-center justify-center">
            <div className="relative w-full max-w-[540px] p-6 sm:p-8 border border-[#0A0A0A]/15 bg-[#EAEAE5]/80 shadow-xl">
              {/* Badge do Exemplo Real */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-6 border-b border-[#0A0A0A]/15">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#0A0A0A] animate-pulse" />
                  <span className="font-mono-tabular text-[11px] font-bold uppercase tracking-[0.16em] text-[#0A0A0A]">
                    EXEMPLO DE CARTÃO FÍSICO NFC
                  </span>
                </div>
                <span className="font-mono-tabular text-[10px] uppercase tracking-wider px-2 py-0.5 bg-[#C6FF00] text-[#0A0A0A] font-bold">
                  MODELO VULTO TAP
                </span>
              </div>

              {/* Imagem do Cartão Físico NFC Real */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.25 }}
                className="relative w-full max-w-[440px] mx-auto overflow-hidden rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.22)] border border-[#0A0A0A]/10 bg-white p-2"
              >
                <img
                  src="/vulto-nfc-google-card.svg"
                  alt="Exemplo de Cartão Físico NFC Personalizado Vulto TAP - Avaliações no Google"
                  className="w-full h-auto aspect-square object-contain rounded-xl block"
                />
              </motion.div>

              {/* Legenda e Contexto da Imagem */}
              <div className="mt-6 space-y-2 text-center sm:text-left">
                <p className="text-xs sm:text-sm font-medium text-[#0A0A0A] leading-relaxed">
                  Um exemplo de como os cartões físicos NFC da VULTO LAB podem ser personalizados para conectar marcas ao digital.
                </p>
                <p className="text-[11px] sm:text-xs text-[#0A0A0A]/65 leading-relaxed">
                  Esse formato pode ser configurado para avaliações no Google, WhatsApp, Wi-Fi, contatos, cardápios ou páginas personalizadas.
                </p>
              </div>

              {/* Barra do Módulo Selecionado */}
              <div className="mt-6 pt-4 border-t border-[#0A0A0A]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F4F4F1] p-3.5 border">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono-tabular text-[10px] uppercase tracking-wider text-[#0A0A0A]/60">
                      MÓDULO DEMO: {selectedFeature.label.toUpperCase()}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs font-semibold text-[#0A0A0A]">
                    {selectedFeature.previewText}
                  </p>
                </div>
                <span className="font-mono-tabular text-[10px] uppercase tracking-wider px-2.5 py-1 bg-[#0A0A0A] text-[#F4F4F1] font-bold self-start sm:self-center shrink-0">
                  CONFIGURÁVEL
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
