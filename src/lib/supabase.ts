import type { SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env?.VITE_SUPABASE_URL;
const anonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

let clientPromise: Promise<SupabaseClient | null> | null = null;

/**
 * Supabase is only needed for remote leaderboard features. Keeping the SDK
 * behind a dynamic import prevents it from blocking the menu's initial load.
 */
export function getSupabaseClient(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured) return Promise.resolve(null);
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js')
      .then(({ createClient }) => createClient(url!, anonKey!))
      .catch(() => {
        clientPromise = null;
        return null;
      });
  }
  return clientPromise;
}
