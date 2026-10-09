-- =====================================================
-- ✨ СВЕЖАЯ УСТАНОВКА VELPOL AGRO SYSTEM v3.0
-- =====================================================
-- Выполните ПОСЛЕ COMPLETE_RESET.sql
-- =====================================================

-- =====================================================
-- 1️⃣ СИСТЕМА УПРАВЛЕНИЯ ДОСТУПОМ (БЕЗ FOREIGN KEY!)
-- =====================================================

CREATE TABLE module_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,  -- НЕ FOREIGN KEY! Избегаем проблем при регистрации
    module_name TEXT NOT NULL CHECK (module_name IN ('livestock', 'agronomy', 'mechanization', 'admin')),
    has_access BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, module_name)
);

CREATE TABLE pending_access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,  -- НЕ FOREIGN KEY!
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    module_name TEXT NOT NULL CHECK (module_name IN ('livestock', 'agronomy', 'mechanization')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processed_by UUID,
    notes TEXT,
    UNIQUE(user_id, module_name)
);

-- =====================================================
-- 2️⃣ ЖИВОТНОВОДСТВО (LIVESTOCK)
-- =====================================================

CREATE TABLE farms_and_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    farm_name TEXT NOT NULL,
    group_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, farm_name, group_name)
);

CREATE TABLE herd_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);

CREATE TABLE group_category_heads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    group_id UUID NOT NULL REFERENCES farms_and_groups(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES herd_categories(id) ON DELETE CASCADE,
    heads INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, category_id)
);

CREATE TABLE herd_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    group_id UUID NOT NULL REFERENCES farms_and_groups(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES herd_categories(id) ON DELETE CASCADE,
    event_date DATE NOT NULL,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('arrival', 'departure', 'slaughter', 'death')),
    heads INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE diets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    group_id UUID NOT NULL REFERENCES farms_and_groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, name)
);

CREATE TABLE feeds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    moisture_percent NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);

CREATE TABLE diet_feeds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    diet_id UUID NOT NULL REFERENCES diets(id) ON DELETE CASCADE,
    feed_id UUID NOT NULL REFERENCES feeds(id) ON DELETE CASCADE,
    weight_kg NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(diet_id, feed_id)
);

-- =====================================================
-- 3️⃣ АГРОНОМИЯ (AGRONOMY)
-- =====================================================

CREATE TABLE agro_crops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);

CREATE TABLE agro_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    area_ha NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);

CREATE TABLE agro_planting (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    field_id UUID NOT NULL REFERENCES agro_fields(id) ON DELETE CASCADE,
    crop_id UUID NOT NULL REFERENCES agro_crops(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    area_ha NUMERIC(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(field_id, year)
);

-- =====================================================
-- 4️⃣ RLS - МАКСИМАЛЬНО ПРОСТЫЕ ПОЛИТИКИ
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

CREATE POLICY "read_own_access" ON module_access FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "read_own_requests" ON pending_access_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_all_farms" ON farms_and_groups FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_all_categories" ON herd_categories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_all_group_cats" ON group_category_heads FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_all_movements" ON herd_movements FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_all_diets" ON diets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_all_feeds" ON feeds FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_all_diet_feeds" ON diet_feeds FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_all_crops" ON agro_crops FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_all_fields" ON agro_fields FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_all_planting" ON agro_planting FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- 5️⃣ ИНДЕКСЫ
-- =====================================================

CREATE INDEX idx_module_access_user ON module_access(user_id);
CREATE INDEX idx_farms_user ON farms_and_groups(user_id);
CREATE INDEX idx_categories_user ON herd_categories(user_id);
CREATE INDEX idx_movements_date ON herd_movements(event_date);
CREATE INDEX idx_planting_year ON agro_planting(year);

-- ✅ ГОТОВО! Теперь создайте администратора:
-- INSERT INTO module_access (user_id, module_name, has_access)
-- VALUES ('ВАШ_UUID', 'admin', true);
