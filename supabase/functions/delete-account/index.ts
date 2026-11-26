import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_ALLOWED_ORIGIN') || '',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin'
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

Deno.serve(async (request) => {
  const origin = request.headers.get('origin') || '';
  const allowedOrigin = Deno.env.get('APP_ALLOWED_ORIGIN') || '';
  if (request.method === 'OPTIONS') {
    if (allowedOrigin && origin !== allowedOrigin) return new Response('Forbidden', { status: 403 });
    return new Response('ok', { headers: { ...corsHeaders, 'Access-Control-Allow-Origin': allowedOrigin || origin } });
  }
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
  if (allowedOrigin && origin !== allowedOrigin) return json({ error: 'Origin not allowed.' }, 403);

  const authorization = request.headers.get('Authorization') || '';
  if (!authorization.startsWith('Bearer ')) return json({ error: 'Sign in again to continue.' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: 'Account deletion is not configured on the server.' }, 503);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) return json({ error: 'Your session could not be verified. Sign in again.' }, 401);

  let confirmation: unknown;
  try {
    const body = await request.json();
    confirmation = body?.confirmation;
  } catch {
    return json({ error: 'A valid confirmation is required.' }, 400);
  }
  if (confirmation !== 'DELETE') return json({ error: 'Type DELETE to confirm permanent account deletion.' }, 400);

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
    return json({ error: error instanceof Error ? error.message : 'Evidence cleanup failed. Account was not deleted.' }, 500);
  }

  const { error: workspaceError } = await admin.from('user_workspaces').delete().eq('user_id', user.id);
  if (workspaceError) {
    return json({ error: 'Evidence files were removed, but workspace deletion failed. Account was not deleted: ' + workspaceError.message }, 500);
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return json({ error: 'Workspace and evidence were removed, but account deletion failed. Contact the service operator: ' + deleteError.message }, 500);
  }

  return json({ success: true });
});
