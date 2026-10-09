import React, { useState, useEffect, useCallback } from 'react';
import {
  FileBarChart,
  Download,
  AlertTriangle,
  RefreshCw,
  Check,
  AlertCircle,
  FileText,
  Calendar,
} from 'lucide-react';
import {
  VultoAuditLogItem,
  VultoOperator,
  fetchVultoAuditLogs,
  fetchVultoOperators,
  formatOperationalData,
  fetchVultoFinance,
  fetchVultoMonthlyExpenses,
  fetchVultoClients,
  fetchVultoTasks,
  fetchVultoSalesScripts,
  fetchVultoInventory,
} from '../../services/vultoCoreService';
import { supabase } from '../../lib/supabase';

export function ReportsView() {
  const [logs, setLogs] = useState<VultoAuditLogItem[]>([]);
  const [operators, setOperators] = useState<VultoOperator[]>([]);
  const [loading, setLoading] = useState(true);

  // Zona de perigo
  const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);
  const [formatConfirmationInput, setFormatConfirmationInput] = useState('');
  const [isFormatting, setIsFormatting] = useState(false);
  const [formatError, setFormatError] = useState<string | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const [ops, logsData] = await Promise.all([
        fetchVultoOperators(),
        fetchVultoAuditLogs(100),
      ]);
      setOperators(ops);
      setLogs(logsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Listener refresh global
  useEffect(() => {
    const handleGlobalRefresh = () => {
      loadLogs();
    };
    window.addEventListener('vulto:refresh', handleGlobalRefresh);
    return () => window.removeEventListener('vulto:refresh', handleGlobalRefresh);
  }, [loadLogs]);

  // Realtime logs
  useEffect(() => {
    const channel = supabase
      .channel('vulto_audit_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vulto_audit_logs' }, () => {
        fetchVultoAuditLogs(100).then((data) => setLogs(data));
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

  // Exportar dados como JSON
  const handleExportDataJSON = async () => {
    try {
      const [fin, exp, cli, tsk, sc, inv, lg] = await Promise.all([
        fetchVultoFinance(),
        fetchVultoMonthlyExpenses(),
        fetchVultoClients(),
        fetchVultoTasks(),
        fetchVultoSalesScripts(),
        fetchVultoInventory(),
        fetchVultoAuditLogs(500),
      ]);

      const exportBundle = {
        exported_at: new Date().toISOString(),
        vulto_finance: fin.data,
        vulto_monthly_expenses: exp.data,
        vulto_clients: cli.data,
        vulto_tasks: tsk.data,
        vulto_sales_scripts: sc.data,
        vulto_inventory: inv.data,
        vulto_audit_logs: lg,
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportBundle, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `vulto_lab_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast('Exportação concluída com sucesso.');
    } catch (e: any) {
      showToast('Falha ao exportar dados.', 'error');
    }
  };

  // Executar formatação de dados operacionais
  const handleExecuteFormat = async () => {
    if (formatConfirmationInput !== 'FORMATAR') {
      setFormatError('Digite exatamente a palavra FORMATAR para confirmar.');
      return;
    }

    setIsFormatting(true);
    setFormatError(null);

    try {
      const res = await formatOperationalData();
      if (res.error) {
        setFormatError(res.error);
      } else {
        setIsFormatModalOpen(false);
        setFormatConfirmationInput('');
        showToast('Dados operacionais formatados com sucesso.');
        loadLogs();
        // Disparar refresh global para limpar todas as views abertas
        window.dispatchEvent(new CustomEvent('vulto:refresh'));
      }
    } catch (err: any) {
      setFormatError(err.message || 'Erro ao processar formatação.');
    } finally {
      setIsFormatting(false);
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
            RELATÓRIOS
          </h1>
          <p className="text-xs text-white/50 font-sans mt-0.5">
            Auditoria de atividades operacionais e backup de registros.
          </p>
        </div>

        <button
          onClick={handleExportDataJSON}
          className="px-4 py-2 bg-[#161616] hover:bg-[#202020] text-white border border-white/10 font-mono text-xs flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-[#C6FF00]" />
          <span>EXPORTAR DADOS (JSON)</span>
        </button>
      </div>

      {/* Histórico de Auditoria */}
      <div className="bg-[#111111] border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
            LOGS DE ATIVIDADE OPERACIONAL
          </h2>
          <span className="text-[10px] font-mono text-white/40">
            Últimas 100 ações
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 bg-[#0E0E0E] text-white/50 text-[10px] uppercase">
                <th className="py-3 px-4">Operador</th>
                <th className="py-3 px-4">Ação</th>
                <th className="py-3 px-4">Módulo</th>
                <th className="py-3 px-4">Detalhes</th>
                <th className="py-3 px-4 text-right">Data / Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-white/40">
                    Carregando histórico...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-white/40">
                    Nenhuma ação registrada ainda.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-bold text-[#C6FF00]">
                      {getOperatorName(log.operator_id)}
                    </td>
                    <td className="py-3 px-4 font-bold text-white">
                      {log.action}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-[10px] text-white/70">
                        {log.entity_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white/60">
                      {log.details || '-'}
                    </td>
                    <td className="py-3 px-4 text-right text-white/50 text-[11px]">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ZONA DE PERIGO */}
      <div className="bg-[#111111] border border-rose-900/30 p-6 space-y-4">
        <div className="flex items-center gap-2 text-rose-400">
          <AlertTriangle className="w-5 h-5" />
          <h2 className="font-mono text-sm font-bold tracking-wider uppercase text-white">
            ZONA DE PERIGO
          </h2>
        </div>

        <p className="text-xs font-sans text-white/70 leading-relaxed max-w-2xl">
          A formatação apaga todas as movimentações financeiras, despesas fixas, clientes, tarefas, scripts de venda, inventário e registros de auditoria. Usuários de autenticação, operadores cadastrados e o site público não são afetados.
        </p>

        <button
          onClick={() => {
            setFormatConfirmationInput('');
            setFormatError(null);
            setIsFormatModalOpen(true);
          }}
          className="px-4 py-2.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800 text-rose-300 font-mono text-xs font-bold tracking-wider transition-colors cursor-pointer"
        >
          FORMATAR DADOS OPERACIONAIS
        </button>
      </div>

      {/* MODAL: FORMATAÇÃO DE DADOS */}
      {isFormatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-[#111111] border border-rose-600/60 w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-mono text-sm font-bold uppercase text-white">
                Atenção: Ação Irreversível
              </h3>
            </div>

            <p className="text-xs font-mono text-white/80 leading-relaxed">
              Serão excluídos definitivamente os dados de:
              <br />• Financeiro
              <br />• Gastos Mensais
              <br />• Clientes
              <br />• Tarefas
              <br />• Scripts de Venda
              <br />• Estoque NFC
              <br />• Logs de Auditoria
            </p>

            <p className="text-xs font-mono text-rose-300">
              Para prosseguir, digite exatamente <strong className="text-white underline">FORMATAR</strong> abaixo:
            </p>

            {formatError && (
              <div className="p-2 bg-rose-950/60 border border-rose-500 text-rose-200 text-xs font-mono">
                {formatError}
              </div>
            )}

            <input
              type="text"
              value={formatConfirmationInput}
              onChange={(e) => setFormatConfirmationInput(e.target.value)}
              placeholder="Digite FORMATAR"
              className="w-full bg-[#161616] border border-rose-600/50 px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-rose-400"
            />

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsFormatModalOpen(false)}
                disabled={isFormatting}
                className="px-3.5 py-1.5 bg-white/5 text-white/70 hover:text-white font-mono text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteFormat}
                disabled={isFormatting || formatConfirmationInput !== 'FORMATAR'}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-mono text-xs font-bold tracking-wider cursor-pointer transition-colors"
              >
                {isFormatting ? 'Formatando...' : 'Confirmar Formatação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
