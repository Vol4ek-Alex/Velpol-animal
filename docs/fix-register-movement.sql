-- ============================================================================
-- FIX 2026-10-10: три исправления
-- 1) register_herd_movement: "record v_destination is not assigned yet"
-- 2) diets: отсутствовала колонка feed_id (ошибка schema cache)
-- 3) admin_get_users: профиль текущего админа создается автоматически
-- Выполнить ВЕСЬ файл в Supabase SQL Editor.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- FIX 2: feed_id в diets (её нет из restore-functions.sql)
-- ---------------------------------------------------------------------------
alter table public.diets
    add column if not exists feed_id uuid references public.feeds(id) on delete cascade;

-- ---------------------------------------------------------------------------
-- FIX 1: register_herd_movement
-- ---------------------------------------------------------------------------

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
        p_destination_category_id,
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

-- ---------------------------------------------------------------------------
-- FIX 3: автосоздание профилей для всех существующих пользователей
-- (чтобы UsersModule показывал хотя бы себя/админа)
-- ---------------------------------------------------------------------------
insert into public.user_profiles (id, login, full_name, role)
select u.id,
       split_part(coalesce(u.email, 'user'), '@', 1),
       coalesce(u.raw_user_meta_data ->> 'full_name', split_part(coalesce(u.email, 'user'), '@', 1)),
       case when exists (
           select 1 from public.module_access ma
           where ma.user_id = u.id and ma.module_name = 'admin' and ma.has_access = true
       ) then 'admin' else 'user' end
from auth.users u
on conflict (id) do nothing;

insert into public.user_permissions (user_id)
select u.id from auth.users u
on conflict (user_id) do nothing;
