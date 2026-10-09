# Velpol Agro System

Многомодульная система управления сельским хозяйством с тремя направлениями:
- 🐄 **Животноводство** - учет поголовья и рационов кормления
- 🌾 **Агрономия** - управление культурами, полями и гектарами
- 🚜 **Механизация** - учет техники и работ (в разработке)

## Технологический стек

- **Frontend**: Vanilla JS, HTML5, CSS3
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Deployment**: Vercel + GitHub Actions
- **PWA**: Service Worker + Manifest

## Архитектура

```
/
├── index.html                  # Главная страница - выбор модуля
├── manifest.json               # PWA манифест
├── sw.js                       # Service Worker
├── vercel.json                 # Конфигурация Vercel
│
├── assets/                     # Общие ресурсы
│   ├── bg-farm.jpg
│   └── icon.svg
│
├── js/
│   ├── config.js              # Конфигурация Supabase
│   ├── app.js                 # Общий код приложения
│   │
│   ├── modules/               # Общие модули
│   │   ├── auth.js           # Аутентификация
│   │   ├── permissions.js    # Система прав доступа
│   │   └── messages.js       # Уведомления
│   │
│   ├── livestock/            # Модуль Животноводства
│   │   ├── index.html
│   │   └── modules/
│   │       ├── categories.js
│   │       ├── dashboard.js
│   │       ├── diets.js
│   │       ├── herd.js
│   │       ├── movements.js
│   │       ├── reports.js
│   │       ├── history.js
│   │       └── users.js
│   │
│   └── agronomy/             # Модуль Агрономии
│       ├── index.html
│       └── modules/
│           ├── dashboard.js
│           ├── fields.js
│           ├── crops.js
│           └── statistics.js
│
└── mechanization/            # Модуль Механизации (в разработке)
    └── index.html
```

## База данных Supabase

### Таблицы для Животноводства
- `users` - пользователи системы
- `farms` - фермы/хозяйства
- `categories` - категории животных
- `livestock` - поголовье
- `movements` - перемещения животных
- `feeds` - справочник кормов
- `diets` - рационы кормления

### Таблицы для Агрономии
- `agro_fields` - поля
- `agro_crops` - культуры
- `agro_planting` - посадки (связь поле + культура + год)
- `agro_predecessors` - предшественники

### Система прав
- `module_access` - доступ пользователей к модулям (livestock, agronomy, mechanization)

## Установка и запуск

1. **Клонировать репозиторий**:
   ```bash
   git clone <repository-url>
   cd velpol-animal-main
   ```

2. **Настроить Supabase**:
   - Создать проект в Supabase
   - Выполнить SQL-миграции из `sql/schema.sql`
   - Обновить credentials в `js/config.js`

3. **Локальная разработка**:
   ```bash
   npm install
   npm run dev
   ```
   Открыть http://localhost:3000

4. **Деплой на Vercel**:
   ```bash
   npm install -g vercel
   vercel login
   vercel --prod
   ```

## GitHub Actions CI/CD

При push в ветку `main` автоматически происходит деплой на Vercel через GitHub Actions.

## Особенности

- **PWA** - работает оффлайн, можно установить на устройство
- **Адаптивный дизайн** - работает на всех устройствах
- **Темная тема** - приятный для глаз интерфейс
- **Система прав** - администраторы управляют доступом к модулям
- **Real-time обновления** - через Supabase Realtime

## Разработка

- Все модули изолированы друг от друга
- Общий код в `js/app.js` и `js/modules/`
- Единая стилистика через CSS переменные
- Единая база данных Supabase

## Лицензия

MIT
