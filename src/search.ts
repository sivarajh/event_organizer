import { supabase } from './supabase';
import type { VenueResult } from './types';

// Calls the `search-venues` Supabase Edge Function, which proxies SerpAPI.
// Requires Supabase to be configured (the function lives in your project).
export async function searchVenues(
  q: string,
  location?: string
): Promise<VenueResult[]> {
  if (!supabase) {
    throw new Error(
      'Search needs Supabase configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).'
    );
  }

  const { data, error } = await supabase.functions.invoke('search-venues', {
    body: { q, location },
  });

  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return (data?.results ?? []) as VenueResult[];
}
