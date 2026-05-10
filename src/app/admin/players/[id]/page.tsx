"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";

interface PlayerDetail {
  id: string;
  name: string | null;
  hwid: string | null;
  ip: string | null;
  license: string | null;
  steamId: string | null;
  discordId: string | null;
  fivemId: string | null;
  firstSeen: string;
  lastSeen: string;
  serverName: string;
  bans: {
    id: string;
    reason: string;
    isActive: boolean;
    bannedAt: string;
    expiresAt: string | null;
    unbannedAt: string | null;
    serverName: string;
    bannedByName: string;
    proofs: { id: string; type: string; value: string; createdAt: string }[];
  }[];
}

export default function PlayerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [player, setPlayer] = useState<PlayerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/players/${id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setPlayer(res.data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-2 h-2 rounded-full bg-neon-blue animate-pulse-neon" />
        <div className="w-2 h-2 rounded-full bg-neon-blue animate-pulse-neon ml-2" style={{ animationDelay: "0.2s" }} />
        <div className="w-2 h-2 rounded-full bg-neon-blue animate-pulse-neon ml-2" style={{ animationDelay: "0.4s" }} />
      </div>
    );
  }

  if (!player) {
    return <div className="text-center text-muted font-mono mt-12">Player not found.</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold">{player.name ?? "Unknown Player"}</h2>
        <p className="text-muted font-mono text-sm mt-1">Player profile and ban history.</p>
      </div>

      <Card className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-muted font-mono uppercase tracking-wider">HWID</p>
          <p className="font-mono text-sm mt-1">{player.hwid ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted font-mono uppercase tracking-wider">IP</p>
          <p className="font-mono text-sm mt-1">{player.ip ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted font-mono uppercase tracking-wider">License</p>
          <p className="font-mono text-sm mt-1">{player.license ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted font-mono uppercase tracking-wider">Steam ID</p>
          <p className="font-mono text-sm mt-1">{player.steamId ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted font-mono uppercase tracking-wider">Discord ID</p>
          <p className="font-mono text-sm mt-1">{player.discordId ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted font-mono uppercase tracking-wider">FiveM ID</p>
          <p className="font-mono text-sm mt-1">{player.fivemId ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted font-mono uppercase tracking-wider">Server</p>
          <p className="font-mono text-sm mt-1">{player.serverName}</p>
        </div>
        <div>
          <p className="text-xs text-muted font-mono uppercase tracking-wider">First Seen</p>
          <p className="font-mono text-sm mt-1">{new Date(player.firstSeen).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-xs text-muted font-mono uppercase tracking-wider">Last Seen</p>
          <p className="font-mono text-sm mt-1">{new Date(player.lastSeen).toLocaleDateString()}</p>
        </div>
      </Card>

      <div>
        <h3 className="text-lg font-bold mb-4">Ban History ({player.bans.length})</h3>
        <div className="space-y-3">
          {player.bans.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-muted font-mono">No bans recorded for this player.</p>
            </Card>
          )}
          {player.bans.map((ban) => (
            <Card key={ban.id}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${ban.isActive ? "bg-neon-red" : "bg-muted"}`} />
                  <span className={`font-mono text-sm font-bold ${ban.isActive ? "text-neon-red" : "text-muted"}`}>
                    {ban.isActive ? "ACTIVE" : "EXPIRED"}
                  </span>
                </div>
                <span className="text-xs text-muted font-mono">
                  {new Date(ban.bannedAt).toLocaleString()}
                </span>
              </div>

              <p className="font-mono text-sm mb-2">Reason: {ban.reason}</p>
              <p className="text-xs text-muted font-mono mb-3">
                Server: {ban.serverName} &middot; By: {ban.bannedByName}
                {ban.expiresAt && ` &middot; Expires: ${new Date(ban.expiresAt).toLocaleDateString()}`}
                {ban.unbannedAt && ` &middot; Unbanned: ${new Date(ban.unbannedAt).toLocaleDateString()}`}
              </p>

              {ban.proofs.length > 0 && (
                <div className="space-y-2 mt-3">
                  <p className="text-xs text-muted font-mono uppercase tracking-wider">Proofs</p>
                  <div className="flex flex-wrap gap-2">
                    {ban.proofs.map((proof) => (
                      <a
                        key={proof.id}
                        href={proof.value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-surface-light border border-border text-xs font-mono text-neon-blue hover:bg-neon-blue/10 transition-colors"
                      >
                        {proof.type === "IMAGE" ? "🖼" : proof.type === "URL" ? "🔗" : "📄"} {proof.type}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
