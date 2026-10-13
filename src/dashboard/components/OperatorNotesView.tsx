import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StickyNote,
  Plus,
  Edit3,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  Clock,
  User,
  Shield,
  X,
  Save,
  CheckCircle2,
  Search,
  Maximize2,
  FileText,
} from 'lucide-react';
import {
  VultoOperator,
  VultoOperatorNote,
  fetchOperatorNotes,
  saveOperatorNote,
  deleteOperatorNote,
  getActiveOperatorSession,
} from '../../services/vultoCoreService';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface OperatorNotesViewProps {
  activeOperator?: VultoOperator | null;
}

const MAX_SLOTS = 15;
const MAX_CONTENT_LENGTH = 3000;
const MAX_TITLE_LENGTH = 80;

/**
 * Encontra o menor slot livre entre 1 e 15.
 * Exemplo: se existem 1, 2, 4 -> retorna 3.
 */
function findLowestAvailableSlot(existingNotes: VultoOperatorNote[]): number | null {
  const occupied = new Set(existingNotes.map((n) => n.slot));
  for (let s = 1; s <= MAX_SLOTS; s++) {
    if (!occupied.has(s)) {
      return s;
    }
  }
  return null;
}

export function OperatorNotesView({ activeOperator: propOperator }: OperatorNotesViewProps) {
  // Operador ativo (recebido via prop ou lido da sessão)
  const [operatorSession, setOperatorSession] = useState<VultoOperator | null>(() =>
    propOperator || getActiveOperatorSession()
  );

  // Manter sincronizado se a prop mudar
  useEffect(() => {
    if (propOperator) {
      setOperatorSession(propOperator);
    } else {
      setOperatorSession(getActiveOperatorSession());
    }
  }, [propOperator]);

  // Identificador do operador para a tabela: "Felipe", "Pietro" etc.
  const currentOperatorName = useMemo(() => {
    return operatorSession?.name?.trim() || operatorSession?.id?.trim() || '';
  }, [operatorSession]);

  const [notes, setNotes] = useState<VultoOperatorNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal de Leitura / Edição / Criação
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formNoteId, setFormNoteId] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  // Confirmação de exclusão inline
  const [confirmDeleteSlot, setConfirmDeleteSlot] = useState<number | null>(null);

  // Feedback e Toasts
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [copiedSlot, setCopiedSlot] = useState<number | null>(null);

  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3500);
  }, []);

  // Carregar notas para o operador específico
  const loadNotes = useCallback(async (operatorKey: string, silent = false) => {
    if (!operatorKey) {
      setNotes([]);
      setIsLoading(false);
      return;
    }

    if (!silent) setIsLoading(true);
    try {
      const res = await fetchOperatorNotes(operatorKey);
      const sorted = (res.data || []).sort((a, b) => a.slot - b.slot);
      setNotes(sorted);
      if (res.error && isSupabaseConfigured) {
        console.warn('Aviso notas:', res.error);
      }
    } catch (err: any) {
      console.error('Erro ao buscar notas:', err);
      showToast('error', 'Erro ao sincronizar notas');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [showToast]);

  // =====================================================================
  // TROCA DE OPERADOR: LIMPAR IMEDIATAMENTE DA INTERFACE E RECARREGAR
  // "Ao trocar de Felipe para Pietro: limpar imediatamente notas de Felipe da interface
  //  e carregar notas de Pietro. NUNCA misturar notas de operadores diferentes."
  // =====================================================================
  useEffect(() => {
    // 1. Limpa imediatamente da interface
    setNotes([]);
    setEditingSlot(null);
    setConfirmDeleteSlot(null);
    setSearchQuery('');

    // 2. Carrega as notas exclusivas do novo operador ativo
    if (currentOperatorName) {
      loadNotes(currentOperatorName);
    } else {
      setIsLoading(false);
    }
  }, [currentOperatorName, loadNotes]);

  // Realtime Supabase para o operador ativo
  useEffect(() => {
    if (!isSupabaseConfigured || !currentOperatorName) return;

    const channel = supabase
      .channel(`vulto_operator_notes_${currentOperatorName}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vulto_operator_notes',
          filter: `operator_id=eq.${currentOperatorName}`,
        },
        () => {
          loadNotes(currentOperatorName, true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentOperatorName, loadNotes]);

  // Menor slot disponível
  const nextAvailableSlot = useMemo(() => {
    return findLowestAvailableSlot(notes);
  }, [notes]);

  const isLimitReached = notes.length >= MAX_SLOTS;

  // Abrir modal para criar nova nota no menor slot disponível
  const handleOpenNewNote = () => {
    if (isLimitReached) {
      showToast('info', 'Limite de 15 notas atingido.');
      return;
    }
    const targetSlot = nextAvailableSlot;
    if (targetSlot === null) {
      showToast('info', 'Todos os 15 slots estão ocupados.');
      return;
    }
    setEditingSlot(targetSlot);
    setFormNoteId(undefined);
    setFormTitle('');
    setFormContent('');
  };

  // Abrir modal para edição de slot existente ou criação em slot específico
  const handleOpenEdit = (slot: number) => {
    const existing = notes.find((n) => n.slot === slot);
    setEditingSlot(slot);
    setFormNoteId(existing?.id);
    setFormTitle(existing?.title || '');
    setFormContent(existing?.content || '');
  };

  const handleCloseEdit = () => {
    setEditingSlot(null);
    setFormNoteId(undefined);
    setFormTitle('');
    setFormContent('');
  };

  // Salvar nota (validação de até 3000 caracteres e slot 1-15)
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingSlot || !currentOperatorName || isSaving) return;

    if (editingSlot < 1 || editingSlot > MAX_SLOTS) {
      showToast('error', 'Slot inválido (deve ser entre 1 e 15).');
      return;
    }

    const cleanTitle = formTitle.trim().slice(0, MAX_TITLE_LENGTH);
    const cleanContent = formContent.trim().slice(0, MAX_CONTENT_LENGTH);

    // Se estiver tudo vazio, avisa o operador
    if (!cleanTitle && !cleanContent) {
      showToast('info', 'Preencha pelo menos o título ou conteúdo da nota.');
      return;
    }

    if (formContent.length > MAX_CONTENT_LENGTH) {
      showToast('error', `Conteúdo excede o limite máximo de ${MAX_CONTENT_LENGTH} caracteres.`);
      return;
    }

    setIsSaving(true);
    try {
      const res = await saveOperatorNote({
        id: formNoteId,
        operator_id: currentOperatorName,
        slot: editingSlot,
        title: cleanTitle,
        content: formContent.slice(0, MAX_CONTENT_LENGTH), // preserva quebras e espaços
      });

      if (res.success && res.data) {
        // Atualização otimista imediata no estado local
        setNotes((prev) => {
          const filtered = prev.filter((n) => n.slot !== editingSlot);
          return [...filtered, res.data!].sort((a, b) => a.slot - b.slot);
        });
        showToast('success', `Nota do Slot ${editingSlot} salva com sucesso!`);
        handleCloseEdit();
      } else {
        showToast('error', res.error || 'Erro ao salvar nota.');
      }
    } catch (err: any) {
      console.error(err);
      showToast('error', 'Falha ao salvar a nota.');
    } finally {
      setIsSaving(false);
    }
  };

  // Excluir / Limpar slot
  const handleConfirmDelete = async (slot: number) => {
    if (!currentOperatorName) return;
    const existing = notes.find((n) => n.slot === slot);

    try {
      const res = await deleteOperatorNote({
        operator_id: currentOperatorName,
        slot,
        id: existing?.id,
      });

      if (res.success) {
        setNotes((prev) => prev.filter((n) => n.slot !== slot));
        showToast('info', `Slot ${slot} excluído com sucesso.`);
        if (editingSlot === slot) {
          handleCloseEdit();
        }
      } else {
        showToast('error', res.error || 'Erro ao limpar slot.');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Falha ao excluir nota.');
    } finally {
      setConfirmDeleteSlot(null);
    }
  };

  // Copiar conteúdo da nota
  const handleCopyNote = async (slot: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSlot(slot);
      setTimeout(() => setCopiedSlot((prev) => (prev === slot ? null : prev)), 2000);
      showToast('info', 'Conteúdo copiado para a área de transferência!');
    } catch {
      showToast('error', 'Não foi possível copiar o texto.');
    }
  };

  // Formatador de data e hora
  const formatLastUpdated = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month} às ${hours}:${mins}`;
    } catch {
      return '';
    }
  };

  // Notas filtradas para busca opcional
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const q = searchQuery.toLowerCase().trim();
    return notes.filter((n) => {
      const titleMatch = n.title?.toLowerCase().includes(q);
      const contentMatch = n.content?.toLowerCase().includes(q);
      const slotMatch = `slot ${n.slot}`.toLowerCase().includes(q);
      return titleMatch || contentMatch || slotMatch;
    });
  }, [notes, searchQuery]);

  const occupiedCount = notes.length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 border font-mono text-xs shadow-2xl transition-all ${
            toast.type === 'success'
              ? 'bg-[#121A0E] border-[#C6FF00] text-[#C6FF00]'
              : toast.type === 'error'
              ? 'bg-[#220E0E] border-red-500 text-red-300'
              : 'bg-[#151515] border-white/20 text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#C6FF00]" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-400" />
          ) : (
            <StickyNote className="w-4 h-4 text-white/70" />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-white/40 hover:text-white p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header da Seção */}
      <div className="bg-[#0A0A0A] border border-white/10 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#C6FF00]" />
            <span className="font-mono text-xs text-[#C6FF00] tracking-widest font-semibold uppercase">
              ÁREA PESSOAL DO OPERADOR
            </span>
          </div>
          <h1 className="font-mono text-xl sm:text-2xl font-bold tracking-wider text-white flex items-center gap-2.5">
            <StickyNote className="w-6 h-6 text-[#C6FF00]" />
            MINHAS NOTAS
          </h1>
          <p className="text-xs sm:text-sm text-white/50 font-sans max-w-2xl">
            Anotações pessoais do operador ativo. Suporta até 15 notas com até 3.000 caracteres cada,
            sincronizadas e isoladas no Supabase.
          </p>
        </div>

        {/* Status do Operador, Capacidade e Botão Nova Nota */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Operador Ativo */}
          <div className="flex items-center gap-2.5 px-3.5 py-2 bg-[#141414] border border-white/15">
            <div className="w-6 h-6 bg-[#C6FF00]/15 border border-[#C6FF00]/40 text-[#C6FF00] font-mono text-xs font-bold flex items-center justify-center">
              {currentOperatorName ? currentOperatorName.charAt(0) : <User className="w-3.5 h-3.5" />}
            </div>
            <div className="flex flex-col text-left">
              <span className="font-mono text-[9px] text-white/40 uppercase tracking-wider">
                OPERADOR ATIVO
              </span>
              <span className="font-mono text-xs font-bold text-white">
                {currentOperatorName || 'Nenhum'}
              </span>
            </div>
          </div>

          {/* Indicador X / 15 NOTAS */}
          <div className="px-3.5 py-2 bg-[#141414] border border-white/10 font-mono text-xs flex items-center gap-2">
            <span className="text-white/40 text-[10px] tracking-wider uppercase">NOTAS:</span>
            <span className={`font-bold ${isLimitReached ? 'text-amber-400' : 'text-[#C6FF00]'}`}>
              {occupiedCount}
            </span>
            <span className="text-white/30">/ {MAX_SLOTS}</span>
          </div>

          {/* Botão + NOVA NOTA */}
          <button
            onClick={handleOpenNewNote}
            disabled={isLimitReached}
            className={`flex items-center gap-2 px-4 py-2 font-mono text-xs font-bold tracking-wider transition-all cursor-pointer ${
              isLimitReached
                ? 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed'
                : 'bg-[#C6FF00] hover:bg-[#d4ff33] text-black shadow-lg shadow-[#C6FF00]/10 hover:shadow-[#C6FF00]/20'
            }`}
            title={
              isLimitReached
                ? 'Limite de 15 notas atingido'
                : nextAvailableSlot
                ? `Criar nova nota no Slot ${nextAvailableSlot}`
                : 'Criar nova nota'
            }
          >
            <Plus className="w-4 h-4" />
            <span>+ NOVA NOTA</span>
          </button>

          {/* Botão de Atualizar */}
          <button
            onClick={() => {
              if (currentOperatorName) {
                setIsRefreshing(true);
                loadNotes(currentOperatorName);
              }
            }}
            disabled={isRefreshing || isLoading}
            className="p-2.5 bg-[#141414] hover:bg-[#1C1C1C] border border-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
            title="Recarregar notas do operador"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#C6FF00]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Aviso de Isolamento & Barra de Pesquisa */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#101010] border-l-2 border-[#C6FF00] p-3 sm:px-4">
        <div className="flex items-center gap-2 text-xs font-mono text-white/60">
          <Shield className="w-4 h-4 text-[#C6FF00] shrink-0" />
          <span>
            Área restrita de <span className="text-white font-bold">{currentOperatorName}</span>.
            Isolamento estrito • slots de 1 a 15 • até 3.000 caracteres.
          </span>
        </div>

        {/* Busca rápida se houver mais de 3 notas */}
        {notes.length > 2 && (
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-white/30 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar notas..."
              className="w-full bg-[#161616] border border-white/10 pl-8 pr-7 py-1 text-xs font-mono text-white placeholder-white/30 focus:outline-none focus:border-[#C6FF00]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Alerta de Limite Atingido se 15/15 */}
      {isLimitReached && (
        <div className="bg-[#1A1408] border border-amber-500/30 p-3 sm:px-4 flex items-center justify-between gap-3 text-xs font-mono text-amber-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Limite máximo de 15 notas atingido para este operador. Para adicionar uma nova, limpe ou edite uma nota existente.
            </span>
          </div>
          <span className="hidden sm:inline-block text-[10px] text-amber-400/60 uppercase tracking-wider">
            15 / 15 SLOTS OCUPADOS
          </span>
        </div>
      )}

      {/* Grid de Cards: Desktop 3 cols, Tablet/Notebook 2 cols, Mobile 1 col */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-48 bg-[#111111] border border-white/10 p-5 flex flex-col justify-between animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-16 bg-white/10" />
                <div className="h-4 w-20 bg-white/10" />
              </div>
              <div className="space-y-2">
                <div className="h-5 w-3/4 bg-white/10" />
                <div className="h-3 w-full bg-white/5" />
                <div className="h-3 w-4/5 bg-white/5" />
              </div>
              <div className="h-6 w-20 bg-white/10" />
            </div>
          ))}
        </div>
      ) : notes.length === 0 ? (
        /* Empty State Elegante quando 0 notas */
        <div className="bg-[#0D0D0D] border border-dashed border-white/15 p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-14 h-14 bg-white/5 border border-white/10 text-[#C6FF00] flex items-center justify-center">
            <StickyNote className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="font-mono text-base font-bold text-white tracking-wide">
              NENHUMA NOTA CRIADA AINDA
            </h3>
            <p className="font-sans text-xs text-white/50 leading-relaxed">
              Você pode registrar até 15 notas de lembretes, scripts diários, instruções de follow-up
              ou anotações de clientes para acesso rápido.
            </p>
          </div>
          <button
            onClick={handleOpenNewNote}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#C6FF00] hover:bg-[#d4ff33] text-black font-mono text-xs font-bold tracking-wider transition-all cursor-pointer shadow-lg shadow-[#C6FF00]/10"
          >
            <Plus className="w-4 h-4" />
            <span>CRIAR PRIMEIRA NOTA (SLOT 1)</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => {
            const charCount = note.content ? note.content.length : 0;

            return (
              <div
                key={note.slot}
                onClick={() => handleOpenEdit(note.slot)}
                className="bg-[#121212] border border-white/15 hover:border-white/35 transition-all flex flex-col justify-between p-5 group relative cursor-pointer"
              >
                {/* Topo do Card */}
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-[#C6FF00] bg-[#C6FF00]/10 border border-[#C6FF00]/30 px-2 py-0.5">
                        SLOT {String(note.slot).padStart(2, '0')}
                      </span>
                      <span className="font-mono text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 uppercase tracking-wider">
                        Ativa
                      </span>
                    </div>

                    {/* Última atualização */}
                    {note.updated_at && (
                      <div className="flex items-center gap-1 font-mono text-[10px] text-white/40">
                        <Clock className="w-3 h-3 text-white/30" />
                        <span>{formatLastUpdated(note.updated_at)}</span>
                      </div>
                    )}
                  </div>

                  {/* Título da Nota */}
                  <div className="mt-3.5">
                    <h3 className="font-mono text-sm sm:text-base font-bold text-white tracking-wide break-words line-clamp-1 group-hover:text-[#C6FF00] transition-colors">
                      {note.title || '(Nota sem título)'}
                    </h3>
                  </div>

                  {/* Preview do Conteúdo (clamp 3 linhas com reticências) */}
                  <div className="mt-2 text-xs text-white/70 font-sans leading-relaxed line-clamp-3 break-words min-h-[3.75rem]">
                    {note.content || (
                      <span className="text-white/30 italic">(Sem texto adicional)</span>
                    )}
                  </div>
                </div>

                {/* Rodapé do Card */}
                <div
                  className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Contador de caracteres (ex: 1250 / 3000) */}
                  <span className="font-mono text-[10px] text-white/40">
                    {charCount} / {MAX_CONTENT_LENGTH}
                  </span>

                  {/* Ações Rápidas */}
                  <div className="flex items-center gap-1.5">
                    {/* Copiar */}
                    <button
                      onClick={() =>
                        handleCopyNote(
                          note.slot,
                          `${note.title ? `${note.title}\n\n` : ''}${note.content}`
                        )
                      }
                      className="p-1.5 bg-[#1A1A1A] hover:bg-[#252525] border border-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
                      title="Copiar nota para área de transferência"
                    >
                      {copiedSlot === note.slot ? (
                        <Check className="w-3.5 h-3.5 text-[#C6FF00]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Ver Completa / Editar */}
                    <button
                      onClick={() => handleOpenEdit(note.slot)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-white/5 hover:bg-[#C6FF00] hover:text-black border border-white/15 hover:border-[#C6FF00] font-mono text-[11px] font-semibold text-white transition-all cursor-pointer"
                      title="Abrir e editar nota"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>EDITAR</span>
                    </button>

                    {/* Excluir / Limpar Slot com Confirmação Inline */}
                    {confirmDeleteSlot === note.slot ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleConfirmDelete(note.slot)}
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white font-mono text-[10px] font-bold transition-colors cursor-pointer"
                          title="Confirmar exclusão"
                        >
                          EXCLUIR?
                        </button>
                        <button
                          onClick={() => setConfirmDeleteSlot(null)}
                          className="px-1.5 py-1 bg-white/10 hover:bg-white/20 text-white font-mono text-[10px] transition-colors cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteSlot(note.slot)}
                        className="p-1.5 bg-red-500/5 hover:bg-red-500/15 border border-red-500/20 text-red-400 hover:text-red-300 font-mono text-xs transition-colors cursor-pointer"
                        title="Excluir nota"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Card de Adição de Próximo Slot se houver slots livres e sem filtro de busca ativo */}
          {!isLimitReached && !searchQuery && nextAvailableSlot !== null && (
            <div
              onClick={handleOpenNewNote}
              className="bg-[#101010]/40 border-2 border-dashed border-white/10 hover:border-[#C6FF00]/50 hover:bg-[#141414]/60 transition-all p-5 flex flex-col justify-between cursor-pointer group min-h-[190px]"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-white/50 group-hover:text-[#C6FF00] transition-colors">
                  SLOT {String(nextAvailableSlot).padStart(2, '0')}
                </span>
                <span className="font-mono text-[9px] text-white/40 bg-white/5 border border-white/10 px-2 py-0.5 uppercase tracking-wider">
                  Disponível
                </span>
              </div>

              <div className="py-4 flex flex-col items-center justify-center text-center space-y-2">
                <div className="w-9 h-9 bg-white/5 group-hover:bg-[#C6FF00]/10 border border-white/10 group-hover:border-[#C6FF00]/40 text-white/40 group-hover:text-[#C6FF00] flex items-center justify-center transition-all">
                  <Plus className="w-4 h-4" />
                </div>
                <p className="font-mono text-xs text-white/60 group-hover:text-white transition-colors">
                  + Adicionar Nota (Slot {nextAvailableSlot})
                </p>
                <p className="text-[11px] text-white/30 font-sans max-w-xs">
                  Até 3.000 caracteres para anotações operacionais.
                </p>
              </div>

              <div className="pt-2.5 border-t border-white/5 flex items-center justify-center">
                <span className="font-mono text-[10px] text-white/40 group-hover:text-[#C6FF00] transition-colors">
                  Clique para preencher o Slot {nextAvailableSlot}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          MODAL DE LEITURA COMPLETA E EDIÇÃO
          Suporta até 3000 caracteres, salvamento com Ctrl+Enter, contador visual
          ===================================================================== */}
      {editingSlot !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm select-none">
          <div className="bg-[#111111] border border-white/20 w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl relative">
            {/* Fechar */}
            <button
              onClick={handleCloseEdit}
              className="absolute top-4 right-4 text-white/40 hover:text-white p-1 cursor-pointer transition-colors z-10"
              title="Fechar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cabeçalho do Modal */}
            <div className="p-5 sm:p-6 pb-4 border-b border-white/10 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#C6FF00] bg-[#C6FF00]/10 border border-[#C6FF00]/30 px-2 py-0.5">
                  SLOT {String(editingSlot).padStart(2, '0')}
                </span>
                <span className="font-mono text-[11px] text-white/40">
                  {formNoteId ? 'EDITAR NOTA EXISTENTE' : 'NOVA NOTA PESSOAL'}
                </span>
              </div>
              <h2 className="font-mono text-base sm:text-lg font-bold text-white tracking-wide">
                ÁREA DE TRABALHO DE {currentOperatorName.toUpperCase()}
              </h2>
            </div>

            {/* Corpo do Formulário */}
            <form onSubmit={handleSave} className="flex-1 flex flex-col overflow-hidden p-5 sm:p-6 space-y-4">
              {/* Campo: Título (máx 80) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-mono text-xs text-white/70 tracking-wider">
                    TÍTULO DA NOTA
                  </label>
                  <span
                    className={`font-mono text-[10px] ${
                      formTitle.length >= MAX_TITLE_LENGTH
                        ? 'text-amber-400 font-bold'
                        : 'text-white/40'
                    }`}
                  >
                    {formTitle.length} / {MAX_TITLE_LENGTH}
                  </span>
                </div>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value.slice(0, MAX_TITLE_LENGTH))}
                  placeholder="Ex: Scripts de follow-up, briefings ou tarefas do dia"
                  maxLength={MAX_TITLE_LENGTH}
                  className="w-full bg-[#181818] border border-white/15 px-3 py-2.5 font-mono text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C6FF00]"
                  autoFocus
                />
              </div>

              {/* Campo: Conteúdo (máx 3000) */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-mono text-xs text-white/70 tracking-wider">
                    CONTEÚDO DA NOTA
                  </label>
                  <span
                    className={`font-mono text-[10px] ${
                      formContent.length >= MAX_CONTENT_LENGTH
                        ? 'text-amber-400 font-bold'
                        : formContent.length > 2500
                        ? 'text-amber-300'
                        : 'text-white/40'
                    }`}
                  >
                    {formContent.length} / {MAX_CONTENT_LENGTH}
                  </span>
                </div>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value.slice(0, MAX_CONTENT_LENGTH))}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault();
                      handleSave();
                    }
                  }}
                  rows={10}
                  placeholder="Digite aqui até 3.000 caracteres de anotações, números de telefone, argumentos comerciais, histórico de clientes..."
                  maxLength={MAX_CONTENT_LENGTH}
                  className="w-full flex-1 min-h-[220px] max-h-[45vh] bg-[#181818] border border-white/15 p-3.5 font-sans text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C6FF00] leading-relaxed resize-y overflow-y-auto"
                />
                <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-white/30">
                  <span>Limite estendido: até 3.000 caracteres por nota</span>
                  <span>Ctrl + Enter para salvar</span>
                </div>
              </div>

              {/* Ações do Modal */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCloseEdit}
                    disabled={isSaving}
                    className="px-4 py-2 bg-transparent hover:bg-white/5 border border-white/15 font-mono text-xs text-white/60 hover:text-white transition-colors cursor-pointer"
                  >
                    CANCELAR
                  </button>

                  {formNoteId && (
                    <button
                      type="button"
                      onClick={() => handleConfirmDelete(editingSlot)}
                      disabled={isSaving}
                      className="px-3 py-2 bg-red-500/5 hover:bg-red-500/15 border border-red-500/20 font-mono text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                      title="Excluir esta nota"
                    >
                      EXCLUIR
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {(formTitle || formContent) && (
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyNote(
                          editingSlot,
                          `${formTitle ? `${formTitle}\n\n` : ''}${formContent}`
                        )
                      }
                      className="p-2 bg-[#181818] hover:bg-[#222222] border border-white/15 text-white/70 hover:text-white transition-colors cursor-pointer"
                      title="Copiar texto atual"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 px-5 py-2 bg-[#C6FF00] hover:bg-[#d4ff33] text-black font-mono text-xs font-bold tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>SALVANDO...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>SALVAR NOTA</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
