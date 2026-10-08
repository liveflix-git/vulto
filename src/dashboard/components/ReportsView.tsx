import React from 'react';
import {
  FileText,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { DashboardState } from '../types';

interface ReportsViewProps {
  state: DashboardState;
}

export function ReportsView({ state }: ReportsViewProps) {
  const handleExportJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `vulto_lab_backup_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculations
  const totalIncome = state.transactions
    .filter((t) => t.type === 'income' && t.status === 'paid')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = state.transactions
    .filter((t) => t.type === 'expense' && t.status === 'paid')
    .reduce((acc, t) => acc + t.amount, 0);

  const mrr = state.clients
    .filter((c) => c.status === 'active')
    .reduce((acc, c) => acc + c.monthlyRetainer, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111111] border border-white/10 p-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-widest text-[#C6FF00] uppercase">
              // AUDITORIA & EXPORTAÇÃO
            </span>
            <span className="text-white/20">•</span>
            <span className="text-[10px] font-mono text-white/50">
              DOCUMENTO EXECUTIVO CONSOLIDADO
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono text-white">
            Relatórios & Auditoria Operacional
          </h1>
          <p className="text-xs text-white/60 font-sans mt-0.5">
            Geração de relatórios executivos para apresentação dos sócios e backup de dados.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-[#1C1C1C] hover:bg-[#252525] border border-white/10 text-xs font-mono text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-white/60" />
            <span>Imprimir / PDF</span>
          </button>

          <button
            onClick={handleExportJson}
            className="px-3.5 py-2 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-mono font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Backup (JSON)</span>
          </button>
        </div>
      </div>

      {/* Printable Executive Dossier */}
      <div className="bg-[#111111] border border-white/10 p-6 sm:p-8 space-y-6 font-mono">
        <div className="border-b border-white/10 pb-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-[#C6FF00] tracking-wider">
              VULTO LAB — CORE OPERATIONAL REPORT
            </div>
            <div className="text-lg font-bold text-white mt-1">
              Balanço Integrado de Operações & Contratos
            </div>
          </div>
          <div className="text-right text-[11px] text-white/40">
            <div>Data: {new Date().toLocaleDateString('pt-BR')}</div>
            <div>Sócios: Felipe & Pietro</div>
          </div>
        </div>

        {/* Section 1: Financial Snapshot */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-white uppercase tracking-wider text-[#C6FF00]">
            1. Posição Financeira
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-[#161616] border border-white/5">
              <span className="text-white/40 text-[10px] block">RECEITAS LIQUIDADAS:</span>
              <span className="text-white font-bold text-sm">
                R$ {totalIncome.toLocaleString('pt-BR')},00
              </span>
            </div>
            <div className="p-3 bg-[#161616] border border-white/5">
              <span className="text-white/40 text-[10px] block">CUSTOS & DESPESAS:</span>
              <span className="text-white font-bold text-sm">
                R$ {totalExpense.toLocaleString('pt-BR')},00
              </span>
            </div>
            <div className="p-3 bg-[#161616] border border-white/5">
              <span className="text-white/40 text-[10px] block">MRR ATIVO:</span>
              <span className="text-[#C6FF00] font-bold text-sm">
                R$ {mrr.toLocaleString('pt-BR')},00/mês
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Active Clients List */}
        <div className="space-y-3 pt-2">
          <div className="text-xs font-bold text-white uppercase tracking-wider text-[#C6FF00]">
            2. Carteira Ativa de Clientes ({state.clients.length} empresas)
          </div>
          <div className="border border-white/10 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#181818] text-white/40 text-[10px] uppercase">
                <tr>
                  <th className="p-2.5">Empresa</th>
                  <th className="p-2.5">Serviços</th>
                  <th className="p-2.5 text-right">Retainer</th>
                  <th className="p-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {state.clients.map((c) => (
                  <tr key={c.id}>
                    <td className="p-2.5 font-bold text-white">{c.companyName}</td>
                    <td className="p-2.5 text-white/60">{c.services.join(', ')}</td>
                    <td className="p-2.5 text-right text-white">
                      R$ {c.monthlyRetainer.toLocaleString('pt-BR')},00
                    </td>
                    <td className="p-2.5 text-center text-[10px] uppercase text-[#C6FF00]">
                      {c.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
