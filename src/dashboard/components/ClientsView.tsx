import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Plus,
  Trash2,
  AlertCircle,
  Check,
  X,
  Layers,
} from 'lucide-react';
import {
  VultoClientItem,
  VultoClientServiceType,
  VultoOperator,
  fetchVultoClients,
  createVultoClient,
  deleteVultoClient,
  fetchVultoOperators,
} from '../../services/vultoCoreService';
import { supabase } from '../../lib/supabase';

const SERVICE_OPTIONS: { value: VultoClientServiceType; label: string }[] = [
  { value: 'trafego_pago', label: 'Tráfego Pago' },
  { value: 'vulto_nfc', label: 'VULTO NFC' },
  { value: 'site', label: 'Site' },
];

export function ClientsView() {
  const [clients, setClients] = useState<VultoClientItem[]>([]);
  const [operators, setOperators] = useState<VultoOperator[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Novo Cliente
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [serviceType, setServiceType] = useState<VultoClientServiceType>('trafego_pago');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Modal Exclusão
  const [clientToDelete, setClientToDelete] = useState<VultoClientItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast Feedback
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
        fetchVultoClients(),
      ]);
      setOperators(ops);
      setClients(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listener para refresh global
  useEffect(() => {
    const handleGlobalRefresh = () => {
      loadData();
    };
    window.addEventListener('vulto:refresh', handleGlobalRefresh);
    return () => window.removeEventListener('vulto:refresh', handleGlobalRefresh);
  }, [loadData]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('vulto_clients_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vulto_clients' }, () => {
        fetchVultoClients().then((res) => setClients(res.data));
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

  const getServiceLabel = (type: VultoClientServiceType) => {
    const match = SERVICE_OPTIONS.find((s) => s.value === type);
    return match ? match.label : type;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      setFormError('Informe o nome do cliente.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await createVultoClient({
        name: clientName.trim(),
        service_type: serviceType,
      });

      if (res.error) {
        setFormError(res.error);
      } else if (res.data) {
        setClients((prev) => [res.data!, ...prev]);
        setIsModalOpen(false);
        setClientName('');
        setServiceType('trafego_pago');
        showToast('Cliente adicionado com sucesso.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Erro inesperado ao cadastrar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Exclusão prioritária com verificação estrita
  const handleConfirmDelete = async () => {
    if (!clientToDelete) return;
    setIsDeleting(true);

    try {
      const res = await deleteVultoClient(clientToDelete.id);
      if (res.error) {
        // Se houver erro, NÃO esconde e mostra erro claro
        showToast(`Não foi possível excluir o cliente: ${res.error}`, 'error');
      } else {
        // Sucesso: remove imediatamente do estado local
        setClients((prev) => prev.filter((c) => c.id !== clientToDelete.id));
        showToast('Cliente excluído com sucesso.');
        setClientToDelete(null);
      }
    } catch (e: any) {
      showToast('Não foi possível excluir o cliente.', 'error');
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
            CLIENTES
          </h1>
          <p className="text-xs text-white/50 font-sans mt-0.5">
            Cadastro direto de contas ativas e contratos da VULTO LAB.
          </p>
        </div>

        <button
          onClick={() => {
            setClientName('');
            setServiceType('trafego_pago');
            setFormError(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-mono font-bold text-xs tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ ADICIONAR CLIENTE</span>
        </button>
      </div>

      {/* Tabela de Clientes */}
      <div className="bg-[#111111] border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 bg-[#0E0E0E] text-white/50 text-[10px] uppercase">
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Serviço</th>
                <th className="py-3 px-4">Adicionado por</th>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-white/40">
                    Carregando clientes...
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-white/40">
                    Nenhum cliente cadastrado.
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-bold text-white">{client.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-white/80 text-[10px]">
                        {getServiceLabel(client.service_type)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white/70">
                      {getOperatorName(client.operator_id)}
                    </td>
                    <td className="py-3 px-4 text-white/50">
                      {new Date(client.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setClientToDelete(client)}
                        className="p-1.5 bg-rose-950/20 hover:bg-rose-950/50 text-rose-400 border border-rose-800/30 transition-colors cursor-pointer"
                        title="Excluir cliente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADICIONAR CLIENTE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#111111] border border-white/20 w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-mono text-sm font-bold text-white">
                Adicionar Cliente
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
                <label className="block text-white/60 mb-1">Nome do Cliente *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Omni Tech Solutions"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00]"
                />
              </div>

              <div>
                <label className="block text-white/60 mb-1">Tipo de Serviço *</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value as VultoClientServiceType)}
                  className="w-full bg-[#161616] border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00] cursor-pointer"
                >
                  {SERVICE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
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
      {clientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#111111] border border-rose-500/40 w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <h3 className="font-mono text-sm font-bold text-white uppercase">
              Confirmar Exclusão
            </h3>
            <p className="text-xs font-mono text-white/70">
              Tem certeza que deseja excluir o cliente "{clientToDelete.name}"? Esta ação executará a remoção definitiva no banco.
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
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
