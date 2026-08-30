import { useRouteLine } from "@/hooks/useRouteLine";

interface RouteLineProps {
  path: { lat: number; lng: number }[];
  colour?: string;
}

export function RouteLine({ path, colour }: RouteLineProps) {
  useRouteLine({ path, colour });

  return null;
}
