import { Radar } from "../../components/radar";
import { getFlow } from "../get-flow";

export const dynamic = "force-dynamic";

export default async function Home() {
  const mapboxToken = process.env.MAPBOX_TOKEN ?? "";
  const wsUrl = process.env.WS_URL ?? "";
  const flow = await getFlow();

  return (
    <div className="w-[100vw] h-[100vh]">
      <Radar flow={flow} mapboxToken={mapboxToken} wsUrl={wsUrl} />
    </div>
  );
}
