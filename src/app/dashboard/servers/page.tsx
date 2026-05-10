"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ServerRecord } from "@/types";

export default function ServersPage() {
  const [servers, setServers] = useState<ServerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [ip, setIp] = useState("");
  const [port, setPort] = useState("30120");

  async function fetchServers() {
    const res = await fetch("/api/servers");
    const json = await res.json();
    if (json.success) setServers(json.data);
    setLoading(false);
  }

  useEffect(() => {
    fetchServers();
  }, []);

  async function addServer(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/servers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, ip, port: Number(port) }),
    });
    const json = await res.json();
    if (json.success) {
      setShowAdd(false);
      setName("");
      setIp("");
      setPort("30120");
      fetchServers();
    }
  }

  async function deleteServer(id: string) {
    await fetch(`/api/servers?id=${id}`, { method: "DELETE" });
    fetchServers();
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
          <h2 className="text-2xl font-bold">Servers</h2>
          <p className="text-muted font-mono text-sm mt-1">
            Manage your protected FiveM servers.
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowAdd(!showAdd)}>
          + ADD SERVER
        </Button>
      </div>

      {showAdd && (
        <Card className="p-6">
          <form onSubmit={addServer} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Server Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded-lg bg-background border border-border px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted focus:outline-none focus:border-neon-blue/50"
            />
            <input
              type="text"
              placeholder="IP Address"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              required
              className="rounded-lg bg-background border border-border px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted focus:outline-none focus:border-neon-blue/50"
            />
            <input
              type="number"
              placeholder="Port"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              required
              className="rounded-lg bg-background border border-border px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted focus:outline-none focus:border-neon-blue/50"
            />
            <Button type="submit" variant="primary" className="justify-center">
              DEPLOY
            </Button>
          </form>
        </Card>
      )}

      <div className="space-y-4">
        {servers.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-muted font-mono">No servers deployed. Add your first server.</p>
          </Card>
        )}
        {servers.map((server) => (
          <Card key={server.id} className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`w-2 h-2 rounded-full ${
                  server.isActive ? "bg-neon-green" : "bg-neon-red"
                }`}
              />
              <div>
                <h3 className="font-bold">{server.name}</h3>
                <p className="text-xs text-muted font-mono">
                  {server.ip}:{server.port} &middot; {server.plan}
                </p>
                <p className="text-[10px] text-muted font-mono mt-1">
                  API Key: {server.apiKey.slice(0, 16)}...
                </p>
              </div>
            </div>
            <Button variant="danger" onClick={() => deleteServer(server.id)}>
              REMOVE
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
