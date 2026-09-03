"use client";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/atoms/baseShadcn/skeleton";
import { Button } from "@/components/atoms/baseShadcn/button";
import { getMapConfigQ } from "../../../../utilities/map/mapQueries";
import { Alert, AlertDescription } from "@/components/atoms/baseShadcn/alert";
import { UserDetails } from "@/lib/userclass/userClass";
import { Map } from "@vis.gl/react-google-maps";
import { useMemo } from "react";

interface MapScreenProps {
  children?: React.ReactNode;
  onRequestMapSetup?: () => void;
}

export function MapScreen({ children, onRequestMapSetup }: MapScreenProps) {
  const { data: config, isLoading, error } = useQuery(getMapConfigQ());
  const isUserAdmin = UserDetails.getUniDetails()?.role === "UNIVERSITY_ADMIN";
  //caching for map styles
  const mapStyle = useMemo(() => ({ width: "100%", height: "100%" }), []);

  //caching for map loads
  const mapRestriction = useMemo(() => {
    if (!config) return undefined;
    return {
      latLngBounds: {
        north: config.NorthLat,
        south: config.SouthLat,
        east: config.EastLng,
        west: config.WestLng,
      },
      strictBounds: true,
    };
  }, [config]);

  if (isLoading) {
    return <Skeleton className="h-full w-full rounded-xl" />;
  }

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

  //check that you have selected the uni when this error pops up
  if (error || !config) {
    //console.log(error);
    //console.log(config);
    return (
      <Alert className="border-[var(--error-text)] bg-[var(--error-bg)]">
        <AlertCircle size={16} />
        <AlertDescription>
          Could not load your campus map. Please reload.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Map
      style={mapStyle}
      mapId={process.env.NEXT_PUBLIC_MAP_KEY} //should work
      defaultBounds={mapRestriction?.latLngBounds}
      defaultZoom={config.DefaultZoom}
      restriction={mapRestriction}
      gestureHandling="greedy"
      clickableIcons={false}
      reuseMaps={true}
    >
      {children}
    </Map>
  );
}
