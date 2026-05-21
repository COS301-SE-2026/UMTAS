export interface ScheduleEvent {
  id: string;
  name: string;
  code: string;
  date: string;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  accentColour: string | null;
  subLabel: string | null;
}
