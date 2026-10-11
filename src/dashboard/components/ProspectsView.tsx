import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  UserPlus,
  Plus,
  Search,
  Filter,
  Kanban,
  Table as TableIcon,
  Phone,
  Mail,
  Globe,
  Instagram,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit2,
  MessageSquare,
  ArrowRight,
  UserCheck,
  Send,
  X,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  History,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  CalendarClock,
  RefreshCw,
} from 'lucide-react';
import {
  VultoProspect,
  VultoProspectInteraction,
  ProspectStatus,
  ProspectPriority,
  InteractionType,
  VultoClientServiceType,
  VultoOperator,
  VALID_PROSPECT_CHANNELS,
  ProspectChannel,
  normalizeProspectChannel,
  fetchVultoProspects,
  createVultoProspect,
  updateVultoProspect,
  deleteVultoProspect,
  convertProspectToClient,
  fetchProspectInteractions,
  createProspectInteraction,
  deleteProspectInteraction,
  fetchVultoOperators,
  getActiveOperatorSession,
} from '../../services/vultoCoreService';
import { supabase } from '../../lib/supabase';

// =====================================================================
// DEFINIÇÕES DE STATUS & CORES DO PIPELINE
// =====================================================================

export const PROSPECT_STATUSES: {
  id: ProspectStatus;
  label: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
}[] = [
  {
    id: 'novo',
    label: 'NOVO',
    badgeBg: 'bg-blue-500/10',
    badgeText: 'text-blue-400',
    borderColor: 'border-blue-500/30',
  },
  {
    id: 'em_contato',
    label: 'PRIMEIRO CONTATO',
    badgeBg: 'bg-amber-500/10',
    badgeText: 'text-amber-400',
    borderColor: 'border-amber-500/30',
  },
  {
    id: 'reuniao_agendada',
    label: 'REUNIÃO AGENDADA',
    badgeBg: 'bg-purple-500/10',
    badgeText: 'text-purple-400',
    borderColor: 'border-purple-500/30',
  },
  {
    id: 'proposta_enviada',
    label: 'PROPOSTA ENVIADA',
    badgeBg: 'bg-emerald-500/10',
    badgeText: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
  },
  {
    id: 'fechado',
    label: 'FECHADO',
    badgeBg: 'bg-[#C6FF00]/15',
    badgeText: 'text-[#C6FF00]',
    borderColor: 'border-[#C6FF00]/40',
  },
  {
    id: 'perdido',
    label: 'PERDIDO',
    badgeBg: 'bg-rose-500/10',
    badgeText: 'text-rose-400',
    borderColor: 'border-rose-500/30',
  },
];

export const PRIORITY_CONFIG: Record<
  ProspectPriority,
  { label: string; bg: string; text: string; border: string }
> = {
  baixa: { label: 'BAIXA', bg: 'bg-white/5', text: 'text-white/60', border: 'border-white/10' },
  media: { label: 'MÉDIA', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  alta: { label: 'ALTA', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  urgente: { label: 'URGENTE', bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/40' },
};

export const INTERACTION_TYPE_CONFIG: Record<
  InteractionType,
  { label: string; icon: React.ElementType; color: string }
> = {
  whatsapp: { label: 'WhatsApp', icon: MessageSquare, color: 'text-emerald-400' },
  email: { label: 'E-mail', icon: Mail, color: 'text-blue-400' },
  ligacao: { label: 'Ligação', icon: Phone, color: 'text-amber-400' },
  reuniao: { label: 'Reunião', icon: Calendar, color: 'text-purple-400' },
  direct_instagram: { label: 'Direct Instagram', icon: Instagram, color: 'text-pink-400' },
  outro: { label: 'Outro', icon: CalendarClock, color: 'text-white/60' },
};

export const CHANNEL_OPTIONS: { value: ProspectChannel; label: string }[] = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'E-mail' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'telefone', label: 'Telefone' },
  { value: 'presencial', label: 'Presencial' },
  { value: 'outro', label: 'Outro' },
];

export function getChannelLabel(raw?: string | null): string {
  const norm = normalizeProspectChannel(raw);
  const found = CHANNEL_OPTIONS.find((c) => c.value === norm);
  return found?.label || 'WhatsApp';
}

export const SERVICE_CONVERT_OPTIONS: { value: VultoClientServiceType; label: string }[] = [
  { value: 'trafego_pago', label: 'Tráfego Pago' },
  { value: 'vulto_nfc', label: 'VULTO NFC' },
  { value: 'site', label: 'Site / Sistema' },
];

/** Helper inteligente para identificar tipo de contato a partir de campo genérico */
export function detectContactReferenceType(raw: string): {
  type: 'instagram' | 'email' | 'phone' | 'contact' | 'empty';
  label: string;
} {
  const trimmed = raw.trim();
  if (!trimmed) return { type: 'empty', label: 'Opcional' };

  if (trimmed.includes('@') && trimmed.includes('.') && !trimmed.startsWith('@')) {
    return { type: 'email', label: 'E-mail identificado' };
  }

  if (trimmed.startsWith('@') || trimmed.toLowerCase().includes('instagram.com/')) {
    return { type: 'instagram', label: 'Instagram identificado' };
  }

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length >= 8 && /^[\d\s()+\-.]+$/.test(trimmed)) {
    return { type: 'phone', label: 'Telefone identificado' };
  }

  return { type: 'contact', label: 'Nome / Referência' };
}

/** Helper de status de follow-up (Atrasado / Hoje / No prazo / Sem data) */
export function getFollowUpStatus(dateStr: string | null | undefined): {
  type: 'overdue' | 'today' | 'upcoming' | 'none';
  label: string;
  badgeClass: string;
  textClass: string;
} {
  if (!dateStr) {
    return {
      type: 'none',
      label: 'Sem follow-up',
      badgeClass: 'text-white/30 border-white/10 bg-white/5',
      textClass: 'text-white/30',
    };
  }

  try {
    const target = new Date(dateStr);
    const now = new Date();

    const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
    const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    if (targetDay < todayDay) {
      return {
        type: 'overdue',
        label: 'Atrasado',
        badgeClass: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
        textClass: 'text-rose-400 font-bold',
      };
    }
    if (targetDay === todayDay) {
      return {
        type: 'today',
        label: 'Para Hoje',
        badgeClass: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
        textClass: 'text-amber-400 font-bold',
      };
    }
    return {
      type: 'upcoming',
      label: 'No prazo',
      badgeClass: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
      textClass: 'text-emerald-400',
    };
  } catch {
    return {
      type: 'none',
      label: 'Inválido',
      badgeClass: 'text-white/30 border-white/10 bg-white/5',
      textClass: 'text-white/30',
    };
  }
}

export function ProspectsView() {
  const [prospects, setProspects] = useState<VultoProspect[]>([]);
  const [operators, setOperators] = useState<VultoOperator[]>([]);
  const [loading, setLoading] = useState(true);

  // Modo de visualização: 'kanban' ou 'tabela'
  const [viewMode, setViewMode] = useState<'kanban' | 'tabela'>('kanban');

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ProspectStatus>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | ProspectPriority>('ALL');
  const [operatorFilter, setOperatorFilter] = useState<string>('ALL');
  const [followUpFilter, setFollowUpFilter] = useState<'ALL' | 'overdue' | 'today' | 'upcoming'>('ALL');

  // Modal Rápido: Novo / Editar Prospect
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProspect, setEditingProspect] = useState<VultoProspect | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);

  // Form State Simplificado (Cadastro em 10 segundos)
  const [companyName, setCompanyName] = useState('');
  const [channel, setChannel] = useState<ProspectChannel>('whatsapp');
  const [contactReference, setContactReference] = useState('');
  const [status, setStatus] = useState<ProspectStatus>('em_contato');
  const [nextContactAt, setNextContactAt] = useState('');
  const [initialNote, setInitialNote] = useState('');

  // Campos Avançados Opcionais (Preservados do modelo completo)
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [source, setSource] = useState('Outbound');
  const [serviceInterest, setServiceInterest] = useState('Tráfego Pago');
  const [priority, setPriority] = useState<ProspectPriority>('media');
  const [proposalAmount, setProposalAmount] = useState<string>('');
  const [lossReason, setLossReason] = useState('');

  // Modal Follow-up Rápido (1 clique nos cards/linhas)
  const [quickFollowUpProspect, setQuickFollowUpProspect] = useState<VultoProspect | null>(null);
  const [quickFollowUpType, setQuickFollowUpType] = useState<InteractionType>('whatsapp');
  const [quickFollowUpSummary, setQuickFollowUpSummary] = useState('');
  const [quickFollowUpNextDate, setQuickFollowUpNextDate] = useState('');
  const [isSubmittingQuickFollowUp, setIsSubmittingQuickFollowUp] = useState(false);

  // Drawer / Detalhes do Prospect
  const [selectedProspect, setSelectedProspect] = useState<VultoProspect | null>(null);
  const [interactions, setInteractions] = useState<VultoProspectInteraction[]>([]);
  const [loadingInteractions, setLoadingInteractions] = useState(false);

  // Nova Interação Form (no Drawer)
  const [newInteractionType, setNewInteractionType] = useState<InteractionType>('whatsapp');
  const [newInteractionSummary, setNewInteractionSummary] = useState('');
  const [newInteractionDetails, setNewInteractionDetails] = useState('');
  const [isSubmittingInteraction, setIsSubmittingInteraction] = useState(false);

  // Modal de Conversão em Cliente
  const [convertingProspect, setConvertingProspect] = useState<VultoProspect | null>(null);
  const [convertServiceType, setConvertServiceType] = useState<VultoClientServiceType>('trafego_pago');
  const [isConverting, setIsConverting] = useState(false);

  // Modal Exclusão
  const [prospectToDelete, setProspectToDelete] = useState<VultoProspect | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Carregar dados
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ops, res] = await Promise.all([
        fetchVultoOperators(),
        fetchVultoProspects(),
      ]);
      setOperators(ops);
      setProspects(res.data);
    } catch (e) {
      console.error('Erro ao carregar dados de prospecção:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listener global refresh
  useEffect(() => {
    const handleGlobalRefresh = () => {
      loadData();
    };
    window.addEventListener('vulto:refresh', handleGlobalRefresh);
    return () => window.removeEventListener('vulto:refresh', handleGlobalRefresh);
  }, [loadData]);

  // Realtime subscription nas tabelas
  useEffect(() => {
    const channelSub = supabase
      .channel('vulto_prospects_realtime_simplified')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vulto_prospects' }, () => {
        fetchVultoProspects().then((res) => {
          setProspects(res.data);
          setSelectedProspect((prev) => {
            if (!prev) return null;
            const updated = res.data.find((p) => p.id === prev.id);
            return updated || null;
          });
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channelSub);
    };
  }, []);

  // Carregar interações quando abrir o drawer do prospect
  useEffect(() => {
    if (!selectedProspect) {
      setInteractions([]);
      return;
    }

    setLoadingInteractions(true);
    fetchProspectInteractions(selectedProspect.id)
      .then((res) => setInteractions(res.data))
      .finally(() => setLoadingInteractions(false));

    const interChannel = supabase
      .channel(`vulto_inter_simp_${selectedProspect.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vulto_prospect_interactions',
          filter: `prospect_id=eq.${selectedProspect.id}`,
        },
        () => {
          fetchProspectInteractions(selectedProspect.id).then((res) => setInteractions(res.data));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(interChannel);
    };
  }, [selectedProspect?.id]);

  // Operador Helper
  const getOperatorName = (operatorId: string | null) => {
    if (!operatorId) return 'Operador';
    const match = operators.find((op) => op.id === operatorId);
    return match ? match.name : 'Operador';
  };

  // Formatação de Moeda
  const formatBRL = (val: number | null | undefined) => {
    if (val === null || val === undefined || isNaN(val)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Formatação de Data
  const formatDateBR = (iso: string | null) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return iso;
    }
  };

  const formatDateTimeBR = (iso: string | null) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  // Atalhos de Data para Follow-up
  const setQuickDate = (daysAhead: number | null, setter: (val: string) => void) => {
    if (daysAhead === null) {
      setter('');
      return;
    }
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    d.setHours(daysAhead === 0 ? 18 : 10, 0, 0, 0);

    // Formato YYYY-MM-DDTHH:mm para input datetime-local
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    setter(`${year}-${month}-${day}T${hours}:${minutes}`);
  };

  // Reagendar com 1 clique (+1d, +2d, +5d, +7d)
  const handleDirectPostpone = async (prospectId: string, daysAhead: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    d.setHours(14, 0, 0, 0);
    const iso = d.toISOString();

    const res = await updateVultoProspect(prospectId, { next_contact_at: iso });
    if (res.error) {
      showToast(res.error, 'error');
    } else {
      showToast(`Follow-up reagendado para ${formatDateBR(iso)}`);
      setProspects((prev) =>
        prev.map((item) => (item.id === prospectId ? { ...item, next_contact_at: iso } : item))
      );
      if (selectedProspect && selectedProspect.id === prospectId) {
        setSelectedProspect((prev) => (prev ? { ...prev, next_contact_at: iso } : null));
      }
    }
  };

  // Métricas do Topo
  const metrics = useMemo(() => {
    const total = prospects.length;
    const novos = prospects.filter((p) => p.status === 'novo').length;
    const emContato = prospects.filter((p) => p.status === 'em_contato').length;
    const reunioes = prospects.filter((p) => p.status === 'reuniao_agendada').length;
    const propostas = prospects.filter((p) => p.status === 'proposta_enviada').length;
    const fechados = prospects.filter((p) => p.status === 'fechado').length;
    const perdidos = prospects.filter((p) => p.status === 'perdido').length;

    // Follow-ups atrasados ou hoje
    const atrasados = prospects.filter((p) => {
      const st = getFollowUpStatus(p.next_contact_at);
      return st.type === 'overdue' && p.status !== 'fechado' && p.status !== 'perdido';
    }).length;

    const hoje = prospects.filter((p) => {
      const st = getFollowUpStatus(p.next_contact_at);
      return st.type === 'today' && p.status !== 'fechado' && p.status !== 'perdido';
    }).length;

    const valorPipeline = prospects
      .filter((p) => p.status !== 'fechado' && p.status !== 'perdido')
      .reduce((acc, p) => acc + (p.proposal_amount || 0), 0);

    return {
      total,
      novos,
      emContato,
      reunioes,
      propostas,
      fechados,
      perdidos,
      atrasados,
      hoje,
      valorPipeline,
    };
  }, [prospects]);

  // Filtros aplicados
  const filteredProspects = useMemo(() => {
    return prospects.filter((p) => {
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchName = p.company_name.toLowerCase().includes(query);
        const matchContact = (p.contact_name || '').toLowerCase().includes(query);
        const matchCity = (p.city || '').toLowerCase().includes(query);
        const matchService = (p.service_interest || '').toLowerCase().includes(query);
        const matchPhone = (p.phone || '').toLowerCase().includes(query);
        const matchChannel = (p.channel || '').toLowerCase().includes(query);
        if (!matchName && !matchContact && !matchCity && !matchService && !matchPhone && !matchChannel) {
          return false;
        }
      }

      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && p.priority !== priorityFilter) return false;
      if (operatorFilter !== 'ALL' && p.operator_id !== operatorFilter) return false;

      if (followUpFilter !== 'ALL') {
        const fStatus = getFollowUpStatus(p.next_contact_at).type;
        if (fStatus !== followUpFilter) return false;
      }

      return true;
    });
  }, [prospects, searchTerm, statusFilter, priorityFilter, operatorFilter, followUpFilter]);

  // Modal Handlers (Abertura Limpa e Ágil)
  const handleOpenCreateModal = () => {
    setEditingProspect(null);
    setCompanyName('');
    setChannel('whatsapp');
    setContactReference('');
    setStatus('em_contato'); // Padrão: Primeiro Contato
    setNextContactAt('');
    setInitialNote('');
    setShowAdvancedFields(false);

    // Limpar campos avançados
    setContactName('');
    setEmail('');
    setPhone('');
    setWebsite('');
    setInstagram('');
    setCity('');
    setState('');
    setSource('Outbound');
    setServiceInterest('Tráfego Pago');
    setPriority('media');
    setProposalAmount('');
    setLossReason('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: VultoProspect, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingProspect(p);
    setCompanyName(p.company_name);
    setChannel(normalizeProspectChannel(p.channel));
    setContactReference(p.contact_name || p.phone || p.email || p.instagram || '');
    setStatus(p.status);
    setNextContactAt(p.next_contact_at ? p.next_contact_at.slice(0, 16) : '');
    setInitialNote(p.notes || '');

    // Preencher campos avançados caso queira editar
    setContactName(p.contact_name || '');
    setEmail(p.email || '');
    setPhone(p.phone || '');
    setWebsite(p.website || '');
    setInstagram(p.instagram || '');
    setCity(p.city || '');
    setState(p.state || '');
    setSource(p.source || 'Outbound');
    setServiceInterest(p.service_interest || 'Tráfego Pago');
    setPriority(p.priority || 'media');
    setProposalAmount(p.proposal_amount ? String(p.proposal_amount) : '');
    setLossReason(p.loss_reason || '');
    setShowAdvancedFields(true); // Na edição, expõe campos completos
    setFormError(null);
    setIsModalOpen(true);
  };

  // Submissão do Prospect (Inteligente e Rápida)
  const handleSubmitProspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setFormError('Informe o nome da empresa.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    // Mapeamento inteligente da referência de contato se não estiver no modo avançado preenchido
    let finalContactName = contactName.trim() || null;
    let finalEmail = email.trim() || null;
    let finalPhone = phone.trim() || null;
    let finalInstagram = instagram.trim() || null;

    if (contactReference.trim()) {
      const detected = detectContactReferenceType(contactReference);
      const rawRef = contactReference.trim();

      if (detected.type === 'email' && !finalEmail) {
        finalEmail = rawRef;
      } else if (detected.type === 'instagram' && !finalInstagram) {
        finalInstagram = rawRef.startsWith('@') ? rawRef : `@${rawRef}`;
      } else if (detected.type === 'phone' && !finalPhone) {
        finalPhone = rawRef;
      } else if (detected.type === 'contact' && !finalContactName) {
        finalContactName = rawRef;
      }
    }

    // Validação estrita do canal antes do INSERT / UPDATE
    const validChannels = [
      'email',
      'whatsapp',
      'presencial',
      'instagram',
      'telefone',
      'outro',
    ];

    const finalChannel = normalizeProspectChannel(channel);

    if (!validChannels.includes(finalChannel)) {
      setFormError('Canal de contato inválido. Selecione um meio de contato válido.');
      showToast('Canal de contato inválido.', 'error');
      setIsSubmitting(false);
      return;
    }

    console.log('CHANNEL ENVIADO AO SUPABASE:', finalChannel);

    const payload: Partial<VultoProspect> = {
      company_name: companyName.trim(),
      channel: finalChannel,
      contact_name: finalContactName,
      email: finalEmail,
      phone: finalPhone,
      instagram: finalInstagram,
      website: website.trim() || null,
      city: city.trim() || null,
      state: state.trim() || null,
      source: source.trim() || 'Outbound',
      service_interest: serviceInterest.trim() || 'Tráfego Pago',
      status,
      priority,
      proposal_amount: proposalAmount ? parseFloat(proposalAmount) : null,
      next_contact_at: nextContactAt ? new Date(nextContactAt).toISOString() : null,
      notes: initialNote.trim() || null,
      loss_reason: status === 'perdido' ? lossReason.trim() || null : null,
    };

    try {
      if (editingProspect) {
        const res = await updateVultoProspect(editingProspect.id, payload);
        if (res.error) {
          setFormError(res.error);
        } else {
          showToast('Prospect atualizado com sucesso.');
          setIsModalOpen(false);
          loadData();
        }
      } else {
        const res = await createVultoProspect(payload);
        if (res.error) {
          setFormError(res.error);
        } else {
          showToast('Novo prospect cadastrado no pipeline!');
          setIsModalOpen(false);
          loadData();
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'Erro inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mover Status Rapidamente (Kanban ou Card)
  const handleQuickStatusChange = async (
    prospectId: string,
    newStatus: ProspectStatus,
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();

    // Se mover para fechado, sugere conversão imediata
    if (newStatus === 'fechado') {
      const p = prospects.find((item) => item.id === prospectId);
      if (p) {
        setConvertingProspect(p);
        return;
      }
    }

    const res = await updateVultoProspect(prospectId, { status: newStatus });
    if (res.error) {
      showToast(res.error, 'error');
    } else {
      const label = PROSPECT_STATUSES.find((s) => s.id === newStatus)?.label || newStatus;
      showToast(`Movido para "${label}"`);
      setProspects((prev) =>
        prev.map((item) => (item.id === prospectId ? { ...item, status: newStatus } : item))
      );
      if (selectedProspect && selectedProspect.id === prospectId) {
        setSelectedProspect((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    }
  };

  // Avançar para Próxima Fase no Pipeline
  const handleAdvanceStage = async (prospect: VultoProspect, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const currentIndex = PROSPECT_STATUSES.findIndex((s) => s.id === prospect.status);
    if (currentIndex >= 0 && currentIndex < PROSPECT_STATUSES.length - 2) {
      const nextStatus = PROSPECT_STATUSES[currentIndex + 1].id;
      handleQuickStatusChange(prospect.id, nextStatus);
    }
  };

  // Modal Rápido de Follow-Up (Registrar contato e reagendar em 5 segundos)
  const handleOpenQuickFollowUp = (prospect: VultoProspect, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setQuickFollowUpProspect(prospect);
    setQuickFollowUpType((prospect.channel?.toLowerCase() as any) || 'whatsapp');
    setQuickFollowUpSummary('');
    // Sugerir +2 dias por padrão para próximo contato
    setQuickDate(2, setQuickFollowUpNextDate);
  };

  const handleSubmitQuickFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickFollowUpProspect) return;
    if (!quickFollowUpSummary.trim()) {
      showToast('Descreva um resumo do follow-up.', 'error');
      return;
    }

    setIsSubmittingQuickFollowUp(true);
    try {
      const nowIso = new Date().toISOString();
      const nextIso = quickFollowUpNextDate ? new Date(quickFollowUpNextDate).toISOString() : null;

      // 1. Cria interação no histórico
      await createProspectInteraction({
        prospect_id: quickFollowUpProspect.id,
        type: quickFollowUpType,
        summary: quickFollowUpSummary.trim(),
        details: null,
        interaction_at: nowIso,
      });

      // 2. Atualiza prospect com último contato e próximo contato
      const res = await updateVultoProspect(quickFollowUpProspect.id, {
        last_contact_at: nowIso,
        next_contact_at: nextIso,
      });

      if (res.error) {
        showToast(res.error, 'error');
      } else {
        showToast('Follow-up registrado com sucesso!');
        setQuickFollowUpProspect(null);
        loadData();
      }
    } catch {
      showToast('Erro ao registrar follow-up.', 'error');
    } finally {
      setIsSubmittingQuickFollowUp(false);
    }
  };

  // Conversão em Cliente
  const handleConfirmConvert = async () => {
    if (!convertingProspect) return;
    setIsConverting(true);
    try {
      const res = await convertProspectToClient(convertingProspect, convertServiceType);
      if (res.error) {
        showToast(res.error, 'error');
      } else {
        showToast(`"${convertingProspect.company_name}" convertido em cliente oficial da VULTO!`);
        setConvertingProspect(null);
        loadData();
      }
    } catch (err: any) {
      showToast('Erro ao converter prospect em cliente.', 'error');
    } finally {
      setIsConverting(false);
    }
  };

  // Exclusão de Prospect
  const handleConfirmDelete = async () => {
    if (!prospectToDelete) return;
    try {
      const res = await deleteVultoProspect(prospectToDelete.id);
      if (res.error) {
        showToast(res.error, 'error');
      } else {
        showToast(`Prospect "${prospectToDelete.company_name}" excluído.`);
        setProspectToDelete(null);
        if (selectedProspect && selectedProspect.id === prospectToDelete.id) {
          setSelectedProspect(null);
        }
        loadData();
      }
    } catch {
      showToast('Erro ao excluir prospect.', 'error');
    }
  };

  // Nova Interação Form (Drawer)
  const handleAddInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProspect || !newInteractionSummary.trim()) return;

    setIsSubmittingInteraction(true);
    try {
      const nowIso = new Date().toISOString();
      const res = await createProspectInteraction({
        prospect_id: selectedProspect.id,
        type: newInteractionType,
        summary: newInteractionSummary.trim(),
        details: newInteractionDetails.trim() || null,
        interaction_at: nowIso,
      });

      if (res.error) {
        showToast(res.error, 'error');
      } else {
        showToast('Interação registrada!');
        setNewInteractionSummary('');
        setNewInteractionDetails('');
        // Atualiza last_contact_at
        await updateVultoProspect(selectedProspect.id, { last_contact_at: nowIso });
        const list = await fetchProspectInteractions(selectedProspect.id);
        setInteractions(list.data);
      }
    } catch {
      showToast('Erro ao salvar interação.', 'error');
    } finally {
      setIsSubmittingInteraction(false);
    }
  };

  // Excluir Interação
  const handleDeleteInteraction = async (interactionId: string) => {
    try {
      const res = await deleteProspectInteraction(interactionId);
      if (res.error) {
        showToast(res.error, 'error');
      } else {
        showToast('Interação removida.');
        setInteractions((prev) => prev.filter((i) => i.id !== interactionId));
      }
    } catch {
      showToast('Erro ao excluir interação.', 'error');
    }
  };

  // Detector de referência de contato atual
  const referenceFeedback = useMemo(() => {
    return detectContactReferenceType(contactReference);
  }, [contactReference]);

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 border font-mono text-xs flex items-center gap-2 shadow-2xl transition-all ${
            toastMessage.type === 'success'
              ? 'bg-[#121212] border-[#C6FF00] text-[#C6FF00]'
              : 'bg-rose-950/90 border-rose-500 text-rose-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span className="font-bold tracking-wider">{toastMessage.text}</span>
        </div>
      )}

      {/* HEADER DO MÓDULO */}
      <div className="bg-[#111111] border border-white/10 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
              PROSPECÇÃO & MINI CRM
            </h1>
            <span className="px-2 py-0.5 bg-[#C6FF00]/10 border border-[#C6FF00]/30 text-[#C6FF00] text-[10px] font-mono font-bold tracking-wider">
              CADASTRO ULTRA ÁGIL
            </span>
          </div>
          <p className="text-xs text-white/50 font-sans mt-1">
            Prospecção rápida em volume (~10s por lead), controle diário de follow-ups e fluxo comercial direto.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Alternar Modo de Visualização */}
          <div className="bg-[#161616] p-1 border border-white/10 flex items-center gap-1 font-mono text-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-[#0A0A0A] text-[#C6FF00] font-bold border border-white/10'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>KANBAN</span>
            </button>
            <button
              onClick={() => setViewMode('tabela')}
              className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'tabela'
                  ? 'bg-[#0A0A0A] text-[#C6FF00] font-bold border border-white/10'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>TABELA</span>
            </button>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-mono font-bold text-xs tracking-wider flex items-center gap-2 transition-colors cursor-pointer shadow-sm shadow-[#C6FF00]/20"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>NOVO PROSPECT (10s)</span>
          </button>
        </div>
      </div>

      {/* METRIC CARDS COM FOCO EM FOLLOW-UP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
        <div className="bg-[#111111] border border-white/10 p-4">
          <div className="text-[10px] text-white/40 tracking-wider">TOTAL EM PIPELINE</div>
          <div className="text-2xl font-bold text-white mt-1">{metrics.total}</div>
          <div className="text-[11px] text-white/50 mt-1 flex items-center gap-1">
            <span>{metrics.novos} novos</span>
            <span>•</span>
            <span>{metrics.emContato} em contato</span>
          </div>
        </div>

        <div
          onClick={() => setFollowUpFilter((prev) => (prev === 'today' ? 'ALL' : 'today'))}
          className={`bg-[#111111] border p-4 cursor-pointer transition-colors ${
            metrics.hoje > 0 ? 'border-amber-500/40 hover:bg-amber-500/5' : 'border-white/10'
          }`}
        >
          <div className="text-[10px] text-amber-400 tracking-wider flex items-center justify-between">
            <span>FOLLOW-UPS HOJE</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{metrics.hoje}</div>
          <div className="text-[11px] text-white/50 mt-1">
            {metrics.hoje > 0 ? 'Falar hoje com prioridade' : 'Em dia para hoje'}
          </div>
        </div>

        <div
          onClick={() => setFollowUpFilter((prev) => (prev === 'overdue' ? 'ALL' : 'overdue'))}
          className={`bg-[#111111] border p-4 cursor-pointer transition-colors ${
            metrics.atrasados > 0 ? 'border-rose-500/40 hover:bg-rose-500/5' : 'border-white/10'
          }`}
        >
          <div className="text-[10px] text-rose-400 tracking-wider flex items-center justify-between">
            <span>FOLLOW-UPS ATRASADOS</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{metrics.atrasados}</div>
          <div className="text-[11px] text-rose-200/60 mt-1">
            {metrics.atrasados > 0 ? 'Clique para filtrar atrasados' : 'Nenhum atrasado'}
          </div>
        </div>

        <div className="bg-[#111111] border border-white/10 p-4">
          <div className="text-[10px] text-white/40 tracking-wider">FECHADOS / CONVERTIDOS</div>
          <div className="text-2xl font-bold text-[#C6FF00] mt-1">{metrics.fechados}</div>
          <div className="text-[11px] text-white/50 mt-1 flex items-center gap-1">
            <span>{metrics.propostas} propostas</span>
            <span>•</span>
            <span className="text-rose-400/80">{metrics.perdidos} perdidos</span>
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS & BUSCA RÁPIDA */}
      <div className="bg-[#111111] border border-white/10 p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por empresa, contato, telefone, arroba ou serviço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#161616] border border-white/10 pl-9 pr-3 py-2 text-xs text-white placeholder-white/30 focus:border-[#C6FF00] outline-none font-sans"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
          {/* Filtro Follow-up */}
          <div className="flex items-center gap-1.5">
            <span className="text-white/40 text-[10px]">FOLLOW-UP:</span>
            <select
              value={followUpFilter}
              onChange={(e) => setFollowUpFilter(e.target.value as any)}
              className="bg-[#161616] border border-white/10 px-2 py-1.5 text-xs text-white/80 focus:border-[#C6FF00] outline-none cursor-pointer"
            >
              <option value="ALL">TODOS</option>
              <option value="today">HOJE</option>
              <option value="overdue">ATRASADOS</option>
              <option value="upcoming">NO PRAZO</option>
            </select>
          </div>

          {/* Filtro Status */}
          <div className="flex items-center gap-1.5">
            <span className="text-white/40 text-[10px]">FASE:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-[#161616] border border-white/10 px-2 py-1.5 text-xs text-white/80 focus:border-[#C6FF00] outline-none cursor-pointer"
            >
              <option value="ALL">TODAS ({prospects.length})</option>
              {PROSPECT_STATUSES.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.label} ({prospects.filter((p) => p.status === st.id).length})
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Responsável */}
          <div className="flex items-center gap-1.5">
            <span className="text-white/40 text-[10px]">RESP:</span>
            <select
              value={operatorFilter}
              onChange={(e) => setOperatorFilter(e.target.value)}
              className="bg-[#161616] border border-white/10 px-2 py-1.5 text-xs text-white/80 focus:border-[#C6FF00] outline-none cursor-pointer"
            >
              <option value="ALL">TODOS</option>
              {operators.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL: KANBAN OU TABELA */}
      {loading ? (
        <div className="bg-[#111111] border border-white/10 p-16 text-center text-white/40 font-mono text-xs">
          <div className="w-6 h-6 border-2 border-[#C6FF00] border-t-transparent animate-spin mx-auto mb-3" />
          CARREGANDO PIPELINE DE PROSPECÇÃO...
        </div>
      ) : filteredProspects.length === 0 ? (
        <div className="bg-[#111111] border border-white/10 p-16 text-center text-white/40 font-mono text-xs">
          <UserPlus className="w-8 h-8 text-white/20 mx-auto mb-3" />
          NENHUM PROSPECT ENCONTRADO
          {searchTerm || followUpFilter !== 'ALL' || statusFilter !== 'ALL' ? (
            <div className="text-[11px] mt-1 text-white/30">
              Tente redefinir os filtros aplicados.
            </div>
          ) : (
            <div className="mt-3">
              <button
                onClick={handleOpenCreateModal}
                className="px-4 py-2 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-bold text-xs tracking-wider inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>CADASTRAR PRIMEIRO PROSPECT</span>
              </button>
            </div>
          )}
        </div>
      ) : viewMode === 'kanban' ? (
        /* ================= KANBAN PIPELINE ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 select-none">
          {PROSPECT_STATUSES.map((st) => {
            const columnProspects = filteredProspects.filter((p) => p.status === st.id);

            return (
              <div
                key={st.id}
                className="bg-[#111111] border border-white/10 flex flex-col min-h-[500px]"
              >
                {/* Cabeçalho da Coluna */}
                <div className={`p-3 border-b ${st.borderColor} bg-[#141414]`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-mono text-xs font-bold ${st.badgeText}`}>
                      {st.label}
                    </span>
                    <span className="font-mono text-[11px] px-1.5 py-0.2 bg-white/5 border border-white/10 text-white/70">
                      {columnProspects.length}
                    </span>
                  </div>
                </div>

                {/* Cards da Coluna */}
                <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[720px]">
                  {columnProspects.length === 0 ? (
                    <div className="h-28 border border-dashed border-white/5 flex items-center justify-center text-[10px] font-mono text-white/20 text-center px-2">
                      Sem prospects
                    </div>
                  ) : (
                    columnProspects.map((p) => {
                      const followUpSt = getFollowUpStatus(p.next_contact_at);
                      const priorityStyle = PRIORITY_CONFIG[p.priority] || PRIORITY_CONFIG.media;

                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedProspect(p)}
                          className="bg-[#161616] hover:bg-[#1a1a1a] border border-white/10 hover:border-white/20 p-3 transition-all cursor-pointer group space-y-2.5 relative"
                        >
                          {/* Topo do card: Nome + Canal */}
                          <div className="flex items-start justify-between gap-1">
                            <h3 className="font-mono text-xs font-bold text-white group-hover:text-[#C6FF00] transition-colors line-clamp-1">
                              {p.company_name}
                            </h3>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 border border-white/10 bg-white/5 text-white/70 shrink-0">
                              {getChannelLabel(p.channel)}
                            </span>
                          </div>

                          {/* Contato Principal / Referência */}
                          <div className="text-[11px] text-white/60 space-y-0.5 font-sans">
                            {p.contact_name && (
                              <div className="truncate flex items-center gap-1">
                                <span className="text-white/40">Contato:</span> {p.contact_name}
                              </div>
                            )}
                            {p.phone && (
                              <div className="truncate flex items-center gap-1 text-[10px] text-emerald-400">
                                <Phone className="w-3 h-3 shrink-0" />
                                <span>{p.phone}</span>
                              </div>
                            )}
                            {p.instagram && (
                              <div className="truncate flex items-center gap-1 text-[10px] text-pink-400">
                                <Instagram className="w-3 h-3 shrink-0" />
                                <span>{p.instagram}</span>
                              </div>
                            )}
                            {p.email && (
                              <div className="truncate flex items-center gap-1 text-[10px] text-blue-400">
                                <Mail className="w-3 h-3 shrink-0" />
                                <span>{p.email}</span>
                              </div>
                            )}
                          </div>

                          {/* Linha de Follow-up com Status Visual em Destaque */}
                          <div className="pt-2 border-t border-white/5 space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className="text-white/40">PRÓX. CONTATO:</span>
                              <span
                                className={`px-1.5 py-0.5 border text-[9px] font-bold ${followUpSt.badgeClass}`}
                              >
                                {p.next_contact_at
                                  ? formatDateBR(p.next_contact_at)
                                  : 'Sem data'}
                              </span>
                            </div>

                            {/* Botões de Ação Rápida de Follow-up (1 Clique) */}
                            <div className="flex items-center justify-between pt-1 text-[9px] font-mono">
                              <button
                                type="button"
                                title="Reagendar follow-up para daqui 2 dias"
                                onClick={(e) => handleDirectPostpone(p.id, 2, e)}
                                className="px-1.5 py-0.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 transition-colors"
                              >
                                +2d
                              </button>
                              <button
                                type="button"
                                title="Reagendar follow-up para daqui 5 dias"
                                onClick={(e) => handleDirectPostpone(p.id, 5, e)}
                                className="px-1.5 py-0.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 transition-colors"
                              >
                                +5d
                              </button>

                              {/* Registrar Contato / Interação Rápida */}
                              <button
                                type="button"
                                title="Registrar contato rápido"
                                onClick={(e) => handleOpenQuickFollowUp(p, e)}
                                className="px-2 py-0.5 bg-[#C6FF00]/10 hover:bg-[#C6FF00]/20 text-[#C6FF00] border border-[#C6FF00]/30 font-bold transition-colors flex items-center gap-1"
                              >
                                <MessageSquare className="w-2.5 h-2.5" />
                                <span>CONTATO</span>
                              </button>
                            </div>
                          </div>

                          {/* Rodapé do Card: Responsável + Avançar Estágio */}
                          <div className="pt-1.5 flex items-center justify-between border-t border-white/5 text-[10px] font-mono text-white/30">
                            <span>{getOperatorName(p.operator_id)}</span>

                            <div className="flex items-center gap-1">
                              {/* Botão de Avanço Rápido de Estágio */}
                              {p.status !== 'fechado' && p.status !== 'perdido' && (
                                <button
                                  type="button"
                                  title="Avançar para o próximo estágio"
                                  onClick={(e) => handleAdvanceStage(p, e)}
                                  className="p-1 text-white/40 hover:text-[#C6FF00] transition-colors"
                                >
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}

                              <button
                                title="Editar Prospect"
                                onClick={(e) => handleOpenEditModal(p, e)}
                                className="p-1 hover:text-white"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= TABELA COMPLETA ================= */
        <div className="bg-[#111111] border border-white/10 overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-[#161616] text-[10px] text-white/50 tracking-wider">
                <th className="p-3">EMPRESA / CONTA</th>
                <th className="p-3">CANAL</th>
                <th className="p-3">CONTATO / REF</th>
                <th className="p-3">ESTÁGIO</th>
                <th className="p-3">PRÓX. FOLLOW-UP</th>
                <th className="p-3">AÇÃO RÁPIDA</th>
                <th className="p-3">RESPONSÁVEL</th>
                <th className="p-3 text-right">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredProspects.map((p) => {
                const statusConfig =
                  PROSPECT_STATUSES.find((s) => s.id === p.status) || PROSPECT_STATUSES[0];
                const followUpSt = getFollowUpStatus(p.next_contact_at);

                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedProspect(p)}
                    className="hover:bg-[#161616] transition-colors cursor-pointer group"
                  >
                    <td className="p-3">
                      <div className="font-bold text-white group-hover:text-[#C6FF00] transition-colors">
                        {p.company_name}
                      </div>
                      {p.notes && (
                        <div className="text-[10px] text-white/40 truncate max-w-xs font-sans">
                          {p.notes}
                        </div>
                      )}
                    </td>

                    <td className="p-3 text-white/70">
                      <span className="px-2 py-0.5 border border-white/10 bg-white/5 text-[10px]">
                        {getChannelLabel(p.channel)}
                      </span>
                    </td>

                    <td className="p-3 text-white/80 font-sans text-xs">
                      <div>{p.contact_name || p.phone || p.instagram || p.email || '—'}</div>
                      {p.phone && p.contact_name && (
                        <div className="text-[10px] text-emerald-400 font-mono">{p.phone}</div>
                      )}
                    </td>

                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-0.5 border text-[10px] font-bold ${statusConfig.badgeBg} ${statusConfig.badgeText} ${statusConfig.borderColor}`}
                      >
                        {statusConfig.label}
                      </span>
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-block px-2 py-0.5 border text-[10px] font-bold ${followUpSt.badgeClass}`}
                        >
                          {p.next_contact_at ? formatDateBR(p.next_contact_at) : 'Sem data'}
                        </span>
                      </div>
                    </td>

                    {/* Ações Rápidas de Follow-up Direto na Linha */}
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1 text-[9px]">
                        <button
                          type="button"
                          title="Remarcar para daqui 2 dias"
                          onClick={(e) => handleDirectPostpone(p.id, 2, e)}
                          className="px-1.5 py-0.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 cursor-pointer"
                        >
                          +2d
                        </button>
                        <button
                          type="button"
                          title="Remarcar para daqui 5 dias"
                          onClick={(e) => handleDirectPostpone(p.id, 5, e)}
                          className="px-1.5 py-0.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 cursor-pointer"
                        >
                          +5d
                        </button>
                        <button
                          type="button"
                          title="Registrar contato"
                          onClick={(e) => handleOpenQuickFollowUp(p, e)}
                          className="px-2 py-0.5 bg-[#C6FF00]/10 hover:bg-[#C6FF00]/20 text-[#C6FF00] border border-[#C6FF00]/30 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <MessageSquare className="w-2.5 h-2.5" />
                          <span>CONTATO</span>
                        </button>
                      </div>
                    </td>

                    <td className="p-3 text-white/50 text-[11px]">
                      {getOperatorName(p.operator_id)}
                    </td>

                    <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {p.status !== 'fechado' && (
                          <button
                            title="Converter em Cliente Oficial"
                            onClick={() => setConvertingProspect(p)}
                            className="p-1.5 hover:bg-[#C6FF00]/10 text-white/60 hover:text-[#C6FF00] border border-transparent hover:border-[#C6FF00]/30 transition-all cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          title="Editar"
                          onClick={(e) => handleOpenEditModal(p, e)}
                          className="p-1.5 hover:bg-white/5 text-white/60 hover:text-white border border-transparent hover:border-white/10 transition-all cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          title="Excluir"
                          onClick={() => setProspectToDelete(p)}
                          className="p-1.5 hover:bg-rose-500/10 text-white/60 hover:text-rose-400 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= DRAWER LATERAL / DETALHES DO PROSPECT ================= */}
      {selectedProspect && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-[#0D0D0D] border-l border-white/10 h-full flex flex-col justify-between overflow-y-auto font-mono text-xs">
            {/* Topo Drawer */}
            <div className="p-6 border-b border-white/10 bg-[#121212] space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/40 tracking-wider uppercase">
                      DETALHES DO PROSPECT
                    </span>
                    {selectedProspect.converted_client_id && (
                      <span className="px-1.5 py-0.2 bg-[#C6FF00]/20 text-[#C6FF00] border border-[#C6FF00]/40 text-[9px] font-bold">
                        CLIENTE CONVERTIDO
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1">
                    {selectedProspect.company_name}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditModal(selectedProspect)}
                    className="p-2 bg-[#1A1A1A] hover:bg-[#222222] border border-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                    title="Editar Prospect"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedProspect(null)}
                    className="p-2 bg-[#1A1A1A] hover:bg-[#222222] border border-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Seletor de Pipeline Rápido no Drawer */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-white/40">FASE DO FUNIL:</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {PROSPECT_STATUSES.map((st) => {
                    const isActive = selectedProspect.status === st.id;
                    return (
                      <button
                        key={st.id}
                        onClick={() => handleQuickStatusChange(selectedProspect.id, st.id)}
                        className={`px-2 py-1.5 text-[10px] font-bold border transition-all cursor-pointer ${
                          isActive
                            ? `${st.badgeBg} ${st.badgeText} ${st.borderColor} shadow-xs`
                            : 'bg-white/5 text-white/40 border-white/10 hover:text-white'
                        }`}
                      >
                        {st.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Conteúdo Principal do Drawer */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              {/* Informações de Contato e Follow-Up */}
              <div className="bg-[#121212] border border-white/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] text-white/40 tracking-wider">DADOS E FOLLOW-UP</div>
                  <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-white/60 text-[10px]">
                    Canal: {getChannelLabel(selectedProspect.channel)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-white/80">
                  <div>
                    <span className="text-white/40 text-[10px] block">CONTATO</span>
                    <span>{selectedProspect.contact_name || '—'}</span>
                  </div>
                  <div>
                    <span className="text-white/40 text-[10px] block">INTERESSE</span>
                    <span className="text-[#C6FF00]">{selectedProspect.service_interest || '—'}</span>
                  </div>
                  <div>
                    <span className="text-white/40 text-[10px] block">TELEFONE / WHATSAPP</span>
                    {selectedProspect.phone ? (
                      <a
                        href={`https://wa.me/${selectedProspect.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>{selectedProspect.phone}</span>
                      </a>
                    ) : (
                      '—'
                    )}
                  </div>
                  <div>
                    <span className="text-white/40 text-[10px] block">E-MAIL</span>
                    {selectedProspect.email ? (
                      <a
                        href={`mailto:${selectedProspect.email}`}
                        className="text-blue-400 hover:underline truncate block"
                      >
                        {selectedProspect.email}
                      </a>
                    ) : (
                      '—'
                    )}
                  </div>
                  <div>
                    <span className="text-white/40 text-[10px] block">INSTAGRAM</span>
                    {selectedProspect.instagram ? (
                      <a
                        href={`https://instagram.com/${selectedProspect.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-pink-400 hover:underline flex items-center gap-1"
                      >
                        <Instagram className="w-3 h-3" />
                        <span>{selectedProspect.instagram}</span>
                      </a>
                    ) : (
                      '—'
                    )}
                  </div>
                  <div>
                    <span className="text-white/40 text-[10px] block">PRÓXIMO CONTATO</span>
                    <span className={getFollowUpStatus(selectedProspect.next_contact_at).textClass}>
                      {selectedProspect.next_contact_at
                        ? formatDateTimeBR(selectedProspect.next_contact_at)
                        : 'Sem data definida'}
                    </span>
                  </div>
                </div>

                {/* Ações Rápidas de Remarcar Follow-up no Drawer */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                  <span className="text-white/40">REMARCAR:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleDirectPostpone(selectedProspect.id, 1, e)}
                      className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 cursor-pointer"
                    >
                      +1 dia
                    </button>
                    <button
                      onClick={(e) => handleDirectPostpone(selectedProspect.id, 2, e)}
                      className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 cursor-pointer"
                    >
                      +2 dias
                    </button>
                    <button
                      onClick={(e) => handleDirectPostpone(selectedProspect.id, 5, e)}
                      className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 cursor-pointer"
                    >
                      +5 dias
                    </button>
                    <button
                      onClick={(e) => handleDirectPostpone(selectedProspect.id, 7, e)}
                      className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 cursor-pointer"
                    >
                      +7 dias
                    </button>
                  </div>
                </div>

                {selectedProspect.notes && (
                  <div className="pt-2 border-t border-white/5">
                    <span className="text-white/40 text-[10px] block">NOTAS / CONTEXTO</span>
                    <p className="text-white/70 font-sans text-xs mt-1 whitespace-pre-wrap">
                      {selectedProspect.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Botão de Converter em Cliente se ainda não for */}
              {!selectedProspect.converted_client_id && (
                <div className="bg-[#141414] border border-[#C6FF00]/30 p-4 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-white text-xs">CONVERTER EM CLIENTE OFICIAL</h4>
                    <p className="text-[11px] text-white/50 font-sans mt-0.5">
                      Transfere a conta diretamente para a carteira de clientes ativos da VULTO LAB.
                    </p>
                  </div>
                  <button
                    onClick={() => setConvertingProspect(selectedProspect)}
                    className="px-3 py-2 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-bold text-xs tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    <UserCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>CONVERTER</span>
                  </button>
                </div>
              )}

              {/* TIMELINE DE INTERAÇÕES */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-[#C6FF00]" />
                    <span className="font-bold text-white">HISTÓRICO DE CONTATOS</span>
                  </div>
                  <span className="text-[10px] text-white/40">
                    {interactions.length} registros
                  </span>
                </div>

                {/* Formulário Rápido de Nova Interação */}
                <form
                  onSubmit={handleAddInteraction}
                  className="bg-[#141414] border border-white/10 p-3 space-y-2"
                >
                  <div className="text-[10px] text-white/40 tracking-wider">REGISTRAR NOVO CONTATO</div>

                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={newInteractionType}
                      onChange={(e) => setNewInteractionType(e.target.value as any)}
                      className="bg-[#181818] border border-white/10 px-2 py-1.5 text-xs text-white focus:border-[#C6FF00] outline-none cursor-pointer"
                    >
                      <option value="whatsapp">WhatsApp</option>
                      <option value="ligacao">Ligação</option>
                      <option value="reuniao">Reunião</option>
                      <option value="email">E-mail</option>
                      <option value="direct_instagram">Instagram</option>
                      <option value="outro">Outro</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Resumo do contato..."
                      value={newInteractionSummary}
                      onChange={(e) => setNewInteractionSummary(e.target.value)}
                      className="col-span-2 bg-[#181818] border border-white/10 px-2.5 py-1.5 text-xs text-white placeholder-white/30 focus:border-[#C6FF00] outline-none"
                    />
                  </div>

                  <textarea
                    rows={2}
                    placeholder="Detalhes adicionais, combinado, objeções ou próximos passos (opcional)..."
                    value={newInteractionDetails}
                    onChange={(e) => setNewInteractionDetails(e.target.value)}
                    className="w-full bg-[#181818] border border-white/10 px-2.5 py-1.5 text-xs text-white placeholder-white/30 focus:border-[#C6FF00] outline-none font-sans"
                  />

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingInteraction || !newInteractionSummary.trim()}
                      className="px-3 py-1.5 bg-[#C6FF00] hover:bg-[#b0e600] disabled:opacity-40 text-[#0A0A0A] font-bold text-xs tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      <span>{isSubmittingInteraction ? 'SALVANDO...' : 'REGISTRAR'}</span>
                    </button>
                  </div>
                </form>

                {/* Lista de Interações */}
                <div className="space-y-2">
                  {loadingInteractions ? (
                    <div className="text-center py-6 text-white/30 text-xs">Carregando histórico...</div>
                  ) : interactions.length === 0 ? (
                    <div className="text-center py-6 text-white/30 text-xs border border-dashed border-white/5">
                      Nenhuma interação registrada ainda.
                    </div>
                  ) : (
                    interactions.map((inter) => {
                      const typeConfig =
                        INTERACTION_TYPE_CONFIG[inter.type] || INTERACTION_TYPE_CONFIG.outro;
                      const Icon = typeConfig.icon;
                      return (
                        <div
                          key={inter.id}
                          className="bg-[#121212] border border-white/10 p-3 space-y-1.5 relative group"
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <div className="flex items-center gap-1.5">
                              <Icon className={`w-3.5 h-3.5 ${typeConfig.color}`} />
                              <span className="font-bold text-white">{typeConfig.label}</span>
                              <span className="text-white/30">•</span>
                              <span className="text-white/40">
                                {formatDateTimeBR(inter.interaction_at)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-white/30">
                                {getOperatorName(inter.operator_id)}
                              </span>
                              <button
                                title="Excluir Interação"
                                onClick={() => handleDeleteInteraction(inter.id)}
                                className="text-white/20 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <div className="text-white font-bold text-xs">{inter.summary}</div>

                          {inter.details && (
                            <p className="text-white/60 font-sans text-xs whitespace-pre-wrap pt-1 border-t border-white/5">
                              {inter.details}
                            </p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Rodapé Drawer */}
            <div className="p-4 border-t border-white/10 bg-[#121212] flex items-center justify-between">
              <span className="text-[10px] text-white/30">
                Criado em: {formatDateBR(selectedProspect.created_at)}
              </span>
              <button
                onClick={() => setProspectToDelete(selectedProspect)}
                className="text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>EXCLUIR PROSPECT</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL RÁPIDO: NOVO PROSPECT (10 SEGUNDOS) ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#0E0E0E] border border-white/15 w-full max-w-xl max-h-[92vh] overflow-y-auto p-6 font-mono text-xs space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#C6FF00]/10 border border-[#C6FF00]/30 text-[#C6FF00]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-wider">
                    {editingProspect ? 'EDITAR PROSPECT' : 'NOVO PROSPECT — CADASTRO RÁPIDO (10s)'}
                  </h2>
                  <p className="text-[10px] text-white/50 font-sans">
                    {editingProspect
                      ? 'Atualize as informações do contato'
                      : 'Registre apenas o essencial para prospecção em alto volume'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/40 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitProspect} className="space-y-4">
              {/* 1. EMPRESA * */}
              <div>
                <label className="text-[11px] font-bold text-white block mb-1">
                  1. EMPRESA / NOME DA CONTA *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ex: Marmoraria Real, Dra. Juliana, Alfa Imóveis..."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-[#161616] border border-white/15 px-3 py-2.5 text-white text-sm focus:border-[#C6FF00] outline-none"
                />
              </div>

              {/* 2. MEIO DE CONTATO * */}
              <div>
                <label className="text-[11px] font-bold text-white block mb-1.5">
                  2. MEIO DE CONTATO *
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {CHANNEL_OPTIONS.map((opt) => {
                    const isSelected = channel === opt.value;
                    return (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => setChannel(opt.value)}
                        className={`py-2 px-1 text-center text-xs font-bold border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#C6FF00] text-[#0A0A0A] border-[#C6FF00]'
                            : 'bg-[#161616] text-white/70 border-white/10 hover:text-white hover:border-white/20'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. CONTATO / REFERÊNCIA (CAMPO ÚNICO INTELIGENTE) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-white">
                    3. CONTATO / REFERÊNCIA (OPCIONAL)
                  </label>
                  {referenceFeedback.type !== 'empty' && (
                    <span className="text-[10px] text-[#C6FF00]">
                      ✓ {referenceFeedback.label}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Telefone, e-mail, @instagram ou nome do contato..."
                  value={contactReference}
                  onChange={(e) => setContactReference(e.target.value)}
                  className="w-full bg-[#161616] border border-white/15 px-3 py-2 text-white placeholder-white/30 focus:border-[#C6FF00] outline-none"
                />
                <p className="text-[10px] text-white/40 font-sans mt-1">
                  Detecta automaticamente e-mail (@...), telefone, @perfil do Instagram ou nome da pessoa.
                </p>
              </div>

              {/* 4. ESTÁGIO INICIAL */}
              <div>
                <label className="text-[11px] font-bold text-white block mb-1.5">
                  4. ESTÁGIO NO PIPELINE
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {PROSPECT_STATUSES.slice(0, 4).map((st) => {
                    const isSelected = status === st.id;
                    return (
                      <button
                        type="button"
                        key={st.id}
                        onClick={() => setStatus(st.id)}
                        className={`py-2 px-2 text-xs font-bold border text-left transition-colors cursor-pointer ${
                          isSelected
                            ? `${st.badgeBg} ${st.badgeText} ${st.borderColor} shadow-xs`
                            : 'bg-[#161616] text-white/60 border-white/10 hover:text-white'
                        }`}
                      >
                        {st.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. PRÓXIMO CONTATO / FOLLOW-UP */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-white">
                    5. PRÓXIMO CONTATO / FOLLOW-UP (OPCIONAL)
                  </label>
                  {nextContactAt && (
                    <span className="text-[10px] text-emerald-400 font-bold">
                      Agendado: {formatDateTimeBR(nextContactAt)}
                    </span>
                  )}
                </div>

                {/* Botões Rápidos de Data */}
                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                  <button
                    type="button"
                    onClick={() => setQuickDate(0, setNextContactAt)}
                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 text-[11px] cursor-pointer"
                  >
                    Hoje (18h)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate(1, setNextContactAt)}
                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 text-[11px] cursor-pointer"
                  >
                    Amanhã
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate(2, setNextContactAt)}
                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 text-[11px] cursor-pointer"
                  >
                    +2 dias
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate(5, setNextContactAt)}
                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 text-[11px] cursor-pointer"
                  >
                    +5 dias
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate(7, setNextContactAt)}
                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 text-[11px] cursor-pointer"
                  >
                    +7 dias
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate(null, setNextContactAt)}
                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white border border-white/10 text-[11px] cursor-pointer"
                  >
                    Sem data
                  </button>
                </div>

                {/* Input Datetime opcional */}
                <input
                  type="datetime-local"
                  value={nextContactAt}
                  onChange={(e) => setNextContactAt(e.target.value)}
                  className="w-full bg-[#161616] border border-white/15 px-3 py-2 text-white focus:border-[#C6FF00] outline-none text-xs"
                />
              </div>

              {/* 6. NOTA INICIAL / CONTEXTO RÁPIDO */}
              <div>
                <label className="text-[11px] font-bold text-white block mb-1">
                  6. NOTA INICIAL / CONTEXTO (OPCIONAL)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: viu anúncio no Instagram, pediu orçamento de tráfego, aguardando sócio voltar de viagem..."
                  value={initialNote}
                  onChange={(e) => setInitialNote(e.target.value)}
                  className="w-full bg-[#161616] border border-white/15 px-3 py-2 text-white placeholder-white/30 focus:border-[#C6FF00] outline-none font-sans text-xs"
                />
              </div>

              {/* OPÇÃO DE CAMPOS AVANÇADOS (PRESERVADOS DO MODELO COMPLETO) */}
              <div className="pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAdvancedFields(!showAdvancedFields)}
                  className="flex items-center gap-1.5 text-white/50 hover:text-white text-[11px] cursor-pointer transition-colors"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>
                    {showAdvancedFields
                      ? 'Ocultar campos adicionais'
                      : '+ Mais detalhes opcionais (cidade, proposta, site...)'}
                  </span>
                  <ChevronRight
                    className={`w-3 h-3 transition-transform ${showAdvancedFields ? 'rotate-90' : ''}`}
                  />
                </button>

                {showAdvancedFields && (
                  <div className="mt-3 p-3 bg-[#131313] border border-white/10 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-white/50 block mb-1">CIDADE</label>
                        <input
                          type="text"
                          placeholder="São Paulo"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full bg-[#181818] border border-white/10 px-2.5 py-1.5 text-white focus:border-[#C6FF00] outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-white/50 block mb-1">UF (ESTADO)</label>
                        <input
                          type="text"
                          maxLength={2}
                          placeholder="SP"
                          value={state}
                          onChange={(e) => setState(e.target.value.toUpperCase())}
                          className="w-full bg-[#181818] border border-white/10 px-2.5 py-1.5 text-white focus:border-[#C6FF00] outline-none uppercase"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-white/50 block mb-1">WEBSITE</label>
                        <input
                          type="text"
                          placeholder="empresa.com.br"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          className="w-full bg-[#181818] border border-white/10 px-2.5 py-1.5 text-white focus:border-[#C6FF00] outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-white/50 block mb-1">
                          VALOR ESTIMADO (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          value={proposalAmount}
                          onChange={(e) => setProposalAmount(e.target.value)}
                          className="w-full bg-[#181818] border border-white/10 px-2.5 py-1.5 text-white focus:border-[#C6FF00] outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-white/50 block mb-1">
                          SERVIÇO DE INTERESSE
                        </label>
                        <input
                          type="text"
                          placeholder="Tráfego Pago / NFC"
                          value={serviceInterest}
                          onChange={(e) => setServiceInterest(e.target.value)}
                          className="w-full bg-[#181818] border border-white/10 px-2.5 py-1.5 text-white focus:border-[#C6FF00] outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-white/50 block mb-1">PRIORIDADE</label>
                        <select
                          value={priority}
                          onChange={(e) => setPriority(e.target.value as any)}
                          className="w-full bg-[#181818] border border-white/10 px-2 py-1.5 text-white focus:border-[#C6FF00] outline-none cursor-pointer"
                        >
                          <option value="baixa">BAIXA</option>
                          <option value="media">MÉDIA</option>
                          <option value="alta">ALTA</option>
                          <option value="urgente">URGENTE</option>
                        </select>
                      </div>
                    </div>

                    {editingProspect && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/5">
                        <div>
                          <label className="text-[10px] text-white/50 block mb-1">E-MAIL INDIVIDUAL</label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#181818] border border-white/10 px-2 py-1.5 text-white focus:border-[#C6FF00] outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-white/50 block mb-1">TELEFONE INDIVIDUAL</label>
                          <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-[#181818] border border-white/10 px-2 py-1.5 text-white focus:border-[#C6FF00] outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-transparent text-white/60 hover:text-white border border-white/10 transition-colors cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#C6FF00] hover:bg-[#b0e600] disabled:opacity-40 text-[#0A0A0A] font-bold tracking-wider transition-colors cursor-pointer shadow-md"
                >
                  {isSubmitting
                    ? 'SALVANDO...'
                    : editingProspect
                    ? 'ATUALIZAR'
                    : 'CADASTRAR PROSPECT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL MINI: FOLLOW-UP RÁPIDO (5 SEGUNDOS) ================= */}
      {quickFollowUpProspect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#0E0E0E] border border-white/15 w-full max-w-md p-5 font-mono text-xs space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#C6FF00]" />
                <div>
                  <h3 className="font-bold text-white text-sm">
                    REGISTRAR FOLLOW-UP RÁPIDO
                  </h3>
                  <div className="text-[10px] text-white/50">
                    {quickFollowUpProspect.company_name}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setQuickFollowUpProspect(null)}
                className="text-white/40 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitQuickFollowUp} className="space-y-3">
              <div>
                <label className="text-[10px] text-white/50 block mb-1">CANAL UTILIZADO</label>
                <select
                  value={quickFollowUpType}
                  onChange={(e) => setQuickFollowUpType(e.target.value as any)}
                  className="w-full bg-[#161616] border border-white/10 px-2.5 py-2 text-white focus:border-[#C6FF00] outline-none cursor-pointer"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="ligacao">Ligação</option>
                  <option value="direct_instagram">Instagram</option>
                  <option value="email">E-mail</option>
                  <option value="reuniao">Reunião</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-white/50 block mb-1">
                  RESUMO DO CONTATO *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ex: mandei mensagem de follow-up, aguardando resposta..."
                  value={quickFollowUpSummary}
                  onChange={(e) => setQuickFollowUpSummary(e.target.value)}
                  className="w-full bg-[#161616] border border-white/15 px-3 py-2 text-white focus:border-[#C6FF00] outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-white/50 block mb-1">
                  PRÓXIMO CONTATO
                </label>
                <div className="flex items-center gap-1 mb-2">
                  <button
                    type="button"
                    onClick={() => setQuickDate(1, setQuickFollowUpNextDate)}
                    className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 text-[10px] cursor-pointer"
                  >
                    +1d
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate(2, setQuickFollowUpNextDate)}
                    className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 text-[10px] cursor-pointer"
                  >
                    +2d
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate(5, setQuickFollowUpNextDate)}
                    className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 text-[10px] cursor-pointer"
                  >
                    +5d
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate(null, setQuickFollowUpNextDate)}
                    className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white/40 border border-white/10 text-[10px] cursor-pointer"
                  >
                    Sem data
                  </button>
                </div>
                <input
                  type="datetime-local"
                  value={quickFollowUpNextDate}
                  onChange={(e) => setQuickFollowUpNextDate(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 px-2.5 py-1.5 text-white focus:border-[#C6FF00] outline-none text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setQuickFollowUpProspect(null)}
                  className="px-3 py-1.5 text-white/60 hover:text-white border border-white/10 cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingQuickFollowUp || !quickFollowUpSummary.trim()}
                  className="px-4 py-1.5 bg-[#C6FF00] hover:bg-[#b0e600] disabled:opacity-40 text-[#0A0A0A] font-bold tracking-wider cursor-pointer"
                >
                  {isSubmittingQuickFollowUp ? 'SALVANDO...' : 'REGISTRAR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL CONVERTER EM CLIENTE ================= */}
      {convertingProspect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-mono text-xs">
          <div className="bg-[#0E0E0E] border border-[#C6FF00]/40 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-2 text-[#C6FF00]">
              <UserCheck className="w-5 h-5 stroke-[2.5]" />
              <h3 className="text-sm font-bold text-white tracking-wider">
                CONVERTER PROSPECT EM CLIENTE
              </h3>
            </div>

            <p className="text-white/70 font-sans text-xs">
              Você está prestes a transferir{' '}
              <strong className="text-white">{convertingProspect.company_name}</strong> para a
              carteira oficial de clientes ativos da VULTO LAB.
            </p>

            <div className="space-y-1">
              <label className="text-[10px] text-white/50 block">TIPO DE SERVIÇO PRINCIPAL</label>
              <select
                value={convertServiceType}
                onChange={(e) => setConvertServiceType(e.target.value as any)}
                className="w-full bg-[#161616] border border-white/15 px-3 py-2 text-white focus:border-[#C6FF00] outline-none cursor-pointer"
              >
                {SERVICE_CONVERT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-white/5 border border-white/10 space-y-1 text-[11px] text-white/60">
              <div>✓ Prospect será marcado como FECHADO no funil</div>
              <div>✓ Criará registro na tabela pública de clientes</div>
              <div>✓ Registrará evento de auditoria no sistema</div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setConvertingProspect(null)}
                className="px-4 py-2 bg-transparent text-white/60 hover:text-white border border-white/10 cursor-pointer"
              >
                CANCELAR
              </button>
              <button
                type="button"
                disabled={isConverting}
                onClick={handleConfirmConvert}
                className="px-5 py-2 bg-[#C6FF00] hover:bg-[#b0e600] disabled:opacity-40 text-[#0A0A0A] font-bold tracking-wider cursor-pointer"
              >
                {isConverting ? 'CONVERTENDO...' : 'CONFIRMAR CONVERSÃO'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL EXCLUSÃO ================= */}
      {prospectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-mono text-xs">
          <div className="bg-[#0E0E0E] border border-rose-500/40 w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white tracking-wider">EXCLUIR PROSPECT</h3>
            </div>

            <p className="text-white/70 font-sans text-xs">
              Tem certeza de que deseja excluir{' '}
              <strong className="text-white">{prospectToDelete.company_name}</strong> do pipeline?
              Todas as interações associadas serão removidas.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setProspectToDelete(null)}
                className="px-3 py-1.5 bg-transparent text-white/60 hover:text-white border border-white/10 cursor-pointer"
              >
                CANCELAR
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold tracking-wider cursor-pointer"
              >
                EXCLUIR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
