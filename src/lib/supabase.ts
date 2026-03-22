import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let cachedClient: SupabaseClient | null = null;
let cachedPinHash: string | null = null;

/** Get a Supabase client configured with the PIN hash header for RLS */
export function getSupabase(pinHash: string): SupabaseClient {
  if (cachedClient && cachedPinHash === pinHash) return cachedClient;
  cachedClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { 'x-pin-hash': pinHash },
    },
  });
  cachedPinHash = pinHash;
  return cachedClient;
}

/** Get an unauthenticated client (for checking if a PIN exists during login) */
export function getSupabaseAnon(): SupabaseClient {
  return getSupabase('');
}
