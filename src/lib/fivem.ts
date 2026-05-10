import logger from "./logger";

interface FiveMPlayer {
  id: number;
  name: string;
  identifiers: string[];
  ping: number;
}

interface FiveMServerInfo {
  resources: string[];
  server: string;
  version: number;
  vars: Record<string, string>;
}

export async function queryFiveMServer(
  ip: string,
  port: number
): Promise<{
  online: boolean;
  players?: FiveMPlayer[];
  playerCount?: number;
  maxPlayers?: number;
  serverInfo?: FiveMServerInfo;
}> {
  const baseUrl = `http://${ip}:${port}`;
  try {
    const [playersRes, infoRes] = await Promise.all([
      fetch(`${baseUrl}/players.json`, { signal: AbortSignal.timeout(5000) }),
      fetch(`${baseUrl}/info.json`, { signal: AbortSignal.timeout(5000) }),
    ]);
    if (!playersRes.ok || !infoRes.ok) {
      return { online: false };
    }
    const players: FiveMPlayer[] = await playersRes.json();
    const info: FiveMServerInfo = await infoRes.json();
    return {
      online: true,
      players,
      playerCount: players.length,
      maxPlayers: info.vars?.sv_maxClients
        ? parseInt(info.vars.sv_maxClients, 10)
        : 32,
      serverInfo: info,
    };
  } catch (err) {
    logger.warn({ err, ip, port }, "FiveM server query failed");
    return { online: false };
  }
}
