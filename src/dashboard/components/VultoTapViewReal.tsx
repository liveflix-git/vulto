import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  Trash2,
  Edit2,
  Calendar,
  AlertCircle,
  Check,
  Package,
  Layers,
  X,
  Sparkles,
} from 'lucide-react';
import {
  VultoTapCardItem,
  VultoTapCardStatus,
  fetchVultoTapCards,
  createVultoTapCard,
  updateVultoTapCard,
  deleteVultoTapCard,
} from '../../services/vultoTapService';
import { formatCurrencyBRL } from '../../services/dashboardService';

const STATUS_OPTIONS: { label: VultoTapCardStatus; badgeClass: string }[] = [
  { label: 'DISPONÍVEL', badgeClass: 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30' },
  { label: 'INDISPONÍVEL', badgeClass: 'bg-rose-950/40 text-rose-400 border-rose-500/30' },
  { label: 'EM PRODUÇÃO', badgeClass: 'bg-amber-950/40 text-amber-400 border-amber-500/30' },
];

export function VultoTapViewReal() {
  const [cards, setCards] = useState<VultoTapCardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState<'idle' | 'updating' | 'success' | 'error'>('idle');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal create/edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<VultoTapCardItem | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [status, setStatus] = useState<VultoTapCardStatus>('DISPONÍVEL');
  const [quantityInput, setQuantityInput] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete modal
  const [cardToDelete, setCardToDelete] = useState<VultoTapCardItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const loadCards = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
      setRefreshStatus('updating');
    } else {
      setIsLoading(true);
    }

    try {
      const data = await fetchVultoTapCards();
      setCards(data);
      if (isManualRefresh) {
        setRefreshStatus('success');
        setTimeout(() => setRefreshStatus('idle'), 2000);
      }
    } catch (err) {
      console.error('Erro ao carregar cartões:', err);
      if (isManualRefresh) {
        setRefreshStatus('error');
        showToast('Não foi possível atualizar os dados.', 'error');
        setTimeout(() => setRefreshStatus('idle'), 3000);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

useEffect(() => {
    loadCards();
  }, [loadCards]);

  useEffect(() => {
    const handleGlobalRefresh = () => {
      loadCards(true);
    };
    window.addEventListener('vulto:refresh', handleGlobalRefresh);
    return () => window.removeEventListener('vulto:refresh', handleGlobalRefresh);
  }, [loadCards]);

  const handleOpenCreateModal = () => {
    setEditingCard(null);
    setName('');
    setDescription('');
    setPriceInput('');
    setStatus('DISPONÍVEL');
    setQuantityInput('');
    setNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (card: VultoTapCardItem) => {
    setEditingCard(card);
    setName(card.name);
    setDescription(card.description || '');
    setPriceInput(card.price !== null && card.price !== undefined ? String(card.price) : '');
    setStatus(card.status);
    setQuantityInput(card.quantity !== null && card.quantity !== undefined ? String(card.quantity) : '');
    setNotes(card.notes || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Informe o nome do cartão ou placa.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const parsedPrice = priceInput.trim() === '' ? null : parseFloat(priceInput.replace(',', '.'));
    const parsedQty = quantityInput.trim() === '' ? null : parseInt(quantityInput, 10);

    try {
      if (editingCard) {
        // Atualizar
        const res = await updateVultoTapCard(editingCard.id, {
          name: name.trim(),
          description: description.trim() || null,
          price: parsedPrice,
          status,
          quantity: parsedQty,
          notes: notes.trim() || null,
        });

        if (res.error) {
          setFormError('Erro ao atualizar: ' + res.error);
          setIsSubmitting(false);
          return;
        }

        const now = new Date().toISOString();
        setCards((prev) =>
          prev.map((c) =>
            c.id === editingCard.id
              ? {
                  ...c,
                  name: name.trim(),
                  description: description.trim() || null,
                  price: parsedPrice,
                  status,
                  quantity: parsedQty,
                  notes: notes.trim() || null,
                  updated_at: now,
                }
              : c
          )
        );
        setIsModalOpen(false);
        showToast('SALVO');
      } else {
        // Criar
        const res = await createVultoTapCard({
          name: name.trim(),
          description: description.trim() || null,
          price: parsedPrice,
          status,
          quantity: parsedQty,
          notes: notes.trim() || null,
        });

        if (res.error) {
          setFormError('Erro ao criar: ' + res.error);
          setIsSubmitting(false);
          return;
        }

        if (res.data) {
          setCards((prev) => [res.data!, ...prev]);
        }
        setIsModalOpen(false);
        showToast('SALVO');
      }
    } catch (err: any) {
      setFormError('Erro inesperado: ' + (err.message || 'Falha'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!cardToDelete) return;
    setIsDeleting(true);

    try {
      const res = await deleteVultoTapCard(cardToDelete.id);
      if (res.error) {
        showToast('Não foi possível excluir o registro: ' + res.error, 'error');
      } else {
        setCards((prev) => prev.filter((c) => c.id !== cardToDelete.id));
        showToast('Registro excluído.');
        setCardToDelete(null);
      }
    } catch (err) {
      showToast('Não foi possível excluir o registro.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCards = useMemo(() => {
    return cards.filter((c) => {
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchDesc = (c.description || '').toLowerCase().includes(q);
        const matchNotes = (c.notes || '').toLowerCase().includes(q);
        return matchName || matchDesc || matchNotes;
      }
      return true;
    });
  }, [cards, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 border font-mono text-xs flex items-center gap-2 shadow-2xl transition-all duration-300 ${
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

      {/* Header Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111111] border border-white/10 p-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-widest text-[#C6FF00] uppercase">
              // DISPOSITIVOS & SMART NFC
            </span>
            <span className="text-white/20">•</span>
            <span className="text-[10px] font-mono text-white/50">
              SUPABASE VULTO_TAP_CARDS
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono text-white">
            VULTO TAP
          </h1>
          <p className="text-xs text-white/60 font-sans mt-0.5">
            Gerenciamento de cartões e placas inteligentes NFC cadastrados pela equipe.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Botão Atualizar */}
          <button
            onClick={() => loadCards(true)}
            disabled={isRefreshing}
            className="px-3.5 py-2.5 bg-[#161616] hover:bg-[#202020] border border-white/10 text-white/80 hover:text-white font-mono text-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            title="Recarregar cartões do Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#C6FF00]' : 'text-white/60'}`} />
            <span>
              {refreshStatus === 'updating'
                ? 'ATUALIZANDO...'
                : refreshStatus === 'success'
                ? 'ATUALIZADO'
                : 'ATUALIZAR'}
            </span>
          </button>

          {/* Botão Cadastrar Cartão */}
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-mono font-bold text-xs tracking-wider flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ CADASTRAR CARTÃO</span>
          </button>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-[#111111] border border-white/10 p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por modelo, descrição ou observação..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#161616] border border-white/10 pl-9 pr-3 py-2 text-xs text-white placeholder-white/30 font-mono focus:border-[#C6FF00] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-white/40" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#161616] border border-white/10 px-3 py-2 text-xs font-mono text-white focus:border-[#C6FF00] focus:outline-none cursor-pointer"
          >
            <option value="ALL">Status: Todos</option>
            <option value="DISPONÍVEL">Disponível</option>
            <option value="INDISPONÍVEL">Indisponível</option>
            <option value="EM PRODUÇÃO">Em Produção</option>
          </select>
        </div>
      </div>

      {/* Grid de Cartões ou Empty State */}
      {isLoading ? (
        <div className="bg-[#111111] border border-white/10 p-12 text-center flex flex-col items-center justify-center">
          <RefreshCw className="w-6 h-6 text-[#C6FF00] animate-spin mb-3" />
          <span className="font-mono text-xs text-white/50">Carregando itens do Supabase...</span>
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="bg-[#111111] border border-white/10 p-14 text-center space-y-4">
          <div className="w-14 h-14 bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-white/30">
            <CreditCard className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-mono text-sm font-bold text-white">
              Nenhum cartão cadastrado.
            </h3>
            <p className="text-xs text-white/50 max-w-sm mx-auto font-sans">
              Cadastre manualmente os cartões, placas ou tags NFC disponíveis no laboratório.
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-mono font-bold text-xs tracking-wider inline-flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ CADASTRAR CARTÃO</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCards.map((card) => {
            const hasPrice = card.price !== null && card.price !== undefined && !isNaN(card.price);
            const statusConfig = STATUS_OPTIONS.find((s) => s.label === card.status) || STATUS_OPTIONS[0];

            return (
              <div
                key={card.id}
                className="bg-[#111111] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between p-4 group"
              >
                {/* Header do Card */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1">
                      <span className={`inline-block text-[10px] font-mono px-2 py-0.5 border ${statusConfig.badgeClass} font-bold`}>
                        {card.status}
                      </span>
                      <h3 className="font-mono text-sm font-bold text-white group-hover:text-[#C6FF00] transition-colors">
                        {card.name}
                      </h3>
                    </div>

                    {hasPrice && (
                      <div className="text-right shrink-0 bg-[#161616] px-2.5 py-1 border border-[#C6FF00]/30">
                        <div className="text-[9px] font-mono text-white/40 uppercase">Preço</div>
                        <div className="text-xs font-bold font-mono text-[#C6FF00]">
                          {formatCurrencyBRL(card.price!)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Descrição */}
                  {card.description && (
                    <p className="text-xs text-white/70 font-sans leading-relaxed bg-[#0E0E0E] p-2.5 border border-white/5">
                      {card.description}
                    </p>
                  )}

                  {/* Quantidade e Observações */}
                  <div className="space-y-1.5 text-xs font-mono">
                    {card.quantity !== null && card.quantity !== undefined && (
                      <div className="flex items-center justify-between text-white/60 bg-[#141414] px-2 py-1 border border-white/5">
                        <span className="text-[10px] text-white/40 uppercase">Estoque Disponível:</span>
                        <span className="font-bold text-white">{card.quantity} unidades</span>
                      </div>
                    )}

                    {card.notes && (
                      <div className="text-[11px] text-white/50 font-sans italic bg-[#141414] p-2 border border-white/5">
                        Obs: "{card.notes}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer com Ações */}
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-white/30">
                    {new Date(card.updated_at).toLocaleDateString('pt-BR')}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(card)}
                      className="px-2.5 py-1.5 bg-[#181818] hover:bg-[#222222] border border-white/10 text-[10px] font-mono text-white/80 hover:text-[#C6FF00] flex items-center gap-1 transition-colors cursor-pointer"
                      title="Editar cartão"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>EDITAR</span>
                    </button>

                    <button
                      onClick={() => setCardToDelete(card)}
                      className="px-2.5 py-1.5 bg-rose-950/20 hover:bg-rose-950/50 border border-rose-800/30 text-[10px] font-mono text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
                      title="Excluir cartão"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>EXCLUIR</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: CRIAR / EDITAR CARTÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#111111] border border-white/20 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-[#C6FF00] uppercase">
                  {editingCard ? '// EDITAR CARTÃO' : '// NOVO CARTÃO NFC'}
                </span>
                <h2 className="text-base font-mono font-bold text-white">
                  {editingCard ? 'Editar Item VULTO TAP' : 'Cadastrar Cartão / Placa'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/40 hover:text-white p-1 cursor-pointer font-mono"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitForm} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Nome do Cartão / Placa */}
              <div>
                <label className="block text-xs font-mono text-white/70 mb-1">
                  Nome do Cartão / Placa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cartão PVC Black Matte NFC"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-xs font-mono text-white focus:border-[#C6FF00] focus:outline-none"
                />
              </div>

              {/* Status e Quantidade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-white/70 mb-1">
                    Status *
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as VultoTapCardStatus)}
                    className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-xs font-mono text-white focus:border-[#C6FF00] focus:outline-none cursor-pointer"
                  >
                    <option value="DISPONÍVEL">DISPONÍVEL</option>
                    <option value="INDISPONÍVEL">INDISPONÍVEL</option>
                    <option value="EM PRODUÇÃO">EM PRODUÇÃO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-white/70 mb-1">
                    Quantidade em Estoque (Opcional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ex: 50"
                    value={quantityInput}
                    onChange={(e) => setQuantityInput(e.target.value)}
                    className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-xs font-mono text-white focus:border-[#C6FF00] focus:outline-none"
                  />
                </div>
              </div>

              {/* Preço Opcional */}
              <div>
                <label className="block text-xs font-mono text-white/70 mb-1">
                  Preço Sugerido (R$) (Opcional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Deixe em branco se não houver preço fixo"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-xs font-mono text-white focus:border-[#C6FF00] focus:outline-none"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-mono text-white/70 mb-1">
                  Descrição do Item
                </label>
                <textarea
                  rows={2}
                  placeholder="Material, tipo do chip, acabamento (PVC fosco, metal escovado, acrílico)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 p-3 text-xs font-mono text-white focus:border-[#C6FF00] focus:outline-none"
                />
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-mono text-white/70 mb-1">
                  Observações Internas
                </label>
                <textarea
                  rows={2}
                  placeholder="Anotações de fornecedor, prazo de reposição, personalizações..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 p-3 text-xs font-mono text-white focus:border-[#C6FF00] focus:outline-none"
                />
              </div>

              {/* Ações */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-transparent hover:bg-white/5 border border-white/10 text-white/70 hover:text-white text-xs font-mono transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim()}
                  className="px-5 py-2 bg-[#C6FF00] hover:bg-[#b0e600] disabled:opacity-40 text-[#0A0A0A] font-mono font-bold text-xs tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>SALVANDO...</span>
                    </>
                  ) : (
                    <span>SALVAR CARTÃO</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR EXCLUSÃO */}
      {cardToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#111111] border border-rose-500/40 w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
                Confirmar Exclusão
              </h3>
            </div>

            <p className="text-xs font-mono text-white/70 leading-relaxed">
              Tem certeza que deseja excluir o cartão{' '}
              <strong className="text-white">"{cardToDelete.name}"</strong>?
              Esta operação removerá o item permanentemente do Supabase.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setCardToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/80 font-mono text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-mono font-bold text-xs tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>EXCLUINDO...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>SIM, EXCLUIR</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
