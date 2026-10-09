import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ArrowUpRight, Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { BrandLogo } from './BrandLogo';
import { BrazilFlag, PortugalFlag } from './FlagIcons';
import { useLanguage } from '../context/LanguageContext';

interface HeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  currentLocale?: 'pt-BR' | 'pt-PT';
  onLocaleChange?: (locale: 'pt-BR' | 'pt-PT') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPath,
  onNavigate,
  currentLocale: propsLocale,
  onLocaleChange: propsLocaleChange,
}) => {
  const { language, setLanguage, dict, services } = useLanguage();
  const currentLocale = propsLocale || language;

  const handleLocaleSelect = (newLocale: 'pt-BR' | 'pt-PT') => {
    setLanguage(newLocale);
    if (propsLocaleChange) {
      propsLocaleChange(newLocale);
    }
  };

  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [localeDropdownOpen, setLocaleDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);

  const dropdownTimeoutRef = useRef<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const localeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 24);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setDropdownOpen(false);
    setLocaleDropdownOpen(false);
    setMobileMenuOpen(false);
    document.body.style.overflow = '';
  }, [currentPath]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (localeRef.current && !localeRef.current.contains(event.target as Node)) {
        setLocaleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMouseEnterDropdown = () => {
    if (dropdownTimeoutRef.current) {
      window.clearTimeout(dropdownTimeoutRef.current);
    }
    setDropdownOpen(true);
  };

  const handleMouseLeaveDropdown = () => {
    dropdownTimeoutRef.current = window.setTimeout(() => {
      setDropdownOpen(false);
    }, 140);
  };

  const handleLinkClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    document.body.style.overflow = '';
    onNavigate(path);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const isServicesActive = currentPath === '/servicos' || currentPath.startsWith('/servicos/');

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-200 ${
        scrolled || mobileMenuOpen
          ? 'bg-[#080808]/95 lg:bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#F4F4F1]/10'
          : 'bg-[#080808] lg:bg-transparent border-b border-[#F4F4F1]/[0.06]'
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 h-[76px] sm:h-20 flex items-center justify-between">
        {/* Zone 1: Logo VULTO LAB com espaço garantido */}
        <a
          href="/"
          onClick={(e) => handleLinkClick(e, '/')}
          aria-label="VULTO LAB - Página Inicial"
          className="focus-visible:outline-none group shrink-0 mr-8 lg:mr-16 flex items-center"
        >
          <BrandLogo variant="light" size="md" />
        </a>

        {/* Zone 2: Links de Navegação bem espaçados */}
        <nav
          aria-label="Navegação Principal"
          className="hidden lg:flex items-center gap-8 lg:gap-10"
        >
          <a
            href="/"
            onClick={(e) => handleLinkClick(e, '/')}
            className={`relative py-2 text-xs font-semibold uppercase tracking-[0.16em] transition-colors whitespace-nowrap group ${
              currentPath === '/' ? 'text-[#F4F4F1]' : 'text-[#F4F4F1]/70 hover:text-[#F4F4F1]'
            }`}
          >
            {dict.header.home}
            <span
              className={`absolute bottom-0 left-0 h-[1.5px] bg-[#C6FF00] transition-transform duration-200 origin-left w-full ${
                currentPath === '/' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
              }`}
            />
          </a>

          {/* Dropdown de Serviços */}
          <div
            ref={dropdownRef}
            className="relative"
            onMouseEnter={handleMouseEnterDropdown}
            onMouseLeave={handleMouseLeaveDropdown}
          >
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
              className={`relative py-2 text-xs font-semibold uppercase tracking-[0.16em] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap group cursor-pointer ${
                isServicesActive ? 'text-[#F4F4F1]' : 'text-[#F4F4F1]/70 hover:text-[#F4F4F1]'
              }`}
            >
              <span>{dict.header.services}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  dropdownOpen ? 'rotate-180 text-[#C6FF00]' : 'text-[#F4F4F1]/50'
                }`}
              />
              <span
                className={`absolute bottom-0 left-0 h-[1.5px] bg-[#C6FF00] transition-transform duration-200 origin-left w-full ${
                  isServicesActive || dropdownOpen
                    ? 'scale-x-100'
                    : 'scale-x-0 group-hover:scale-x-100'
                }`}
              />
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute left-0 top-full pt-3 w-80 z-50"
                >
                  <div className="bg-[#F4F4F1] text-[#0A0A0A] rounded-md shadow-[0_16px_40px_rgba(0,0,0,0.45)] border border-[#0A0A0A]/10 overflow-hidden p-2">
                    <div className="px-3 py-2 border-b border-[#0A0A0A]/10 flex items-center justify-between">
                      <span className="font-mono-tabular text-[10px] tracking-widest uppercase text-[#0A0A0A]/50">
                        {dict.header.structureAndServices}
                      </span>
                      <a
                        href="/servicos"
                        onClick={(e) => handleLinkClick(e, '/servicos')}
                        className="text-[10px] font-bold uppercase tracking-wider text-[#0A0A0A]/80 hover:text-[#0A0A0A] inline-flex items-center gap-0.5"
                      >
                        {dict.header.seeAll}
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    </div>

                    <ul className="py-1.5 divide-y divide-[#0A0A0A]/[0.06]" role="menu">
                      {services.map((service) => {
                        const itemPath = `/${service.slug}`;
                        const active = currentPath === itemPath;
                        return (
                          <li key={service.id} role="none">
                            <a
                              role="menuitem"
                              href={itemPath}
                              onClick={(e) => handleLinkClick(e, itemPath)}
                              className={`group/item flex items-center justify-between px-3 py-2.5 rounded transition-colors duration-150 ${
                                active
                                  ? 'bg-[#C6FF00] text-[#0A0A0A]'
                                  : 'hover:bg-[#0A0A0A]/[0.05] text-[#0A0A0A]'
                              }`}
                            >
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono-tabular text-xs text-[#0A0A0A]/45 font-medium">
                                    {service.number}
                                  </span>
                                  <span className="text-xs font-bold uppercase tracking-tight">
                                    {service.dropdownLabel}
                                  </span>
                                </div>
                                <span className="text-[10px] text-[#0A0A0A]/60 line-clamp-1 mt-0.5">
                                  {service.shortDescription}
                                </span>
                              </div>
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-150 ${
                                  active
                                    ? 'bg-[#0A0A0A] scale-100'
                                    : 'bg-[#C6FF00] scale-0 group-hover/item:scale-100 ring-1 ring-[#0A0A0A]/20'
                                }`}
                              />
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <a
            href="/cases"
            onClick={(e) => handleLinkClick(e, '/cases')}
            className={`relative py-2 text-xs font-semibold uppercase tracking-[0.16em] transition-colors whitespace-nowrap group ${
              currentPath === '/cases' ? 'text-[#F4F4F1]' : 'text-[#F4F4F1]/70 hover:text-[#F4F4F1]'
            }`}
          >
            {dict.header.cases}
            <span
              className={`absolute bottom-0 left-0 h-[1.5px] bg-[#C6FF00] transition-transform duration-200 origin-left w-full ${
                currentPath === '/cases' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
              }`}
            />
          </a>

          <a
            href="/sobre"
            onClick={(e) => handleLinkClick(e, '/sobre')}
            className={`relative py-2 text-xs font-semibold uppercase tracking-[0.16em] transition-colors whitespace-nowrap group ${
              currentPath === '/sobre' ? 'text-[#F4F4F1]' : 'text-[#F4F4F1]/70 hover:text-[#F4F4F1]'
            }`}
          >
            {dict.header.about}
            <span
              className={`absolute bottom-0 left-0 h-[1.5px] bg-[#C6FF00] transition-transform duration-200 origin-left w-full ${
                currentPath === '/sobre' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
              }`}
            />
          </a>

          <a
            href="/contato"
            onClick={(e) => handleLinkClick(e, '/contato')}
            className={`relative py-2 text-xs font-semibold uppercase tracking-[0.16em] transition-colors whitespace-nowrap group ${
              currentPath === '/contato' ? 'text-[#F4F4F1]' : 'text-[#F4F4F1]/70 hover:text-[#F4F4F1]'
            }`}
          >
            {dict.header.contact}
            <span
              className={`absolute bottom-0 left-0 h-[1.5px] bg-[#C6FF00] transition-transform duration-200 origin-left w-full ${
                currentPath === '/contato' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
              }`}
            />
          </a>
        </nav>

        {/* Zone 3: Seletor Discreto e Botão CTA */}
        <div className="flex items-center gap-4 lg:gap-6 ml-auto shrink-0">
          {/* Seletor Discreto [ 🇧🇷 BR ▾ ] */}
          <div ref={localeRef} className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setLocaleDropdownOpen((prev) => !prev)}
              aria-expanded={localeDropdownOpen}
              aria-label={dict.header.selectLanguage}
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
                        handleLocaleSelect('pt-BR');
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
                        <span>{dict.header.brazil}</span>
                      </span>
                      {currentLocale === 'pt-BR' && <span>✓</span>}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleLocaleSelect('pt-PT');
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
                        <span>{dict.header.portugal}</span>
                      </span>
                      {currentLocale === 'pt-PT' && <span>✓</span>}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <a
            href="/contato"
            onClick={(e) => handleLinkClick(e, '/contato')}
            data-cursor="cta"
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 bg-[#C6FF00] text-[#0A0A0A] text-xs font-bold uppercase tracking-[0.08em] hover:bg-[#d4ff33] transition-colors duration-150 whitespace-nowrap shrink-0"
          >
            <span>{dict.header.ctaTalk}</span>
            <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </a>

          {/* Mobile Hamburger Trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
            aria-expanded={mobileMenuOpen}
            className="lg:hidden w-11 h-11 inline-flex items-center justify-center text-[#F4F4F1] border border-[#2A2A2A] bg-[#121212] hover:bg-[#1A1A1A] hover:border-[#C6FF00] transition-colors cursor-pointer shrink-0"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden bg-[#0A0A0A] border-b border-[#F4F4F1]/15 overflow-hidden"
          >
            <div className="px-5 py-6 flex flex-col divide-y divide-[#F4F4F1]/10">
              {/* Mobile Seletor de País */}
              <div className="pb-4 flex items-center justify-between">
                <span className="font-mono-tabular text-xs text-[#F4F4F1]/50 uppercase tracking-wider">
                  MERCADO / IDIOMA
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleLocaleSelect('pt-BR')}
                    className={`px-3 py-1.5 font-mono-tabular text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                      currentLocale === 'pt-BR'
                        ? 'bg-[#C6FF00] text-[#0A0A0A] font-bold'
                        : 'border border-[#2A2A2A] text-[#F4F4F1]'
                    }`}
                  >
                    <BrazilFlag className="w-4 h-3" />
                    <span>BR</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLocaleSelect('pt-PT')}
                    className={`px-3 py-1.5 font-mono-tabular text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                      currentLocale === 'pt-PT'
                        ? 'bg-[#C6FF00] text-[#0A0A0A] font-bold'
                        : 'border border-[#2A2A2A] text-[#F4F4F1]'
                    }`}
                  >
                    <PortugalFlag className="w-4 h-3" />
                    <span>PT</span>
                  </button>
                </div>
              </div>

              <a
                href="/"
                onClick={(e) => handleLinkClick(e, '/')}
                className={`py-3.5 text-base font-display font-semibold tracking-tight flex items-center justify-between ${
                  currentPath === '/' ? 'text-[#C6FF00]' : 'text-[#F4F4F1]'
                }`}
              >
                <span>{dict.header.home}</span>
                <span className="font-mono-tabular text-xs text-[#F4F4F1]/40">01</span>
              </a>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => setMobileServicesOpen((prev) => !prev)}
                  aria-expanded={mobileServicesOpen}
                  className="w-full py-3.5 text-base font-display font-semibold tracking-tight flex items-center justify-between text-[#F4F4F1] cursor-pointer"
                >
                  <span className={isServicesActive ? 'text-[#C6FF00]' : ''}>{dict.header.services}</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      mobileServicesOpen ? 'rotate-180 text-[#C6FF00]' : 'text-[#F4F4F1]/50'
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {mobileServicesOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-3 pb-3 pt-1 flex flex-col gap-1 border-l border-[#C6FF00]/50 ml-1 mb-2">
                        <a
                          href="/servicos"
                          onClick={(e) => handleLinkClick(e, '/servicos')}
                          className="py-2 px-3 text-xs font-mono-tabular uppercase tracking-wider text-[#C6FF00] flex items-center justify-between"
                        >
                          <span>{dict.header.structureAndServices}</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                        {services.map((service) => {
                          const itemPath = `/${service.slug}`;
                          return (
                            <a
                              key={service.id}
                              href={itemPath}
                              onClick={(e) => handleLinkClick(e, itemPath)}
                              className={`py-2.5 px-3 text-sm font-medium flex items-center justify-between rounded ${
                                currentPath === itemPath
                                  ? 'bg-[#1A1A1A] text-[#C6FF00]'
                                  : 'text-[#F4F4F1]/80 hover:text-[#F4F4F1]'
                              }`}
                            >
                              <span>{service.dropdownLabel}</span>
                              <span className="font-mono-tabular text-xs text-[#F4F4F1]/40">
                                {service.number}
                              </span>
                            </a>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <a
                href="/cases"
                onClick={(e) => handleLinkClick(e, '/cases')}
                className={`py-3.5 text-base font-display font-semibold tracking-tight flex items-center justify-between ${
                  currentPath === '/cases' ? 'text-[#C6FF00]' : 'text-[#F4F4F1]'
                }`}
              >
                <span>{dict.header.cases}</span>
                <span className="font-mono-tabular text-xs text-[#F4F4F1]/40">03</span>
              </a>

              <a
                href="/sobre"
                onClick={(e) => handleLinkClick(e, '/sobre')}
                className={`py-3.5 text-base font-display font-semibold tracking-tight flex items-center justify-between ${
                  currentPath === '/sobre' ? 'text-[#C6FF00]' : 'text-[#F4F4F1]'
                }`}
              >
                <span>{dict.header.about}</span>
                <span className="font-mono-tabular text-xs text-[#F4F4F1]/40">04</span>
              </a>

              <a
                href="/contato"
                onClick={(e) => handleLinkClick(e, '/contato')}
                className={`py-3.5 text-base font-display font-semibold tracking-tight flex items-center justify-between ${
                  currentPath === '/contato' ? 'text-[#C6FF00]' : 'text-[#F4F4F1]'
                }`}
              >
                <span>{dict.header.contact}</span>
                <span className="font-mono-tabular text-xs text-[#F4F4F1]/40">05</span>
              </a>

              <div className="pt-5">
                <a
                  href="/contato"
                  onClick={(e) => handleLinkClick(e, '/contato')}
                  className="w-full py-3.5 px-5 bg-[#C6FF00] text-[#0A0A0A] text-xs font-bold uppercase tracking-[0.1em] flex items-center justify-center gap-2"
                >
                  <span>{dict.header.ctaTalk}</span>
                  <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
