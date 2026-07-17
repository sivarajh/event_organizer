export interface Person {
  id: string;
  name: string;
  email: string;
}

export interface Session {
  id: string;
  day: number;
  title: string;
  startTime: string;
  endTime: string;
  hostId: string | null;
  capacity: number;
  registrationOpen: boolean;
  attendeeIds: string[];
}

export interface Venue {
  title: string;
  address: string;
  link: string;
}

export interface EventData {
  name: string;
  days: number;
  people: Person[];
  sessions: Session[];
  venue?: Venue | null;
}

// A single result returned from the venue search (via the SerpAPI proxy).
export interface VenueResult {
  title: string;
  address: string;
  link: string;
  snippet: string;
  rating?: number;
}
