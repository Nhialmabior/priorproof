import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';
import { corsHeaders, isAllowedOrigin, jsonResponse } from './http.ts';

Deno.serve(async (request) => {
  const origin = request.headers.get('origin') || '';
  const allowedOrigin = Deno.env.get('APP_ALLOWED_ORIGIN') || '';

  // Fail closed: never reflect arbitrary request origins or fall back to '*'.
  // The operator must configure the exact application origin before enabling deletion.
  if (!allowedOrigin) return new Response('Account deletion is not configured on the server.', { status: 503 });
  if (!isAllowedOrigin(origin, allowedOrigin)) return new Response('Forbidden', { status: 403 });
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(allowedOrigin) });
  }
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, allowedOrigin, 405);

  const authorization = request.headers.get('Authorization') || '';
  if (!authorization.startsWith('Bearer ')) return jsonResponse({ error: 'Sign in again to continue.' }, allowedOrigin, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: 'Account deletion is not configured on the server.' }, allowedOrigin, 503);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) return jsonResponse({ error: 'Your session could not be verified. Sign in again.' }, allowedOrigin, 401);

  let confirmation: unknown;
  try {
    const body = await request.json();
    confirmation = body?.confirmation;
  } catch {
    return jsonResponse({ error: 'A valid confirmation is required.' }, allowedOrigin, 400);
  }
  if (confirmation !== 'DELETE') return jsonResponse({ error: 'Type DELETE to confirm permanent account deletion.' }, allowedOrigin, 400);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const bucket = admin.storage.from('priorproof-evidence');
  const paths: string[] = [];

  async function collect(folder: string) {
    let offset = 0;
    const limit = 100;
    while (true) {
      const { data, error } = await bucket.list(folder, { limit, offset });
      if (error) throw new Error('Could not list private evidence files: ' + error.message);
      const entries = data || [];
      for (const entry of entries) {
        const path = folder + '/' + entry.name;
        if (entry.id) paths.push(path);
        else await collect(path);
      }
      if (entries.length < limit) break;
      offset += limit;
    }
  }

  try {
    await collect(user.id);
    for (let i = 0; i < paths.length; i += 100) {
      const { error } = await bucket.remove(paths.slice(i, i + 100));
      if (error) throw new Error('Could not remove private evidence files: ' + error.message);
    }
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Evidence cleanup failed. Account was not deleted.' }, allowedOrigin, 500);
  }

  const { error: workspaceError } = await admin.from('user_workspaces').delete().eq('user_id', user.id);
  if (workspaceError) {
    return jsonResponse({ error: 'Evidence files were removed, but workspace deletion failed. Account was not deleted: ' + workspaceError.message }, allowedOrigin, 500);
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return jsonResponse({ error: 'Workspace and evidence were removed, but account deletion failed. Contact the service operator: ' + deleteError.message }, allowedOrigin, 500);
  }

  return jsonResponse({ success: true }, allowedOrigin);
});
