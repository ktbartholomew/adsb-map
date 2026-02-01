import { useEffect, useState } from "react";
import { Flow } from "./layers";

export type ConfigResponse = {
  flow: Flow;
  wsUrl: string;
};

type Query<T = unknown> = {
  data: T;
  expiresAt: Date;
};

const DEFAULT_CONFIG: ConfigResponse = { wsUrl: "", flow: "S" };

async function fetchConfig(): Promise<ConfigResponse> {
  try {
    const resp = await fetch("/api/config");
    const body = (await resp.json()) as ConfigResponse;

    return body;
  } catch (e) {
    console.error(e);
    return DEFAULT_CONFIG;
  }
}

export function useConfig() {
  const [config, setConfig] = useState<Query<ConfigResponse>>({
    expiresAt: new Date(0),
    data: DEFAULT_CONFIG,
  });

  useEffect(() => {
    if (Date.now() <= config.expiresAt.getTime()) {
      return;
    }

    fetchConfig().then((c) => {
      setConfig({ data: c, expiresAt: new Date(Date.now() + 3_600_000) });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return config;
}
