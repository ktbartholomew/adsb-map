import { Map, PaintSpecification } from "mapbox-gl";
import { Position } from "geojson";

const styles: Record<string, PaintSpecification> = {
  iap: {
    "line-opacity": 0.5,
    "line-color": "#FFF",
    "line-width": 1,
    "line-dasharray": [2, 2],
  },
  star: {
    "line-opacity": 0.5,
    "line-color": "#FFF",
    "line-width": 1,
    "line-dasharray": [6, 6],
  },
};

const paths: Record<string, { type: "iap" | "star"; coordinates: Position[] }> =
  {
    "36L": {
      type: "iap",
      coordinates: [
        [-97.05631388888888, 32.5933],
        [-97.05604166666666, 32.64590555555556],
        [-97.05549444444443, 32.750902777777775],
        [-97.05528333333334, 32.79179722222222],
        [-97.05495555555555, 32.855608333333336],
      ],
    },
    "35C": {
      type: "iap",
      coordinates: [
        [-97.02770277777778, 32.59319722222222],
        [-97.02742222222223, 32.6458],
        [-97.02685833333334, 32.75083055555555],
        [-97.02658888888888, 32.80134722222222],
        [-97.02768055555555, 32.87614444444444],
      ],
    },
    "35R": {
      type: "iap",
      coordinates: [
        [-97.01147777777778, 32.59313055555556],
        [-97.01119444444444, 32.644149999999996],
        [-97.01060833333334, 32.74935833333333],
        [-97.01036666666667, 32.79277777777778],
        [-97.01119444444444, 32.87186666666667],
      ],
    },
    JOVEM: {
      type: "star",
      coordinates: [
        [-97.64171111111112, 33.3839],
        [-97.5176, 33.27838888888889],
        [-97.33484999999999, 33.12219722222222],
        [-97.17081111111112, 32.98148055555556],
        [-97.16080000000001, 32.799477777777774],
        [-97.16080000000001, 32.594008333333335],
      ],
    },
    SOCKK: {
      type: "star",
      coordinates: [
        [-97.62483888888889, 32.382600000000004],
        [-97.51728333333334, 32.47698333333334],
        [-97.28223333333334, 32.499125],
      ],
    },
  };

export function addLayers(map: Map) {
  for (const key in paths) {
    map.addSource(key, {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: paths[key].coordinates,
        },
      },
    });

    map.addLayer({
      id: key,
      type: "line",
      source: key,
      layout: {
        "line-join": "round",
        "line-cap": "butt",
      },
      paint: styles[paths[key].type],
    });
  }
}
