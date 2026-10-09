-- =====================================================
-- 🔥 ПОЛНОЕ УДАЛЕНИЕ БАЗЫ ДАННЫХ VELPOL
-- =====================================================
-- Выполните этот скрипт ПЕРВЫМ чтобы удалить ВСЁ
-- =====================================================

-- 🗑️ Шаг 1: Отключить RLS для всех таблиц
-- =====================================================
ALTER TABLE IF EXISTS module_access DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pending_access_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS farms_and_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS herd_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS group_category_heads DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS herd_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS diets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS feeds DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS diet_feeds DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS agro_crops DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS agro_fields DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS agro_planting DISABLE ROW LEVEL SECURITY;

-- 🗑️ Шаг 2: Удалить ВСЕ политики
-- =====================================================
DROP POLICY IF EXISTS "Users read own access" ON module_access;
DROP POLICY IF EXISTS "Users can view their own access" ON module_access;
DROP POLICY IF EXISTS "Admins can manage all access" ON module_access;
DROP POLICY IF EXISTS "Service manages access" ON module_access;

DROP POLICY IF EXISTS "Users read own requests" ON pending_access_requests;
DROP POLICY IF EXISTS "Users can view their own requests" ON pending_access_requests;
DROP POLICY IF EXISTS "Users insert own requests" ON pending_access_requests;
DROP POLICY IF EXISTS "Users can insert their own requests" ON pending_access_requests;
DROP POLICY IF EXISTS "Users can create own requests" ON pending_access_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON pending_access_requests;
DROP POLICY IF EXISTS "Admins can update all requests" ON pending_access_requests;
DROP POLICY IF EXISTS "Service manages requests" ON pending_access_requests;

DROP POLICY IF EXISTS "Read farms" ON farms_and_groups;
DROP POLICY IF EXISTS "Manage farms" ON farms_and_groups;

DROP POLICY IF EXISTS "Read categories" ON herd_categories;
DROP POLICY IF EXISTS "Manage categories" ON herd_categories;

DROP POLICY IF EXISTS "Read group cats" ON group_category_heads;
DROP POLICY IF EXISTS "Manage group cats" ON group_category_heads;

DROP POLICY IF EXISTS "Read movements" ON herd_movements;
DROP POLICY IF EXISTS "Manage movements" ON herd_movements;

DROP POLICY IF EXISTS "Read diets" ON diets;
DROP POLICY IF EXISTS "Manage diets" ON diets;

DROP POLICY IF EXISTS "Read feeds" ON feeds;
DROP POLICY IF EXISTS "Manage feeds" ON feeds;

DROP POLICY IF EXISTS "Read diet feeds" ON diet_feeds;
DROP POLICY IF EXISTS "Manage diet feeds" ON diet_feeds;

DROP POLICY IF EXISTS "Read crops" ON agro_crops;
DROP POLICY IF EXISTS "Manage crops" ON agro_crops;

DROP POLICY IF EXISTS "Read fields" ON agro_fields;
DROP POLICY IF EXISTS "Manage fields" ON agro_fields;

DROP POLICY IF EXISTS "Read plantings" ON agro_planting;
DROP POLICY IF EXISTS "Manage plantings" ON agro_planting;

-- 🗑️ Шаг 3: Удалить ВСЕ индексы
-- =====================================================
DROP INDEX IF EXISTS idx_module_access_user;
DROP INDEX IF EXISTS idx_pending_requests_user;
DROP INDEX IF EXISTS idx_pending_requests_status;
DROP INDEX IF EXISTS idx_group_category_heads_group;
DROP INDEX IF EXISTS idx_movements_group;
DROP INDEX IF EXISTS idx_movements_date;
DROP INDEX IF EXISTS idx_planting_field;
DROP INDEX IF EXISTS idx_planting_year;

-- 🗑️ Шаг 4: Удалить ВСЕ таблицы (в правильном порядке)
-- =====================================================
DROP TABLE IF EXISTS agro_planting CASCADE;
DROP TABLE IF EXISTS agro_fields CASCADE;
DROP TABLE IF EXISTS agro_crops CASCADE;
DROP TABLE IF EXISTS diet_feeds CASCADE;
DROP TABLE IF EXISTS feeds CASCADE;
DROP TABLE IF EXISTS diets CASCADE;
DROP TABLE IF EXISTS herd_movements CASCADE;
DROP TABLE IF EXISTS group_category_heads CASCADE;
DROP TABLE IF EXISTS herd_categories CASCADE;
DROP TABLE IF EXISTS farms_and_groups CASCADE;
DROP TABLE IF EXISTS pending_access_requests CASCADE;
DROP TABLE IF EXISTS module_access CASCADE;

-- ✅ Готово! Теперь выполните FRESH_INSTALL.sql
