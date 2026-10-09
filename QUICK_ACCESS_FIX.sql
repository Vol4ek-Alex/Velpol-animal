-- =====================================================
-- БЫСТРОЕ РЕШЕНИЕ: Предоставить доступ всем пользователям
-- =====================================================
-- Используйте этот скрипт если хотите дать доступ ВСЕМ
-- зарегистрированным пользователям (для тестирования)
-- =====================================================

-- 1. Найти всех пользователей и их UUID
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;

-- 2. Замените 'ВАШ_USER_ID' на UUID из шага 1

-- 3. ВАРИАНТ А: Дать полный доступ одному пользователю
INSERT INTO module_access (user_id, module_name, has_access)
VALUES 
    ('ВАШ_USER_ID', 'admin', true),
    ('ВАШ_USER_ID', 'livestock', true),
    ('ВАШ_USER_ID', 'agronomy', true)
ON CONFLICT (user_id, module_name) 
DO UPDATE SET has_access = true;

-- 4. ВАРИАНТ Б: Дать доступ ВСЕМ пользователям (для тестирования)
-- ⚠️ ВНИМАНИЕ: Это даст доступ ВСЕМ! Используйте только для теста!

-- Дать всем доступ к Агрономии
INSERT INTO module_access (user_id, module_name, has_access)
SELECT id, 'agronomy', true
FROM auth.users
ON CONFLICT (user_id, module_name) 
DO UPDATE SET has_access = true;

-- Дать всем доступ к Животноводству
INSERT INTO module_access (user_id, module_name, has_access)
SELECT id, 'livestock', true
FROM auth.users
ON CONFLICT (user_id, module_name) 
DO UPDATE SET has_access = true;

-- 5. Проверка результата
SELECT 
    u.email,
    ma.module_name,
    ma.has_access,
    ma.created_at
FROM auth.users u
JOIN module_access ma ON ma.user_id = u.id
ORDER BY u.email, ma.module_name;

-- =====================================================
-- Вы должны увидеть записи для каждого пользователя
-- =====================================================
