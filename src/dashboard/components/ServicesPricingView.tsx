import React, { useState } from 'react';
import {
  Layers,
  Calculator,
  Copy,
  Check,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { SERVICE_CATALOG } from '../dashboardStorage';
import { ServiceCatalogItem } from '../types';

export function ServicesPricingView() {
  const [selectedServices, setSelectedServices] = useState<string[]>([
    'sc-1',
    'sc-2',
  ]);
  const [contractMonths, setContractMonths] = useState<number>(6);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  // Toggle service selection in simulator
  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  // Calculations
  const selectedItems = SERVICE_CATALOG.filter((item) =>
    selectedServices.includes(item.id)
  );

  const rawSetupTotal = selectedItems.reduce(
    (acc, item) => acc + item.baseSetupPrice,
    0
  );
  const rawMonthlyTotal = selectedItems.reduce(
    (acc, item) => acc + item.suggestedMonthly,
    0
  );

  const discountMultiplier = (100 - discountPercent) / 100;
  const finalSetup = Math.round(rawSetupTotal * discountMultiplier);
  const finalMonthly = Math.round(rawMonthlyTotal * discountMultiplier);
  const totalContractValue = finalSetup + finalMonthly * contractMonths;

  const handleCopyProposalText = () => {
    const text = `PROPOSTA COMERCIAL // VULTO LAB
-----------------------------------------
Serviços Inclusos:
${selectedItems.map((i) => `• ${i.title}`).join('\n')}

Condições Comerciais:
• Setup & Implementação: R$ ${finalSetup.toLocaleString('pt-BR')},00
• Acompanhamento Mensal: R$ ${finalMonthly.toLocaleString('pt-BR')},00/mês
• Vigência sugerida: ${contractMonths} meses
• Faturamento Total Estimado: R$ ${totalContractValue.toLocaleString('pt-BR')},00

Entrega técnica: Engenharia & Estratégia VULTO LAB.
Contato: contato@vultolab.company`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-[#111111] border border-white/10 p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono tracking-widest text-[#C6FF00] uppercase">
            // CATÁLOGO INTERNO & PRECIFICAÇÃO
          </span>
          <span className="text-white/20">•</span>
          <span className="text-[10px] font-mono text-white/50">
            TABELA OFICIAL VULTO LAB
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold font-mono text-white">
          Estrutura de Serviços, Escopos & Preços
        </h1>
        <p className="text-xs text-white/60 font-sans mt-0.5">
          Tabela referencial para os sócios com custos, margens mínimas e simulador de propostas.
        </p>
      </div>

      {/* Simulator Section */}
      <div className="bg-[#111111] border border-white/10 p-5">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
          <div>
            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#C6FF00]" />
              <span>Simulador Rápido de Propostas (Para Reuniões com Clientes)</span>
            </h3>
            <p className="text-xs text-white/40 font-sans">
              Monte pacotes combinados e veja o valor total, MRR e faturamento contratual na hora.
            </p>
          </div>

          <button
            onClick={handleCopyProposalText}
            className="px-3.5 py-2 bg-[#1C1C1C] hover:bg-[#252525] border border-white/10 text-xs font-mono text-white flex items-center gap-2 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#C6FF00]" />
                <span className="text-[#C6FF00]">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-white/50" />
                <span>Copiar Texto Proposta</span>
              </>
            )}
          </button>
        </div>

        {/* Simulator Controls & Output */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Select services for bundle */}
          <div className="lg:col-span-2 space-y-2">
            <label className="text-[11px] font-mono text-white/60 uppercase">
              1. Selecione os serviços que compõem a proposta:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SERVICE_CATALOG.map((srv) => {
                const isSelected = selectedServices.includes(srv.id);
                return (
                  <button
                    key={srv.id}
                    onClick={() => toggleService(srv.id)}
                    className={`p-3 text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#C6FF00] bg-[#161616]'
                        : 'border-white/10 bg-[#121212] hover:bg-[#161616] opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono font-bold text-white truncate">
                        {srv.title.split('—')[0]}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-mono text-[#C6FF00]">
                          INCLUSO
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-white/50">
                      Setup: R$ {srv.baseSetupPrice.toLocaleString('pt-BR')} | Recorrência:{' '}
                      R$ {srv.suggestedMonthly.toLocaleString('pt-BR')}/mês
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Months and discount slider */}
            <div className="grid grid-cols-2 gap-4 pt-3">
              <div>
                <label className="text-[11px] font-mono text-white/60 uppercase block mb-1">
                  Vigência do Contrato: <strong>{contractMonths} meses</strong>
                </label>
                <input
                  type="range"
                  min="3"
                  max="12"
                  value={contractMonths}
                  onChange={(e) => setContractMonths(Number(e.target.value))}
                  className="w-full accent-[#C6FF00]"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-white/60 uppercase block mb-1">
                  Desconto Comercial: <strong>{discountPercent}%</strong>
                </label>
                <input
                  type="range"
                  min="0"
                  max="25"
                  step="5"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  className="w-full accent-[#C6FF00]"
                />
              </div>
            </div>
          </div>

          {/* Pricing Summary Box */}
          <div className="bg-[#141414] border border-white/10 p-4 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-mono text-[#C6FF00] uppercase mb-1">
                RESUMO CALCULADO
              </div>
              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-white/50">Setup Inicial:</span>
                  <span className="text-white font-bold">
                    R$ {finalSetup.toLocaleString('pt-BR')},00
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-white/50">Mensalidade (MRR):</span>
                  <span className="text-[#C6FF00] font-bold">
                    R$ {finalMonthly.toLocaleString('pt-BR')},00/mês
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-white/50">Vigência:</span>
                  <span className="text-white">{contractMonths} meses</span>
                </div>

                <div className="pt-2">
                  <span className="text-white/40 block text-[10px] uppercase">
                    Valor Total do Contrato:
                  </span>
                  <div className="text-xl font-bold text-white mt-0.5">
                    R$ {totalContractValue.toLocaleString('pt-BR')},00
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 text-[10px] font-mono text-white/40">
              * Margem líquida média estimada do pacote: ~71%
            </div>
          </div>
        </div>
      </div>

      {/* Full Catalog Table */}
      <div className="space-y-4">
        <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
          Detalhamento Técnico dos Escopos (5 Ofertas Core)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SERVICE_CATALOG.map((item) => (
            <div
              key={item.id}
              className="bg-[#111111] border border-white/10 p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono text-white/40 mb-1">
                  <span className="text-[#C6FF00] font-bold uppercase">
                    {item.category}
                  </span>
                  <span>{item.estimatedDeliveryDays} dias úteis</span>
                </div>

                <h4 className="text-sm font-mono font-bold text-white mb-2">
                  {item.title}
                </h4>

                <p className="text-xs text-white/60 font-sans mb-3 leading-relaxed">
                  {item.scopeSummary}
                </p>

                <div className="space-y-1.5 mb-4">
                  <div className="text-[10px] font-mono text-white/40 uppercase">
                    Entregáveis inclusos:
                  </div>
                  {item.deliverables.map((del, idx) => (
                    <div
                      key={idx}
                      className="text-[11px] font-sans text-white/80 flex items-start gap-1.5"
                    >
                      <span className="text-[#C6FF00] font-mono">•</span>
                      <span>{del}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between font-mono text-xs">
                <div>
                  <span className="text-[10px] text-white/40 block">SETUP BASE</span>
                  <span className="text-white font-bold">
                    R$ {item.baseSetupPrice.toLocaleString('pt-BR')},00
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-white/40 block">MENSALIDADE</span>
                  <span className="text-white font-bold">
                    {item.suggestedMonthly > 0
                      ? `R$ ${item.suggestedMonthly.toLocaleString('pt-BR')},00`
                      : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-white/40 block">MARGEM</span>
                  <span className="text-[#C6FF00] font-bold">
                    {item.marginPercent}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
