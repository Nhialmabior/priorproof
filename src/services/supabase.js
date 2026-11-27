import { createClient } from '@supabase/supabase-js';

let client;

// GitHub Pages can serve the public site without backend credentials.
// Authentication and workspace features remain unavailable until Supabase is configured.
export function isSupabaseConfigured() {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

export function getSupabase() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Account access is not configured yet. The public PriorProof website is available, but sign-in and workspace features require the Supabase project settings.');
  }
  if (!client) {
    client = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }
  return client;
}

export async function signInWithGoogle() {
  const supabase = getSupabase();
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/popup-callback`,
      skipBrowserRedirect: true
    }
  });
}

export async function signInWithPassword(email, password) {
  return getSupabase().auth.signInWithPassword({ email, password });
}

export async function signUpWithPassword({ email, password, fullName }) {
  return getSupabase().auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${window.location.origin}/app/dashboard`
    }
  });
}

export async function resendSignupConfirmation(email) {
  return getSupabase().auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: `${window.location.origin}/app/dashboard` }
  });
}

export async function sendPasswordReset(email) {
  return getSupabase().auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  });
}

export async function updateAccountPassword(password) {
  return getSupabase().auth.updateUser({ password });
}

export async function getCurrentSession() {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await getSupabase().auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signOut(options) {
  return getSupabase().auth.signOut(options);
}

export function onAuthStateChange(callback) {
  if (!isSupabaseConfigured()) return { data: { subscription: { unsubscribe() {} } } };
  return getSupabase().auth.onAuthStateChange(callback);
}

export async function updateAccountProfile({ fullName, email }) {
  const updates = { data: { full_name: fullName } };
  if (email) updates.email = email;
  return getSupabase().auth.updateUser(updates);
}

export async function requestAccountDeletion() {
  return getSupabase().functions.invoke('delete-account', {
    body: { confirmation: 'DELETE' }
  });
}
