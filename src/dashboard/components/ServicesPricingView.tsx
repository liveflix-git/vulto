import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileText,
  Plus,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  Copy,
  Check,
  Trash2,
  Edit2,
  Calendar,
  User,
  Tag,
  AlertCircle,
  CopyPlus,
  Layers,
  Sparkles,
  X,
} from 'lucide-react';
import {
  ServiceNoteItem,
  fetchServiceNotes,
  createServiceNote,
  updateServiceNote,
  deleteServiceNote,
} from '../../services/serviceNotesService';
import { formatCurrencyBRL } from '../../services/dashboardService';

const SUGGESTED_CATEGORIES = [
  'Paid Media',
  'Sites & Sistemas',
  'Copywriting',
  'VULTO TAP',
  'Inteligência Artificial',
  'Processo Interno',
  'Script Comercial',
  'Geral',
];

export function ServicesPricingView() {
  const [notes, setNotes] = useState<ServiceNoteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState<'idle' | 'updating' | 'success' | 'error'>('idle');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<ServiceNoteItem | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [serviceCategory, setServiceCategory] = useState('');
  const [valueInput, setValueInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Feedback toast / indicator
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Delete confirmation
  const [noteToDelete, setNoteToDelete] = useState<ServiceNoteItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Carregar anotações
  const loadNotes = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
      setRefreshStatus('updating');
    } else {
      setIsLoading(true);
    }

    try {
      const data = await fetchServiceNotes();
      setNotes(data);
      if (isManualRefresh) {
        setRefreshStatus('success');
        setTimeout(() => setRefreshStatus('idle'), 2000);
      }
    } catch (err) {
      console.error('Erro ao carregar notas:', err);
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
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    const handleGlobalRefresh = () => {
      loadNotes(true);
    };
    window.addEventListener('vulto:refresh', handleGlobalRefresh);
    return () => window.removeEventListener('vulto:refresh', handleGlobalRefresh);
  }, [loadNotes]);

  // Abertura do formulário
  const handleOpenNewNote = () => {
    setEditingNote(null);
    setTitle('');
    setContent('');
    setServiceCategory('');
    setValueInput('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (note: ServiceNoteItem) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setServiceCategory(note.service_category || '');
    setValueInput(note.value !== null && note.value !== undefined ? String(note.value) : '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDuplicate = async (note: ServiceNoteItem) => {
    try {
      const payload = {
        title: `${note.title} (Cópia)`,
        content: note.content,
        service_category: note.service_category,
        value: note.value,
        author_name: 'Felipe',
      };
      const res = await createServiceNote(payload);
      if (res.error) {
        showToast('Erro ao duplicar registro: ' + res.error, 'error');
      } else if (res.data) {
        setNotes((prev) => [res.data!, ...prev]);
        showToast('SALVO');
      }
    } catch (e: any) {
      showToast('Falha ao duplicar registro', 'error');
    }
  };

  const handleCopyContent = (note: ServiceNoteItem) => {
    const textToCopy = `${note.title}\n${note.service_category ? `[${note.service_category}]\n` : ''}${
      note.value ? `Valor sugerido: R$ ${note.value.toLocaleString('pt-BR')}\n` : ''
    }\n${note.content}`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedId(note.id);
    showToast('Conteúdo copiado para a área de transferência!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Salvar criação ou edição
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Informe o título do registro.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const parsedValue = valueInput.trim() === '' ? null : parseFloat(valueInput.replace(',', '.'));
    const cleanCategory = serviceCategory.trim() || null;

    try {
      if (editingNote) {
        // Atualizar
        const res = await updateServiceNote(editingNote.id, {
          title: title.trim(),
          content: content.trim(),
          service_category: cleanCategory,
          value: parsedValue,
        });

        if (res.error) {
          setFormError('Erro ao salvar no Supabase: ' + res.error);
          setIsSubmitting(false);
          return;
        }

        // Atualização imediata na UI
        const now = new Date().toISOString();
        setNotes((prev) =>
          prev.map((n) =>
            n.id === editingNote.id
              ? {
                  ...n,
                  title: title.trim(),
                  content: content.trim(),
                  service_category: cleanCategory,
                  value: parsedValue,
                  updated_at: now,
                }
              : n
          )
        );
        setIsModalOpen(false);
        showToast('SALVO');
      } else {
        // Criar novo
        const res = await createServiceNote({
          title: title.trim(),
          content: content.trim(),
          service_category: cleanCategory,
          value: parsedValue,
          author_name: 'Felipe',
        });

        if (res.error) {
          setFormError('Erro ao salvar no Supabase: ' + res.error);
          setIsSubmitting(false);
          return;
        }

        if (res.data) {
          setNotes((prev) => [res.data!, ...prev]);
        }
        setIsModalOpen(false);
        showToast('SALVO');
      }
    } catch (err: any) {
      setFormError('Erro inesperado: ' + (err.message || 'Falha ao processar'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirmar exclusão real no Supabase
  const handleConfirmDelete = async () => {
    if (!noteToDelete) return;
    setIsDeleting(true);

    try {
      const res = await deleteServiceNote(noteToDelete.id);
      if (res.error) {
        showToast('Não foi possível excluir o registro: ' + res.error, 'error');
      } else {
        // Remover imediatamente da interface
        setNotes((prev) => prev.filter((n) => n.id !== noteToDelete.id));
        showToast('Registro excluído.');
        setNoteToDelete(null);
      }
    } catch (err: any) {
      showToast('Não foi possível excluir o registro.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtragem dos registros
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      if (categoryFilter !== 'ALL' && n.service_category !== categoryFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchTitle = n.title.toLowerCase().includes(q);
        const matchContent = n.content.toLowerCase().includes(q);
        const matchCat = (n.service_category || '').toLowerCase().includes(q);
        return matchTitle || matchContent || matchCat;
      }
      return true;
    });
  }, [notes, categoryFilter, searchTerm]);

  // Lista de categorias disponíveis
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => {
      if (n.service_category) set.add(n.service_category);
    });
    return Array.from(set);
  }, [notes]);

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
              // BASE EDITÁVEL DE CONHECIMENTO & SCRIPTS
            </span>
            <span className="text-white/20">•</span>
            <span className="text-[10px] font-mono text-white/50">
              SUPABASE SERVICE_NOTES
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono text-white">
            SERVIÇOS & PREÇOS
          </h1>
          <p className="text-xs text-white/60 font-sans mt-0.5">
            Anotações comerciais, scripts e referências internas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Botão Atualizar */}
          <button
            onClick={() => loadNotes(true)}
            disabled={isRefreshing}
            className="px-3.5 py-2.5 bg-[#161616] hover:bg-[#202020] border border-white/10 text-white/80 hover:text-white font-mono text-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            title="Recarregar anotações do Supabase"
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

          {/* Botão Novo Registro */}
          <button
            onClick={handleOpenNewNote}
            className="px-4 py-2.5 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-mono font-bold text-xs tracking-wider flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ NOVO REGISTRO</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-[#111111] border border-white/10 p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por título, conteúdo ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#161616] border border-white/10 pl-9 pr-3 py-2 text-xs text-white placeholder-white/30 font-mono focus:border-[#C6FF00] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-white/40 shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#161616] border border-white/10 px-3 py-2 text-xs font-mono text-white focus:border-[#C6FF00] focus:outline-none cursor-pointer"
          >
            <option value="ALL">Todas as Categorias</option>
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
            {SUGGESTED_CATEGORIES.filter((c) => !availableCategories.includes(c)).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de Cards de Anotações */}
      {isLoading ? (
        <div className="bg-[#111111] border border-white/10 p-12 text-center flex flex-col items-center justify-center">
          <RefreshCw className="w-6 h-6 text-[#C6FF00] animate-spin mb-3" />
          <span className="font-mono text-xs text-white/50">Carregando anotações do Supabase...</span>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="bg-[#111111] border border-white/10 p-12 text-center space-y-4">
          <div className="w-12 h-12 bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-white/30">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-mono text-sm font-bold text-white">
              Nenhuma anotação cadastrada
            </h3>
            <p className="text-xs text-white/50 max-w-md mx-auto font-sans">
              Utilize esta área para criar scripts comerciais, argumentos de vendas, notas de processos internos ou valores sugeridos de serviços.
            </p>
          </div>
          <button
            onClick={handleOpenNewNote}
            className="px-4 py-2 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-mono font-bold text-xs tracking-wider inline-flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ NOVO REGISTRO</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => {
            const hasValue = note.value !== null && note.value !== undefined && !isNaN(note.value);
            const isJustCopied = copiedId === note.id;

            return (
              <div
                key={note.id}
                className="bg-[#111111] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between p-4 group"
              >
                {/* Top Info */}
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1 min-w-0">
                      {note.service_category && (
                        <span className="inline-block text-[10px] font-mono px-2 py-0.5 bg-white/5 border border-white/10 text-white/60 uppercase">
                          {note.service_category}
                        </span>
                      )}
                      <h3 className="font-mono text-sm font-bold text-white line-clamp-2 group-hover:text-[#C6FF00] transition-colors">
                        {note.title}
                      </h3>
                    </div>

                    {/* Valor opcional: somente se preenchido */}
                    {hasValue && (
                      <div className="text-right shrink-0 bg-[#161616] px-2.5 py-1 border border-[#C6FF00]/30">
                        <div className="text-[9px] font-mono text-white/40 uppercase">Referência</div>
                        <div className="text-xs font-bold font-mono text-[#C6FF00]">
                          {formatCurrencyBRL(note.value!)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Prévia do conteúdo */}
                  <p className="text-xs text-white/70 font-sans whitespace-pre-wrap line-clamp-4 leading-relaxed bg-[#0E0E0E] p-3 border border-white/5">
                    {note.content || <span className="italic text-white/30">Sem conteúdo textual.</span>}
                  </p>
                </div>

                {/* Footer Info & Actions */}
                <div className="mt-4 pt-3 border-t border-white/10 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-white/40">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-white/30" />
                      {note.author_name || 'Felipe'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-white/30" />
                      {new Date(note.updated_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  {/* Actions bar */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    <button
                      onClick={() => handleCopyContent(note)}
                      className="px-2 py-1.5 bg-[#181818] hover:bg-[#222222] border border-white/10 text-[10px] font-mono text-white/80 hover:text-white flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title="Copiar texto para área de transferência"
                    >
                      {isJustCopied ? (
                        <>
                          <Check className="w-3 h-3 text-[#C6FF00]" />
                          <span className="text-[#C6FF00]">COPIADO</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>COPIAR</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleOpenEdit(note)}
                      className="px-2 py-1.5 bg-[#181818] hover:bg-[#222222] border border-white/10 text-[10px] font-mono text-white/80 hover:text-[#C6FF00] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title="Editar registro"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>EDITAR</span>
                    </button>

                    <button
                      onClick={() => handleDuplicate(note)}
                      className="px-2 py-1.5 bg-[#181818] hover:bg-[#222222] border border-white/10 text-[10px] font-mono text-white/80 hover:text-white flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title="Duplicar anotação"
                    >
                      <CopyPlus className="w-3 h-3" />
                      <span>DUPLICAR</span>
                    </button>

                    <button
                      onClick={() => setNoteToDelete(note)}
                      className="px-2 py-1.5 bg-rose-950/20 hover:bg-rose-950/50 border border-rose-800/30 text-[10px] font-mono text-rose-400 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title="Excluir do Supabase"
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

      {/* MODAL: CRIAR / EDITAR ANOTAÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#111111] border border-white/20 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-[#C6FF00] uppercase">
                  {editingNote ? '// EDITAR REGISTRO' : '// NOVA ANOTAÇÃO'}
                </span>
                <h2 className="text-base font-mono font-bold text-white">
                  {editingNote ? 'Atualizar Anotação & Script' : 'Cadastrar Nova Anotação / Referência'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/40 hover:text-white p-1 cursor-pointer font-mono"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Título */}
              <div>
                <label className="block text-xs font-mono text-white/70 mb-1">
                  Título da Anotação *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Script de Fechamento Paid Media para Clínicas"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-xs font-mono text-white focus:border-[#C6FF00] focus:outline-none"
                />
              </div>

              {/* Categoria / Serviço e Valor Opcional */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-white/70 mb-1">
                    Categoria / Serviço (Opcional)
                  </label>
                  <input
                    type="text"
                    list="cat-suggestions"
                    placeholder="Ex: Paid Media, Copywriting..."
                    value={serviceCategory}
                    onChange={(e) => setServiceCategory(e.target.value)}
                    className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-xs font-mono text-white focus:border-[#C6FF00] focus:outline-none"
                  />
                  <datalist id="cat-suggestions">
                    {SUGGESTED_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-mono text-white/70 mb-1">
                    Valor Sugerido (R$) (Opcional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Deixe em branco se não houver"
                    value={valueInput}
                    onChange={(e) => setValueInput(e.target.value)}
                    className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-xs font-mono text-white focus:border-[#C6FF00] focus:outline-none"
                  />
                </div>
              </div>

              {/* Conteúdo Livre */}
              <div>
                <label className="block text-xs font-mono text-white/70 mb-1">
                  Conteúdo / Anotação Livre
                </label>
                <textarea
                  rows={8}
                  placeholder="Escreva argumentos, roteiro de ligação, template WhatsApp, objeções frequentes, regras de entrega..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 p-3 text-xs font-mono text-white focus:border-[#C6FF00] focus:outline-none leading-relaxed"
                />
              </div>

              {/* Botoes de Acao */}
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
                  disabled={isSubmitting || !title.trim()}
                  className="px-5 py-2 bg-[#C6FF00] hover:bg-[#b0e600] disabled:opacity-40 text-[#0A0A0A] font-mono font-bold text-xs tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>SALVANDO...</span>
                    </>
                  ) : (
                    <span>SALVAR REGISTRO</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {noteToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#111111] border border-rose-500/40 w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
                Confirmar Exclusão
              </h3>
            </div>

            <p className="text-xs font-mono text-white/70 leading-relaxed">
              Tem certeza que deseja excluir o registro{' '}
              <strong className="text-white">"{noteToDelete.title}"</strong>?
              Esta operação removerá o item permanentemente do Supabase.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setNoteToDelete(null)}
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
