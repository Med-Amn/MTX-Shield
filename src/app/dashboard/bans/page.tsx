"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { BanRecord, ServerRecord } from "@/types";

export default function BansPage() {
  const [bans, setBans] = useState<BanRecord[]>([]);
  const [servers, setServers] = useState<ServerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");

  const [license, setLicense] = useState("");
  const [reason, setReason] = useState("");
  const [serverId, setServerId] = useState("");

  async function fetchBans() {
    const url = search ? `/api/bans?search=${encodeURIComponent(search)}` : "/api/bans";
    const [bansRes, serversRes] = await Promise.all([
      fetch(url),
      fetch("/api/servers"),
    ]);
    const bansJson = await bansRes.json();
    const serversJson = await serversRes.json();
    if (bansJson.success) setBans(bansJson.data);
    if (serversJson.success) setServers(serversJson.data);
    setLoading(false);
  }

  useEffect(() => {
    fetchBans();
  }, [search]);

  async function addBan(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/bans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ license, reason, serverId }),
    });
    const json = await res.json();
    if (json.success) {
      setShowAdd(false);
      setLicense("");
      setReason("");
      setServerId("");
      fetchBans();
    }
  }

  async function unban(id: string) {
    await fetch("/api/bans", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchBans();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-2 h-2 rounded-full bg-neon-blue animate-pulse-neon" />
        <div className="w-2 h-2 rounded-full bg-neon-blue animate-pulse-neon ml-2" style={{ animationDelay: "0.2s" }} />
        <div className="w-2 h-2 rounded-full bg-neon-blue animate-pulse-neon ml-2" style={{ animationDelay: "0.4s" }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bans</h2>
          <p className="text-muted font-mono text-sm mt-1">
            Manage banned players across your servers.
          </p>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search license or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg bg-background border border-border px-4 py-2 text-sm font-mono text-foreground placeholder:text-muted focus:outline-none focus:border-neon-blue/50 w-64"
          />
          <Button variant="primary" onClick={() => setShowAdd(!showAdd)}>
            + BAN PLAYER
          </Button>
        </div>
      </div>

      {showAdd && (
        <Card className="p-6">
          <form onSubmit={addBan} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="License Identifier"
              value={license}
              onChange={(e) => setLicense(e.target.value)}
              required
              className="rounded-lg bg-background border border-border px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted focus:outline-none focus:border-neon-blue/50"
            />
            <input
              type="text"
              placeholder="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="rounded-lg bg-background border border-border px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted focus:outline-none focus:border-neon-blue/50"
            />
            <select
              value={serverId}
              onChange={(e) => setServerId(e.target.value)}
              required
              className="rounded-lg bg-background border border-border px-4 py-3 text-sm font-mono text-foreground focus:outline-none focus:border-neon-blue/50"
            >
              <option value="">Select Server</option>
              {servers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <Button type="submit" variant="danger" className="justify-center">
              BAN
            </Button>
          </form>
        </Card>
      )}

      <div className="space-y-3">
        {bans.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-muted font-mono">No bans recorded. Clean server.</p>
          </Card>
        )}
        {bans.map((ban) => (
          <Card key={ban.id} className="flex items-center justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${
                  ban.isActive ? "bg-neon-red" : "bg-muted"
                }`}
              />
              <div className="min-w-0">
                <p className="font-mono text-sm truncate">{ban.license}</p>
                <p className="text-xs text-muted font-mono truncate">{ban.reason}</p>
                <p className="text-[10px] text-muted font-mono mt-0.5">
                  {ban.serverName} &middot;{" "}
                  {new Date(ban.bannedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            {ban.isActive && (
              <Button variant="secondary" onClick={() => unban(ban.id)}>
                UNBAN
              </Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
