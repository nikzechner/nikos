export type CalendarObjectType = "event" | "task";

export interface BaseCalendarObject {
  id: string;
  title: string;
  start: string; // ISO string
  end: string;   // ISO string
  type: CalendarObjectType;
  description?: string;
}

export interface CalendarEvent extends BaseCalendarObject {
  type: "event";
  googleEventId?: string;
  isGoogleEvent?: boolean; // Flag to identify Google Calendar events
  // Add more external calendar sync fields as needed
}

export interface TaskBlock extends BaseCalendarObject {
  type: "task";
  taskId?: string;
  // Add more task sync fields as needed
}

export type CalendarItem = CalendarEvent | TaskBlock; 