-- =====================================================
-- ИСПРАВЛЕНИЕ: Проблема с constraint и рекурсией RLS
-- =====================================================
-- Выполните этот скрипт если получаете ошибки:
-- 1. "violates check constraint module_access_module_name_check"
-- 2. "infinite recursion detected in policy for relation users"
-- =====================================================

-- ШАГ 1: Исправить constraint
-- =====================================================
ALTER TABLE module_access 
DROP CONSTRAINT IF EXISTS module_access_module_name_check;

ALTER TABLE module_access 
ADD CONSTRAINT module_access_module_name_check 
CHECK (module_name IN ('livestock', 'agronomy', 'mechanization', 'admin'));

-- ШАГ 2: Удалить рекурсивные политики
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage all access" ON module_access;
DROP POLICY IF EXISTS "Admins can view all requests" ON pending_access_requests;
DROP POLICY IF EXISTS "Admins can update all requests" ON pending_access_requests;

-- ШАГ 3: Создать правильные политики БЕЗ рекурсии
-- =====================================================

-- Простая политика для admin: разрешить ВСЕ операции через WITH CHECK
CREATE POLICY "Admins can manage all access" ON module_access
    FOR ALL 
    USING (true)  -- Разрешить чтение всем (нужно для проверки при входе)
    WITH CHECK (
        -- При записи проверять админские права через прямой запрос
        EXISTS (
            SELECT 1 FROM module_access ma
            WHERE ma.user_id = auth.uid() 
            AND ma.module_name = 'admin' 
            AND ma.has_access = true
        ) OR auth.uid() = user_id  -- Или пользователь редактирует свои записи
    );

-- Политика для pending_access_requests: админы видят всё
CREATE POLICY "Admins can view all requests" ON pending_access_requests
    FOR SELECT 
    USING (
        auth.uid() = user_id  -- Пользователь видит свои заявки
        OR 
        EXISTS (
            SELECT 1 FROM module_access ma
            WHERE ma.user_id = auth.uid() 
            AND ma.module_name = 'admin' 
            AND ma.has_access = true
        )  -- Админы видят все заявки
    );

-- Политика для обновления заявок: только админы
CREATE POLICY "Admins can update all requests" ON pending_access_requests
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM module_access ma
            WHERE ma.user_id = auth.uid() 
            AND ma.module_name = 'admin' 
            AND ma.has_access = true
        )
    );

-- ШАГ 4: Создать первого администратора
-- =====================================================
-- ⚠️ ВАЖНО: Замените 'ВАШ_USER_ID' на реальный UUID!
-- =====================================================

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
-- 4. Скопируйте UUID (например: 2b464411-49b8-48a9-a106-ecea9bbba8ee)
-- 5. Вставьте вместо 'ВАШ_USER_ID' в строке 62
-- =====================================================

-- ШАГ 5: Проверка результата
-- =====================================================
SELECT * FROM module_access WHERE module_name = 'admin';

-- Если всё правильно, вы увидите запись:
-- user_id = ваш UUID, module_name = 'admin', has_access = true
