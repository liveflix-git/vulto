import React, { useState, useEffect } from 'react';
import { User, ShieldCheck, Check } from 'lucide-react';
import { VultoOperator, fetchVultoOperators } from '../../services/vultoCoreService';

interface OperatorSelectModalProps {
  onSelect: (operator: VultoOperator) => void;
  isChangeMode?: boolean;
  onClose?: () => void;
}

export function OperatorSelectModal({ onSelect, isChangeMode = false, onClose }: OperatorSelectModalProps) {
  const [operators, setOperators] = useState<VultoOperator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchVultoOperators().then((data) => {
      if (mounted) {
        setOperators(data);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-[#111111] border border-white/20 w-full max-w-sm p-6 shadow-2xl relative select-none">
        {isChangeMode && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/40 hover:text-white font-mono text-sm cursor-pointer"
          >
            ✕
          </button>
        )}

        <div className="text-center space-y-2 mb-6">
          <div className="w-10 h-10 mx-auto bg-[#C6FF00]/10 border border-[#C6FF00]/30 text-[#C6FF00] flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold font-mono text-white tracking-wider">
            {isChangeMode ? 'TROCAR OPERADOR' : 'QUEM ESTÁ USANDO O PAINEL?'}
          </h2>
          <p className="text-xs text-white/50 font-sans">
            Selecione seu perfil para associar as movimentações e registros.
          </p>
        </div>

        {loading ? (
          <div className="py-6 text-center font-mono text-xs text-white/40">
            Carregando operadores...
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {operators.map((op) => (
              <button
                key={op.id}
                onClick={() => onSelect(op)}
                className="p-4 bg-[#161616] hover:bg-[#1E1E1E] border border-white/10 hover:border-[#C6FF00] text-center flex flex-col items-center justify-center gap-2 group transition-all cursor-pointer"
              >
                <div className="w-9 h-9 bg-white/5 group-hover:bg-[#C6FF00]/20 border border-white/10 group-hover:border-[#C6FF00] text-white group-hover:text-[#C6FF00] font-mono font-bold text-sm flex items-center justify-center transition-colors">
                  {op.name.charAt(0)}
                </div>
                <span className="font-mono text-sm font-bold text-white group-hover:text-[#C6FF00] transition-colors">
                  {op.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
