import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { BRAND_CONFIG, getWhatsAppLink } from '../data/siteData';
import { BrandLogo } from './BrandLogo';
import { useLanguage } from '../context/LanguageContext';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { dict, services } = useLanguage();

  const handleNav = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    onNavigate(path);
  };

  return (
    <footer className="bg-[#0A0A0A] text-[#F4F4F1] border-t border-[#F4F4F1]/12">
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 pt-16 sm:pt-24 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-16 border-b border-[#F4F4F1]/10">
          <div className="sm:col-span-2 lg:col-span-5 space-y-5">
            <a
              href="/"
              onClick={(e) => handleNav(e, '/')}
              aria-label="VULTO LAB - Voltar ao início"
              className="inline-block"
            >
              <BrandLogo variant="light" size="lg" />
            </a>
            <p className="font-mono-tabular text-xs uppercase tracking-[0.18em] text-[#C6FF00]">
              Paid Media <span className="text-[#F4F4F1]/40 mx-1">·</span> Copy{' '}
              <span className="text-[#F4F4F1]/40 mx-1">·</span> Web
            </p>
            <p className="text-sm text-[#F4F4F1]/60 max-w-sm leading-relaxed">
              {dict.footer.description}
            </p>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-mono-tabular text-xs uppercase tracking-[0.2em] text-[#F4F4F1]/45">
              {dict.footer.navigationTitle}
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="/"
                  onClick={(e) => handleNav(e, '/')}
                  className="text-[#F4F4F1]/75 hover:text-[#C6FF00] transition-colors"
                >
                  {dict.footer.home}
                </a>
              </li>
              <li>
                <a
                  href="/servicos"
                  onClick={(e) => handleNav(e, '/servicos')}
                  className="text-[#F4F4F1]/75 hover:text-[#C6FF00] transition-colors"
                >
                  {dict.footer.services}
                </a>
              </li>
              <li>
                <a
                  href="/sobre"
                  onClick={(e) => handleNav(e, '/sobre')}
                  className="text-[#F4F4F1]/75 hover:text-[#C6FF00] transition-colors"
                >
                  {dict.footer.about}
                </a>
              </li>
              <li>
                <a
                  href="/contato"
                  onClick={(e) => handleNav(e, '/contato')}
                  className="text-[#F4F4F1]/75 hover:text-[#C6FF00] transition-colors"
                >
                  {dict.footer.contact}
                </a>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <h3 className="font-mono-tabular text-xs uppercase tracking-[0.2em] text-[#F4F4F1]/45">
              {dict.footer.servicesTitle}
            </h3>
            <ul className="space-y-2.5 text-sm">
              {services.map((service) => (
                <li key={service.id}>
                  <a
                    href={`/${service.slug}`}
                    onClick={(e) => handleNav(e, `/${service.slug}`)}
                    className="text-[#F4F4F1]/75 hover:text-[#C6FF00] transition-colors"
                  >
                    {service.footerLabel}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-3">
              <h3 className="font-mono-tabular text-xs uppercase tracking-[0.2em] text-[#F4F4F1]/45">
                {dict.footer.socialTitle}
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href={BRAND_CONFIG.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[#F4F4F1]/75 hover:text-[#C6FF00] transition-colors"
                  >
                    <span>Instagram</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-mono-tabular text-xs uppercase tracking-[0.2em] text-[#F4F4F1]/45">
                {dict.footer.contactTitle}
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href={getWhatsAppLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[#F4F4F1]/75 hover:text-[#C6FF00] transition-colors"
                  >
                    <span>WhatsApp</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${BRAND_CONFIG.email}`}
                    className="text-[#F4F4F1]/75 hover:text-[#C6FF00] transition-colors block font-mono-tabular text-xs font-medium"
                  >
                    {BRAND_CONFIG.email}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Rodapé da Marca */}
        <div className="py-10 sm:py-14 border-b border-[#F4F4F1]/10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
          <div className="font-display font-bold uppercase text-5xl sm:text-7xl lg:text-[6.5rem] leading-[0.85] tracking-[-0.05em] text-[#F4F4F1] select-none flex items-baseline gap-2">
            <span>VULTO</span>
            <span className="text-[#C6FF00] text-3xl sm:text-5xl font-mono-tabular tracking-[0.1em]">LAB</span>
          </div>
          <span className="font-mono-tabular text-xs uppercase tracking-[0.22em] text-[#F4F4F1]/45">
            {dict.footer.labSubtitle}
          </span>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono-tabular text-xs text-[#F4F4F1]/45">
          <p>{dict.footer.copyright}</p>
          <p>{dict.footer.allRightsReserved}</p>
        </div>
      </div>
    </footer>
  );
};
