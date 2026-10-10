import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  Check,
  AlertCircle,
  X,
  DollarSign,
} from 'lucide-react';
import {
  VultoOperator,
  fetchVultoOperators,
  getActiveOperatorSession,
  logVultoAudit,
} from '../../services/vultoCoreService';
import { supabase } from '../../lib/supabase';

export interface PriceTableItem {
  id: string;
  service_name: string;
  description: string | null;
  price: number;
  billing_type: 'unico' | 'mensal';
  active: boolean;
  operator_id: string | null;
  created_at: string;
  updated_at: string;
}

export function PriceTableView() {
  const [items, setItems] = useState<PriceTableItem[]>([]);
  const [operators, setOperators] = useState<VultoOperator[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Novo / Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PriceTableItem | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [description, setDescription] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [billingType, setBillingType] = useState<'unico' | 'mensal'>('unico');
  const [active, setActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Modal Confirmação Exclusão
  const [itemToDelete, setItemToDelete] = useState<PriceTableItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ops, res] = await Promise.all([
        fetchVultoOperators(),
        supabase.from('vulto_price_table').select('*').order('created_at', { ascending: false }),
      ]);
      setOperators(ops);
      if (res.data) {
        setItems(res.data as PriceTableItem[]);
      }
    } catch (e) {
      console.error(e);
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

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('vulto_price_table_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vulto_price_table' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  const getOperatorName = (operatorId: string | null) => {
    if (!operatorId) return 'Operador';
    const match = operators.find((op) => op.id === operatorId);
    return match ? match.name : 'Operador';
  };

  const handleOpenNew = () => {
    setEditingItem(null);
    setServiceName('');
    setDescription('');
    setPriceInput('');
    setBillingType('unico');
    setActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PriceTableItem) => {
    setEditingItem(item);
    setServiceName(item.service_name);
    setDescription(item.description || '');
    setPriceInput(String(item.price));
    setBillingType(item.billing_type || 'unico');
    setActive(item.active);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (item: PriceTableItem) => {
    const nextActive = !item.active;
    const op = getActiveOperatorSession();

    // Otimista
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, active: nextActive } : i))
    );

    const { error } = await supabase
      .from('vulto_price_table')
      .update({ active: nextActive, updated_at: new Date().toISOString(), operator_id: op?.id || null })
      .eq('id', item.id);

    if (error) {
      showToast('Erro ao atualizar status do preço.', 'error');
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, active: item.active } : i))
      );
    } else {
      await logVultoAudit({
        action: nextActive ? 'price_activated' : 'price_deactivated',
        entity_type: 'vulto_price_table',
        entity_id: item.id,
        details: `${op?.name || 'Operador'} ${nextActive ? 'ativou' : 'desativou'} o serviço ${item.service_name}`,
      });
      showToast(nextActive ? 'Serviço ativado.' : 'Serviço desativado.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim() || !priceInput) {
      setFormError('Preencha o nome do serviço e o preço.');
      return;
    }

    const priceVal = parseFloat(priceInput.replace(',', '.'));
    if (isNaN(priceVal) || priceVal < 0) {
      setFormError('Informe um preço válido.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    const op = getActiveOperatorSession();

    try {
      if (editingItem) {
        const { error } = await supabase
          .from('vulto_price_table')
          .update({
            service_name: serviceName.trim(),
            description: description.trim() || null,
            price: priceVal,
            billing_type: billingType,
            active,
            updated_at: new Date().toISOString(),
            operator_id: op?.id || null,
          })
          .eq('id', editingItem.id);

        if (error) {
          setFormError(error.message);
        } else {
          await logVultoAudit({
            action: 'price_updated',
            entity_type: 'vulto_price_table',
            entity_id: editingItem.id,
            details: `${op?.name || 'Operador'} atualizou o preço de ${serviceName}`,
          });
          setIsModalOpen(false);
          showToast('Preço atualizado.');
          loadData();
        }
      } else {
        const { error } = await supabase
          .from('vulto_price_table')
          .insert([
            {
              service_name: serviceName.trim(),
              description: description.trim() || null,
              price: priceVal,
              billing_type: billingType,
              active,
              operator_id: op?.id || null,
            },
          ]);

        if (error) {
          setFormError(error.message);
        } else {
          await logVultoAudit({
            action: 'price_created',
            entity_type: 'vulto_price_table',
            details: `${op?.name || 'Operador'} adicionou o serviço ${serviceName}`,
          });
          setIsModalOpen(false);
          showToast('Serviço adicionado.');
          loadData();
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'Erro inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    const op = getActiveOperatorSession();

    try {
      const { error } = await supabase
        .from('vulto_price_table')
        .delete()
        .eq('id', itemToDelete.id);

      if (error) {
        showToast('Não foi possível excluir: ' + error.message, 'error');
      } else {
        await logVultoAudit({
          action: 'price_deleted',
          entity_type: 'vulto_price_table',
          entity_id: itemToDelete.id,
          details: `${op?.name || 'Operador'} excluiu o serviço ${itemToDelete.service_name}`,
        });
        setItems((prev) => prev.filter((i) => i.id !== itemToDelete.id));
        showToast('Serviço excluído.');
        setItemToDelete(null);
      }
    } catch (e: any) {
      showToast('Não foi possível excluir o registro.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
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
            <Check className="w-4 h-4 stroke-[2.5]" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span className="font-bold tracking-wider">{toastMessage.text}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-white/50 uppercase">
          Tabela Oficial de Preços e Cobranças
        </span>
        <button
          onClick={handleOpenNew}
          className="px-4 py-2 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-mono font-bold text-xs tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ ADICIONAR SERVIÇO</span>
        </button>
      </div>

      <div className="bg-[#111111] border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 bg-[#0E0E0E] text-white/50 text-[10px] uppercase">
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Nome do Serviço</th>
                <th className="py-3 px-4">Descrição</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Operador</th>
                <th className="py-3 px-4 text-right">Preço</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-white/40">
                    Carregando tabela de preços...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-white/40">
                    Nenhum serviço cadastrado na tabela de preços.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(item)}
                        className={`px-2 py-0.5 text-[10px] font-bold border uppercase cursor-pointer ${
                          item.active
                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                            : 'bg-white/5 text-white/40 border-white/10'
                        }`}
                        title="Clique para ativar/desativar"
                      >
                        {item.active ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-bold text-white">{item.service_name}</td>
                    <td className="py-3 px-4 text-white/60">
                      {item.description || <span className="text-white/20">-</span>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-white/80 text-[10px]">
                        {item.billing_type === 'mensal' ? 'Mensal' : 'Pagamento único'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white/70">
                      {getOperatorName(item.operator_id)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#C6FF00]">
                      R${' '}
                      {Number(item.price).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      {item.billing_type === 'mensal' ? '/mês' : ''}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-[#C6FF00] transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setItemToDelete(item)}
                          className="p-1.5 bg-rose-950/20 hover:bg-rose-950/50 text-rose-400 border border-rose-800/30 transition-colors cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADICIONAR / EDITAR SERVIÇO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#111111] border border-white/20 w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-mono text-sm font-bold text-white">
                {editingItem ? 'Editar Serviço' : 'Adicionar Serviço'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/40 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-white/60 mb-1">Nome do Serviço *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Gestão de Tráfego - Meta"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 mb-1">Preço (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00]"
                  />
                </div>
                <div>
                  <label className="block text-white/60 mb-1">Tipo de Cobrança</label>
                  <select
                    value={billingType}
                    onChange={(e) => setBillingType(e.target.value as 'unico' | 'mensal')}
                    className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00] cursor-pointer"
                  >
                    <option value="unico">Pagamento único</option>
                    <option value="mensal">Mensal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-white/60 mb-1">Descrição (opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Detalhes ou escopo do serviço"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="serviceActive"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="accent-[#C6FF00] cursor-pointer"
                />
                <label htmlFor="serviceActive" className="text-white/80 cursor-pointer">
                  Serviço ativo na tabela
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 bg-white/5 text-white/70 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-bold"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#111111] border border-rose-500/40 w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <h3 className="font-mono text-sm font-bold text-white uppercase">
              Confirmar Exclusão
            </h3>
            <p className="text-xs font-mono text-white/70">
              Tem certeza que deseja excluir o serviço "{itemToDelete.service_name}"?
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={isDeleting}
                className="px-3 py-1.5 bg-white/5 text-white/70 hover:text-white font-mono text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs font-bold"
              >
                {isDeleting ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
