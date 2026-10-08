export type DashboardTab =
  | 'overview'
  | 'finance'
  | 'pipeline'
  | 'crm'
  | 'clients'
  | 'pricing'
  | 'projects'
  | 'vulto_tap'
  | 'goals'
  | 'reports';

export type PartnerId = 'felipe' | 'pietro';

export interface PartnerUser {
  id: PartnerId;
  name: string;
  role: string;
  avatarInitials: string;
  whatsapp: string;
}

export interface MetricCard {
  label: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  subtext: string;
  prefix?: string;
  badge?: string;
}

export interface FinancialTransaction {
  id: string;
  date: string;
  description: string;
  clientOrVendor: string;
  type: 'income' | 'expense';
  category: 'Retainer Mensal' | 'Setup & Dev' | 'Vulto Tap' | 'Infra & Ferramentas' | 'Tráfego & Anúncios' | 'Impostos & Taxas' | 'Outros';
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  paymentMethod: 'PIX' | 'Boleto' | 'Cartão' | 'Transferência';
  partnerResponsible?: PartnerId;
}

export type PipelineStage =
  | 'lead'
  | 'discovery'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost';

export interface DealItem {
  id: string;
  companyName: string;
  contactName: string;
  service: string;
  monthlyValue?: number;
  setupValue?: number;
  totalEstimated: number;
  stage: PipelineStage;
  probability: number;
  owner: PartnerId;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  priority: 'alta' | 'media' | 'baixa';
}

export interface ClientRecord {
  id: string;
  companyName: string;
  legalName?: string;
  contactName: string;
  email: string;
  phone: string;
  status: 'active' | 'onboarding' | 'paused' | 'churned';
  services: string[];
  monthlyRetainer: number;
  setupPaid: number;
  startDate: string;
  renewalDate?: string;
  leadOwner: PartnerId;
  health: 'excelente' | 'estavel' | 'atencao';
  notes?: string;
}

export interface ProjectTask {
  id: string;
  title: string;
  completed: boolean;
  assignedTo: PartnerId;
}

export interface ProjectRecord {
  id: string;
  title: string;
  clientName: string;
  serviceType: string;
  leadPartner: PartnerId;
  status: 'planning' | 'in_progress' | 'review' | 'delivered';
  deadline: string;
  progressPercent: number;
  tasks: ProjectTask[];
  deliverableLink?: string;
}

export interface VultoTapBatch {
  id: string;
  clientOrProject: string;
  quantity: number;
  cardType: 'Matte Black NFC' | 'Metal Black NFC' | 'Brushed Steel' | 'Custom UV Color';
  unitCost: number;
  unitPrice: number;
  status: 'design' | 'engraving' | 'shipped' | 'delivered';
  destinationCity: string;
  orderDate: string;
  tagsEnabled: boolean;
}

export interface GoalItem {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: 'R$' | 'un' | 'clientes' | '%';
  category: 'Faturamento' | 'Clientes' | 'Vulto Tap' | 'Eficiência';
  deadline: string;
}

export interface ServiceCatalogItem {
  id: string;
  category: string;
  title: string;
  baseSetupPrice: number;
  suggestedMonthly: number;
  scopeSummary: string;
  deliverables: string[];
  estimatedDeliveryDays: number;
  marginPercent: number;
}

export interface DashboardState {
  currentUser: PartnerId;
  transactions: FinancialTransaction[];
  deals: DealItem[];
  clients: ClientRecord[];
  projects: ProjectRecord[];
  batches: VultoTapBatch[];
  goals: GoalItem[];
}

