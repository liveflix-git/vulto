import React from 'react';
import {
  CreditCard,
  Plus,
  Package,
  Layers,
  TrendingUp,
  Cpu,
  Truck,
  CheckCircle,
} from 'lucide-react';
import { VultoTapBatch, PartnerId } from '../types';

interface VultoTapViewProps {
  batches: VultoTapBatch[];
  onOpenNewRecord: () => void;
  currentUser: PartnerId;
}

export function VultoTapView({
  batches,
  onOpenNewRecord,
}: VultoTapViewProps) {
  // Calculations
  const totalCardsSold = batches
    .filter((b) => b.unitPrice > 0)
    .reduce((acc, b) => acc + b.quantity, 0);

  const totalRevenue = batches.reduce(
    (acc, b) => acc + b.quantity * b.unitPrice,
    0
  );

  const totalCost = batches.reduce(
    (acc, b) => acc + b.quantity * b.unitCost,
    0
  );

  const profitNfc = totalRevenue - totalCost;
  const marginNfc = totalRevenue > 0 ? Math.round((profitNfc / totalRevenue) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111111] border border-white/10 p-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-widest text-[#C6FF00] uppercase">
              // HARDWARE & NFC OPERATIONS
            </span>
            <span className="text-white/20">•</span>
            <span className="text-[10px] font-mono text-white/50">
              VULTO TAP DIVISION
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono text-white">
            Gestão Física VULTO TAP (Estoque & Lotes)
          </h1>
          <p className="text-xs text-white/60 font-sans mt-0.5">
            Controle de lotes de cartões NFC inteligentes, custos de produção por unidade e margem.
          </p>
        </div>

        <button
          onClick={onOpenNewRecord}
          className="px-4 py-2.5 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-mono font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>REGISTRAR NOVO LOTE</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#111111] border border-white/10 p-4">
          <div className="text-[11px] font-mono text-white/40 uppercase mb-1">
            Cartões Produzidos & Entregues
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {totalCardsSold} unidades
          </div>
          <div className="text-[11px] font-mono text-[#C6FF00] mt-1">
            Em operação física no mercado
          </div>
        </div>

        <div className="bg-[#111111] border border-white/10 p-4">
          <div className="text-[11px] font-mono text-white/40 uppercase mb-1">
            Estoque Chips / Brancos
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            150 chips
          </div>
          <div className="text-[11px] font-mono text-white/50 mt-1">
            Prontos para gravação a laser
          </div>
        </div>

        <div className="bg-[#111111] border border-white/10 p-4">
          <div className="text-[11px] font-mono text-white/40 uppercase mb-1">
            Lucro Bruto Vulto Tap
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            R$ {profitNfc.toLocaleString('pt-BR')},00
          </div>
          <div className="text-[11px] font-mono text-white/50 mt-1">
            Margem comercial de {marginNfc}%
          </div>
        </div>

        <div className="bg-[#111111] border border-white/10 p-4">
          <div className="text-[11px] font-mono text-white/40 uppercase mb-1">
            Custo Médio Unitário
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            R$ 32,50/un
          </div>
          <div className="text-[11px] font-mono text-white/50 mt-1">
            Preço médio de venda: R$ 98,00
          </div>
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-[#111111] border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Package className="w-4 h-4 text-[#C6FF00]" />
            <span>Lotes & Remessas Físicas</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-[#161616] text-[10px] font-mono uppercase text-white/40 tracking-wider">
                <th className="py-3 px-4">Lote ID</th>
                <th className="py-3 px-4">Cliente / Destino</th>
                <th className="py-3 px-4">Tipo de Acabamento</th>
                <th className="py-3 px-4 text-center">Qtd</th>
                <th className="py-3 px-4 text-right">Custo Unit.</th>
                <th className="py-3 px-4 text-right">Preço Unit.</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-xs">
              {batches.map((batch) => (
                <tr key={batch.id} className="hover:bg-white/[0.02]">
                  <td className="py-3.5 px-4 text-white/40 text-[11px]">
                    {batch.id}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-white font-medium">
                      {batch.clientOrProject}
                    </div>
                    <div className="text-[10px] text-white/40 font-sans">
                      {batch.destinationCity} • {batch.orderDate}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-white/70">
                    <span className="px-2 py-0.5 bg-[#181818] border border-white/10 text-[11px]">
                      {batch.cardType}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-white">
                    {batch.quantity} un
                  </td>
                  <td className="py-3.5 px-4 text-right text-red-400">
                    R$ {batch.unitCost.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-right text-[#C6FF00] font-bold">
                    {batch.unitPrice > 0
                      ? `R$ ${batch.unitPrice.toFixed(2)}`
                      : 'Estoque'}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-block text-[10px] px-2 py-0.5 font-bold uppercase ${
                        batch.status === 'delivered'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {batch.status === 'delivered'
                        ? 'Entregue'
                        : batch.status === 'engraving'
                        ? 'Gravação Laser'
                        : batch.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
