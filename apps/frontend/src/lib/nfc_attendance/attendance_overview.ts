import type { AttendanceSlot } from "./types";

export interface AttendanceModuleGroup {
  key: string;
  moduleCode: string;
  moduleName: string;
  representativeSlot: AttendanceSlot;
  slots: AttendanceSlot[];
}

function moduleKey(slot: AttendanceSlot) {
  return JSON.stringify([slot.moduleCode, slot.moduleName]);
}

function byStartAscending(left: AttendanceSlot, right: AttendanceSlot) {
  return Date.parse(left.startAt) - Date.parse(right.startAt);
}

function chooseRepresentativeSlot(
  slots: AttendanceSlot[],
  preferredEventId: string | null,
  now: Date,
) {
  const currentTime = now.getTime();
  const currentSlots = slots.filter(
    (slot) =>
      slot.state === "AVAILABLE" ||
      (Date.parse(slot.startAt) <= currentTime &&
        Date.parse(slot.endAt) > currentTime),
  );
  const preferredCurrent = currentSlots.find(
    (slot) => slot.eventID === preferredEventId,
  );

  if (preferredCurrent) return preferredCurrent;
  if (currentSlots[0]) return currentSlots[0];

  const upcomingSlot = slots.find(
    (slot) =>
      slot.state === "UPCOMING" || Date.parse(slot.startAt) > currentTime,
  );
  if (upcomingSlot) return upcomingSlot;

  return slots[slots.length - 1];
}

export function groupAttendanceSlotsByModule(
  slots: AttendanceSlot[],
  preferredEventId: string | null,
  now: Date,
): AttendanceModuleGroup[] {
  const groupedSlots = new Map<string, AttendanceSlot[]>();

  for (const slot of slots) {
    const key = moduleKey(slot);
    groupedSlots.set(key, [...(groupedSlots.get(key) ?? []), slot]);
  }

  return [...groupedSlots.entries()]
    .map(([key, moduleSlots]) => {
      const sortedSlots = [...moduleSlots].sort(byStartAscending);
      const representativeSlot = chooseRepresentativeSlot(
        sortedSlots,
        preferredEventId,
        now,
      );

      return {
        key,
        moduleCode: representativeSlot.moduleCode,
        moduleName: representativeSlot.moduleName,
        representativeSlot,
        slots: sortedSlots,
      };
    })
    .sort((left, right) =>
      byStartAscending(left.representativeSlot, right.representativeSlot),
    );
}
