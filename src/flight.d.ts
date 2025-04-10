export type Flight = {
  aircraft: {
    type: string;
    heavy: boolean;
  };
  destination: {
    coord: [number, number];
    friendlyName: string;
    icao: string;
  };
  origin: {
    coord: [number, number];
    friendlyName: string;
    icao: string;
  };
  flightPlan: { route: string };
};
