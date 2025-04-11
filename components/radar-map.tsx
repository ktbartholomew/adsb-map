"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Map, Marker } from "mapbox-gl";

import "mapbox-gl/dist/mapbox-gl.css";
import { TrackData, TrackDataSet } from "../lib/trackdata";
import { addLayers, Flow } from "@/layers";
import { Flight } from "@/flight";

const PUBLIC_MAPBOX_TOKEN =
  "pk.eyJ1Ijoia3RiYXJ0aG9sb21ldyIsImEiOiJjbTk1dTg1MzIwNHcxMnRwczJtengxcjVnIn0.sUHZ0QrRZ7CuIBEtFbuQWA";

const makeMarker = (
  pos: TrackData,
  flight: Flight | undefined,
  map: Map
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

export function RadarMap(props: { flow: Flow }) {
  const mapRef = useRef<Map>(undefined);
  const mapContainer = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket>(undefined);
  const [wsUrl, setWsUrl] = useState("");
  const [flights, setFlights] = useState<Record<string, Flight>>({});

  const getFlight = useMemo(
    () =>
      (track: TrackData): Flight | undefined => {
        if (!track.callsign) {
          return undefined;
        }

        if (flights[track.callsign]) {
          return flights[track.callsign];
        }

        fetch(`/api/flight/${encodeURIComponent(track.callsign)}`)
          .then((resp) => resp.json() as Promise<Flight>)
          .then((flight: Flight) => {
            setFlights((prev) => {
              if (!track.callsign) {
                return prev;
              }

              prev[track.callsign] = flight;
              return prev;
            });
          })
          .catch((e) => {
            console.error(e);
          });

        return undefined;
      },
    [flights]
  );

  useEffect(() => {
    mapRef.current = new Map({
      accessToken: PUBLIC_MAPBOX_TOKEN,
      container: mapContainer.current || "",
      center: [-97.1766223819563, 32.70097504372159], // starting position [lng, lat]
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
            "line-color": "#FFF",
            "fill-color": "#FFF",
          },
        });
      }
    });

    return () => {
      mapRef.current?.remove();
    };
  }, [props.flow]);

  async function fetchConfig() {
    try {
      const resp = await fetch("/api/config");
      const body = (await resp.json()) as { wsUrl: string };

      setWsUrl(body.wsUrl);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    if (!wsUrl) {
      fetchConfig();
      return;
    }

    wsRef.current = new WebSocket(wsUrl);

    let markers: Marker[] = [];

    wsRef.current.addEventListener("message", async (ev) => {
      if (!mapRef.current) {
        return;
      }

      const data = JSON.parse(ev.data) as Record<string, TrackDataSet>;

      markers.forEach((m) => {
        m.remove();
      });
      markers = [];

      for (const key in data) {
        const track = data[key];

        const marker = makeMarker(
          track.latestData,
          await getFlight(track.latestData),
          mapRef.current
        );
        if (marker) {
          markers.push(marker);
        }
      }
    });

    wsRef.current.addEventListener("close", () => {
      markers.forEach((m) => {
        m.remove();
      });
      markers = [];
      setFlights({});
      setWsUrl("");
    });

    return () => {
      wsRef.current?.close();
      markers = [];
      setFlights({});
    };
  }, [wsUrl, getFlight]);

  return (
    <div
      style={{ height: "100%" }}
      className="map-container"
      ref={mapContainer}
    ></div>
  );
}
