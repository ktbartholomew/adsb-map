import { createConnection, Socket } from "node:net";
import WebSocket, { WebSocketServer } from "ws";
import { TrackData, TrackDataSet } from "../lib/trackdata";
import { ok } from "node:assert";

const SECOND = 1000;

class DataStreamer {
  private connection: Socket;

  private tracks: Record<string, TrackDataSet>;

  private allIds: Set<string>;

  constructor(hostport: string) {
    this.tracks = {};
    this.allIds = new Set<string>();

    setInterval(() => {
      const now = Date.now();
      let deleted = 0;
      for (const key in this.tracks) {
        if (this.tracks[key].latestTime.getTime() < now - 60 * SECOND) {
          delete this.tracks[key];
          deleted++;
        }
      }

      console.log(
        `current: ${Object.keys(this.tracks).length} all-time: ${
          this.allIds.size
        } stale: ${deleted}`
      );
    }, 60000);

    this.connection = this.connect(hostport);
  }

  private connect(hostport: string): Socket {
    console.log("streaming ADS-B data from " + hostport);
    this.connection = createConnection({
      host: hostport.split(":")[0],
      port: parseInt(hostport.split(":")[1], 10),
    });

    this.connection.on("data", this.onData.bind(this));
    this.connection.on("close", () => {
      console.log(`connection to ${hostport} closed`);
      this.connect(hostport);
    });
    this.connection.on("error", (e) => {
      console.error(e);
      this.connect(hostport);
    });

    return this.connection;
  }

  private onData(chonk: Buffer) {
    const batchTime = Date.now();
    const chonkstring = chonk.toString();
    const lines = chonkstring.split("\n");

    lines.forEach((l) => {
      if (!l.startsWith("MSG")) {
        return;
      }

      const [
        _type,
        _messageType,
        _sessionId,
        _aircraftId,
        hexId,
        _flightId,
        _dateGenerated,
        _timeGenerated,
        _dateLogged,
        _timeLogged,
        callsign,
        altitude,
        speed,
        track,
        latitude,
        longitude,
        verticalRate,
        squawk,
        _squawkChange,
        _emergency,
        _ident,
        _onGround,
      ] = l.split(",");

      if (!hexId) {
        return;
      }

      const record: TrackData = {
        time: batchTime,
        hexId: hexId,
        callsign: callsign?.trim() || undefined,
        altitude: parseInt(altitude, 10) || undefined,
        speed: parseInt(speed, 10) || undefined,
        track: parseInt(track, 10) || undefined,
        latitude: parseFloat(latitude) || undefined,
        longitude: parseFloat(longitude) || undefined,
        verticalRate: parseInt(verticalRate, 10) || undefined,
        squawk: squawk || undefined,
      };

      if (!this.tracks[record.hexId]) {
        this.allIds.add(record.hexId);
        this.tracks[record.hexId] = {
          latestData: record,
          latestTime: new Date(batchTime),
          data: [],
        };
      }

      this.tracks[record.hexId].latestTime = new Date(batchTime);

      // only store tracks if they contain new position data
      if (
        record.altitude ||
        record.latitude ||
        record.longitude ||
        record.speed ||
        record.track ||
        record.callsign
      ) {
        this.tracks[record.hexId].data.push(record);

        // Merge any newer data from this record into the latest available for the track
        let latest = this.tracks[record.hexId].latestData;
        latest = {
          time: record.time,
          hexId: record.hexId,
          callsign: record.callsign || latest.callsign,
          altitude: record.altitude || latest.altitude,
          speed: record.speed || latest.speed,
          track: record.track || latest.track,
          latitude: record.latitude || latest.latitude,
          longitude: record.longitude || latest.longitude,
          verticalRate: record.verticalRate || latest.verticalRate,
          squawk: record.squawk || latest.squawk,
        };

        this.tracks[record.hexId].latestData = latest;
      }
    });
  }

  getTracks(options: { history?: boolean }) {
    let output = { ...this.tracks };

    if (!options.history) {
      for (const key in output) {
        output[key].data = [];
      }
    }

    return output;
  }

  getTrack(hexId: string, opts: { history?: boolean }) {
    const t = { ...this.tracks[hexId.toUpperCase()] };

    if (!opts.history) {
      t.data = [];
    }

    return t;
  }
}

async function main() {
  ok(process.env.ADSB_HOST, "ADSB_HOST is required");

  const streamer = new DataStreamer(process.env.ADSB_HOST);
  const server = new WebSocketServer({ port: 9000 });

  server.on("connection", (ws, req) => {
    ws.send(JSON.stringify(streamer.getTracks({ history: false })));

    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(streamer.getTracks({ history: false })));
      } else if (ws.readyState === WebSocket.CLOSED) {
        clearInterval(interval);
      }
    }, 1000);
  });
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
