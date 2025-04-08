export type TrackData = {
  time: number;
  hexId: string;
  callsign?: string;
  squawk?: string;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  verticalRate?: number;
  speed?: number;
  track?: number;
};

export type TrackDataSet = {
  data: TrackData[];
  latestData: TrackData;
  latestTime: Date;
};
