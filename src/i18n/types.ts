export type Locale = 'pt-BR' | 'pt-PT';

export interface LocalizedService {
  id: string;
  number: string;
  slug: string;
  title: string;
  dropdownLabel: string;
  footerLabel: string;
  shortDescription: string;
  extendedDescription: string;
  capabilities: string[];
  deliverables: {
    title: string;
    detail: string;
  }[];
  architectureSteps: {
    step: string;
    label: string;
    detail: string;
  }[];
  isNfcSpecial?: boolean;
  isAiSpecial?: boolean;
}

export interface LocalizedMetric {
  index: string;
  value: string;
  label: string;
  description: string;
}

export interface LocalizedProcessStep {
  number: string;
  title: string;
  headline: string;
  description: string;
  deliverableNote: string;
}

export interface LocalizedCorePillar {
  number: string;
  title: string;
  subtitle: string;
  description: string;
  keywords: string[];
}

export interface LocalizedAboutConcept {
  index: string;
  title: string;
  detail: string;
}

export interface LocalizedChatOption {
  id: string;
  question: string;
  answer: string;
  actions: {
    label: string;
    type: 'whatsapp' | 'route' | 'scroll-contact' | 'reset';
    target?: string;
    primary?: boolean;
  }[];
}

export interface LocalizedDirectContact {
  id: string;
  cardTitle: string;
  name: string;
  role: string;
  desc: string;
  buttonText: string;
  phoneFormatted: string;
  whatsappNumber: string;
  message: string;
  link: string;
}

export interface LocalizedNfcFeature {
  id: string;
  label: string;
  previewText: string;
}

export interface TranslationDictionary {
  locale: Locale;
  localeName: string;
  countryCode: string;

  header: {
    home: string;
    services: string;
    cases: string;
    about: string;
    contact: string;
    structureAndServices: string;
    seeAll: string;
    ctaTalk: string;
    selectLanguage: string;
    brazil: string;
    portugal: string;
    openMenu: string;
    closeMenu: string;
  };

  footer: {
    tagline: string;
    description: string;
    navigationTitle: string;
    servicesTitle: string;
    socialTitle: string;
    contactTitle: string;
    home: string;
    services: string;
    about: string;
    contact: string;
    copyright: string;
    allRightsReserved: string;
    labSubtitle: string;
  };

  hero: {
    kicker: string;
    typedWords: string[];
    headlineLine1: string;
    headlineLine2: string;
    headlineLine3: string;
    support: string;
    ctaTalk: string;
    ctaSolutions: string;
    marketPresence: string;
  };

  socialProof: {
    kicker: string;
    heading: string;
    subheading: string;
    corporateTitle: string;
    creatorsTitle: string;
    creatorsHighlightNumber: string;
    creatorsHighlightText: string;
  };

  metricsBar: {
    ariaLabel: string;
    items: LocalizedMetric[];
  };

  whatWeDo: {
    kicker: string;
    headingLine1: string;
    headingLine2: string;
    support: string;
    cta: string;
    pillars: LocalizedCorePillar[];
  };

  servicesList: {
    kicker: string;
    heading: string;
    seeFullArchitecture: string;
    exploreService: string;
  };

  differential: {
    kicker: string;
    headingLine1: string;
    headingLine2: string;
    headingLine3: string;
    headingLine4: string;
    headingHighlight: string;
    support: string;
    cta: string;
    conventionalTitle: string;
    conventionalItems: string[];
    vultoTitle: string;
    vultoItems: string[];
  };

  process: {
    kicker: string;
    heading: string;
    counterLabel: string;
    stepPrefix: string;
    steps: LocalizedProcessStep[];
  };

  aboutSection: {
    kicker: string;
    headingLine1: string;
    headingLine2: string;
    monogramTitle: string;
    monogramSubtitle: string;
    p1: string;
    p2: string;
    p3: string;
    p4: string;
    ctaPhilosophy: string;
    concepts: LocalizedAboutConcept[];
  };

  nfcSection: {
    kicker: string;
    badge1: string;
    badge2: string;
    badge3: string;
    headingLine1: string;
    headingLine2: string;
    description: string;
    buttonCta: string;
    buttonSpecs: string;
    featuresTitle: string;
    features: LocalizedNfcFeature[];
  };

  contactSection: {
    kicker: string;
    headingLine1: string;
    headingLine2: string;
    subtitle: string;
    directSupportTitle: string;
    directSupportSubtitle: string;
    formKicker: string;
    formTitle: string;
    nameLabel: string;
    namePlaceholder: string;
    companyLabel: string;
    companyPlaceholder: string;
    whatsappLabel: string;
    whatsappPlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    serviceLabel: string;
    serviceOptions: string[];
    messageLabel: string;
    messagePlaceholder: string;
    submitButton: string;
    submittingButton: string;
    successBadge: string;
    successTitle: string;
    successSummary: string;
    newSubmissionButton: string;
    emailCommercialTitle: string;
    officialNetworksTitle: string;
    internationalPresenceTitle: string;
    marketsText: string;
    errors: {
      name: string;
      company: string;
      whatsapp: string;
      email: string;
      service: string;
      message: string;
      genericSubmit: string;
      connectionError: string;
    };
    directContacts: LocalizedDirectContact[];
  };

  vultoChat: {
    title: string;
    subtitle: string;
    hello: string;
    howCanWeHelp: string;
    selectOption: string;
    options: LocalizedChatOption[];
    restartConversation: string;
    closeAssistant: string;
    openAssistant: string;
  };

  // Dedicated Pages
  pages: {
    paidMedia: {
      kicker: string;
      heroTitle1: string;
      heroTitle2: string;
      heroSubtitle: string;
      heroCta: string;
      visionKicker: string;
      visionTitle: string;
      p1: string;
      p2: string;
      p3: string;
      quote: string;
      capabilities: { title: string; desc: string }[];
    };
    sitesSistemas: {
      kicker: string;
      heroTitle1: string;
      heroTitle2: string;
      heroSubtitle: string;
      heroCta: string;
      visionKicker: string;
      visionTitle: string;
      p1: string;
      p2: string;
      quote: string;
      capabilities: { title: string; desc: string }[];
    };
    copywriting: {
      kicker: string;
      heroTitle1: string;
      heroTitle2: string;
      heroSubtitle: string;
      heroCta: string;
      visionKicker: string;
      visionTitle: string;
      p1: string;
      p2: string;
      p3: string;
      quote: string;
      creatorsKicker: string;
      capabilities: { title: string; desc: string }[];
    };
    vultoTap: {
      kicker: string;
      heroTitle1: string;
      heroTitle2: string;
      heroSubtitle: string;
      heroCta: string;
      visionKicker: string;
      visionTitle: string;
      p1: string;
      p2: string;
      capabilities: { title: string; desc: string }[];
    };
    ai: {
      kicker: string;
      heroTitle1: string;
      heroTitle2: string;
      heroSubtitle: string;
      heroCta: string;
      visionKicker: string;
      visionTitle: string;
      p1: string;
      p2: string;
      capabilities: { title: string; desc: string }[];
      comparisonTitle: string;
      traditionalTitle: string;
      traditionalItems: string[];
      vultoAiTitle: string;
      vultoAiItems: string[];
    };
    cases: {
      kicker: string;
      heroTitle1: string;
      heroTitle2: string;
      heroSubtitle: string;
      heroCta: string;
      creatorsKicker: string;
      creatorsViewsNumber: string;
      creatorsViewsText: string;
      businessKicker: string;
      businessMetrics: { val: string; label: string }[];
    };
    about: {
      kicker: string;
      heroTitle1: string;
      heroTitle2: string;
      heroTitle3: string;
      heroSubtitle: string;
      historyP1: string;
      historyP2: string;
      quote: string;
      stat1Number: string;
      stat1Label: string;
      stat2Number: string;
      stat2Label: string;
      stat3Number: string;
      stat3Label: string;
    };
    services: {
      kicker: string;
      heroTitle1: string;
      heroTitle2: string;
      heroSubtitle: string;
      fieldOfActivity: string;
      explorePrefix: string;
      requestScope: string;
      scopeApplications: string;
      deliverablesKicker: string;
      processKicker: string;
    };
    serviceDetail: {
      backToServices: string;
      requestProposal: string;
      strategicVision: string;
      howWeOperatePrefix: string;
      scopeItems: string;
      deliverables: string;
      stepByStep: string;
      contactHeading: string;
      contactSub: string;
    };
  };

  servicesData: LocalizedService[];
}
