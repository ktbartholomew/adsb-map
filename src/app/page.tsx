"use client";

import { useState } from "react";
import { RadarControls } from "../../components/radar-controls";
import { RadarMap } from "../../components/radar-map";
import { Flow } from "@/layers";

export default function Home() {
  const [flow, setFlow] = useState<Flow>("S");
  return (
    <div className="w-[100vw] h-[100vh]">
      <RadarControls flow={flow} setFlow={setFlow} />
      <RadarMap flow={flow} />
    </div>
  );
}
