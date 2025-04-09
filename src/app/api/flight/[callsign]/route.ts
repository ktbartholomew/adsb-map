"use server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ callsign: string }> }
) {
  const { callsign } = await params;

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

      return Response.json(Object.values(trackpollBootstrap.flights)[0]);
    } catch (e) {
      console.error(e);
    }
  }

  return Response.error();
}
