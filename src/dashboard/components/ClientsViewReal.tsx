import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  Plus,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  MessageCircle,
  Calendar,
  Phone,
  Mail,
  Building,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import {
  ClientEntity,
  ServiceItem,
  fetchClients,
  createClient,
  fetchServicesCatalog,
} from '../../services/crmService';

type ClientStatusFilter = 'all' | 'active' | 'onboarding' | 'paused' | 'churned';

export function ClientsViewReal() {
  const [clients, setClients] = useState<ClientEntity[]>([]);
  const [servicesCatalog, setServicesCatalog] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters & State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatusFilter>('all');
  const [selectedClient, setSelectedClient] = useState<ClientEntity | null>(null);

  // Modal State
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const [formCompany, setFormCompany] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'onboarding' | 'paused' | 'churned'>('active');
  const [formMonthlyFee, setFormMonthlyFee] = useState<number | ''>('');
  const [formSetupFee, setFormSetupFee] = useState<number | ''>('');
  const [formSelectedServices, setFormSelectedServices] = useState<string[]>([]);
  const [formCustomService, setFormCustomService] = useState('');
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [formNotes, setFormNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load clients
  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [clientsData, catalog] = await Promise.all([
        fetchClients(),
        fetchServicesCatalog(),
      ]);
      setClients(clientsData);
      setServicesCatalog(catalog);
      if (clientsData.length > 0 && !selectedClient) {
        setSelectedClient(clientsData[0]);
      }
    } catch (err: any) {
      console.error('Erro ao carregar clientes:', err);
      setErrorMsg('Falha ao sincronizar clientes do Supabase.');
    } finally {
      setLoading(false);
    }
  }, [selectedClient]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Keep selected client updated if data reloaded
  useEffect(() => {
    if (selectedClient) {
      const match = clients.find((c) => c.id === selectedClient.id);
      if (match) setSelectedClient(match);
    }
  }, [clients, selectedClient]);

  // Metrics
  const activeClients = clients.filter((c) => c.status === 'active');
  const onboardingClients = clients.filter((c) => c.status === 'onboarding');
  const totalMrr = activeClients.reduce((acc, c) => acc + (c.monthly_fee || 0), 0);
  const avgTicket = activeClients.length > 0 ? Math.round(totalMrr / activeClients.length) : 0;

  // Filtered List
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchComp = c.company_name.toLowerCase().includes(q);
        const matchCont = c.contact_name.toLowerCase().includes(q);
        const matchEmail = (c.email || '').toLowerCase().includes(q);
        const matchServ = c.services.some((s) => s.toLowerCase().includes(q));
        if (!matchComp && !matchCont && !matchEmail && !matchServ) return false;
      }
      return true;
    });
  }, [clients, statusFilter, search]);

  // WhatsApp Action
  const handleOpenWhatsApp = (phone: string, company: string, contact: string) => {
    const cleanNumber = phone.replace(/\D/g, '');
    const formattedNumber = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`;
    const text = encodeURIComponent(
      `Olá ${contact}! Aqui é da equipe VULTO LAB. Gostaria de alinhar nossos próximos passos com a ${company}.`
    );
    window.open(`https://wa.me/${formattedNumber}?text=${text}`, '_blank');
  };

  // Toggle service selection in form
  const toggleService = (name: string) => {
    setFormSelectedServices((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  // Submit New Client
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCompany.trim() || !formContact.trim()) {
      alert('Preencha os campos obrigatórios (Empresa e Contato).');
      return;
    }

    const servicesToSave = [...formSelectedServices];
    if (formCustomService.trim()) {
      servicesToSave.push(formCustomService.trim());
    }

    if (servicesToSave.length === 0) {
      servicesToSave.push('Serviço Especializado');
    }

    setIsSubmitting(true);
    const mrr = typeof formMonthlyFee === 'number' ? formMonthlyFee : 0;
    const setup = typeof formSetupFee === 'number' ? formSetupFee : 0;

    const res = await createClient({
      company_name: formCompany.trim(),
      contact_name: formContact.trim(),
      email: formEmail.trim() || null,
      phone: formPhone.trim() || null,
      status: formStatus,
      monthly_fee: mrr,
      setup_fee: setup,
      services: servicesToSave,
      start_date: formStartDate,
      notes: formNotes.trim() || null,
    });

    setIsSubmitting(false);

    if (res.error) {
      alert(`Erro ao cadastrar cliente: ${res.error}`);
      return;
    }

    if (res.data) {
      setClients((prev) => [res.data!, ...prev]);
      setSelectedClient(res.data);
    }

    // Reset Form
    setFormCompany('');
    setFormContact('');
    setFormEmail('');
    setFormPhone('');
    setFormStatus('active');
    setFormMonthlyFee('');
    setFormSetupFee('');
    setFormSelectedServices([]);
    setFormCustomService('');
    setFormNotes('');
    setIsNewClientOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111111] border border-white/10 p-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-widest text-[#C6FF00] uppercase">
              // BASE DE CLIENTES
            </span>
            <span className="text-white/20">•</span>
            <span className="text-[10px] font-mono text-white/50">
              SUPABASE CLIENTS
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono text-white">
            Carteira de Clientes & Contratos
          </h1>
          <p className="text-xs text-white/60 font-sans mt-0.5">
            Gerenciamento dos clientes ativos, serviços contratados, faturamento recorrente (MRR) e histórico.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadData}
            title="Recarregar clientes do Supabase"
            className="p-2.5 bg-[#161616] hover:bg-[#202020] border border-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#C6FF00]' : ''}`} />
          </button>

          <button
            onClick={() => setIsNewClientOpen(true)}
            className="px-4 py-2.5 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-mono font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>CADASTRAR NOVO CLIENTE</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Clientes */}
        <div className="bg-[#111111] border border-white/10 p-4">
          <div className="text-[11px] font-mono text-white/40 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Clientes Ativos</span>
            <Users className="w-3.5 h-3.5 text-white/30" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {activeClients.length} empresas
          </div>
          <div className="text-[11px] font-mono text-[#C6FF00] mt-1">
            Total na base: {clients.length}
          </div>
        </div>

        {/* Total MRR */}
        <div className="bg-[#111111] border border-white/10 p-4">
          <div className="text-[11px] font-mono text-white/40 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Recorrência Total (MRR)</span>
            <DollarSign className="w-3.5 h-3.5 text-white/30" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            R$ {totalMrr.toLocaleString('pt-BR')},00
          </div>
          <div className="text-[11px] font-mono text-white/50 mt-1">
            Contratos ativos mensais
          </div>
        </div>

        {/* Em Onboarding */}
        <div className="bg-[#111111] border border-white/10 p-4">
          <div className="text-[11px] font-mono text-white/40 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Em Onboarding</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {onboardingClients.length} empresas
          </div>
          <div className="text-[11px] font-mono text-white/50 mt-1">
            Setup em andamento
          </div>
        </div>

        {/* Ticket Médio */}
        <div className="bg-[#111111] border border-white/10 p-4">
          <div className="text-[11px] font-mono text-white/40 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Ticket Médio (MRR)</span>
            <TrendingUp className="w-3.5 h-3.5 text-[#C6FF00]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#C6FF00]">
            R$ {avgTicket.toLocaleString('pt-BR')},00
          </div>
          <div className="text-[11px] font-mono text-white/50 mt-1">
            Média por cliente ativo
          </div>
        </div>
      </div>

      {/* Error notice */}
      {errorMsg && (
        <div className="p-3 bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Content Split: List + Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Filter + Clients List */}
        <div className="lg:col-span-2 bg-[#111111] border border-white/10 flex flex-col">
          {/* Filter Bar */}
          <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filtrar por nome, serviço ou e-mail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#161616] border border-white/10 pl-9 pr-3 py-1.5 text-xs text-white placeholder-white/30 font-mono focus:border-[#C6FF00] focus:outline-none"
              />
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {(
                [
                  { id: 'all', label: 'Todos' },
                  { id: 'active', label: 'Ativos' },
                  { id: 'onboarding', label: 'Onboarding' },
                  { id: 'paused', label: 'Pausados' },
                  { id: 'churned', label: 'Churn' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-2.5 py-1 text-xs font-mono tracking-wider uppercase transition-colors cursor-pointer border ${
                    statusFilter === tab.id
                      ? 'bg-[#1C1C1C] text-[#C6FF00] border-[#C6FF00]/40'
                      : 'bg-transparent text-white/40 border-transparent hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* List Body */}
          <div className="divide-y divide-white/5 overflow-y-auto max-h-[600px]">
            {filteredClients.length === 0 ? (
              <div className="p-12 text-center text-xs font-mono text-white/40">
                Nenhum cliente encontrado com os filtros selecionados.
              </div>
            ) : (
              filteredClients.map((client) => {
                const isSelected = selectedClient?.id === client.id;

                let statusBadge = (
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-950/40 text-emerald-400 border border-emerald-500/20">
                    ATIVO
                  </span>
                );
                if (client.status === 'onboarding') {
                  statusBadge = (
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-950/40 text-amber-400 border border-amber-500/20">
                      ONBOARDING
                    </span>
                  );
                } else if (client.status === 'paused') {
                  statusBadge = (
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-sky-950/40 text-sky-400 border border-sky-500/20">
                      PAUSADO
                    </span>
                  );
                } else if (client.status === 'churned') {
                  statusBadge = (
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-rose-950/40 text-rose-400 border border-rose-500/20">
                      CHURN
                    </span>
                  );
                }

                return (
                  <div
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    className={`p-4 transition-colors cursor-pointer flex items-center justify-between gap-4 ${
                      isSelected
                        ? 'bg-[#181818] border-l-2 border-l-[#C6FF00]'
                        : 'hover:bg-[#141414]'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-white truncate">
                          {client.company_name}
                        </span>
                        {statusBadge}
                      </div>

                      <div className="flex items-center gap-3 text-xs font-mono text-white/50">
                        <span>{client.contact_name}</span>
                        {client.email && (
                          <>
                            <span>•</span>
                            <span className="truncate">{client.email}</span>
                          </>
                        )}
                      </div>

                      {/* Services badges */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {client.services.slice(0, 3).map((serv, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-mono px-1.5 py-0.5 bg-white/5 text-white/60 border border-white/5"
                          >
                            {serv}
                          </span>
                        ))}
                        {client.services.length > 3 && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-white/5 text-white/40">
                            +{client.services.length - 3}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[11px] font-mono text-white/40">Mensalidade (MRR)</div>
                      <div className="text-base font-bold font-mono text-[#C6FF00]">
                        R$ {client.monthly_fee.toLocaleString('pt-BR')},00
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Client Detailed View */}
        <div className="bg-[#111111] border border-white/10 p-5 space-y-5">
          {selectedClient ? (
            <>
              {/* Header */}
              <div className="border-b border-white/10 pb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono tracking-widest text-[#C6FF00] uppercase">
                    // FICHA DO CLIENTE
                  </span>
                  <span className="text-xs font-mono text-white/40">
                    ID: {selectedClient.id.slice(0, 8)}...
                  </span>
                </div>
                <h3 className="text-xl font-bold font-mono text-white">
                  {selectedClient.company_name}
                </h3>
                <div className="text-xs font-sans text-white/60 flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-white/40" />
                  <span>Contato Principal: {selectedClient.contact_name}</span>
                </div>
              </div>

              {/* Financial Profile Card */}
              <div className="bg-[#141414] border border-white/10 p-4 space-y-3">
                <div className="text-[11px] font-mono text-white/50 uppercase tracking-wider">
                  Contrato & Financeiro
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] font-mono text-white/40">MRR (Mensal)</div>
                    <div className="text-lg font-bold font-mono text-[#C6FF00]">
                      R$ {selectedClient.monthly_fee.toLocaleString('pt-BR')},00
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-white/40">Setup Inicial</div>
                    <div className="text-lg font-bold font-mono text-white">
                      R$ {(selectedClient.setup_fee || 0).toLocaleString('pt-BR')},00
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-white/10 text-xs font-mono text-white/60 flex items-center justify-between">
                  <span>Início de Contrato:</span>
                  <span className="text-white">{selectedClient.start_date}</span>
                </div>
              </div>

              {/* Contatos & Canais */}
              <div className="space-y-2">
                <div className="text-[11px] font-mono text-white/50 uppercase tracking-wider">
                  Canais de Comunicação
                </div>

                <div className="space-y-2 text-xs font-mono">
                  {selectedClient.phone ? (
                    <div className="flex items-center justify-between p-2.5 bg-[#141414] border border-white/10">
                      <div className="flex items-center gap-2 text-white">
                        <Phone className="w-3.5 h-3.5 text-white/40" />
                        <span>{selectedClient.phone}</span>
                      </div>
                      <button
                        onClick={() =>
                          handleOpenWhatsApp(
                            selectedClient.phone!,
                            selectedClient.company_name,
                            selectedClient.contact_name
                          )
                        }
                        className="px-2 py-1 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-400 text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>WHATSAPP</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-[#141414] border border-white/5 text-white/30">
                      Nenhum telefone cadastrado
                    </div>
                  )}

                  {selectedClient.email ? (
                    <div className="flex items-center justify-between p-2.5 bg-[#141414] border border-white/10">
                      <div className="flex items-center gap-2 text-white truncate">
                        <Mail className="w-3.5 h-3.5 text-white/40 shrink-0" />
                        <span className="truncate">{selectedClient.email}</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Serviços Contratados */}
              <div className="space-y-2">
                <div className="text-[11px] font-mono text-white/50 uppercase tracking-wider flex items-center justify-between">
                  <span>Escopo de Serviços</span>
                  <Layers className="w-3.5 h-3.5 text-white/40" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedClient.services.map((serv, idx) => (
                    <div
                      key={idx}
                      className="px-2.5 py-1 bg-[#161616] border border-white/10 text-xs font-mono text-white flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3 h-3 text-[#C6FF00]" />
                      <span>{serv}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Observações */}
              {selectedClient.notes && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-mono text-white/50 uppercase tracking-wider">
                    Notas Internas
                  </div>
                  <div className="p-3 bg-[#141414] border border-white/10 text-xs font-sans text-white/70 italic">
                    "{selectedClient.notes}"
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center text-xs font-mono text-white/30">
              Selecione um cliente para visualizar os detalhes completos.
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL: NOVO CLIENTE */}
      {/* ========================================================= */}
      {isNewClientOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#111111] border border-white/20 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-[#C6FF00] uppercase">
                  // CADASTRO DE CLIENTE
                </span>
                <h2 className="text-lg font-mono font-bold text-white">
                  Novo Contrato / Empresa
                </h2>
              </div>
              <button
                onClick={() => setIsNewClientOpen(false)}
                className="text-white/40 hover:text-white p-1 cursor-pointer font-mono text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateClient} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Empresa */}
                <div>
                  <label className="block text-xs font-mono text-white/70 mb-1">
                    Nome da Empresa *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Omni Tech Solutions"
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-xs font-mono text-white focus:border-[#C6FF00] focus:outline-none"
                  />
                </div>

                {/* Contato Principal */}
                <div>
                  <label className="block text-xs font-mono text-white/70 mb-1">
                    Nome do Contato *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Eduardo (CEO)"
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
                    E-mail de Faturamento / Contato
                  </label>
                  <input
                    type="email"
                    placeholder="financeiro@empresa.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-xs font-mono text-white focus:border-[#C6FF00] focus:outline-none"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-mono text-white/70 mb-1">
                    Status Inicial
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-xs font-mono text-white focus:border-[#C6FF00] focus:outline-none cursor-pointer"
                  >
                    <option value="active">Ativo (Em execução regular)</option>
                    <option value="onboarding">Onboarding (Em configuração)</option>
                    <option value="paused">Pausado</option>
                    <option value="churned">Cancelado (Churn)</option>
                  </select>
                </div>

                {/* Data de Início */}
                <div>
                  <label className="block text-xs font-mono text-white/70 mb-1">
                    Data de Início do Contrato
                  </label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-xs font-mono text-white focus:border-[#C6FF00] focus:outline-none"
                  />
                </div>

                {/* MRR Mensalidade */}
                <div>
                  <label className="block text-xs font-mono text-white/70 mb-1">
                    Mensalidade Recorrente - MRR (R$) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="3500"
                    value={formMonthlyFee}
                    onChange={(e) =>
                      setFormMonthlyFee(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-xs font-mono text-[#C6FF00] font-bold focus:border-[#C6FF00] focus:outline-none"
                  />
                </div>

                {/* Setup Fee */}
                <div>
                  <label className="block text-xs font-mono text-white/70 mb-1">
                    Taxa de Setup Inicial (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="2500"
                    value={formSetupFee}
                    onChange={(e) =>
                      setFormSetupFee(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-xs font-mono text-white focus:border-[#C6FF00] focus:outline-none"
                  />
                </div>
              </div>

              {/* Serviços Contratados */}
              <div>
                <label className="block text-xs font-mono text-white/70 mb-2">
                  Serviços Contratados (Selecione um ou mais)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {servicesCatalog.map((s) => {
                    const isChecked = formSelectedServices.includes(s.name);
                    return (
                      <label
                        key={s.id}
                        className={`p-2 border text-xs font-mono flex items-center gap-2 cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-[#1C1C1C] border-[#C6FF00]/50 text-white'
                            : 'bg-[#161616] border-white/10 text-white/60 hover:text-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleService(s.name)}
                          className="accent-[#C6FF00]"
                        />
                        <span className="truncate">{s.name}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Custom service add */}
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Ou digite outro serviço personalizado..."
                    value={formCustomService}
                    onChange={(e) => setFormCustomService(e.target.value)}
                    className="w-full bg-[#161616] border border-white/10 px-3 py-1.5 text-xs font-mono text-white focus:border-[#C6FF00] focus:outline-none"
                  />
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-mono text-white/70 mb-1">
                  Observações e Escopo Específico
                </label>
                <textarea
                  rows={3}
                  placeholder="Informações sobre equipe envolvida, entregáveis, cláusulas contratuais relevantes..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-xs font-sans text-white focus:border-[#C6FF00] focus:outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewClientOpen(false)}
                  className="px-4 py-2 text-xs font-mono text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-[#C6FF00] hover:bg-[#b0e600] disabled:bg-white/20 text-[#0A0A0A] font-mono font-bold text-xs tracking-wider transition-colors cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>SALVANDO...</span>
                    </>
                  ) : (
                    <span>SALVAR NOVO CLIENTE</span>
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
