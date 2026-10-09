# 🔧 Инструкция по предоставлению доступа пользователям

## 📋 Новый процесс регистрации:

После исправления ошибки "Database error saving new user" процесс работы изменился:

### 🔄 Как это работает теперь:

1. **Пользователь регистрируется** → выбирает модуль, вводит данные
2. **Supabase отправляет письмо** → подтверждение email
3. **Пользователь подтверждает email** → кликает на ссылку в письме
4. **Администратор вручную даёт доступ** → через SQL в Supabase

---

## 👨‍💼 Как администратору предоставить доступ:

### Шаг 1: Найти новых пользователей

В **Supabase Dashboard** → **SQL Editor**:

```sql
-- Показать всех пользователей с их email
SELECT 
    id, 
    email, 
    raw_user_meta_data->>'full_name' as full_name,
    raw_user_meta_data->>'requested_module' as requested_module,
    email_confirmed_at,
    created_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 20;
```

### Шаг 2: Предоставить доступ к модулю

Скопируйте UUID пользователя из результата выше и выполните:

```sql
-- Замените 'USER_UUID' на реальный UUID пользователя
-- Замените 'agronomy' на нужный модуль ('livestock' или 'agronomy')

INSERT INTO module_access (user_id, module_name, has_access)
VALUES ('USER_UUID', 'agronomy', true)
ON CONFLICT (user_id, module_name) 
DO UPDATE SET has_access = true;
```

**ПРИМЕР:**
```sql
-- Дать доступ к Агрономии
INSERT INTO module_access (user_id, module_name, has_access)
VALUES ('2b464411-49b8-48a9-a106-ecea9bbba8ee', 'agronomy', true)
ON CONFLICT (user_id, module_name) 
DO UPDATE SET has_access = true;

-- Дать доступ к Животноводству
INSERT INTO module_access (user_id, module_name, has_access)
VALUES ('2b464411-49b8-48a9-a106-ecea9bbba8ee', 'livestock', true)
ON CONFLICT (user_id, module_name) 
DO UPDATE SET has_access = true;
```

### Шаг 3: Проверить результат

```sql
SELECT 
    u.email,
    ma.module_name,
    ma.has_access,
    ma.created_at
FROM auth.users u
LEFT JOIN module_access ma ON ma.user_id = u.id
ORDER BY u.email, ma.module_name;
```

---

## 🚀 Быстрое решение: Дать доступ ВСЕМ (для разработки)

Если вы хотите дать доступ **всем** зарегистрированным пользователям (например, для тестирования):

```sql
-- Дать всем доступ к Агрономии
INSERT INTO module_access (user_id, module_name, has_access)
SELECT id, 'agronomy', true
FROM auth.users
WHERE email_confirmed_at IS NOT NULL  -- Только подтверждённые email
ON CONFLICT (user_id, module_name) 
DO UPDATE SET has_access = true;

-- Дать всем доступ к Животноводству
INSERT INTO module_access (user_id, module_name, has_access)
SELECT id, 'livestock', true
FROM auth.users
WHERE email_confirmed_at IS NOT NULL
ON CONFLICT (user_id, module_name) 
DO UPDATE SET has_access = true;
```

---

## 🎯 Создание администраторов

Чтобы дать пользователю права администратора (доступ к `/admin/`):

```sql
-- Замените UUID на реальный
INSERT INTO module_access (user_id, module_name, has_access)
VALUES ('USER_UUID', 'admin', true)
ON CONFLICT (user_id, module_name) 
DO UPDATE SET has_access = true;
```

---

## 📧 Уведомление пользователей (опционально)

После предоставления доступа вы можете уведомить пользователей через:
- Email (вручную)
- Уведомление в интерфейсе (будущая функция)
- SMS (если настроено)

---

## ✅ Проверка доступа

Пользователь может проверить свой доступ:
1. Войти на сайт
2. Выбрать модуль
3. Нажать "Войти"
4. Если есть доступ → откроется модуль
5. Если нет доступа → ошибка "У вас нет доступа к данному модулю"

---

## 🔧 Отозвать доступ

Если нужно отозвать доступ у пользователя:

```sql
-- Отозвать доступ
UPDATE module_access 
SET has_access = false 
WHERE user_id = 'USER_UUID' 
AND module_name = 'agronomy';

-- Или удалить полностью
DELETE FROM module_access 
WHERE user_id = 'USER_UUID' 
AND module_name = 'agronomy';
```

---

## 📊 Статистика пользователей

Посмотреть сколько пользователей имеют доступ:

```sql
SELECT 
    module_name,
    COUNT(*) as users_count
FROM module_access
WHERE has_access = true
GROUP BY module_name
ORDER BY module_name;
```

---

## ✅ Готово!

Теперь процесс работы простой и понятный:
1. ✅ Пользователь регистрируется
2. ✅ Подтверждает email
3. ✅ Администратор даёт доступ через SQL
4. ✅ Пользователь входит в модуль

**Ошибки "Database error" больше не будет!** 🎉
