"use client";
import { useEffect, useRef, useState } from "react";
import { Map, Marker } from "mapbox-gl";

import "mapbox-gl/dist/mapbox-gl.css";
import { TrackData, TrackDataSet } from "../lib/trackdata";
import { addLayers } from "@/layers";

const makeMarker = (pos: TrackData, map: Map): Marker | void => {
  if (pos.longitude && pos.latitude) {
    const el = document.createElement("div");
    el.className = "marker--live outline outline-lime-500 w-2 h-2";

    const line = document.createElement("div");
    line.className =
      "w-[1px] h-[32px] bg-lime-500 absolute left-[50%] bottom-[50%]";
    line.style.height = `${(pos.speed ?? 0) / 8}px`;
    line.style.transformOrigin = "bottom left";
    line.style.transform = `rotate(${pos.track}deg)`;
    el.appendChild(line);

    const tag = document.createElement("div");
    tag.className =
      "absolute left-4 top-0 leading-none whitespace-nowrap text-lime-500 font-mono";
    tag.innerText = `${pos.callsign ?? "---"}\n${Math.round(
      (pos.altitude ?? 0) / 100
    )
      .toString(10)
      .padStart(3, "0")}${
      pos.verticalRate ? (pos.verticalRate > 0 ? "↑" : "↓") : ""
    } ${pos.speed ?? ""}\n${pos.squawk ?? ""}`;
    el.appendChild(tag);

    return new Marker(el).setLngLat([pos.longitude, pos.latitude]).addTo(map);
  }
};

export function RadarMap() {
  const mapRef = useRef<Map>(undefined);
  const mapContainer = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket>(undefined);
  const [wsUrl, setWsUrl] = useState("");

  useEffect(() => {
    mapRef.current = new Map({
      accessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
      container: mapContainer.current || "",
      center: [-97.1766223819563, 32.70097504372159], // starting position [lng, lat]
      projection: "mercator",
      dragRotate: false,
      minZoom: 7,
      zoom: 10,
      // style: "mapbox://styles/ktbartholomew/cm95uquvl00b901qu1d9kf3lj",
      style: "mapbox://styles/mapbox/dark-v11",
    });

    mapRef.current.on("load", () => {
      if (mapRef.current) {
        addLayers(mapRef.current);
      }
    });
  }, []);

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

    wsRef.current.addEventListener("message", (ev) => {
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

        const marker = makeMarker(track.latestData, mapRef.current);
        if (marker) {
          markers.push(marker);
        }
      }
    });

    wsRef.current.addEventListener("close", () => {
      setWsUrl("");
    });

    return () => {
      wsRef.current?.close();
    };
  }, [wsUrl]);

  return (
    <div
      style={{ height: "100%" }}
      className="map-container"
      ref={mapContainer}
    ></div>
  );
}
