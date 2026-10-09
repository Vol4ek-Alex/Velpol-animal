-- =====================================================
-- 🔍 ДИАГНОСТИКА: Проверка состояния БД
-- =====================================================
-- Выполните этот скрипт чтобы понять что блокирует регистрацию
-- =====================================================

-- 1️⃣ Проверить статус RLS
SELECT 
    tablename, 
    rowsecurity as "RLS включен"
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 2️⃣ Проверить ВСЕ политики
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as "Команда (SELECT/INSERT/UPDATE/DELETE)",
    qual as "Условие USING",
    with_check as "Условие WITH CHECK"
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3️⃣ Проверить триггеры (могут вызываться при регистрации)
SELECT 
    trigger_name,
    event_manipulation as "Событие",
    event_object_table as "Таблица",
    action_statement as "Действие"
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 4️⃣ Проверить функции (могут вызываться из триггеров)
SELECT 
    routine_name as "Функция",
    routine_type as "Тип",
    data_type as "Возврат"
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- =====================================================
-- 📋 РЕЗУЛЬТАТЫ:
-- =====================================================
-- Скопируйте результаты ВСЕХ 4 запросов и отправьте мне!
-- Это поможет понять что именно блокирует регистрацию
-- =====================================================
