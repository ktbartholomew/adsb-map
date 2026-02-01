import "server-only";

import { Flow } from "./layers";

const DEFAULT_FLOW: Flow = "S";

type AtisResponse = {
  airport: string;
  type: "arr" | "dep";
  code: string;
  datis: string;
  time: string;
  updatedAt: string;
}[];

export async function getFlow(): Promise<Flow> {
  try {
    console.log("fetching KDFW ATIS");
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
    }

    return "N";
  } catch (e) {
    console.warn((e as Error).message);
    return DEFAULT_FLOW;
  }
}
