export interface ScheduleEvent {
  id: string;
  name: string;
  code: string;
  date?: string;
  dayOfWeek?: string;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  accentColour: string | null;
  subLabel: string | null;
  type?: string | null;
}
