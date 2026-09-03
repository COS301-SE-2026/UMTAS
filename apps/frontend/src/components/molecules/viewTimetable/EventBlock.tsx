"use client";

import { Clock } from "lucide-react";
import type { ScheduleEvent } from "@/types/schedule";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  addEventAttendanceMut,
  getAllEventAttendanceQ,
  getEventAttendanceByIdQ,
  updateEventAttendanceMut,
} from "../../../../utilities/eventAttendance/eventAttendanceQueries";
import { Checkbox } from "@/components/atoms/baseShadcn/checkbox";
import { useEffect } from "react";
import { getQueryClient } from "@/components/tanstack/getQueryClient";
import { errorName } from "../../../../utilities/errorCries";

interface EventBlockProps {
  event: ScheduleEvent;
  date: string;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return null;
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

export function EventBlock({ event, date }: EventBlockProps) {
  const { mutateAsync: createAttendance } = useMutation({
    ...addEventAttendanceMut(),
  });

  const { mutate: updateAttendance, isPending: updatePending } = useMutation({
    ...updateEventAttendanceMut(),
    onSuccess: (data) => {
      getQueryClient().invalidateQueries({
        queryKey: ["eventAttendance", { eventID: event.id, eventDate: date }],
      });
      const attending =
        data.state === "ATTENDING" ? "Attending" : "Not attending";
      window.dispatchEvent(
        new CustomEvent(errorName, {
          detail: {
            userMessage: `Event: ${event.name} : Updated to ${attending}`,
          },
        }),
      );
    },
  });
  const { data: attendData = [] } = useQuery({
    ...getAllEventAttendanceQ({ eventID: event.id, eventDate: date }),
  });

  useEffect(() => {
    if (attendData && attendData.length === 0) {
      createAttendance({
        body: {
          eventDate: date,
          eventID: event.id,
          state: "NOT_ATTENDING",
        },
      });
    }
  }, [attendData, createAttendance, event.id, date]);

  function getBlockStyle() {
    if (!event.accentColour) {
      return {
        borderLeftColor: "var(--border)",
        backgroundColor: "var(--bg-elevated)",
      };
    }

    const rgb = hexToRgb(event.accentColour);
    if (!rgb) {
      return {
        borderLeftColor: event.accentColour,
        backgroundColor: "var(--bg-elevated)",
      };
    }

    return {
      borderLeftColor: event.accentColour,
      backgroundColor: "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ", 0.2)",
    };
  }

  return (
    <div
      className="flex flex-col gap-1 rounded-sm border-l-[3px] px-2 py-1.5 h-full overflow-hidden"
      onClick={() => {
        if (attendData[0])
          updateAttendance({
            body: {
              state:
                attendData[0].state === "ATTENDING"
                  ? "NOT_ATTENDING"
                  : "ATTENDING",
            },
            path: {
              attendanceId: attendData[0].AttendanceID,
            },
          });
      }}
      style={getBlockStyle()}
    >
      <span className="text-[10px] flex flex-row gap-1 font-medium uppercase tracking-[0.04em] text-[var(--text-secondary)] truncate">
        <p className="text-xs font-medium text-[var(--text-primary)] truncate leading-tight">
          {event.name}
        </p>
        <p className="text-[7px] text-[var(--text-secondary)] capitalize font-medium truncate">
          {!updatePending
            ? attendData[0]?.state
              ? attendData[0].state === "ATTENDING"
                ? "Attending"
                : "Not attending"
              : ""
            : "updating"}
        </p>
      </span>

      {event.type && (
        <span className="text-[10px] font-medium uppercase tracking-[0.04em] text-[var(--text-secondary)] truncate">
          {event.type}
        </span>
      )}

      {event.subLabel && (
        <span className="text-[10px]  flex flex-row font-medium uppercase tracking-[0.04em] text-[var(--text-secondary)] truncate">
          {event.subLabel}
        </span>
      )}

      <div className="flex items-center gap-1 mt-auto">
        <Clock
          size={10}
          className="text-[var(--text-secondary)] flex-shrink-0"
          strokeWidth={1.5}
        />
        <p className="text-[10px] text-[var(--text-secondary)] font-medium truncate">
          {event.startTime} - {event.endTime}
        </p>
      </div>
    </div>
  );
}

// <div className="flex items-center gap-1 mt-auto">
//   <Checkbox
//     checked={checked}
//     onCheckedChange={() => {
//       updateAttendance({
//         body: {
//           state:
//             currAtt.state === "ATTENDING" ? "NOT_ATTENDING" : "ATTENDING",
//         },
//         path: {
//           attendanceId: currAtt.AttendanceID,
//         },
//       });
//     }}
//   />
// </div>
