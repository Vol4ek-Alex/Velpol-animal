-- =====================================================
-- ⚡ РЕШЕНИЕ СРАЗУ: Отключить RLS для ВСЕХ таблиц
-- =====================================================
-- Выполните это если хотите НЕМЕДЛЕННО исправить регистрацию
-- Это ВРЕМЕННОЕ решение для тестирования
-- =====================================================

-- Отключить RLS для ВСЕХ таблиц (включая системные)
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

-- ✅ Готово! Теперь попробуйте зарегистрироваться
-- Если заработает - значит проблема была в RLS политиках
-- После успешной регистрации мы создадим правильные политики

-- =====================================================
-- 📋 ПОСЛЕ УСПЕШНОЙ РЕГИСТРАЦИИ:
-- =====================================================
-- 1. Найдите свой UUID: Authentication → Users
-- 2. Дайте себе права:
--
-- INSERT INTO module_access (user_id, module_name, has_access)
-- VALUES 
--   ('ВАШ_UUID', 'admin', true),
--   ('ВАШ_UUID', 'livestock', true),
--   ('ВАШ_UUID', 'agronomy', true);
--
-- 3. Включите RLS обратно (выполните FIX_RLS_ENABLE.sql)
-- =====================================================
