"use client";
import { useCallback, useEffect, useRef } from "react";
import { Map, Marker } from "mapbox-gl";

import "mapbox-gl/dist/mapbox-gl.css";
import { TrackData, TrackDataSet } from "../lib/trackdata";
import { addLayers, Flow } from "@/layers";
import { Flight } from "@/flight";

const makeMarker = (
  pos: TrackData,
  flight: Flight | undefined,
  map: Map,
): Marker | void => {
  const opacity = Math.max((130 - (Date.now() - pos.time) / 600) / 100, 0);

  if (pos.longitude && pos.latitude) {
    const el = document.createElement("div");
    el.className = "marker--live w-2 h-2";

    const contact = document.createElement("div");
    contact.className = "outline outline-lime-500 w-full h-full ";
    contact.style.opacity = opacity.toString();
    el.appendChild(contact);

    const line = document.createElement("div");
    line.className =
      "w-[1px] h-[32px] bg-lime-500 absolute left-[50%] bottom-[50%]";
    line.style.opacity = opacity.toString();
    line.style.height = `${(pos.speed ?? 0) / 8}px`;
    line.style.transformOrigin = "bottom left";
    line.style.transform = `rotate(${pos.track}deg)`;
    el.appendChild(line);

    const tag = document.createElement("div");
    tag.className =
      "absolute left-4 top-0 leading-none whitespace-pre text-lime-500 font-mono";
    tag.style.opacity = opacity.toString();
    tag.innerText = makeTag(pos, flight);
    el.appendChild(tag);

    return new Marker(el).setLngLat([pos.longitude, pos.latitude]).addTo(map);
  }
};

function makeTag(pos: TrackData, flight?: Flight): string {
  const callsign = pos.callsign ?? "---";
  const alt = Math.round((pos.altitude ?? 0) / 100)
    .toString(10)
    .padStart(3, "0");

  let vertical = " ";
  if (
    pos.verticalRate &&
    Math.abs(pos.verticalRate) > 100 &&
    pos.verticalRate > 0
  ) {
    vertical = "↑";
  }
  if (
    pos.verticalRate &&
    Math.abs(pos.verticalRate) > 100 &&
    pos.verticalRate < 0
  ) {
    vertical = "↓";
  }

  const locals = ["KDFW", "KDAL", "KFTW", "KAFW"];
  let scratchpad = "    ";
  if (
    flight?.destination?.icao &&
    flight?.origin?.icao &&
    locals.includes(flight.destination.icao)
  ) {
    scratchpad = flight.origin.icao;
  } else if (flight?.destination?.icao) {
    scratchpad = flight.destination.icao;
  }

  return `${callsign}
${alt}${vertical}${pos.speed ?? ""}
${scratchpad} ${flight?.aircraft?.type ?? ""}`;
}

export function RadarMap(props: {
  flow: Flow;
  mapBoxToken: string;
  wsUrl: string;
}) {
  const mapRef = useRef<Map>(undefined);
  const mapContainer = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket>(undefined);
  const flightsRef = useRef<Record<string, Flight>>({});
  const flightRequestsRef = useRef<Set<string>>(new Set());

  const getFlight = useCallback((track: TrackData): Flight | undefined => {
    const callsign = track.callsign;
    if (!callsign) {
      return undefined;
    }

    if (flightsRef.current[callsign]) {
      return flightsRef.current[callsign];
    }

    if (flightRequestsRef.current.has(callsign)) {
      return undefined;
    }

    flightRequestsRef.current.add(callsign);
    fetch(`/api/flight/${encodeURIComponent(callsign)}`)
      .then((resp) => resp.json() as Promise<Flight>)
      .then((flight: Flight) => {
        flightsRef.current[callsign] = flight;
      })
      .catch((e) => {
        console.error(e);
      })
      .finally(() => {
        flightRequestsRef.current.delete(callsign);
      });

    return undefined;
  }, []);

  useEffect(() => {
    if (!props.mapBoxToken) {
      console.error(
        "Missing MAPBOX_TOKEN. Mapbox cannot initialize without it.",
      );
      return;
    }

    mapRef.current = new Map({
      accessToken: props.mapBoxToken,
      container: mapContainer.current || "",
      center: [-97.15842558886997, 32.76027373448455], // starting position [lng, lat]
      projection: "mercator",
      dragRotate: false,
      minZoom: 7,
      zoom: 10,
      style: "mapbox://styles/ktbartholomew/cm99xjido000e01qke7khdtwx",
    });

    mapRef.current.on("load", () => {
      if (mapRef.current) {
        addLayers(mapRef.current, props.flow);

        mapRef.current.addSource("major_runways", {
          type: "vector",
          url: "mapbox://ktbartholomew.cm97v0tse01zi1pjy0ir5t4qy-6c7yd",
        });
        mapRef.current.addLayer({
          id: "major_runways",
          source: "major_runways",
          "source-layer": "major_runways",
          type: "fill",
          paint: {
            "fill-color": "#FFF",
          },
        });
      }
    });

    return () => {
      mapRef.current?.remove();
    };
  }, [props.flow, props.mapBoxToken]);

  useEffect(() => {
    if (!props.wsUrl) {
      return;
    }

    let markers: Marker[] = [];
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let reconnectAttempts = 0;
    let closed = false;
    let paused = false;

    const clearMarkers = () => {
      markers.forEach((m) => {
        m.remove();
      });
      markers = [];
    };

    const scheduleReconnect = () => {
      if (closed || paused || document.visibilityState === "hidden") {
        return;
      }

      const delay = Math.min(1000 * 2 ** reconnectAttempts, 30000);
      reconnectAttempts = Math.min(reconnectAttempts + 1, 5);

      reconnectTimer = setTimeout(() => {
        connect();
      }, delay);
    };

    const onMessage = (ws: WebSocket, ev: MessageEvent<string>) => {
      if (ws !== wsRef.current || !mapRef.current) {
        return;
      }

      let data: Record<string, TrackDataSet>;
      try {
        data = JSON.parse(ev.data) as Record<string, TrackDataSet>;
      } catch (e) {
        console.error(e);
        return;
      }

      clearMarkers();

      for (const key in data) {
        const track = data[key];

        const marker = makeMarker(
          track.latestData,
          getFlight(track.latestData),
          mapRef.current,
        );
        if (marker) {
          markers.push(marker);
        }
      }
    };

    const connect = () => {
      if (closed || paused || document.visibilityState === "hidden") {
        return;
      }

      if (
        wsRef.current &&
        (wsRef.current.readyState === WebSocket.CONNECTING ||
          wsRef.current.readyState === WebSocket.OPEN)
      ) {
        return;
      }

      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = undefined;
      }

      const ws = new WebSocket(props.wsUrl);
      wsRef.current = ws;

      ws.addEventListener("open", () => {
        reconnectAttempts = 0;
      });

      ws.addEventListener("message", (ev) => {
        onMessage(ws, ev);
      });

      ws.addEventListener("close", () => {
        if (wsRef.current === ws) {
          wsRef.current = undefined;
        }
        clearMarkers();
        scheduleReconnect();
      });

      ws.addEventListener("error", () => {
        ws.close();
      });
    };

    const pauseConnection = () => {
      paused = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = undefined;
      }
      wsRef.current?.close();
      wsRef.current = undefined;
      clearMarkers();
    };

    const resumeConnection = () => {
      if (!mapRef.current) {
        return;
      }

      paused = false;
      reconnectAttempts = 0;
      connect();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        pauseConnection();
      } else {
        resumeConnection();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", pauseConnection);
    window.addEventListener("pageshow", resumeConnection);
    connect();

    return () => {
      closed = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", pauseConnection);
      window.removeEventListener("pageshow", resumeConnection);
      wsRef.current?.close();
      wsRef.current = undefined;
      clearMarkers();
    };
  }, [props.wsUrl, getFlight]);

  return (
    <div
      style={{ height: "100%" }}
      className="map-container"
      ref={mapContainer}
    ></div>
  );
}
