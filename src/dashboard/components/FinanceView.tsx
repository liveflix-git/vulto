import React, { useState } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  Search,
  CheckCircle,
  Clock,
  Plus,
  DollarSign,
  PieChart,
} from 'lucide-react';
import { FinancialTransaction, PartnerId } from '../types';

interface FinanceViewProps {
  transactions: FinancialTransaction[];
  onAddTransaction: (tx: Omit<FinancialTransaction, 'id'>) => void;
  onUpdateStatus: (id: string, status: 'paid' | 'pending') => void;
  currentUser: PartnerId;
  onOpenNewRecord: () => void;
}

export function FinanceView({
  transactions,
  onUpdateStatus,
  onOpenNewRecord,
}: FinanceViewProps) {
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [search, setSearch] = useState('');

  // Calculations
  const paidIncome = transactions
    .filter((t) => t.type === 'income' && t.status === 'paid')
    .reduce((acc, t) => acc + t.amount, 0);

  const pendingIncome = transactions
    .filter((t) => t.type === 'income' && t.status === 'pending')
    .reduce((acc, t) => acc + t.amount, 0);

  const paidExpenses = transactions
    .filter((t) => t.type === 'expense' && t.status === 'paid')
    .reduce((acc, t) => acc + t.amount, 0);

  const pendingExpenses = transactions
    .filter((t) => t.type === 'expense' && t.status === 'pending')
    .reduce((acc, t) => acc + t.amount, 0);

  const netBalance = paidIncome - paidExpenses;
  const netMargin = paidIncome > 0 ? ((netBalance / paidIncome) * 100).toFixed(1) : '0';

  // Filtered transactions
  const filtered = transactions.filter((t) => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        t.description.toLowerCase().includes(q) ||
        t.clientOrVendor.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111111] border border-white/10 p-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-widest text-[#C6FF00] uppercase">
              // MÓDULO FINANCEIRO
            </span>
            <span className="text-white/20">•</span>
            <span className="text-[10px] font-mono text-white/50">
              CAIXA & DRE SIMPLIFICADO
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono text-white">
            Gestão de Caixa, Receitas & Despesas
          </h1>
          <p className="text-xs text-white/60 font-sans mt-0.5">
            Acompanhamento das entradas recorrentes (MRR), setups e saídas operacionais.
          </p>
        </div>

        <button
          onClick={onOpenNewRecord}
          className="px-4 py-2.5 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-mono font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>REGISTRAR TRANSAÇÃO</span>
        </button>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Entradas Recebidas */}
        <div className="bg-[#111111] border border-white/10 p-4">
          <div className="flex items-center justify-between text-white/40 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider">
              Receitas Liquidadas
            </span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white">
            R$ {paidIncome.toLocaleString('pt-BR')},00
          </div>
          <div className="text-[11px] font-mono text-emerald-400 mt-1">
            + R$ {pendingIncome.toLocaleString('pt-BR')} a compensar
          </div>
        </div>

        {/* Saídas e Custos */}
        <div className="bg-[#111111] border border-white/10 p-4">
          <div className="flex items-center justify-between text-white/40 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider">
              Despesas Operacionais
            </span>
            <ArrowUpRight className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white">
            R$ {paidExpenses.toLocaleString('pt-BR')},00
          </div>
          <div className="text-[11px] font-mono text-white/40 mt-1">
            + R$ {pendingExpenses.toLocaleString('pt-BR')} agendado
          </div>
        </div>

        {/* Lucro Líquido */}
        <div className="bg-[#111111] border border-white/10 p-4">
          <div className="flex items-center justify-between text-white/40 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider">
              Resultado Líquido
            </span>
            <DollarSign className="w-4 h-4 text-[#C6FF00]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white">
            R$ {netBalance.toLocaleString('pt-BR')},00
          </div>
          <div className="text-[11px] font-mono text-[#C6FF00] mt-1">
            Margem Líquida: {netMargin}%
          </div>
        </div>

        {/* Projeção / Faturamento total */}
        <div className="bg-[#111111] border border-white/10 p-4">
          <div className="flex items-center justify-between text-white/40 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider">
              Faturamento Previsto
            </span>
            <PieChart className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white">
            R$ {(paidIncome + pendingIncome).toLocaleString('pt-BR')},00
          </div>
          <div className="text-[11px] font-sans text-white/40 mt-1">
            Competência Outubro 2026
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#111111] border border-white/10 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-white/40 mr-1 hidden sm:inline">
            TIPO:
          </span>
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 text-xs font-mono border transition-colors cursor-pointer ${
              filterType === 'all'
                ? 'bg-[#C6FF00] text-[#0A0A0A] border-[#C6FF00] font-bold'
                : 'bg-[#161616] text-white/70 border-white/10 hover:text-white'
            }`}
          >
            Todas ({transactions.length})
          </button>
          <button
            onClick={() => setFilterType('income')}
            className={`px-3 py-1.5 text-xs font-mono border transition-colors cursor-pointer ${
              filterType === 'income'
                ? 'bg-[#C6FF00] text-[#0A0A0A] border-[#C6FF00] font-bold'
                : 'bg-[#161616] text-white/70 border-white/10 hover:text-white'
            }`}
          >
            Entradas
          </button>
          <button
            onClick={() => setFilterType('expense')}
            className={`px-3 py-1.5 text-xs font-mono border transition-colors cursor-pointer ${
              filterType === 'expense'
                ? 'bg-[#C6FF00] text-[#0A0A0A] border-[#C6FF00] font-bold'
                : 'bg-[#161616] text-white/70 border-white/10 hover:text-white'
            }`}
          >
            Despesas
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por cliente ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#161616] border border-white/10 pl-9 pr-3 py-1.5 text-xs text-white placeholder-white/30 font-mono focus:border-[#C6FF00] focus:outline-none"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-[#111111] border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-[#161616] text-[10px] font-mono uppercase text-white/40 tracking-wider">
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Descrição / Contraparte</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Método</th>
                <th className="py-3 px-4 text-right">Valor</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-white/40 text-xs">
                    Nenhuma movimentação financeira encontrada com os filtros atuais.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => {
                  const isIncome = tx.type === 'income';
                  const isPaid = tx.status === 'paid';

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3.5 px-4 text-white/50 text-[11px] whitespace-nowrap">
                        {tx.date}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-white font-medium">{tx.description}</div>
                        <div className="text-[10px] text-white/40 font-sans">
                          {tx.clientOrVendor}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-white/70 text-[11px] whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-[#181818] border border-white/10">
                          {tx.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-white/50 text-[11px]">
                        {tx.paymentMethod}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold">
                        <span
                          className={isIncome ? 'text-emerald-400' : 'text-red-400'}
                        >
                          {isIncome ? '+' : '-'} R${' '}
                          {tx.amount.toLocaleString('pt-BR')},00
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 font-bold ${
                            isPaid
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {isPaid ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              LIQUIDADO
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              PENDENTE
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() =>
                            onUpdateStatus(tx.id, isPaid ? 'pending' : 'paid')
                          }
                          className="px-2 py-1 text-[10px] bg-[#1C1C1C] hover:bg-[#252525] border border-white/10 text-white/80 transition-colors cursor-pointer"
                          title="Alternar status da transação"
                        >
                          {isPaid ? 'Marcar Pendente' : 'Confirmar Pgto'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
