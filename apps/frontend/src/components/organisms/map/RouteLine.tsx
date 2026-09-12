import { useRouteLine } from "@/hooks/useRouteLine";
import { AdvancedMarker } from "@vis.gl/react-google-maps";

interface RouteLineProps {
  path: { lat: number; lng: number }[];
  colour?: string;
}

export function RouteLine({ path, colour }: RouteLineProps) {
  useRouteLine({ path, colour });

  if (!path || path.length <= 0) {
    return null;
  }

  const startPoint = path[0];
  const endPoint = path[path.length - 1];

  return (
    <>
      {/* {The startPoint} */}
      <AdvancedMarker position={startPoint}>
        <div
          className="h-4 w-4 rounded-full border-2 border-blue-950"
          style={{ backgroundColor: colour }}
        />
      </AdvancedMarker>

      {/* {The endPoint} */}
      <AdvancedMarker position={endPoint}>
        <div className="relative flex items-center justify-center h-6 w-6">
          <div className="absolute inset-0 rounded-full border-2 border-blue-950" />
          <div
            className="h-4 w-4 rounded-full border border-blue-950"
            style={{ backgroundColor: colour }}
          />
        </div>
      </AdvancedMarker>
    </>
  );
}
