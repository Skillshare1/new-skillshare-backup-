import { createClient } from '@supabase/supabase-js';

// Validate environment variables with safer error handling
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('Missing VITE_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
