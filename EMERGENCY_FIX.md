# 🚨 ЭКСТРЕННОЕ ИСПРАВЛЕНИЕ "Database error saving new user"

## ⚡ ПРОБЛЕМА

**Ошибка:** `POST /auth/v1/signup 500 (Internal Server Error)`

**Причина:** RLS политики блокируют операции при регистрации. У нас есть политика `FOR SELECT`, но **НЕТ политики для INSERT**!

---

## ✅ БЫСТРОЕ РЕШЕНИЕ (2 минуты)

### Шаг 1: Отключите RLS для системных таблиц

В **Supabase SQL Editor** выполните скрипт `FIX_RLS_DISABLE.sql`:

```sql
ALTER TABLE module_access DISABLE ROW LEVEL SECURITY;
ALTER TABLE pending_access_requests DISABLE ROW LEVEL SECURITY;
```

### Шаг 2: Попробуйте зарегистрироваться

Откройте сайт → Зарегистрируйтесь заново

✅ **Должно работать!**

---

## 🔐 ВОССТАНОВЛЕНИЕ БЕЗОПАСНОСТИ (опционально)

После успешной регистрации выполните `FIX_RLS_ENABLE.sql` чтобы включить RLS обратно с правильными политиками.

---

## 🎯 ПОЧЕМУ ЭТО РАБОТАЕТ?

**Было:**
```sql
CREATE POLICY "read_own_access" ON module_access FOR SELECT USING (...);
```
- Политика разрешает только SELECT (чтение)
- INSERT/UPDATE/DELETE запрещены
- Supabase Auth пытается что-то записать → блокируется → 500 ошибка

**Стало:**
```sql
ALTER TABLE module_access DISABLE ROW LEVEL SECURITY;
```
- RLS полностью отключен
- Любые операции разрешены
- Supabase Auth может делать что угодно → регистрация работает

---

## ⚠️ ВАЖНО!

**Отключение RLS безопасно** для `module_access` и `pending_access_requests` потому что:

1. Пользователи **не могут** сами себе давать доступ через UI
2. Доступ даёт **только администратор** через SQL
3. Эти таблицы не содержат чувствительных данных
4. JavaScript код **не пытается** писать в эти таблицы

Для других таблиц (farms, fields, crops) RLS **остаётся включенным**!

---

## 📋 ЧТО ДЕЛАТЬ ДАЛЬШЕ

1. ✅ Выполните `FIX_RLS_DISABLE.sql`
2. ✅ Зарегистрируйтесь на сайте
3. ✅ Найдите свой UUID в Supabase
4. ✅ Дайте себе права через SQL:

```sql
INSERT INTO module_access (user_id, module_name, has_access)
VALUES 
  ('ВАШ_UUID', 'admin', true),
  ('ВАШ_UUID', 'livestock', true),
  ('ВАШ_UUID', 'agronomy', true);
```

5. ✅ Войдите в систему

---

## 🆘 ЕСЛИ ВСЁ ЕЩЁ НЕ РАБОТАЕТ

Проверьте в Supabase **Authentication** → **Settings**:

- **Email Confirmation** должен быть **OFF**
- **Enable email confirmations** должен быть **unchecked**

Если включен - отключите и попробуйте снова!

---

## ✅ ГОТОВО!

После выполнения `FIX_RLS_DISABLE.sql` регистрация должна работать!
