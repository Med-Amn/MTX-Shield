"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { BanRecord, ServerRecord, BanProofRecord } from "@/types";

export default function AdminBans() {
  const [bans, setBans] = useState<BanRecord[]>([]);
  const [servers, setServers] = useState<ServerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [serverFilter, setServerFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showBanModal, setShowBanModal] = useState(false);
  const [selectedBan, setSelectedBan] = useState<BanRecord | null>(null);

  // Ban form state
  const [license, setLicense] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [hwid, setHwid] = useState("");
  const [ip, setIp] = useState("");
  const [reason, setReason] = useState("");
  const [serverId, setServerId] = useState("");
  const [proofType, setProofType] = useState<"URL" | "IMAGE" | "LOG">("URL");
  const [proofValue, setProofValue] = useState("");
  const [proofs, setProofs] = useState<{ type: string; value: string }[]>([]);

  async function fetchBans() {
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (search) params.set("search", search);
    if (serverFilter) params.set("serverId", serverFilter);
    if (activeFilter !== "all") params.set("active", activeFilter);

    const [bansRes, serversRes] = await Promise.all([
      fetch(`/api/admin/bans?${params}`),
      fetch("/api/servers"),
    ]);
    const bansJson = await bansRes.json();
    const serversJson = await serversRes.json();
    if (bansJson.success) { setBans(bansJson.data); setTotalPages(bansJson.meta.pages); }
    if (serversJson.success) setServers(serversJson.data);
    setLoading(false);
  }

  useEffect(() => {
    fetchBans();
  }, [page, search, serverFilter, activeFilter]);

  async function addBan(e: React.FormEvent) {
    e.preventDefault();
    const payload: Record<string, unknown> = { license, reason, serverId, playerName, hwid, ip };
    if (proofs.length > 0) payload.proofs = proofs;

    const res = await fetch("/api/admin/bans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.success) {
      setShowBanModal(false);
      resetForm();
      fetchBans();
    }
  }

  async function unban(id: string) {
    await fetch("/api/admin/bans", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchBans();
  }

  function addProof() {
    if (!proofValue) return;
    setProofs([...proofs, { type: proofType, value: proofValue }]);
    setProofValue("");
  }

  function resetForm() {
    setLicense(""); setPlayerName(""); setHwid(""); setIp("");
    setReason(""); setServerId(""); setProofs([]);
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Ban Management</h2>
          <p className="text-muted font-mono text-sm mt-1">Create and manage bans with proof.</p>
        </div>
        <Button variant="danger" onClick={() => setShowBanModal(true)}>+ NEW BAN</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search license, name, HWID, IP..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="rounded-lg bg-background border border-border px-4 py-2 text-sm font-mono w-72 focus:outline-none focus:border-neon-blue/50"
        />
        <select
          value={serverFilter}
          onChange={(e) => { setServerFilter(e.target.value); setPage(1); }}
          className="rounded-lg bg-background border border-border px-4 py-2 text-sm font-mono focus:outline-none focus:border-neon-blue/50"
        >
          <option value="">All Servers</option>
          {servers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select
          value={activeFilter}
          onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}
          className="rounded-lg bg-background border border-border px-4 py-2 text-sm font-mono focus:outline-none focus:border-neon-blue/50"
        >
          <option value="all">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      <div className="space-y-3">
        {bans.length === 0 && (
          <Card className="p-8 text-center"><p className="text-muted font-mono">No bans found.</p></Card>
        )}
        {bans.map((ban) => (
          <Card key={ban.id}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${ban.isActive ? "bg-neon-red" : "bg-muted"}`} />
                  <span className="font-mono font-bold">{ban.playerName ?? ban.license}</span>
                  <SeverityBadge active={ban.isActive} />
                </div>
                <p className="text-sm text-muted font-mono">{ban.reason}</p>
                <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted font-mono">
                  {ban.hwid && <span>HWID: {ban.hwid.slice(0, 20)}...</span>}
                  {ban.ip && <span>IP: {ban.ip}</span>}
                  <span>Server: {ban.serverName}</span>
                  <span>By: {ban.bannedByName}</span>
                  <span>{new Date(ban.bannedAt).toLocaleString()}</span>
                  {ban.expiresAt && <span>Expires: {new Date(ban.expiresAt).toLocaleDateString()}</span>}
                </div>
                {ban.proofs && ban.proofs.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {ban.proofs.map((p) => (
                      <a key={p.id} href={p.value} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-surface-light border border-border text-[10px] font-mono text-neon-blue hover:bg-neon-blue/10">
                        {p.type === "IMAGE" ? "🖼" : p.type === "URL" ? "🔗" : "📄"} View {p.type}
                      </a>
                    ))}
                  </div>
                )}
              </div>
              {ban.isActive && (
                <Button variant="secondary" onClick={() => unban(ban.id)} className="ml-4 shrink-0">UNBAN</Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 font-mono text-sm">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
            className="text-muted hover:text-neon-blue disabled:opacity-50">PREV</button>
          <span className="text-muted">{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            className="text-muted hover:text-neon-blue disabled:opacity-50">NEXT</button>
        </div>
      )}

      {showBanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <Card className="w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">New Ban</h3>
            <form onSubmit={addBan} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="License" value={license} onChange={(e) => setLicense(e.target.value)}
                  required className="col-span-2 rounded-lg bg-background border border-border px-4 py-3 text-sm font-mono focus:outline-none focus:border-neon-blue/50" />
                <input type="text" placeholder="Player Name" value={playerName} onChange={(e) => setPlayerName(e.target.value)}
                  className="rounded-lg bg-background border border-border px-4 py-3 text-sm font-mono focus:outline-none focus:border-neon-blue/50" />
                <input type="text" placeholder="HWID" value={hwid} onChange={(e) => setHwid(e.target.value)}
                  className="rounded-lg bg-background border border-border px-4 py-3 text-sm font-mono focus:outline-none focus:border-neon-blue/50" />
                <input type="text" placeholder="IP" value={ip} onChange={(e) => setIp(e.target.value)}
                  className="rounded-lg bg-background border border-border px-4 py-3 text-sm font-mono focus:outline-none focus:border-neon-blue/50" />
                <select value={serverId} onChange={(e) => setServerId(e.target.value)} required
                  className="rounded-lg bg-background border border-border px-4 py-3 text-sm font-mono focus:outline-none focus:border-neon-blue/50">
                  <option value="">Select Server</option>
                  {servers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <textarea placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} required rows={3}
                className="w-full rounded-lg bg-background border border-border px-4 py-3 text-sm font-mono focus:outline-none focus:border-neon-blue/50" />

              <div className="space-y-2">
                <p className="text-xs text-muted font-mono uppercase tracking-wider">Proof</p>
                <div className="flex gap-2">
                  <select value={proofType} onChange={(e) => setProofType(e.target.value as "URL" | "IMAGE" | "LOG")}
                    className="rounded-lg bg-background border border-border px-3 py-2 text-xs font-mono focus:outline-none">
                    <option value="URL">URL</option>
                    <option value="IMAGE">Image</option>
                    <option value="LOG">Log</option>
                  </select>
                  <input type="text" placeholder="URL or file path" value={proofValue} onChange={(e) => setProofValue(e.target.value)}
                    className="flex-1 rounded-lg bg-background border border-border px-4 py-2 text-sm font-mono focus:outline-none focus:border-neon-blue/50" />
                  <Button variant="secondary" type="button" onClick={addProof}>ADD</Button>
                </div>
                {proofs.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-mono text-muted">
                    <span>[{p.type}]</span>
                    <span className="truncate flex-1">{p.value}</span>
                    <button type="button" onClick={() => setProofs(proofs.filter((_, j) => j !== i))}
                      className="text-neon-red hover:underline">remove</button>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button type="submit" variant="danger" className="flex-1 justify-center">BAN</Button>
                <Button variant="secondary" type="button" onClick={() => { setShowBanModal(false); resetForm(); }}>CANCEL</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

function SeverityBadge({ active }: { active: boolean }) {
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
      active ? "bg-neon-red/10 text-neon-red border-neon-red/30" : "bg-muted/10 text-muted border-border"
    }`}>
      {active ? "ACTIVE" : "INACTIVE"}
    </span>
  );
}
