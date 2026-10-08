import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { logActivity } from './crmService';

export type VultoTapOrderStatus =
  | 'new'
  | 'design'
  | 'production'
  | 'configuration'
  | 'ready'
  | 'delivered'
  | 'cancelled';

export interface VultoTapModel {
  id: string;
  name: string;
  description: string | null;
  material: string | null;
  base_price: number;
  base_cost: number;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  unit: string;
  quantity: number;
  min_quantity: number;
  cost_per_unit: number;
  location: string | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryMovement {
  id: string;
  item_id: string;
  item_name?: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  cost_per_unit: number;
  reference_order_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_by_name?: string;
  created_at: string;
}

export interface VultoTapOrder {
  id: string;
  client_id: string | null;
  client_name?: string;
  customer_name: string;
  quantity: number;
  model_id: string | null;
  model_name?: string;
  destination_type: string;
  destination_url: string | null;
  unit_price: number;
  total_price: number;
  unit_cost: number;
  total_cost: number;
  profit: number;
  margin: number;
  status: VultoTapOrderStatus;
  responsible_user_id: string | null;
  responsible_name?: string;
  order_date: string;
  delivery_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at?: string;
}

export interface VultoTapMetrics {
  monthOrdersCount: number;
  totalRevenue: number;
  totalProfit: number;
  marginPercentage: number;
  averageTicket: number;
  inProductionCount: number;
  readyCount: number;
  deliveredCount: number;
}

// -------------------------------------------------------------
// DEFAULT DATA / LOCAL FALLBACKS
// -------------------------------------------------------------
const DEFAULT_MODELS: VultoTapModel[] = [
  {
    id: 'mod-1',
    name: 'Cartão PVC Black Matte NFC',
    description: 'Cartão corporativo preto fosco com gravação a laser premium',
    material: 'PVC Fosco + NTAG216',
    base_price: 89.0,
    base_cost: 18.0,
    active: true,
  },
  {
    id: 'mod-2',
    name: 'Cartão Metal Black NFC Luxo',
    description: 'Aço inoxidável escovado preto com gravação em baixo relevo',
    material: 'Aço Inox Escovado',
    base_price: 189.0,
    base_cost: 48.0,
    active: true,
  },
  {
    id: 'mod-3',
    name: 'Cartão Madeira Bambu NFC Sustentável',
    description: 'Madeira ecológica tratada a laser com acabamento rústico',
    material: 'Bambu Tratado + Chip NFC',
    base_price: 139.0,
    base_cost: 32.0,
    active: true,
  },
  {
    id: 'mod-4',
    name: 'Tag Epóxi NFC Mini 30mm',
    description: 'Adesivo resinado à prova dágua com camada anti-metal',
    material: 'Epóxi Resinado + Shield Anti-Metal',
    base_price: 49.0,
    base_cost: 9.5,
    active: true,
  },
  {
    id: 'mod-5',
    name: 'Display Balcão Acrílico NFC Premium',
    description: 'Totem de balcão para estabelecimentos e clínicas',
    material: 'Acrílico Cristal 3mm + Impressão UV',
    base_price: 249.0,
    base_cost: 65.0,
    active: true,
  },
];

const DEFAULT_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-1',
    name: 'Chip NFC NTAG213/216 Universal',
    sku: 'CHIP-NTAG-216',
    category: 'Chips NFC',
    unit: 'un',
    quantity: 150,
    min_quantity: 40,
    cost_per_unit: 4.8,
    location: 'Gaveta B1 - Laboratório',
    notes: 'Compatível com todos iOS e Android',
  },
  {
    id: 'inv-2',
    name: 'Cartão PVC Preto Fosco Virgem',
    sku: 'CRD-PVC-MATTE',
    category: 'Cartões Brutos',
    unit: 'un',
    quantity: 85,
    min_quantity: 25,
    cost_per_unit: 9.2,
    location: 'Prateleira 1 - Estoque',
    notes: 'Pronto para máquina laser fiber',
  },
  {
    id: 'inv-3',
    name: 'Cartão Metal Aço Escovado Black',
    sku: 'CRD-MTL-STEEL',
    category: 'Cartões Brutos',
    unit: 'un',
    quantity: 28,
    min_quantity: 10,
    cost_per_unit: 34.5,
    location: 'Gaveta A2 - Cofre',
    notes: 'Acabamento premium sem pintura externa',
  },
  {
    id: 'inv-4',
    name: 'Cartão Madeira Bambu Natural',
    sku: 'CRD-WOOD-BAMBOO',
    category: 'Cartões Brutos',
    unit: 'un',
    quantity: 32,
    min_quantity: 12,
    cost_per_unit: 22.0,
    location: 'Prateleira 1 - Madeira',
    notes: 'Tratado contra umidade',
  },
  {
    id: 'inv-5',
    name: 'Tag Epóxi Resina 30mm Anti-metal',
    sku: 'TAG-EPX-30',
    category: 'Tags/Adesivos',
    unit: 'un',
    quantity: 120,
    min_quantity: 35,
    cost_per_unit: 5.2,
    location: 'Gaveta B2 - Tags',
    notes: 'Com camada protetora ferrite',
  },
  {
    id: 'inv-6',
    name: 'Placa Acrílico Cristal 3mm Balcão',
    sku: 'DSP-ACR-BALCAO',
    category: 'Displays',
    unit: 'un',
    quantity: 18,
    min_quantity: 5,
    cost_per_unit: 42.0,
    location: 'Prateleira 3 - Displays',
    notes: 'Tamanho A6 vertical com base dobrada',
  },
  {
    id: 'inv-7',
    name: 'Embalagem Box Premium Vulto Tap',
    sku: 'BOX-VULTO-TAP',
    category: 'Embalagens',
    unit: 'un',
    quantity: 95,
    min_quantity: 30,
    cost_per_unit: 6.5,
    location: 'Caixa Armário 4',
    notes: 'Caixa rígida preta personalizada',
  },
];

const DEFAULT_ORDERS: VultoTapOrder[] = [
  {
    id: 'ord-101',
    client_id: null,
    customer_name: 'Studio Arquitetura & Interiores',
    quantity: 5,
    model_id: 'mod-1',
    model_name: 'Cartão PVC Black Matte NFC',
    destination_type: 'profile',
    destination_url: 'https://vulto.bio/studioarq',
    unit_price: 89.0,
    total_price: 445.0,
    unit_cost: 18.0,
    total_cost: 90.0,
    profit: 355.0,
    margin: 79.7,
    status: 'delivered',
    responsible_user_id: 'felipe',
    responsible_name: 'Felipe Ramos',
    order_date: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0],
    delivery_date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    notes: 'Gravação da logo vetorizada no verso e nome dos sócios na frente.',
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: 'ord-102',
    client_id: null,
    customer_name: 'Clínica Dr. Marcos Prado',
    quantity: 2,
    model_id: 'mod-2',
    model_name: 'Cartão Metal Black NFC Luxo',
    destination_type: 'vcard',
    destination_url: 'https://vultolab.company/tap/marcosprado',
    unit_price: 189.0,
    total_price: 378.0,
    unit_cost: 48.0,
    total_cost: 96.0,
    profit: 282.0,
    margin: 74.6,
    status: 'production',
    responsible_user_id: 'pietro',
    responsible_name: 'Pietro Fontana',
    order_date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    delivery_date: null,
    notes: 'Aço escovado preto, gravação a laser com precisão alta.',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'ord-103',
    client_id: null,
    customer_name: 'Boutique Café & Co.',
    quantity: 2,
    model_id: 'mod-5',
    model_name: 'Display Balcão Acrílico NFC Premium',
    destination_type: 'cardapio',
    destination_url: 'https://menu.boutiquecafe.com.br',
    unit_price: 249.0,
    total_price: 498.0,
    unit_cost: 65.0,
    total_cost: 130.0,
    profit: 368.0,
    margin: 73.8,
    status: 'ready',
    responsible_user_id: 'felipe',
    responsible_name: 'Felipe Ramos',
    order_date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
    delivery_date: null,
    notes: 'Cardápio digital via NFC + QR Code de contingência no verso.',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'ord-104',
    client_id: null,
    customer_name: 'Advocacia Pinheiro & Silva',
    quantity: 10,
    model_id: 'mod-1',
    model_name: 'Cartão PVC Black Matte NFC',
    destination_type: 'vcard',
    destination_url: 'https://vulto.bio/pinheirosilva',
    unit_price: 85.0,
    total_price: 850.0,
    unit_cost: 18.0,
    total_cost: 180.0,
    profit: 670.0,
    margin: 78.8,
    status: 'design',
    responsible_user_id: 'pietro',
    responsible_name: 'Pietro Fontana',
    order_date: new Date().toISOString().split('T')[0],
    delivery_date: null,
    notes: 'Aguardando aprovação do layout com tipografia dourada.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'ord-105',
    client_id: null,
    customer_name: 'EcoResort Chapada',
    quantity: 30,
    model_id: 'mod-3',
    model_name: 'Cartão Madeira Bambu NFC Sustentável',
    destination_type: 'url',
    destination_url: 'https://ecochapada.com.br/guest',
    unit_price: 120.0,
    total_price: 3600.0,
    unit_cost: 32.0,
    total_cost: 960.0,
    profit: 2640.0,
    margin: 73.3,
    status: 'new',
    responsible_user_id: 'felipe',
    responsible_name: 'Felipe Ramos',
    order_date: new Date().toISOString().split('T')[0],
    delivery_date: null,
    notes: 'Chaves de quarto ecológicas com identificador NFC individual.',
    created_at: new Date().toISOString(),
  },
];

// Helper local in-memory storage fallback
const LOCAL_STORAGE_KEY_ORDERS = 'vulto_tap_orders_cache';
const LOCAL_STORAGE_KEY_ITEMS = 'vulto_tap_inventory_cache';
const LOCAL_STORAGE_KEY_MODELS = 'vulto_tap_models_cache';
const LOCAL_STORAGE_KEY_MOVEMENTS = 'vulto_tap_movements_cache';

function getLocalOrders(): VultoTapOrder[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_ORDERS);
    return raw ? JSON.parse(raw) : DEFAULT_ORDERS;
  } catch {
    return DEFAULT_ORDERS;
  }
}

function saveLocalOrders(orders: VultoTapOrder[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_ORDERS, JSON.stringify(orders));
  } catch {}
}

function getLocalInventory(): InventoryItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_ITEMS);
    return raw ? JSON.parse(raw) : DEFAULT_INVENTORY;
  } catch {
    return DEFAULT_INVENTORY;
  }
}

function saveLocalInventory(items: InventoryItem[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_ITEMS, JSON.stringify(items));
  } catch {}
}

function getLocalModels(): VultoTapModel[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_MODELS);
    return raw ? JSON.parse(raw) : DEFAULT_MODELS;
  } catch {
    return DEFAULT_MODELS;
  }
}

function saveLocalModels(models: VultoTapModel[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_MODELS, JSON.stringify(models));
  } catch {}
}

function getLocalMovements(): InventoryMovement[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_MOVEMENTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalMovements(movements: InventoryMovement[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_MOVEMENTS, JSON.stringify(movements));
  } catch {}
}

// -------------------------------------------------------------
// MODELS SERVICES (vulto_tap_models)
// -------------------------------------------------------------
export async function fetchVultoTapModels(): Promise<VultoTapModel[]> {
  if (!isSupabaseConfigured) {
    return getLocalModels();
  }

  try {
    const { data, error } = await supabase
      .from('vulto_tap_models')
      .select('*')
      .order('name', { ascending: true });

    if (error || !data || data.length === 0) {
      return getLocalModels();
    }

    return data.map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      material: item.material,
      base_price: Number(item.base_price || 0),
      base_cost: Number(item.base_cost || 0),
      active: item.active !== false,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }));
  } catch {
    return getLocalModels();
  }
}

export async function createVultoTapModel(
  model: Omit<VultoTapModel, 'id'>
): Promise<{ data: VultoTapModel | null; error: string | null }> {
  if (!isSupabaseConfigured) {
    const newModel: VultoTapModel = {
      ...model,
      id: `mod-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    const current = getLocalModels();
    const updated = [newModel, ...current];
    saveLocalModels(updated);
    return { data: newModel, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('vulto_tap_models')
      .insert([
        {
          name: model.name,
          description: model.description || null,
          material: model.material || null,
          base_price: model.base_price,
          base_cost: model.base_cost,
          active: model.active ?? true,
        },
      ])
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    await logActivity('MODELO_TAP_CRIADO', `Novo modelo cadastrado: ${model.name}`);
    return {
      data: {
        id: data.id,
        name: data.name,
        description: data.description,
        material: data.material,
        base_price: Number(data.base_price || 0),
        base_cost: Number(data.base_cost || 0),
        active: data.active,
        created_at: data.created_at,
      },
      error: null,
    };
  } catch (err: any) {
    return { data: null, error: err.message || 'Erro ao criar modelo' };
  }
}

export async function updateVultoTapModel(
  id: string,
  updates: Partial<VultoTapModel>
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured) {
    const current = getLocalModels();
    const updated = current.map((m) => (m.id === id ? { ...m, ...updates } : m));
    saveLocalModels(updated);
    return { success: true, error: null };
  }

  try {
    const { error } = await supabase
      .from('vulto_tap_models')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao atualizar modelo' };
  }
}

export async function deleteVultoTapModel(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured) {
    const current = getLocalModels();
    saveLocalModels(current.filter((m) => m.id !== id));
    return { success: true, error: null };
  }

  try {
    const { error } = await supabase.from('vulto_tap_models').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao remover modelo' };
  }
}

// -------------------------------------------------------------
// INVENTORY SERVICES (inventory_items & inventory_movements)
// -------------------------------------------------------------
export async function fetchInventoryItems(): Promise<InventoryItem[]> {
  if (!isSupabaseConfigured) {
    return getLocalInventory();
  }

  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .order('name', { ascending: true });

    if (error || !data || data.length === 0) {
      return getLocalInventory();
    }

    return data.map((item: any) => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      category: item.category,
      unit: item.unit || 'un',
      quantity: Number(item.quantity || 0),
      min_quantity: Number(item.min_quantity || 0),
      cost_per_unit: Number(item.cost_per_unit || 0),
      location: item.location,
      notes: item.notes,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }));
  } catch {
    return getLocalInventory();
  }
}

export async function createInventoryItem(
  item: Omit<InventoryItem, 'id'>
): Promise<{ data: InventoryItem | null; error: string | null }> {
  if (!isSupabaseConfigured) {
    const newItem: InventoryItem = {
      ...item,
      id: `inv-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    const current = getLocalInventory();
    const updated = [newItem, ...current];
    saveLocalInventory(updated);
    return { data: newItem, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .insert([
        {
          name: item.name,
          sku: item.sku || null,
          category: item.category || 'Outros',
          unit: item.unit || 'un',
          quantity: item.quantity,
          min_quantity: item.min_quantity,
          cost_per_unit: item.cost_per_unit,
          location: item.location || null,
          notes: item.notes || null,
        },
      ])
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    await logActivity('ESTOQUE_ITEM_CRIADO', `Item cadastrado no estoque: ${item.name} (${item.quantity} ${item.unit})`);
    return {
      data: {
        id: data.id,
        name: data.name,
        sku: data.sku,
        category: data.category,
        unit: data.unit,
        quantity: Number(data.quantity || 0),
        min_quantity: Number(data.min_quantity || 0),
        cost_per_unit: Number(data.cost_per_unit || 0),
        location: data.location,
        notes: data.notes,
        created_at: data.created_at,
      },
      error: null,
    };
  } catch (err: any) {
    return { data: null, error: err.message || 'Erro ao criar item de estoque' };
  }
}

export async function updateInventoryItem(
  id: string,
  updates: Partial<InventoryItem>
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured) {
    const current = getLocalInventory();
    const updated = current.map((i) => (i.id === id ? { ...i, ...updates } : i));
    saveLocalInventory(updated);
    return { success: true, error: null };
  }

  try {
    const { error } = await supabase
      .from('inventory_items')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao atualizar item' };
  }
}

export async function deleteInventoryItem(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured) {
    const current = getLocalInventory();
    saveLocalInventory(current.filter((i) => i.id !== id));
    return { success: true, error: null };
  }

  try {
    const { error } = await supabase.from('inventory_items').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao excluir item' };
  }
}

export async function fetchInventoryMovements(
  itemId?: string
): Promise<InventoryMovement[]> {
  if (!isSupabaseConfigured) {
    const movements = getLocalMovements();
    if (itemId) return movements.filter((m) => m.item_id === itemId);
    return movements;
  }

  try {
    let query = supabase
      .from('inventory_movements')
      .select('*, inventory_items(name)')
      .order('created_at', { ascending: false });

    if (itemId) {
      query = query.eq('item_id', itemId);
    }

    const { data, error } = await query;
    if (error || !data) return getLocalMovements();

    return data.map((item: any) => ({
      id: item.id,
      item_id: item.item_id,
      item_name: item.inventory_items?.name || 'Item',
      type: item.type,
      quantity: Number(item.quantity || 0),
      cost_per_unit: Number(item.cost_per_unit || 0),
      reference_order_id: item.reference_order_id,
      notes: item.notes,
      created_by: item.created_by,
      created_at: item.created_at,
    }));
  } catch {
    return getLocalMovements();
  }
}

export async function recordInventoryMovement(params: {
  itemId: string;
  itemName?: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  cost_per_unit?: number;
  reference_order_id?: string | null;
  notes?: string;
  syncExpense?: boolean; // Se type === 'in', permite criar despesa automática no Financeiro
}): Promise<{ success: boolean; error: string | null }> {
  const qty = Math.abs(Number(params.quantity) || 0);
  const cost = Number(params.cost_per_unit) || 0;

  if (qty <= 0) {
    return { success: false, error: 'Quantidade deve ser maior que zero' };
  }

  if (!isSupabaseConfigured) {
    // Atualizar estoque local
    const items = getLocalInventory();
    const updatedItems = items.map((i) => {
      if (i.id === params.itemId) {
        let newQty = i.quantity;
        if (params.type === 'in') newQty += qty;
        else if (params.type === 'out') newQty = Math.max(0, newQty - qty);
        else if (params.type === 'adjustment') newQty = qty;

        return {
          ...i,
          quantity: newQty,
          cost_per_unit: cost > 0 ? cost : i.cost_per_unit,
        };
      }
      return i;
    });
    saveLocalInventory(updatedItems);

    const movement: InventoryMovement = {
      id: `mov-${Date.now()}`,
      item_id: params.itemId,
      item_name: params.itemName || 'Item',
      type: params.type,
      quantity: qty,
      cost_per_unit: cost,
      reference_order_id: params.reference_order_id || null,
      notes: params.notes || null,
      created_by: 'admin',
      created_at: new Date().toISOString(),
    };
    const movements = getLocalMovements();
    saveLocalMovements([movement, ...movements]);

    return { success: true, error: null };
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. Inserir movimentação no Supabase
    const { error: moveErr } = await supabase.from('inventory_movements').insert([
      {
        item_id: params.itemId,
        type: params.type,
        quantity: qty,
        cost_per_unit: cost,
        reference_order_id: params.reference_order_id || null,
        notes: params.notes || null,
        created_by: user?.id || null,
        created_at: new Date().toISOString(),
      },
    ]);

    if (moveErr) {
      return { success: false, error: moveErr.message };
    }

    // 2. Se não houver trigger configurado no banco ainda, garantir atualização direta de inventory_items
    const { data: currentItem } = await supabase
      .from('inventory_items')
      .select('quantity, cost_per_unit')
      .eq('id', params.itemId)
      .single();

    if (currentItem) {
      let finalQuantity = Number(currentItem.quantity || 0);
      if (params.type === 'in') finalQuantity += qty;
      else if (params.type === 'out') finalQuantity = Math.max(0, finalQuantity - qty);
      else if (params.type === 'adjustment') finalQuantity = qty;

      await supabase
        .from('inventory_items')
        .update({
          quantity: finalQuantity,
          cost_per_unit: cost > 0 ? cost : currentItem.cost_per_unit,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.itemId);
    }

    // 3. Se solicitado, sincronizar como despesa de reposição no financeiro
    if (params.syncExpense && params.type === 'in' && cost > 0) {
      const totalExpenseAmount = qty * cost;
      await supabase.from('expenses').insert([
        {
          category: 'VULTO TAP',
          description: `Reposição de Estoque: ${params.itemName || 'Materiais NFC'} (${qty} un)`,
          amount: totalExpenseAmount,
          date: new Date().toISOString().split('T')[0],
          responsible_id: user?.id || null,
          created_at: new Date().toISOString(),
        },
      ]);

      await logActivity(
        'FINANCEIRO_DESPESA_ESTOQUE',
        `Despesa gerada por compra de insumo VULTO TAP: R$ ${totalExpenseAmount.toLocaleString('pt-BR')} (${params.itemName || 'Estoque'})`
      );
    }

    await logActivity(
      'ESTOQUE_MOVIMENTO',
      `Movimento de estoque (${params.type.toUpperCase()}): ${qty} un - ${params.itemName || params.itemId}`
    );

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao registrar movimento' };
  }
}

// -------------------------------------------------------------
// ORDERS SERVICES (vulto_tap_orders)
// -------------------------------------------------------------
export async function fetchVultoTapOrders(): Promise<VultoTapOrder[]> {
  if (!isSupabaseConfigured) {
    return getLocalOrders();
  }

  try {
    const { data, error } = await supabase
      .from('vulto_tap_orders')
      .select('*, clients(company_name, contact_name), vulto_tap_models(name)')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return getLocalOrders();
    }

    return data.map((item: any) => {
      const qty = Number(item.quantity || 1);
      const unitPrice = Number(item.unit_price || 0);
      const totalPrice = Number(item.total_price || unitPrice * qty);
      const unitCost = Number(item.unit_cost || 0);
      const totalCost = Number(item.total_cost || unitCost * qty);
      const profit = Number(item.profit || totalPrice - totalCost);
      const margin =
        item.margin !== undefined && item.margin !== null
          ? Number(item.margin)
          : totalPrice > 0
          ? Math.round((profit / totalPrice) * 100)
          : 0;

      return {
        id: item.id,
        client_id: item.client_id,
        client_name: item.clients?.company_name || item.customer_name,
        customer_name: item.customer_name || 'Cliente',
        quantity: qty,
        model_id: item.model_id,
        model_name: item.vulto_tap_models?.name || 'Modelo NFC',
        destination_type: item.destination_type || 'url',
        destination_url: item.destination_url,
        unit_price: unitPrice,
        total_price: totalPrice,
        unit_cost: unitCost,
        total_cost: totalCost,
        profit,
        margin,
        status: (item.status || 'new') as VultoTapOrderStatus,
        responsible_user_id: item.responsible_user_id,
        responsible_name: item.responsible_user_id ? 'Responsável' : 'Equipe',
        order_date: item.order_date || new Date().toISOString().split('T')[0],
        delivery_date: item.delivery_date,
        notes: item.notes,
        created_at: item.created_at,
        updated_at: item.updated_at,
      };
    });
  } catch {
    return getLocalOrders();
  }
}

export async function createVultoTapOrder(params: {
  customer_name: string;
  client_id?: string | null;
  model_id?: string | null;
  model_name?: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  destination_type: string;
  destination_url?: string | null;
  order_date: string;
  delivery_date?: string | null;
  notes?: string | null;
  responsible_user_id?: string | null;
  syncSale?: boolean; // Se marcado, insere venda em sales
  deductStockItems?: { itemId: string; itemName: string; quantity: number }[];
}): Promise<{ data: VultoTapOrder | null; error: string | null }> {
  const quantity = Math.max(1, Number(params.quantity) || 1);
  const unitPrice = Number(params.unit_price) || 0;
  const totalPrice = unitPrice * quantity;
  const unitCost = Number(params.unit_cost) || 0;
  const totalCost = unitCost * quantity;
  const profit = totalPrice - totalCost;
  const margin = totalPrice > 0 ? Number(((profit / totalPrice) * 100).toFixed(1)) : 0;

  if (!isSupabaseConfigured) {
    const newOrder: VultoTapOrder = {
      id: `ord-${Date.now()}`,
      client_id: params.client_id || null,
      customer_name: params.customer_name,
      quantity,
      model_id: params.model_id || null,
      model_name: params.model_name || 'Modelo NFC',
      destination_type: params.destination_type,
      destination_url: params.destination_url || null,
      unit_price: unitPrice,
      total_price: totalPrice,
      unit_cost: unitCost,
      total_cost: totalCost,
      profit,
      margin,
      status: 'new',
      responsible_user_id: params.responsible_user_id || 'felipe',
      responsible_name: params.responsible_user_id === 'pietro' ? 'Pietro Fontana' : 'Felipe Ramos',
      order_date: params.order_date,
      delivery_date: params.delivery_date || null,
      notes: params.notes || null,
      created_at: new Date().toISOString(),
    };

    const current = getLocalOrders();
    saveLocalOrders([newOrder, ...current]);

    // Baixa de estoque se especificada
    if (params.deductStockItems && params.deductStockItems.length > 0) {
      params.deductStockItems.forEach((d) => {
        recordInventoryMovement({
          itemId: d.itemId,
          itemName: d.itemName,
          type: 'out',
          quantity: d.quantity,
          reference_order_id: newOrder.id,
          notes: `Baixa automática do pedido #${newOrder.id} (${params.customer_name})`,
        });
      });
    }

    return { data: newOrder, error: null };
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload = {
      client_id: params.client_id || null,
      customer_name: params.customer_name,
      quantity,
      model_id: params.model_id || null,
      destination_type: params.destination_type || 'url',
      destination_url: params.destination_url || null,
      unit_price: unitPrice,
      total_price: totalPrice,
      unit_cost: unitCost,
      total_cost: totalCost,
      profit,
      margin,
      status: 'new',
      responsible_user_id: params.responsible_user_id || user?.id || null,
      order_date: params.order_date || new Date().toISOString().split('T')[0],
      delivery_date: params.delivery_date || null,
      notes: params.notes || null,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('vulto_tap_orders')
      .insert([payload])
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    // 1. Integrar financeiro (criar venda em sales se solicitado)
    if (params.syncSale && totalPrice > 0) {
      await supabase.from('sales').insert([
        {
          client_id: params.client_id || null,
          amount: totalPrice,
          status: 'paid',
          date: params.order_date,
          notes: `Pedido VULTO TAP #${data.id.slice(0, 8)}: ${params.customer_name} (${quantity} un)`,
          created_at: new Date().toISOString(),
        },
      ]);

      await logActivity(
        'VENDA_VULTO_TAP',
        `Entrada financeira gerada por pedido VULTO TAP: R$ ${totalPrice.toLocaleString('pt-BR')} (${params.customer_name})`
      );
    }

    // 2. Dar baixa de itens de estoque se fornecido
    if (params.deductStockItems && params.deductStockItems.length > 0) {
      for (const itemDeduct of params.deductStockItems) {
        await recordInventoryMovement({
          itemId: itemDeduct.itemId,
          itemName: itemDeduct.itemName,
          type: 'out',
          quantity: itemDeduct.quantity,
          reference_order_id: data.id,
          notes: `Baixa do pedido VULTO TAP #${data.id.slice(0, 8)} (${params.customer_name})`,
        });
      }
    }

    await logActivity(
      'PEDIDO_TAP_CRIADO',
      `Novo pedido VULTO TAP registrado: ${params.customer_name} (${quantity} un - R$ ${totalPrice.toLocaleString('pt-BR')})`
    );

    return {
      data: {
        id: data.id,
        client_id: data.client_id,
        customer_name: data.customer_name,
        quantity: Number(data.quantity),
        model_id: data.model_id,
        model_name: params.model_name || 'Modelo NFC',
        destination_type: data.destination_type,
        destination_url: data.destination_url,
        unit_price: Number(data.unit_price),
        total_price: Number(data.total_price),
        unit_cost: Number(data.unit_cost),
        total_cost: Number(data.total_cost),
        profit: Number(data.profit),
        margin: Number(data.margin),
        status: data.status as VultoTapOrderStatus,
        responsible_user_id: data.responsible_user_id,
        order_date: data.order_date,
        delivery_date: data.delivery_date,
        notes: data.notes,
        created_at: data.created_at,
      },
      error: null,
    };
  } catch (err: any) {
    return { data: null, error: err.message || 'Erro ao registrar pedido' };
  }
}

export async function updateVultoTapOrderStatus(
  orderId: string,
  newStatus: VultoTapOrderStatus,
  customerName?: string
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured) {
    const orders = getLocalOrders();
    const updated = orders.map((o) =>
      o.id === orderId
        ? {
            ...o,
            status: newStatus,
            delivery_date:
              newStatus === 'delivered' && !o.delivery_date
                ? newDateStr()
                : o.delivery_date,
            updated_at: new Date().toISOString(),
          }
        : o
    );
    saveLocalOrders(updated);
    return { success: true, error: null };
  }

  try {
    const updatePayload: any = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === 'delivered') {
      updatePayload.delivery_date = newDateStr();
    }

    const { error } = await supabase
      .from('vulto_tap_orders')
      .update(updatePayload)
      .eq('id', orderId);

    if (error) return { success: false, error: error.message };

    await logActivity(
      'PEDIDO_TAP_STATUS',
      `Pedido "${customerName || orderId}" avançou para etapa ${newStatus.toUpperCase()}`
    );

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao atualizar status' };
  }
}

export async function updateVultoTapOrder(
  orderId: string,
  updates: Partial<VultoTapOrder>
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured) {
    const orders = getLocalOrders();
    const updated = orders.map((o) => (o.id === orderId ? { ...o, ...updates } : o));
    saveLocalOrders(updated);
    return { success: true, error: null };
  }

  try {
    const { error } = await supabase
      .from('vulto_tap_orders')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao atualizar pedido' };
  }
}

export async function deleteVultoTapOrder(
  orderId: string
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured) {
    const orders = getLocalOrders();
    saveLocalOrders(orders.filter((o) => o.id !== orderId));
    return { success: true, error: null };
  }

  try {
    const { error } = await supabase.from('vulto_tap_orders').delete().eq('id', orderId);
    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao excluir pedido' };
  }
}

// -------------------------------------------------------------
// METRICS CALCULATOR
// -------------------------------------------------------------
export function calculateVultoTapMetrics(orders: VultoTapOrder[]): VultoTapMetrics {
  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const monthOrders = orders.filter(
    (o) => o.order_date?.startsWith(currentMonthPrefix) && o.status !== 'cancelled'
  );

  const totalRevenue = monthOrders.reduce((acc, o) => acc + o.total_price, 0);
  const totalCost = monthOrders.reduce((acc, o) => acc + o.total_cost, 0);
  const totalProfit = totalRevenue - totalCost;
  const marginPercentage =
    totalRevenue > 0 ? Number(((totalProfit / totalRevenue) * 100).toFixed(1)) : 0;
  const averageTicket =
    monthOrders.length > 0 ? Math.round(totalRevenue / monthOrders.length) : 0;

  const inProductionCount = orders.filter(
    (o) => o.status === 'production' || o.status === 'design' || o.status === 'configuration'
  ).length;

  const readyCount = orders.filter((o) => o.status === 'ready').length;
  const deliveredCount = monthOrders.filter((o) => o.status === 'delivered').length;

  return {
    monthOrdersCount: monthOrders.length,
    totalRevenue,
    totalProfit,
    marginPercentage,
    averageTicket,
    inProductionCount,
    readyCount,
    deliveredCount,
  };
}

function newDateStr(): string {
  return new Date().toISOString().split('T')[0];
}
