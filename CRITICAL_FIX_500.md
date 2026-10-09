# 🆘 КРИТИЧЕСКОЕ РЕШЕНИЕ: Database error saving new user

## ⚠️ ПРОБЛЕМА:
Supabase возвращает **500 Internal Server Error** при попытке регистрации.

Это означает что-то **ВНУТРИ Supabase** блокирует создание пользователя.

---

## 🛠️ РЕШЕНИЕ 1: Отключить ВСЕ RLS (НЕМЕДЛЕННО)

**Supabase Dashboard** → **SQL Editor**:

```sql
-- ОТКЛЮЧИТЬ ВСЕ RLS ПОЛНОСТЬЮ
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
```

**Нажмите RUN**

Теперь попробуйте зарегистрироваться. Если сработает - значит виновны RLS!

---

## 🛠️ РЕШЕНИЕ 2: Если RLS не помогло - Проверьте Auth Settings

**Supabase Dashboard** → **Authentication** → **Settings**:

1. Найдите **"Email Confirmation"** 
2. **ОТКЛЮЧИТЕ** (переключите на OFF)
3. Нажмите **Save**
4. Перезагрузите браузер (Ctrl+F5)
5. Попробуйте зарегистрироваться

---

## 🛠️ РЕШЕНИЕ 3: Проверить логи Supabase

**Supabase Dashboard** → **Logs** (или **Realtime** → **Database** в меню):

Посмотрите что именно падает при регистрации. Дайте мне **точный текст ошибки** из логов.

---

## 🛠️ РЕШЕНИЕ 4: Удалить СТАРЫЕ таблицы и создать заново

Если ничего не помогает - **удалить ВСЕ старые таблицы** и создать новые:

```sql
-- УДАЛИТЬ ВСЕ ТАБЛИЦЫ
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
```

Потом выполнить `CLEAN_SCHEMA.sql` заново.

---

## 📊 ПРОВЕРКА:

Выполните в SQL Editor:

```sql
-- Показать все таблицы
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Показать RLS статус
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

---

## 🆘 ЕСЛИ НИЧЕГО НЕ ПОМОГАЕТ:

**Дайте мне:**
1. Точный текст ошибки из Supabase Logs
2. Результат запроса выше
3. Скриншот Settings → Email Confirmation

Я сделаю **альтернативное решение** которое точно будет работать!
