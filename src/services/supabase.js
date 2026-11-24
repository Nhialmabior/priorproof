import { createClient } from '@supabase/supabase-js';

let client;

export function getSupabase() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your local .env file.');
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
    options: { redirectTo: `${window.location.origin}/app/dashboard` }
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

export async function sendPasswordReset(email) {
  return getSupabase().auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login`
  });
}

export async function getCurrentSession() {
  const { data, error } = await getSupabase().auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signOut() {
  return getSupabase().auth.signOut();
}

export function onAuthStateChange(callback) {
  return getSupabase().auth.onAuthStateChange(callback);
}
