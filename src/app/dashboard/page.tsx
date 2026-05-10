"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";
import type { DashboardStats } from "@/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setStats(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-2 h-2 rounded-full bg-neon-blue animate-pulse-neon" />
        <div className="w-2 h-2 rounded-full bg-neon-blue animate-pulse-neon ml-2" style={{ animationDelay: "0.2s" }} />
        <div className="w-2 h-2 rounded-full bg-neon-blue animate-pulse-neon ml-2" style={{ animationDelay: "0.4s" }} />
      </div>
    );
  }

  const severityData = stats
    ? Object.entries(stats.detectionsBySeverity).map(([name, value]) => ({
        name,
        detections: value,
      }))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Command Center</h2>
        <p className="text-muted font-mono text-sm mt-1">
          Real-time overview of your anti-cheat network.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Servers"
          value={stats?.totalServers ?? 0}
          icon="⊞"
        />
        <StatCard
          label="Active Bans"
          value={stats?.activeBans ?? 0}
          icon="⊘"
          glow="red"
        />
        <StatCard
          label="Total Detections"
          value={stats?.totalDetections ?? 0}
          icon="⚡"
          glow="blue"
        />
        <StatCard
          label="Detections Today"
          value={stats?.detectionsToday ?? 0}
          icon="◉"
          glow="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4 font-mono">Detections by Severity</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={severityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a3e" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "#0a0a1a",
                  border: "1px solid #1a1a3e",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="detections" fill="#00d4ff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4 font-mono">Recent Detections</h3>
          <div className="space-y-3">
            {stats?.recentDetections.length === 0 && (
              <p className="text-muted font-mono text-sm">No detections yet.</p>
            )}
            {stats?.recentDetections.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <SeverityBadge severity={d.severity} />
                  <span className="text-sm font-mono truncate">
                    {d.detectionType}
                  </span>
                </div>
                <span className="text-xs text-muted font-mono ml-2 shrink-0">
                  {d.serverName ?? d.serverId.slice(0, 8)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  glow,
}: {
  label: string;
  value: number;
  icon: string;
  glow?: "red" | "blue" | "green";
}) {
  return (
    <Card
      glow={glow ?? "none"}
      className="flex items-center gap-4"
    >
      <span className="text-2xl text-neon-blue">{icon}</span>
      <div>
        <p className="text-2xl font-bold font-mono">{value}</p>
        <p className="text-xs text-muted font-mono">{label}</p>
      </div>
    </Card>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    LOW: "bg-neon-blue/10 text-neon-blue border-neon-blue/30",
    MID: "bg-neon-green/10 text-neon-green border-neon-green/30",
    HIGH: "bg-neon-purple/10 text-neon-purple border-neon-purple/30",
    CRIT: "bg-neon-red/10 text-neon-red border-neon-red/30",
  };

  return (
    <span
      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
        colors[severity] ?? colors.LOW
      }`}
    >
      {severity}
    </span>
  );
}
