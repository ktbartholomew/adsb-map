"use server";

import { Flight } from "@/flight";

const flights: Record<string, { flight: Flight; expires: number }> = {};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ callsign: string }> }
) {
  const { callsign } = await params;

  if (flights[callsign] && Date.now() < flights[callsign].expires) {
    console.log("returning cached flight data for " + callsign);
    return Response.json(flights[callsign]);
  }

  console.log(`https://www.flightaware.com/live/flight/${callsign}`);
  const resp = await fetch(
    `https://www.flightaware.com/live/flight/${callsign}`
  );
  const body = await resp.text();

  const scripts = body.match(/<script>[\s\S]+?<\/script>/gm);
  if (!scripts) {
    return Response.json({});
  }

  const found = scripts.find((s) =>
    s.match(/var trackpollBootstrap = ([\s\S]+?);/)
  );

  if (found) {
    const match = found.match(/var trackpollBootstrap = ([\s\S]+);<\/script>/m);

    try {
      const trackpollBootstrap = JSON.parse(match?.[1] ?? "{}") as {
        flights: Record<string, unknown>;
      };

      const flight = Object.values(trackpollBootstrap.flights)[0] as Flight;
      flights[callsign] = {
        flight,
        expires: Date.now() + 1000 * 60 * 60,
      };
      return Response.json(flight);
    } catch (e) {
      console.error(e);
    }
  }

  return Response.error();
}
