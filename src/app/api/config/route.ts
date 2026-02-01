"use server";

import { Flow } from "@/layers";

const DEFAULT_FLOW: Flow = "S";

type AtisResponse = {
  airport: string;
  type: "arr" | "dep";
  code: string;
  datis: string;
  time: string;
  updatedAt: string;
}[];

async function getFlow(): Promise<Flow> {
  try {
    const atis = await fetch("https://atis.info/api/KDFW", {
      cache: "force-cache",
      next: { revalidate: 3600 },
    });

    const response = (await atis.json()) as AtisResponse;
    const arr = response.find((r) => r.type === "arr");
    if (!arr) {
      return DEFAULT_FLOW;
    }

    if (arr.datis.match(/18R|18L|17R|17C|17L/)) {
      return "S";
    } else {
      return "N";
    }
  } catch (e) {
    console.warn((e as Error).message);
    return DEFAULT_FLOW;
  }
}

export async function GET() {
  const flow = await getFlow();

  return Response.json({ flow, wsUrl: process.env.WS_URL });
}
