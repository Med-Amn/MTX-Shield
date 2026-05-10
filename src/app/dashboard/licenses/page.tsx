"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { LicenseKeyRecord } from "@/types";

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<LicenseKeyRecord[]>([]);
  const [sub, setSub] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/subscription")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setSub(res.data);
          setLicenses(res.data.licenses ?? []);
        }
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">License Keys</h2>
        <p className="text-muted font-mono text-sm mt-1">
          Your active plan: <span className="text-neon-blue font-bold">{sub?.plan ?? "FREE"}</span>
        </p>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4 font-mono">Your Licenses</h3>
        {licenses.length === 0 && (
          <p className="text-muted font-mono text-sm">No license keys issued yet. Upgrade to PRO or Elite to receive one.</p>
        )}
        <div className="space-y-3">
          {licenses.map((lic) => (
            <div key={lic.id} className="flex items-center justify-between p-4 rounded-lg bg-surface-light border border-border">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <LicenseStatusBadge status={lic.status} />
                  <span className="font-mono text-sm font-bold">{lic.plan}</span>
                </div>
                <p className="font-mono text-xs text-neon-blue break-all">{lic.key}</p>
                <div className="flex gap-4 mt-2 text-[10px] text-muted font-mono">
                  {lic.serverIp && <span>IP: {lic.serverIp}</span>}
                  <span>Issued: {new Date(lic.issuedAt).toLocaleDateString()}</span>
                  <span>Expires: <span className={new Date(lic.expiresAt) < new Date() ? "text-neon-red" : ""}>
                    {new Date(lic.expiresAt).toLocaleDateString()}
                  </span></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4 font-mono">Subscription Details</h3>
        {sub && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg bg-surface-light p-4 text-center">
              <p className="text-2xl font-bold font-mono text-neon-blue">{sub.plan}</p>
              <p className="text-xs text-muted font-mono mt-1">Plan</p>
            </div>
            <div className="rounded-lg bg-surface-light p-4 text-center">
              <p className={`text-2xl font-bold font-mono ${sub.status === "ACTIVE" ? "text-neon-green" : "text-neon-red"}`}>
                {sub.status}
              </p>
              <p className="text-xs text-muted font-mono mt-1">Status</p>
            </div>
            <div className="rounded-lg bg-surface-light p-4 text-center">
              <p className="text-2xl font-bold font-mono text-neon-purple">{sub.interval}</p>
              <p className="text-xs text-muted font-mono mt-1">Billing</p>
            </div>
            <div className="rounded-lg bg-surface-light p-4 text-center">
              <p className="text-2xl font-bold font-mono text-neon-green">
                {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : "—"}
              </p>
              <p className="text-xs text-muted font-mono mt-1">Renewal</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function LicenseStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ACTIVE: "bg-neon-green/10 text-neon-green border-neon-green/30",
    PENDING: "bg-neon-blue/10 text-neon-blue border-neon-blue/30",
    EXPIRED: "bg-neon-red/10 text-neon-red border-neon-red/30",
    CANCELLED: "bg-muted/10 text-muted border-border",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${colors[status] ?? colors.PENDING}`}>
      {status}
    </span>
  );
}
