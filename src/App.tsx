import { useEffect, useMemo, useRef, useState } from 'react';
import type { EventData, Person, Session } from './types';
import { loadData, saveData, uid } from './storage';
import './App.css';

const emptyData: EventData = {
  name: 'My 3-Day Event',
  days: 3,
  people: [],
  sessions: [],
};

function App() {
  const [data, setData] = useState<EventData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(1);
  // Skip the save that would otherwise fire right after the initial load.
  const loadedRef = useRef(false);

  useEffect(() => {
    loadData().then((loaded) => {
      setData(loaded);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = !loading;
      return;
    }
    // Debounce writes so rapid edits collapse into a single save.
    const t = setTimeout(() => {
      saveData(data);
    }, 500);
    return () => clearTimeout(t);
  }, [data, loading]);

  const daySessions = useMemo(
    () => data.sessions.filter((s) => s.day === activeDay),
    [data.sessions, activeDay]
  );

  function update(patch: Partial<EventData>) {
    setData((d) => ({ ...d, ...patch }));
  }

  function setDays(days: number) {
    const clamped = Math.max(1, Math.min(14, days));
    // Drop sessions on days that no longer exist.
    const sessions = data.sessions.filter((s) => s.day <= clamped);
    update({ days: clamped, sessions });
    if (activeDay > clamped) setActiveDay(clamped);
  }

  function addPerson(name: string, email: string) {
    if (!name.trim()) return;
    const person: Person = { id: uid(), name: name.trim(), email: email.trim() };
    update({ people: [...data.people, person] });
  }

  function removePerson(id: string) {
    update({
      people: data.people.filter((p) => p.id !== id),
      sessions: data.sessions.map((s) => ({
        ...s,
        hostId: s.hostId === id ? null : s.hostId,
        attendeeIds: s.attendeeIds.filter((a) => a !== id),
      })),
    });
  }

  function addSession() {
    const session: Session = {
      id: uid(),
      day: activeDay,
      title: `Session ${daySessions.length + 1}`,
      startTime: '09:00',
      endTime: '10:00',
      hostId: null,
      capacity: 20,
      registrationOpen: true,
      attendeeIds: [],
    };
    update({ sessions: [...data.sessions, session] });
  }

  function updateSession(id: string, patch: Partial<Session>) {
    update({
      sessions: data.sessions.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  }

  function removeSession(id: string) {
    update({ sessions: data.sessions.filter((s) => s.id !== id) });
  }

  if (loading) {
    return (
      <div className="app">
        <p className="empty">Loading event…</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <input
          className="event-name"
          value={data.name}
          onChange={(e) => update({ name: e.target.value })}
          aria-label="Event name"
        />
        <div className="days-control">
          <label>Number of days</label>
          <input
            type="number"
            min={1}
            max={14}
            value={data.days}
            onChange={(e) => setDays(Number(e.target.value))}
          />
        </div>
      </header>

      <nav className="day-tabs">
        {Array.from({ length: data.days }, (_, i) => i + 1).map((day) => {
          const count = data.sessions.filter((s) => s.day === day).length;
          return (
            <button
              key={day}
              className={day === activeDay ? 'day-tab active' : 'day-tab'}
              onClick={() => setActiveDay(day)}
            >
              Day {day}
              <span className="badge">{count}</span>
            </button>
          );
        })}
      </nav>

      <main className="layout">
        <section className="sessions">
          <div className="section-head">
            <h2>Day {activeDay} — Sessions</h2>
            <button className="primary" onClick={addSession}>
              + Add session
            </button>
          </div>

          {daySessions.length === 0 && (
            <p className="empty">No sessions yet for this day.</p>
          )}

          {daySessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              people={data.people}
              onChange={(patch) => updateSession(session.id, patch)}
              onRemove={() => removeSession(session.id)}
            />
          ))}
        </section>

        <PeoplePanel
          people={data.people}
          onAdd={addPerson}
          onRemove={removePerson}
        />
      </main>
    </div>
  );
}

function SessionCard({
  session,
  people,
  onChange,
  onRemove,
}: {
  session: Session;
  people: Person[];
  onChange: (patch: Partial<Session>) => void;
  onRemove: () => void;
}) {
  const attendees = people.filter((p) => session.attendeeIds.includes(p.id));
  const available = people.filter(
    (p) => !session.attendeeIds.includes(p.id) && p.id !== session.hostId
  );
  const full = session.attendeeIds.length >= session.capacity;

  function toggleAttendee(id: string) {
    if (session.attendeeIds.includes(id)) {
      onChange({ attendeeIds: session.attendeeIds.filter((a) => a !== id) });
    } else {
      if (full) return;
      onChange({ attendeeIds: [...session.attendeeIds, id] });
    }
  }

  return (
    <div className="session-card">
      <div className="session-top">
        <input
          className="session-title"
          value={session.title}
          onChange={(e) => onChange({ title: e.target.value })}
          aria-label="Session title"
        />
        <button className="link danger" onClick={onRemove}>
          Delete
        </button>
      </div>

      <div className="session-grid">
        <label>
          Start
          <input
            type="time"
            value={session.startTime}
            onChange={(e) => onChange({ startTime: e.target.value })}
          />
        </label>
        <label>
          End
          <input
            type="time"
            value={session.endTime}
            onChange={(e) => onChange({ endTime: e.target.value })}
          />
        </label>
        <label>
          Runner / Host
          <select
            value={session.hostId ?? ''}
            onChange={(e) => onChange({ hostId: e.target.value || null })}
          >
            <option value="">— Unassigned —</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Capacity limit
          <input
            type="number"
            min={session.attendeeIds.length}
            value={session.capacity}
            onChange={(e) =>
              onChange({ capacity: Math.max(0, Number(e.target.value)) })
            }
          />
        </label>
      </div>

      <div className="session-meta">
        <label className="reg-toggle">
          <input
            type="checkbox"
            checked={session.registrationOpen}
            onChange={(e) => onChange({ registrationOpen: e.target.checked })}
          />
          Registration {session.registrationOpen ? 'open' : 'closed'}
        </label>
        <span className={full ? 'seats full' : 'seats'}>
          {session.attendeeIds.length} / {session.capacity} seats
        </span>
      </div>

      <div className="attendees">
        <div className="attendee-col">
          <h4>Attending ({attendees.length})</h4>
          {attendees.length === 0 && <p className="hint">No one yet.</p>}
          <ul>
            {attendees.map((p) => (
              <li key={p.id}>
                <span>{p.name}</span>
                <button className="link" onClick={() => toggleAttendee(p.id)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="attendee-col">
          <h4>Add attendee</h4>
          {!session.registrationOpen && (
            <p className="hint">Registration is closed.</p>
          )}
          {session.registrationOpen && available.length === 0 && (
            <p className="hint">Everyone is added or hosting.</p>
          )}
          {session.registrationOpen && full && (
            <p className="hint warn">Session is full.</p>
          )}
          {session.registrationOpen && !full && (
            <ul>
              {available.map((p) => (
                <li key={p.id}>
                  <span>{p.name}</span>
                  <button
                    className="link add"
                    onClick={() => toggleAttendee(p.id)}
                  >
                    Add
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function PeoplePanel({
  people,
  onAdd,
  onRemove,
}: {
  people: Person[];
  onAdd: (name: string, email: string) => void;
  onRemove: (id: string) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onAdd(name, email);
    setName('');
    setEmail('');
  }

  return (
    <aside className="people-panel">
      <h2>People</h2>
      <form onSubmit={submit} className="person-form">
        <input
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="Email (optional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="primary" type="submit">
          Add person
        </button>
      </form>
      {people.length === 0 && <p className="hint">Add people to assign them.</p>}
      <ul className="people-list">
        {people.map((p) => (
          <li key={p.id}>
            <div>
              <strong>{p.name}</strong>
              {p.email && <span className="email">{p.email}</span>}
            </div>
            <button className="link danger" onClick={() => onRemove(p.id)}>
              Remove
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default App;
