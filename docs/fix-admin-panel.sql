-- ============================================================================
-- ФИКС АДМИН-ПАНЕЛИ: управление доступом пользователей к отраслям
-- Запустить в Supabase SQL Editor целиком.
-- Проблема: RLS таблицы module_access разрешает читать/менять только свои
-- строки, поэтому админ-панель не могла ни видеть, ни выдавать доступ другим.
-- ============================================================================

-- 1. Список пользователей с их доступом к отраслям
create or replace function public.admin_get_users_with_access()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
    if not is_current_admin() then
        raise exception 'Только администратор может получать список пользователей.';
    end if;

    return coalesce(
        (
            select jsonb_agg(
                jsonb_build_object(
                    'id', p.id,
                    'full_name', p.full_name,
                    'login', p.login,
                    'position', p.position,
                    'role', p.role,
                    'is_blocked', p.is_blocked,
                    'created_at', p.created_at,
                    'access', coalesce(
                        (
                            select jsonb_agg(m.module_name order by m.module_name)
                            from public.module_access m
                            where m.user_id = p.id and m.has_access = true
                        ),
                        '[]'::jsonb
                    )
                )
                order by p.full_name
            )
            from public.user_profiles p
        ),
        '[]'::jsonb
    );
end;
$$;

-- 2. Выдача/снятие доступа к отрасли
create or replace function public.admin_set_module_access(
    p_user_id uuid,
    p_module_name text,
    p_has_access boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if not is_current_admin() then
        raise exception 'Только администратор может управлять доступом.';
    end if;

    if p_module_name not in ('livestock', 'agronomy', 'mechanization', 'admin') then
        raise exception 'Неизвестный модуль: %', p_module_name;
    end if;

    if p_module_name = 'admin'
        and p_user_id = auth.uid()
        and p_has_access = false then
        raise exception 'Нельзя снять с себя доступ к администрированию.';
    end if;

    insert into public.module_access (user_id, module_name, has_access, updated_at)
    values (p_user_id, p_module_name, p_has_access, now())
    on conflict (user_id, module_name)
    do update set has_access = excluded.has_access, updated_at = now();
end;
$$;

grant execute on function public.admin_get_users_with_access() to authenticated;
grant execute on function public.admin_set_module_access(uuid, text, boolean) to authenticated;
