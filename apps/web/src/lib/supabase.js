/**
 * Supabase Client Configuration
 * 
 * Environment variables required:
 * - VITE_SUPABASE_URL: Supabase API URL (default: http://localhost:54321)
 * - VITE_SUPABASE_ANON_KEY: Supabase anonymous key (JWT)
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "http://localhost:54321";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseAnonKey && import.meta.env.DEV) {
  console.warn(
    "[Supabase] VITE_SUPABASE_ANON_KEY not set. Create apps/web/.env with your keys."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey || "", {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
