# Великополье Control Panel

Многомодульная система управления сельским хозяйством с тремя направлениями:
- 🐄 **Животноводство** - учет поголовья и рационов кормления
- 🌾 **Агрономия** - управление культурами, полями и гектарами
- 🚜 **Механизация** - учет техники и работ (в разработке)

## Технологический стек

- **Frontend**: Vanilla JS, HTML5, CSS3
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Deployment**: Vercel + GitHub
- **PWA**: Service Worker + Manifest

## Быстрый старт

### 1. Создание нового Supabase проекта

1. Перейдите на https://supabase.com/dashboard
2. Нажмите **New Project**
3. Заполните:
   - **Name**: `velpol-agro` (или любое имя)
   - **Database Password**: сохраните пароль в надежном месте
   - **Region**: выберите ближайший регион
4. Дождитесь создания проекта (~2 минуты)

### 2. Настройка базы данных

1. В панели Supabase откройте **SQL Editor**
2. Скопируйте весь код из файла `database-schema.sql`
3. Вставьте в редактор и нажмите **Run**
4. Убедитесь, что все таблицы созданы без ошибок

### 3. Настройка Email Authentication

1. Перейдите в **Authentication** → **Providers**
2. Включите **Email** провайдер
3. ⚠️ **ВАЖНО**: отключите **"Confirm email"** (чтобы регистрация работала без подтверждения email) ИЛИ настройте SMTP для отправки писем
4. Сохраните изменения

### 4. Получение ключей API

1. Откройте **Settings** → **API**
2. Скопируйте:
   - **Project URL** (например: `https://abc123xyz.supabase.co`)
   - **anon public** ключ (длинная строка, начинается с `eyJ...`)

### 5. Обновление конфигурации проекта

1. Откройте файл `js/config.js`
2. Замените плейсхолдеры на ваши значения:
   ```javascript
   const SUPABASE_URL = 'https://ВАШ_PROJECT_ID.supabase.co';
   const SUPABASE_KEY = 'ваш_anon_public_ключ';
   ```

### 6. Создание первого администратора

1. Откройте приложение в браузере
2. Выберите модуль (например, **Животноводство**)
3. Нажмите **Регистрация**
4. Заполните форму и зарегистрируйтесь
5. Вернитесь в Supabase → **SQL Editor**
6. Выполните запрос (замените `user_id` на ваш):
   ```sql
   -- Найдите ваш user_id
   SELECT id, email FROM auth.users;
   
   -- Дайте права администратора
   INSERT INTO module_access (user_id, module_name, has_access)
   VALUES 
       ('ВАШ_USER_ID', 'admin', true),
       ('ВАШ_USER_ID', 'livestock', true),
       ('ВАШ_USER_ID', 'agronomy', true);
   ```

### 7. Деплой на Vercel

#### Через GitHub (рекомендуется)

1. Закоммитьте изменения:
   ```bash
   git add .
   git commit -m "Настройка Supabase для нового проекта"
   git push origin main
   ```

2. Перейдите на https://vercel.com/dashboard
3. Нажмите **Add New** → **Project**
4. Выберите ваш GitHub репозиторий
5. Нажмите **Deploy**
6. Готово! Приложение доступно по адресу `https://ваш-проект.vercel.app`

#### Через Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

## Локальная разработка

```bash
# Установка зависимостей
npm install

# Запуск dev-сервера
npm run dev
```

Откройте http://localhost:3000

## Структура проекта

```
/
├── index.html                  # Главная страница - выбор модуля
├── database-schema.sql         # SQL схема базы данных
├── js/
│   ├── config.js              # Конфигурация Supabase
│   ├── main-selector.js       # Логика выбора модуля и авторизации
│   ├── app.js                 # Общий код приложения
│   ├── livestock/             # Модуль Животноводства
│   │   ├── index.html
│   │   └── modules/
│   │       ├── dashboard.js
│   │       ├── herd.js
│   │       ├── diets.js
│   │       └── ...
│   └── agronomy/              # Модуль Агрономии
│       ├── index.html
│       └── modules/
│           ├── dashboard.js
│           ├── fields.js
│           └── crops.js
├── admin/                      # Админ-панель
│   └── index.html
└── assets/                     # Ресурсы (иконки, фоны)
```

## База данных

### Таблицы авторизации
- `module_access` - доступ пользователей к модулям
- `pending_access_requests` - заявки на доступ (для будущего)

### Таблицы животноводства
- `farms_and_groups` - фермы и группы животных
- `herd_categories` - категории животных
- `group_category_heads` - распределение поголовья
- `herd_movements` - история перемещений
- `diets` - рационы кормления
- `feeds` - справочник кормов
- `diet_feeds` - состав рационов

### Таблицы агрономии
- `agro_crops` - культуры
- `agro_fields` - поля
- `agro_planting` - посевы (связь поле + культура + год)

## Система прав доступа

Проект использует простую систему прав на уровне модулей:
- **admin** - доступ к админ-панели (одобрение заявок)
- **livestock** - доступ к модулю животноводства
- **agronomy** - доступ к модулю агрономии
- **mechanization** - доступ к модулю механизации (в разработке)

После регистрации пользователь может попросить администратора дать ему доступ к нужным модулям.

## Решение проблем

### Регистрация не работает (не отправляется письмо)

**Причина**: Email confirmation включен, но SMTP не настроен.

**Решение**: Отключите email confirmation в Supabase:
1. **Authentication** → **Providers** → **Email**
2. Снимите галочку **"Confirm email"**
3. Сохраните

### Ошибка "auth.users violates foreign key constraint"

**Причина**: Пользователь был удален из auth.users, но остались записи в других таблицах.

**Решение**: Это не должно происходить благодаря `ON DELETE CASCADE`. Если произошло, очистите вручную:
```sql
DELETE FROM module_access WHERE user_id NOT IN (SELECT id FROM auth.users);
```

### Ошибка 500 при входе

**Причина**: RLS-политики блокируют доступ.

**Решение**: Убедитесь, что пользователю дан доступ к модулю:
```sql
SELECT * FROM module_access WHERE user_id = 'ВАШ_USER_ID';
```

## Особенности

- **PWA** - работает оффлайн, можно установить на устройство
- **Адаптивный дизайн** - работает на всех устройствах
- **Темная тема** - приятный для глаз интерфейс
- **Row Level Security** - безопасность на уровне БД
- **Автодеплой** - при push в main автоматически деплоится на Vercel

## Лицензия

MIT

