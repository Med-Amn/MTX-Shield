"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PlayerRecord } from "@/types";

export default function AdminPlayers() {
  const [players, setPlayers] = useState<PlayerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();

  async function fetchPlayers() {
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/players?${params}`);
    const json = await res.json();
    if (json.success) {
      setPlayers(json.data);
      setTotalPages(json.meta.pages);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchPlayers();
  }, [page, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Players</h2>
          <p className="text-muted font-mono text-sm mt-1">All registered players across servers.</p>
        </div>
        <input
          type="text"
          placeholder="Search name, HWID, IP, license..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="rounded-lg bg-background border border-border px-4 py-2 text-sm font-mono w-80 focus:outline-none focus:border-neon-blue/50"
        />
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-4 font-mono text-xs text-muted font-bold uppercase">Name</th>
                <th className="text-left px-6 py-4 font-mono text-xs text-muted font-bold uppercase">HWID</th>
                <th className="text-left px-6 py-4 font-mono text-xs text-muted font-bold uppercase">IP</th>
                <th className="text-left px-6 py-4 font-mono text-xs text-muted font-bold uppercase">Server</th>
                <th className="text-left px-6 py-4 font-mono text-xs text-muted font-bold uppercase">Status</th>
                <th className="text-left px-6 py-4 font-mono text-xs text-muted font-bold uppercase">Last Seen</th>
                <th className="text-left px-6 py-4 font-mono text-xs text-muted font-bold uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {players.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-muted font-mono">No players found.</td></tr>
              )}
              {players.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface-light/50 transition-colors">
                  <td className="px-6 py-4 font-mono">{p.name ?? "—"}</td>
                  <td className="px-6 py-4 font-mono text-xs text-muted">{p.hwid ? p.hwid.slice(0, 20) + "..." : "—"}</td>
                  <td className="px-6 py-4 font-mono text-xs text-muted">{p.ip ?? "—"}</td>
                  <td className="px-6 py-4 font-mono text-xs text-muted">{p.serverName ?? "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-mono font-bold ${p.isBanned ? "text-neon-red" : "text-neon-green"}`}>
                      {p.isBanned ? "BANNED" : "CLEAN"}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-muted">
                    {new Date(p.lastSeen).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <Button variant="secondary" onClick={() => router.push(`/admin/players/${p.id}`)}>
                      VIEW
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 font-mono text-sm">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="text-muted hover:text-neon-blue disabled:opacity-50">
            PREV
          </button>
          <span className="text-muted">{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="text-muted hover:text-neon-blue disabled:opacity-50">
            NEXT
          </button>
        </div>
      )}
    </div>
  );
}
