import { createClient, SupabaseClient } from '@supabase/supabase-js';

// The client is created lazily so importing this module never throws at
// build/prerender time (when NEXT_PUBLIC_SUPABASE_URL is not set). It is only
// instantiated on first use, which always happens in a browser callback.
let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase env vars are not configured');
  }
  _supabase = createClient(supabaseUrl, supabaseAnonKey);
  return _supabase;
}