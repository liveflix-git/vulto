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

const SLOTS = [1, 2, 3, 4] as const;

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

  // Identificador do operador para a tabela: o usuário estipulou "operator_id = Felipe" ou "operator_id = Pietro"
  const currentOperatorName = useMemo(() => {
    return operatorSession?.name?.trim() || operatorSession?.id?.trim() || '';
  }, [operatorSession]);

  const [notes, setNotes] = useState<VultoOperatorNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal / Edição
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formNoteId, setFormNoteId] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  // Confirmação de exclusão
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
      setNotes(res.data || []);
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

  // Abrir modal de criação/edição
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

  // Salvar nota
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingSlot || !currentOperatorName || isSaving) return;

    const cleanTitle = formTitle.trim().slice(0, 80);
    const cleanContent = formContent.trim().slice(0, 1000);

    // Se estiver tudo vazio, avisa o operador
    if (!cleanTitle && !cleanContent) {
      showToast('info', 'Preencha pelo menos o título ou conteúdo da nota.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await saveOperatorNote({
        id: formNoteId,
        operator_id: currentOperatorName,
        slot: editingSlot,
        title: cleanTitle,
        content: formContent.slice(0, 1000), // preserva quebras e espaços
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
        showToast('info', `Slot ${slot} limpo.`);
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
      return `Atualizado em ${day}/${month} às ${hours}:${mins}`;
    } catch {
      return '';
    }
  };

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
      <div className="bg-[#0A0A0A] border border-white/10 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
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
            Bloco de notas pessoal com 4 slots dedicados. Use para lembretes, scripts diários,
            briefings rápidos ou anotações sigilosas de prospecção.
          </p>
        </div>

        {/* Status do Operador e Capacidade */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Card do Operador Ativo */}
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

          {/* Capacidade de Slots */}
          <div className="px-3.5 py-2 bg-[#141414] border border-white/10 font-mono text-xs flex items-center gap-2">
            <span className="text-white/40 text-[10px] tracking-wider uppercase">SLOTS:</span>
            <span className="text-[#C6FF00] font-bold">{occupiedCount}</span>
            <span className="text-white/30">/ 4</span>
          </div>

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

      {/* Aviso de Privacidade / Isolamento estrito */}
      <div className="bg-[#101010] border-l-2 border-[#C6FF00] p-3 sm:px-4 flex items-center justify-between gap-3 text-xs font-mono text-white/60">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#C6FF00] shrink-0" />
          <span>
            Área restrita de <span className="text-white font-bold">{currentOperatorName}</span>.
            As notas deste painel pertencem unicamente a este operador e não são misturadas com outro perfil.
          </span>
        </div>
        <span className="hidden md:inline-block text-[10px] text-white/30 tracking-wider">
          ISOLAMENTO SUPABASE • 4 SLOTS
        </span>
      </div>

      {/* Grid 2x2 no Desktop, 1 Coluna no Mobile: SEMPRE 4 CARDS */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          {SLOTS.map((slotNum) => (
            <div
              key={slotNum}
              className="h-64 bg-[#111111] border border-white/10 p-6 flex flex-col justify-between animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-20 bg-white/10" />
                <div className="h-4 w-24 bg-white/10" />
              </div>
              <div className="space-y-3">
                <div className="h-5 w-3/4 bg-white/10" />
                <div className="h-3 w-full bg-white/5" />
                <div className="h-3 w-5/6 bg-white/5" />
              </div>
              <div className="h-8 w-24 bg-white/10" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          {SLOTS.map((slotNum) => {
            const note = notes.find((n) => n.slot === slotNum);
            const isFilled = Boolean(note);

            if (isFilled && note) {
              // ==========================================
              // ESTADO 2: PREENCHIDO
              // ==========================================
              return (
                <div
                  key={slotNum}
                  className="bg-[#121212] border border-white/15 hover:border-white/30 transition-all flex flex-col justify-between p-5 sm:p-6 group relative"
                >
                  {/* Top Bar do Card */}
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-white/10 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#C6FF00] bg-[#C6FF00]/10 border border-[#C6FF00]/30 px-2 py-0.5">
                          SLOT {slotNum}
                        </span>
                        <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 uppercase tracking-wider">
                          Ocupado
                        </span>
                      </div>

                      {/* Data de última atualização */}
                      {note.updated_at && (
                        <div className="flex items-center gap-1 font-mono text-[10px] text-white/40">
                          <Clock className="w-3 h-3 text-white/30" />
                          <span>{formatLastUpdated(note.updated_at)}</span>
                        </div>
                      )}
                    </div>

                    {/* Título da Nota (máx 80 chars) */}
                    <div className="mt-4">
                      <h2 className="font-mono text-base font-bold text-white tracking-wide break-words line-clamp-2">
                        {note.title || '(Nota sem título)'}
                      </h2>
                    </div>

                    {/* Conteúdo (máx 1000 chars, com quebras preservadas) */}
                    <div className="mt-3 text-xs sm:text-sm text-white/80 whitespace-pre-wrap font-sans leading-relaxed max-h-56 overflow-y-auto pr-1">
                      {note.content || (
                        <span className="text-white/30 italic">(Sem texto adicional)</span>
                      )}
                    </div>
                  </div>

                  {/* Rodapé do Card Preenchido */}
                  <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                    {/* Contador de caracteres */}
                    <span className="font-mono text-[10px] text-white/40">
                      {note.content.length} / 1000 caracteres
                    </span>

                    {/* Botões de Ação */}
                    <div className="flex items-center gap-2">
                      {/* Copiar */}
                      <button
                        onClick={() => handleCopyNote(slotNum, `${note.title ? `${note.title}\n\n` : ''}${note.content}`)}
                        className="p-1.5 bg-[#1A1A1A] hover:bg-[#252525] border border-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
                        title="Copiar nota para área de transferência"
                      >
                        {copiedSlot === slotNum ? (
                          <Check className="w-3.5 h-3.5 text-[#C6FF00]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Editar */}
                      <button
                        onClick={() => handleOpenEdit(slotNum)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-[#C6FF00] hover:text-black border border-white/15 hover:border-[#C6FF00] font-mono text-xs font-semibold text-white transition-all cursor-pointer"
                        title="Editar conteúdo da nota"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>EDITAR</span>
                      </button>

                      {/* Excluir / Limpar Slot */}
                      {confirmDeleteSlot === slotNum ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleConfirmDelete(slotNum)}
                            className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-mono text-[11px] font-bold transition-colors cursor-pointer"
                            title="Confirmar exclusão"
                          >
                            CONFIRMAR?
                          </button>
                          <button
                            onClick={() => setConfirmDeleteSlot(null)}
                            className="px-2 py-1.5 bg-white/10 hover:bg-white/20 text-white font-mono text-[11px] transition-colors cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteSlot(slotNum)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500/5 hover:bg-red-500/15 border border-red-500/20 text-red-400 hover:text-red-300 font-mono text-xs transition-colors cursor-pointer"
                          title="Limpar este slot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">LIMPAR</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            // ==========================================
            // ESTADO 1: VAZIO / DISPONÍVEL
            // ==========================================
            return (
              <div
                key={slotNum}
                onClick={() => handleOpenEdit(slotNum)}
                className="bg-[#101010]/50 border-2 border-dashed border-white/10 hover:border-[#C6FF00]/50 hover:bg-[#141414]/60 transition-all p-6 flex flex-col justify-between cursor-pointer group min-h-[220px]"
              >
                {/* Header do Slot Vazio */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-white/50 group-hover:text-[#C6FF00] transition-colors">
                    SLOT {slotNum}
                  </span>
                  <span className="font-mono text-[10px] text-white/40 bg-white/5 border border-white/10 px-2 py-0.5 uppercase tracking-wider">
                    Disponível
                  </span>
                </div>

                {/* Corpo do Slot Vazio */}
                <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
                  <div className="w-10 h-10 bg-white/5 group-hover:bg-[#C6FF00]/10 border border-white/10 group-hover:border-[#C6FF00]/40 text-white/40 group-hover:text-[#C6FF00] flex items-center justify-center transition-all">
                    <Plus className="w-5 h-5" />
                  </div>
                  <p className="font-mono text-xs text-white/50 group-hover:text-white/80 transition-colors">
                    Nenhuma nota no Slot {slotNum}
                  </p>
                  <p className="text-[11px] text-white/30 font-sans max-w-xs">
                    Clique aqui para adicionar anotações rápidas ou informações operacionais.
                  </p>
                </div>

                {/* Botão de Criação */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEdit(slotNum);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#181818] group-hover:bg-[#C6FF00] group-hover:text-black border border-white/10 group-hover:border-[#C6FF00] font-mono text-xs font-semibold text-white/70 group-hover:font-bold transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>CRIAR NOTA</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =====================================================================
          MODAL DE EDIÇÃO / CRIAÇÃO
          Campos: Título (máx 80), Conteúdo (máx 1000)
          ===================================================================== */}
      {editingSlot !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm select-none">
          <div className="bg-[#111111] border border-white/20 w-full max-w-xl shadow-2xl p-6 relative">
            {/* Fechar */}
            <button
              onClick={handleCloseEdit}
              className="absolute top-4 right-4 text-white/40 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cabeçalho do Modal */}
            <div className="mb-5 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#C6FF00] bg-[#C6FF00]/10 border border-[#C6FF00]/30 px-2 py-0.5">
                  SLOT {editingSlot}
                </span>
                <span className="font-mono text-[11px] text-white/40">
                  {formNoteId ? 'EDITAR NOTA EXISTENTE' : 'NOVA NOTA PESSOAL'}
                </span>
              </div>
              <h2 className="font-mono text-lg font-bold text-white tracking-wide">
                ÁREA DE TRABALHO DE {currentOperatorName.toUpperCase()}
              </h2>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSave} className="space-y-4">
              {/* Campo: Título (máx 80) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-mono text-xs text-white/70 tracking-wider">
                    TÍTULO DA NOTA
                  </label>
                  <span className={`font-mono text-[10px] ${formTitle.length >= 80 ? 'text-amber-400 font-bold' : 'text-white/40'}`}>
                    {formTitle.length} / 80
                  </span>
                </div>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value.slice(0, 80))}
                  placeholder="Ex: Follow-ups urgentes de terça-feira"
                  maxLength={80}
                  className="w-full bg-[#181818] border border-white/15 px-3 py-2.5 font-mono text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C6FF00]"
                  autoFocus
                />
              </div>

              {/* Campo: Conteúdo (máx 1000) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-mono text-xs text-white/70 tracking-wider">
                    CONTEÚDO DA NOTA
                  </label>
                  <span className={`font-mono text-[10px] ${formContent.length >= 1000 ? 'text-amber-400 font-bold' : 'text-white/40'}`}>
                    {formContent.length} / 1000
                  </span>
                </div>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value.slice(0, 1000))}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault();
                      handleSave();
                    }
                  }}
                  rows={8}
                  placeholder="Digite aqui anotações, números de telefone rápidos, lembretes de follow-up, orientações para fechamento..."
                  maxLength={1000}
                  className="w-full bg-[#181818] border border-white/15 p-3 font-sans text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C6FF00] leading-relaxed resize-y"
                />
                <p className="mt-1 font-mono text-[10px] text-white/30 text-right">
                  Pressione Ctrl + Enter para salvar rapidamente
                </p>
              </div>

              {/* Ações do Modal */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  disabled={isSaving}
                  className="px-4 py-2 bg-transparent hover:bg-white/5 border border-white/15 font-mono text-xs text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  CANCELAR
                </button>

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
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
