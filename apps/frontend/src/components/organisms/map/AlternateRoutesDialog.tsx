"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CONGESTION_LABELS,
  CongestionLevel,
} from "../../../../utilities/heatmaps/routeCongestion";
import { getAlternateRoutesQ } from "../../../../utilities/route/studentRoutingQueries";
import { Skeleton } from "@/components/atoms/baseShadcn/skeleton";
import { Loader } from "lucide-react";
import { Button } from "@/components/atoms/baseShadcn/button";
import { Badge } from "@/components/atoms/baseShadcn/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/baseShadcn/dialog";

interface AlternateRoutesDialogProps {
  open: boolean;
  originEventId: string;
  destinationEventId: string;
  date: string;
  currentCongestion: CongestionLevel;
  onOpenChange: (open: boolean) => void;
  onSelect: (routeIndex: number) => void;
  mainDistance?: number;
}

interface AlternateOptionsProps {
  open: boolean;
  routeIndex: number;
  originEventId: string;
  destinationEventId: string;
  date: string;
  onSelect: (routeIndex: number) => void;
}

//currently we support 3 total alternate routes
// more does not make sense
const ALTERNATE_ROUTE_INDEXES = [1, 2];

function AlternativeOption({
  open,
  routeIndex,
  originEventId,
  destinationEventId,
  date,
  onSelect,
}: AlternateOptionsProps) {
  const { data, isPending, isError } = useQuery({
    ...getAlternateRoutesQ({
      originEventId,
      destinationEventId,
      date,
      routeIndex,
    }),
    enabled: open && Boolean(originEventId && destinationEventId && date),
  });

  if (isPending) {
    return (
      <Skeleton className="h-12 w-full flex items-center justify-center">
        <Loader className="h-4 w-4 animate-spin text-[var(--text-secondary)]" />
      </Skeleton>
    );
  }

  if (isError || !data) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="flex justify-between items-center w-full py-3 h-auto"
      onClick={() => onSelect(routeIndex)}
    >
      <div className="text-left">
        <p className="text-sm text-[var(--text-primary)]">
          Route Option {routeIndex + 1}
        </p>
        <p className="text-sm text-[var(--text-secondary)]">
          {data.route.distanceMetres}m
        </p>
      </div>
      <Badge variant="secondary">Alternative</Badge>
    </Button>
  );
}

export function AlternateRouteDialog(props: AlternateRoutesDialogProps) {
  const query1 = useQuery({
    ...getAlternateRoutesQ({
      originEventId: props.originEventId,
      destinationEventId: props.destinationEventId,
      date: props.date,
      routeIndex: 1,
    }),
    enabled:
      props.open &&
      Boolean(props.originEventId && props.destinationEventId && props.date),
  });

  const query2 = useQuery({
    ...getAlternateRoutesQ({
      originEventId: props.originEventId,
      destinationEventId: props.destinationEventId,
      date: props.date,
      routeIndex: 2,
    }),
    enabled:
      props.open &&
      Boolean(props.originEventId && props.destinationEventId && props.date),
  });

  const isChecking = props.open && (query1.isFetching || query2.isFetching);
  const hasAnyAlternative = Boolean(query1.data || query2.data);

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="bg-(--bg-surface)">
        <DialogHeader>
          <DialogTitle>Your usual route is busy</DialogTitle>
        </DialogHeader>

        <p className="text-xs text-[var(--text-secondary)]">
          The main route {props.mainDistance ? `(${props.mainDistance}m)` : ""}{" "}
          is currently{" "}
          <span className="font-semibold">
            {CONGESTION_LABELS[props.currentCongestion]}
          </span>
          .
        </p>

        <div className="flex flex-col gap-2">
          {ALTERNATE_ROUTE_INDEXES.map((alternateIndex) => (
            <AlternativeOption
              key={alternateIndex}
              open={props.open}
              routeIndex={alternateIndex}
              originEventId={props.originEventId}
              destinationEventId={props.destinationEventId}
              date={props.date}
              onSelect={(routeIndex) => {
                props.onSelect(routeIndex);
                props.onOpenChange(false);
              }}
            />
          ))}

          {!isChecking && !hasAnyAlternative && (
            <p className="text-xs text-[var(--text-secondary)] py-2 text-center">
              No alternate walking paths were found between these buildings.
            </p>
          )}

          <Button
            type="button"
            variant="ghost"
            onClick={() => props.onOpenChange(false)}
          >
            Keep the main route
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
