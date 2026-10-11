# Velpol-animal — памятка по проекту

Агропортал «Великополье Control Panel». GitHub: https://github.com/Vol4ek-Alex/Velpol-animal.git (ветка main).
Локально: C:\Users\sasha\OneDrive\Рабочий стол\Velpol-animal-main

## Supabase
- Проект: Velpol-animal, ref xoouaazntzbkjwyzggiz (НЕ eaiitxfoqlkmykyqqapg)
- URL: https://xoouaazntzbkjwyzggiz.supabase.co
- Publishable ключ: sb_publishable_NEv4wb8ErPkNk5e8OVf-5A_XRaVFW6-

## Структура
- index.html — выбор отрасли + вход/регистрация (js/main-selector.js, js/config.js)
- js/livestock/index.html + js/livestock/modules/*.js — Животноводство (вход через js/app.js + modules/auth.js)
- js/mechanization/index.html + dashboard.js, fleet.js — Механизация (самодостаточная)
- js/agronomy/index.html — заглушка «в разработке»
- admin/index.html + admin-script.js — админка (вкладки: Верификация, Доступы, Предложения)
- styles/main.css, sw.js (кэш velpol-agro-v7 — поднимать версию при изменениях!)

## Таблицы Supabase
- auth.users — регистрация через db.auth.signUp (main-selector.js)
- user_profiles (id, login, full_name) — профили; триггер trg_profile_created_verification
- account_verification (user_id, email, full_name, status pending/approved/rejected) — триггер trg_auth_user_created_verification на auth.users AFTER INSERT → запись pending. RLS: admin all, insert self
- module_access (user_id, module_name, has_access) — доступ к отраслям; админ = module_name 'admin'
- user_permissions, pending_access_requests
- suggestions (user_id, user_name, page, text, is_done) — предложения (FAB-кнопка), RLS: authenticated insert self, anon insert true

## RPC (security definer)
- admin_verify_account(p_user_id) — status=approved + создаёт user_profiles из auth.users
- admin_reject_account(p_user_id) — status=rejected + удаление module_access, user_permissions, user_profiles (auth.users из SQL удалить нельзя)
- admin_get_users_with_access() — список для вкладки Доступы

## Важные особенности
- Регистрация НЕ создаёт user_profiles и module_access: новый пользователь попадает в Верификацию как pending; без module_access в отрасль не попадёт (selectModule проверяет).
- Коммиты: f794b4c, 1e8e8dc, cac4164, cb1835d.
- Мобильное: FAB-меню только ≤700px, приветствие (day-part + полное имя из user_profiles), admin-dock внизу.
- rg не установлен — использовать Select-String. Shell: PowerShell.
