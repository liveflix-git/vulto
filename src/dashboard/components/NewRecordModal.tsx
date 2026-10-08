import React, { useState } from 'react';
import { X, Plus, DollarSign, Target, Users, CreditCard } from 'lucide-react';
import {
  FinancialTransaction,
  DealItem,
  ClientRecord,
  VultoTapBatch,
  PartnerId,
} from '../types';

interface NewRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: PartnerId;
  onAddTransaction: (tx: FinancialTransaction) => void;
  onAddDeal: (deal: DealItem) => void;
  onAddClient: (client: ClientRecord) => void;
  onAddBatch: (batch: VultoTapBatch) => void;
}

type RecordType = 'transaction' | 'deal' | 'client' | 'batch';

export function NewRecordModal({
  isOpen,
  onClose,
  currentUser,
  onAddTransaction,
  onAddDeal,
  onAddClient,
  onAddBatch,
}: NewRecordModalProps) {
  const [activeType, setActiveType] = useState<RecordType>('transaction');

  // Form states for transaction
  const [txDesc, setTxDesc] = useState('');
  const [txClient, setTxClient] = useState('');
  const [txType, setTxType] = useState<'income' | 'expense'>('income');
  const [txCategory, setTxCategory] = useState<FinancialTransaction['category']>('Retainer Mensal');
  const [txAmount, setTxAmount] = useState<number>(3500);

  // Form states for deal
  const [dealCompany, setDealCompany] = useState('');
  const [dealService, setDealService] = useState('Paid Media + Landing Page');
  const [dealValue, setDealValue] = useState<number>(8500);
  const [dealProb, setDealProb] = useState<number>(50);

  // Form states for client
  const [cliName, setCliName] = useState('');
  const [cliContact, setCliContact] = useState('');
  const [cliPhone, setCliPhone] = useState('');
  const [cliEmail, setCliEmail] = useState('');
  const [cliRetainer, setCliRetainer] = useState<number>(4500);

  // Form states for batch
  const [batchClient, setBatchClient] = useState('');
  const [batchQty, setBatchQty] = useState<number>(50);
  const [batchCardType, setBatchCardType] = useState<VultoTapBatch['cardType']>('Matte Black NFC');
  const [batchUnitPrice, setBatchUnitPrice] = useState<number>(89);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeType === 'transaction') {
      if (!txDesc) return;
      onAddTransaction({
        id: `tx-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        description: txDesc,
        clientOrVendor: txClient || 'Vulto Lab',
        type: txType,
        category: txCategory,
        amount: Number(txAmount) || 0,
        status: 'paid',
        paymentMethod: 'PIX',
        partnerResponsible: currentUser,
      });
    } else if (activeType === 'deal') {
      if (!dealCompany) return;
      onAddDeal({
        id: `deal-${Date.now()}`,
        companyName: dealCompany,
        contactName: 'Contato Comercial',
        service: dealService,
        totalEstimated: Number(dealValue) || 0,
        stage: 'lead',
        probability: Number(dealProb) || 50,
        owner: currentUser,
        createdAt: new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString().slice(0, 10),
        priority: 'alta',
      });
    } else if (activeType === 'client') {
      if (!cliName) return;
      onAddClient({
        id: `cli-${Date.now()}`,
        companyName: cliName,
        contactName: cliContact || 'Diretoria',
        email: cliEmail || 'contato@cliente.com',
        phone: cliPhone || '+55 11 99999-9999',
        status: 'active',
        services: ['Paid Media', 'Estratégia'],
        monthlyRetainer: Number(cliRetainer) || 0,
        setupPaid: 5000,
        startDate: new Date().toISOString().slice(0, 10),
        leadOwner: currentUser,
        health: 'excelente',
      });
    } else if (activeType === 'batch') {
      if (!batchClient) return;
      onAddBatch({
        id: `tap-${Date.now().toString().slice(-4)}`,
        clientOrProject: batchClient,
        quantity: Number(batchQty) || 50,
        cardType: batchCardType,
        unitCost: 28.5,
        unitPrice: Number(batchUnitPrice) || 89,
        status: 'engraving',
        destinationCity: 'São Paulo - SP',
        orderDate: new Date().toISOString().slice(0, 10),
        tagsEnabled: true,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#111111] border border-white/10 p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#C6FF00]" />
            <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
              Inserir Registro Operacional
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="grid grid-cols-4 gap-1 mb-5 bg-[#161616] p-1 border border-white/10 text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveType('transaction')}
            className={`py-1.5 text-center transition-colors cursor-pointer ${
              activeType === 'transaction'
                ? 'bg-[#C6FF00] text-[#0A0A0A] font-bold'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Financeiro
          </button>
          <button
            type="button"
            onClick={() => setActiveType('deal')}
            className={`py-1.5 text-center transition-colors cursor-pointer ${
              activeType === 'deal'
                ? 'bg-[#C6FF00] text-[#0A0A0A] font-bold'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Lead CRM
          </button>
          <button
            type="button"
            onClick={() => setActiveType('client')}
            className={`py-1.5 text-center transition-colors cursor-pointer ${
              activeType === 'client'
                ? 'bg-[#C6FF00] text-[#0A0A0A] font-bold'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Cliente
          </button>
          <button
            type="button"
            onClick={() => setActiveType('batch')}
            className={`py-1.5 text-center transition-colors cursor-pointer ${
              activeType === 'batch'
                ? 'bg-[#C6FF00] text-[#0A0A0A] font-bold'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Vulto Tap
          </button>
        </div>

        {/* Dynamic Form Content */}
        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          {activeType === 'transaction' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTxType('income')}
                  className={`py-2 text-center border cursor-pointer ${
                    txType === 'income'
                      ? 'border-[#C6FF00] bg-[#C6FF00]/10 text-[#C6FF00] font-bold'
                      : 'border-white/10 text-white/50'
                  }`}
                >
                  + Entrada (Receita)
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('expense')}
                  className={`py-2 text-center border cursor-pointer ${
                    txType === 'expense'
                      ? 'border-red-400 bg-red-400/10 text-red-400 font-bold'
                      : 'border-white/10 text-white/50'
                  }`}
                >
                  - Saída (Despesa)
                </button>
              </div>

              <div>
                <label className="block text-white/50 mb-1">Descrição</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Retainer Mensal de Tráfego Pago"
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                  className="w-full bg-[#161616] border border-white/15 p-2 text-white focus:border-[#C6FF00] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/50 mb-1">Cliente / Fornecedor</label>
                  <input
                    type="text"
                    placeholder="Ex: Nexus Capital"
                    value={txClient}
                    onChange={(e) => setTxClient(e.target.value)}
                    className="w-full bg-[#161616] border border-white/15 p-2 text-white focus:border-[#C6FF00] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/50 mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    required
                    value={txAmount}
                    onChange={(e) => setTxAmount(Number(e.target.value))}
                    className="w-full bg-[#161616] border border-white/15 p-2 text-white focus:border-[#C6FF00] outline-none"
                  />
                </div>
              </div>
            </>
          )}

          {activeType === 'deal' && (
            <>
              <div>
                <label className="block text-white/50 mb-1">Empresa / Lead</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Grupo Alpha Medicina"
                  value={dealCompany}
                  onChange={(e) => setDealCompany(e.target.value)}
                  className="w-full bg-[#161616] border border-white/15 p-2 text-white focus:border-[#C6FF00] outline-none"
                />
              </div>

              <div>
                <label className="block text-white/50 mb-1">Serviço de Interesse</label>
                <input
                  type="text"
                  required
                  value={dealService}
                  onChange={(e) => setDealService(e.target.value)}
                  className="w-full bg-[#161616] border border-white/15 p-2 text-white focus:border-[#C6FF00] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/50 mb-1">Valor Estimado (R$)</label>
                  <input
                    type="number"
                    value={dealValue}
                    onChange={(e) => setDealValue(Number(e.target.value))}
                    className="w-full bg-[#161616] border border-white/15 p-2 text-white focus:border-[#C6FF00] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/50 mb-1">Probabilidade (%)</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={dealProb}
                    onChange={(e) => setDealProb(Number(e.target.value))}
                    className="w-full bg-[#161616] border border-white/15 p-2 text-white focus:border-[#C6FF00] outline-none"
                  />
                </div>
              </div>
            </>
          )}

          {activeType === 'client' && (
            <>
              <div>
                <label className="block text-white/50 mb-1">Nome da Empresa</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Lumina Odontologia"
                  value={cliName}
                  onChange={(e) => setCliName(e.target.value)}
                  className="w-full bg-[#161616] border border-white/15 p-2 text-white focus:border-[#C6FF00] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/50 mb-1">Pessoa de Contato</label>
                  <input
                    type="text"
                    placeholder="Ex: Dra. Amanda"
                    value={cliContact}
                    onChange={(e) => setCliContact(e.target.value)}
                    className="w-full bg-[#161616] border border-white/15 p-2 text-white focus:border-[#C6FF00] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/50 mb-1">Telefone WhatsApp</label>
                  <input
                    type="text"
                    placeholder="+55 11 99999-9999"
                    value={cliPhone}
                    onChange={(e) => setCliPhone(e.target.value)}
                    className="w-full bg-[#161616] border border-white/15 p-2 text-white focus:border-[#C6FF00] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/50 mb-1">Retainer Mensal (MRR em R$)</label>
                <input
                  type="number"
                  value={cliRetainer}
                  onChange={(e) => setCliRetainer(Number(e.target.value))}
                  className="w-full bg-[#161616] border border-white/15 p-2 text-white focus:border-[#C6FF00] outline-none"
                />
              </div>
            </>
          )}

          {activeType === 'batch' && (
            <>
              <div>
                <label className="block text-white/50 mb-1">Cliente / Projeto</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Construtora Veritas"
                  value={batchClient}
                  onChange={(e) => setBatchClient(e.target.value)}
                  className="w-full bg-[#161616] border border-white/15 p-2 text-white focus:border-[#C6FF00] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/50 mb-1">Quantidade de Cartões</label>
                  <input
                    type="number"
                    value={batchQty}
                    onChange={(e) => setBatchQty(Number(e.target.value))}
                    className="w-full bg-[#161616] border border-white/15 p-2 text-white focus:border-[#C6FF00] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/50 mb-1">Preço Unitário (R$)</label>
                  <input
                    type="number"
                    value={batchUnitPrice}
                    onChange={(e) => setBatchUnitPrice(Number(e.target.value))}
                    className="w-full bg-[#161616] border border-white/15 p-2 text-white focus:border-[#C6FF00] outline-none"
                  />
                </div>
              </div>
            </>
          )}

          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 bg-[#181818] hover:bg-[#222] border border-white/10 text-white/70 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-bold transition-colors cursor-pointer"
            >
              Salvar Registro
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
