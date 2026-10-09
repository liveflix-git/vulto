-- ==============================================================================
-- VULTO LAB — CORE OS: MÓDULO SERVIÇOS & PREÇOS (service_notes) + VULTO TAP (vulto_tap_cards)
-- Script SQL DDL + RLS + Triggers
-- Execute este script no SQL Editor do Supabase Console caso queira criar as tabelas no Postgres
-- ==============================================================================

-- -------------------------------------------------------------
-- 1. TABELA SERVICE_NOTES (Anotações comerciais, scripts e referências)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.service_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT,
    service_category TEXT,
    value NUMERIC(12, 2) NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para service_notes
CREATE INDEX IF NOT EXISTS idx_service_notes_updated_at ON public.service_notes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_notes_category ON public.service_notes(service_category);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.service_notes ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para service_notes (usuários autenticados)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'service_notes' AND policyname = 'Allow authenticated read on service_notes'
    ) THEN
        CREATE POLICY "Allow authenticated read on service_notes"
            ON public.service_notes FOR SELECT
            TO authenticated
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'service_notes' AND policyname = 'Allow authenticated insert on service_notes'
    ) THEN
        CREATE POLICY "Allow authenticated insert on service_notes"
            ON public.service_notes FOR INSERT
            TO authenticated
            WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'service_notes' AND policyname = 'Allow authenticated update on service_notes'
    ) THEN
        CREATE POLICY "Allow authenticated update on service_notes"
            ON public.service_notes FOR UPDATE
            TO authenticated
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'service_notes' AND policyname = 'Allow authenticated delete on service_notes'
    ) THEN
        CREATE POLICY "Allow authenticated delete on service_notes"
            ON public.service_notes FOR DELETE
            TO authenticated
            USING (true);
    END IF;
END $$;

-- -------------------------------------------------------------
-- 2. TABELA VULTO_TAP_CARDS (Cartões & Placas NFC manuais e limpos)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vulto_tap_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(12, 2) NULL,
    status TEXT NOT NULL DEFAULT 'DISPONÍVEL', -- 'DISPONÍVEL', 'INDISPONÍVEL', 'EM PRODUÇÃO'
    quantity INTEGER NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para vulto_tap_cards
CREATE INDEX IF NOT EXISTS idx_vulto_tap_cards_status ON public.vulto_tap_cards(status);
CREATE INDEX IF NOT EXISTS idx_vulto_tap_cards_created_at ON public.vulto_tap_cards(created_at DESC);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.vulto_tap_cards ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para vulto_tap_cards
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'vulto_tap_cards' AND policyname = 'Allow authenticated read on vulto_tap_cards'
    ) THEN
        CREATE POLICY "Allow authenticated read on vulto_tap_cards"
            ON public.vulto_tap_cards FOR SELECT
            TO authenticated
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'vulto_tap_cards' AND policyname = 'Allow authenticated insert on vulto_tap_cards'
    ) THEN
        CREATE POLICY "Allow authenticated insert on vulto_tap_cards"
            ON public.vulto_tap_cards FOR INSERT
            TO authenticated
            WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'vulto_tap_cards' AND policyname = 'Allow authenticated update on vulto_tap_cards'
    ) THEN
        CREATE POLICY "Allow authenticated update on vulto_tap_cards"
            ON public.vulto_tap_cards FOR UPDATE
            TO authenticated
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'vulto_tap_cards' AND policyname = 'Allow authenticated delete on vulto_tap_cards'
    ) THEN
        CREATE POLICY "Allow authenticated delete on vulto_tap_cards"
            ON public.vulto_tap_cards FOR DELETE
            TO authenticated
            USING (true);
    END IF;
END $$;
