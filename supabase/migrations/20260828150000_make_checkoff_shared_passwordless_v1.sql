alter table public.checkoff_todo_items_v1
  alter column checkoff_user_id drop not null,
  alter column checkoff_user_id drop default;

alter table public.checkoff_todo_items_v1 drop constraint checkoff_user_name_unique_v1;
create unique index checkoff_name_shared_unique_idx_v1 on public.checkoff_todo_items_v1 (lower(btrim(checkoff_name)));

drop policy checkoff_select_own_v1 on public.checkoff_todo_items_v1;
drop policy checkoff_insert_own_v1 on public.checkoff_todo_items_v1;
drop policy checkoff_update_own_v1 on public.checkoff_todo_items_v1;
drop policy checkoff_delete_own_v1 on public.checkoff_todo_items_v1;

grant select, insert, update, delete on public.checkoff_todo_items_v1 to anon, authenticated;
create policy checkoff_shared_select_v1 on public.checkoff_todo_items_v1 for select to anon, authenticated using (true);
create policy checkoff_shared_insert_v1 on public.checkoff_todo_items_v1 for insert to anon, authenticated with check (checkoff_user_id is null);
create policy checkoff_shared_update_v1 on public.checkoff_todo_items_v1 for update to anon, authenticated using (true) with check (checkoff_user_id is null);
create policy checkoff_shared_delete_v1 on public.checkoff_todo_items_v1 for delete to anon, authenticated using (true);

comment on table public.checkoff_todo_items_v1 is 'Shared, password-free, realtime-synced checklist items for the Checkoff app. Anyone with the app URL can read and modify rows.';
