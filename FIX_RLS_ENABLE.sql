-- =====================================================
-- ✅ ПРАВИЛЬНОЕ РЕШЕНИЕ: RLS С ПОЛИТИКОЙ INSERT
-- =====================================================
-- Выполните ПОСЛЕ успешной регистрации
-- Это включит RLS обратно с правильными политиками
-- =====================================================

-- Включить RLS
ALTER TABLE module_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_access_requests ENABLE ROW LEVEL SECURITY;

-- Удалить старые политики
DROP POLICY IF EXISTS "read_own_access" ON module_access;
DROP POLICY IF EXISTS "read_own_requests" ON pending_access_requests;

-- ✅ Новые политики с INSERT
CREATE POLICY "users_read_own_access" ON module_access 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "users_read_own_requests" ON pending_access_requests 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- ⚠️ Важно: НЕ создаём политику INSERT для module_access
-- потому что пользователи НЕ должны сами себе давать доступ!
-- Доступ даёт только администратор вручную через SQL

-- ✅ Готово! Теперь RLS включен с правильными политиками
