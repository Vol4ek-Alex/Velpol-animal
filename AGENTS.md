# Velpol-animal — «Великополье Control Panel»

Агропортал СХК «Великополье»: статическое PWA-приложение без сборки (Vanilla JS + Supabase), из трёх отраслевых модулей и админ-панели.

- GitHub: https://github.com/Vol4ek-Alex/Velpol-animal.git (ветка `main`, деплой в Vercel при push)
- Локально: `C:\Users\sasha\OneDrive\Рабочий стол\Velpol-animal-main`
- Лицензия: MIT, версия в package.json — 2.0.0

---

## 1. Обзор проекта

Приложение управления сельхозпредприятием. Точка входа — `index.html`: вход/регистрация + выбор отрасли:

| Модуль | Статус | URL |
|---|---|---|
| 🐄 Животноводство (livestock) | рабочий | `js/livestock/index.html` |
| 🚜 Механизация (mechanization) | рабочий | `js/mechanization/index.html` |
| 🌾 Агрономия (agronomy) | заглушка «в разработке» | `js/agronomy/index.html` |
| ⚙️ Администрирование (admin) | рабочий | `admin/index.html` |

Доступ к каждой отрасли контролируется таблицей `module_access` (админ выдаёт/отбирает доступ из админки). Новые пользователи после регистрации попадают в очередь верификации.

## 2. Технологический стек

- **Frontend**: чистый Vanilla JS (ES5-стиль, IIFE + глобальные объекты `window.*Module`), HTML5, CSS3 (тёмная glass-тема, CSS-переменные `--glass`, `--green` и т.д.). Фреймворков и бандлера **нет**.
- **Backend-as-a-Service**: Supabase (PostgreSQL + Auth + RLS + RPC). Клиент `@supabase/supabase-js@2` подключается **с CDN** (`cdn.jsdelivr.net`) — не из npm.
- **PWA**: `manifest.json` + Service Worker `sw.js` (network-first кэш, офлайн-фолбэк). Версия кэша `velpol-agro-v17`, версия приложения `1.1.4`.
- **Шрифты**: Google Fonts (Exo 2, JetBrains Mono).
- **Деплой**: Vercel (статика, `vercel.json`) + GitHub Actions (`.github/workflows/deploy.yml`), секреты `VERCEL_TOKEN/ORG_ID/PROJECT_ID`.
- **Dev-сервер**: только `http-server` (devDependency).

## 3. Команды

```bash
npm install        # установить http-server
npm run dev        # npx http-server -p 3000 → http://localhost:3000
npm run build      # no-op (статический сайт, сборки нет)
npm run deploy     # vercel --prod
```

Тестов и линтеров в проекте **нет**. Проверка изменений — вручную в браузере.

**Критично при любом изменении JS/HTML/CSS**: поднять версию кэша в `sw.js` (`CACHE_NAME = 'velpol-agro-v10'` → v11, v12…) и при необходимости добавить новые файлы в `APP_FILES`, иначе клиенты получат старую версию.

**Версия приложения**: после любого улучшения/обновления повышать версию в футере экрана выбора отрасли (`index.html`, `#app-version`) на 0.0.1 (например, `v1.1.3` → `v1.1.4`) и синхронизировать её с `APP_VERSION` в `sw.js`.

## 4. Структура директорий

```
/
├── index.html                 # Вход/регистрация + выбор отрасли (главная)
├── js/
│   ├── config.js              # SUPABASE_URL/KEY → глобальный клиент `db`; window.state
│   ├── main-selector.js       # Логика главной: checkAuth, handleAuth/Register/Login, selectModule (проверка module_access), регистрация SW
│   ├── app.js                 # Ядро модуля «Животноводство»: роутер navigate/renderCurrentModule, права, редактор-режим, welcome-экран, меню, окно предложения (suggestions), showSimpleMessage/alert-замена, escapeHtml
│   ├── livestock/
│   │   ├── index.html         # SPA-оболочка животноводства: sidebar, #main-content, ВСЕ стили инлайн в <style>
│   │   └── modules/
│   │       ├── common.js      # window.CommonUtils (debounce, formatDate, formatCurrency), checkModuleAuth
│   │       ├── auth.js        # window.AuthModule: initialize, loadAccess (module_access), isAdmin/hasPermission
│   │       ├── dashboard.js   # window.DashboardModule — «Статистика»
│   │       ├── diets.js       # window.DietsModule — «Рационы & Корм» (диеты, корма)
│   │       ├── herd.js        # window.HerdModule — «Поголовье» (фермы/группы, распределение по категориям)
│   │       ├── categories.js  # window.CategoriesModule — категории животных + распределение голов
│   │       ├── movements.js   # window.MovementsModule — перемещения животных (реализация/падёж/перевод)
│   │       ├── reports.js     # window.ReportsModule — «Потребность» (расчёт потребности в кормах)
│   │       └── history.js     # window.HistoryModule — «История операций» (только админ)
│   ├── mechanization/         # САМОДОСТАТОЧНЫЙ модуль, свой клиент window._supabase
│   │   ├── index.html         # Оболочка + встроенный <script type="module">: navigate, checkMechAccess, welcome, меню, предложения
│   │   ├── dashboard.js       # init() — «Статистика»: счётчики ТО, гарантия/документы, задачи
│   │   └── fleet.js           # init() — «Автопарк»: техника, водители, теги, категории, задачи, наработка часов
│   └── agronomy/index.html    # Статическая заглушка
├── admin/
│   ├── index.html             # Админ-панель (стили частично инлайн + ../styles/main.css)
│   └── admin-script.js        # Вкладки: requests (верификация), users (доступы), suggestions; RPC-вызовы
├── styles/main.css            # Стили только главной + админки (у отраслевых модулей CSS инлайн)
├── sw.js                      # Service Worker, кэш velpol-agro-v10
├── manifest.json              # PWA манифест
├── vercel.json                # Заголовки безопасности + Service-Worker-Allowed
├── docs/
│   ├── mech-schema.sql        # Схема таблиц механизации (vehicles, vehicle_tasks, fleet_*)
│   └── restore-functions.sql  # Полное восстановление функций/структур БД животноводства (запускать целиком в SQL Editor)
├── assets/
│   ├── backgrounds/*.jpg      # Фоны карточек/модулей (крупные, до 1.2 МБ)
│   └── icons/                 # icon.svg, 192/512 png
└── .github/workflows/deploy.yml
```

## 5. Основные модули и их назначение

### Главная (`index.html` + `main-selector.js`)
- `checkAuth()` — показ входа или сетки модулей; `checkAdminAccess()` — класс `has-admin` → admin-dock.
- Регистрация: `db.auth.signUp({email, password, options.data.full_name})`. Логин и полный профиль создаёт только админ-верификация.
- `selectModule()` — проверяет `module_access` (module_name = выбранная отрасль, has_access=true), кладёт `velpol_user`/`velpol_module` в localStorage и редиректит.

### Животноводство (главный модуль, ~25 тыс. строк)
Архитектура: каждый файл `modules/*.js` — IIFE, определяющий глобальный объект `window.<Name>Module` с методом `render()`. `js/app.js` — роутер: `navigate(module)` проверяет доступ (admin или `user_permissions.can_view_*`), скрывает недоступные пункты меню, рендерит модуль в `#main-content`. Глобальное состояние — `window.state` (`activeModule`, `currentFarm` — фильтр «Все объекты», `isEditMode` — плавающая кнопка-переключатель редактирования для Поголовья/Рационов).
- История операций (`history`) — только для админа (финансовый отчёт по кормам).
- Приветствие: day-part + полное имя из `user_profiles`.
- Все данные — прямые запросы Supabase (`db.from('farms_and_groups')...`), часто `Promise.all` из нескольких таблиц; перемещения — через RPC `register_herd_movement`, распределение голов — RPC `replace_group_category_heads`/`set_group_heads`.

### Механизация (самодостаточная, отличается!)
- Свои константы Supabase прямо в `index.html`, клиент — `window._supabase` (не `db`).
- ES-модули: `dashboard.js`/`fleet.js` экспортируют `init()`; роутер — inline `<script type="module">`.
- Права: запись разрешена админу и пользователям с правом `mechanization_edit` (выдаётся в админке селектом «Механизация · редактирование»); остальные с `mechanization` — только чтение (RLS `_select_auth` / `_edit_all` через `can_edit_mechanization()`). Плавающая кнопка ✏️ включает режим записи; зритель её включить не может (`window._mechCanEdit`).
- fleet.js: CRUD техники (vehicles), модалки водителей/тегов/категорий/задач/часов; dashboard.js: гарантия, ТО, документы. Оба файла переписаны в 2026-10 (кэш v17) с сохранением бизнес-логики.

### Админ-панель
Три вкладки: **Верификация** (pending-заявки → `admin_verify_account` / `admin_reject_account`), **Доступы** (`admin_get_users_with_access`, чекбоксы → `admin_set_module_access`, снятие верификации → `admin_revoke_verification`), **Предложения** (suggestions, mark done/delete).
Вход: сессия + `module_access.admin` иначе редирект на главную.

## 6. Supabase

- Проект ref: **xoouaazntzbkjwyzggiz** (НЕ eaiitxfoqlkmykyqqapg), URL `https://xoouaazntzbkjwyzggiz.supabase.co`, publishable ключ `sb_publishable_NEv4wb8ErPkNk5e8OVf-5A_XRaVFW6-` (это публичный ключ, лежит в клиентском коде намеренно; вся защита — через RLS).

### Таблицы (все с RLS)
- `auth.users` — Supabase Auth.
- `user_profiles (id→auth.users, login, full_name, position, role user|admin, is_blocked)`; RPC `get_my_profile()`.
- `account_verification (user_id, email, full_name, status pending|approved|rejected)` — триггеры на INSERT в `auth.users` и `user_profiles` создают запись `pending`. RLS: admin all, insert self.
- `module_access (user_id, module_name, has_access)` — отрасли: livestock/mechanization/agronomy/admin; гранулярные права: `livestock_edit`, `mechanization_edit`; админ = строка с `admin`.
- `user_permissions (user_id, can_view_dashboard/herd/diets/reports/history, can_edit_herd/diets, can_manage_*, ...)` — тонкие права животноводства.
- `pending_access_requests`, `user_presence`, `admin_messages`.
- Животноводство: `farms_and_groups` (фермы/группы, head_count, last_change_*), `herd_categories`, `group_category_heads`, `herd_movements`, `diets` (feeding_time, norm_per_head, feed_id), `feeds` (unit, price_per_unit), `diet_feeds`.
- Механизация: `vehicles`, `vehicle_tasks`, `fleet_drivers`, `fleet_categories`, `fleet_tags` (RLS: select authenticated, запись — только `can_edit_mechanization()`: admin или `mechanization_edit`).
- Предложения: `suggestions (user_id, user_name, page, text, is_done)`; RLS: authenticated insert self, **anon insert true**.
- Агрономия: `agro_crops`, `agro_fields`, `agro_planting` (пустые, на будущее).

### RPC (security definer)
- **Верификация**: `admin_verify_account(p_user_id)` — approved + создаёт `user_profiles` (login=email) + `module_access` livestock/mechanization; `admin_reject_account(p_user_id)` — rejected + чистит module_access/user_permissions/user_profiles/account_verification (auth.users из SQL не удалить); `admin_revoke_verification(p_user_id)`.
- **Доступы/админ**: `admin_set_module_access`, `admin_get_users_with_access`, `admin_get_user_access`, `admin_get_users`, `admin_set_user_blocked`, `admin_update_permissions`, `admin_send_message`; пользовательские `get_my_profile`, `get_my_unread_messages`, `acknowledge_message`.
- **Животноводство**: `register_herd_movement`, `set_group_heads`, `replace_group_category_heads`, `undo_last_herd_movement(p_pin)`, `update_my_presence`, `set_my_offline`.
- Вспомогательная: `is_current_admin()`.

## 7. Потоки данных

1. **Регистрация** → `auth.signUp` → триггер → `account_verification(pending)`. Профилей и доступов нет.
2. **Вход** → `checkAuth` → сетка модулей; `selectModule` → запрос `module_access` → без доступа alert, с доступом — редирект + `velpol_user` в localStorage.
3. **В отраслевом модуле** → `AuthModule.initialize()` / `checkMechAccess()` → повторная проверка `module_access`; нет — signOut + редирект.
4. **Данные** → модуль `loadData()` (Supabase select) → `render()` пишет innerHTML в `#main-content` (строки всегда через `escapeHtml`!). Изменения → RPC или прямые insert/update/delete → перезагрузка данных.
5. **Предложения** → FAB-кнопка → `suggestions.insert` → видны админу на вкладке Предложения.

## 8. Архитектурные решения и паттерны

- **Без фреймворков и сборки**: модуль = глобальный объект с `render()`; «роутинг» — манипуляция DOM + `window.state.activeModule`.
- **Модули механизации на ES-модулях** (export/import) — единственное место с `type="module"`.
- **CSS**: у каждой отрасли свои инлайн-стили в её index.html (единая тёмная glass-палитра через CSS-переменные); `styles/main.css` — только главная и админка. Не пытаться «централизовать» без необходимости.
- **Безопасность**: вся она на стороне Supabase (RLS + security definer RPC + `is_current_admin()`); клиентские проверки — только UX. Права записи в отрасли: `can_edit_livestock()` / `can_edit_mechanization()` (admin или `<module>_edit`) — RLS-политики `_edit_all` и RPC животноводства проверяют их на сервере.
- ** alert() переопределён** в app.js на стилизованное окно `showSimpleMessage` (в мех. — своя реализация).
- **Аутентификация на клиенте дублируется**: localStorage `velpol_user`/`velpol_module` — fallback, источник истины — `db.auth.getSession()`.
- **PWA**: network-first + кэш-фолбэк; навигации фолбэчатся на `./index.html`.

## 9. Соглашения по коду и стилю

- **Язык кода и UI — русский**: комментарии, сообщения, названия разделов — по-русски; идентификаторы — по-английски.
- Файлы модулей: IIFE + `'use strict'`; объекты `window.<X>Module`; у модулей helpers `escape()`, `number()`, `canView()`, `canEdit()`.
- HTML-строки — шаблонные литералы; **любой пользовательский контент — через `window.escapeHtml`**.
- События: mix inline `onclick` (в HTML) и `addEventListener`; глобальные обработчики для динамических кнопок вешаются на `window.*` (например `window.closeVModal`).
- Коммит-сообщения: русскоязычные, описательные (см. `git log`); мелкие логические фиксы — отдельными коммитами.
- Табы/пробелы: 4 пробела; стиль свободный, главное — не смешивать в одном файле кардинально.
- Комментарии-обоснования на русском для неочевидных решений (см. app.js).

## 10. Известные ограничения и нюансы

- **Не поднимать кэш в sw.js → пользователи не увидят обновлений.** Сейчас `velpol-agro-v17`.
- **README.md частично устарел**: упоминает `database-schema.sql` (нет в репо), модуль агрономии с модулями, старую схему прав. Ориентир — этот файл и `docs/*.sql`.
- Регистрация не даёт доступа ни к чему: без одобрения админом пользователь «висит» в верификации; email-подтверждение в Supabase должно быть отключено либо настроен SMTP.
- Удалить пользователя целиком нельзя из SQL/клиента — только из Supabase Dashboard (auth.users).
- Механизация и Животноводство — два разных паттерна интеграции (свой клиент vs общий `db`); при изменениях Supabase-констант править в двух местах (`js/config.js` и inline в `js/mechanization/index.html`) плюс `admin` использует `../js/config.js`.
- `AuthModule.hasPermission()` теперь учитывает флаг `livestock_edit` для редактирования поголовья/рационов и управления перемещениями; финансовая история (`can_view_history`) остаётся только у админа.
- Крупные JPG-фоны (до 1.2 МБ) в кэше SW — тяжёлый первый инсталл.
- Среда разработки: Windows, PowerShell, `rg` не установлен — для поиска по файлам использовать `Select-String`.
- Ключевые коммиты истории: f794b4c, 1e8e8dc, cac4164, cb1835d (верификация/мобильные фиксы), далее — редизайн механизации и кэш v8–v10.
