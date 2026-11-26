-- PriorProof security audit (read-only)
-- Run this in Supabase Dashboard > SQL Editor while signed in as a project administrator.
-- It reports configuration only; it does not read or expose user workspace contents.

-- 1. Confirm row-level security is enabled for the workspace table.
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as force_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'user_workspaces';

-- 2. Inspect every policy on the workspace table.
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_expression,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'user_workspaces'
order by policyname, cmd;

-- 3. Confirm the evidence bucket exists and is private.
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'priorproof-evidence';

-- 4. Inspect every policy that applies to stored evidence objects.
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_expression,
  with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
order by policyname, cmd;

-- Expected security properties:
-- * public.user_workspaces has RLS enabled.
-- * Authenticated users can select/insert/update only rows where user_id = auth.uid(). (Workspace clearing is an update; row deletion is not granted.)
-- * priorproof-evidence exists with public = false.
-- * Authenticated users can list/read/insert/update/delete only objects whose first
--   storage folder is their own auth.uid() value.
-- * No broad/anonymous policy grants access to all workspace rows or evidence objects.
