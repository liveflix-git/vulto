import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, ChevronDown, X } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { BrazilFlag, PortugalFlag } from './FlagIcons';
import { BRAND_CONFIG, getWhatsAppLink } from '../data/siteData';

interface OverlayMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
  onNavigate: (path: string) => void;
  currentLocale: 'pt-BR' | 'pt-PT';
  onLocaleChange: (locale: 'pt-BR' | 'pt-PT') => void;
}

const MAIN_NAV_ITEMS = [
  { label: 'INÍCIO', path: '/' },
  { label: 'CASES', path: '/cases' },
  { label: 'SOBRE', path: '/sobre' },
  { label: 'CONTATO', path: '/contato' },
];

const SERVICE_MENU_ITEMS = [
  {
    number: '01',
    title: 'PAID MEDIA',
    desc: 'Campanhas, tracking e performance.',
    path: '/paid-media',
  },
  {
    number: '02',
    title: 'SITES & SISTEMAS',
    desc: 'Sites, landing pages, sistemas e automações.',
    path: '/sites-sistemas',
  },
  {
    number: '03',
    title: 'COPYWRITING',
    desc: 'Anúncios, páginas, ofertas e posicionamento.',
    path: '/copywriting',
  },
  {
    number: '04',
    title: 'VULTO TAP',
    desc: 'NFC e experiências físicas conectadas ao digital.',
    path: '/vulto-tap',
  },
  {
    number: '05',
    title: 'INTELIGÊNCIA ARTIFICIAL',
    desc: 'Atendimento, qualificação e automações.',
    path: '/inteligencia-artificial',
  },
];

export const OverlayMenu: React.FC<OverlayMenuProps> = ({
  isOpen,
  onClose,
  currentPath,
  onNavigate,
  currentLocale,
  onLocaleChange,
}) => {
  const [localeDropdownOpen, setLocaleDropdownOpen] = useState(false);
  const localeRef = useRef<HTMLDivElement | null>(null);

  // Travar o scroll do body quando o menu estiver aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Fechar dropdown de idioma ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (localeRef.current && !localeRef.current.contains(e.target as Node)) {
        setLocaleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLinkClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    onClose();
    onNavigate(path);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 h-[100dvh] w-[100vw] bg-[#0A0A0A] text-[#F4F4F1] overflow-y-auto overscroll-contain flex flex-col justify-between"
        >
          {/* 1. Header do Menu Fullscreen */}
          <div className="shrink-0 max-w-[1440px] w-full mx-auto px-6 sm:px-8 lg:px-12 h-20 flex items-center justify-between border-b border-[#F4F4F1]/10">
            <a
              href="/"
              onClick={(e) => handleLinkClick(e, '/')}
              className="focus-visible:outline-none"
            >
              <BrandLogo variant="light" size="md" />
            </a>

            <div className="flex items-center gap-4 sm:gap-6">
              {/* Seletor Único de Idioma no topo do menu */}
              <div ref={localeRef} className="relative">
                <button
                  type="button"
                  onClick={() => setLocaleDropdownOpen((prev) => !prev)}
                  aria-expanded={localeDropdownOpen}
                  aria-label="Selecionar idioma"
                  className="px-3 py-1.5 border border-[#2A2A2A] hover:border-[#C6FF00] bg-[#0A0A0A] text-[#F4F4F1] font-mono-tabular text-xs uppercase tracking-wider inline-flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    {currentLocale === 'pt-BR' ? (
                      <>
                        <BrazilFlag className="w-4.5 h-3" />
                        <span>BR</span>
                      </>
                    ) : (
                      <>
                        <PortugalFlag className="w-4.5 h-3" />
                        <span>PT</span>
                      </>
                    )}
                  </span>
                  <ChevronDown
                    className={`w-3 h-3 text-[#F4F4F1]/60 transition-transform duration-200 ${
                      localeDropdownOpen ? 'rotate-180 text-[#C6FF00]' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {localeDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 top-full pt-2 w-36 z-50"
                    >
                      <div className="bg-[#0A0A0A] border border-[#2A2A2A] shadow-2xl overflow-hidden p-1">
                        <button
                          type="button"
                          onClick={() => {
                            onLocaleChange('pt-BR');
                            setLocaleDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left font-mono-tabular text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            currentLocale === 'pt-BR'
                              ? 'bg-[#C6FF00] text-[#0A0A0A] font-bold'
                              : 'text-[#F4F4F1] hover:bg-[#1A1A1A]'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <BrazilFlag className="w-4.5 h-3" />
                            <span>Brasil</span>
                          </span>
                          {currentLocale === 'pt-BR' && <span>✓</span>}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onLocaleChange('pt-PT');
                            setLocaleDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left font-mono-tabular text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            currentLocale === 'pt-PT'
                              ? 'bg-[#C6FF00] text-[#0A0A0A] font-bold'
                              : 'text-[#F4F4F1] hover:bg-[#1A1A1A]'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <PortugalFlag className="w-4.5 h-3" />
                            <span>Portugal</span>
                          </span>
                          {currentLocale === 'pt-PT' && <span>✓</span>}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Botão de Fechar [X] */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar menu"
                className="w-11 h-11 inline-flex items-center justify-center border border-[#2A2A2A] hover:border-[#C6FF00] text-[#F4F4F1] hover:text-[#C6FF00] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 2. Conteúdo do Menu (Duas Colunas em Desktop) */}
          <div className="flex-1 max-w-[1440px] w-full mx-auto px-6 sm:px-8 lg:px-12 py-10 sm:py-16 my-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
              {/* Coluna Esquerda: Navegação Principal */}
              <div className="lg:col-span-5 flex flex-col space-y-2">
                <span className="font-mono-tabular text-xs text-[#C6FF00] uppercase tracking-[0.2em] mb-4 block">
                  NAVEGAÇÃO
                </span>
                <nav aria-label="Menu Principal Overlay" className="divide-y divide-[#F4F4F1]/10">
                  {MAIN_NAV_ITEMS.map((item) => {
                    const isActive = currentPath === item.path;
                    return (
                      <a
                        key={item.path}
                        href={item.path}
                        onClick={(e) => handleLinkClick(e, item.path)}
                        className="group py-4 sm:py-5 flex items-center justify-between transition-colors duration-200"
                      >
                        <span
                          className={`font-display font-bold uppercase text-3xl sm:text-5xl lg:text-5xl tracking-tight transition-all duration-200 ${
                            isActive
                              ? 'text-[#C6FF00]'
                              : 'text-[#F4F4F1] group-hover:text-[#C6FF00] group-hover:translate-x-1.5'
                          }`}
                        >
                          {item.label}
                        </span>
                        <ArrowUpRight
                          className={`w-6 h-6 transition-all duration-200 ${
                            isActive
                              ? 'text-[#C6FF00] opacity-100'
                              : 'text-[#F4F4F1]/30 opacity-0 group-hover:opacity-100 group-hover:text-[#C6FF00] group-hover:translate-x-1 group-hover:-translate-y-1'
                          }`}
                        />
                      </a>
                    );
                  })}
                </nav>
              </div>

              {/* Coluna Direita: Serviços & Rotas Diretas */}
              <div className="lg:col-span-7 border-t lg:border-t-0 lg:border-l border-[#F4F4F1]/10 pt-10 lg:pt-0 lg:pl-16">
                <div className="mb-6">
                  <h2 className="font-display font-bold text-xl uppercase tracking-wider text-[#C6FF00]">
                    SERVIÇOS
                  </h2>
                  <p className="font-mono-tabular text-xs text-[#F4F4F1]/50 uppercase tracking-widest mt-1">
                    ESTRUTURAS PARA AQUISIÇÃO, CONVERSÃO &amp; TECNOLOGIA
                  </p>
                </div>

                <div className="divide-y divide-[#F4F4F1]/10">
                  {SERVICE_MENU_ITEMS.map((srv) => {
                    const isActive = currentPath === srv.path;
                    return (
                      <a
                        key={srv.path}
                        href={srv.path}
                        onClick={(e) => handleLinkClick(e, srv.path)}
                        className="group py-4 sm:py-5 block transition-colors duration-200"
                      >
                        <div className="flex items-baseline justify-between">
                          <div className="flex items-baseline gap-3">
                            <span className="font-mono-tabular text-xs text-[#C6FF00] font-semibold">
                              {srv.number}
                            </span>
                            <span
                              className={`font-display font-bold text-lg sm:text-2xl uppercase tracking-tight transition-colors duration-200 ${
                                isActive
                                  ? 'text-[#C6FF00]'
                                  : 'text-[#F4F4F1] group-hover:text-[#C6FF00]'
                              }`}
                            >
                              {srv.title}
                            </span>
                          </div>
                          <ArrowUpRight
                            className={`w-4 h-4 transition-all duration-200 ${
                              isActive
                                ? 'text-[#C6FF00] opacity-100'
                                : 'text-[#F4F4F1]/30 opacity-0 group-hover:opacity-100 group-hover:text-[#C6FF00] group-hover:translate-x-0.5'
                            }`}
                          />
                        </div>
                        <p className="text-xs sm:text-sm text-[#F4F4F1]/60 mt-1 pl-7 group-hover:text-[#F4F4F1]/85 transition-colors">
                          {srv.desc}
                        </p>
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Rodapé do Menu */}
          <div className="shrink-0 max-w-[1440px] w-full mx-auto px-6 sm:px-8 lg:px-12 py-8 border-t border-[#F4F4F1]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <p className="font-mono-tabular text-xs text-[#F4F4F1]/70 uppercase tracking-widest font-semibold">
                BRASIL + PORTUGAL
              </p>
              <p className="text-xs text-[#F4F4F1]/45 mt-0.5">
                Estratégia, conversão &amp; tecnologia.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6 font-mono-tabular text-xs uppercase tracking-wider text-[#F4F4F1]/70">
              <a
                href={BRAND_CONFIG.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#C6FF00] transition-colors"
              >
                Instagram (@vulto.lab) ↗
              </a>
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#C6FF00] transition-colors"
              >
                WhatsApp ↗
              </a>
            </div>

            <a
              href="/contato"
              onClick={(e) => handleLinkClick(e, '/contato')}
              className="px-6 py-3 bg-[#C6FF00] text-[#0A0A0A] font-bold text-xs uppercase tracking-wider hover:bg-[#d4ff33] transition-colors whitespace-nowrap inline-flex items-center gap-2"
            >
              <span>VAMOS CONVERSAR</span>
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
