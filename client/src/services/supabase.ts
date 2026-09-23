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

if (!supabaseAnonKey && typeof window !== 'undefined') {
  console.warn(
    '[EngineerSpace] Notice: VITE_SUPABASE_ANON_KEY is not defined in frontend environment. Supabase Auth requests will require VITE_SUPABASE_ANON_KEY on Netlify / local .env.'
  );
}

// Initialize official Supabase client
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey || 'placeholder-anon-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'engineerspace_supabase_session',
  },
});
