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
} from "@/components/atoms/baseShadcn/dialog";

interface AlternateRoutesDialogProps {
  open: boolean;
  originEventId: string;
  destinationEventId: string;
  date: string;
  currentCongestion: CongestionLevel;
  onOpenChange: (open: boolean) => void;
  onSelect: (routeIndex: number) => void;
}

interface AlternateOptionsProps {
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
  routeIndex,
  originEventId,
  destinationEventId,
  date,
  onSelect,
}: AlternateOptionsProps) {
  const { data, isLoading, isError } = useQuery(
    getAlternateRoutesQ({
      originEventId,
      destinationEventId,
      date,
      routeIndex,
    }),
  );

  if (isLoading) {
    return (
      <Skeleton className="h-8 w-20">
        <Loader />
      </Skeleton>
    );
  }

  if (isError || !data) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="default"
      onClick={() => onSelect(routeIndex)}
    >
      <div>
        <p className="text-sm text-(--text-primary)">
          Route Option {routeIndex + 1}
        </p>
        <p className="text-sm text-(--text-secondary)">
          {data.route.distanceMetres}m
        </p>
      </div>
      <Badge variant="secondary">Not Measured</Badge>
    </Button>
  );
}

export function AlternateRouteDialog(props: AlternateRoutesDialogProps) {
  <Dialog open={props.open} onOpenChange={props.onOpenChange}>
    <DialogContent>
      <DialogHeader>Your usual route is busy</DialogHeader>

      <p className="text-xs text-(--text-secondary)">
        The main route is currently
        <span className="font-semibold">
          {CONGESTION_LABELS[props.currentCongestion]}
        </span>
        . Here are some other routes you can take instead.
      </p>

      <div className="flex flex-col gap-2">
        {ALTERNATE_ROUTE_INDEXES.map((alternateIndex) => (
          <AlternativeOption
            key={alternateIndex}
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

        <Button
          type="button"
          variant="ghost"
          onClick={() => props.onOpenChange(false)}
        >
          Keep the main route
        </Button>
      </div>
    </DialogContent>
  </Dialog>;
}
