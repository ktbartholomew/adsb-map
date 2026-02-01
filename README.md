# ADS-B Map

A real-time, radar-style map that visualizes aircraft tracks from ADS-B data. The frontend is a Next.js app that connects over WebSocket to a separate service that streams decoded position updates.

## What’s in this repo

- `src/` — Next.js app (UI + API routes).
- `components/` — React components for the map and controls.
- `datasocket/` — WebSocket service that reads ADS-B frames over TCP and streams aircraft positions to the frontend.

## Architecture overview

1. `datasocket` connects to a TCP ADS-B feed and decodes frames.
2. `datasocket` publishes decoded position updates over WebSocket.
3. The Next.js frontend connects to that WebSocket and renders live tracks.

## Data sources

`datasocket` reads ADS-B frames from a TCP source, like the TCP output of `dump1090` (https://github.com/antirez/dump1090), which provides a feed of raw frames. You can run `dump1090` locally or remotely and point `datasocket` at it using `ADSB_HOST`.

Setting up an ADS-B receiver is out of scope for this repo, but there are many guides online. Hardware suggestions:

- RTL-SDR dongle for general-purpose SDR hacking (https://www.rtl-sdr.com/)
- ADSBExchange kit (https://store.adsbexchange.com/)

The `GET /api/flight/<callsign>` endpoint scrapes aircraft details from FlightAware to enrich the UI. This likely violates FlightAware’s Terms of Service and should only be used for personal, experimental, fair-use purposes. If you abuse it, expect rate limits or outright denial. If you need production or commercial data, use an official API.

Links to radio feeds in the UI are provided by LiveATC (https://www.liveatc.net/) and remain their property. Use them only in a limited personal/experimental capacity and follow their terms.

## Configuration

### Environment variables

These are read at runtime by the Next.js server; you can build without them and set them when starting the app/container.

- `WS_URL` — WebSocket URL that the frontend should connect to for live data (the `datasocket` service).
- `ADSB_HOST` — TCP host (and optional port) that `datasocket` should connect to for raw ADS-B frames (typically `dump1090`, often on port 30002).
- `MAPBOX_TOKEN` — Public Mapbox access token used by the frontend.

Example `datasocket/.env`:

```
ADSB_HOST=127.0.0.1:30002
```

Example `/.env.local` for the Next.js app:

```
MAPBOX_TOKEN=pk...
WS_URL=ws://127.0.0.1:8787
```

## Running locally (step by step)

1. Install dependencies:

```
npm install
```

2. Make sure you have an ADS-B TCP feed available (usually `dump1090` running somewhere). If you’re not running one locally, point `ADSB_HOST` at a remote instance you control.

3. Configure the `datasocket` service:

```
ADSB_HOST=127.0.0.1:30002
```

4. Build and start `datasocket`:

```
npm run socket:build
ADSB_HOST=127.0.0.1:30002 npm run socket:start
```

5. Configure the frontend:

```
MAPBOX_TOKEN=pk...
WS_URL=ws://127.0.0.1:8787
```

6. Start the frontend:

```
npm run dev
```

7. Open http://localhost:3000.

## Mapbox token guidance

The map uses Mapbox GL in the browser. Use a public token and lock it down with URL restrictions in your Mapbox account. Do not ship a secret token to the client.

Recommended setup:

- Create a public token in Mapbox.
- Restrict it to your dev/prod domains.
- Set it in `MAPBOX_TOKEN`.
