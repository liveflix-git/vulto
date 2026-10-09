import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Plus,
  Trash2,
  Edit2,
  AlertCircle,
  Check,
  X,
} from 'lucide-react';
import {
  VultoInventoryItem,
  VultoOperator,
  fetchVultoInventory,
  createVultoInventoryItem,
  updateVultoInventoryItem,
  deleteVultoInventoryItem,
  fetchVultoOperators,
} from '../../services/vultoCoreService';
import { supabase } from '../../lib/supabase';

export function InventoryNfcView() {
  const [items, setItems] = useState<VultoInventoryItem[]>([]);
  const [operators, setOperators] = useState<VultoOperator[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Novo/Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VultoInventoryItem | null>(null);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Modal Exclusão
  const [itemToDelete, setItemToDelete] = useState<VultoInventoryItem | null>(null);
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
        fetchVultoInventory(),
      ]);
      setOperators(ops);
      setItems(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listener refresh global
  useEffect(() => {
    const handleGlobalRefresh = () => {
      loadData();
    };
    window.addEventListener('vulto:refresh', handleGlobalRefresh);
    return () => window.removeEventListener('vulto:refresh', handleGlobalRefresh);
  }, [loadData]);

  // Supabase Realtime
  useEffect(() => {
    const channel = supabase
      .channel('vulto_inventory_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vulto_inventory' }, () => {
        fetchVultoInventory().then((res) => setItems(res.data));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getOperatorName = (operatorId: string | null) => {
    if (!operatorId) return 'Operador';
    const match = operators.find((op) => op.id === operatorId);
    return match ? match.name : 'Operador';
  };

  const handleOpenNew = () => {
    setEditingItem(null);
    setName('');
    setQuantity('');
    setNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: VultoInventoryItem) => {
    setEditingItem(item);
    setName(item.name);
    setQuantity(String(item.quantity));
    setNotes(item.notes || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleQuickQuantityChange = async (item: VultoInventoryItem, delta: number) => {
    const newQty = Math.max(0, Number(item.quantity || 0) + delta);
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, quantity: newQty } : i))
    );

    const res = await updateVultoInventoryItem(item.id, { quantity: newQty });
    if (res.error) {
      showToast('Erro ao atualizar quantidade.', 'error');
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, quantity: item.quantity } : i))
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Informe o nome do item.');
      return;
    }

    const qtyVal = parseInt(quantity, 10);
    if (isNaN(qtyVal) || qtyVal < 0) {
      setFormError('A quantidade não pode ser negativa.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingItem) {
        const res = await updateVultoInventoryItem(editingItem.id, {
          name: name.trim(),
          quantity: qtyVal,
          notes: notes.trim() || null,
        });

        if (res.error) {
          setFormError(res.error);
        } else {
          setItems((prev) =>
            prev.map((i) =>
              i.id === editingItem.id
                ? {
                    ...i,
                    name: name.trim(),
                    quantity: qtyVal,
                    notes: notes.trim() || null,
                    updated_at: new Date().toISOString(),
                  }
                : i
            )
          );
          setIsModalOpen(false);
          showToast('Item atualizado com sucesso.');
        }
      } else {
        const res = await createVultoInventoryItem({
          name: name.trim(),
          quantity: qtyVal,
          notes: notes.trim() || null,
        });

        if (res.error) {
          setFormError(res.error);
        } else if (res.data) {
          setItems((prev) => [res.data!, ...prev]);
          setIsModalOpen(false);
          showToast('Item cadastrado com sucesso.');
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

    try {
      const res = await deleteVultoInventoryItem(itemToDelete.id);
      if (res.error) {
        showToast('Não foi possível excluir o item: ' + res.error, 'error');
      } else {
        setItems((prev) => prev.filter((i) => i.id !== itemToDelete.id));
        showToast('Registro excluído.');
        setItemToDelete(null);
      }
    } catch (e: any) {
      showToast('Não foi possível excluir o registro.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

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
            <Check className="w-4 h-4 stroke-[2.5]" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span className="font-bold tracking-wider">{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-[#111111] border border-white/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono text-white">
            ESTOQUE NFC
          </h1>
          <p className="text-xs text-white/50 font-sans mt-0.5">
            Controle de cartões e materiais.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="px-4 py-2 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-mono font-bold text-xs tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ ADICIONAR ITEM</span>
        </button>
      </div>

      {/* Tabela de Estoque */}
      <div className="bg-[#111111] border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 bg-[#0E0E0E] text-white/50 text-[10px] uppercase">
                <th className="py-3 px-4">Item</th>
                <th className="py-3 px-4 text-center">Quantidade</th>
                <th className="py-3 px-4">Observações</th>
                <th className="py-3 px-4">Operador</th>
                <th className="py-3 px-4">Última atualização</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-white/40">
                    Carregando estoque...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-white/40">
                    Nenhum item em estoque cadastrado.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-bold text-white">{item.name}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-2 bg-[#161616] px-2 py-1 border border-white/10">
                        <button
                          type="button"
                          onClick={() => handleQuickQuantityChange(item, -1)}
                          className="px-1 text-white/40 hover:text-white cursor-pointer font-bold"
                          title="Diminuir"
                        >
                          -
                        </button>
                        <span className="font-bold text-white min-w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuickQuantityChange(item, 1)}
                          className="px-1 text-white/40 hover:text-[#C6FF00] cursor-pointer font-bold"
                          title="Aumentar"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-white/60">
                      {item.notes || <span className="text-white/20">-</span>}
                    </td>
                    <td className="py-3 px-4 text-white/70">
                      {getOperatorName(item.operator_id)}
                    </td>
                    <td className="py-3 px-4 text-white/50">
                      {new Date(item.updated_at || item.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-[#C6FF00] transition-colors cursor-pointer"
                          title="Editar item"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setItemToDelete(item)}
                          className="p-1.5 bg-rose-950/20 hover:bg-rose-950/50 text-rose-400 border border-rose-800/30 transition-colors cursor-pointer"
                          title="Excluir item"
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

      {/* MODAL: ADICIONAR / EDITAR ITEM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#111111] border border-white/20 w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-mono text-sm font-bold text-white">
                {editingItem ? 'Editar Item' : 'Adicionar Item'}
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
                <label className="block text-white/60 mb-1">Nome do Item *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: NFC Google ou Cartão Black Matte"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00]"
                />
              </div>

              <div>
                <label className="block text-white/60 mb-1">Quantidade *</label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00]"
                />
              </div>

              <div>
                <label className="block text-white/60 mb-1">Observações (opcional)</label>
                <textarea
                  rows={3}
                  placeholder="Fornecedor, material ou detalhes de lote"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00]"
                />
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
              Tem certeza que deseja excluir o item "{itemToDelete.name}"?
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
