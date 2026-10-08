export interface PartnerBrand {
  id: string;
  name: string;
  type: 'corporate' | 'creator';
  subtext?: string;
  logoLetter: string;
}

export interface MetricItem {
  id: string;
  value: string;
  numericTarget: number;
  prefix?: string;
  suffix?: string;
  label: string;
  detail: string;
}

export interface ServiceItem {
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

export interface ProcessStep {
  number: string;
  title: string;
  headline: string;
  description: string;
  deliverableNote: string;
}

export interface CaseCategory {
  id: string;
  category: string;
  highlight: string;
  title: string;
  description: string;
  scope: string[];
}

export interface OperationalPillar {
  number: string;
  title: string;
  description: string;
}

export interface ChatActionButton {
  label: string;
  type: 'whatsapp' | 'route' | 'scroll-contact' | 'reset';
  target?: string;
  primary?: boolean;
}

export interface ChatOption {
  id: string;
  question: string;
  answer: string;
  actions: ChatActionButton[];
}

export const BRAND_CONFIG = {
  name: 'VULTO LAB',
  shortName: 'VULTO',
  tagline: 'Paid Media · Copy · Web · NFC · IA',
  slogan: 'Elevamos o patamar digital da sua empresa.',
  subSlogan: 'Estratégia, conversão & tecnologia.',
  heroKicker: 'ACQUISITION & CONVERSION',
  whatsappNumber: '5511999999999',
  whatsappDefaultMessage:
    'Olá! Vim pelo site da VULTO LAB e gostaria de conversar sobre um projeto.',
  email: 'contato@vultolab.company',
  instagramUrl: 'https://instagram.com/vulto.lab',
  instagramHandle: '@vulto.lab',
  linkedinUrl: 'https://linkedin.com/company/vultolab',
  year: 2026,
};

export interface DirectTeamContact {
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

export const DIRECT_TEAM_CONTACTS: DirectTeamContact[] = [
  {
    id: 'felipe',
    cardTitle: 'FALE COM FELIPE',
    name: 'Felipe',
    role: 'Projetos & Estratégia',
    desc: 'Projetos & Estratégia',
    buttonText: 'FALAR COM FELIPE',
    phoneFormatted: '+55 13 98225-2557',
    whatsappNumber: '5513982252557',
    message: 'Olá, Felipe! Vim pelo site da VULTO LAB e gostaria de conversar sobre um projeto.',
    link: 'https://wa.me/5513982252557?text=' + encodeURIComponent('Olá, Felipe! Vim pelo site da VULTO LAB e gostaria de conversar sobre um projeto.'),
  },
  {
    id: 'pietro',
    cardTitle: 'FALE COM PIETRO',
    name: 'Pietro',
    role: 'Parcerias & Comercial',
    desc: 'Parcerias & Comercial',
    buttonText: 'FALAR COM PIETRO',
    phoneFormatted: '+55 21 97348-6125',
    whatsappNumber: '5521973486125',
    message: 'Olá, Pietro! Vim pelo site da VULTO LAB e gostaria de conversar sobre um projeto.',
    link: 'https://wa.me/5521973486125?text=' + encodeURIComponent('Olá, Pietro! Vim pelo site da VULTO LAB e gostaria de conversar sobre um projeto.'),
  },
];

export function getWhatsAppLink(customMessage?: string): string {
  const msg = encodeURIComponent(customMessage || BRAND_CONFIG.whatsappDefaultMessage);
  return `https://wa.me/${BRAND_CONFIG.whatsappNumber}?text=${msg}`;
}

/**
 * MÍDIAS E PROVA SOCIAL (Marcas Corporativas & Criadores)
 */
export const CORPORATE_PARTNERS: PartnerBrand[] = [
  { id: 'ktm', name: 'KTM AutoStar', type: 'corporate', subtext: 'Automotivo & Performance', logoLetter: 'KTM' },
  { id: 'toyota', name: 'Toyota Toyoserra', type: 'corporate', subtext: 'Concessionária Toyota', logoLetter: 'TOYOTA' },
  { id: 'pacheco', name: 'Drogarias Pacheco', type: 'corporate', subtext: 'Rede Varejo Farma', logoLetter: 'PACHECO' },
  { id: 'multiplan', name: 'Multiplan', type: 'corporate', subtext: 'Shopping Centers & Real Estate', logoLetter: 'MULTIPLAN' },
  { id: 'gwm', name: 'GWM Alta', type: 'corporate', subtext: 'Mobilidade Elétrica & Híbrida', logoLetter: 'GWM' },
];

export const CREATOR_PARTNERS: PartnerBrand[] = [
  { id: 'rafa-luiz', name: 'Rafa & Luiz', type: 'creator', subtext: '+35 milhões de inscritos', logoLetter: '35M+' },
  { id: 'juliana-baltar', name: 'Juliana Baltar', type: 'creator', subtext: '+20 milhões de inscritos', logoLetter: '20M+' },
  { id: 'family-fun', name: 'Family Fun 5', type: 'creator', subtext: '+2 milhões de inscritos', logoLetter: '2M+' },
  { id: 'lugin', name: 'Lugin', type: 'creator', subtext: '+2 milhões de inscritos', logoLetter: '2M+' },
];

/**
 * MÉTRICAS / IMPACTO CONFIGURÁVEL
 */
export const COMPANY_METRICS = {
  companies: '30+',
  views: '2B+',
  leads: '10K+',
  impressions: '20M+',
  markets: 2,
};

export const METRIC_ITEMS: MetricItem[] = [
  {
    id: 'companies',
    value: '+30',
    numericTarget: 30,
    prefix: '+',
    suffix: '',
    label: 'EMPRESAS ATENDIDAS',
    detail: 'Estruturas de aquisição e branding implementadas para negócios reais.',
  },
  {
    id: 'views',
    value: '+2 BI',
    numericTarget: 2,
    prefix: '+',
    suffix: ' BI',
    label: 'VISUALIZAÇÕES EM PROJETOS',
    detail: 'Alcance massivo gerado em projetos e audiências associadas.',
  },
  {
    id: 'leads',
    value: '+10 MIL',
    numericTarget: 10,
    prefix: '+',
    suffix: ' MIL',
    label: 'LEADS GERADOS',
    detail: 'Oportunidades comerciais reais direcionadas para funis de venda.',
  },
  {
    id: 'impressions',
    value: '+20 MI',
    numericTarget: 20,
    prefix: '+',
    suffix: ' MI',
    label: 'IMPRESSÕES DIGITAIS',
    detail: 'Exposição de marca qualificada em campanhas de mídia paga e conteúdo.',
  },
  {
    id: 'markets',
    value: 'BR + PT',
    numericTarget: 2,
    prefix: '',
    suffix: ' MERCADOS',
    label: 'ATUAÇÃO INTERNACIONAL',
    detail: 'Projetos e operações ativas no Brasil e em Portugal.',
  },
];

/**
 * SERVIÇOS DA VULTO LAB (01 ao 05)
 */
export const SERVICES_DATA: ServiceItem[] = [
  {
    id: 'paid-media',
    number: '01',
    slug: 'paid-media',
    title: 'PAID MEDIA',
    dropdownLabel: 'Paid Media',
    footerLabel: 'Paid Media',
    shortDescription: 'Tráfego é distribuição. Performance é estratégia.',
    extendedDescription:
      'Paid Media é uma das principais frentes da VULTO LAB. Planejamos, estruturamos e otimizamos campanhas em plataformas como Meta Ads e Google Ads para empresas de diferentes segmentos.\n\nNossa atuação não termina no clique. Analisamos oferta, criativo, copy, página, rastreamento e jornada para entender o que realmente influencia o resultado.',
    capabilities: [
      'Meta Ads',
      'Google Ads',
      'Remarketing',
      'Tracking & Analytics',
      'Funis de Aquisição',
      'Lead Generation',
      'Otimização de ROAS',
    ],
    deliverables: [
      {
        title: 'ESTRATÉGIA DE MÍDIA',
        detail: 'Estrutura de campanhas baseada em objetivo e estágio do negócio.',
      },
      {
        title: 'TRACKING & MENSURAÇÃO',
        detail: 'Eventos, pixels, API de conversão e GTM configurados para decisões melhores.',
      },
      {
        title: 'OTIMIZAÇÃO & LEADS',
        detail: 'Análise contínua de campanhas, criativos e foco em oportunidades comerciais.',
      },
    ],
    architectureSteps: [
      {
        step: '01',
        label: 'MAPEAMENTO & INTENÇÃO',
        detail: 'Análise de demanda qualificada, concorrentes e definição de investimento.',
      },
      {
        step: '02',
        label: 'ARQUITETURA & TRACKING',
        detail: 'Configuração técnica de rastreamento de eventos e estruturação de públicos.',
      },
      {
        step: '03',
        label: 'ESCALA DE OPORTUNIDADES',
        detail: 'Testes sistemáticos de criativos e otimização focada em custo por oportunidade.',
      },
    ],
  },
  {
    id: 'sites-sistemas',
    number: '02',
    slug: 'sites-sistemas',
    title: 'SITES & SISTEMAS',
    dropdownLabel: 'Sites & Sistemas',
    footerLabel: 'Sites & Sistemas',
    shortDescription:
      'Sites, landing pages, sistemas, integrações e ecossistemas digitais.',
    extendedDescription:
      'Criamos estruturas digitais utilizando tecnologias modernas, arquitetura escalável e experiências pensadas para conversão.\n\nNossa operação reúne desenvolvimento, UX, estratégia e automação para entregar projetos rápidos sem comprometer qualidade.\n\nDo site institucional ao ecossistema completo, construímos soluções adaptadas à operação de cada empresa.',
    capabilities: [
      'Sites Institucionais',
      'Landing Pages',
      'Sistemas Web',
      'Automações',
      'Ecossistemas Digitais',
      'Integrações & APIs',
      'SEO Técnico & Performance',
    ],
    deliverables: [
      {
        title: 'SITES & LANDING PAGES',
        detail: 'Interfaces modernas, velozes e orientadas à aquisição e conversão.',
      },
      {
        title: 'SISTEMAS & AUTOMAÇÕES',
        detail: 'Aplicações web sob medida e integrações que reduzem trabalho manual.',
      },
      {
        title: 'ECOSSISTEMAS & INTEGRAÇÕES',
        detail: 'Conexão nativa com APIs, CRM, analytics e ferramentas empresariais.',
      },
    ],
    architectureSteps: [
      {
        step: '01',
        label: 'ARQUITETURA & UX',
        detail: 'Mapeamento da jornada, fluxo de conversão e estrutura de dados.',
      },
      {
        step: '02',
        label: 'DIREÇÃO DE ARTE & CÓDIGO',
        detail: 'Design exclusivo minimalista e desenvolvimento web de alta performance.',
      },
      {
        step: '03',
        label: 'INTEGRAÇÃO & PUBLICAÇÃO',
        detail: 'Conexão de formulários, CRM, testes de velocidade e deploy contínuo.',
      },
    ],
  },
  {
    id: 'copywriting',
    number: '03',
    slug: 'copywriting',
    title: 'COPYWRITING',
    dropdownLabel: 'Copywriting',
    footerLabel: 'Copywriting',
    shortDescription:
      'Mensagem, posicionamento e persuasão construídos para transformar atenção em ação.',
    extendedDescription:
      'Copywriting é uma das frentes centrais da VULTO LAB. Palavras também são infraestrutura.\n\nCriamos conceitos, anúncios, ofertas, páginas, roteiros e estruturas de comunicação para empresas e criadores.\n\nNosso trabalho já esteve presente em projetos de canais com audiências de milhões de pessoas.',
    capabilities: [
      'Copy para Anúncios',
      'Landing Pages',
      'Estrutura de Ofertas',
      'Roteiros para Vídeo',
      'Títulos & Headlines',
      'Posicionamento de Marca',
      'Comunicação Comercial',
    ],
    deliverables: [
      {
        title: 'POSICIONAMENTO DE MARCA',
        detail: 'Definição da narrativa central, tom de voz e proposta única de valor.',
      },
      {
        title: 'COPY PARA ANÚNCIOS & WEBSITES',
        detail: 'Headlines, blocos de persuasão e chamadas diretas para ação.',
      },
      {
        title: 'ROTEIROS DE ALTO IMPACTO',
        detail: 'Estruturação de ganchos visuais e verbais para retenção em vídeos.',
      },
    ],
    architectureSteps: [
      {
        step: '01',
        label: 'IMERSÃO NA OFERTA',
        detail: 'Estudo das dores do cliente, objeções do mercado e nível de consciência.',
      },
      {
        step: '02',
        label: 'TESE DE PERSUASÃO',
        detail: 'Construção do argumento central, diferenciais e linha narrativa.',
      },
      {
        step: '03',
        label: 'REDAÇÃO & REFINAMENTO',
        detail: 'Redação cirúrgica com ganchos claros e CTAs de alta conversão.',
      },
    ],
  },
  {
    id: 'vulto-tap',
    number: '04',
    slug: 'vulto-tap',
    title: 'VULTO TAP',
    dropdownLabel: 'VULTO TAP',
    footerLabel: 'VULTO TAP',
    shortDescription:
      'Conectamos o ambiente físico à experiência digital através de NFC.',
    extendedDescription:
      'A VULTO TAP produz soluções físicas personalizadas com tecnologia NFC. Transformamos o contato presencial em um ponto de acesso instantâneo para o seu ecossistema digital.\n\nCom um único toque no smartphone, seu cliente acessa avaliações no Google, conexão Wi-Fi, WhatsApp, cardápios, catálogos, contatos ou páginas exclusivas.',
    capabilities: [
      'Avaliações no Google',
      'Conexão Wi-Fi Direta',
      'WhatsApp Comercial',
      'Cardápios & Catálogos',
      'Redes Sociais & Links',
      'Contatos Digital (vCard)',
      'Portfólios & Páginas NFC',
    ],
    isNfcSpecial: true,
    deliverables: [
      {
        title: 'DISPOSITIVOS FÍSICOS TAP',
        detail: 'Cartões e placas físicas com acabamento premium e tecnologia NFC embutida.',
      },
      {
        title: 'CENTRAL DIGITAL DE AÇÃO',
        detail: 'Página mobile rápida projetada para direcionar a ação do cliente em 1 toque.',
      },
      {
        title: 'SEM APLICATIVOS',
        detail: 'Compatibilidade nativa com iOS e Android via NFC e QR Code de apoio.',
      },
    ],
    architectureSteps: [
      {
        step: '01',
        label: 'CLIENTE',
        detail: 'O cliente interage fisicamente com a sua empresa ou cartão profissional.',
      },
      {
        step: '02',
        label: 'APROXIMA O CELULAR',
        detail: 'Approximação NFC instantânea sem necessidade de baixar aplicativos.',
      },
      {
        step: '03',
        label: 'AÇÃO DIGITAL',
        detail: 'Abertura imediata do WhatsApp, avaliação, Wi-Fi ou perfil personalizado.',
      },
    ],
  },
  {
    id: 'inteligencia-artificial',
    number: '05',
    slug: 'inteligencia-artificial',
    title: 'INTELIGÊNCIA ARTIFICIAL',
    dropdownLabel: 'Inteligência Artificial',
    footerLabel: 'Inteligência Artificial',
    shortDescription:
      'Atendimento, automações e agentes inteligentes.',
    extendedDescription:
      'Criamos estruturas de atendimento baseadas em inteligência artificial para empresas que querem responder mais rápido, reduzir tarefas repetitivas e melhorar a experiência do cliente.\n\nAgentes inteligentes treinados para atender, orientar, qualificar e encaminhar seus clientes 24 horas por dia, 7 dias por semana.',
    capabilities: [
      'Atendimento 24/7',
      'FAQ Inteligente',
      'Qualificação de Leads',
      'Pré-Atendimento',
      'Captura de Informações',
      'Encaminhamento para Humano',
      'Suporte & Automações',
      'Integração CRM & APIs',
    ],
    isAiSpecial: true,
    deliverables: [
      {
        title: 'AGENTES DE ATENDIMENTO',
        detail: 'Estruturas de IA treinadas na linguagem, produtos e regras do seu negócio.',
      },
      {
        title: 'QUALIFICAÇÃO & CAPTURA',
        detail: 'Coleta automática de dados do cliente e direcionamento para a equipe certa.',
      },
      {
        title: 'INTEGRAÇÃO DE CANAIS',
        detail: 'Conexão com Website, CRM, formulários, APIs e fluxos de atendimento.',
      },
    ],
    architectureSteps: [
      {
        step: '01',
        label: 'MAPEAMENTO DE FLUXOS',
        detail: 'Identificação de perguntas frequentes, gargalos de atendimento e regras.',
      },
      {
        step: '02',
        label: 'TREINAMENTO DA BASE',
        detail: 'Alimentação da IA com dados oficiais da empresa, tom de voz e respostas.',
      },
      {
        step: '03',
        label: 'IMPLANTAÇÃO & AUTOMAÇÃO',
        detail: 'Publicação do agente inteligente com transição suave para atendimento humano.',
      },
    ],
  },
];

/**
 * SEÇÃO DE CASES (Creators, Business, Paid Media, Digital Systems)
 */
export const CASES_CATEGORIES: CaseCategory[] = [
  {
    id: 'creators',
    category: 'CREATORS',
    highlight: '+2 BI VIEWS',
    title: 'AUDIÊNCIAS MASSIVAS & ESTRUTURA',
    description: '+2 bilhões de visualizações associadas aos projetos e canais atendidos.',
    scope: ['Copywriting', 'Estratégia de Conteúdo', 'Branding', 'NFC Tap'],
  },
  {
    id: 'business',
    category: 'BUSINESS',
    highlight: '+30 EMPRESAS',
    title: 'OPERAÇÕES CORPORATIVAS & VAREJO',
    description: '+30 empresas atendidas com posicionamento, páginas e aquisição digital.',
    scope: ['Sites & Sistemas', 'Paid Media', 'Posicionamento', 'Automações'],
  },
  {
    id: 'paid-media',
    category: 'PAID MEDIA',
    highlight: '+10 MIL LEADS',
    title: 'AQUISIÇÃO PAGA & CONVERSÃO',
    description: '+10 mil leads comerciais qualificados gerados via Meta & Google Ads.',
    scope: ['Meta Ads', 'Google Ads', 'Tracking', 'CRO'],
  },
  {
    id: 'digital-systems',
    category: 'DIGITAL SYSTEMS',
    highlight: '+20 MI IMPRESSÕES',
    title: 'TECNOLOGIA & INFRAESTRUTURA',
    description: 'Interfaces web de alta velocidade, soluções VULTO TAP e automações.',
    scope: ['Desenvolvimento Web', 'VULTO TAP', 'IA', 'Integrações'],
  },
];

/**
 * SEÇÃO EFICIÊNCIA OPERACIONAL (MELHOR CUSTO-BENEFÍCIO)
 */
export const OPERATIONAL_PILLARS: OperationalPillar[] = [
  {
    number: '01',
    title: 'CUSTO-BENEFÍCIO',
    description: 'Estrutura eficiente sem sacrificar qualidade. Investimento direcionado a quem executa.',
  },
  {
    number: '02',
    title: 'PRAZOS REAIS',
    description: 'Escopos e cronogramas definidos com clareza e sem promessas vazias.',
  },
  {
    number: '03',
    title: 'EXECUÇÃO ÁGIL',
    description: 'Processos enxutos e preparados para colocar projetos em produção rapidamente.',
  },
  {
    number: '04',
    title: 'PADRÃO DE ENTREGA',
    description: 'Design, tecnologia e performance tratados como partes do mesmo sistema.',
  },
];

/**
 * METODOLOGIA E PROCESSO (Textos Atualizados)
 */
export const PROCESS_STEPS: ProcessStep[] = [
  {
    number: '01',
    title: 'DIAGNÓSTICO',
    headline: 'Antes de executar, entendemos.',
    description:
      'Analisamos operação, posicionamento, audiência, oferta, ativos digitais, concorrência e objetivos comerciais para identificar onde estão as maiores oportunidades de crescimento.',
    deliverableNote: 'Leitura de cenário, identificação de gargalos e plano de ação.',
  },
  {
    number: '02',
    title: 'ESTRATÉGIA',
    headline: 'Cada ação precisa ter uma razão.',
    description:
      'Transformamos diagnóstico em plano: canais, mensagem, tecnologia, jornada, métricas e prioridades são definidos antes da execução.',
    deliverableNote: 'Planejamento de arquitetura, jornada do cliente e metas.',
  },
  {
    number: '03',
    title: 'EXECUÇÃO',
    headline: 'Estratégia só gera valor quando sai do papel.',
    description:
      'Colocamos campanhas, páginas, sistemas, copies e automações em produção utilizando uma operação integrada.',
    deliverableNote: 'Desenvolvimento, redação, configuração de anúncios e deploys.',
  },
  {
    number: '04',
    title: 'OTIMIZAÇÃO CONTÍNUA',
    headline: 'Performance não é um evento.',
    description:
      'Monitoramos dados, comportamento e resultados para identificar gargalos, testar hipóteses e melhorar continuamente a operação.',
    deliverableNote: 'Acompanhamento de métricas, testes A/B e evolução do sistema.',
  },
];

/**
 * RECURSOS DO VULTO TAP
 */
export const NFC_FEATURES = [
  { id: 'google', label: 'Avaliações Google', previewText: 'Link direto para coleta de avaliações 5 estrelas' },
  { id: 'wifi', label: 'Wi-Fi Automático', previewText: 'Conexão instantânea sem digitação de senha' },
  { id: 'whatsapp', label: 'WhatsApp', previewText: 'Início imediato de conversa comercial' },
  { id: 'cardapio', label: 'Cardápio / Catálogo', previewText: 'Acesso instantâneo a produtos e serviços' },
  { id: 'social', label: 'Redes Sociais', previewText: 'Instagram, LinkedIn e canais oficiais' },
  { id: 'vcard', label: 'Cartão VCard', previewText: 'Salvamento de contato na agenda em 1 toque' },
  { id: 'links', label: 'Links Personalizados', previewText: 'Página sob medida com o seu ecossistema' },
];

/**
 * OPÇÕES DO CHAT FLUTUANTE (VULTO ASSIST)
 */
export const chatOptions: ChatOption[] = [
  {
    id: 'servicos',
    question: 'Conhecer serviços',
    answer:
      'A VULTO LAB atua em 5 frentes de Digital Business: Paid Media, Sites & Sistemas, Copywriting, VULTO TAP e Inteligência Artificial.',
    actions: [
      { label: 'VER PÁGINA DE SERVIÇOS', type: 'route', target: '/servicos', primary: true },
      { label: 'SOLICITAR PROPOSTA ↗', type: 'scroll-contact' },
    ],
  },
  {
    id: 'orcamento',
    question: 'Solicitar orçamento',
    answer:
      'Cada projeto é estruturado de acordo com o objetivo e a necessidade da sua empresa. Como podemos ajudar?',
    actions: [
      { label: 'FALAR COM A VULTO ↗', type: 'whatsapp', primary: true },
      { label: 'PREENCHER BRIEFING ↗', type: 'scroll-contact' },
    ],
  },
  {
    id: 'paid-media',
    question: 'Paid Media',
    answer:
      'Planejamos, estruturamos e otimizamos campanhas no Meta Ads e Google Ads com foco em oportunidades comerciais e leads reais.',
    actions: [
      { label: 'CONHECER PAID MEDIA →', type: 'route', target: '/paid-media', primary: true },
      { label: 'FALAR NO WHATSAPP ↗', type: 'whatsapp' },
    ],
  },
  {
    id: 'sites-sistemas',
    question: 'Sites & Sistemas',
    answer:
      'Desenvolvemos sites institucionais, landing pages, sistemas web e integrações de alta performance.',
    actions: [
      { label: 'VER SITES & SISTEMAS →', type: 'route', target: '/sites-sistemas', primary: true },
      { label: 'SOLICITAR PROJETO ↗', type: 'scroll-contact' },
    ],
  },
  {
    id: 'vulto-tap',
    question: 'VULTO TAP',
    answer:
      'Soluções físicas com tecnologia NFC para avaliações Google, Wi-Fi, WhatsApp e cartões de contato instantâneos.',
    actions: [
      { label: 'CONHECER VULTO TAP →', type: 'route', target: '/vulto-tap', primary: true },
      { label: 'PEDIR VULTO TAP ↗', type: 'scroll-contact' },
    ],
  },
  {
    id: 'ia',
    question: 'Inteligência Artificial',
    answer:
      'Estruturas de atendimento e agentes inteligentes treinados para atender, qualificar e encaminhar seus clientes 24/7.',
    actions: [
      { label: 'CONHECER SOLUÇÕES EM IA →', type: 'route', target: '/inteligencia-artificial', primary: true },
      { label: 'FALAR COM A VULTO ↗', type: 'whatsapp' },
    ],
  },
  {
    id: 'falar-com-alguem',
    question: 'Falar com alguém',
    answer:
      'Você pode falar diretamente com nossa equipe no WhatsApp agora ou enviar sua mensagem pelo formulário.',
    actions: [
      { label: 'FALAR NO WHATSAPP ↗', type: 'whatsapp', primary: true },
      { label: 'IR PARA CONTATO ↗', type: 'route', target: '/contato' },
    ],
  },
];

/**
 * SISTEMA DE LOCALES BRASIL (PT-BR) / PORTUGAL (PT-PT)
 */
export const LOCALES_DATA = {
  'pt-BR': {
    code: 'BR',
    flag: '🇧🇷',
    name: 'Brasil',
    heroKicker: 'ACQUISITION & CONVERSION',
    tagline: 'Paid Media · Copy · Web · NFC · IA',
    heroSupport:
      'Estratégia, tecnologia e performance trabalhando como um único sistema para fazer empresas crescerem.',
    ctaTalk: 'VAMOS CONVERSAR ↗',
    ctaSolutions: 'CONHEÇA NOSSAS SOLUÇÕES →',
    marketPresence: 'BRASIL 🇧🇷 · PORTUGAL 🇵🇹',
    contactTitle: 'TEM UM PROJETO EM MENTE?',
    contactSub: 'VAMOS CONVERSAR ↗',
  },
  'pt-PT': {
    code: 'PT',
    flag: '🇵🇹',
    name: 'Portugal',
    heroKicker: 'ACQUISITION & CONVERSION',
    tagline: 'Paid Media · Copy · Web · NFC · IA',
    heroSupport:
      'Estratégia, tecnologia e performance a trabalhar como um sistema único para impulsionar empresas.',
    ctaTalk: 'FALAR COM A EQUIPA ↗',
    ctaSolutions: 'CONHECER SOLUÇÕES →',
    marketPresence: 'PORTUGAL 🇵🇹 · BRASIL 🇧🇷',
    contactTitle: 'TEM UM PROJECTO EM MENTE?',
    contactSub: 'FALAR COM A VULTO ↗',
  },
};

export interface VultoMetric {
  index: string;
  value: string;
  label: string;
  description: string;
}

export const VULTO_METRICS: VultoMetric[] = [
  {
    index: '01',
    value: '+30',
    label: 'EMPRESAS ATENDIDAS',
    description: 'Projetos, estruturas digitais e operações realizadas para diferentes segmentos.',
  },
  {
    index: '02',
    value: '+2 BI',
    label: 'VISUALIZAÇÕES',
    description: 'Alcance acumulado em projetos e audiências de conteúdo.',
  },
  {
    index: '03',
    value: '+10 MIL',
    label: 'LEADS GERADOS',
    description: 'Oportunidades comerciais geradas através de campanhas e estruturas de aquisição.',
  },
  {
    index: '04',
    value: 'BRASIL + PORTUGAL',
    label: 'ATUAÇÃO INTERNACIONAL',
    description: 'Projetos e operações desenvolvidos nos dois mercados.',
  },
];

export const METRICS_CONCEPTS = VULTO_METRICS;

export const CORE_PILLARS = [
  {
    number: '01',
    title: 'ESTRATÉGIA',
    subtitle: 'DIAGNÓSTICO E POSICIONAMENTO',
    description: 'Toda execução bem-sucedida nasce de um diagnóstico claro. Mapeamos gargalos, concorrência e jornada para definir o caminho ideal.',
    keywords: ['DIAGNÓSTICO', 'OFERTA', 'FUNIL', 'JORNADA'],
  },
  {
    number: '02',
    title: 'CONVERSÃO',
    subtitle: 'MENSAGEM E MÍDIA PAGA',
    description: 'Transformamos atenção em ação. Combinamos anúncios no Meta e Google Ads com copywriting persuasivo e páginas preparadas para vender.',
    keywords: ['META ADS', 'GOOGLE ADS', 'COPY', 'PÁGINAS DE VENDAS'],
  },
  {
    number: '03',
    title: 'TECNOLOGIA',
    subtitle: 'SISTEMAS, NFC E IA',
    description: 'Construímos interfaces web velozes, integrações via API, cartões VULTO TAP com NFC e agentes de inteligência artificial 24/7.',
    keywords: ['WEB', 'REACT', 'VULTO TAP NFC', 'AGENTES IA'],
  },
];

export const ABOUT_CONCEPTS = [
  {
    index: '01',
    title: 'FOCO EM RESULTADO REAL',
    detail: 'Métricas de vaidade não sustentam empresas. Construímos sistemas orientados à aquisição e vendas.',
  },
  {
    index: '02',
    title: 'SISTEMA INTEGRADO',
    detail: 'Mídia, copy, web e automação trabalham sob a mesma diretriz, sem ruídos entre áreas.',
  },
  {
    index: '03',
    title: 'TECNOLOGIA MODERNA',
    detail: 'Sem templates pesados ou gambiarras. Código limpo, alta velocidade e experiência premium.',
  },
  {
    index: '04',
    title: 'ATUAÇÃO BR & PT',
    detail: 'Especialistas conectados aos mercados do Brasil e de Portugal com visão global de negócios.',
  },
];

export const FUTURE_CASES_REPOSITORY = [
  {
    id: 'case-01',
    sector: 'AUTOMOTIVO & PERFORMANCE',
    client: 'CONCESSIONÁRIA & MÍDIA PAGA',
    summary: 'Estrutura completa de geração de leads qualificados e acompanhamento de funil no setor automotivo.',
  },
  {
    id: 'case-02',
    sector: 'CRIADORES & AUDIÊNCIAS MASSIVAS',
    client: '+35M DE INSCRITOS',
    summary: 'Posicionamento de marca, copywriting e VULTO TAP para eventos presenciais e lançamentos.',
  },
];
