-- ============================================================================
-- ВОССТАНОВЛЕНИЕ ФУНКЦИЙ И СТРУКТУРЫ БД
-- Великополье Control Panel (модуль "Животноводство" + пользователи/сообщения)
-- Запускать целиком в Supabase SQL Editor.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. НЕДОСТАЮЩИЕ КОЛОНКИ
-- ----------------------------------------------------------------------------

alter table public.farms_and_groups
    add column if not exists age_range text,
    add column if not exists head_count integer not null default 0,
    add column if not exists prev_head_count integer not null default 0,
    add column if not exists last_change_reason text,
    add column if not exists last_change_amount integer not null default 0,
    add column if not exists last_change_at timestamptz;

alter table public.diets
    add column if not exists feeding_time text not null default 'I',
    add column if not exists norm_per_head numeric not null default 0,
    add column if not exists feed_id uuid references public.feeds(id) on delete cascade;

-- имя корма хранится в feeds (diets.name больше не обязательно)
alter table public.diets
    alter column name drop not null;

alter table public.feeds
    add column if not exists unit text not null default 'кг',
    add column if not exists price_per_unit numeric not null default 0;

alter table public.herd_movements
    add column if not exists source_farm_name text,
    add column if not exists source_group_name text,
    add column if not exists destination_farm_name text,
    add column if not exists destination_group_name text,
    add column if not exists destination_category_name text,
    add column if not exists reason text,
    add column if not exists comment text,
    add column if not exists quantity integer;

update public.herd_movements set quantity = heads where quantity is null;

alter table public.herd_movements
    alter column quantity set not null;

-- ----------------------------------------------------------------------------
-- 2. НЕДОСТАЮЩИЕ ТАБЛИЦЫ (пользователи, права, присутствие, сообщения)
-- ----------------------------------------------------------------------------

create table if not exists public.user_profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    login text unique,
    full_name text,
    position text,
    role text not null default 'user' check (role in ('user', 'admin')),
    is_blocked boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.user_permissions (
    user_id uuid primary key references auth.users(id) on delete cascade,
    can_view_dashboard boolean not null default false,
    can_view_herd boolean not null default false,
    can_view_diets boolean not null default false,
    can_view_reports boolean not null default false,
    can_view_history boolean not null default false,
    can_edit_herd boolean not null default false,
    can_edit_diets boolean not null default false,
    can_manage_movements boolean not null default false,
    can_manage_groups boolean not null default false,
    can_manage_categories boolean not null default false,
    can_view_users boolean not null default false,
    can_manage_users boolean not null default false,
    can_send_messages boolean not null default false,
    updated_at timestamptz not null default now()
);

create table if not exists public.user_presence (
    user_id uuid primary key references auth.users(id) on delete cascade,
    is_online boolean not null default false,
    last_seen_at timestamptz,
    current_module text
);

create table if not exists public.admin_messages (
    id uuid primary key default gen_random_uuid(),
    sender_id uuid references auth.users(id) on delete set null,
    sender_name text,
    recipient_id uuid not null references auth.users(id) on delete cascade,
    title text,
    message text not null,
    is_fullscreen boolean not null default true,
    requires_acknowledgement boolean not null default true,
    is_acknowledged boolean not null default false,
    reply_text text,
    acknowledged_at timestamptz,
    expires_at timestamptz,
    created_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;
alter table public.user_permissions enable row level security;
alter table public.user_presence enable row level security;
alter table public.admin_messages enable row level security;

-- ----------------------------------------------------------------------------
-- 3. ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ПРОВЕРКИ АДМИНА
-- ----------------------------------------------------------------------------

create or replace function public.is_current_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.module_access
        where user_id = auth.uid()
          and module_name = 'admin'
          and has_access = true
    );
$$;

-- ----------------------------------------------------------------------------
-- 4. RLS-ПОЛИТИКИ
-- ----------------------------------------------------------------------------

drop policy if exists "users read own profile" on public.user_profiles;
create policy "users read own profile" on public.user_profiles
    for select using (auth.uid() = id or is_current_admin());

drop policy if exists "admin updates profiles" on public.user_profiles;
create policy "admin updates profiles" on public.user_profiles
    for update using (is_current_admin());

drop policy if exists "users read own permissions" on public.user_permissions;
create policy "users read own permissions" on public.user_permissions
    for select using (auth.uid() = user_id or is_current_admin());

drop policy if exists "admin updates permissions" on public.user_permissions;
create policy "admin updates permissions" on public.user_permissions
    for update using (is_current_admin());

drop policy if exists "users manage own presence" on public.user_presence;
create policy "users manage own presence" on public.user_presence
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users read presence" on public.user_presence;
create policy "users read presence" on public.user_presence
    for select using (true);

drop policy if exists "users read own messages" on public.admin_messages;
create policy "users read own messages" on public.admin_messages
    for select using (auth.uid() = recipient_id or auth.uid() = sender_id);

drop policy if exists "recipient acknowledges message" on public.admin_messages;
create policy "recipient acknowledges message" on public.admin_messages
    for update using (auth.uid() = recipient_id);

-- ----------------------------------------------------------------------------
-- 5. ФУНКЦИИ ПРОФИЛЯ И ПРИСУТСТВИЯ
-- ----------------------------------------------------------------------------

create or replace function public.get_my_profile()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
    v_profile public.user_profiles;
    v_permissions public.user_permissions;
    v_access public.module_access;
begin
    if auth.uid() is null then
        raise exception 'Not authenticated';
    end if;

    select * into v_profile from public.user_profiles where id = auth.uid();

    if v_profile.id is null then
        insert into public.user_profiles (id, login, full_name)
        values (
            auth.uid(),
            split_part(coalesce(auth.jwt() ->> 'email', 'user'), '@', 1),
            coalesce(auth.jwt() #>> '{user_metadata,full_name}', 'Пользователь')
        )
        returning * into v_profile;
    end if;

    select * into v_permissions from public.user_permissions where user_id = auth.uid();

    if v_permissions.user_id is null then
        insert into public.user_permissions (user_id, can_view_dashboard)
        values (auth.uid(), false);
    end if;

    select * into v_access from public.module_access
    where user_id = auth.uid() and has_access = true limit 1;

    return jsonb_build_object(
        'profile', to_jsonb(v_profile),
        'permissions', to_jsonb(v_permissions),
        'module_access', to_jsonb(v_access)
    );
end;
$$;

create or replace function public.update_my_presence(p_module text default null)
returns void
language sql
security definer
set search_path = public
as $$
    insert into public.user_presence (user_id, is_online, last_seen_at, current_module)
    values (auth.uid(), true, now(), p_module)
    on conflict (user_id) do update
        set is_online = true,
            last_seen_at = now(),
            current_module = excluded.current_module;
$$;

create or replace function public.set_my_offline()
returns void
language sql
security definer
set search_path = public
as $$
    update public.user_presence
    set is_online = false, last_seen_at = now()
    where user_id = auth.uid();
$$;

-- ----------------------------------------------------------------------------
-- 6. АДМИН-ФУНКЦИИ (пользователи, права, блокировка)
-- ----------------------------------------------------------------------------

create or replace function public.admin_get_users()
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
                    'profile', to_jsonb(p),
                    'permissions', to_jsonb(per),
                    'presence', to_jsonb(pr)
                )
                order by p.full_name
            )
            from public.user_profiles p
            left join public.user_permissions per on per.user_id = p.id
            left join public.user_presence pr on pr.user_id = p.id
        ),
        '[]'::jsonb
    );
end;
$$;

create or replace function public.admin_update_permissions(
    p_user_id uuid,
    p_permissions jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_allowed text[] := array[
        'can_view_dashboard', 'can_view_herd', 'can_view_diets',
        'can_view_reports', 'can_view_history', 'can_edit_herd',
        'can_edit_diets', 'can_manage_movements', 'can_manage_groups',
        'can_manage_categories', 'can_view_users', 'can_manage_users',
        'can_send_messages'
    ];
    v_key text;
    v_value boolean;
begin
    if not is_current_admin() then
        raise exception 'Только администратор может изменять разрешения.';
    end if;

    update public.user_permissions
    set updated_at = now()
    where user_id = p_user_id;

    if not found then
        insert into public.user_permissions (user_id) values (p_user_id);
    end if;

    for v_key, v_value in
        select key, (value)::boolean
        from jsonb_each_text(p_permissions)
    loop
        if v_key = any(v_allowed) then
            execute format(
                'update public.user_permissions set %I = $1 where user_id = $2'
            ) using v_value, p_user_id;
        end if;
    end loop;

    return p_permissions;
end;
$$;

create or replace function public.admin_set_user_blocked(
    p_user_id uuid,
    p_blocked boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if not is_current_admin() then
        raise exception 'Только администратор может блокировать пользователей.';
    end if;

    update public.user_profiles
    set is_blocked = p_blocked, updated_at = now()
    where id = p_user_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- 7. ФУНКЦИИ СООБЩЕНИЙ
-- ----------------------------------------------------------------------------

create or replace function public.get_my_unread_messages()
returns setof public.admin_messages
language sql
stable
security definer
set search_path = public
as $$
    select *
    from public.admin_messages
    where recipient_id = auth.uid()
      and is_acknowledged = false
      and (expires_at is null or expires_at > now())
    order by created_at desc;
$$;

create or replace function public.acknowledge_message(
    p_message_id uuid,
    p_reply_text text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    update public.admin_messages
    set is_acknowledged = true,
        reply_text = p_reply_text,
        acknowledged_at = now()
    where id = p_message_id
      and recipient_id = auth.uid();
end;
$$;

create or replace function public.admin_send_message(
    p_recipient_id uuid,
    p_title text,
    p_message text,
    p_is_fullscreen boolean default true,
    p_requires_acknowledgement boolean default true,
    p_expires_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_id uuid;
begin
    if not is_current_admin() then
        raise exception 'Только администратор может отправлять сообщения.';
    end if;

    insert into public.admin_messages (
        sender_id, sender_name, recipient_id, title, message,
        is_fullscreen, requires_acknowledgement, expires_at
    )
    values (
        auth.uid(),
        coalesce(
            (select full_name from public.user_profiles where id = auth.uid()),
            'Администратор'
        ),
        p_recipient_id, p_title, p_message,
        p_is_fullscreen, p_requires_acknowledgement, p_expires_at
    )
    returning id into v_id;

    return v_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- 8. ФУНКЦИИ ПОГОЛОВЬЯ
-- ----------------------------------------------------------------------------

create or replace function public.replace_group_category_heads(
    p_group_id uuid,
    p_distribution jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_item jsonb;
    v_total integer := 0;
begin
    delete from public.group_category_heads where group_id = p_group_id;

    for v_item in select * from jsonb_array_elements(p_distribution)
    loop
        if coalesce((v_item ->> 'heads')::int, 0) > 0 then
            insert into public.group_category_heads (group_id, category_id, heads)
            values (
                p_group_id,
                (v_item ->> 'category_id')::uuid,
                (v_item ->> 'heads')::int
            )
            on conflict (group_id, category_id)
            do update set heads = excluded.heads, updated_at = now();

            v_total := v_total + (v_item ->> 'heads')::int;
        end if;
    end loop;

    update public.farms_and_groups
    set head_count = v_total,
        prev_head_count = v_total,
        updated_at = now()
    where id = p_group_id;
end;
$$;

create or replace function public.set_group_heads(
    p_group_id uuid,
    p_new_count integer,
    p_distribution jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_old_count integer;
begin
    select head_count into v_old_count
    from public.farms_and_groups
    where id = p_group_id
    for update;

    if v_old_count is null then
        raise exception 'Группа не найдена.';
    end if;

    perform public.replace_group_category_heads(p_group_id, p_distribution);

    update public.farms_and_groups
    set head_count = p_new_count,
        prev_head_count = v_old_count,
        last_change_amount = p_new_count - v_old_count,
        last_change_reason = 'Изменение поголовья',
        last_change_at = now(),
        updated_at = now()
    where id = p_group_id;
end;
$$;

create or replace function public.register_herd_movement(
    p_movement_type text,
    p_source_group_id uuid,
    p_quantity integer,
    p_source_distribution jsonb default null,
    p_destination_group_id uuid default null,
    p_destination_category_id uuid default null,
    p_reason text default null,
    p_comment text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_source public.farms_and_groups%ROWTYPE;
    v_destination public.farms_and_groups%ROWTYPE;
    v_category public.herd_categories%ROWTYPE;
    v_id uuid;
    v_type text;
begin
    if p_movement_type not in ('arrival', 'departure', 'slaughter', 'death',
                               'realization', 'mortality', 'transfer') then
        raise exception 'Недопустимый тип операции: %', p_movement_type;
    end if;

    v_type := p_movement_type;

    select * into v_source
    from public.farms_and_groups
    where id = p_source_group_id;

    if v_source.id is null then
        raise exception 'Исходная группа не найдена.';
    end if;

    if v_type in ('realization', 'mortality', 'departure', 'slaughter', 'death') then
        if v_source.head_count < p_quantity then
            raise exception 'Недостаточно поголовья в группе (% < %).',
                v_source.head_count, p_quantity;
        end if;
    end if;

    if p_destination_group_id is not null then
        select * into v_destination
        from public.farms_and_groups
        where id = p_destination_group_id;

        if v_destination.id is null then
            raise exception 'Группа назначения не найдена.';
        end if;
    else
        v_destination := null;
    end if;

    if p_destination_category_id is not null then
        select * into v_category
        from public.herd_categories
        where id = p_destination_category_id;

        if v_category.id is null then
            raise exception 'Категория назначения не найдена.';
        end if;
    else
        v_category := null;
    end if;

    insert into public.herd_movements (
        group_id, category_id, event_date, movement_type, heads, quantity,
        notes, reason, comment,
        source_farm_name, source_group_name,
        destination_farm_name, destination_group_name, destination_category_name
    )
    values (
        p_source_group_id,
        coalesce(
            p_destination_category_id,
            (
                select (item ->> 'category_id')::uuid
                from jsonb_array_elements(p_source_distribution) item
                where coalesce((item ->> 'heads')::int, 0) > 0
                order by (item ->> 'heads')::int desc
                limit 1
            )
        ),
        current_date,
        v_type,
        p_quantity,
        p_quantity,
        p_comment,
        p_reason,
        p_comment,
        v_source.farm_name, v_source.group_name,
        v_destination.farm_name, v_destination.group_name,
        v_category.name
    )
    returning id into v_id;

    if v_type in ('realization', 'mortality', 'transfer', 'departure', 'slaughter', 'death') then
        update public.farms_and_groups
        set head_count = head_count - p_quantity,
            prev_head_count = head_count,
            last_change_amount = -p_quantity,
            last_change_reason = coalesce(p_reason, v_type),
            last_change_at = now(),
            updated_at = now()
        where id = p_source_group_id;

        if p_source_distribution is not null then
            delete from public.group_category_heads where group_id = p_source_group_id;

            insert into public.group_category_heads (group_id, category_id, heads)
            select p_source_group_id,
                   (item ->> 'category_id')::uuid,
                   (item ->> 'heads')::int
            from jsonb_array_elements(p_source_distribution) item
            where coalesce((item ->> 'heads')::int, 0) > 0;
        end if;
    end if;

    if v_type = 'transfer' and v_destination.id is not null then
        update public.farms_and_groups
        set head_count = head_count + p_quantity,
            prev_head_count = head_count,
            last_change_amount = p_quantity,
            last_change_reason = 'Перевод животных',
            last_change_at = now(),
            updated_at = now()
        where id = v_destination.id;

        if v_category.id is not null then
            insert into public.group_category_heads (group_id, category_id, heads)
            values (v_destination.id, v_category.id, p_quantity)
            on conflict (group_id, category_id)
            do update set heads = public.group_category_heads.heads + excluded.heads,
                          updated_at = now();
        end if;
    end if;

    return v_id;
end;
$$;

create or replace function public.undo_last_herd_movement(p_pin text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_movement record;
begin
    if p_pin is null or length(trim(p_pin)) < 4 then
        raise exception 'Введите PIN (минимум 4 символа).';
    end if;

    select * into v_movement
    from public.herd_movements
    order by created_at desc
    limit 1
    for update;

    if v_movement.id is null then
        raise exception 'История операций пуста.';
    end if;

    if v_movement.movement_type in ('realization', 'mortality', 'transfer') then
        update public.farms_and_groups
        set head_count = head_count + v_movement.quantity,
            updated_at = now()
        where id = v_movement.group_id;
    end if;

    if v_movement.movement_type = 'transfer'
       and v_movement.destination_farm_name is not null then
        update public.farms_and_groups
        set head_count = greatest(head_count - v_movement.quantity, 0),
            updated_at = now()
        where id = (
            select id from public.farms_and_groups
            where farm_name = v_movement.destination_farm_name
              and group_name = v_movement.destination_group_name
            limit 1
        );
    end if;

    delete from public.herd_movements where id = v_movement.id;
end;
$$;

-- ----------------------------------------------------------------------------
-- 9. УНИКАЛЬНЫЙ КОНСТРАЙНТ ДЛЯ UPSERT КАТЕГОРИЙ НАЗНАЧЕНИЯ
-- ----------------------------------------------------------------------------

alter table public.group_category_heads
    drop constraint if exists group_category_heads_group_category_unique;

create unique index if not exists group_category_heads_group_category_unique
    on public.group_category_heads (group_id, category_id);

-- ----------------------------------------------------------------------------
-- 10. RPC �����-������: ���������� �������� � ��������
-- ----------------------------------------------------------------------------

create or replace function public.admin_get_users_with_access()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
    if not is_current_admin() then
        raise exception '������ ������������� ����� �������� ������ �������������.';
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
        raise exception '������ ������������� ����� ��������� ��������.';
    end if;

    if p_module_name not in ('livestock', 'agronomy', 'mechanization', 'admin') then
        raise exception '����������� ������: %', p_module_name;
    end if;

    if p_module_name = 'admin'
        and p_user_id = auth.uid()
        and p_has_access = false then
        raise exception '������ ����� � ���� ������ � �����������������.';
    end if;

    insert into public.module_access (user_id, module_name, has_access, updated_at)
    values (p_user_id, p_module_name, p_has_access, now())
    on conflict (user_id, module_name)
    do update set has_access = excluded.has_access, updated_at = now();
end;
$$;

grant execute on function public.admin_get_users_with_access() to authenticated;
grant execute on function public.admin_set_module_access(uuid, text, boolean) to authenticated;

-- ============================================================
-- ПРЕДЛОЖЕНИЯ ПОЛЬЗОВАТЕЛЕЙ (suggestions)
-- ============================================================
create table if not exists public.suggestions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete set null,
    user_name text not null default 'Неизвестный',
    page text,
    text text not null check (char_length(text) between 3 and 1000),
    is_done boolean not null default false,
    created_at timestamptz not null default now()
);

alter table public.suggestions enable row level security;

drop policy if exists "suggestions_insert" on public.suggestions;
create policy "suggestions_insert"
    on public.suggestions for insert
    to authenticated
    with check (auth.uid() = user_id);

drop policy if exists "suggestions_admin_select" on public.suggestions;
create policy "suggestions_admin_select"
    on public.suggestions for select
    to authenticated
    using (exists (
        select 1 from public.module_access a
        where a.user_id = auth.uid()
          and a.module_name = 'admin'
          and a.has_access
    ));

drop policy if exists "suggestions_admin_update" on public.suggestions;
create policy "suggestions_admin_update"
    on public.suggestions for update
    to authenticated
    using (exists (
        select 1 from public.module_access a
        where a.user_id = auth.uid()
          and a.module_name = 'admin'
          and a.has_access
    ));

drop policy if exists "suggestions_admin_delete" on public.suggestions;
create policy "suggestions_admin_delete"
    on public.suggestions for delete
    to authenticated
    using (exists (
        select 1 from public.module_access a
        where a.user_id = auth.uid()
          and a.module_name = 'admin'
          and a.has_access
    ));
