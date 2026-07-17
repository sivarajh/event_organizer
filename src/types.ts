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

export interface EventData {
  name: string;
  days: number;
  people: Person[];
  sessions: Session[];
}
