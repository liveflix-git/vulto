-- ==============================================================================
-- VULTO LAB — CORE OS: MÓDULO VULTO TAP (PRODUTO FÍSICO & NFC)
-- Script SQL DDL + RLS + Triggers + Seed Inicial
-- Execute este script no SQL Editor do Supabase Console
-- ==============================================================================

-- 1. MODELOS DE PRODUTOS VULTO TAP (vulto_tap_models)
CREATE TABLE IF NOT EXISTS public.vulto_tap_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    material TEXT,
    base_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    base_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. ITENS DE ESTOQUE / MATÉRIAS-PRIMAS (inventory_items)
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sku TEXT,
    category TEXT, -- 'Chips NFC', 'Cartões Brutos', 'Tags/Adesivos', 'Displays', 'Embalagens', 'Outros'
    unit TEXT NOT NULL DEFAULT 'un',
    quantity INTEGER NOT NULL DEFAULT 0,
    min_quantity INTEGER NOT NULL DEFAULT 0,
    cost_per_unit NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    location TEXT, -- 'Armário A1', 'Bancada Gravação', 'Prateleira 2'
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. PEDIDOS VULTO TAP (vulto_tap_orders)
CREATE TABLE IF NOT EXISTS public.vulto_tap_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    model_id UUID REFERENCES public.vulto_tap_models(id) ON DELETE SET NULL,
    destination_type TEXT NOT NULL DEFAULT 'url', -- 'url' | 'profile' | 'cardapio' | 'vcard' | 'whatsapp' | 'outro'
    destination_url TEXT,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    unit_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    profit NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    margin NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'new', -- 'new' | 'design' | 'production' | 'configuration' | 'ready' | 'delivered' | 'cancelled'
    responsible_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    delivery_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. MOVIMENTAÇÕES DE ESTOQUE (inventory_movements)
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment')),
    quantity INTEGER NOT NULL,
    cost_per_unit NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    reference_order_id UUID REFERENCES public.vulto_tap_orders(id) ON DELETE SET NULL,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- GATILHOS (TRIGGERS) PARA ATUALIZAÇÃO AUTOMÁTICA
-- ==============================================================================

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_vulto_tap_models_updated ON public.vulto_tap_models;
CREATE TRIGGER trg_vulto_tap_models_updated
    BEFORE UPDATE ON public.vulto_tap_models
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_inventory_items_updated ON public.inventory_items;
CREATE TRIGGER trg_inventory_items_updated
    BEFORE UPDATE ON public.inventory_items
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_vulto_tap_orders_updated ON public.vulto_tap_orders;
CREATE TRIGGER trg_vulto_tap_orders_updated
    BEFORE UPDATE ON public.vulto_tap_orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para sincronizar saldo de estoque automaticamente ao inserir movimento
CREATE OR REPLACE FUNCTION public.apply_inventory_movement()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.type = 'in' THEN
        UPDATE public.inventory_items
        SET quantity = quantity + NEW.quantity,
            cost_per_unit = CASE WHEN NEW.cost_per_unit > 0 THEN NEW.cost_per_unit ELSE cost_per_unit END,
            updated_at = now()
        WHERE id = NEW.item_id;
    ELSIF NEW.type = 'out' THEN
        UPDATE public.inventory_items
        SET quantity = GREATEST(0, quantity - NEW.quantity),
            updated_at = now()
        WHERE id = NEW.item_id;
    ELSIF NEW.type = 'adjustment' THEN
        UPDATE public.inventory_items
        SET quantity = NEW.quantity,
            updated_at = now()
        WHERE id = NEW.item_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_apply_inventory_movement ON public.inventory_movements;
CREATE TRIGGER trg_apply_inventory_movement
    AFTER INSERT ON public.inventory_movements
    FOR EACH ROW EXECUTE FUNCTION public.apply_inventory_movement();

-- ==============================================================================
-- ÍNDICES DE PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_vulto_tap_orders_status ON public.vulto_tap_orders(status);
CREATE INDEX IF NOT EXISTS idx_vulto_tap_orders_client ON public.vulto_tap_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_vulto_tap_orders_model ON public.vulto_tap_orders(model_id);
CREATE INDEX IF NOT EXISTS idx_vulto_tap_orders_date ON public.vulto_tap_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON public.inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_item ON public.inventory_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_order ON public.inventory_movements(reference_order_id);

-- ==============================================================================
-- SEGURANÇA: ROW LEVEL SECURITY (RLS)
-- Todas as tabelas internas são restritas a usuários autenticados da Vulto Lab
-- ==============================================================================
ALTER TABLE public.vulto_tap_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vulto_tap_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- Políticas para vulto_tap_models
DROP POLICY IF EXISTS "auth_read_tap_models" ON public.vulto_tap_models;
CREATE POLICY "auth_read_tap_models" ON public.vulto_tap_models FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_write_tap_models" ON public.vulto_tap_models;
CREATE POLICY "auth_write_tap_models" ON public.vulto_tap_models FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Políticas para inventory_items
DROP POLICY IF EXISTS "auth_read_inventory_items" ON public.inventory_items;
CREATE POLICY "auth_read_inventory_items" ON public.inventory_items FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_write_inventory_items" ON public.inventory_items;
CREATE POLICY "auth_write_inventory_items" ON public.inventory_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Políticas para vulto_tap_orders
DROP POLICY IF EXISTS "auth_read_tap_orders" ON public.vulto_tap_orders;
CREATE POLICY "auth_read_tap_orders" ON public.vulto_tap_orders FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_write_tap_orders" ON public.vulto_tap_orders;
CREATE POLICY "auth_write_tap_orders" ON public.vulto_tap_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Políticas para inventory_movements
DROP POLICY IF EXISTS "auth_read_inventory_movements" ON public.inventory_movements;
CREATE POLICY "auth_read_inventory_movements" ON public.inventory_movements FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_write_inventory_movements" ON public.inventory_movements;
CREATE POLICY "auth_write_inventory_movements" ON public.inventory_movements FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- SEED INICIAL DE MODELOS E ITENS DE ESTOQUE DA VULTO LAB
-- ==============================================================================

-- Inserção de Modelos Oficiais VULTO TAP (se ainda não existirem)
INSERT INTO public.vulto_tap_models (name, description, material, base_price, base_cost, active)
SELECT 'Cartão PVC Black Matte NFC', 'Cartão corporativo preto fosco com gravação a laser premium', 'PVC Fosco + Chip NFC NTAG216', 89.00, 18.00, true
WHERE NOT EXISTS (SELECT 1 FROM public.vulto_tap_models WHERE name = 'Cartão PVC Black Matte NFC');

INSERT INTO public.vulto_tap_models (name, description, material, base_price, base_cost, active)
SELECT 'Cartão Metal Black NFC Luxo', 'Aço inoxidável escovado preto com gravação em baixo relevo', 'Aço Inox Escovado + Chip Alta Frequência', 189.00, 48.00, true
WHERE NOT EXISTS (SELECT 1 FROM public.vulto_tap_models WHERE name = 'Cartão Metal Black NFC Luxo');

INSERT INTO public.vulto_tap_models (name, description, material, base_price, base_cost, active)
SELECT 'Cartão Madeira Bambu NFC Sustentável', 'Madeira ecológica tratada a laser com acabamento rústico sofisticado', 'Bambu Tratado + Chip NFC Integrado', 139.00, 32.00, true
WHERE NOT EXISTS (SELECT 1 FROM public.vulto_tap_models WHERE name = 'Cartão Madeira Bambu NFC Sustentável');

INSERT INTO public.vulto_tap_models (name, description, material, base_price, base_cost, active)
SELECT 'Tag Epóxi NFC Mini 30mm', 'Adesivo resinado à prova d''água e com camada anti-metal para celulares', 'Epóxi Resinado + Anti-Metal Shield', 49.00, 9.50, true
WHERE NOT EXISTS (SELECT 1 FROM public.vulto_tap_models WHERE name = 'Tag Epóxi NFC Mini 30mm');

INSERT INTO public.vulto_tap_models (name, description, material, base_price, base_cost, active)
SELECT 'Display Balcão Acrílico NFC Premium', 'Totem de balcão para estabelecimentos comerciais, clínicas e recepções', 'Acrílico Cristal 3mm + Impressão UV', 249.00, 65.00, true
WHERE NOT EXISTS (SELECT 1 FROM public.vulto_tap_models WHERE name = 'Display Balcão Acrílico NFC Premium');

-- Inserção de Itens Iniciais no Inventário de Materiais
INSERT INTO public.inventory_items (name, sku, category, unit, quantity, min_quantity, cost_per_unit, location, notes)
SELECT 'Chip NFC NTAG213/216 Universal', 'CHIP-NTAG-216', 'Chips NFC', 'un', 150, 40, 4.80, 'Gaveta B1 - Laboratório', 'Compatível com todos iOS e Android modernos'
WHERE NOT EXISTS (SELECT 1 FROM public.inventory_items WHERE sku = 'CHIP-NTAG-216');

INSERT INTO public.inventory_items (name, sku, category, unit, quantity, min_quantity, cost_per_unit, location, notes)
SELECT 'Cartão PVC Preto Fosco Virgem', 'CRD-PVC-MATTE', 'Cartões Brutos', 'un', 85, 25, 9.20, 'Prateleira 1 - Estoque Físico', 'Pronto para máquina laser fiber'
WHERE NOT EXISTS (SELECT 1 FROM public.inventory_items WHERE sku = 'CRD-PVC-MATTE');

INSERT INTO public.inventory_items (name, sku, category, unit, quantity, min_quantity, cost_per_unit, location, notes)
SELECT 'Cartão Metal Aço Escovado Black', 'CRD-MTL-STEEL', 'Cartões Brutos', 'un', 28, 10, 34.50, 'Gaveta A2 - Cofre', 'Acabamento premium sem pintura externa'
WHERE NOT EXISTS (SELECT 1 FROM public.inventory_items WHERE sku = 'CRD-MTL-STEEL');

INSERT INTO public.inventory_items (name, sku, category, unit, quantity, min_quantity, cost_per_unit, location, notes)
SELECT 'Cartão Madeira Bambu Natural', 'CRD-WOOD-BAMBOO', 'Cartões Brutos', 'un', 32, 12, 22.00, 'Prateleira 1 - Madeira', 'Tratado contra umidade'
WHERE NOT EXISTS (SELECT 1 FROM public.inventory_items WHERE sku = 'CRD-WOOD-BAMBOO');

INSERT INTO public.inventory_items (name, sku, category, unit, quantity, min_quantity, cost_per_unit, location, notes)
SELECT 'Tag Epóxi Resina 30mm Anti-metal', 'TAG-EPX-30', 'Tags/Adesivos', 'un', 120, 35, 5.20, 'Gaveta B2 - Tags', 'Com camada protetora ferrite'
WHERE NOT EXISTS (SELECT 1 FROM public.inventory_items WHERE sku = 'TAG-EPX-30');

INSERT INTO public.inventory_items (name, sku, category, unit, quantity, min_quantity, cost_per_unit, location, notes)
SELECT 'Placa Acrílico Cristal 3mm Balcão', 'DSP-ACR-BALCAO', 'Displays', 'un', 18, 5, 42.00, 'Prateleira 3 - Displays', 'Tamanho A6 vertical com base dobrada'
WHERE NOT EXISTS (SELECT 1 FROM public.inventory_items WHERE sku = 'DSP-ACR-BALCAO');

INSERT INTO public.inventory_items (name, sku, category, unit, quantity, min_quantity, cost_per_unit, location, notes)
SELECT 'Embalagem Box Premium Vulto Tap', 'BOX-VULTO-TAP', 'Embalagens', 'un', 95, 30, 6.50, 'Caixa Armário 4', 'Caixa rígida preta personalizada'
WHERE NOT EXISTS (SELECT 1 FROM public.inventory_items WHERE sku = 'BOX-VULTO-TAP');
