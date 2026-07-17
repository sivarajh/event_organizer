import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// The client is only created when both env vars are present. When they are
// missing (e.g. local dev without a Supabase project) the app falls back to
// localStorage so it still runs.
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export const isSupabaseConfigured = supabase !== null;

// Shared/global plan: a single row keyed by this id holds the whole document.
export const EVENT_ROW_ID = 'shared';
