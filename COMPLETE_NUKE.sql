-- =====================================================
-- 🚨 ПОЛНЫЙ СБРОС: Удалить ВСЁ и начать с нуля
-- =====================================================
-- Выполните этот скрипт если регистрация всё ещё не работает
-- ⚠️ ЭТО УДАЛИТ ВСЕ ДАННЫЕ! Используйте только для тестирования!
-- =====================================================

-- Отключить все RLS (для безопасного удаления)
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

-- Удалить ВСЕ триггеры (они могут блокировать операции)
DROP TRIGGER IF EXISTS trigger_name ON module_access;

-- Удалить ВСЕ политики
DROP POLICY IF EXISTS "read_own_access" ON module_access;
DROP POLICY IF EXISTS "read_own_requests" ON pending_access_requests;
DROP POLICY IF EXISTS "users_all_farms" ON farms_and_groups;
DROP POLICY IF EXISTS "users_all_categories" ON herd_categories;
DROP POLICY IF EXISTS "users_all_group_cats" ON group_category_heads;
DROP POLICY IF EXISTS "users_all_movements" ON herd_movements;
DROP POLICY IF EXISTS "users_all_diets" ON diets;
DROP POLICY IF EXISTS "users_all_feeds" ON feeds;
DROP POLICY IF EXISTS "users_all_diet_feeds" ON diet_feeds;
DROP POLICY IF EXISTS "users_all_crops" ON agro_crops;
DROP POLICY IF EXISTS "users_all_fields" ON agro_fields;
DROP POLICY IF EXISTS "users_all_planting" ON agro_planting;

-- Удалить ВСЕ таблицы (включая старые)
DROP TABLE IF EXISTS diet_feeds CASCADE;
DROP TABLE IF EXISTS feeds CASCADE;
DROP TABLE IF EXISTS diets CASCADE;
DROP TABLE IF EXISTS agro_planting CASCADE;
DROP TABLE IF EXISTS agro_fields CASCADE;
DROP TABLE IF EXISTS agro_crops CASCADE;
DROP TABLE IF EXISTS herd_movements CASCADE;
DROP TABLE IF EXISTS group_category_heads CASCADE;
DROP TABLE IF EXISTS herd_categories CASCADE;
DROP TABLE IF EXISTS pending_access_requests CASCADE;
DROP TABLE IF EXISTS module_access CASCADE;
DROP TABLE IF EXISTS farms_and_groups CASCADE;

-- ✅ Готово! База данных полностью очищена!
-- Теперь выполните FRESH_INSTALL.sql чтобы создать новую схему
