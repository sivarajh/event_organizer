# Event Organizer

A single-page app for planning a multi-day event, session by session.

## What you can do

- **Set the number of days** (defaults to a 3-day event). Each day gets its own tab.
- **Add sessions per day** — pick which day you're on, then add as many sessions as that day needs.
- **Assign who runs each session** via the *Runner / Host* dropdown.
- **Set a capacity limit** for each session. Once it's full, no more attendees can register.
- **Control who is attending** each session — add or remove people from a shared people pool.
- **Toggle registration open/closed** per session to control whether attendees can be added.

Everything is saved to your browser's `localStorage`, so your plan persists across reloads.

## Run it

```bash
npm install
npm run dev      # start the dev server
npm run build    # production build
```

Built with React, TypeScript, and Vite.
