import React from 'react';
import { HeroSection } from '../components/HeroSection';
import { SocialProofSection } from '../components/SocialProofSection';
import { MetricsBar } from '../components/MetricsBar';
import { ServicesEditorialList } from '../components/ServicesEditorialList';
import { WhatWeDoSection } from '../components/WhatWeDoSection';
import { DifferentialSection } from '../components/DifferentialSection';
import { ProcessSection } from '../components/ProcessSection';
import { OfficeSection } from '../components/OfficeSection';
import { AboutSection } from '../components/AboutSection';
import { ContactSection } from '../components/ContactSection';

interface HomePageProps {
  onNavigate: (path: string) => void;
  currentLocale: 'pt-BR' | 'pt-PT';
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, currentLocale }) => {
  return (
    <>
      <HeroSection onNavigate={onNavigate} currentLocale={currentLocale} />
      <SocialProofSection />
      <MetricsBar />
      <ServicesEditorialList onNavigate={onNavigate} />
      <WhatWeDoSection />
      <DifferentialSection onNavigate={onNavigate} />
      <ProcessSection />
      <OfficeSection onNavigate={onNavigate} />
      <AboutSection onNavigate={onNavigate} showMoreLink={true} />
      <ContactSection />
    </>
  );
};

