"use client";

import { RadarControls } from "../../components/radar-controls";
import { RadarMap } from "../../components/radar-map";
import { useConfig } from "@/config";

export default function Home() {
  const config = useConfig();
  return (
    <div className="w-[100vw] h-[100vh]">
      <RadarControls flow={config.data.flow} setFlow={() => {}} />
      <RadarMap flow={config.data.flow} />
    </div>
  );
}
