import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://flvddrrjeydnkmyeqiqn.supabase.co';

// Extract public configuration safely from Vite environment
const supabaseUrl = (
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_PROJECT_URL ||
  DEFAULT_SUPABASE_URL
).trim();

const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  ''
).trim();

/**
 * Returns true only if a valid public anon key is explicitly configured in frontend env.
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseAnonKey &&
    supabaseAnonKey !== 'placeholder-anon-key' &&
    supabaseAnonKey.length > 20
  );
};

// Initialize Supabase client (only uses placeholder fallback to prevent instantiation errors if unconfigured)
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'engineerspace_supabase_session',
    },
  }
);
