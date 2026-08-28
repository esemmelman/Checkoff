create table public.checkoff_todo_items_v1 (
  checkoff_id uuid primary key default gen_random_uuid(),
  checkoff_user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  checkoff_name text not null constraint checkoff_name_length_v1 check (char_length(btrim(checkoff_name)) between 1 and 200),
  checkoff_check_yn boolean not null default false,
  checkoff_rich_text_html text not null default '' constraint checkoff_rich_text_length_v1 check (char_length(checkoff_rich_text_html) <= 50000),
  checkoff_created_at timestamptz not null default now(),
  checkoff_updated_at timestamptz not null default now(),
  constraint checkoff_user_name_unique_v1 unique (checkoff_user_id, checkoff_name)
);

create index checkoff_items_user_status_updated_idx_v1 on public.checkoff_todo_items_v1 (checkoff_user_id, checkoff_check_yn, checkoff_updated_at desc);
alter table public.checkoff_todo_items_v1 enable row level security;
grant select, insert, update, delete on public.checkoff_todo_items_v1 to authenticated;
create policy checkoff_select_own_v1 on public.checkoff_todo_items_v1 for select to authenticated using ((select auth.uid()) = checkoff_user_id);
create policy checkoff_insert_own_v1 on public.checkoff_todo_items_v1 for insert to authenticated with check ((select auth.uid()) = checkoff_user_id);
create policy checkoff_update_own_v1 on public.checkoff_todo_items_v1 for update to authenticated using ((select auth.uid()) = checkoff_user_id) with check ((select auth.uid()) = checkoff_user_id);
create policy checkoff_delete_own_v1 on public.checkoff_todo_items_v1 for delete to authenticated using ((select auth.uid()) = checkoff_user_id);

create function public.checkoff_set_updated_at_v1() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.checkoff_updated_at = now();
  return new;
end;
$$;
revoke all on function public.checkoff_set_updated_at_v1() from public;
grant execute on function public.checkoff_set_updated_at_v1() to authenticated;
create trigger checkoff_items_updated_at_trigger_v1 before update on public.checkoff_todo_items_v1 for each row execute function public.checkoff_set_updated_at_v1();
alter table public.checkoff_todo_items_v1 replica identity full;
alter publication supabase_realtime add table public.checkoff_todo_items_v1;
comment on table public.checkoff_todo_items_v1 is 'Private, realtime-synced checklist items for the Checkoff app.';
