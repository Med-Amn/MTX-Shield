"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import type { DetectionEvent } from "@/types";

const severityColors: Record<string, string> = {
  LOW: "text-neon-blue",
  MID: "text-neon-green",
  HIGH: "text-neon-purple",
  CRIT: "text-neon-red",
};

export default function DetectionsPage() {
  const [detections, setDetections] = useState<DetectionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const url = filter ? `/api/detections?severity=${filter}` : "/api/detections";
    fetch(url)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setDetections(res.data);
      })
      .finally(() => setLoading(false));
  }, [filter]);

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
          <h2 className="text-2xl font-bold">Detection Log</h2>
          <p className="text-muted font-mono text-sm mt-1">
            Live feed of all anti-cheat detections.
          </p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg bg-background border border-border px-4 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-neon-blue/50"
        >
          <option value="">All Severities</option>
          <option value="LOW">LOW</option>
          <option value="MID">MID</option>
          <option value="HIGH">HIGH</option>
          <option value="CRIT">CRIT</option>
        </select>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-4 font-mono text-xs text-muted font-bold uppercase tracking-wider">
                  Severity
                </th>
                <th className="text-left px-6 py-4 font-mono text-xs text-muted font-bold uppercase tracking-wider">
                  Type
                </th>
                <th className="text-left px-6 py-4 font-mono text-xs text-muted font-bold uppercase tracking-wider">
                  Player
                </th>
                <th className="text-left px-6 py-4 font-mono text-xs text-muted font-bold uppercase tracking-wider">
                  Server
                </th>
                <th className="text-left px-6 py-4 font-mono text-xs text-muted font-bold uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {detections.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted font-mono">
                    No detections recorded.
                  </td>
                </tr>
              )}
              {detections.map((d) => (
                <tr key={d.id} className="border-b border-border last:border-0 hover:bg-surface-light/50 transition-colors">
                  <td className="px-6 py-4">
                    <span
                      className={`font-mono text-xs font-bold ${
                        severityColors[d.severity] ?? "text-muted"
                      }`}
                    >
                      {d.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono">{d.detectionType}</td>
                  <td className="px-6 py-4 font-mono text-xs text-muted">
                    {d.playerLicense.slice(0, 24)}...
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-muted">
                    {d.serverName ?? d.serverId.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-muted">
                    {new Date(d.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
