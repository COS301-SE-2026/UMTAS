"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Barcode, CircleHelp, Nfc } from "lucide-react";
import { toast } from "sonner";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/atoms/baseShadcn/alert";
import { Button } from "@/components/atoms/baseShadcn/button";
import { Skeleton } from "@/components/atoms/baseShadcn/skeleton";
import { AttendanceConflictSelector } from "@/components/molecules/attendance/AttendanceConflictSelector";
import { AttendanceMethodCard } from "@/components/molecules/attendance/AttendanceMethodCard";
import { SlotSummaryCard } from "@/components/molecules/attendance/SlotSummaryCard";
import { AttendanceModuleList } from "@/components/organisms/attendance/AttendanceModuleList";
import { groupAttendanceSlotsByModule } from "@/lib/nfc_attendance/attendance_overview";
import {
  ATTENDANCE_STATE_CHANGE_EVENT,
  getLiveAttendanceCount,
  getOperatorAttendanceOverview,
  getRegisteredTag,
  selectPreferredEvent,
} from "@/lib/nfc_attendance/nfc_api";
import type {
  AttendanceSlot,
  CurrentSlotPreview,
  LiveAttendanceCount,
  RegisteredNfcTag,
} from "@/lib/nfc_attendance/types";

export function AttendanceOverviewPanel() {
  const [tag, setTag] = useState<RegisteredNfcTag | null>(null);
  const [tagLoading, setTagLoading] = useState(true);
  const [tagUnavailable, setTagUnavailable] = useState(false);
  const [slots, setSlots] = useState<AttendanceSlot[]>([]);
  const [preview, setPreview] = useState<CurrentSlotPreview | null>(null);
  const [count, setCount] = useState<LiveAttendanceCount | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overviewAsOf, setOverviewAsOf] = useState(() => new Date());
  const hasLoadedRef = useRef(false);

  const preferredSlot = preview?.preferredEventId
    ? (slots.find(
        (slot) =>
          slot.eventID === preview.preferredEventId && slot.state !== "ENDED",
      ) ?? null)
    : null;
  const selectedSlot = preview?.slot ?? preferredSlot;
  const selectedSessionId = selectedSlot?.sessionId ?? null;

  const displaySlots = useMemo(
    () =>
      slots.map((slot) =>
        count?.slotId === slot.sessionId
          ? { ...slot, attendanceCount: count.total }
          : slot,
      ),
    [count, slots],
  );
  const groups = useMemo(
    () =>
      groupAttendanceSlotsByModule(
        displaySlots,
        preview?.preferredEventId ?? null,
        overviewAsOf,
      ),
    [displaySlots, overviewAsOf, preview?.preferredEventId],
  );
  const availableSlots = displaySlots.filter(
    (slot) => slot.state === "AVAILABLE",
  );
  const preferredCurrentSlot =
    availableSlots.find((slot) => slot.eventID === preview?.preferredEventId) ??
    null;
  const showConflictSelector =
    availableSlots.length > 1 && !preferredCurrentSlot;
  const currentSlot =
    preferredCurrentSlot ??
    (availableSlots.length === 1 ? availableSlots[0] : null);
  const canAdjustPreference =
    availableSlots.length > 1 && preferredCurrentSlot !== null;

  const loadOverview = useCallback(async () => {
    const initialLoad = !hasLoadedRef.current;
    if (initialLoad) setLoading(true);
    else setRefreshing(true);
    setError(null);

    const [tagResult, overviewResult] = await Promise.allSettled([
      getRegisteredTag(),
      getOperatorAttendanceOverview(),
    ]);

    if (tagResult.status === "fulfilled") {
      setTag(tagResult.value);
      setTagUnavailable(false);
    } else {
      setTagUnavailable(true);
    }
    setTagLoading(false);

    if (overviewResult.status === "fulfilled") {
      setSlots(overviewResult.value.slots);
      setPreview(overviewResult.value.preview);
      setOverviewAsOf(new Date());
    } else {
      setError("Attendance could not be loaded.");
    }

    hasLoadedRef.current = true;
    setLoading(false);
    setRefreshing(false);
  }, []);

  const loadCount = useCallback(async (sessionId: string) => {
    try {
      setCount(await getLiveAttendanceCount(sessionId));
    } catch {
      toast.error("Attendance could not be refreshed");
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadOverview(), 0);
    const refresh = () => void loadOverview();
    window.addEventListener(ATTENDANCE_STATE_CHANGE_EVENT, refresh);
    return () => {
      window.clearTimeout(initialLoad);
      window.removeEventListener(ATTENDANCE_STATE_CHANGE_EVENT, refresh);
    };
  }, [loadOverview]);

  useEffect(() => {
    if (!selectedSessionId) return;
    const initialLoad = window.setTimeout(
      () => void loadCount(selectedSessionId),
      0,
    );
    const interval = window.setInterval(
      () => void loadCount(selectedSessionId),
      12_000,
    );
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [loadCount, selectedSessionId]);

  async function handleSelectSlot(slot: AttendanceSlot) {
    setSelecting(true);
    try {
      await selectPreferredEvent(slot);
      await loadOverview();
      toast.success("Class selected for attendance");
    } catch {
      toast.error("The current class could not be selected");
    } finally {
      setSelecting(false);
    }
  }

  const nfcDescription = tagLoading ? (
    <Skeleton className="h-3 w-40 max-w-full" />
  ) : tag ? (
    <span className="inline-flex items-center gap-1">
      <span
        className="size-1.5 rounded-full bg-[var(--success-text)]"
        aria-hidden="true"
      />
      Sticker {tag.displayId} ready
    </span>
  ) : tagUnavailable ? (
    "Open NFC sticker settings"
  ) : (
    "Register a sticker to begin"
  );

  return (
    <div className="p-5">
      {error && (
        <Alert variant="destructive" className="mb-5">
          <CircleHelp size={16} aria-hidden="true" />
          <AlertTitle>Attendance unavailable</AlertTitle>
          <AlertDescription>
            {error}{" "}
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 align-baseline font-medium"
              onClick={() => void loadOverview()}
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <section aria-labelledby="capture-heading">
        <div className="mb-3">
          <h2
            id="capture-heading"
            className="text-[15px] font-medium text-[var(--text-primary)]"
          >
            Capture attendance
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <AttendanceMethodCard
            href="/attendance/register-tag"
            icon={Nfc}
            title="NFC attendance"
            description={nfcDescription}
          />
          <AttendanceMethodCard
            href="/attendance/scan"
            icon={Barcode}
            title="Barcode attendance"
          />
        </div>

        {currentSlot && (
          <div className="mt-5">
            <SlotSummaryCard slot={currentSlot} variant="current" />
          </div>
        )}

        {showConflictSelector && (
          <AttendanceConflictSelector
            slots={availableSlots}
            busy={selecting}
            onSelect={(slot) => void handleSelectSlot(slot)}
          />
        )}
      </section>

      <AttendanceModuleList
        groups={groups}
        preferredEventId={preview?.preferredEventId ?? null}
        loading={loading}
        refreshing={refreshing}
        selecting={selecting}
        canAdjustPreference={canAdjustPreference}
        onRefresh={() => void loadOverview()}
        onChoose={(slot) => void handleSelectSlot(slot)}
      />
    </div>
  );
}
