-- ==============================================================================
-- VULTO LAB — CORE OS: MÓDULO METAS & PLANEJAMENTO COMERCIAL
-- Script SQL DDL + RLS + Triggers + Seed Inicial
-- Execute este script no SQL Editor do Supabase Console
-- ==============================================================================

-- 1. TABELA GOALS (SE JÁ NÃO EXISTIR OU GARANTIR CAMPOS ADICIONAIS)
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL, -- 'monthly', 'daily', 'quarterly', 'yearly'
    target_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    title TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Garantir colunas title e notes caso a tabela já tenha sido criada anteriormente
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 2. TABELA SERVICE GOAL TARGETS (PLANEJAMENTO POR SERVIÇO)
CREATE TABLE IF NOT EXISTS public.goal_service_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    service_name TEXT NOT NULL,
    target_quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_expected NUMERIC(12, 2) GENERATED ALWAYS AS (target_quantity * unit_price) STORED,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_goals_type_dates ON public.goals(type, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_goal_service_targets_goal ON public.goal_service_targets(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_service_targets_service ON public.goal_service_targets(service_id);

-- Habilitar RLS
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_service_targets ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para administradores autenticados
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'goals' AND policyname = 'Allow authenticated read on goals'
    ) THEN
        CREATE POLICY "Allow authenticated read on goals"
            ON public.goals FOR SELECT
            TO authenticated
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'goals' AND policyname = 'Allow authenticated write on goals'
    ) THEN
        CREATE POLICY "Allow authenticated write on goals"
            ON public.goals FOR ALL
            TO authenticated
            USING (true)
            WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'goal_service_targets' AND policyname = 'Allow authenticated read on goal_service_targets'
    ) THEN
        CREATE POLICY "Allow authenticated read on goal_service_targets"
            ON public.goal_service_targets FOR SELECT
            TO authenticated
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'goal_service_targets' AND policyname = 'Allow authenticated write on goal_service_targets'
    ) THEN
        CREATE POLICY "Allow authenticated write on goal_service_targets"
            ON public.goal_service_targets FOR ALL
            TO authenticated
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- 3. TRIGGER PARA ATUALIZAR UPDATED_AT
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at_goals()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_goals ON public.goals;
CREATE TRIGGER set_updated_at_goals
    BEFORE UPDATE ON public.goals
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_set_updated_at_goals();

DROP TRIGGER IF EXISTS set_updated_at_goal_service_targets ON public.goal_service_targets;
CREATE TRIGGER set_updated_at_goal_service_targets
    BEFORE UPDATE ON public.goal_service_targets
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_set_updated_at_goals();

-- 4. SEED INICIAL DE EXEMPLO (MÊS CORRENTE) CASO A TABELA ESTEJA VAZIA
DO $$
DECLARE
    current_month_start DATE := date_trunc('month', CURRENT_DATE)::DATE;
    current_month_end DATE := (date_trunc('month', CURRENT_DATE) + interval '1 month - 1 day')::DATE;
    current_today DATE := CURRENT_DATE;
    monthly_goal_id UUID;
    vulto_tap_srv_id UUID;
    paid_media_srv_id UUID;
    sites_srv_id UUID;
BEGIN
    -- Se não existir meta para o mês atual, cria
    IF NOT EXISTS (
        SELECT 1 FROM public.goals 
        WHERE type = 'monthly' 
          AND start_date <= current_today 
          AND end_date >= current_today
    ) THEN
        INSERT INTO public.goals (type, target_amount, start_date, end_date, title, notes)
        VALUES ('monthly', 50000.00, current_month_start, current_month_end, 'Meta Mensal de Faturamento', 'Plano comercial da Vulto Lab')
        RETURNING id INTO monthly_goal_id;

        -- Localizar IDs dos serviços se existirem
        SELECT id INTO paid_media_srv_id FROM public.services WHERE name ILIKE '%Paid Media%' OR name ILIKE '%Tráfego%' LIMIT 1;
        SELECT id INTO sites_srv_id FROM public.services WHERE name ILIKE '%Sites%' OR name ILIKE '%Sistemas%' LIMIT 1;
        SELECT id INTO vulto_tap_srv_id FROM public.services WHERE name ILIKE '%Vulto Tap%' OR name ILIKE '%NFC%' LIMIT 1;

        -- Inserir planejamento por serviço inicial
        INSERT INTO public.goal_service_targets (goal_id, service_id, service_name, target_quantity, unit_price, notes)
        VALUES 
            (monthly_goal_id, paid_media_srv_id, 'Paid Media / Tráfego Pago', 5, 3500.00, 'Gestão de tráfego e growth'),
            (monthly_goal_id, sites_srv_id, 'Sites & Landing Pages', 3, 5500.00, 'Projetos sob medida'),
            (monthly_goal_id, vulto_tap_srv_id, 'VULTO TAP (NFC)', 40, 400.00, 'Hardware e ativações físicas');
    END IF;

    -- Se não existir meta diária de hoje, cria
    IF NOT EXISTS (
        SELECT 1 FROM public.goals 
        WHERE type = 'daily' 
          AND start_date = current_today
    ) THEN
        INSERT INTO public.goals (type, target_amount, start_date, end_date, title, notes)
        VALUES ('daily', 2000.00, current_today, current_today, 'Meta do Dia', 'Definida automaticamente / manual');
    END IF;
END $$;
