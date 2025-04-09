"use server";

import { RadarControls } from "../../components/radar-controls";
import { RadarMap } from "../../components/radar-map";

export default async function Home() {
  return (
    <div className="w-[100vw] h-[100vh]">
      <RadarControls />
      <RadarMap />
    </div>
  );
}
