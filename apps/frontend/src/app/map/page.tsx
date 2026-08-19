import { UniMap } from "@/components/templates/map/UniMap";

const MAP_KEY = process.env.NEXT_PUBLIC_MAP_KEY || "";

export default function MapPage() {
  return (
    <div className="h-screen flex flex-col min-h-0">
      <UniMap apiKey={MAP_KEY} />
    </div>
  );
}
