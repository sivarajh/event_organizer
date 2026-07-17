import type { EventData } from './types';
import { supabase, isSupabaseConfigured, EVENT_ROW_ID } from './supabase';

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

export { isSupabaseConfigured };

function loadLocal(): EventData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData;
    return { ...defaultData, ...(JSON.parse(raw) as EventData) };
  } catch {
    return defaultData;
  }
}

function saveLocal(data: EventData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export async function loadData(): Promise<EventData> {
  if (!isSupabaseConfigured || !supabase) return loadLocal();

  const { data, error } = await supabase
    .from('event_state')
    .select('data')
    .eq('id', EVENT_ROW_ID)
    .maybeSingle();

  if (error) {
    console.error('Supabase load failed, falling back to localStorage:', error);
    return loadLocal();
  }
  if (!data) return defaultData;
  return { ...defaultData, ...(data.data as EventData) };
}

export async function saveData(data: EventData): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    saveLocal(data);
    return;
  }

  const { error } = await supabase
    .from('event_state')
    .upsert({ id: EVENT_ROW_ID, data, updated_at: new Date().toISOString() });

  if (error) {
    console.error('Supabase save failed, falling back to localStorage:', error);
    saveLocal(data);
  }
}
