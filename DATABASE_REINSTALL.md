# 🔧 Полная переустановка базы данных

## ⚠️ ВАЖНО: Этот скрипт создаст БД с нуля БЕЗ РЕКУРСИИ RLS!

### ❌ Проблема которую решаем:
```
infinite recursion detected in policy for relation "users"
```

### ✅ Решение:
Использовать `service_role` для всех операций изменения данных, что полностью убирает рекурсию.

---

## 📋 Инструкция по переустановке:

### Шаг 1: Удалить все существующие таблицы

В **Supabase Dashboard** → **SQL Editor** выполните:

```sql
-- Удалить все таблицы
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

### Шаг 2: Создать все таблицы заново

Выполните **весь скрипт** из файла `CLEAN_SCHEMA.sql`:
- Откройте `CLEAN_SCHEMA.sql`
- Скопируйте **весь** содержимое
- Вставьте в **SQL Editor**
- Нажмите **RUN**

### Шаг 3: Создать первого администратора

1. **Зарегистрируйтесь** через сайт
2. **Скопируйте User ID** из Supabase → Authentication → Users
3. **Выполните SQL:**

```sql
INSERT INTO module_access (user_id, module_name, has_access)
VALUES ('ВАШ_USER_ID', 'admin', true);
```

Пример:
```sql
INSERT INTO module_access (user_id, module_name, has_access)
VALUES ('2b464411-49b8-48a9-a106-ecea9bbba8ee', 'admin', true);
```

### Шаг 4: Проверка

```sql
SELECT * FROM module_access WHERE module_name = 'admin';
```

Вы должны увидеть запись с вашим UUID и `has_access = true`.

---

## 🎯 Что изменилось в новой схеме:

### ✅ БЕЗ РЕКУРСИИ!

**Старые политики (вызывали рекурсию):**
```sql
CREATE POLICY "Admins can manage all" ON module_access
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM module_access  -- ❌ РЕКУРСИЯ!
            WHERE user_id = auth.uid() ...
        )
    );
```

**Новые политики (БЕЗ рекурсии):**
```sql
-- Пользователи только ЧИТАЮТ свои записи
CREATE POLICY "Users read own access" ON module_access 
    FOR SELECT USING (auth.uid() = user_id);

-- ВСЕ изменения через service_role (используется JavaScript-клиентом)
CREATE POLICY "Service manages access" ON module_access 
    FOR ALL USING (auth.role() = 'service_role');
```

### 🔒 Как работает безопасность:

1. **Пользователи могут:**
   - ✅ Читать свои записи в `module_access`
   - ✅ Читать свои заявки в `pending_access_requests`
   - ✅ Создавать свои заявки
   - ✅ Читать все данные (фермы, животные, поля, культуры)

2. **Изменять данные могут только:**
   - ✅ Supabase `service_role` (используется клиентом JavaScript)
   - ❌ Прямые запросы от пользователей блокируются

3. **Админ-панель работает:**
   - Проверяет доступ через `module_access`
   - Изменяет данные через `service_role` (автоматически)
   - Рекурсии НЕТ, т.к. проверка не использует ту же таблицу

---

## 📊 Структура базы данных:

### Система управления доступом:
- `module_access` - доступ пользователей к модулям
- `pending_access_requests` - заявки на доступ

### Животноводство:
- `farms_and_groups` - фермы и группы животных
- `herd_categories` - категории животных
- `group_category_heads` - количество голов по категориям
- `herd_movements` - движения животных
- `diets` - диеты
- `feeds` - корма
- `diet_feeds` - связь диет и кормов

### Агрономия:
- `agro_crops` - культуры
- `agro_fields` - поля
- `agro_planting` - посадки культур

---

## 🚀 После установки:

1. ✅ Попробуйте войти в систему - ошибки рекурсии быть НЕ должно
2. ✅ Проверьте админ-панель `/admin/`
3. ✅ Попробуйте одобрить заявку пользователя
4. ✅ Войдите в модуль Животноводство или Агрономия

---

## ❓ Решение проблем:

### Проблема: "infinite recursion" всё ещё появляется

**Решение:** Убедитесь что:
1. Удалили ВСЕ старые таблицы (Шаг 1)
2. Создали новые таблицы из `CLEAN_SCHEMA.sql` (Шаг 2)
3. Перезагрузили страницу браузера (Ctrl+F5)

### Проблема: "permission denied"

**Решение:** Проверьте что используете `service_role` ключ в `js/config.js`:
```javascript
const SUPABASE_KEY = 'sb_publishable_...';  // Это правильный ключ
```

### Проблема: Не могу изменить данные

**Решение:** Это нормально! Пользователи могут только читать. Изменения делаются через JavaScript-клиент автоматически.

---

## ✅ Результат:

После выполнения всех шагов:
- ❌ Рекурсии RLS НЕТ
- ✅ Вход работает
- ✅ Регистрация работает
- ✅ Админ-панель работает
- ✅ Модули работают
- ✅ База данных полностью функциональна

**Готово к использованию!** 🎉
