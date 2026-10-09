-- =====================================================
-- 🔍 ПОЛНАЯ ДИАГНОСТИКА: Найти причину блокировки регистрации
-- =====================================================
-- Выполните ВСЕ запросы по порядку и отправьте ВСЕ результаты
-- =====================================================

-- ========================================
-- 1️⃣ ПРОВЕРКА RLS СТАТУСА
-- ========================================
SELECT 
    schemaname,
    tablename, 
    CASE WHEN rowsecurity THEN '✓ ВКЛЮЧЕН' ELSE '✗ ВЫКЛЮЧЕН' END as "RLS статус"
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- ========================================
-- 2️⃣ ПРОВЕРКА ПОЛИТИК (должно быть 0 строк если RLS отключен)
-- ========================================
SELECT 
    tablename,
    policyname as "Название политики",
    cmd as "Команда",
    qual::text as "Условие USING"
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ========================================
-- 3️⃣ ПРОВЕРКА ТРИГГЕРОВ (могут блокировать auth.users)
-- ========================================
SELECT 
    event_object_schema as "Схема",
    event_object_table as "Таблица",
    trigger_name as "Триггер",
    event_manipulation as "Событие",
    action_statement as "Действие"
FROM information_schema.triggers
WHERE event_object_schema IN ('public', 'auth')
ORDER BY event_object_table, trigger_name;

-- ========================================
-- 4️⃣ ПРОВЕРКА ФУНКЦИЙ (могут вызываться из триггеров)
-- ========================================
SELECT 
    routine_schema as "Схема",
    routine_name as "Функция",
    routine_type as "Тип"
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- ========================================
-- 5️⃣ ПРОВЕРКА ТАБЛИЦЫ auth.users (должна существовать!)
-- ========================================
SELECT 
    table_schema as "Схема",
    table_name as "Таблица"
FROM information_schema.tables
WHERE table_schema = 'auth' AND table_name = 'users';

-- ========================================
-- 6️⃣ ПРОВЕРКА СУЩЕСТВУЮЩИХ ПОЛЬЗОВАТЕЛЕЙ
-- ========================================
SELECT 
    id,
    email,
    created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- ========================================
-- 7️⃣ ПРОВЕРКА FOREIGN KEY CONSTRAINT
-- ========================================
SELECT
    tc.table_schema as "Схема",
    tc.table_name as "Таблица",
    kcu.column_name as "Колонка",
    ccu.table_schema as "Ссылается на схему",
    ccu.table_name as "Ссылается на таблицу",
    ccu.column_name as "Ссылается на колонку"
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND ccu.table_schema = 'auth';

-- =====================================================
-- 📋 ИНСТРУКЦИЯ:
-- =====================================================
-- 1. Выполните ВСЕ запросы выше (по очереди или все сразу)
-- 2. Скопируйте результат КАЖДОГО запроса
-- 3. Отправьте мне ВСЕ результаты
-- 4. Я найду что именно блокирует регистрацию
-- =====================================================
