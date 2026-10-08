import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { ClientRecord, PartnerId } from '../types';

interface ClientsViewProps {
  clients: ClientRecord[];
  onOpenNewRecord: () => void;
  currentUser: PartnerId;
}

export function ClientsView({
  clients,
  onOpenNewRecord,
}: ClientsViewProps) {
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(
    clients[0] || null
  );

  const filtered = clients.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.companyName.toLowerCase().includes(q) ||
      c.contactName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.services.some((s) => s.toLowerCase().includes(q))
    );
  });

  const totalMrr = clients
    .filter((c) => c.status === 'active')
    .reduce((acc, c) => acc + c.monthlyRetainer, 0);

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
              CARTEIRA ATIVA & RETENÇÃO
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono text-white">
            Carteira de Clientes & Contratos
          </h1>
          <p className="text-xs text-white/60 font-sans mt-0.5">
            Gerenciamento dos clientes ativos, serviços contratados, faturamento recorrente e histórico.
          </p>
        </div>

        <button
          onClick={onOpenNewRecord}
          className="px-4 py-2.5 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-mono font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>CADASTRAR NOVO CLIENTE</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#111111] border border-white/10 p-4">
          <div className="text-[11px] font-mono text-white/40 uppercase mb-1">
            Clientes Ativos
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {clients.filter((c) => c.status === 'active').length} empresas
          </div>
          <div className="text-[11px] font-mono text-[#C6FF00] mt-1">
            100% adimplentes
          </div>
        </div>

        <div className="bg-[#111111] border border-white/10 p-4">
          <div className="text-[11px] font-mono text-white/40 uppercase mb-1">
            Recorrência Total (MRR)
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            R$ {totalMrr.toLocaleString('pt-BR')},00
          </div>
          <div className="text-[11px] font-mono text-white/50 mt-1">
            Contratos mensais
          </div>
        </div>

        <div className="bg-[#111111] border border-white/10 p-4">
          <div className="text-[11px] font-mono text-white/40 uppercase mb-1">
            Em Fase de Onboarding
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {clients.filter((c) => c.status === 'onboarding').length} empresas
          </div>
          <div className="text-[11px] font-mono text-amber-400 mt-1">
            Setup em andamento
          </div>
        </div>

        <div className="bg-[#111111] border border-white/10 p-4">
          <div className="text-[11px] font-mono text-white/40 uppercase mb-1">
            LTV Médio Projetado
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            R$ 48.500,00
          </div>
          <div className="text-[11px] font-mono text-white/50 mt-1">
            Tempo médio de retenção: 11 meses
          </div>
        </div>
      </div>

      {/* Main Content: List + Detail Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clients List */}
        <div className="lg:col-span-2 bg-[#111111] border border-white/10 flex flex-col">
          <div className="p-4 border-b border-white/10 flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filtrar clientes por nome, serviço ou e-mail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#161616] border border-white/10 pl-9 pr-3 py-1.5 text-xs text-white placeholder-white/30 font-mono focus:border-[#C6FF00] focus:outline-none"
              />
            </div>
          </div>

          <div className="divide-y divide-white/5 overflow-y-auto max-h-[560px]">
            {filtered.map((cli) => {
              const isSelected = selectedClient?.id === cli.id;

              return (
                <div
                  key={cli.id}
                  onClick={() => setSelectedClient(cli)}
                  className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#181818] border-l-2 border-[#C6FF00]'
                      : 'hover:bg-white/[0.02] border-l-2 border-transparent'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-white">
                        {cli.companyName}
                      </span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 uppercase font-bold ${
                          cli.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {cli.status}
                      </span>
                    </div>

                    <div className="text-xs text-white/60 font-sans">
                      Contato: {cli.contactName} ({cli.phone})
                    </div>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {cli.services.map((srv, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-mono px-1.5 py-0.5 bg-[#202020] text-white/70"
                        >
                          {srv}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-right font-mono shrink-0 pl-3">
                    <div className="text-xs font-bold text-white">
                      {cli.monthlyRetainer > 0 ? (
                        <>R$ {cli.monthlyRetainer.toLocaleString('pt-BR')}/mês</>
                      ) : (
                        <span className="text-white/40">Sob demanda</span>
                      )}
                    </div>
                    <div className="text-[10px] text-white/40 uppercase">
                      Resp: {cli.leadOwner}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Client Dossier */}
        <div className="bg-[#111111] border border-white/10 p-5 flex flex-col justify-between">
          {selectedClient ? (
            <div className="space-y-4">
              <div className="border-b border-white/10 pb-4">
                <div className="text-[10px] font-mono text-[#C6FF00] uppercase mb-1">
                  FICHA CADASTRAL // CLIENTE
                </div>
                <h3 className="font-mono text-base font-bold text-white">
                  {selectedClient.companyName}
                </h3>
                {selectedClient.legalName && (
                  <p className="text-[11px] text-white/40 font-mono">
                    {selectedClient.legalName}
                  </p>
                )}
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div>
                  <span className="text-white/40 block text-[10px] uppercase">
                    Pessoa de Contato
                  </span>
                  <span className="text-white font-medium">
                    {selectedClient.contactName}
                  </span>
                </div>

                <div>
                  <span className="text-white/40 block text-[10px] uppercase">
                    Telefone & WhatsApp
                  </span>
                  <a
                    href={`https://wa.me/${selectedClient.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#C6FF00] hover:underline flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{selectedClient.phone}</span>
                  </a>
                </div>

                <div>
                  <span className="text-white/40 block text-[10px] uppercase">
                    E-mail
                  </span>
                  <span className="text-white">{selectedClient.email}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                  <div>
                    <span className="text-white/40 block text-[10px] uppercase">
                      Retainer Mensal
                    </span>
                    <span className="text-white font-bold">
                      R$ {selectedClient.monthlyRetainer.toLocaleString('pt-BR')},00
                    </span>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[10px] uppercase">
                      Setup Total Pago
                    </span>
                    <span className="text-white font-bold">
                      R$ {selectedClient.setupPaid.toLocaleString('pt-BR')},00
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-white/40 block text-[10px] uppercase">
                    Data de Início
                  </span>
                  <span className="text-white">{selectedClient.startDate}</span>
                </div>

                {selectedClient.notes && (
                  <div className="pt-2 border-t border-white/10">
                    <span className="text-white/40 block text-[10px] uppercase mb-1">
                      Anotações Estratégicas
                    </span>
                    <div className="p-3 bg-[#161616] border border-white/5 text-[11px] text-white/70 font-sans leading-relaxed">
                      {selectedClient.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-white/30 text-xs font-mono py-12">
              Selecione um cliente para visualizar os detalhes.
            </div>
          )}

          {selectedClient && (
            <div className="pt-4 border-t border-white/10">
              <a
                href={`https://wa.me/${selectedClient.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                  `Olá, ${selectedClient.contactName}! Como estão os resultados da ${selectedClient.companyName}?`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-[#181818] hover:bg-[#202020] border border-white/10 text-xs font-mono text-white text-center transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#C6FF00]" />
                <span>Iniciar Conversa no WhatsApp</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
