import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowUpRight,
  ArrowDown,
  Globe,
  Lock,
  Search,
  Settings,
  MessageSquare,
  Camera,
  Star,
  Utensils,
  Briefcase,
  Layout,
  Link2,
  Plus,
  Minus,
  Check,
  ChevronDown,
} from 'lucide-react';
import { getWhatsAppLink } from '../data/siteData';

interface PageProps {
  onNavigate: (path: string) => void;
}

export const InvestmentPage: React.FC<PageProps> = ({ onNavigate }) => {
  const [showSiteTechDetails, setShowSiteTechDetails] = useState(false);
  const [showCareFullList, setShowCareFullList] = useState(false);

  useEffect(() => {
    document.title = 'Investimento & Soluções | Vulto Lab — Presença, Tráfego e NFC';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'Conheça as soluções da VULTO LAB: Vulto Site (R$ 997 pagamento único), Vulto Care (R$ 79,90/mês), Vulto Tap (a partir de R$ 80) e Vulto Performance (Meta Ads, Google Ads e Híbrido). Estrutura digital sem complicação para empresas.'
      );
    }
  }, []);

  const handleNav = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    onNavigate(path);
  };

  const scrollToSection = (e: React.MouseEvent, sectionId: string) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const whatsappInquiryUrl = getWhatsAppLink(
    'Olá! Estive analisando as soluções da VULTO LAB na página de Investimento e gostaria de entender o que faz mais sentido para o momento da minha empresa.'
  );

  return (
    <div className="bg-[#0A0A0A] text-[#F4F4F1] selection:bg-[#C6FF00] selection:text-[#0A0A0A]">
      {/* ============================================================ */}
      {/* 1. HERO — COMPACTO E FUNCIONAL                                */}
      {/* ============================================================ */}
      <section className="relative pt-28 pb-12 sm:pt-36 sm:pb-16 border-b border-[#F4F4F1]/10 overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#F4F4F1_1px,transparent_1px),linear-gradient(to_bottom,#F4F4F1_1px,transparent_1px)] bg-[size:4rem_4rem]"
        />

        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-5 h-[1.5px] bg-[#C6FF00]" />
            <span className="font-mono-tabular text-xs uppercase tracking-[0.22em] text-[#C6FF00] font-semibold">
              SOLUÇÕES VULTO
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
            <div className="lg:col-span-8">
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="font-display font-bold uppercase text-3xl sm:text-5xl lg:text-6xl leading-[0.98] tracking-[-0.04em] text-[#F4F4F1]"
              >
                ESTRUTURA DIGITAL.
                <br />
                <span className="text-[#F4F4F1]">DO PRIMEIRO CONTATO</span>{' '}
                <span className="text-[#C6FF00]">À CONVERSÃO.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.08 }}
                className="mt-4 text-sm sm:text-lg text-[#F4F4F1]/80 max-w-2xl leading-relaxed font-light"
              >
                Soluções desenvolvidas para empresas que querem construir presença, transmitir
                confiança e transformar atenção em oportunidades de negócio.
              </motion.p>

              {/* Indicadores de soluções em linha compacta */}
              <div className="mt-6 pt-4 border-t border-[#F4F4F1]/10 flex flex-wrap items-center gap-2 sm:gap-4 font-mono-tabular text-[11px] sm:text-xs uppercase tracking-[0.16em] text-[#F4F4F1]/60">
                <span className="text-[#C6FF00] font-semibold">SITE</span>
                <span className="text-[#F4F4F1]/25">/</span>
                <span className="text-[#C6FF00] font-semibold">MANUTENÇÃO</span>
                <span className="text-[#F4F4F1]/25">/</span>
                <span className="text-[#C6FF00] font-semibold">NFC</span>
                <span className="text-[#F4F4F1]/25">/</span>
                <span className="text-[#C6FF00] font-semibold">PERFORMANCE</span>
              </div>
            </div>

            <div className="lg:col-span-4 flex lg:justify-end">
              <a
                href="/contato"
                onClick={(e) => handleNav(e, '/contato')}
                data-cursor="cta"
                className="inline-flex items-center justify-between gap-3 w-full sm:w-auto px-7 py-3.5 bg-[#C6FF00] text-[#0A0A0A] text-xs font-bold uppercase tracking-[0.1em] hover:bg-[#d4ff33] transition-colors group cursor-pointer"
              >
                <span>FALAR COM A VULTO</span>
                <ArrowUpRight className="w-4 h-4 stroke-[2.5] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. RESUMO IMEDIATO DAS 4 SOLUÇÕES (OVERVIEW RÁPIDO)           */}
      {/* ============================================================ */}
      <section className="bg-[#0C0C0C] border-b border-[#F4F4F1]/10 py-6 sm:py-8">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between gap-4 mb-4">
            <span className="font-mono-tabular text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[#F4F4F1]/50 font-semibold">
              PANORAMA RÁPIDO DE INVESTIMENTOS
            </span>
            <span className="font-mono-tabular text-[10px] sm:text-xs uppercase tracking-[0.14em] text-[#C6FF00] hidden sm:inline">
              CLIQUE PARA VER DETALHES
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Bloco 1: Vulto Site */}
            <a
              href="#site"
              onClick={(e) => scrollToSection(e, 'site')}
              className="p-4 sm:p-5 border border-[#C6FF00]/40 bg-[#121212] hover:border-[#C6FF00] hover:bg-[#161616] transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-display font-bold text-base sm:text-lg uppercase tracking-tight text-[#F4F4F1] group-hover:text-[#C6FF00] transition-colors">
                    VULTO SITE
                  </span>
                  <span className="px-1.5 py-0.5 bg-[#C6FF00]/15 text-[#C6FF00] font-mono-tabular text-[9px] uppercase font-bold tracking-wider">
                    PRINCIPAL
                  </span>
                </div>
                <p className="text-xs text-[#F4F4F1]/70 line-clamp-1 mb-3">
                  Presença digital completa, domínio e conversão.
                </p>
              </div>
              <div className="pt-2 border-t border-[#F4F4F1]/10 flex items-center justify-between">
                <div>
                  <span className="font-display font-bold text-lg text-[#F4F4F1]">R$ 997</span>
                  <span className="font-mono-tabular text-[10px] text-[#F4F4F1]/50 ml-1.5 uppercase">
                    único
                  </span>
                </div>
                <span className="font-mono-tabular text-[10px] text-[#C6FF00] uppercase font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  DETALHES <ArrowDown className="w-3 h-3" />
                </span>
              </div>
            </a>

            {/* Bloco 2: Vulto Performance */}
            <a
              href="#performance"
              onClick={(e) => scrollToSection(e, 'performance')}
              className="p-4 sm:p-5 border border-[#F4F4F1]/15 bg-[#121212] hover:border-[#C6FF00] hover:bg-[#161616] transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-display font-bold text-base sm:text-lg uppercase tracking-tight text-[#F4F4F1] group-hover:text-[#C6FF00] transition-colors">
                    PERFORMANCE
                  </span>
                  <span className="font-mono-tabular text-[10px] text-[#F4F4F1]/40 uppercase">
                    AQUISIÇÃO
                  </span>
                </div>
                <p className="text-xs text-[#F4F4F1]/70 line-clamp-1 mb-3">
                  Gestão estratégica no Meta Ads e Google Ads.
                </p>
              </div>
              <div className="pt-2 border-t border-[#F4F4F1]/10 flex items-center justify-between">
                <div>
                  <span className="font-display font-bold text-lg text-[#F4F4F1]">
                    R$ 779,90
                  </span>
                  <span className="font-mono-tabular text-[10px] text-[#F4F4F1]/50 ml-1.5 uppercase">
                    /mês
                  </span>
                </div>
                <span className="font-mono-tabular text-[10px] text-[#C6FF00] uppercase font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  DETALHES <ArrowDown className="w-3 h-3" />
                </span>
              </div>
            </a>

            {/* Bloco 3: Vulto Tap */}
            <a
              href="#tap"
              onClick={(e) => scrollToSection(e, 'tap')}
              className="p-4 sm:p-5 border border-[#F4F4F1]/15 bg-[#121212] hover:border-[#C6FF00] hover:bg-[#161616] transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-display font-bold text-base sm:text-lg uppercase tracking-tight text-[#F4F4F1] group-hover:text-[#C6FF00] transition-colors">
                    VULTO TAP
                  </span>
                  <span className="font-mono-tabular text-[10px] text-[#F4F4F1]/40 uppercase">
                    NFC
                  </span>
                </div>
                <p className="text-xs text-[#F4F4F1]/70 line-clamp-1 mb-3">
                  Conexão física instantânea por aproximação.
                </p>
              </div>
              <div className="pt-2 border-t border-[#F4F4F1]/10 flex items-center justify-between">
                <div>
                  <span className="font-mono-tabular text-[10px] text-[#F4F4F1]/50 uppercase mr-1">
                    A partir de
                  </span>
                  <span className="font-display font-bold text-lg text-[#F4F4F1]">R$ 80</span>
                </div>
                <span className="font-mono-tabular text-[10px] text-[#C6FF00] uppercase font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  DETALHES <ArrowDown className="w-3 h-3" />
                </span>
              </div>
            </a>

            {/* Bloco 4: Vulto Care */}
            <a
              href="#care"
              onClick={(e) => scrollToSection(e, 'care')}
              className="p-4 sm:p-5 border border-[#F4F4F1]/15 bg-[#121212] hover:border-[#C6FF00] hover:bg-[#161616] transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-display font-bold text-base sm:text-lg uppercase tracking-tight text-[#F4F4F1] group-hover:text-[#C6FF00] transition-colors">
                    VULTO CARE
                  </span>
                  <span className="px-1.5 py-0.5 bg-[#F4F4F1]/10 text-[#F4F4F1]/70 font-mono-tabular text-[9px] uppercase font-bold tracking-wider">
                    OPCIONAL
                  </span>
                </div>
                <p className="text-xs text-[#F4F4F1]/70 line-clamp-1 mb-3">
                  Manutenção contínua, backups e suporte técnico.
                </p>
              </div>
              <div className="pt-2 border-t border-[#F4F4F1]/10 flex items-center justify-between">
                <div>
                  <span className="font-display font-bold text-lg text-[#F4F4F1]">R$ 79,90</span>
                  <span className="font-mono-tabular text-[10px] text-[#F4F4F1]/50 ml-1.5 uppercase">
                    /mês
                  </span>
                </div>
                <span className="font-mono-tabular text-[10px] text-[#C6FF00] uppercase font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  DETALHES <ArrowDown className="w-3 h-3" />
                </span>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. SEÇÃO 01 — VULTO SITE (SOLUÇÃO PRINCIPAL ENXUTA)          */}
      {/* ============================================================ */}
      <section
        id="site"
        className="scroll-mt-24 sm:scroll-mt-28 py-14 sm:py-20 border-b border-[#F4F4F1]/10 relative"
      >
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
          {/* Header da Solução 01 */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#F4F4F1]/10">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="font-mono-tabular text-xs text-[#C6FF00] font-semibold tracking-wider">
                  01
                </span>
                <span className="w-3.5 h-[1px] bg-[#C6FF00]" />
                <span className="font-mono-tabular text-xs uppercase tracking-[0.2em] text-[#C6FF00] font-semibold">
                  SOLUÇÃO PRINCIPAL
                </span>
              </div>
              <h2 className="font-display font-bold uppercase text-3xl sm:text-4xl lg:text-5xl text-[#F4F4F1] tracking-[-0.03em]">
                VULTO SITE
              </h2>
              <p className="font-mono-tabular text-xs uppercase tracking-[0.16em] text-[#F4F4F1]/60 mt-1.5">
                SUA PRESENÇA DIGITAL COMPLETA.
              </p>
            </div>

            {/* Preço Heroico */}
            <div className="border border-[#C6FF00]/40 bg-[#121212] p-4 sm:p-5 md:text-right shrink-0">
              <span className="font-mono-tabular text-[10px] uppercase tracking-[0.2em] text-[#C6FF00] font-bold block mb-0.5">
                INVESTIMENTO PÚBLICO
              </span>
              <div className="flex items-baseline md:justify-end gap-2">
                <span className="font-display font-bold text-3xl sm:text-4xl text-[#F4F4F1] tracking-tight">
                  R$ 997
                </span>
              </div>
              <span className="font-mono-tabular text-[11px] text-[#F4F4F1]/50 block uppercase tracking-wider">
                pagamento único
              </span>
            </div>
          </div>

          {/* Destaque de Posicionamento Compacto */}
          <div className="my-6 p-4 sm:p-5 bg-[#121212]/90 border-l-2 border-[#C6FF00] border-y border-r border-[#F4F4F1]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-mono-tabular text-xs font-bold uppercase tracking-[0.2em] text-[#C6FF00] block">
                SEM MENSALIDADE OBRIGATÓRIA.
              </span>
              <p className="text-sm text-[#F4F4F1]/85 font-medium mt-0.5">
                O site é seu. A manutenção é opcional.
              </p>
            </div>
            <span className="font-mono-tabular text-[11px] text-[#F4F4F1]/45 uppercase tracking-wider shrink-0">
              PROPRIEDADE TOTAL DO CLIENTE
            </span>
          </div>

          <p className="text-sm sm:text-base text-[#F4F4F1]/80 max-w-3xl leading-relaxed mb-8 font-light">
            Muito mais do que colocar sua empresa na internet. Criamos uma estrutura profissional
            para apresentar sua marca, transmitir confiança e transformar visitantes em contatos e
            oportunidades comerciais.
          </p>

          {/* Benefícios Essenciais Visíveis Imediatamente (Grid 2 colunas denso) */}
          <div className="border border-[#F4F4F1]/12 bg-[#101010] p-5 sm:p-8 mb-6">
            <span className="font-mono-tabular text-xs uppercase tracking-[0.18em] text-[#C6FF00] font-semibold block mb-4">
              BENEFÍCIOS ESSENCIAIS INCLUSOS:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-sm text-[#F4F4F1]/85">
              {[
                'Site profissional personalizado',
                'Design responsivo para celular, tablet e desktop',
                'Estrutura pensada para conversão',
                'Integração direta com WhatsApp',
                'Integração com redes sociais',
                'Domínio personalizado — 1º ano incluso',
                '1 e-mail profissional com domínio próprio',
                'Hospedagem inclusa de alta velocidade',
                'Certificado SSL / HTTPS incluso',
                'SEO Essencial para indexação no Google',
                'Google Search Console configurado',
                'Otimização de performance e publicação completa',
              ].map((benefit) => (
                <div key={benefit} className="flex items-start gap-2.5">
                  <span className="text-[#C6FF00] font-bold shrink-0 mt-0.5">✓</span>
                  <span className="leading-snug">{benefit}</span>
                </div>
              ))}
            </div>

            {/* Accordion Discreto: Detalhes Técnicos de Engenharia */}
            <div className="mt-6 pt-5 border-t border-[#F4F4F1]/10">
              <button
                type="button"
                onClick={() => setShowSiteTechDetails((prev) => !prev)}
                className="inline-flex items-center gap-2 text-xs font-mono-tabular uppercase tracking-[0.14em] text-[#F4F4F1]/60 hover:text-[#C6FF00] transition-colors cursor-pointer"
                aria-expanded={showSiteTechDetails}
              >
                {showSiteTechDetails ? (
                  <Minus className="w-3.5 h-3.5 text-[#C6FF00]" />
                ) : (
                  <Plus className="w-3.5 h-3.5 text-[#C6FF00]" />
                )}
                <span>
                  {showSiteTechDetails
                    ? 'OCULTAR DETALHES TÉCNICOS'
                    : 'VER DETALHES TÉCNICOS DE ENGENHARIA (SITEMAP, ROBOTS, CANONICAL, METADADOS)'}
                </span>
              </button>

              <AnimatePresence>
                {showSiteTechDetails && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 pt-4 border-t border-[#F4F4F1]/8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#F4F4F1]/70">
                      <div className="flex items-start gap-2">
                        <span className="text-[#C6FF00]">·</span>
                        <span>
                          <strong>Sitemap XML & robots.txt:</strong> arquivos gerados para correta
                          leitura dos rastreadores do Google.
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-[#C6FF00]">·</span>
                        <span>
                          <strong>URLs amigáveis & Canonical:</strong> organização técnica de links
                          para evitar duplicações.
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-[#C6FF00]">·</span>
                        <span>
                          <strong>Estrutura Semântica:</strong> hierarquia de títulos (H1, H2, H3) e
                          metadados OpenGraph configurados.
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-[#C6FF00]">·</span>
                        <span>
                          <strong>Engenharia Limpa:</strong> compactação de scripts e assets sem
                          promessas irreais de ranking.
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* CTA Intermediário Compacto e Integrado */}
          <div className="p-4 sm:p-5 border border-[#F4F4F1]/15 bg-[#121212] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <span className="font-mono-tabular text-[10px] uppercase tracking-[0.16em] text-[#C6FF00] font-semibold block">
                PRONTO PARA INICIAR SUA ESTRUTURA?
              </span>
              <p className="text-xs sm:text-sm text-[#F4F4F1]/85 font-medium">
                Construa sua presença com engenharia profissional.
              </p>
            </div>
            <a
              href="/contato?servico=Sites+%26+Sistemas"
              onClick={(e) => handleNav(e, '/contato?servico=Sites+%26+Sistemas')}
              data-cursor="cta"
              className="inline-flex items-center justify-between gap-3 w-full sm:w-auto px-6 py-3 bg-[#C6FF00] text-[#0A0A0A] text-xs font-bold uppercase tracking-[0.08em] hover:bg-[#d4ff33] transition-colors group cursor-pointer shrink-0"
            >
              <span>CONVERSAR SOBRE MEU PROJETO</span>
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. SEÇÃO 02 — VULTO PERFORMANCE (SEGUNDA PRIORIDADE VISUAL)   */}
      {/* ============================================================ */}
      <section
        id="performance"
        className="scroll-mt-24 sm:scroll-mt-28 py-14 sm:py-20 border-b border-[#F4F4F1]/10 bg-[#080808]"
      >
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#F4F4F1]/10">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="font-mono-tabular text-xs text-[#C6FF00] font-semibold tracking-wider">
                  02
                </span>
                <span className="w-3.5 h-[1px] bg-[#C6FF00]" />
                <span className="font-mono-tabular text-xs uppercase tracking-[0.2em] text-[#C6FF00] font-semibold">
                  TRÁFEGO PAGO & PERFORMANCE
                </span>
              </div>
              <h2 className="font-display font-bold uppercase text-3xl sm:text-4xl lg:text-5xl text-[#F4F4F1] tracking-[-0.03em]">
                VULTO PERFORMANCE
              </h2>
              <p className="font-mono-tabular text-xs uppercase tracking-[0.16em] text-[#F4F4F1]/60 mt-1.5">
                COLOQUE SUA EMPRESA NA FRENTE DAS PESSOAS CERTAS.
              </p>
            </div>

            {/* Destaque Comercial: Ideal Para */}
            <div className="border border-[#F4F4F1]/15 bg-[#121212] p-4 text-xs font-mono-tabular text-[#F4F4F1]/80 max-w-sm">
              <span className="text-[#C6FF00] font-bold block mb-1 uppercase tracking-wider">
                IDEAL PARA EMPRESAS QUE QUEREM:
              </span>
              <ul className="space-y-1 text-[11px] text-[#F4F4F1]/70">
                <li>• Gerar novos leads qualificados</li>
                <li>• Atrair clientes com intenção imediata de compra</li>
                <li>• Aumentar a previsibilidade de novos contatos</li>
              </ul>
            </div>
          </div>

          <p className="text-sm sm:text-base text-[#F4F4F1]/80 max-w-3xl leading-relaxed my-6 font-light">
            Estratégia, gestão e otimização de mídia paga para transformar investimento em alcance
            qualificado, oportunidades comerciais e crescimento sustentável.
          </p>

          {/* 3 Opções de Investimento Compactas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
            {/* Opção 1: Meta Ads */}
            <div className="border border-[#F4F4F1]/15 bg-[#101010] p-5 sm:p-6 flex flex-col justify-between hover:border-[#F4F4F1]/30 transition-colors">
              <div>
                <span className="font-mono-tabular text-[10px] uppercase tracking-[0.16em] text-[#F4F4F1]/45 block mb-1">
                  OPÇÃO 01
                </span>
                <h3 className="font-display font-bold text-xl uppercase tracking-tight text-[#F4F4F1] mb-1.5">
                  META ADS
                </h3>
                <p className="text-xs text-[#F4F4F1]/65 leading-relaxed mb-4">
                  Gestão focada no Instagram e Facebook para construir reconhecimento, gerar demanda e
                  atrair novos contatos.
                </p>
              </div>

              <div className="pt-4 border-t border-[#F4F4F1]/10 flex items-baseline justify-between">
                <div>
                  <span className="font-display font-bold text-2xl text-[#F4F4F1]">R$ 779,90</span>
                  <span className="font-mono-tabular text-[10px] text-[#F4F4F1]/50 uppercase ml-1">
                    / mês
                  </span>
                </div>
              </div>
            </div>

            {/* Opção 2: Google Ads */}
            <div className="border border-[#F4F4F1]/15 bg-[#101010] p-5 sm:p-6 flex flex-col justify-between hover:border-[#F4F4F1]/30 transition-colors">
              <div>
                <span className="font-mono-tabular text-[10px] uppercase tracking-[0.16em] text-[#F4F4F1]/45 block mb-1">
                  OPÇÃO 02
                </span>
                <h3 className="font-display font-bold text-xl uppercase tracking-tight text-[#F4F4F1] mb-1.5">
                  GOOGLE ADS
                </h3>
                <p className="text-xs text-[#F4F4F1]/65 leading-relaxed mb-4">
                  Foco em captura de intenção imediata através da Rede de Pesquisa, Google Maps e
                  termos comerciais diretos.
                </p>
              </div>

              <div className="pt-4 border-t border-[#F4F4F1]/10 flex items-baseline justify-between">
                <div>
                  <span className="font-display font-bold text-2xl text-[#F4F4F1]">R$ 779,90</span>
                  <span className="font-mono-tabular text-[10px] text-[#F4F4F1]/50 uppercase ml-1">
                    / mês
                  </span>
                </div>
              </div>
            </div>

            {/* Opção 3: Meta + Google (Destaque Híbrido) */}
            <div className="border-2 border-[#C6FF00] bg-[#141414] p-5 sm:p-6 flex flex-col justify-between relative">
              <div className="absolute top-0 right-0 transform translate-x-1 -translate-y-2.5 px-2.5 py-0.5 bg-[#C6FF00] text-[#0A0A0A] font-mono-tabular text-[9px] font-bold uppercase tracking-[0.16em]">
                COBERTURA TOTAL
              </div>

              <div>
                <span className="font-mono-tabular text-[10px] uppercase tracking-[0.16em] text-[#C6FF00] block mb-1">
                  OPÇÃO 03 · INTEGRADA
                </span>
                <h3 className="font-display font-bold text-xl uppercase tracking-tight text-[#F4F4F1] mb-1.5">
                  META + GOOGLE
                </h3>
                <p className="text-xs text-[#F4F4F1]/80 leading-relaxed mb-4">
                  Funil completo: atração de demanda no Meta combinada à captura imediata no Google
                  para máxima conversão.
                </p>
              </div>

              <div className="pt-4 border-t border-[#F4F4F1]/10 flex items-baseline justify-between">
                <div>
                  <span className="font-display font-bold text-2xl text-[#C6FF00]">R$ 1.197</span>
                  <span className="font-mono-tabular text-[10px] text-[#F4F4F1]/60 uppercase ml-1">
                    / mês
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* O que está incluso & Observação de verba compacta */}
          <div className="border border-[#F4F4F1]/12 bg-[#101010] p-5 sm:p-7">
            <span className="font-mono-tabular text-xs uppercase tracking-[0.18em] text-[#C6FF00] font-semibold block mb-3">
              O QUE ESTÁ INCLUSO NA GESTÃO DE PERFORMANCE:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-[#F4F4F1]/85 mb-5">
              {[
                'Planejamento de campanhas',
                'Estruturação de conta e pixels',
                'Segmentação avançada',
                'Otimizações e testes contínuos',
                'Acompanhamento de métricas',
                'Estratégia de criativos e ofertas',
                'Análise de desempenho',
                'Relatórios e direcionamento comercial',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <span className="text-[#C6FF00] shrink-0 font-bold">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-[#F4F4F1]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span className="text-xs text-[#F4F4F1]/60 italic font-mono-tabular">
                * Verba destinada às plataformas de anúncios não inclusa (faturada diretamente pelos canais de mídia).
              </span>
              <a
                href="/contato?servico=Paid+Media"
                onClick={(e) => handleNav(e, '/contato?servico=Paid+Media')}
                data-cursor="cta"
                className="inline-flex items-center justify-between gap-3 px-6 py-3 bg-[#C6FF00] text-[#0A0A0A] text-xs font-bold uppercase tracking-[0.08em] hover:bg-[#d4ff33] transition-colors group cursor-pointer shrink-0"
              >
                <span>CONVERSAR SOBRE PERFORMANCE</span>
                <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. SEÇÃO 03 — VULTO TAP (ÍCONES ESPECÍFICOS & COMPACTO)      */}
      {/* ============================================================ */}
      <section
        id="tap"
        className="scroll-mt-24 sm:scroll-mt-28 py-14 sm:py-20 border-b border-[#F4F4F1]/10"
      >
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#F4F4F1]/10">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="font-mono-tabular text-xs text-[#C6FF00] font-semibold tracking-wider">
                  03
                </span>
                <span className="w-3.5 h-[1px] bg-[#C6FF00]" />
                <span className="font-mono-tabular text-xs uppercase tracking-[0.2em] text-[#C6FF00] font-semibold">
                  TECNOLOGIA DE PROXIMIDADE NFC
                </span>
              </div>
              <h2 className="font-display font-bold uppercase text-3xl sm:text-4xl lg:text-5xl text-[#F4F4F1] tracking-[-0.03em]">
                VULTO TAP
              </h2>
              <p className="font-mono-tabular text-xs uppercase tracking-[0.16em] text-[#F4F4F1]/60 mt-1.5">
                UM TOQUE. UMA CONEXÃO.
              </p>
            </div>

            <div className="border border-[#F4F4F1]/15 bg-[#121212] p-4 sm:p-5 md:text-right shrink-0">
              <span className="font-mono-tabular text-[10px] uppercase tracking-[0.2em] text-[#C6FF00] font-bold block mb-0.5">
                PREÇO PÚBLICO
              </span>
              <div className="flex items-baseline md:justify-end gap-1.5">
                <span className="font-mono-tabular text-xs text-[#F4F4F1]/50 uppercase">
                  A partir de
                </span>
                <span className="font-display font-bold text-2xl sm:text-3xl text-[#F4F4F1] tracking-tight">
                  R$ 80
                </span>
              </div>
              <span className="font-mono-tabular text-[11px] text-[#F4F4F1]/50 block uppercase tracking-wider">
                unidade configurada
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-4">
              <p className="text-sm sm:text-base text-[#F4F4F1]/85 leading-relaxed font-light">
                Transforme balcões, mesas, recepções e pontos físicos em pontos instantâneos de
                conexão com seus clientes através de NFC. Basta aproximar um celular compatível — sem
                nenhuma necessidade de instalar aplicativos.
              </p>

              <div className="p-4 border border-[#C6FF00]/30 bg-[#121212]/80">
                <span className="font-mono-tabular text-[11px] font-bold uppercase tracking-[0.16em] text-[#C6FF00] block mb-1">
                  CONDIÇÕES ESPECIAIS PARA EMPRESAS
                </span>
                <p className="text-xs text-[#F4F4F1]/75">
                  Condições diferenciadas e valores sob consulta para pedidos em quantidade e
                  redes de múltiplos pontos físicos.
                </p>
              </div>

              <a
                href="/contato?servico=VULTO+TAP"
                onClick={(e) => handleNav(e, '/contato?servico=VULTO+TAP')}
                data-cursor="cta"
                className="inline-flex items-center justify-between gap-3 w-full sm:w-auto px-7 py-3.5 bg-[#C6FF00] text-[#0A0A0A] text-xs font-bold uppercase tracking-[0.08em] hover:bg-[#d4ff33] transition-colors group cursor-pointer"
              >
                <span>CONVERSAR SOBRE VULTO TAP</span>
                <ArrowUpRight className="w-4 h-4 stroke-[2.5] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>

            {/* Coluna Direita: Destinos configuráveis com ícones específicos! */}
            <div className="lg:col-span-7 border border-[#F4F4F1]/12 bg-[#121212] p-5 sm:p-6 space-y-4">
              <span className="font-mono-tabular text-xs uppercase tracking-[0.18em] text-[#C6FF00] font-semibold block">
                DESTINOS CONFIGURÁVEIS PELO VULTO TAP:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {[
                  { label: 'WhatsApp direto', icon: MessageSquare },
                  { label: 'Instagram oficial', icon: Camera },
                  { label: 'Site ou Landing Page', icon: Globe },
                  { label: 'Avaliações no Google', icon: Star },
                  { label: 'Cardápio digital', icon: Utensils },
                  { label: 'Portfólio interativo', icon: Briefcase },
                  { label: 'Página personalizada', icon: Layout },
                  { label: 'Outros links estratégicos', icon: Link2 },
                ].map(({ label, icon: IconComponent }) => (
                  <div
                    key={label}
                    className="p-3 bg-[#0A0A0A] border border-[#F4F4F1]/10 flex items-center gap-2.5 text-[#F4F4F1]/85"
                  >
                    <IconComponent className="w-4 h-4 text-[#C6FF00] shrink-0" />
                    <span className="font-medium text-xs">{label}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-[#F4F4F1]/10 flex items-center justify-between text-[11px] text-[#F4F4F1]/55 font-mono-tabular">
                <span>COMPATÍVEL COM ANDROID & iOS</span>
                <span>ZERO APLICATIVO</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. SEÇÃO 04 — VULTO CARE (ACOMPANHAMENTO OPCIONAL COMPACTO)  */}
      {/* ============================================================ */}
      <section
        id="care"
        className="scroll-mt-24 sm:scroll-mt-28 py-14 sm:py-20 border-b border-[#F4F4F1]/10 bg-[#080808]"
      >
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Coluna Esquerda: Preço & Badge */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="font-mono-tabular text-xs text-[#C6FF00] font-semibold tracking-wider">
                  04
                </span>
                <span className="w-3.5 h-[1px] bg-[#C6FF00]" />
                <span className="font-mono-tabular text-xs uppercase tracking-[0.2em] text-[#C6FF00] font-semibold">
                  ACOMPANHAMENTO TÉCNICO
                </span>
              </div>

              <h2 className="font-display font-bold uppercase text-3xl sm:text-4xl lg:text-5xl text-[#F4F4F1] tracking-[-0.03em]">
                VULTO CARE
              </h2>

              <p className="font-mono-tabular text-xs uppercase tracking-[0.16em] text-[#F4F4F1]/60">
                SEU SITE SEMPRE ACOMPANHADO.
              </p>

              {/* Preço com Badge Opcional */}
              <div className="p-4 sm:p-5 border border-[#F4F4F1]/15 bg-[#121212] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-[#F4F4F1]/10 text-[#F4F4F1] font-mono-tabular text-[10px] uppercase font-bold tracking-[0.16em]">
                    OPCIONAL
                  </span>
                  <span className="font-mono-tabular text-[11px] text-[#C6FF00] font-semibold">
                    SEM FIDELIDADE
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display font-bold text-3xl text-[#F4F4F1]">
                    R$ 79,90
                  </span>
                  <span className="font-mono-tabular text-xs text-[#F4F4F1]/60 uppercase">
                    / mês
                  </span>
                </div>
                <span className="font-mono-tabular text-[11px] text-[#F4F4F1]/50 block">
                  Disponível para clientes VULTO Site.
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#F4F4F1]/75 leading-relaxed font-light">
                Para empresas que preferem deixar atualizações, manutenção e pequenos ajustes técnicos
                sob responsabilidade contínua da VULTO.
              </p>

              <a
                href="/contato?servico=Sites+%26+Sistemas"
                onClick={(e) => handleNav(e, '/contato?servico=Sites+%26+Sistemas')}
                data-cursor="cta"
                className="inline-flex items-center justify-between gap-3 w-full sm:w-auto px-6 py-3 bg-transparent border border-[#F4F4F1]/20 hover:border-[#C6FF00] text-[#F4F4F1] hover:text-[#C6FF00] text-xs font-bold uppercase tracking-[0.08em] transition-colors group cursor-pointer"
              >
                <span>QUERO SABER MAIS</span>
                <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>

            {/* Coluna Direita: Lista Prioritária e Nota Discreta */}
            <div className="lg:col-span-7 border border-[#F4F4F1]/12 bg-[#101010] p-5 sm:p-7 space-y-5">
              <div>
                <span className="font-mono-tabular text-xs uppercase tracking-[0.18em] text-[#C6FF00] font-semibold block mb-3">
                  BENEFÍCIOS PRIORITÁRIOS INCLUSOS:
                </span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-[#F4F4F1]/85">
                  {[
                    'Manutenção técnica do site',
                    'Até 2 pequenas solicitações de atualização / mês',
                    'Alteração de textos e títulos',
                    'Alteração e substituição de imagens',
                    'Correções técnicas e de código',
                    'Suporte relacionado ao domínio e e-mail',
                    'Monitoramento básico de funcionamento',
                    'Versionamento, backup e suporte prioritário',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="text-[#C6FF00] shrink-0 font-bold">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Botão sutil para ver todos os detalhes se desejar */}
              <div className="pt-3 border-t border-[#F4F4F1]/10">
                <button
                  type="button"
                  onClick={() => setShowCareFullList((prev) => !prev)}
                  className="inline-flex items-center gap-2 text-[11px] font-mono-tabular uppercase tracking-[0.12em] text-[#F4F4F1]/60 hover:text-[#C6FF00] transition-colors cursor-pointer"
                  aria-expanded={showCareFullList}
                >
                  {showCareFullList ? (
                    <Minus className="w-3 h-3 text-[#C6FF00]" />
                  ) : (
                    <Plus className="w-3 h-3 text-[#C6FF00]" />
                  )}
                  <span>
                    {showCareFullList ? 'RECOLHER BENEFÍCIOS' : 'VER TODOS OS BENEFÍCIOS ADICIONAIS'}
                  </span>
                </button>

                <AnimatePresence>
                  {showCareFullList && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden"
                    >
                      <ul className="mt-3 pt-3 border-t border-[#F4F4F1]/8 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#F4F4F1]/70">
                        <li>• Manutenção de integrações existentes (WhatsApp, formulários)</li>
                        <li>• Pequenos ajustes contínuos de SEO</li>
                        <li>• Suporte prioritário direto via WhatsApp</li>
                        <li>• Histórico e versionamento seguro de arquivos</li>
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Nota de Escopo Compacta e Discreta */}
              <div className="pt-3 border-t border-[#F4F4F1]/10">
                <p className="text-[11px] text-[#F4F4F1]/55 leading-relaxed font-mono-tabular">
                  * Nota: Não inclui redesign completo, novas funcionalidades complexas ou criação de
                  grandes páginas adicionais (avaliadas sob demanda separadamente).
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. SEÇÃO DE ECOSSISTEMA (CORRIGIDO: CSS GRID ROBUSTO, MESMA    */}
      {/*    ALTURA, MESMO ALINHAMENTO E SEM OVERFLOW)                 */}
      {/* ============================================================ */}
      <section className="py-14 sm:py-20 border-b border-[#F4F4F1]/10">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="max-w-3xl mb-10">
            <span className="font-mono-tabular text-xs uppercase tracking-[0.2em] text-[#C6FF00] font-semibold block mb-2">
              ECOSSISTEMA INTEGRADO
            </span>
            <h2 className="font-display font-bold uppercase text-2xl sm:text-4xl text-[#F4F4F1] tracking-[-0.03em]">
              SOLUÇÕES QUE CRESCEM JUNTO COM A SUA EMPRESA.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#F4F4F1]/75 leading-relaxed font-light">
              Você não precisa contratar tudo de uma vez. Começamos pela estrutura que faz sentido
              para o momento atual da sua empresa e evoluímos conforme o negócio cresce.
            </p>
          </div>

          {/* Diagrama Comercial em CSS Grid Robusto (4 Colunas Desktop, 2 Tablet, 1 Mobile) */}
          <div className="border border-[#F4F4F1]/12 bg-[#121212] p-5 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
              {/* Card 1: Vulto Site */}
              <div className="p-5 border border-[#F4F4F1]/10 bg-[#0A0A0A] flex flex-col justify-between h-full">
                <div>
                  <span className="font-mono-tabular text-[10px] text-[#C6FF00] font-bold uppercase tracking-[0.18em] block mb-1.5">
                    ETAPA 01 · BASE
                  </span>
                  <h4 className="font-display font-bold text-lg uppercase text-[#F4F4F1] mb-2">
                    VULTO SITE
                  </h4>
                  <p className="text-xs text-[#F4F4F1]/70 leading-relaxed">
                    Estrutura de alta conversão, e-mail próprio e presença oficial no ar.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-[#F4F4F1]/10 font-mono-tabular text-[11px] text-[#C6FF00] font-semibold">
                  ESTRUTURA
                </div>
              </div>

              {/* Card 2: Vulto Care */}
              <div className="p-5 border border-[#F4F4F1]/10 bg-[#0A0A0A] flex flex-col justify-between h-full">
                <div>
                  <span className="font-mono-tabular text-[10px] text-[#F4F4F1]/50 font-bold uppercase tracking-[0.18em] block mb-1.5">
                    ETAPA 02 · SUPORTE
                  </span>
                  <h4 className="font-display font-bold text-lg uppercase text-[#F4F4F1] mb-2">
                    VULTO CARE
                  </h4>
                  <p className="text-xs text-[#F4F4F1]/70 leading-relaxed">
                    Seu site monitorado, atualizado e com suporte contínuo sempre à disposição.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-[#F4F4F1]/10 font-mono-tabular text-[11px] text-[#F4F4F1]/50 font-semibold">
                  CONTINUIDADE
                </div>
              </div>

              {/* Card 3: Vulto Performance (Alinhamento rigoroso idêntico aos outros) */}
              <div className="p-5 border border-[#F4F4F1]/10 bg-[#0A0A0A] flex flex-col justify-between h-full">
                <div>
                  <span className="font-mono-tabular text-[10px] text-[#F4F4F1]/50 font-bold uppercase tracking-[0.18em] block mb-1.5">
                    ETAPA 03 · ESCALA
                  </span>
                  <h4 className="font-display font-bold text-lg uppercase text-[#F4F4F1] mb-2">
                    PERFORMANCE
                  </h4>
                  <p className="text-xs text-[#F4F4F1]/70 leading-relaxed">
                    Tráfego qualificado no Meta e Google gerando oportunidades recorrentes.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-[#F4F4F1]/10 font-mono-tabular text-[11px] text-[#F4F4F1]/50 font-semibold">
                  AQUISIÇÃO
                </div>
              </div>

              {/* Card 4: Vulto Tap */}
              <div className="p-5 border border-[#C6FF00]/30 bg-[#0A0A0A] flex flex-col justify-between h-full">
                <div>
                  <span className="font-mono-tabular text-[10px] text-[#C6FF00] font-bold uppercase tracking-[0.18em] block mb-1.5">
                    PONTO FÍSICO · NFC
                  </span>
                  <h4 className="font-display font-bold text-lg uppercase text-[#F4F4F1] mb-2">
                    VULTO TAP
                  </h4>
                  <p className="text-xs text-[#F4F4F1]/70 leading-relaxed">
                    Conectando mesas, recepções e balcões físicos diretamente ao seu ecossistema.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-[#F4F4F1]/10 font-mono-tabular text-[11px] text-[#C6FF00] font-semibold">
                  CONEXÃO DIRETA
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#F4F4F1]/10 flex flex-wrap items-center justify-between gap-3 font-mono-tabular text-[11px] text-[#F4F4F1]/45 uppercase tracking-wider">
              <span>ESTRUTURA → PRESENÇA → AQUISIÇÃO → CONVERSÃO</span>
              <span>CRESCIMENTO NO RITMO DA SUA EMPRESA</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 8. CTA FINAL — DIRETO E CONVERSOR                            */}
      {/* ============================================================ */}
      <section className="py-16 sm:py-24 relative">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#121212] border border-[#F4F4F1]/15 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C6FF00]" />
            <span className="font-mono-tabular text-xs uppercase tracking-[0.2em] text-[#C6FF00] font-semibold">
              NÃO SABE POR ONDE COMEÇAR?
            </span>
          </div>

          <h2 className="font-display font-bold uppercase text-2xl sm:text-4xl lg:text-5xl text-[#F4F4F1] tracking-[-0.03em] leading-tight">
            VAMOS ENTENDER O MOMENTO
            <br />
            <span className="text-[#C6FF00]">DA SUA EMPRESA.</span>
          </h2>

          <p className="mt-4 text-sm sm:text-base text-[#F4F4F1]/80 leading-relaxed font-light max-w-xl mx-auto">
            Cada negócio está em uma fase diferente. Conversamos com você, analisamos sua estrutura
            atual e indicamos a solução que realmente faz sentido — sem empurrar serviços
            desnecessários.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            {/* CTA Principal */}
            <a
              href="/contato"
              onClick={(e) => handleNav(e, '/contato')}
              data-cursor="cta"
              className="inline-flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-4 bg-[#C6FF00] text-[#0A0A0A] text-xs sm:text-sm font-bold uppercase tracking-[0.1em] hover:bg-[#d4ff33] transition-colors group cursor-pointer"
            >
              <span>FALAR COM A VULTO</span>
              <ArrowUpRight className="w-4 h-4 stroke-[2.5] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>

            {/* CTA Secundário WhatsApp */}
            <a
              href={whatsappInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="cta"
              className="inline-flex items-center justify-center gap-3 w-full sm:w-auto px-7 py-4 bg-transparent border border-[#F4F4F1]/20 hover:border-[#C6FF00] text-[#F4F4F1] hover:text-[#C6FF00] text-xs sm:text-sm font-bold uppercase tracking-[0.1em] transition-colors group cursor-pointer"
            >
              <span>FALAR PELO WHATSAPP</span>
              <ArrowUpRight className="w-4 h-4 stroke-[2.5] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
