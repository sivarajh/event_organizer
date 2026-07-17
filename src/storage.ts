import type { EventData } from './types';

const STORAGE_KEY = 'event-organizer-data';

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

const defaultData: EventData = {
  name: 'My 3-Day Event',
  days: 3,
  people: [],
  sessions: [],
};

export function loadData(): EventData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData;
    const parsed = JSON.parse(raw) as EventData;
    return { ...defaultData, ...parsed };
  } catch {
    return defaultData;
  }
}

export function saveData(data: EventData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
