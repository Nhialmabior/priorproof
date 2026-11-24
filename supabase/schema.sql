-- PriorProof per-user workspace storage
-- Run this script in Supabase Dashboard > SQL Editor as the project owner.

create table if not exists public.user_workspaces (
  user_id uuid primary key references auth.users (id) on delete cascade,
  workspace jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint user_workspaces_workspace_is_object
    check (jsonb_typeof(workspace) = 'object')
);

alter table public.user_workspaces enable row level security;

drop policy if exists "Users can read their own workspace" on public.user_workspaces;
create policy "Users can read their own workspace"
  on public.user_workspaces
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own workspace" on public.user_workspaces;
create policy "Users can create their own workspace"
  on public.user_workspaces
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own workspace" on public.user_workspaces;
create policy "Users can update their own workspace"
  on public.user_workspaces
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update on public.user_workspaces to authenticated;

create or replace function public.set_user_workspaces_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_user_workspaces_updated_at on public.user_workspaces;
create trigger set_user_workspaces_updated_at
  before update on public.user_workspaces
  for each row
  execute function public.set_user_workspaces_updated_at();


-- Private evidence attachments in Supabase Storage.
-- Object path format: <authenticated-user-id>/<evidence-id>/<filename>
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'priorproof-evidence',
  'priorproof-evidence',
  false,
  5242880,
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can read their own PriorProof evidence files" on storage.objects;
create policy "Users can read their own PriorProof evidence files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'priorproof-evidence'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Users can upload their own PriorProof evidence files" on storage.objects;
create policy "Users can upload their own PriorProof evidence files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'priorproof-evidence'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Users can update their own PriorProof evidence files" on storage.objects;
create policy "Users can update their own PriorProof evidence files"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'priorproof-evidence'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'priorproof-evidence'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Users can delete their own PriorProof evidence files" on storage.objects;
create policy "Users can delete their own PriorProof evidence files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'priorproof-evidence'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
