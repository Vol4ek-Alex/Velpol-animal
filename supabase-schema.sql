-- =====================================================
-- Velpol Agro System - Database Schema
-- =====================================================

-- Таблица для управления доступом к модулям
CREATE TABLE IF NOT EXISTS module_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    module_name TEXT NOT NULL CHECK (module_name IN ('livestock', 'agronomy', 'mechanization', 'admin')),
    has_access BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, module_name)
);

-- Таблица для заявок на доступ (ожидающие одобрения)
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

-- Включить RLS (Row Level Security)
ALTER TABLE module_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_access_requests ENABLE ROW LEVEL SECURITY;

-- Политики для module_access
DROP POLICY IF EXISTS "Users can view their own access" ON module_access;
CREATE POLICY "Users can view their own access" ON module_access
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all access" ON module_access;
CREATE POLICY "Admins can manage all access" ON module_access
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM module_access
            WHERE user_id = auth.uid() AND module_name = 'admin' AND has_access = true
        )
    );

-- Политики для pending_access_requests
DROP POLICY IF EXISTS "Users can view their own requests" ON pending_access_requests;
CREATE POLICY "Users can view their own requests" ON pending_access_requests
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own requests" ON pending_access_requests;
CREATE POLICY "Users can insert their own requests" ON pending_access_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all requests" ON pending_access_requests;
CREATE POLICY "Admins can view all requests" ON pending_access_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM module_access
            WHERE user_id = auth.uid() AND module_name = 'admin' AND has_access = true
        )
    );

DROP POLICY IF EXISTS "Admins can update all requests" ON pending_access_requests;
CREATE POLICY "Admins can update all requests" ON pending_access_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM module_access
            WHERE user_id = auth.uid() AND module_name = 'admin' AND has_access = true
        )
    );

-- =====================================================
-- ВАЖНО: Создайте первого администратора вручную
-- =====================================================
-- После регистрации первого пользователя выполните:
-- 
-- INSERT INTO module_access (user_id, module_name, has_access)
-- VALUES ('ВАШ_USER_ID', 'admin', true);
--
-- Найти user_id можно в таблице auth.users
-- =====================================================
