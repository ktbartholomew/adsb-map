"use client";

import { useState } from "react";
import { RadarControls } from "./radar-controls";
import { RadarMap } from "./radar-map";
import { Flow } from "@/layers";

export function Radar(props: {
  flow: Flow;
  mapboxToken: string;
  wsUrl: string;
}) {
  const [flow, setFlow] = useState<Flow>(props.flow);
  return (
    <>
      <RadarControls flow={flow} setFlow={setFlow} />
      <RadarMap flow={flow} mapBoxToken={props.mapboxToken} wsUrl={props.wsUrl} />
    </>
  );
}
