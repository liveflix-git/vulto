import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CreditCard,
  Plus,
  Package,
  Layers,
  TrendingUp,
  Cpu,
  Truck,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
  Edit2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Clock,
  Sparkles,
  Info,
  Box,
  Eye,
  Sliders,
  Check,
} from 'lucide-react';
import {
  VultoTapOrder,
  VultoTapModel,
  InventoryItem,
  InventoryMovement,
  VultoTapOrderStatus,
  fetchVultoTapOrders,
  fetchVultoTapModels,
  fetchInventoryItems,
  fetchInventoryMovements,
  createVultoTapOrder,
  updateVultoTapOrderStatus,
  updateVultoTapOrder,
  deleteVultoTapOrder,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  createVultoTapModel,
  updateVultoTapModel,
  deleteVultoTapModel,
  recordInventoryMovement,
  calculateVultoTapMetrics,
} from '../../services/vultoTapService';
import { fetchClients, ClientEntity, ProfileUser, fetchProfiles } from '../../services/crmService';
import { isSupabaseConfigured } from '../../lib/supabase';

type SubTab = 'overview' | 'orders' | 'kanban' | 'inventory' | 'costs' | 'models';

const KANBAN_STAGES: { id: VultoTapOrderStatus; label: string; color: string; desc: string }[] = [
  { id: 'new', label: 'NOVO', color: 'border-blue-500/50 text-blue-400', desc: 'Pedido recebido' },
  { id: 'design', label: 'DESIGN', color: 'border-purple-500/50 text-purple-400', desc: 'Arte e aprovação' },
  { id: 'production', label: 'PRODUÇÃO', color: 'border-amber-500/50 text-amber-400', desc: 'Gravação laser/corte' },
  { id: 'configuration', label: 'CONFIGURAÇÃO', color: 'border-cyan-500/50 text-cyan-400', desc: 'Gravação NFC & URL' },
  { id: 'ready', label: 'PRONTO', color: 'border-emerald-500/50 text-emerald-400', desc: 'Embalado para envio' },
  { id: 'delivered', label: 'ENTREGUE', color: 'border-[#C6FF00]/50 text-[#C6FF00]', desc: 'Entregue ao cliente' },
];

export function VultoTapViewReal() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('overview');
  const [orders, setOrders] = useState<VultoTapOrder[]>([]);
  const [models, setModels] = useState<VultoTapModel[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [clients, setClients] = useState<ClientEntity[]>([]);
  const [profiles, setProfiles] = useState<ProfileUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [orderToDeduct, setOrderToDeduct] = useState<VultoTapOrder | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'order' | 'item' | 'model';
    id: string;
    name: string;
  } | null>(null);

  // Form states
  const [orderForm, setOrderForm] = useState({
    customer_name: '',
    client_id: '',
    model_id: '',
    quantity: 1,
    unit_price: 89,
    unit_cost: 18,
    destination_type: 'url',
    destination_url: '',
    order_date: new Date().toISOString().split('T')[0],
    delivery_date: '',
    notes: '',
    responsible_user_id: '',
    syncSale: true,
  });

  const [stockMovementForm, setStockMovementForm] = useState({
    itemId: '',
    type: 'in' as 'in' | 'out' | 'adjustment',
    quantity: 10,
    cost_per_unit: 0,
    notes: '',
    syncExpense: true,
  });

  const [itemForm, setItemForm] = useState({
    name: '',
    sku: '',
    category: 'Cartões Brutos',
    unit: 'un',
    quantity: 20,
    min_quantity: 10,
    cost_per_unit: 10,
    location: 'Estoque Central',
    notes: '',
  });

  const [modelForm, setModelForm] = useState({
    name: '',
    description: '',
    material: '',
    base_price: 99,
    base_cost: 20,
    active: true,
  });

  // Load all data
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [ordersData, modelsData, invData, movData, clientsData, profilesData] =
        await Promise.all([
          fetchVultoTapOrders(),
          fetchVultoTapModels(),
          fetchInventoryItems(),
          fetchInventoryMovements(),
          fetchClients(),
          fetchProfiles(),
        ]);

      setOrders(ordersData);
      setModels(modelsData);
      setInventory(invData);
      setMovements(movData);
      setClients(clientsData);
      setProfiles(profilesData);
    } catch (err: any) {
      console.error('Erro ao carregar dados Vulto Tap:', err);
      showFeedback('error', 'Falha ao sincronizar dados com o Supabase');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  // Metrics calculation
  const metrics = useMemo(() => calculateVultoTapMetrics(orders), [orders]);

  // Low stock items
  const lowStockItems = useMemo(
    () => inventory.filter((item) => item.quantity <= item.min_quantity),
    [inventory]
  );

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.client_name && o.client_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (o.destination_url && o.destination_url.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (o.notes && o.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  // Handle stage change with prompt for inventory deduction
  const handleStageChange = async (order: VultoTapOrder, newStatus: VultoTapOrderStatus) => {
    if (order.status === newStatus) return;

    // Se mudou para PRONTO ou ENTREGUE e ainda não foi dada baixa, abrir modal de confirmação de baixa
    if ((newStatus === 'ready' || newStatus === 'delivered') && order.status !== 'ready' && order.status !== 'delivered') {
      setOrderToDeduct(order);
    }

    const { success, error } = await updateVultoTapOrderStatus(order.id, newStatus, order.customer_name);
    if (!success) {
      showFeedback('error', error || 'Erro ao atualizar etapa do pedido');
      return;
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o))
    );
    showFeedback('success', `Pedido "${order.customer_name}" movido para ${newStatus.toUpperCase()}`);
  };

  // Create order submit
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderForm.customer_name.trim()) {
      showFeedback('error', 'Informe o nome do cliente ou empresa');
      return;
    }

    const selectedModel = models.find((m) => m.id === orderForm.model_id);

    const { data, error } = await createVultoTapOrder({
      customer_name: orderForm.customer_name,
      client_id: orderForm.client_id || null,
      model_id: orderForm.model_id || null,
      model_name: selectedModel?.name || 'Modelo NFC',
      quantity: Number(orderForm.quantity) || 1,
      unit_price: Number(orderForm.unit_price) || 0,
      unit_cost: Number(orderForm.unit_cost) || 0,
      destination_type: orderForm.destination_type,
      destination_url: orderForm.destination_url || null,
      order_date: orderForm.order_date,
      delivery_date: orderForm.delivery_date || null,
      notes: orderForm.notes || null,
      responsible_user_id: orderForm.responsible_user_id || null,
      syncSale: orderForm.syncSale,
    });

    if (error || !data) {
      showFeedback('error', error || 'Erro ao registrar pedido');
      return;
    }

    setOrders((prev) => [data, ...prev]);
    setIsOrderModalOpen(false);
    showFeedback('success', `Pedido #${data.id.slice(0, 8)} cadastrado com sucesso!`);
    resetOrderForm();
  };

  const resetOrderForm = () => {
    setOrderForm({
      customer_name: '',
      client_id: '',
      model_id: models[0]?.id || '',
      quantity: 1,
      unit_price: models[0]?.base_price || 89,
      unit_cost: models[0]?.base_cost || 18,
      destination_type: 'url',
      destination_url: '',
      order_date: new Date().toISOString().split('T')[0],
      delivery_date: '',
      notes: '',
      responsible_user_id: '',
      syncSale: true,
    });
  };

  // Stock movement submit
  const handleStockMovementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockMovementForm.itemId) {
      showFeedback('error', 'Selecione o item de estoque');
      return;
    }

    const item = inventory.find((i) => i.id === stockMovementForm.itemId);

    const { success, error } = await recordInventoryMovement({
      itemId: stockMovementForm.itemId,
      itemName: item?.name || 'Item',
      type: stockMovementForm.type,
      quantity: Number(stockMovementForm.quantity),
      cost_per_unit: Number(stockMovementForm.cost_per_unit),
      notes: stockMovementForm.notes || undefined,
      syncExpense: stockMovementForm.syncExpense,
    });

    if (!success) {
      showFeedback('error', error || 'Erro ao movimentar estoque');
      return;
    }

    showFeedback('success', `Movimentação registrada com sucesso!`);
    setIsStockModalOpen(false);
    loadAllData();
  };

  // Confirm auto deduction on order delivery
  const handleConfirmOrderDeduction = async (selectedItems: { itemId: string; qty: number }[]) => {
    if (!orderToDeduct) return;

    for (const d of selectedItems) {
      if (d.qty > 0) {
        const item = inventory.find((i) => i.id === d.itemId);
        await recordInventoryMovement({
          itemId: d.itemId,
          itemName: item?.name,
          type: 'out',
          quantity: d.qty,
          reference_order_id: orderToDeduct.id,
          notes: `Baixa automática de insumo pelo pedido #${orderToDeduct.id.slice(0, 8)} (${orderToDeduct.customer_name})`,
        });
      }
    }

    showFeedback('success', `Estoque baixado para o pedido #${orderToDeduct.id.slice(0, 8)}`);
    setOrderToDeduct(null);
    loadAllData();
  };

  // Create Item Submit
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.name.trim()) {
      showFeedback('error', 'Nome do insumo é obrigatório');
      return;
    }

    const { data, error } = await createInventoryItem({
      name: itemForm.name,
      sku: itemForm.sku || null,
      category: itemForm.category,
      unit: itemForm.unit,
      quantity: Number(itemForm.quantity) || 0,
      min_quantity: Number(itemForm.min_quantity) || 0,
      cost_per_unit: Number(itemForm.cost_per_unit) || 0,
      location: itemForm.location || null,
      notes: itemForm.notes || null,
    });

    if (error || !data) {
      showFeedback('error', error || 'Erro ao criar insumo');
      return;
    }

    setInventory((prev) => [...prev, data]);
    setIsItemModalOpen(false);
    showFeedback('success', `Insumo "${data.name}" cadastrado!`);
  };

  // Create Model Submit
  const handleCreateModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelForm.name.trim()) {
      showFeedback('error', 'Nome do modelo é obrigatório');
      return;
    }

    const { data, error } = await createVultoTapModel({
      name: modelForm.name,
      description: modelForm.description || null,
      material: modelForm.material || null,
      base_price: Number(modelForm.base_price) || 0,
      base_cost: Number(modelForm.base_cost) || 0,
      active: modelForm.active,
    });

    if (error || !data) {
      showFeedback('error', error || 'Erro ao criar modelo');
      return;
    }

    setModels((prev) => [...prev, data]);
    setIsModelModalOpen(false);
    showFeedback('success', `Modelo "${data.name}" adicionado com sucesso!`);
  };

  // Delete handler
  const executeDelete = async () => {
    if (!deleteConfirmation) return;

    if (deleteConfirmation.type === 'order') {
      const { success, error } = await deleteVultoTapOrder(deleteConfirmation.id);
      if (success) {
        setOrders((prev) => prev.filter((o) => o.id !== deleteConfirmation.id));
        showFeedback('success', 'Pedido excluído.');
      } else {
        showFeedback('error', error || 'Erro ao excluir pedido');
      }
    } else if (deleteConfirmation.type === 'item') {
      const { success, error } = await deleteInventoryItem(deleteConfirmation.id);
      if (success) {
        setInventory((prev) => prev.filter((i) => i.id !== deleteConfirmation.id));
        showFeedback('success', 'Insumo excluído do estoque.');
      } else {
        showFeedback('error', error || 'Erro ao excluir item');
      }
    } else if (deleteConfirmation.type === 'model') {
      const { success, error } = await deleteVultoTapModel(deleteConfirmation.id);
      if (success) {
        setModels((prev) => prev.filter((m) => m.id !== deleteConfirmation.id));
        showFeedback('success', 'Modelo excluído com sucesso.');
      } else {
        showFeedback('error', error || 'Erro ao excluir modelo');
      }
    }

    setDeleteConfirmation(null);
  };

  return (
    <div className="space-y-6">
      {/* Toast feedback */}
      {feedback && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 border font-mono text-xs flex items-center gap-2 shadow-2xl transition-all ${
            feedback.type === 'success'
              ? 'bg-[#111111] border-[#C6FF00] text-[#C6FF00]'
              : 'bg-[#180A0A] border-rose-500 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-[#C6FF00]" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#111111] border border-white/10 p-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono tracking-widest text-[#C6FF00] uppercase">
              // HARDWARE & NFC ENGINE
            </span>
            <span className="text-white/20">•</span>
            <span className="text-[10px] font-mono text-white/50">
              SUPABASE INTEGRATED
            </span>
            <span className="text-white/20">•</span>
            <span className="text-[10px] font-mono text-emerald-400">
              PHYSICAL PRODUCTION
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono text-white flex items-center gap-2">
            VULTO TAP (Operação Física & NFC)
          </h1>
          <p className="text-xs text-white/60 font-sans mt-1">
            Controle integrado de pedidos de cartões inteligentes, estoque de insumos, custos unitários e rentabilidade.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => loadAllData()}
            disabled={isLoading}
            className="p-2.5 bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Recarregar dados"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">SINCRONIZAR</span>
          </button>

          <button
            onClick={() => {
              if (inventory.length > 0) {
                setStockMovementForm((prev) => ({
                  ...prev,
                  itemId: inventory[0].id,
                  cost_per_unit: inventory[0].cost_per_unit,
                }));
              }
              setIsStockModalOpen(true);
            }}
            className="px-3 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/20 font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" />
            <span>+ MOVIMENTO ESTOQUE</span>
          </button>

          <button
            onClick={() => {
              if (models.length > 0) {
                setOrderForm((prev) => ({
                  ...prev,
                  model_id: models[0].id,
                  unit_price: models[0].base_price,
                  unit_cost: models[0].base_cost,
                }));
              }
              setIsOrderModalOpen(true);
            }}
            className="px-4 py-2.5 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-mono font-bold text-xs tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ NOVO PEDIDO VULTO TAP</span>
          </button>
        </div>
      </div>

      {/* Low Stock Warning Alert if needed */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-950/20 border border-amber-500/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-amber-300">
                ALERTA DE ESTOQUE BAIXO ({lowStockItems.length} insumos críticos)
              </div>
              <div className="text-[11px] text-amber-200/70 font-sans mt-0.5">
                {lowStockItems.map((i) => `${i.name} (${i.quantity}/${i.min_quantity} ${i.unit})`).join(' • ')}
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveSubTab('inventory')}
            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-mono transition-colors shrink-0 cursor-pointer"
          >
            VER ESTOQUE
          </button>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-[#111111] border border-white/10 p-3.5">
          <div className="text-[10px] font-mono text-white/40 uppercase mb-1 flex items-center justify-between">
            <span>PEDIDOS MÊS</span>
            <Box className="w-3.5 h-3.5 text-white/30" />
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {metrics.monthOrdersCount}
          </div>
          <div className="text-[10px] font-mono text-white/50 mt-1">no mês atual</div>
        </div>

        <div className="bg-[#111111] border border-white/10 p-3.5">
          <div className="text-[10px] font-mono text-white/40 uppercase mb-1 flex items-center justify-between">
            <span>FATURAMENTO</span>
            <DollarSign className="w-3.5 h-3.5 text-[#C6FF00]/50" />
          </div>
          <div className="text-xl font-bold font-mono text-[#C6FF00]">
            R$ {metrics.totalRevenue.toLocaleString('pt-BR')}
          </div>
          <div className="text-[10px] font-mono text-white/50 mt-1">receita bruta</div>
        </div>

        <div className="bg-[#111111] border border-white/10 p-3.5">
          <div className="text-[10px] font-mono text-white/40 uppercase mb-1 flex items-center justify-between">
            <span>LUCRO</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400/50" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            R$ {metrics.totalProfit.toLocaleString('pt-BR')}
          </div>
          <div className="text-[10px] font-mono text-emerald-500/60 mt-1">lucro operacional</div>
        </div>

        <div className="bg-[#111111] border border-white/10 p-3.5">
          <div className="text-[10px] font-mono text-white/40 uppercase mb-1 flex items-center justify-between">
            <span>MARGEM</span>
            <span className="text-[10px] text-white/30">%</span>
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {metrics.marginPercentage}%
          </div>
          <div className="text-[10px] font-mono text-white/50 mt-1">rentabilidade</div>
        </div>

        <div className="bg-[#111111] border border-white/10 p-3.5">
          <div className="text-[10px] font-mono text-white/40 uppercase mb-1 flex items-center justify-between">
            <span>TICKET MÉDIO</span>
            <CreditCard className="w-3.5 h-3.5 text-white/30" />
          </div>
          <div className="text-xl font-bold font-mono text-white">
            R$ {metrics.averageTicket.toLocaleString('pt-BR')}
          </div>
          <div className="text-[10px] font-mono text-white/50 mt-1">por pedido</div>
        </div>

        <div className="bg-[#111111] border border-white/10 p-3.5">
          <div className="text-[10px] font-mono text-white/40 uppercase mb-1 flex items-center justify-between">
            <span>EM PRODUÇÃO</span>
            <Clock className="w-3.5 h-3.5 text-amber-400/50" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-400">
            {metrics.inProductionCount}
          </div>
          <div className="text-[10px] font-mono text-amber-400/60 mt-1">na bancada</div>
        </div>

        <div className="bg-[#111111] border border-white/10 p-3.5">
          <div className="text-[10px] font-mono text-white/40 uppercase mb-1 flex items-center justify-between">
            <span>PRONTOS</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/50" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            {metrics.readyCount}
          </div>
          <div className="text-[10px] font-mono text-white/50 mt-1">para envio</div>
        </div>

        <div className="bg-[#111111] border border-white/10 p-3.5">
          <div className="text-[10px] font-mono text-white/40 uppercase mb-1 flex items-center justify-between">
            <span>ENTREGUES</span>
            <CheckCircle className="w-3.5 h-3.5 text-[#C6FF00]/50" />
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {metrics.deliveredCount}
          </div>
          <div className="text-[10px] font-mono text-white/50 mt-1">concluídos</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-white/10 overflow-x-auto scrollbar-thin">
        {[
          { id: 'overview', label: 'VISÃO GERAL', icon: Layers },
          { id: 'kanban', label: 'KANBAN OPERACIONAL', icon: Sliders },
          { id: 'orders', label: 'TODOS OS PEDIDOS', icon: CreditCard, count: orders.length },
          { id: 'inventory', label: 'ESTOQUE & INSUMOS', icon: Package, count: inventory.length },
          { id: 'costs', label: 'CUSTOS & MARGEM', icon: TrendingUp },
          { id: 'models', label: 'MODELOS VULTO TAP', icon: Box, count: models.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as SubTab)}
              className={`px-4 py-3 font-mono text-xs tracking-wider flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'border-[#C6FF00] text-[#C6FF00] bg-white/[0.02]'
                  : 'border-transparent text-white/60 hover:text-white hover:border-white/20'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-1.5 py-0.5 text-[10px] rounded-sm font-mono ${
                    isActive ? 'bg-[#C6FF00]/20 text-[#C6FF00]' : 'bg-white/10 text-white/60'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: 1. OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick summary left */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recent Orders Table */}
              <div className="bg-[#111111] border border-white/10 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                      Últimos Pedidos Vulto Tap
                    </h2>
                    <p className="text-xs text-white/50">Fluxo operacional recente</p>
                  </div>
                  <button
                    onClick={() => setActiveSubTab('orders')}
                    className="text-xs font-mono text-[#C6FF00] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ver todos</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-white/10 text-white/40 text-[10px]">
                        <th className="pb-2">CLIENTE / PEDIDO</th>
                        <th className="pb-2">MODELO</th>
                        <th className="pb-2">QTD</th>
                        <th className="pb-2">TOTAL</th>
                        <th className="pb-2">LUCRO</th>
                        <th className="pb-2">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {orders.slice(0, 5).map((ord) => {
                        const stageInfo = KANBAN_STAGES.find((s) => s.id === ord.status);
                        return (
                          <tr key={ord.id} className="hover:bg-white/[0.02]">
                            <td className="py-3">
                              <div className="text-white font-bold">{ord.customer_name}</div>
                              <div className="text-[10px] text-white/40">{ord.destination_url || ord.destination_type}</div>
                            </td>
                            <td className="py-3 text-white/80">{ord.model_name}</td>
                            <td className="py-3 text-white">{ord.quantity} un</td>
                            <td className="py-3 text-[#C6FF00] font-bold">
                              R$ {ord.total_price.toLocaleString('pt-BR')},00
                            </td>
                            <td className="py-3 text-emerald-400">
                              R$ {ord.profit.toLocaleString('pt-BR')},00 ({ord.margin}%)
                            </td>
                            <td className="py-3">
                              <span
                                className={`px-2 py-0.5 text-[10px] border ${
                                  stageInfo?.color || 'border-white/20 text-white/70'
                                }`}
                              >
                                {stageInfo?.label || ord.status.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Hardware Stock Levels Preview */}
              <div className="bg-[#111111] border border-white/10 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                      Nível de Estoque de Insumos Físicos
                    </h2>
                    <p className="text-xs text-white/50">Chips NFC, chapas metálicas, PVC e embalagens</p>
                  </div>
                  <button
                    onClick={() => setActiveSubTab('inventory')}
                    className="text-xs font-mono text-[#C6FF00] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Gerenciar estoque</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {inventory.slice(0, 6).map((item) => {
                    const isLow = item.quantity <= item.min_quantity;
                    const percent = Math.min(100, Math.round((item.quantity / (item.min_quantity * 3)) * 100));
                    return (
                      <div key={item.id} className="p-3 bg-[#151515] border border-white/5 space-y-2">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-white truncate font-medium">{item.name}</span>
                          <span className={isLow ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                            {item.quantity} {item.unit}
                          </span>
                        </div>
                        <div className="w-full bg-white/10 h-1.5 overflow-hidden">
                          <div
                            className={`h-full ${isLow ? 'bg-amber-400' : 'bg-[#C6FF00]'}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono text-white/40">
                          <span>Mínimo: {item.min_quantity} {item.unit}</span>
                          <span>Custo un: R$ {item.cost_per_unit.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick summary right sidebar */}
            <div className="space-y-6">
              {/* Models available */}
              <div className="bg-[#111111] border border-white/10 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    Modelos em Produção
                  </h3>
                  <button
                    onClick={() => setActiveSubTab('models')}
                    className="text-[11px] font-mono text-[#C6FF00] hover:underline cursor-pointer"
                  >
                    Ver todos
                  </button>
                </div>

                <div className="space-y-2.5">
                  {models.map((m) => {
                    const margin =
                      m.base_price > 0
                        ? Math.round(((m.base_price - m.base_cost) / m.base_price) * 100)
                        : 0;
                    return (
                      <div key={m.id} className="p-3 bg-white/[0.02] border border-white/5 text-xs font-mono">
                        <div className="flex items-center justify-between text-white font-semibold">
                          <span>{m.name}</span>
                          <span className="text-[#C6FF00]">R$ {m.base_price.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-white/50 mt-1">
                          <span>Custo: R$ {m.base_cost.toFixed(2)}</span>
                          <span className="text-emerald-400 font-bold">Margem {margin}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* NFC Integration Specs */}
              <div className="bg-[#111111] border border-white/10 p-5 space-y-3 font-mono text-xs">
                <div className="text-[10px] tracking-widest text-[#C6FF00] uppercase font-bold">
                  // ESPECIFICAÇÕES TÉCNICAS
                </div>
                <div className="text-white font-bold text-sm">Padrão NFC Vulto Lab</div>
                <p className="text-white/60 font-sans text-xs leading-relaxed">
                  Todos os cartões utilizam chips NXP NTAG216 de alta densidade (888 bytes livres) e proteção anti-clonagem com bloqueio de leitura de memória após gravação.
                </p>
                <div className="space-y-1.5 pt-2 border-t border-white/10 text-[11px]">
                  <div className="flex justify-between text-white/70">
                    <span>Frequência de operação:</span>
                    <span className="text-white">13.56 MHz (ISO 14443A)</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>Distância de leitura:</span>
                    <span className="text-white">1 a 4 cm sem contato</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>Compatibilidade:</span>
                    <span className="text-white">100% iOS & Android NFC</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. KANBAN OPERACIONAL */}
      {activeSubTab === 'kanban' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111111] border border-white/10 p-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-white/50 uppercase">FILTRAR:</span>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por cliente ou URL..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#181818] border border-white/10 text-white text-xs pl-8 pr-3 py-1.5 focus:border-[#C6FF00] outline-none font-mono"
                />
              </div>
            </div>
            <div className="text-xs font-mono text-white/50">
              Total de pedidos no fluxo: <span className="text-[#C6FF00] font-bold">{orders.length}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {KANBAN_STAGES.map((stage) => {
              const stageOrders = filteredOrders.filter((o) => o.status === stage.id);
              return (
                <div key={stage.id} className="bg-[#111111] border border-white/10 flex flex-col min-h-[500px]">
                  {/* Column Header */}
                  <div className="p-3 border-b border-white/10 bg-[#141414]">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`text-xs font-mono font-bold ${stage.color}`}>
                        {stage.label}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-white/10 text-white font-bold">
                        {stageOrders.length}
                      </span>
                    </div>
                    <div className="text-[10px] text-white/40 font-mono">{stage.desc}</div>
                  </div>

                  {/* Cards container */}
                  <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[700px]">
                    {stageOrders.length === 0 ? (
                      <div className="p-4 text-center text-[11px] font-mono text-white/20 border border-dashed border-white/5 my-4">
                        Nenhum pedido nesta etapa
                      </div>
                    ) : (
                      stageOrders.map((order) => (
                        <div
                          key={order.id}
                          className="bg-[#161616] border border-white/10 hover:border-white/30 p-3 text-xs font-mono transition-all group"
                        >
                          <div className="flex items-start justify-between gap-1 mb-1.5">
                            <span className="font-bold text-white text-xs leading-snug">
                              {order.customer_name}
                            </span>
                            <span className="text-[10px] text-[#C6FF00] font-bold shrink-0">
                              {order.quantity} un
                            </span>
                          </div>

                          <div className="text-[11px] text-white/70 mb-2 truncate">
                            {order.model_name}
                          </div>

                          {order.destination_url && (
                            <a
                              href={order.destination_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-blue-400 hover:underline flex items-center gap-1 mb-2 truncate"
                            >
                              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{order.destination_url}</span>
                            </a>
                          )}

                          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                            <span className="text-white/40 font-bold">
                              R$ {order.total_price.toLocaleString('pt-BR')},00
                            </span>
                            <span className="text-emerald-400 text-[10px]">
                              +{order.margin}%
                            </span>
                          </div>

                          {/* Quick stage mover dropdown */}
                          <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between gap-1">
                            <span className="text-[9px] text-white/40 uppercase">MOVER:</span>
                            <select
                              value={order.status}
                              onChange={(e) =>
                                handleStageChange(order, e.target.value as VultoTapOrderStatus)
                              }
                              className="bg-[#0A0A0A] border border-white/10 text-white text-[10px] px-1 py-0.5 outline-none font-mono cursor-pointer"
                            >
                              {KANBAN_STAGES.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.label}
                                </option>
                              ))}
                              <option value="cancelled">CANCELAR</option>
                            </select>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. ALL ORDERS LIST */}
      {activeSubTab === 'orders' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111111] border border-white/10 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar pedidos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#181818] border border-white/10 text-white text-xs pl-8 pr-3 py-1.5 focus:border-[#C6FF00] outline-none font-mono"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#181818] border border-white/10 text-white text-xs px-2.5 py-1.5 outline-none font-mono cursor-pointer"
              >
                <option value="all">Todos os Status</option>
                {KANBAN_STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
                <option value="cancelled">CANCELADO</option>
              </select>
            </div>

            <div className="text-xs font-mono text-white/50">
              Mostrando {filteredOrders.length} de {orders.length} pedidos
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-[#111111] border border-white/10 overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/10 bg-[#161616] text-white/40 text-[10px]">
                  <th className="p-3">DATA</th>
                  <th className="p-3">CLIENTE</th>
                  <th className="p-3">MODELO & DESTINO</th>
                  <th className="p-3">QTD</th>
                  <th className="p-3">PREÇO TOTAL</th>
                  <th className="p-3">CUSTO TOTAL</th>
                  <th className="p-3">LUCRO (MARGEM)</th>
                  <th className="p-3">STATUS</th>
                  <th className="p-3 text-right">AÇÕES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-white/40 font-mono">
                      Nenhum pedido encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => {
                    const stage = KANBAN_STAGES.find((s) => s.id === ord.status);
                    return (
                      <tr key={ord.id} className="hover:bg-white/[0.02]">
                        <td className="p-3 text-white/50">{ord.order_date}</td>
                        <td className="p-3">
                          <div className="text-white font-bold">{ord.customer_name}</div>
                          {ord.client_name && ord.client_name !== ord.customer_name && (
                            <div className="text-[10px] text-white/40">{ord.client_name}</div>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="text-white">{ord.model_name}</div>
                          <div className="text-[10px] text-white/40 flex items-center gap-1">
                            <span>Tipo: {ord.destination_type}</span>
                            {ord.destination_url && (
                              <a
                                href={ord.destination_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-400 hover:underline inline-flex items-center gap-0.5"
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-white font-bold">{ord.quantity} un</td>
                        <td className="p-3 text-[#C6FF00] font-bold">
                          R$ {ord.total_price.toLocaleString('pt-BR')},00
                        </td>
                        <td className="p-3 text-white/60">
                          R$ {ord.total_cost.toLocaleString('pt-BR')},00
                        </td>
                        <td className="p-3">
                          <span className="text-emerald-400 font-bold">
                            R$ {ord.profit.toLocaleString('pt-BR')},00
                          </span>
                          <span className="text-white/40 text-[10px] ml-1">({ord.margin}%)</span>
                        </td>
                        <td className="p-3">
                          <select
                            value={ord.status}
                            onChange={(e) =>
                              handleStageChange(ord, e.target.value as VultoTapOrderStatus)
                            }
                            className={`bg-[#0A0A0A] border text-[10px] px-2 py-1 outline-none font-mono cursor-pointer ${
                              stage?.color || 'border-white/20 text-white'
                            }`}
                          >
                            {KANBAN_STAGES.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.label}
                              </option>
                            ))}
                            <option value="cancelled">CANCELADO</option>
                          </select>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() =>
                              setDeleteConfirmation({
                                type: 'order',
                                id: ord.id,
                                name: `Pedido #${ord.id.slice(0, 8)} (${ord.customer_name})`,
                              })
                            }
                            className="p-1.5 hover:bg-rose-950/30 text-white/40 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Excluir pedido"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. INVENTORY & STOCK */}
      {activeSubTab === 'inventory' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111111] border border-white/10 p-4">
            <div>
              <h2 className="text-sm font-bold font-mono text-white uppercase">
                Almoxarifado & Insumos VULTO TAP
              </h2>
              <p className="text-xs text-white/50 font-sans">
                Chips NTAG, bases brutas, resinados, adesivos e caixas rígidas
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsItemModalOpen(true)}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/20 text-white text-xs font-mono flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#C6FF00]" />
                <span>+ CADASTRAR NOVO INSUMO</span>
              </button>
              <button
                onClick={() => setIsStockModalOpen(true)}
                className="px-3 py-2 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-bold text-xs font-mono flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>+ MOVIMENTO DE ENTRADA/SAÍDA</span>
              </button>
            </div>
          </div>

          {/* Inventory Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inventory.map((item) => {
              const isLow = item.quantity <= item.min_quantity;
              const totalAssetValue = item.quantity * item.cost_per_unit;
              return (
                <div
                  key={item.id}
                  className={`bg-[#111111] border p-4 space-y-3 font-mono text-xs transition-colors ${
                    isLow ? 'border-amber-500/40 bg-amber-950/[0.05]' : 'border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-white/40 uppercase tracking-wider">
                          {item.category || 'Geral'}
                        </span>
                        {item.sku && (
                          <span className="text-[9px] bg-white/10 px-1 py-0.2 text-white/60">
                            {item.sku}
                          </span>
                        )}
                      </div>
                      <div className="text-white font-bold text-sm mt-0.5">{item.name}</div>
                    </div>
                    {isLow ? (
                      <span className="px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold">
                        ESTOQUE BAIXO
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px]">
                        REGULAR
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-white/[0.02] border border-white/5 text-[11px]">
                    <div>
                      <div className="text-white/40 text-[10px]">SALDO EM ESTOQUE</div>
                      <div className="text-base font-bold text-white mt-0.5">
                        {item.quantity} <span className="text-xs text-white/60">{item.unit}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-white/40 text-[10px]">CUSTO UNITÁRIO</div>
                      <div className="text-base font-bold text-[#C6FF00] mt-0.5">
                        R$ {item.cost_per_unit.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-white/50 pt-1 border-t border-white/5">
                    <span>Mínimo: {item.min_quantity} {item.unit}</span>
                    <span>Total imobilizado: R$ {totalAssetValue.toFixed(2)}</span>
                  </div>

                  {item.location && (
                    <div className="text-[10px] text-white/40 flex items-center gap-1">
                      <span>Localização:</span>
                      <span className="text-white/80">{item.location}</span>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-white/5">
                    <button
                      onClick={() => {
                        setStockMovementForm({
                          itemId: item.id,
                          type: 'in',
                          quantity: 20,
                          cost_per_unit: item.cost_per_unit,
                          notes: `Reposição de ${item.name}`,
                          syncExpense: true,
                        });
                        setIsStockModalOpen(true);
                      }}
                      className="text-[10px] text-[#C6FF00] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowUpRight className="w-3 h-3" />
                      <span>+ Dar Entrada</span>
                    </button>

                    <button
                      onClick={() =>
                        setDeleteConfirmation({
                          type: 'item',
                          id: item.id,
                          name: item.name,
                        })
                      }
                      className="text-[10px] text-white/30 hover:text-rose-400 cursor-pointer"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Movements History */}
          <div className="bg-[#111111] border border-white/10 p-5">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-3">
              Histórico de Movimentações de Estoque
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 text-[10px]">
                    <th className="pb-2">DATA</th>
                    <th className="pb-2">TIPO</th>
                    <th className="pb-2">INSUMO</th>
                    <th className="pb-2">QUANTIDADE</th>
                    <th className="pb-2">CUSTO UN.</th>
                    <th className="pb-2">TOTAL</th>
                    <th className="pb-2">NOTAS / REFERÊNCIA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {movements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-4 text-center text-white/40">
                        Nenhuma movimentação registrada até o momento.
                      </td>
                    </tr>
                  ) : (
                    movements.slice(0, 10).map((mov) => {
                      const isEntry = mov.type === 'in';
                      const totalCost = mov.quantity * mov.cost_per_unit;
                      return (
                        <tr key={mov.id} className="hover:bg-white/[0.02]">
                          <td className="py-2.5 text-white/50">{mov.created_at.slice(0, 10)}</td>
                          <td className="py-2.5">
                            <span
                              className={`px-1.5 py-0.5 text-[10px] font-bold ${
                                isEntry
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : mov.type === 'out'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-purple-500/20 text-purple-300'
                              }`}
                            >
                              {mov.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-2.5 text-white font-medium">{mov.item_name}</td>
                          <td className="py-2.5 text-white font-bold">
                            {isEntry ? `+${mov.quantity}` : `-${mov.quantity}`} un
                          </td>
                          <td className="py-2.5 text-white/70">
                            {mov.cost_per_unit > 0 ? `R$ ${mov.cost_per_unit.toFixed(2)}` : '—'}
                          </td>
                          <td className="py-2.5 text-[#C6FF00]">
                            {totalCost > 0 ? `R$ ${totalCost.toFixed(2)}` : '—'}
                          </td>
                          <td className="py-2.5 text-white/40 text-[11px] truncate max-w-xs">
                            {mov.notes || '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 5. COSTS & MARGINS */}
      {activeSubTab === 'costs' && (
        <div className="space-y-6">
          <div className="bg-[#111111] border border-white/10 p-5">
            <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider mb-1">
              Demonstrativo de Custos & Rentabilidade por Modelo
            </h2>
            <p className="text-xs text-white/50 font-sans mb-4">
              Comparativo de preço de venda sugerido, custo direto de produção e margem de contribuição.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/10 bg-[#161616] text-white/40 text-[10px]">
                    <th className="p-3">MODELO VULTO TAP</th>
                    <th className="p-3">MATERIAL BASE</th>
                    <th className="p-3">PREÇO VENDA</th>
                    <th className="p-3">CUSTO PRODUÇÃO</th>
                    <th className="p-3">LUCRO BRUTO / UN</th>
                    <th className="p-3">MARGEM COMERCIAL</th>
                    <th className="p-3">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {models.map((m) => {
                    const unitProfit = m.base_price - m.base_cost;
                    const margin =
                      m.base_price > 0 ? Math.round((unitProfit / m.base_price) * 100) : 0;
                    return (
                      <tr key={m.id} className="hover:bg-white/[0.02]">
                        <td className="p-3">
                          <div className="text-white font-bold">{m.name}</div>
                          <div className="text-[10px] text-white/40">{m.description}</div>
                        </td>
                        <td className="p-3 text-white/70">{m.material || 'Padrão NFC'}</td>
                        <td className="p-3 text-[#C6FF00] font-bold">
                          R$ {m.base_price.toFixed(2)}
                        </td>
                        <td className="p-3 text-rose-300 font-bold">
                          R$ {m.base_cost.toFixed(2)}
                        </td>
                        <td className="p-3 text-emerald-400 font-bold">
                          R$ {unitProfit.toFixed(2)}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-bold">{margin}%</span>
                            <div className="w-16 bg-white/10 h-1.5 overflow-hidden">
                              <div
                                className="h-full bg-emerald-400"
                                style={{ width: `${Math.min(100, margin)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 text-[10px] ${
                              m.active
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-white/10 text-white/40'
                            }`}
                          >
                            {m.active ? 'ATIVO' : 'INATIVO'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 6. MODELS */}
      {activeSubTab === 'models' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111111] border border-white/10 p-4">
            <div>
              <h2 className="text-sm font-bold font-mono text-white uppercase">
                Catálogo de Modelos Físicos VULTO TAP
              </h2>
              <p className="text-xs text-white/50 font-sans">
                Modelos de cartões, displays e tags disponíveis para venda
              </p>
            </div>
            <button
              onClick={() => setIsModelModalOpen(true)}
              className="px-4 py-2 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-mono font-bold text-xs tracking-wider flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ CADASTRAR MODELO</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {models.map((mod) => {
              const unitProfit = mod.base_price - mod.base_cost;
              const margin =
                mod.base_price > 0 ? Math.round((unitProfit / mod.base_price) * 100) : 0;
              return (
                <div key={mod.id} className="bg-[#111111] border border-white/10 p-5 space-y-3 font-mono text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-white font-bold text-base">{mod.name}</div>
                      <div className="text-[11px] text-white/50 font-sans mt-0.5">
                        {mod.description || 'Sem descrição'}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-[10px] ${
                        mod.active
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-white/10 text-white/40'
                      }`}
                    >
                      {mod.active ? 'ATIVO' : 'INATIVO'}
                    </span>
                  </div>

                  <div className="p-3 bg-white/[0.02] border border-white/5 space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-white/40">Material:</span>
                      <span className="text-white font-semibold">{mod.material || 'PVC/Metal'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Preço de Venda:</span>
                      <span className="text-[#C6FF00] font-bold">R$ {mod.base_price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Custo Base:</span>
                      <span className="text-rose-300 font-bold">R$ {mod.base_cost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-white/5">
                      <span className="text-emerald-400 font-bold">Lucro Unitário:</span>
                      <span className="text-emerald-400 font-bold">
                        R$ {unitProfit.toFixed(2)} ({margin}%)
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-white/5 text-[11px]">
                    <button
                      onClick={async () => {
                        const { success } = await updateVultoTapModel(mod.id, {
                          active: !mod.active,
                        });
                        if (success) {
                          setModels((prev) =>
                            prev.map((m) =>
                              m.id === mod.id ? { ...m, active: !m.active } : m
                            )
                          );
                          showFeedback('success', 'Status do modelo atualizado.');
                        }
                      }}
                      className="text-white/60 hover:text-white cursor-pointer"
                    >
                      {mod.active ? 'Desativar' : 'Ativar'}
                    </button>

                    <button
                      onClick={() =>
                        setDeleteConfirmation({
                          type: 'model',
                          id: mod.id,
                          name: mod.name,
                        })
                      }
                      className="text-white/30 hover:text-rose-400 cursor-pointer"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: NOVO PEDIDO VULTO TAP                                             */}
      {/* ========================================================================= */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#111111] border border-white/10 w-full max-w-xl p-6 font-mono text-xs my-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#C6FF00]" />
                <span className="text-sm font-bold text-white uppercase">
                  Novo Pedido VULTO TAP
                </span>
              </div>
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="text-white/40 hover:text-white text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 text-[11px] mb-1">
                    Nome do Cliente / Empresa *
                  </label>
                  <input
                    type="text"
                    required
                    value={orderForm.customer_name}
                    onChange={(e) =>
                      setOrderForm({ ...orderForm, customer_name: e.target.value })
                    }
                    placeholder="Ex: Studio Arquitetura"
                    className="w-full bg-[#181818] border border-white/10 text-white p-2.5 focus:border-[#C6FF00] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-white/60 text-[11px] mb-1">
                    Vincular a Cliente Existente (Opcional)
                  </label>
                  <select
                    value={orderForm.client_id}
                    onChange={(e) => {
                      const selected = clients.find((c) => c.id === e.target.value);
                      setOrderForm({
                        ...orderForm,
                        client_id: e.target.value,
                        customer_name: selected ? selected.company_name : orderForm.customer_name,
                      });
                    }}
                    className="w-full bg-[#181818] border border-white/10 text-white p-2.5 focus:border-[#C6FF00] outline-none cursor-pointer"
                  >
                    <option value="">Selecione ou deixe avulso</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-white/60 text-[11px] mb-1">
                    Modelo VULTO TAP *
                  </label>
                  <select
                    value={orderForm.model_id}
                    onChange={(e) => {
                      const model = models.find((m) => m.id === e.target.value);
                      setOrderForm({
                        ...orderForm,
                        model_id: e.target.value,
                        unit_price: model ? model.base_price : orderForm.unit_price,
                        unit_cost: model ? model.base_cost : orderForm.unit_cost,
                      });
                    }}
                    className="w-full bg-[#181818] border border-white/10 text-white p-2.5 focus:border-[#C6FF00] outline-none cursor-pointer"
                  >
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} — R$ {m.base_price.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white/60 text-[11px] mb-1">
                    Quantidade *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={orderForm.quantity}
                    onChange={(e) =>
                      setOrderForm({ ...orderForm, quantity: Number(e.target.value) })
                    }
                    className="w-full bg-[#181818] border border-white/10 text-white p-2.5 focus:border-[#C6FF00] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 text-[11px] mb-1">
                    Preço Unitário de Venda (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={orderForm.unit_price}
                    onChange={(e) =>
                      setOrderForm({ ...orderForm, unit_price: Number(e.target.value) })
                    }
                    className="w-full bg-[#181818] border border-white/10 text-white p-2.5 focus:border-[#C6FF00] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-white/60 text-[11px] mb-1">
                    Custo Unitário de Produção (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={orderForm.unit_cost}
                    onChange={(e) =>
                      setOrderForm({ ...orderForm, unit_cost: Number(e.target.value) })
                    }
                    className="w-full bg-[#181818] border border-white/10 text-white p-2.5 focus:border-[#C6FF00] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 text-[11px] mb-1">
                    Tipo de Destino NFC
                  </label>
                  <select
                    value={orderForm.destination_type}
                    onChange={(e) =>
                      setOrderForm({ ...orderForm, destination_type: e.target.value })
                    }
                    className="w-full bg-[#181818] border border-white/10 text-white p-2.5 focus:border-[#C6FF00] outline-none cursor-pointer"
                  >
                    <option value="url">URL Direta / Link</option>
                    <option value="profile">Perfil Digital Vulto Bio</option>
                    <option value="vcard">Cartão de Contato (vCard)</option>
                    <option value="cardapio">Cardápio / Catálogo Digital</option>
                    <option value="whatsapp">Link WhatsApp Direto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white/60 text-[11px] mb-1">
                    URL ou Chave de Destino
                  </label>
                  <input
                    type="text"
                    value={orderForm.destination_url}
                    onChange={(e) =>
                      setOrderForm({ ...orderForm, destination_url: e.target.value })
                    }
                    placeholder="https://vulto.bio/seunome"
                    className="w-full bg-[#181818] border border-white/10 text-white p-2.5 focus:border-[#C6FF00] outline-none"
                  />
                </div>
              </div>

              {/* Financial calculations preview */}
              <div className="p-3 bg-white/[0.03] border border-white/10 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-white/50">Total Faturado:</span>
                  <span className="text-[#C6FF00] font-bold">
                    R$ {(orderForm.unit_price * orderForm.quantity).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Custo Total dos Insumos:</span>
                  <span className="text-rose-300 font-bold">
                    R$ {(orderForm.unit_cost * orderForm.quantity).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-white/10">
                  <span className="text-emerald-400 font-bold">Lucro Estimado:</span>
                  <span className="text-emerald-400 font-bold">
                    R$ {((orderForm.unit_price - orderForm.unit_cost) * orderForm.quantity).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Integration Checkbox */}
              <div className="pt-2 border-t border-white/10">
                <label className="flex items-center gap-2 text-white cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={orderForm.syncSale}
                    onChange={(e) =>
                      setOrderForm({ ...orderForm, syncSale: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#C6FF00] cursor-pointer"
                  />
                  <span>
                    Integrar ao Financeiro (Lançar entrada automaticamente em{' '}
                    <strong className="text-[#C6FF00]">sales</strong>)
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 font-mono text-xs cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-bold font-mono text-xs cursor-pointer"
                >
                  SALVAR PEDIDO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: MOVIMENTAÇÃO DE ESTOQUE (ENTRADA / SAÍDA)                        */}
      {/* ========================================================================= */}
      {isStockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111111] border border-white/10 w-full max-w-lg p-6 font-mono text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-bold text-white uppercase">
                  Movimentar Estoque VULTO TAP
                </span>
              </div>
              <button
                onClick={() => setIsStockModalOpen(false)}
                className="text-white/40 hover:text-white text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStockMovementSubmit} className="space-y-4">
              <div>
                <label className="block text-white/60 text-[11px] mb-1">
                  Insumo de Estoque *
                </label>
                <select
                  required
                  value={stockMovementForm.itemId}
                  onChange={(e) => {
                    const item = inventory.find((i) => i.id === e.target.value);
                    setStockMovementForm({
                      ...stockMovementForm,
                      itemId: e.target.value,
                      cost_per_unit: item?.cost_per_unit || 0,
                    });
                  }}
                  className="w-full bg-[#181818] border border-white/10 text-white p-2.5 focus:border-[#C6FF00] outline-none cursor-pointer"
                >
                  <option value="">Selecione um insumo...</option>
                  {inventory.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} (Atual: {item.quantity} {item.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 text-[11px] mb-1">
                    Tipo de Movimento *
                  </label>
                  <select
                    value={stockMovementForm.type}
                    onChange={(e) =>
                      setStockMovementForm({
                        ...stockMovementForm,
                        type: e.target.value as any,
                      })
                    }
                    className="w-full bg-[#181818] border border-white/10 text-white p-2.5 focus:border-[#C6FF00] outline-none cursor-pointer"
                  >
                    <option value="in">ENTRADA (Compra/Reposição)</option>
                    <option value="out">SAÍDA (Consumo/Descarte)</option>
                    <option value="adjustment">AJUSTE DE INVENTÁRIO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white/60 text-[11px] mb-1">
                    Quantidade *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={stockMovementForm.quantity}
                    onChange={(e) =>
                      setStockMovementForm({
                        ...stockMovementForm,
                        quantity: Number(e.target.value),
                      })
                    }
                    className="w-full bg-[#181818] border border-white/10 text-white p-2.5 focus:border-[#C6FF00] outline-none"
                  />
                </div>
              </div>

              {stockMovementForm.type === 'in' && (
                <div>
                  <label className="block text-white/60 text-[11px] mb-1">
                    Custo Unitário da Aquisição (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={stockMovementForm.cost_per_unit}
                    onChange={(e) =>
                      setStockMovementForm({
                        ...stockMovementForm,
                        cost_per_unit: Number(e.target.value),
                      })
                    }
                    className="w-full bg-[#181818] border border-white/10 text-white p-2.5 focus:border-[#C6FF00] outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-white/60 text-[11px] mb-1">
                  Notas / Motivo da Movimentação
                </label>
                <input
                  type="text"
                  value={stockMovementForm.notes}
                  onChange={(e) =>
                    setStockMovementForm({
                      ...stockMovementForm,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Ex: Nota fiscal #4829 ou reposição mensal de chips"
                  className="w-full bg-[#181818] border border-white/10 text-white p-2.5 focus:border-[#C6FF00] outline-none"
                />
              </div>

              {stockMovementForm.type === 'in' && (
                <div className="pt-2 border-t border-white/10">
                  <label className="flex items-center gap-2 text-white cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={stockMovementForm.syncExpense}
                      onChange={(e) =>
                        setStockMovementForm({
                          ...stockMovementForm,
                          syncExpense: e.target.checked,
                        })
                      }
                      className="w-4 h-4 accent-[#C6FF00] cursor-pointer"
                    />
                    <span>
                      Lançar despesa no Financeiro (tabela{' '}
                      <strong className="text-rose-400">expenses</strong>, categoria{' '}
                      <em>VULTO TAP</em>)
                    </span>
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsStockModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 font-mono text-xs cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-500 hover:bg-blue-400 text-[#0A0A0A] font-bold font-mono text-xs cursor-pointer"
                >
                  CONFIRMAR MOVIMENTO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: NOVO INSUMO NO ALMOXARIFADO                                      */}
      {/* ========================================================================= */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111111] border border-white/10 w-full max-w-lg p-6 font-mono text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-sm font-bold text-white uppercase">
                Cadastrar Novo Insumo de Estoque
              </span>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="text-white/40 hover:text-white text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-4">
              <div>
                <label className="block text-white/60 text-[11px] mb-1">
                  Nome do Insumo *
                </label>
                <input
                  type="text"
                  required
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  placeholder="Ex: Placa de Alumínio Anodizado"
                  className="w-full bg-[#181818] border border-white/10 text-white p-2.5 focus:border-[#C6FF00] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 text-[11px] mb-1">
                    Categoria
                  </label>
                  <select
                    value={itemForm.category}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, category: e.target.value })
                    }
                    className="w-full bg-[#181818] border border-white/10 text-white p-2.5 focus:border-[#C6FF00] outline-none cursor-pointer"
                  >
                    <option value="Chips NFC">Chips NFC</option>
                    <option value="Cartões Brutos">Cartões Brutos</option>
                    <option value="Tags/Adesivos">Tags/Adesivos</option>
                    <option value="Displays">Displays</option>
                    <option value="Embalagens">Embalagens</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white/60 text-[11px] mb-1">SKU</label>
                  <input
                    type="text"
                    value={itemForm.sku}
                    onChange={(e) => setItemForm({ ...itemForm, sku: e.target.value })}
                    placeholder="CRD-ALUM-01"
                    className="w-full bg-[#181818] border border-white/10 text-white p-2.5 focus:border-[#C6FF00] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-white/60 text-[11px] mb-1">
                    Estoque Inicial
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={itemForm.quantity}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, quantity: Number(e.target.value) })
                    }
                    className="w-full bg-[#181818] border border-white/10 text-white p-2.5 focus:border-[#C6FF00] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-white/60 text-[11px] mb-1">
                    Qtd Mínima (Alerta)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={itemForm.min_quantity}
                    onChange={(e) =>
                      setItemForm({
                        ...itemForm,
                        min_quantity: Number(e.target.value),
                      })
                    }
                    className="w-full bg-[#181818] border border-white/10 text-white p-2.5 focus:border-[#C6FF00] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-white/60 text-[11px] mb-1">
                    Custo Unitário (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={itemForm.cost_per_unit}
                    onChange={(e) =>
                      setItemForm({
                        ...itemForm,
                        cost_per_unit: Number(e.target.value),
                      })
                    }
                    className="w-full bg-[#181818] border border-white/10 text-white p-2.5 focus:border-[#C6FF00] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/60 text-[11px] mb-1">
                  Localização Física
                </label>
                <input
                  type="text"
                  value={itemForm.location}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, location: e.target.value })
                  }
                  placeholder="Ex: Gaveta B3 ou Prateleira 2"
                  className="w-full bg-[#181818] border border-white/10 text-white p-2.5 focus:border-[#C6FF00] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 font-mono text-xs cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-bold font-mono text-xs cursor-pointer"
                >
                  CADASTRAR INSUMO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: NOVO MODELO VULTO TAP                                            */}
      {/* ========================================================================= */}
      {isModelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111111] border border-white/10 w-full max-w-lg p-6 font-mono text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-sm font-bold text-white uppercase">
                Cadastrar Novo Modelo VULTO TAP
              </span>
              <button
                onClick={() => setIsModelModalOpen(false)}
                className="text-white/40 hover:text-white text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateModel} className="space-y-4">
              <div>
                <label className="block text-white/60 text-[11px] mb-1">
                  Nome do Modelo *
                </label>
                <input
                  type="text"
                  required
                  value={modelForm.name}
                  onChange={(e) => setModelForm({ ...modelForm, name: e.target.value })}
                  placeholder="Ex: Cartão Fibra de Carbono NFC"
                  className="w-full bg-[#181818] border border-white/10 text-white p-2.5 focus:border-[#C6FF00] outline-none"
                />
              </div>

              <div>
                <label className="block text-white/60 text-[11px] mb-1">
                  Material / Especificação
                </label>
                <input
                  type="text"
                  value={modelForm.material}
                  onChange={(e) =>
                    setModelForm({ ...modelForm, material: e.target.value })
                  }
                  placeholder="Ex: Fibra de Carbono Real + Chip NTAG216"
                  className="w-full bg-[#181818] border border-white/10 text-white p-2.5 focus:border-[#C6FF00] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 text-[11px] mb-1">
                    Preço de Venda Sugerido (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={modelForm.base_price}
                    onChange={(e) =>
                      setModelForm({
                        ...modelForm,
                        base_price: Number(e.target.value),
                      })
                    }
                    className="w-full bg-[#181818] border border-white/10 text-white p-2.5 focus:border-[#C6FF00] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-white/60 text-[11px] mb-1">
                    Custo Médio de Fabricação (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={modelForm.base_cost}
                    onChange={(e) =>
                      setModelForm({
                        ...modelForm,
                        base_cost: Number(e.target.value),
                      })
                    }
                    className="w-full bg-[#181818] border border-white/10 text-white p-2.5 focus:border-[#C6FF00] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/60 text-[11px] mb-1">
                  Descrição Comercial
                </label>
                <textarea
                  rows={2}
                  value={modelForm.description}
                  onChange={(e) =>
                    setModelForm({ ...modelForm, description: e.target.value })
                  }
                  placeholder="Breve descrição dos benefícios e acabamento deste modelo..."
                  className="w-full bg-[#181818] border border-white/10 text-white p-2.5 focus:border-[#C6FF00] outline-none resize-none font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModelModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 font-mono text-xs cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-bold font-mono text-xs cursor-pointer"
                >
                  CADASTRAR MODELO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: BAIXA DE ESTOQUE AUTOMÁTICA AO MUDAR ETAPA DO PEDIDO            */}
      {/* ========================================================================= */}
      {orderToDeduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111111] border border-[#C6FF00] w-full max-w-md p-6 font-mono text-xs space-y-4">
            <div className="flex items-center gap-2 text-[#C6FF00]">
              <Package className="w-5 h-5" />
              <span className="text-sm font-bold uppercase">
                Dar Baixa de Estoque para este Pedido?
              </span>
            </div>

            <p className="text-white/70 font-sans text-xs leading-relaxed">
              O pedido de <strong>{orderToDeduct.customer_name}</strong> ({orderToDeduct.quantity} unidades de {orderToDeduct.model_name}) avançou de etapa.
              Deseja descontar as unidades correspondentes dos insumos em estoque agora?
            </p>

            <div className="p-3 bg-white/[0.03] border border-white/10 space-y-2">
              <div className="text-[10px] text-white/40 uppercase font-bold">
                Insumos sugeridos para baixa:
              </div>
              {inventory.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs">
                  <span className="text-white">{item.name}</span>
                  <span className="text-amber-400 font-bold">
                    -{orderToDeduct.quantity} {item.unit}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setOrderToDeduct(null)}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white/70 font-mono text-xs cursor-pointer"
              >
                NÃO DAR BAIXA
              </button>
              <button
                type="button"
                onClick={() => {
                  const itemsToDeduct = inventory.slice(0, 2).map((i) => ({
                    itemId: i.id,
                    qty: orderToDeduct.quantity,
                  }));
                  handleConfirmOrderDeduction(itemsToDeduct);
                }}
                className="px-4 py-2 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-bold font-mono text-xs cursor-pointer"
              >
                SIM, BAIXAR ESTOQUE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: CONFIRMAÇÃO DE EXCLUSÃO                                         */}
      {/* ========================================================================= */}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111111] border border-rose-500 w-full max-w-sm p-5 font-mono text-xs space-y-3">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-bold uppercase">Confirmar Exclusão</span>
            </div>
            <p className="text-white/70 font-sans text-xs">
              Tem certeza que deseja excluir <strong>{deleteConfirmation.name}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 cursor-pointer"
              >
                CANCELAR
              </button>
              <button
                onClick={executeDelete}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer"
              >
                SIM, EXCLUIR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
