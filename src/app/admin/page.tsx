"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

export default function AdminOverview() {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
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

  const cards = [
    { label: "Total Players", value: stats?.totalPlayers ?? 0, icon: "👤", color: "text-neon-blue" },
    { label: "Total Bans", value: stats?.totalBans ?? 0, icon: "⊘", color: "text-neon-red" },
    { label: "Active Bans", value: stats?.activeBans ?? 0, icon: "🔴", color: "text-neon-red" },
    { label: "Detections Today", value: stats?.detectionsToday ?? 0, icon: "⚡", color: "text-neon-green" },
    { label: "Servers", value: stats?.totalServers ?? 0, icon: "⊞", color: "text-neon-blue" },
    { label: "Licenses Issued", value: stats?.totalLicenses ?? 0, icon: "◆", color: "text-neon-purple" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Admin Overview</h2>
        <p className="text-muted font-mono text-sm mt-1">Global system statistics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Card key={card.label} className="flex items-center gap-4">
            <span className={`text-2xl ${card.color}`}>{card.icon}</span>
            <div>
              <p className="text-2xl font-bold font-mono">{card.value}</p>
              <p className="text-xs text-muted font-mono">{card.label}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
