-- =====================================================
-- ИСПРАВЛЕНИЕ: Добавление 'admin' в существующую таблицу
-- =====================================================
-- Выполните этот скрипт если получаете ошибку:
-- "new row for relation "module_access" violates check constraint"
-- =====================================================

-- Шаг 1: Удалить старый constraint
ALTER TABLE module_access 
DROP CONSTRAINT IF EXISTS module_access_module_name_check;

-- Шаг 2: Добавить новый constraint с 'admin'
ALTER TABLE module_access 
ADD CONSTRAINT module_access_module_name_check 
CHECK (module_name IN ('livestock', 'agronomy', 'mechanization', 'admin'));

-- Шаг 3: Теперь можно создать администратора
-- Замените 'ВАШ_USER_ID' на ID пользователя из auth.users
INSERT INTO module_access (user_id, module_name, has_access)
VALUES ('ВАШ_USER_ID', 'admin', true)
ON CONFLICT (user_id, module_name) 
DO UPDATE SET has_access = true;

-- =====================================================
-- Как найти ВАШ_USER_ID:
-- =====================================================
-- 1. Зарегистрируйтесь на сайте
-- 2. В Supabase Dashboard → Authentication → Users
-- 3. Найдите своего пользователя
-- 4. Скопируйте UUID (например: a1b2c3d4-e5f6-7890-abcd-ef1234567890)
-- 5. Вставьте вместо 'ВАШ_USER_ID' в строке 19
-- =====================================================

-- Проверка результата:
SELECT * FROM module_access WHERE module_name = 'admin';
