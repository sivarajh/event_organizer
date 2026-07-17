import { useState } from 'react';
import type { Venue, VenueResult } from './types';
import { searchVenues } from './search';
import { isSupabaseConfigured } from './storage';

export function VenueSearch({
  venue,
  onSelect,
}: {
  venue: Venue | null | undefined;
  onSelect: (venue: Venue | null) => void;
}) {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [results, setResults] = useState<VenueResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const r = await searchVenues(query.trim(), location.trim() || undefined);
      setResults(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="venue-panel">
      <div className="section-head">
        <h2>Venue</h2>
      </div>

      {venue ? (
        <div className="venue-selected">
          <div>
            <strong>{venue.title}</strong>
            {venue.address && <div className="venue-address">{venue.address}</div>}
            {venue.link && (
              <a href={venue.link} target="_blank" rel="noreferrer">
                {venue.link}
              </a>
            )}
          </div>
          <button className="link danger" onClick={() => onSelect(null)}>
            Clear
          </button>
        </div>
      ) : (
        <p className="empty">No venue selected yet.</p>
      )}

      {!isSupabaseConfigured ? (
        <p className="hint">
          Venue search needs Supabase configured and the <code>search-venues</code>{' '}
          function deployed.
        </p>
      ) : (
        <>
          <form className="venue-form" onSubmit={run}>
            <input
              placeholder="Search venues (e.g. conference hall)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Venue search query"
            />
            <input
              placeholder="Location (optional, e.g. Austin, TX)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              aria-label="Venue search location"
            />
            <button className="primary" disabled={loading || !query.trim()}>
              {loading ? 'Searching…' : 'Search'}
            </button>
          </form>

          {error && <p className="error-text">{error}</p>}
          {searched && !loading && !error && results.length === 0 && (
            <p className="empty">No results.</p>
          )}

          <ul className="venue-results">
            {results.map((r, i) => (
              <li key={`${r.link}-${i}`}>
                <div className="venue-result-main">
                  <strong>{r.title}</strong>
                  {typeof r.rating === 'number' && (
                    <span className="badge">★ {r.rating}</span>
                  )}
                  {r.address && <div className="venue-address">{r.address}</div>}
                  {r.snippet && <div className="venue-snippet">{r.snippet}</div>}
                  {r.link && (
                    <a href={r.link} target="_blank" rel="noreferrer">
                      {r.link}
                    </a>
                  )}
                </div>
                <button
                  className="primary small"
                  onClick={() =>
                    onSelect({ title: r.title, address: r.address, link: r.link })
                  }
                >
                  Set as venue
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
