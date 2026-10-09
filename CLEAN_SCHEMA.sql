-- =====================================================
-- VELPOL AGRO SYSTEM v2.0 - COMPLETE DATABASE SCHEMA
-- =====================================================
-- Полный скрипт для создания БД с нуля БЕЗ РЕКУРСИИ RLS!
-- Удалите все существующие таблицы перед выполнением
-- =====================================================

-- =====================================================
-- 1️⃣  СИСТЕМА УПРАВЛЕНИЯ ДОСТУПОМ
-- =====================================================

CREATE TABLE IF NOT EXISTS module_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    module_name TEXT NOT NULL CHECK (module_name IN ('livestock', 'agronomy', 'mechanization', 'admin')),
    has_access BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, module_name)
);

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
-- 2️⃣  ЖИВОТНОВОДСТВО (LIVESTOCK)
-- =====================================================

CREATE TABLE IF NOT EXISTS farms_and_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_name TEXT NOT NULL,
    group_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(farm_name, group_name)
);

CREATE TABLE IF NOT EXISTS herd_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_category_heads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES farms_and_groups(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES herd_categories(id) ON DELETE CASCADE,
    heads INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, category_id)
);

CREATE TABLE IF NOT EXISTS herd_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES farms_and_groups(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES herd_categories(id) ON DELETE CASCADE,
    event_date DATE NOT NULL,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('arrival', 'departure', 'slaughter', 'death')),
    heads INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS diets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES farms_and_groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, name)
);

CREATE TABLE IF NOT EXISTS feeds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS diet_feeds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diet_id UUID NOT NULL REFERENCES diets(id) ON DELETE CASCADE,
    feed_id UUID NOT NULL REFERENCES feeds(id) ON DELETE CASCADE,
    percentage DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(diet_id, feed_id)
);




-- =====================================================
-- 3️⃣  АГРОНОМИЯ (AGRONOMY)
-- =====================================================

CREATE TABLE IF NOT EXISTS agro_crops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agro_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    area DECIMAL(10,2),
    soil_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agro_planting (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID NOT NULL REFERENCES agro_fields(id) ON DELETE CASCADE,
    crop_id UUID NOT NULL REFERENCES agro_crops(id) ON DELETE CASCADE,
    predecessor_id UUID REFERENCES agro_crops(id),
    year INTEGER NOT NULL,
    planting_date DATE,
    harvesting_date DATE,
    expected_yield DECIMAL(10,2),
    actual_yield DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(field_id, year)
);

-- =====================================================
-- 🔒 ROW LEVEL SECURITY (RLS) - БЕЗ РЕКУРСИИ!
-- =====================================================

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

-- =====================================================
-- 📋 ПОЛИТИКИ БЕЗ РЕКУРСИИ (service_role управляет всем)
-- =====================================================

-- module_access: только чтение для пользователей
CREATE POLICY "Users read own access" ON module_access FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service manages access" ON module_access FOR ALL USING (auth.role() = 'service_role');

-- pending_access_requests
CREATE POLICY "Users read own requests" ON pending_access_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own requests" ON pending_access_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service manages requests" ON pending_access_requests FOR ALL USING (auth.role() = 'service_role');

-- Все остальные таблицы: чтение для всех, изменение через service_role
CREATE POLICY "Read farms" ON farms_and_groups FOR SELECT USING (true);
CREATE POLICY "Manage farms" ON farms_and_groups FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Read categories" ON herd_categories FOR SELECT USING (true);
CREATE POLICY "Manage categories" ON herd_categories FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Read group cats" ON group_category_heads FOR SELECT USING (true);
CREATE POLICY "Manage group cats" ON group_category_heads FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Read movements" ON herd_movements FOR SELECT USING (true);
CREATE POLICY "Manage movements" ON herd_movements FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Read diets" ON diets FOR SELECT USING (true);
CREATE POLICY "Manage diets" ON diets FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Read feeds" ON feeds FOR SELECT USING (true);
CREATE POLICY "Manage feeds" ON feeds FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Read diet feeds" ON diet_feeds FOR SELECT USING (true);
CREATE POLICY "Manage diet feeds" ON diet_feeds FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Read crops" ON agro_crops FOR SELECT USING (true);
CREATE POLICY "Manage crops" ON agro_crops FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Read fields" ON agro_fields FOR SELECT USING (true);
CREATE POLICY "Manage fields" ON agro_fields FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Read plantings" ON agro_planting FOR SELECT USING (true);
CREATE POLICY "Manage plantings" ON agro_planting FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 🎯 ИНДЕКСЫ ДЛЯ ОПТИМИЗАЦИИ
-- =====================================================

CREATE INDEX idx_module_access_user ON module_access(user_id);
CREATE INDEX idx_pending_requests_user ON pending_access_requests(user_id);
CREATE INDEX idx_pending_requests_status ON pending_access_requests(status);
CREATE INDEX idx_group_category_heads_group ON group_category_heads(group_id);
CREATE INDEX idx_movements_group ON herd_movements(group_id);
CREATE INDEX idx_movements_date ON herd_movements(event_date);
CREATE INDEX idx_planting_field ON agro_planting(field_id);
CREATE INDEX idx_planting_year ON agro_planting(year);

-- =====================================================
-- ✅ ГОТОВО! Теперь создайте администратора:
-- =====================================================
-- INSERT INTO module_access (user_id, module_name, has_access)
-- VALUES ('ВАШ_UUID_ИЗ_AUTH_USERS', 'admin', true);
