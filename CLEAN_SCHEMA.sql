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

