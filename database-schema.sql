-- =====================================================
-- VELPOL AGRO SYSTEM - COMPLETE DATABASE SCHEMA
-- =====================================================
-- Полная схема БД для Vercel + Supabase + GitHub
-- Выполните этот скрипт в SQL Editor вашего нового Supabase проекта
-- =====================================================

-- =====================================================
-- 1️⃣ СИСТЕМА АВТОРИЗАЦИИ (упрощенная для регистрации email+password)
-- =====================================================

-- Доступ к модулям
CREATE TABLE IF NOT EXISTS module_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    module_name TEXT NOT NULL CHECK (module_name IN ('livestock', 'agronomy', 'mechanization', 'admin')),
    has_access BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, module_name)
);

-- Заявки на доступ (ожидают одобрения админа)
CREATE TABLE IF NOT EXISTS pending_access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    module_name TEXT NOT NULL CHECK (module_name IN ('livestock', 'agronomy', 'mechanization')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES auth.users(id),
    notes TEXT,
    UNIQUE(user_id, module_name)
);

-- =====================================================
-- 2️⃣ ЖИВОТНОВОДСТВО (LIVESTOCK)
-- =====================================================

-- Фермы и группы животных
CREATE TABLE IF NOT EXISTS farms_and_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_name TEXT NOT NULL,
    group_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(farm_name, group_name)
);

-- Категории животных (коровы, телята, бычки и т.д.)
CREATE TABLE IF NOT EXISTS herd_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Распределение поголовья по группам и категориям
CREATE TABLE IF NOT EXISTS group_category_heads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES farms_and_groups(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES herd_categories(id) ON DELETE CASCADE,
    heads INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, category_id)
);

-- История перемещений животных
CREATE TABLE IF NOT EXISTS herd_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES farms_and_groups(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES herd_categories(id) ON DELETE CASCADE,
    event_date DATE NOT NULL,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('arrival', 'departure', 'slaughter', 'death', 'realization', 'mortality', 'transfer')),
    heads INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Рационы кормления
CREATE TABLE IF NOT EXISTS diets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES farms_and_groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, name)
);

-- Справочник кормов
CREATE TABLE IF NOT EXISTS feeds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Состав рационов (связь рацион → корм → количество)
CREATE TABLE IF NOT EXISTS diet_feeds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diet_id UUID NOT NULL REFERENCES diets(id) ON DELETE CASCADE,
    feed_id UUID NOT NULL REFERENCES feeds(id) ON DELETE CASCADE,
    amount_kg NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(diet_id, feed_id)
);

-- =====================================================
-- 3️⃣ АГРОНОМИЯ (AGRONOMY)
-- =====================================================

-- Справочник культур
CREATE TABLE IF NOT EXISTS agro_crops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Поля
CREATE TABLE IF NOT EXISTS agro_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    area_ha NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Посевы (связь поле → культура → год)
CREATE TABLE IF NOT EXISTS agro_planting (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID NOT NULL REFERENCES agro_fields(id) ON DELETE CASCADE,
    crop_id UUID NOT NULL REFERENCES agro_crops(id) ON DELETE CASCADE,
    predecessor_id UUID REFERENCES agro_crops(id),
    year INTEGER NOT NULL,
    area_ha NUMERIC(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(field_id, year)
);

-- =====================================================
-- 4️⃣ ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Включить RLS на всех таблицах
ALTER TABLE module_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE farms_and_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE herd_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_category_heads ENABLE ROW LEVEL SECURITY;
ALTER TABLE herd_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE diets ENABLE ROW LEVEL SECURITY;
ALTER TABLE feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE agro_crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE agro_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE agro_planting ENABLE ROW LEVEL SECURITY;

-- Политики для module_access (пользователи читают свой доступ)
CREATE POLICY "Users read own access" ON module_access FOR SELECT USING (auth.uid() = user_id);

-- Политики для pending_access_requests
CREATE POLICY "Users read own requests" ON pending_access_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own requests" ON pending_access_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Политики для животноводства (все авторизованные могут читать и редактировать)
CREATE POLICY "Auth users access farms" ON farms_and_groups FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth users access categories" ON herd_categories FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth users access group_cats" ON group_category_heads FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth users access movements" ON herd_movements FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth users access diets" ON diets FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth users access feeds" ON feeds FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth users access diet_feeds" ON diet_feeds FOR ALL USING (auth.uid() IS NOT NULL);

-- Политики для агрономии (все авторизованные могут читать и редактировать)
CREATE POLICY "Auth users access crops" ON agro_crops FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth users access fields" ON agro_fields FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth users access planting" ON agro_planting FOR ALL USING (auth.uid() IS NOT NULL);

-- =====================================================
-- 5️⃣ ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_module_access_user ON module_access(user_id, module_name);
CREATE INDEX IF NOT EXISTS idx_pending_requests_status ON pending_access_requests(status, created_at);
CREATE INDEX IF NOT EXISTS idx_group_category_heads_group ON group_category_heads(group_id);
CREATE INDEX IF NOT EXISTS idx_herd_movements_group ON herd_movements(group_id);
CREATE INDEX IF NOT EXISTS idx_herd_movements_date ON herd_movements(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_diets_group ON diets(group_id);
CREATE INDEX IF NOT EXISTS idx_diet_feeds_diet ON diet_feeds(diet_id);
CREATE INDEX IF NOT EXISTS idx_agro_planting_field ON agro_planting(field_id);
CREATE INDEX IF NOT EXISTS idx_agro_planting_year ON agro_planting(year DESC);

-- =====================================================
-- ✅ ГОТОВО!
-- =====================================================
-- После выполнения этого скрипта:
-- 1. Зарегистрируйте первого пользователя через интерфейс
-- 2. Создайте ему права администратора:
--    INSERT INTO module_access (user_id, module_name, has_access)
--    VALUES ('ВАШ_USER_ID_ИЗ_auth.users', 'admin', true);
-- 3. Обновите SUPABASE_URL и SUPABASE_KEY в js/config.js
-- =====================================================
