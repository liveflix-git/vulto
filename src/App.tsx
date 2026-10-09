import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { VultoChat } from './components/VultoChat';
import { CustomCursor } from './components/CustomCursor';
import { HomePage } from './pages/HomePage';
import { PaidMediaPage } from './pages/PaidMediaPage';
import { SitesSistemasPage } from './pages/SitesSistemasPage';
import { CopywritingPage } from './pages/CopywritingPage';
import { VultoTapPage } from './pages/VultoTapPage';
import { InteligenciaArtificialPage } from './pages/InteligenciaArtificialPage';
import { CasesPage } from './pages/CasesPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { ServicesPage } from './pages/ServicesPage';
import { ServiceDetailPage } from './pages/ServiceDetailPage';
import { SERVICES_DATA } from './data/siteData';
import { DashboardApp } from './dashboard/DashboardApp';
import { LanguageProvider, useLanguage } from './context/LanguageContext';

function AppContent() {
  const { locale, setLocale } = useLanguage();

  const [route, setRoute] = useState<string>(() => {
    return window.location.pathname + window.location.search;
  });

  useEffect(() => {
    const handlePopState = () => {
      setRoute(window.location.pathname + window.location.search);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = useCallback((targetPath: string) => {
    if (targetPath.includes('#')) {
      const [pathPart, hashPart] = targetPath.split('#');
      const currentNormalized = window.location.pathname.replace(/\/+$/, '') || '/';
      const targetNormalized = pathPart.replace(/\/+$/, '') || '/';

      if (pathPart === '' || targetNormalized === currentNormalized) {
        if (hashPart) {
          const el = document.getElementById(hashPart);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
            return;
          }
        }
      }
    }

    if (targetPath !== window.location.pathname + window.location.search) {
      window.history.pushState({}, '', targetPath);
      setRoute(targetPath);
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }, [route]);

  const [pathname, searchString] = route.split('?');
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  const searchParams = new URLSearchParams(searchString || '');
  const preselectedService = searchParams.get('servico') || '';

  useEffect(() => {
    const isPT = locale === 'pt-PT';
    if (normalizedPath === '/') {
      document.title = 'Vulto Lab | Tráfego Pago, Sites e Estratégia Digital';
    } else if (normalizedPath === '/paid-media') {
      document.title = 'Paid Media | Vulto Lab — Performance & Tráfego Pago';
    } else if (normalizedPath === '/sites-sistemas') {
      document.title = 'Sites & Sistemas | Vulto Lab — Engenharia & Sistemas';
    } else if (normalizedPath === '/copywriting') {
      document.title = 'Copywriting | Vulto Lab — Mensagem & Persuasão';
    } else if (normalizedPath === '/vulto-tap') {
      document.title = 'VULTO TAP | Vulto Lab — Soluções NFC';
    } else if (normalizedPath === '/inteligencia-artificial') {
      document.title = 'Inteligência Artificial | Vulto Lab — Atendimento 24/7';
    } else if (normalizedPath === '/cases') {
      document.title = isPT
        ? 'Casos & Experiência | Vulto Lab'
        : 'Cases & Experiência | Vulto Lab';
    } else if (normalizedPath === '/sobre') {
      document.title = isPT
        ? 'Sobre a Vulto Lab | Estratégia Antes da Execução'
        : 'Sobre a Vulto Lab | Estratégia Antes de Execução';
    } else if (normalizedPath === '/contato') {
      document.title = isPT
        ? 'Contacto | Vulto Lab — Vamos Construir o Próximo Resultado'
        : 'Contato | Vulto Lab — Vamos Construir o Próximo Resultado';
    } else if (normalizedPath === '/servicos') {
      document.title = 'Estrutura & Serviços | Vulto Lab';
    } else if (normalizedPath === '/dashboard/login') {
      document.title = 'Command Center — Login | Vulto Lab';
    } else if (normalizedPath === '/dashboard/clientes') {
      document.title = 'Carteira de Clientes & MRR | Vulto Lab — Core OS';
    } else if (normalizedPath === '/dashboard/financeiro' || normalizedPath === '/dashboard/crm') {
      document.title = 'Gestão Financeira & Comercial | Vulto Lab — Core OS';
    } else if (normalizedPath === '/dashboard/vulto-tap') {
      document.title = 'VULTO TAP & Estoque NFC | Vulto Lab — Core OS';
    } else if (normalizedPath === '/dashboard/projetos') {
      document.title = 'Projetos & Demandas | Vulto Lab — Core OS';
    } else if (normalizedPath.startsWith('/dashboard')) {
      document.title = 'Dashboard Executivo | Vulto Lab — Core OS';
    }
  }, [normalizedPath, locale]);

  if (normalizedPath.startsWith('/dashboard')) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-[#F4F4F1] relative selection:bg-[#C6FF00] selection:text-[#0A0A0A]">
        <DashboardApp
          currentPath={normalizedPath}
          onNavigate={handleNavigate}
          onNavigatePublic={(p) => handleNavigate(p || '/')}
        />
      </div>
    );
  }

  const renderPageContent = () => {
    if (normalizedPath === '/') {
      return <HomePage onNavigate={handleNavigate} currentLocale={locale} />;
    }

    if (normalizedPath === '/paid-media') {
      return <PaidMediaPage onNavigate={handleNavigate} />;
    }

    if (normalizedPath === '/sites-sistemas') {
      return <SitesSistemasPage onNavigate={handleNavigate} />;
    }

    if (normalizedPath === '/copywriting') {
      return <CopywritingPage onNavigate={handleNavigate} />;
    }

    if (normalizedPath === '/vulto-tap') {
      return <VultoTapPage onNavigate={handleNavigate} />;
    }

    if (normalizedPath === '/inteligencia-artificial') {
      return <InteligenciaArtificialPage onNavigate={handleNavigate} />;
    }

    if (normalizedPath === '/cases') {
      return <CasesPage onNavigate={handleNavigate} />;
    }

    if (normalizedPath === '/sobre') {
      return <AboutPage onNavigate={handleNavigate} />;
    }

    if (normalizedPath === '/contato') {
      return <ContactPage initialService={preselectedService} />;
    }

    if (normalizedPath === '/servicos') {
      return <ServicesPage onNavigate={handleNavigate} />;
    }

    if (normalizedPath.startsWith('/servicos/')) {
      const slug = normalizedPath.replace('/servicos/', '');
      const serviceItem = SERVICES_DATA.find((s) => s.slug === slug);
      if (serviceItem) {
        return <ServiceDetailPage service={serviceItem} onNavigate={handleNavigate} />;
      }
      return <ServicesPage onNavigate={handleNavigate} />;
    }

    return <HomePage onNavigate={handleNavigate} currentLocale={locale} />;
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F4F4F1] relative selection:bg-[#C6FF00] selection:text-[#0A0A0A]">
      <div
        aria-hidden="true"
        className="vulto-grain pointer-events-none fixed inset-0 z-40"
      />

      <CustomCursor />

      <Header
        currentPath={normalizedPath}
        onNavigate={handleNavigate}
        currentLocale={locale}
        onLocaleChange={setLocale}
      />

      <main id="main-content" className="relative z-10">
        {renderPageContent()}
      </main>

      <Footer onNavigate={handleNavigate} />

      <VultoChat onNavigate={handleNavigate} />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
