-- ==============================================================================
-- VULTO LAB — CORE OS: MÓDULO PROJETOS & ENTREGAS (SPRINT DELIVERY)
-- Script SQL DDL + RLS + Triggers + Seed Inicial
-- Execute este script no SQL Editor do Supabase Console
-- ==============================================================================

-- 1. TABELA PROJECTS (SE NÃO EXISTIR OU ATUALIZAR COLUNAS)
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    description TEXT,
    responsible_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'A FAZER',
    priority TEXT NOT NULL DEFAULT 'Normal',
    start_date DATE DEFAULT CURRENT_DATE,
    deadline DATE,
    value NUMERIC(12, 2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Garantir colunas essenciais caso a tabela tenha sido criada anteriormente com menos campos
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.services(id) ON DELETE SET NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS responsible_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'A FAZER';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'Normal';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS deadline DATE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS value NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 2. TABELA PROJECT_TASKS (TAREFAS / SUB-ENTREGAS DOS PROJETOS)
CREATE TABLE IF NOT EXISTS public.project_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT false,
    responsible_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_service_id ON public.projects(service_id);
CREATE INDEX IF NOT EXISTS idx_projects_deadline ON public.projects(deadline);
CREATE INDEX IF NOT EXISTS idx_projects_responsible ON public.projects(responsible_user_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON public.project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_completed ON public.project_tasks(completed);

-- 4. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para PROJECTS
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Allow authenticated read on projects'
    ) THEN
        CREATE POLICY "Allow authenticated read on projects"
            ON public.projects FOR SELECT
            TO authenticated
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Allow authenticated insert on projects'
    ) THEN
        CREATE POLICY "Allow authenticated insert on projects"
            ON public.projects FOR INSERT
            TO authenticated
            WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Allow authenticated update on projects'
    ) THEN
        CREATE POLICY "Allow authenticated update on projects"
            ON public.projects FOR UPDATE
            TO authenticated
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Allow authenticated delete on projects'
    ) THEN
        CREATE POLICY "Allow authenticated delete on projects"
            ON public.projects FOR DELETE
            TO authenticated
            USING (true);
    END IF;
END $$;

-- Políticas de RLS para PROJECT_TASKS
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'project_tasks' AND policyname = 'Allow authenticated read on project_tasks'
    ) THEN
        CREATE POLICY "Allow authenticated read on project_tasks"
            ON public.project_tasks FOR SELECT
            TO authenticated
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'project_tasks' AND policyname = 'Allow authenticated insert on project_tasks'
    ) THEN
        CREATE POLICY "Allow authenticated insert on project_tasks"
            ON public.project_tasks FOR INSERT
            TO authenticated
            WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'project_tasks' AND policyname = 'Allow authenticated update on project_tasks'
    ) THEN
        CREATE POLICY "Allow authenticated update on project_tasks"
            ON public.project_tasks FOR UPDATE
            TO authenticated
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'project_tasks' AND policyname = 'Allow authenticated delete on project_tasks'
    ) THEN
        CREATE POLICY "Allow authenticated delete on project_tasks"
            ON public.project_tasks FOR DELETE
            TO authenticated
            USING (true);
    END IF;
END $$;

-- 5. TRIGGER UPDATED_AT AUTOMÁTICO
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_set_updated_at_projects') THEN
        CREATE TRIGGER trg_set_updated_at_projects
            BEFORE UPDATE ON public.projects
            FOR EACH ROW
            EXECUTE FUNCTION public.set_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_set_updated_at_project_tasks') THEN
        CREATE TRIGGER trg_set_updated_at_project_tasks
            BEFORE UPDATE ON public.project_tasks
            FOR EACH ROW
            EXECUTE FUNCTION public.set_updated_at();
    END IF;
END $$;

-- 6. DADOS DE SEED INICIAIS (Apenas se a tabela projects estiver vazia)
DO $$
DECLARE
    v_felipe_id UUID;
    v_pietro_id UUID;
    v_client_atlas UUID;
    v_client_nexus UUID;
    v_client_lumina UUID;
    v_service_sites UUID;
    v_service_traffic UUID;
    v_service_tap UUID;
    v_service_ai UUID;
    v_proj_1 UUID;
    v_proj_2 UUID;
    v_proj_3 UUID;
    v_proj_4 UUID;
    v_proj_5 UUID;
BEGIN
    IF (SELECT count(*) FROM public.projects) = 0 THEN
        -- Buscar IDs de profiles existentes ou null
        SELECT id INTO v_felipe_id FROM public.profiles WHERE email ILIKE '%felipe%' LIMIT 1;
        SELECT id INTO v_pietro_id FROM public.profiles WHERE email ILIKE '%pietro%' LIMIT 1;

        -- Buscar IDs de clients ou pegar os primeiros
        SELECT id INTO v_client_atlas FROM public.clients WHERE company_name ILIKE '%Atlas%' LIMIT 1;
        SELECT id INTO v_client_nexus FROM public.clients WHERE company_name ILIKE '%Nexus%' LIMIT 1;
        SELECT id INTO v_client_lumina FROM public.clients WHERE company_name ILIKE '%Lumina%' LIMIT 1;

        -- Buscar IDs de services
        SELECT id INTO v_service_sites FROM public.services WHERE name ILIKE '%Sites%' LIMIT 1;
        SELECT id INTO v_service_traffic FROM public.services WHERE name ILIKE '%Tráfego%' OR name ILIKE '%Media%' LIMIT 1;
        SELECT id INTO v_service_tap FROM public.services WHERE name ILIKE '%TAP%' LIMIT 1;
        SELECT id INTO v_service_ai FROM public.services WHERE name ILIKE '%Inteligência%' OR name ILIKE '%IA%' LIMIT 1;

        -- Projeto 1: Em Andamento
        INSERT INTO public.projects (
            name, client_id, service_id, description, responsible_user_id,
            status, priority, start_date, deadline, value, notes
        ) VALUES (
            'Portal Institucional & E-commerce Headless',
            v_client_atlas,
            v_service_sites,
            'Desenvolvimento completo da nova plataforma institucional com integração Supabase e checkout Stripe/Pix.',
            v_pietro_id,
            'EM ANDAMENTO',
            'Alta',
            CURRENT_DATE - INTERVAL '12 days',
            CURRENT_DATE + INTERVAL '5 days',
            6500.00,
            'Fase final de integração com gateway de pagamento e testes de carga.'
        ) RETURNING id INTO v_proj_1;

        -- Projeto 2: A Fazer
        INSERT INTO public.projects (
            name, client_id, service_id, description, responsible_user_id,
            status, priority, start_date, deadline, value, notes
        ) VALUES (
            'Escala de Tráfego Pago Q4 — Meta & Google Ads',
            v_client_nexus,
            v_service_traffic,
            'Estruturação dos conjuntos de anúncios CBO, testes de criativos estáticos e vídeo, e tracking com CAPI.',
            v_felipe_id,
            'A FAZER',
            'Normal',
            CURRENT_DATE - INTERVAL '2 days',
            CURRENT_DATE + INTERVAL '10 days',
            3500.00,
            'Aguardando aprovação de verba de mídia complementar.'
        ) RETURNING id INTO v_proj_2;

        -- Projeto 3: Revisão
        INSERT INTO public.projects (
            name, client_id, service_id, description, responsible_user_id,
            status, priority, start_date, deadline, value, notes
        ) VALUES (
            'Lote Corporativo 60 VULTO TAP + Hub NFC',
            v_client_lumina,
            v_service_tap,
            'Confecção dos cartões em metal fosco com gravação a laser personalizada e configuração das tags de redirecionamento dinâmico.',
            v_pietro_id,
            'REVISÃO',
            'Normal',
            CURRENT_DATE - INTERVAL '8 days',
            CURRENT_DATE + INTERVAL '2 days',
            3900.00,
            'Testes de leitura NFC realizados em 100% das unidades.'
        ) RETURNING id INTO v_proj_3;

        -- Projeto 4: Atrasado (para teste de alerta visual)
        INSERT INTO public.projects (
            name, client_id, service_id, description, responsible_user_id,
            status, priority, start_date, deadline, value, notes
        ) VALUES (
            'Agente IA WhatsApp Suporte N1 & Qualificação',
            v_client_atlas,
            v_service_ai,
            'Integração da Evolution API com modelo Gemini Flash para qualificação e roteamento 24/7 de leads quentes.',
            v_felipe_id,
            'EM ANDAMENTO',
            'Urgente',
            CURRENT_DATE - INTERVAL '20 days',
            CURRENT_DATE - INTERVAL '2 days', -- prazo no passado = ATRASADO
            4200.00,
            'Aguardando webhook do número de WhatsApp do cliente ser liberado pela Meta.'
        ) RETURNING id INTO v_proj_4;

        -- Projeto 5: Concluído
        INSERT INTO public.projects (
            name, client_id, service_id, description, responsible_user_id,
            status, priority, start_date, deadline, value, notes
        ) VALUES (
            'Otimização de Conversão (CRO) & Copywriting LP',
            v_client_nexus,
            v_service_sites,
            'Refatoração do copy de vendas, prova social interativa e redução de fricção no formulário de contato.',
            v_felipe_id,
            'CONCLUÍDO',
            'Normal',
            CURRENT_DATE - INTERVAL '25 days',
            CURRENT_DATE - INTERVAL '5 days',
            2800.00,
            'Entrega validada pelo cliente com aumento de 32% no conversion rate.'
        ) RETURNING id INTO v_proj_5;

        -- Inserir tarefas nos projetos
        IF v_proj_1 IS NOT NULL THEN
            INSERT INTO public.project_tasks (project_id, title, completed, responsible_user_id) VALUES
                (v_proj_1, 'Arquitetura e banco de dados Supabase', true, v_pietro_id),
                (v_proj_1, 'Design System e componentes Tailwind CSS', true, v_pietro_id),
                (v_proj_1, 'Integração de checkout Stripe / Pix', false, v_pietro_id),
                (v_proj_1, 'Homologação e testes cross-browser', false, v_pietro_id);
        END IF;

        IF v_proj_2 IS NOT NULL THEN
            INSERT INTO public.project_tasks (project_id, title, completed, responsible_user_id) VALUES
                (v_proj_2, 'Briefing de criativos e roteiros de vídeo', true, v_felipe_id),
                (v_proj_2, 'Configuração da API de Conversões Meta (CAPI)', false, v_felipe_id),
                (v_proj_2, 'Setup de campanhas Search e PMax no Google', false, v_felipe_id);
        END IF;

        IF v_proj_3 IS NOT NULL THEN
            INSERT INTO public.project_tasks (project_id, title, completed, responsible_user_id) VALUES
                (v_proj_3, 'Validação de mockups com o cliente', true, v_pietro_id),
                (v_proj_3, 'Gravação a laser dos cartões metálicos', true, v_pietro_id),
                (v_proj_3, 'Codificação das tags NTAG213 e trava de memória', true, v_pietro_id),
                (v_proj_3, 'Embalagem premium e emissão de envio', false, v_pietro_id);
        END IF;

        IF v_proj_4 IS NOT NULL THEN
            INSERT INTO public.project_tasks (project_id, title, completed, responsible_user_id) VALUES
                (v_proj_4, 'Desenho do fluxo conversacional e persona', true, v_felipe_id),
                (v_proj_4, 'Integração do endpoint webhook WhatsApp', false, v_felipe_id),
                (v_proj_4, 'Testes de stress com simulação de 50 conversas simultâneas', false, v_felipe_id);
        END IF;

        IF v_proj_5 IS NOT NULL THEN
            INSERT INTO public.project_tasks (project_id, title, completed, responsible_user_id) VALUES
                (v_proj_5, 'Análise de mapas de calor Hotjar', true, v_felipe_id),
                (v_proj_5, 'Redação de novo copy orientado a dor e contraste', true, v_felipe_id),
                (v_proj_5, 'Deploy e acompanhamento das métricas de teste A/B', true, v_felipe_id);
        END IF;
    END IF;
END $$;
