// Supabase Edge Function: search-venues
//
// Proxies venue/location searches to SerpAPI so the secret API key never
// reaches the browser. The frontend calls this function (with the Supabase
// anon key), and this function calls SerpAPI using SERPAPI_KEY, which is
// stored as a Supabase secret:
//
//   supabase secrets set SERPAPI_KEY=your_key
//
// Deploy with:
//
//   supabase functions deploy search-venues

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface SerpLocalResult {
  title?: string;
  address?: string;
  rating?: number;
  links?: { website?: string };
}

interface SerpOrganicResult {
  title?: string;
  link?: string;
  snippet?: string;
  address?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const apiKey = Deno.env.get('SERPAPI_KEY');
  if (!apiKey) {
    return json({ error: 'SERPAPI_KEY is not configured' }, 500);
  }

  let query = '';
  let location = '';
  try {
    const body = await req.json();
    query = (body.q ?? '').toString().trim();
    location = (body.location ?? '').toString().trim();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  if (!query) {
    return json({ error: 'Missing search query "q"' }, 400);
  }

  const params = new URLSearchParams({
    engine: 'google',
    q: query,
    api_key: apiKey,
    num: '10',
  });
  if (location) params.set('location', location);

  let payload: {
    local_results?: { places?: SerpLocalResult[] } | SerpLocalResult[];
    organic_results?: SerpOrganicResult[];
    error?: string;
  };
  try {
    const res = await fetch(`https://serpapi.com/search.json?${params}`);
    payload = await res.json();
  } catch (e) {
    return json({ error: `Search request failed: ${e}` }, 502);
  }

  if (payload.error) {
    return json({ error: payload.error }, 502);
  }

  // SerpAPI returns local_results either as an array or as { places: [...] }.
  const localRaw = Array.isArray(payload.local_results)
    ? payload.local_results
    : payload.local_results?.places ?? [];

  const local = localRaw.map((r) => ({
    title: r.title ?? '',
    address: r.address ?? '',
    link: r.links?.website ?? '',
    snippet: '',
    rating: r.rating,
  }));

  const organic = (payload.organic_results ?? []).map((r) => ({
    title: r.title ?? '',
    address: r.address ?? '',
    link: r.link ?? '',
    snippet: r.snippet ?? '',
  }));

  // Local (map) results first — they carry addresses, which is what a venue
  // search is really after — then organic web results.
  const results = [...local, ...organic].filter((r) => r.title);

  return json({ results }, 200);
});

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
