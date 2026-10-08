import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, ArrowUpRight, RotateCcw, MessageSquare } from 'lucide-react';
import {
  chatOptions,
  ChatOption,
  ChatActionButton,
  getWhatsAppLink,
} from '../data/siteData';

interface VultoChatProps {
  onNavigate: (path: string) => void;
}

interface ConversationMessage {
  id: string;
  sender: 'assistant' | 'user';
  text: string;
  actions?: ChatActionButton[];
}

export const VultoChat: React.FC<VultoChatProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<ConversationMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, isOpen]);

  const handleSelectOption = (option: ChatOption) => {
    const userMsg: ConversationMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: option.question,
    };

    const assistantMsg: ConversationMessage = {
      id: `assistant-${Date.now() + 1}`,
      sender: 'assistant',
      text: option.answer,
      actions: option.actions,
    };

    setHistory((prev) => [...prev, userMsg, assistantMsg]);
  };

  const handleActionClick = (action: ChatActionButton) => {
    if (action.type === 'whatsapp') {
      window.open(getWhatsAppLink(), '_blank', 'noopener,noreferrer');
      return;
    }

    if (action.type === 'route' && action.target) {
      setIsOpen(false);
      onNavigate(action.target);
      return;
    }

    if (action.type === 'scroll-contact') {
      setIsOpen(false);
      const contactEl = document.getElementById('contato');
      if (contactEl) {
        contactEl.scrollIntoView({ behavior: 'smooth' });
      } else {
        onNavigate('/contato');
      }
      return;
    }

    if (action.type === 'reset') {
      setHistory([]);
    }
  };

  const handleResetChat = () => {
    setHistory([]);
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end">
      {/* Pop-up do Chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-label="VULTO ASSIST"
            className="mb-3 w-[calc(100vw-2rem)] sm:w-[380px] max-h-[76vh] bg-[#0A0A0A] border border-[#F4F4F1]/20 shadow-[0_24px_60px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden"
          >
            {/* Header do Chat */}
            <div className="px-4 py-3.5 bg-[#1A1A1A] border-b border-[#F4F4F1]/12 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C6FF00]" />
                <div>
                  <span className="font-display font-bold text-xs uppercase tracking-[0.14em] text-[#F4F4F1] block">
                    VULTO ASSIST
                  </span>
                  <span className="font-mono-tabular text-[10px] text-[#F4F4F1]/50 block">
                    ATENDIMENTO GUIADO · VULTO LAB
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={handleResetChat}
                    title="Reiniciar conversa"
                    aria-label="Reiniciar conversa"
                    className="w-8 h-8 inline-flex items-center justify-center text-[#F4F4F1]/60 hover:text-[#C6FF00] transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Fechar assistente"
                  className="w-8 h-8 inline-flex items-center justify-center text-[#F4F4F1]/60 hover:text-[#F4F4F1] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Corpo do Chat */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1 max-h-[54vh]">
              <div className="bg-[#1A1A1A] border border-[#F4F4F1]/10 p-3.5 text-sm text-[#F4F4F1]/90 leading-relaxed space-y-1">
                <p className="font-semibold text-[#F4F4F1]">Olá.</p>
                <p>Como podemos ajudar?</p>
              </div>

              {history.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[90%] p-3.5 text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                      msg.sender === 'user'
                        ? 'bg-[#C6FF00] text-[#0A0A0A] font-semibold'
                        : 'bg-[#1A1A1A] border border-[#F4F4F1]/12 text-[#F4F4F1]/90'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-2 w-full">
                      {msg.actions.map((act) => (
                        <button
                          key={act.label}
                          type="button"
                          onClick={() => handleActionClick(act)}
                          className={`px-3.5 py-2 text-[11px] font-mono-tabular uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                            act.primary
                              ? 'bg-[#C6FF00] text-[#0A0A0A] font-bold hover:bg-[#d4ff33]'
                              : 'border border-[#F4F4F1]/25 bg-[#0A0A0A] text-[#F4F4F1] hover:border-[#C6FF00] hover:text-[#C6FF00]'
                          }`}
                        >
                          <span>{act.label}</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <div className="pt-2">
                <p className="font-mono-tabular text-[10px] uppercase tracking-[0.16em] text-[#F4F4F1]/45 mb-2.5">
                  SELECIONE UMA OPÇÃO:
                </p>
                <div className="flex flex-col gap-1.5">
                  {chatOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectOption(opt)}
                      className="text-left px-3.5 py-2.5 border border-[#F4F4F1]/12 bg-[#0A0A0A] hover:bg-[#1A1A1A] hover:border-[#C6FF00]/60 text-xs text-[#F4F4F1]/85 hover:text-[#F4F4F1] transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <span>{opt.question}</span>
                      <span className="text-[#C6FF00] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                        →
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div ref={messagesEndRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botão Flutuante EXCLUSIVAMENTE Circular (56px x 56px / 64px x 64px) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Fechar chat VULTO ASSIST' : 'Abrir chat VULTO ASSIST'}
        className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#0A0A0A] border border-[#C6FF00] text-[#C6FF00] hover:scale-105 shadow-[0_0_20px_rgba(198,255,0,0.18)] hover:shadow-[0_0_28px_rgba(198,255,0,0.3)] transition-all duration-250 flex items-center justify-center cursor-pointer group shrink-0"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-[#F4F4F1] transition-transform duration-200" />
        ) : (
          <MessageSquare className="w-6 h-6 text-[#C6FF00] transition-transform duration-200 group-hover:scale-110" />
        )}

        {/* Ponto verde de disponibilidade */}
        <span className="absolute top-1 right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C6FF00] opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#C6FF00]" />
        </span>
      </button>
    </div>
  );
};
