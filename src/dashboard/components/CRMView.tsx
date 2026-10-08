import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Target,
  Plus,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  MessageCircle,
  Calendar,
  User,
  Building,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  CrmLead,
  LeadStage,
  LeadSource,
  ProfileUser,
  ServiceItem,
  fetchCrmLeads,
  createCrmLead,
  updateLeadStage,
  convertLeadToClientAndSale,
  fetchProfiles,
  fetchServicesCatalog,
} from '../../services/crmService';

const KANBAN_COLUMNS: { id: LeadStage; title: string; subtitle: string; color: string }[] = [
  { id: 'LEADS', title: 'LEADS', subtitle: 'Primeiro contato', color: 'border-white/20' },
  { id: 'CONTATO', title: 'CONTATO', subtitle: 'Em conversa ativa', color: 'border-sky-500/40' },
  { id: 'PROPOSTA', title: 'PROPOSTA', subtitle: 'Escopo & proposta enviada', color: 'border-amber-500/40' },
  { id: 'NEGOCIACAO', title: 'NEGOCIAÇÃO', subtitle: 'Ajuste de contrato', color: 'border-purple-500/40' },
  { id: 'FECHADOS', title: 'FECHADOS', subtitle: 'Negócio ganho', color: 'border-[#C6FF00]/50' },
];

const LEAD_SOURCES: LeadSource[] = [
  'Prospecção presencial',
  'Instagram',
  'WhatsApp',
  'Indicação',
  'Site',
  'Google',
  'Outbound',
  'Outro',
];

interface CRMViewProps {
  onOpenNewRecord?: () => void;
  onNavigateClients?: () => void;
}

export function CRMView({ onNavigateClients }: CRMViewProps) {
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [profiles, setProfiles] = useState<ProfileUser[]>([]);
  const [servicesCatalog, setServicesCatalog] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedOwner, setSelectedOwner] = useState<string>('all');
  const [showLostFilter, setShowLostFilter] = useState(false);

  // Drag and Drop state
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<LeadStage | null>(null);

  // Modals
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [closingLead, setClosingLead] = useState<CrmLead | null>(null);

  // New Lead Form State
  const [formCompany, setFormCompany] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formInstagram, setFormInstagram] = useState('');
  const [formSource, setFormSource] = useState<LeadSource>('Site');
  const [formServiceInterest, setFormServiceInterest] = useState('');
  const [formEstimatedValue, setFormEstimatedValue] = useState<number | ''>('');
  const [formAssignedTo, setFormAssignedTo] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formFollowUp, setFormFollowUp] = useState('');
  const [isSubmittingNewLead, setIsSubmittingNewLead] = useState(false);

  // Closed Modal Form State
  const [closedValue, setClosedValue] = useState<number>(0);
  const [closedService, setClosedService] = useState<string>('');
  const [closedDate, setClosedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [closedCreateClient, setClosedCreateClient] = useState(true);
  const [closedCreateSale, setClosedCreateSale] = useState(true);
  const [isSubmittingClosed, setIsSubmittingClosed] = useState(false);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [leadsData, profilesData, servicesData] = await Promise.all([
        fetchCrmLeads(),
        fetchProfiles(),
        fetchServicesCatalog(),
      ]);

      setLeads(leadsData);
      setProfiles(profilesData);
      setServicesCatalog(servicesData);
    } catch (err: any) {
      console.error('Erro ao buscar dados do CRM:', err);
      setErrorMsg('Falha ao conectar com o Supabase. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Profiles Map for quick name lookup
  const profileMap = useMemo(() => {
    const map = new Map<string, string>();
    profiles.forEach((p) => {
      map.set(p.id, p.full_name);
      if (p.email) map.set(p.email, p.full_name);
    });
    map.set('felipe', 'Felipe Ramos');
    map.set('pietro', 'Pietro Fontana');
    return map;
  }, [profiles]);

  // Metrics
  const activeLeads = leads.filter((l) => l.status !== 'FECHADOS' && l.status !== 'PERDIDOS');
  const totalLeadsCount = leads.length;
  const totalPipelineValue = activeLeads.reduce((acc, l) => acc + (l.estimated_value || 0), 0);

  // Fechados neste mês
  const currentMonthPrefix = new Date().toISOString().slice(0, 7);
  const closedThisMonth = leads.filter(
    (l) => l.status === 'FECHADOS' && (l.updated_at || l.created_at).startsWith(currentMonthPrefix)
  );
  const closedThisMonthValue = closedThisMonth.reduce(
    (acc, l) => acc + (l.estimated_value || 0),
    0
  );
  const lostLeads = leads.filter((l) => l.status === 'PERDIDOS');

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (showLostFilter) {
        if (l.status !== 'PERDIDOS') return false;
      } else {
        if (l.status === 'PERDIDOS') return false;
      }

      if (selectedOwner !== 'all') {
        if (l.assigned_to !== selectedOwner) return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchComp = l.company.toLowerCase().includes(q);
        const matchName = l.name.toLowerCase().includes(q);
        const matchService = (l.service_interest || '').toLowerCase().includes(q);
        const matchEmail = (l.email || '').toLowerCase().includes(q);
        if (!matchComp && !matchName && !matchService && !matchEmail) return false;
      }

      return true;
    });
  }, [leads, showLostFilter, selectedOwner, search]);

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent, stage: LeadStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== stage) {
      setDragOverColumn(stage);
    }
  };

  const handleDragLeave = (stage: LeadStage) => {
    if (dragOverColumn === stage) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStage: LeadStage) => {
    e.preventDefault();
    setDragOverColumn(null);
    const leadId = e.dataTransfer.getData('text/plain') || draggingLeadId;
    setDraggingLeadId(null);

    if (!leadId) return;

    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === targetStage) return;

    // Se for mover para FECHADOS, abre o modal de fechamento comercial
    if (targetStage === 'FECHADOS') {
      setClosingLead(lead);
      setClosedValue(lead.estimated_value || 0);
      setClosedService(lead.service_interest || servicesCatalog[0]?.name || 'Serviço de Alta Performance');
      setClosedDate(new Date().toISOString().slice(0, 10));
      return;
    }

    // Otimistic update
    const previousStatus = lead.status;
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: targetStage, updated_at: new Date().toISOString() } : l))
    );

    // Supabase update
    const res = await updateLeadStage(leadId, targetStage, lead.company);
    if (!res.success) {
      // Revert if error
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: previousStatus } : l))
      );
      alert(`Erro ao atualizar lead no Supabase: ${res.error}`);
    }
  };

  // Direct move button (acessibilidade / mobile)
  const handleQuickMove = async (lead: CrmLead, nextStage: LeadStage) => {
    if (nextStage === 'FECHADOS') {
      setClosingLead(lead);
      setClosedValue(lead.estimated_value || 0);
      setClosedService(lead.service_interest || servicesCatalog[0]?.name || 'Serviço de Alta Performance');
      setClosedDate(new Date().toISOString().slice(0, 10));
      return;
    }

    const previousStatus = lead.status;
    setLeads((prev) =>
      prev.map((l) => (l.id === lead.id ? { ...l, status: nextStage, updated_at: new Date().toISOString() } : l))
    );

    const res = await updateLeadStage(lead.id, nextStage, lead.company);
    if (!res.success) {
      setLeads((prev) =>
        prev.map((l) => (l.id === lead.id ? { ...l, status: previousStatus } : l))
      );
      alert(`Erro ao atualizar lead: ${res.error}`);
    }
  };

  // WhatsApp Action
  const handleOpenWhatsApp = (phone: string, company: string, contact: string) => {
    const cleanNumber = phone.replace(/\D/g, '');
    const formattedNumber = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`;
    const text = encodeURIComponent(
      `Olá ${contact}! Aqui é da VULTO LAB. Gostaria de dar continuidade à conversa sobre os projetos da ${company}.`
    );
    window.open(`https://wa.me/${formattedNumber}?text=${text}`, '_blank');
  };

  // Submit New Lead
  const handleCreateLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCompany.trim() || !formContact.trim()) {
      alert('Preencha os campos obrigatórios (Empresa e Contato).');
      return;
    }

    setIsSubmittingNewLead(true);
    const estVal = typeof formEstimatedValue === 'number' ? formEstimatedValue : 0;

    const res = await createCrmLead({
      company: formCompany.trim(),
      name: formContact.trim(),
      phone: formPhone.trim() || null,
      email: formEmail.trim() || null,
      instagram: formInstagram.trim() || null,
      source: formSource,
      service_interest: formServiceInterest || (servicesCatalog[0]?.name ?? 'Consultoria Digital'),
      estimated_value: estVal,
      assigned_to: formAssignedTo || null,
      notes: formNotes.trim() || null,
      next_follow_up: formFollowUp || null,
    });

    setIsSubmittingNewLead(false);

    if (res.error) {
      alert(`Erro ao criar lead: ${res.error}`);
      return;
    }

    if (res.data) {
      setLeads((prev) => [res.data!, ...prev]);
    }

    // Reset form
    setFormCompany('');
    setFormContact('');
    setFormPhone('');
    setFormEmail('');
    setFormInstagram('');
    setFormSource('Site');
    setFormServiceInterest('');
    setFormEstimatedValue('');
    setFormAssignedTo('');
    setFormNotes('');
    setFormFollowUp('');
    setIsNewLeadOpen(false);
  };

  // Submit Closed Lead Modal
  const handleConfirmClosedDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closingLead) return;

    setIsSubmittingClosed(true);

    const res = await convertLeadToClientAndSale({
      leadId: closingLead.id,
      leadCompany: closingLead.company,
      leadContact: closingLead.name,
      leadEmail: closingLead.email,
      leadPhone: closingLead.phone,
      finalValue: Number(closedValue) || 0,
      service: closedService || closingLead.service_interest || 'Serviço Vulto Lab',
      date: closedDate,
      createClient: closedCreateClient,
      createSale: closedCreateSale,
    });

    setIsSubmittingClosed(false);

    if (!res.success) {
      alert(`Erro ao fechar negócio: ${res.error}`);
      return;
    }

    // Update in local state
    setLeads((prev) =>
      prev.map((l) =>
        l.id === closingLead.id
          ? {
              ...l,
              status: 'FECHADOS',
              estimated_value: Number(closedValue) || 0,
              updated_at: new Date().toISOString(),
            }
          : l
      )
    );

    setClosingLead(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111111] border border-white/10 p-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-widest text-[#C6FF00] uppercase">
              // CRM & FUNIL COMERCIAL
            </span>
            <span className="text-white/20">•</span>
            <span className="text-[10px] font-mono text-white/50">
              SUPABASE PIPELINE
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono text-white">
            Controle de Prospecção & Fechamentos
          </h1>
          <p className="text-xs text-white/60 font-sans mt-0.5">
            Acompanhe a jornada comercial da VULTO LAB do primeiro lead até a conversão em cliente ativo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadData}
            title="Recarregar dados do Supabase"
            className="p-2.5 bg-[#161616] hover:bg-[#202020] border border-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#C6FF00]' : ''}`} />
          </button>

          <button
            onClick={() => setIsNewLeadOpen(true)}
            className="px-4 py-2.5 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-mono font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>NOVO LEAD</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Leads */}
        <div className="bg-[#111111] border border-white/10 p-4">
          <div className="text-[11px] font-mono text-white/40 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Total de Leads</span>
            <Target className="w-3.5 h-3.5 text-white/30" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {totalLeadsCount}
          </div>
          <div className="text-[11px] font-mono text-white/50 mt-1">
            {activeLeads.length} oportunidades ativas
          </div>
        </div>

        {/* Pipeline Value */}
        <div className="bg-[#111111] border border-white/10 p-4">
          <div className="text-[11px] font-mono text-white/40 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Valor em Pipeline</span>
            <DollarSign className="w-3.5 h-3.5 text-white/30" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            R$ {totalPipelineValue.toLocaleString('pt-BR')},00
          </div>
          <div className="text-[11px] font-mono text-amber-400 mt-1">
            Volume em negociação
          </div>
        </div>

        {/* Fechados no Mês */}
        <div className="bg-[#111111] border border-white/10 p-4">
          <div className="text-[11px] font-mono text-white/40 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Fechados este Mês</span>
            <TrendingUp className="w-3.5 h-3.5 text-[#C6FF00]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#C6FF00]">
            R$ {closedThisMonthValue.toLocaleString('pt-BR')},00
          </div>
          <div className="text-[11px] font-mono text-[#C6FF00] mt-1">
            {closedThisMonth.length} contratos convertidos
          </div>
        </div>

        {/* Perdidos */}
        <div className="bg-[#111111] border border-white/10 p-4">
          <div className="text-[11px] font-mono text-white/40 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Perdidos / Arquivados</span>
            <XCircle className="w-3.5 h-3.5 text-white/30" />
          </div>
          <div className="text-2xl font-bold font-mono text-white/70">
            {lostLeads.length} leads
          </div>
          <div className="text-[11px] font-mono text-white/40 mt-1">
            Filtro separado disponível
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-[#111111] border border-white/10 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por empresa, contato, serviço..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#161616] border border-white/10 pl-9 pr-3 py-1.5 text-xs text-white placeholder-white/30 font-mono focus:border-[#C6FF00] focus:outline-none"
            />
          </div>

          {/* Owner Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-white/40" />
            <select
              value={selectedOwner}
              onChange={(e) => setSelectedOwner(e.target.value)}
              className="bg-[#161616] border border-white/10 px-3 py-1.5 text-xs font-mono text-white focus:border-[#C6FF00] focus:outline-none cursor-pointer"
            >
              <option value="all">Todos Responsáveis</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Lost Filter Button Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLostFilter(false)}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer border ${
              !showLostFilter
                ? 'bg-[#1C1C1C] text-[#C6FF00] border-[#C6FF00]/40'
                : 'bg-transparent text-white/50 border-white/10 hover:text-white'
            }`}
          >
            Funil Ativo
          </button>
          <button
            onClick={() => setShowLostFilter(true)}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer border flex items-center gap-1.5 ${
              showLostFilter
                ? 'bg-rose-950/40 text-rose-400 border-rose-500/40'
                : 'bg-transparent text-white/50 border-white/10 hover:text-white'
            }`}
          >
            <span>Perdidos</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-white/10 text-white rounded">
              {lostLeads.length}
            </span>
          </button>
        </div>
      </div>

      {/* Error Notice */}
      {errorMsg && (
        <div className="p-3 bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main View: Kanban Board or Lost Filter View */}
      {showLostFilter ? (
        <div className="bg-[#111111] border border-white/10 p-5">
          <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
            <div>
              <h2 className="text-sm font-mono font-bold text-rose-400 uppercase tracking-wider">
                Leads Arquivados / Perdidos ({lostLeads.length})
              </h2>
              <p className="text-xs text-white/50 font-sans mt-0.5">
                Oportunidades que não avançaram no ciclo comercial. Você pode reativá-las a qualquer momento.
              </p>
            </div>
          </div>

          {filteredLeads.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-white/40 border border-dashed border-white/10">
              Nenhum lead com status PERDIDO encontrado.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLeads.map((lead) => (
                <div key={lead.id} className="bg-[#141414] border border-white/10 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-bold text-white font-mono">{lead.company}</div>
                      <div className="text-xs text-white/60 font-sans">{lead.name}</div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      PERDIDO
                    </span>
                  </div>

                  <div className="text-xs text-white/70 space-y-1 font-mono">
                    <div>Serviço: {lead.service_interest || 'Geral'}</div>
                    <div>Valor: R$ {lead.estimated_value.toLocaleString('pt-BR')},00</div>
                    {lead.notes && (
                      <p className="text-[11px] text-white/40 font-sans italic mt-1 border-l border-white/10 pl-2">
                        "{lead.notes}"
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <button
                      onClick={() => handleQuickMove(lead, 'LEADS')}
                      className="text-[11px] font-mono text-[#C6FF00] hover:underline cursor-pointer"
                    >
                      Reativar no Funil →
                    </button>
                    {lead.phone && (
                      <button
                        onClick={() => handleOpenWhatsApp(lead.phone!, lead.company, lead.name)}
                        className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <MessageCircle className="w-3 h-3" />
                        WhatsApp
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* KANBAN BOARD */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5 items-start">
          {KANBAN_COLUMNS.map((column) => {
            const columnLeads = filteredLeads.filter((l) => l.status === column.id);
            const columnTotal = columnLeads.reduce((acc, l) => acc + (l.estimated_value || 0), 0);
            const isDragTarget = dragOverColumn === column.id;

            return (
              <div
                key={column.id}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={() => handleDragLeave(column.id)}
                onDrop={(e) => handleDrop(e, column.id)}
                className={`bg-[#111111] border ${
                  isDragTarget ? 'border-[#C6FF00] bg-[#141812]' : 'border-white/10'
                } flex flex-col transition-colors min-h-[500px]`}
              >
                {/* Column Header */}
                <div className={`p-3 border-b ${column.color} bg-[#141414]`}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-white tracking-wider">
                      {column.title}
                    </span>
                    <span className="text-[11px] font-mono px-1.5 py-0.2 bg-white/10 text-white/80 rounded">
                      {columnLeads.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-white/50 mt-1">
                    <span>{column.subtitle}</span>
                    <span className="text-[#C6FF00]">
                      R$ {columnTotal.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>

                {/* Column Body / Drop Zone */}
                <div className="p-2 space-y-2.5 flex-1 overflow-y-auto max-h-[70vh]">
                  {columnLeads.length === 0 ? (
                    <div
                      className={`p-6 text-center text-[11px] font-mono border border-dashed ${
                        isDragTarget
                          ? 'border-[#C6FF00] text-[#C6FF00]'
                          : 'border-white/5 text-white/30'
                      }`}
                    >
                      {isDragTarget ? 'Soltar aqui' : 'Nenhum lead nesta etapa'}
                    </div>
                  ) : (
                    columnLeads.map((lead) => {
                      const isDragging = draggingLeadId === lead.id;
                      const ownerName =
                        lead.assigned_to ? profileMap.get(lead.assigned_to) || lead.assigned_to : 'Não atribuído';

                      return (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead.id)}
                          className={`bg-[#141414] hover:bg-[#181818] border border-white/10 hover:border-white/20 p-3.5 space-y-2.5 cursor-grab active:cursor-grabbing transition-all ${
                            isDragging ? 'opacity-40 scale-95 border-amber-400' : ''
                          }`}
                        >
                          {/* Card Header: Company & Quick Move */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="font-mono text-xs font-bold text-white truncate" title={lead.company}>
                                {lead.company}
                              </h3>
                              <p className="font-sans text-[11px] text-white/60 truncate" title={lead.name}>
                                {lead.name}
                              </p>
                            </div>
                            {lead.source && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 bg-white/5 text-white/50 border border-white/10 shrink-0">
                                {lead.source}
                              </span>
                            )}
                          </div>

                          {/* Service & Estimated Value */}
                          <div className="bg-[#0C0C0C] border border-white/5 p-2 space-y-1">
                            <div className="text-[10px] font-mono text-white/50 flex items-center justify-between">
                              <span>Serviço:</span>
                              <span className="text-white/80 truncate max-w-[120px] text-right">
                                {lead.service_interest || 'Geral'}
                              </span>
                            </div>
                            <div className="text-[10px] font-mono text-white/50 flex items-center justify-between">
                              <span>Estimado:</span>
                              <span className="text-[#C6FF00] font-bold">
                                R$ {lead.estimated_value.toLocaleString('pt-BR')},00
                              </span>
                            </div>
                          </div>

                          {/* Metadata: Owner & Follow-up */}
                          <div className="space-y-1 text-[10px] font-mono text-white/50">
                            <div className="flex items-center gap-1.5 truncate">
                              <User className="w-3 h-3 text-white/40 shrink-0" />
                              <span className="truncate">{ownerName}</span>
                            </div>

                            {lead.next_follow_up && (
                              <div className="flex items-center gap-1.5 text-amber-400/90">
                                <Clock className="w-3 h-3 shrink-0" />
                                <span>Follow: {lead.next_follow_up}</span>
                              </div>
                            )}
                          </div>

                          {/* Actions Strip */}
                          <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-1">
                            {lead.phone ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenWhatsApp(lead.phone!, lead.company, lead.name);
                                }}
                                title="Abrir conversa no WhatsApp"
                                className="px-2 py-1 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <MessageCircle className="w-3 h-3" />
                                <span>WHATSAPP</span>
                              </button>
                            ) : (
                              <span className="text-[10px] font-mono text-white/20">Sem tel</span>
                            )}

                            {/* Stage Quick Advance (Acessibilidade) */}
                            <div className="flex items-center gap-1">
                              {column.id !== 'FECHADOS' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const stageOrder: LeadStage[] = ['LEADS', 'CONTATO', 'PROPOSTA', 'NEGOCIACAO', 'FECHADOS'];
                                    const nextIdx = stageOrder.indexOf(column.id) + 1;
                                    if (nextIdx < stageOrder.length) {
                                      handleQuickMove(lead, stageOrder[nextIdx]);
                                    }
                                  }}
                                  title="Avançar etapa"
                                  className="p-1 hover:bg-white/10 text-white/50 hover:text-[#C6FF00] cursor-pointer"
                                >
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Deseja marcar o lead "${lead.company}" como PERDIDO?`)) {
                                    handleQuickMove(lead, 'PERDIDOS');
                                  }
                                }}
                                title="Marcar como Perdido"
                                className="p-1 hover:bg-white/10 text-white/30 hover:text-rose-400 cursor-pointer text-[10px] font-mono"
                              >
                                <XCircle className="w-3 h-3" />
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
      )}

      {/* ========================================================= */}
      {/* MODAL: NOVO LEAD */}
      {/* ========================================================= */}
      {isNewLeadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#111111] border border-white/20 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-[#C6FF00] uppercase">
                  // CRM PROSPECÇÃO
                </span>
                <h2 className="text-lg font-mono font-bold text-white">
                  Cadastrar Novo Lead
                </h2>
              </div>
              <button
                onClick={() => setIsNewLeadOpen(false)}
                className="text-white/40 hover:text-white p-1 cursor-pointer font-mono text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateLeadSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Empresa */}
                <div>
                  <label className="block text-xs font-mono text-white/70 mb-1">
                    Empresa *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Grupo Alpha Solar"
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-xs font-mono text-white focus:border-[#C6FF00] focus:outline-none"
                  />
                </div>

                {/* Contato */}
                <div>
                  <label className="block text-xs font-mono text-white/70 mb-1">
                    Nome do Contato *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Rodrigo Mendes (Diretor)"
                    value={formContact}
                    onChange={(e) => setFormContact(e.target.value)}
                    className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-xs font-mono text-white focus:border-[#C6FF00] focus:outline-none"
                  />
                </div>

                {/* Telefone */}
                <div>
                  <label className="block text-xs font-mono text-white/70 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="11999998888"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-xs font-mono text-white focus:border-[#C6FF00] focus:outline-none"
                  />
                </div>

                {/* E-mail */}
                <div>
                  <label className="block text-xs font-mono text-white/70 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    placeholder="contato@empresa.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-xs font-mono text-white focus:border-[#C6FF00] focus:outline-none"
                  />
                </div>

                {/* Instagram */}
                <div>
                  <label className="block text-xs font-mono text-white/70 mb-1">
                    Instagram
                  </label>
                  <input
                    type="text"
                    placeholder="@perfil"
                    value={formInstagram}
                    onChange={(e) => setFormInstagram(e.target.value)}
                    className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-xs font-mono text-white focus:border-[#C6FF00] focus:outline-none"
                  />
                </div>

                {/* Origem */}
                <div>
                  <label className="block text-xs font-mono text-white/70 mb-1">
                    Origem
                  </label>
                  <select
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value as LeadSource)}
                    className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-xs font-mono text-white focus:border-[#C6FF00] focus:outline-none cursor-pointer"
                  >
                    {LEAD_SOURCES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Serviço de Interesse */}
                <div>
                  <label className="block text-xs font-mono text-white/70 mb-1">
                    Serviço de Interesse
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Tráfego Pago + Vulto Tap"
                    value={formServiceInterest}
                    onChange={(e) => setFormServiceInterest(e.target.value)}
                    list="services-list"
                    className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-xs font-mono text-white focus:border-[#C6FF00] focus:outline-none"
                  />
                  <datalist id="services-list">
                    {servicesCatalog.map((s) => (
                      <option key={s.id} value={s.name} />
                    ))}
                  </datalist>
                </div>

                {/* Valor Estimado */}
                <div>
                  <label className="block text-xs font-mono text-white/70 mb-1">
                    Valor Estimado (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="5000"
                    value={formEstimatedValue}
                    onChange={(e) =>
                      setFormEstimatedValue(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-xs font-mono text-white focus:border-[#C6FF00] focus:outline-none"
                  />
                </div>

                {/* Responsável */}
                <div>
                  <label className="block text-xs font-mono text-white/70 mb-1">
                    Responsável
                  </label>
                  <select
                    value={formAssignedTo}
                    onChange={(e) => setFormAssignedTo(e.target.value)}
                    className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-xs font-mono text-white focus:border-[#C6FF00] focus:outline-none cursor-pointer"
                  >
                    <option value="">Não atribuído</option>
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Próximo Follow-up */}
                <div>
                  <label className="block text-xs font-mono text-white/70 mb-1">
                    Próximo Follow-up
                  </label>
                  <input
                    type="date"
                    value={formFollowUp}
                    onChange={(e) => setFormFollowUp(e.target.value)}
                    className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-xs font-mono text-white focus:border-[#C6FF00] focus:outline-none"
                  />
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-mono text-white/70 mb-1">
                  Observações / Histórico de Contato
                </label>
                <textarea
                  rows={3}
                  placeholder="Detalhes da conversa, necessidades identificadas, expectativas..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-xs font-sans text-white focus:border-[#C6FF00] focus:outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewLeadOpen(false)}
                  className="px-4 py-2 text-xs font-mono text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNewLead}
                  className="px-5 py-2.5 bg-[#C6FF00] hover:bg-[#b0e600] disabled:bg-white/20 text-[#0A0A0A] font-mono font-bold text-xs tracking-wider transition-colors cursor-pointer flex items-center gap-2"
                >
                  {isSubmittingNewLead ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>SALVANDO...</span>
                    </>
                  ) : (
                    <span>SALVAR NOVO LEAD</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: NEGÓCIO FECHADO (CONVERSÃO DE LEAD) */}
      {/* ========================================================= */}
      {closingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#111111] border border-[#C6FF00]/40 w-full max-w-lg">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 bg-[#161813] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <Sparkles className="w-4 h-4 text-[#C6FF00]" />
                  <span className="text-[10px] font-mono tracking-widest text-[#C6FF00] uppercase font-bold">
                    // SUCESSO COMERCIAL
                  </span>
                </div>
                <h2 className="text-xl font-mono font-bold text-white">
                  NEGÓCIO FECHADO!
                </h2>
              </div>
              <button
                onClick={() => setClosingLead(null)}
                className="text-white/40 hover:text-white p-1 cursor-pointer font-mono text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleConfirmClosedDeal} className="p-5 space-y-4">
              <div className="bg-[#141414] border border-white/10 p-3 space-y-1">
                <div className="text-xs font-mono text-white/50">Lead Concluído:</div>
                <div className="text-sm font-mono font-bold text-white">
                  {closingLead.company} ({closingLead.name})
                </div>
              </div>

              {/* Valor Final */}
              <div>
                <label className="block text-xs font-mono text-white/70 mb-1">
                  Valor Final do Contrato (R$) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="50"
                  value={closedValue}
                  onChange={(e) => setClosedValue(Number(e.target.value))}
                  className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-sm font-mono text-[#C6FF00] font-bold focus:border-[#C6FF00] focus:outline-none"
                />
              </div>

              {/* Serviço */}
              <div>
                <label className="block text-xs font-mono text-white/70 mb-1">
                  Serviço Contratado *
                </label>
                <input
                  type="text"
                  required
                  value={closedService}
                  onChange={(e) => setClosedService(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-xs font-mono text-white focus:border-[#C6FF00] focus:outline-none"
                />
              </div>

              {/* Data */}
              <div>
                <label className="block text-xs font-mono text-white/70 mb-1">
                  Data do Fechamento *
                </label>
                <input
                  type="date"
                  required
                  value={closedDate}
                  onChange={(e) => setClosedDate(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-xs font-mono text-white focus:border-[#C6FF00] focus:outline-none"
                />
              </div>

              {/* Perguntas de Integração Automática */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={closedCreateClient}
                    onChange={(e) => setClosedCreateClient(e.target.checked)}
                    className="mt-0.5 accent-[#C6FF00] cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-mono text-white font-bold block">
                      Transformar este lead em cliente?
                    </span>
                    <span className="text-[11px] font-sans text-white/50 block">
                      Cria automaticamente um registro na tabela `clients` com status ativo.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={closedCreateSale}
                    onChange={(e) => setClosedCreateSale(e.target.checked)}
                    className="mt-0.5 accent-[#C6FF00] cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-mono text-white font-bold block">
                      Registrar venda no financeiro?
                    </span>
                    <span className="text-[11px] font-sans text-white/50 block">
                      Cria uma entrada na tabela `sales` impactando as métricas de receita hoje e do mês.
                    </span>
                  </div>
                </label>
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setClosingLead(null)}
                  className="px-4 py-2 text-xs font-mono text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingClosed}
                  className="px-5 py-2.5 bg-[#C6FF00] hover:bg-[#b0e600] disabled:bg-white/20 text-[#0A0A0A] font-mono font-bold text-xs tracking-wider transition-colors cursor-pointer flex items-center gap-2"
                >
                  {isSubmittingClosed ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>PROCESSANDO...</span>
                    </>
                  ) : (
                    <span>CONFIRMAR FECHAMENTO</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
