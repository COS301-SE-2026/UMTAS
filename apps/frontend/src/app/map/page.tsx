import UniMap from "@/components/templates/map/UniMap";

const MAP_KEY = process.env.MAP_KEY;

export default function MapPage() {
  console.log("map api key is", MAP_KEY);
  return (
    <div>
      <UniMap apiKey={MAP_KEY} />;
    </div>
  );
}
