"use client";
import { useQuery } from "@tanstack/react-query";
import { Map, APIProvider } from "@vis.gl/react-google-maps";
import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/atoms/baseShadcn/skeleton";
import { Button } from "@/components/atoms/baseShadcn/button";
import { getMapConfigQ } from "../../../../utilities/map/mapQueries";
import { Alert, AlertDescription } from "@/components/atoms/baseShadcn/alert";
import { UserDetails } from "@/lib/userclass/userClass";

interface MapScreenProps {
  children?: React.ReactNode;
  onRequestMapSetup?: () => void;
  apiKey: string;
}

export function MapScreen({
  children,
  onRequestMapSetup,
  apiKey,
}: MapScreenProps) {
  //console.log("api key:", apiKey);
  const { data: config, isLoading, error } = useQuery(getMapConfigQ());
  // if (error) {
  //   console.log("map error:", error);
  // }
  const isUserAdmin = UserDetails.getUniDetails()?.role === "UNIVERSITY_ADMIN";

  if (isLoading) {
    return <Skeleton className="h-full w-full rounded-xl" />;
  }

  //displays when the map config for that uni has not been configured. todo remember to add map config seeding vro
  if (error && (error as { status?: number }).status === 404) {
    return (
      <div className="flex h-full w-full items-center justify-center border border-[var(--border)] bg-[var(--bg-surface)] rounded-xl">
        <div className="flex flex-col items-center gap-2 text-center px-8">
          <AlertCircle size={22} className="text-[var(--text-secondary)]" />
          <p className="text-base text-[var(--text-primary)]">
            Your campus map has not been set up.
          </p>
          {isUserAdmin ? (
            <Button variant="outline" onClick={onRequestMapSetup}>
              Set up campus boundaries.
            </Button>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">
              Check back on this page when an admin has configured your campus
              map.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <Alert className="border-[var(--error-text)] bg-[var(--error-bg)]">
        <AlertCircle size={16} />
        <AlertDescription>
          Could not load your campus map. Please reload.
        </AlertDescription>
      </Alert>
    );
  }

  //todo change to camelCase vro
  const uniBoundaries = {
    north: config.NorthLat,
    south: config.SouthLat,
    east: config.EastLng,
    west: config.WestLng,
  };

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        style={{ width: "100%", height: "100%" }}
        mapId={config.GoogleMapID || undefined}
        defaultBounds={uniBoundaries}
        defaultZoom={config.DefaultZoom}
        restriction={{ latLngBounds: uniBoundaries, strictBounds: true }}
        gestureHandling="greedy"
      >
        {children}
      </Map>
    </APIProvider>
  );
}
