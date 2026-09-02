import { GoogleIcon } from "@/components/atoms/auth/GoogleIcon";
import { Button } from "@/components/atoms/baseShadcn/button";
import { Alert, AlertDescription } from "@/components/atoms/baseShadcn/alert";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/baseShadcn/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/baseShadcn/select";
import { Label } from "@/components/atoms/baseShadcn/label";

export interface GoogleScheduleOption {
  id: string;
  name: string;
}

export interface GoogleExportNotice {
  variant: "default" | "success" | "destructive";
  message: string;
}

interface GoogleExportDialogProps {
  hasGoogleCalendarAccess: boolean;
  isLoading: boolean;
  isExporting: boolean;
  schedules: GoogleScheduleOption[];
  selectedScheduleId: string;
  onScheduleChange: (scheduleId: string) => void;
  onSignIn: () => void;
  onExport: (scheduleId: string) => void;
  notice: GoogleExportNotice | null;
}

export default function GoogleExportDialog({
  hasGoogleCalendarAccess,
  isLoading,
  isExporting,
  schedules,
  selectedScheduleId,
  onScheduleChange,
  onSignIn,
  onExport,
  notice,
}: GoogleExportDialogProps) {
  const selectedSchedule =
    schedules.find((schedule) => schedule.id === selectedScheduleId) ??
    schedules[0];

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Export to Google Calendar</DialogTitle>
        <DialogDescription>
          Choose a timetable to add to your UMTAS Calendar.
        </DialogDescription>
      </DialogHeader>

      {notice && (
        <Alert variant={notice.variant} aria-live="polite">
          <AlertDescription>{notice.message}</AlertDescription>
        </Alert>
      )}

      {!hasGoogleCalendarAccess ? (
        <div className="flex flex-col items-center justify-center gap-4">
          <p className="text-center text-sm text-muted-foreground">
            Connect your Google account to add this timetable to Calendar.
          </p>
          <Button
            type="button"
            className="w-full max-w-52"
            disabled={isLoading || isExporting}
            onClick={onSignIn}
          >
            <GoogleIcon />
            {isLoading ? "Checking Google access…" : "Sign in with Google"}
          </Button>
        </div>
      ) : (
        <div className="flex w-full flex-col items-center gap-5">
          <GoogleList
            schedules={schedules}
            selectedScheduleId={selectedSchedule?.id ?? ""}
            onScheduleChange={onScheduleChange}
          />
          <div className="w-full space-y-2 text-center">
            <p className="text-sm font-medium">
              Export “{selectedSchedule?.name ?? "selected timetable"}”
            </p>
            <p className="text-xs text-muted-foreground">
              This will update your UMTAS Calendar in Google Calendar.
            </p>
          </div>
          <Button
            type="button"
            className="w-full max-w-52"
            disabled={!selectedSchedule || isExporting}
            onClick={() => {
              if (selectedSchedule) onExport(selectedSchedule.id);
            }}
          >
            <GoogleIcon />
            {isExporting ? "Exporting…" : "Add to Google Calendar"}
          </Button>
        </div>
      )}
    </DialogContent>
  );
}

interface GoogleListProps {
  schedules: GoogleScheduleOption[];
  selectedScheduleId: string;
  onScheduleChange: (scheduleId: string) => void;
}

export function GoogleList({
  schedules,
  selectedScheduleId,
  onScheduleChange,
}: GoogleListProps) {
  return (
    <div className="grid w-full grid-cols-1 items-center justify-center gap-y-2">
      <Label
        htmlFor="google-export-schedule"
        className="text-[var(--text-secondary)]"
      >
        Select Schedule
      </Label>
      <Select
        value={selectedScheduleId}
        onValueChange={onScheduleChange}
        disabled={schedules.length === 0}
      >
        <SelectTrigger id="google-export-schedule" className="w-full">
          <SelectValue placeholder="Select a timetable" />
        </SelectTrigger>
        <SelectContent>
          {schedules.map((schedule) => (
            <SelectItem key={schedule.id} value={schedule.id}>
              {schedule.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
