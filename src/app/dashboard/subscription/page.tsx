"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { SubscriptionInfo, PlanTier } from "@/types";
import { PLAN_LIMITS } from "@/types";

export default function SubscriptionPage() {
  const [sub, setSub] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/subscription")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setSub(res.data);
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

  const plans: { tier: PlanTier; label: string; price: string }[] = [
    { tier: "FREE", label: "Free", price: "Free" },
    { tier: "PRO", label: "PRO", price: "$9.99/mo" },
    { tier: "ELITE", label: "Elite", price: "$24.99/mo" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Subscription</h2>
        <p className="text-muted font-mono text-sm mt-1">
          Your current plan:{" "}
          <span className="text-neon-blue font-bold">{sub?.plan ?? "FREE"}</span>
        </p>
      </div>

      {sub && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold font-mono">Plan Details</h3>
              <p className="text-sm text-muted font-mono mt-1">
                Status:{" "}
                <span
                  className={`font-bold ${
                    sub.status === "ACTIVE" ? "text-neon-green" : "text-neon-red"
                  }`}
                >
                  {sub.status}
                </span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="rounded-lg bg-surface-light p-4 text-center">
              <p className="text-2xl font-bold font-mono text-neon-blue">
                {sub.serversLimit === Infinity ? "∞" : sub.serversLimit}
              </p>
              <p className="text-xs text-muted font-mono mt-1">Server Limit</p>
            </div>
            <div className="rounded-lg bg-surface-light p-4 text-center">
              <p className="text-2xl font-bold font-mono text-neon-green">
                {sub.retentionDays}d
              </p>
              <p className="text-xs text-muted font-mono mt-1">Log Retention</p>
            </div>
            <div className="rounded-lg bg-surface-light p-4 text-center">
              <p className="text-2xl font-bold font-mono text-neon-purple">
                {sub.apiAccess ? "YES" : "NO"}
              </p>
              <p className="text-xs text-muted font-mono mt-1">API Access</p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const limits = PLAN_LIMITS[plan.tier];
          const isCurrent = sub?.plan === plan.tier;
          const isUpgrade =
            plan.tier === "PRO" || plan.tier === "ELITE";

          return (
            <Card
              key={plan.tier}
              glow={isCurrent ? "blue" : "none"}
              className={`${isCurrent ? "border-neon-blue/50" : ""}`}
            >
              <h3 className="text-xl font-bold mb-2">{plan.label}</h3>
              <p className="text-3xl font-bold font-mono mb-6">{plan.price}</p>

              <ul className="space-y-3 mb-8 text-sm font-mono text-muted">
                <li className="flex items-start gap-3">
                  <span className="text-neon-green mt-0.5">&#10003;</span>
                  Server Limit: {limits.serversLimit === Infinity ? "Unlimited" : limits.serversLimit}
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-neon-green mt-0.5">&#10003;</span>
                  Retention: {limits.retentionDays} days
                </li>
                <li className="flex items-start gap-3">
                  <span className={limits.apiAccess ? "text-neon-green mt-0.5" : "text-muted mt-0.5"}>
                    {limits.apiAccess ? "✓" : "✗"}
                  </span>
                  API Access
                </li>
                <li className="flex items-start gap-3">
                  <span className={limits.customRules ? "text-neon-green mt-0.5" : "text-muted mt-0.5"}>
                    {limits.customRules ? "✓" : "✗"}
                  </span>
                  Custom Rules
                </li>
              </ul>

              {isCurrent ? (
                <Button variant="secondary" className="w-full justify-center" disabled>
                  CURRENT PLAN
                </Button>
              ) : isUpgrade ? (
                <Button
                  variant="primary"
                  className="w-full justify-center"
                  onClick={async () => {
                    const res = await fetch("/api/subscription/checkout", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ plan: plan.tier }),
                    });
                    const json = await res.json();
                    if (json.success && json.data?.url) {
                      window.location.href = json.data.url;
                    }
                  }}
                >
                  UPGRADE TO {plan.label}
                </Button>
              ) : null}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
