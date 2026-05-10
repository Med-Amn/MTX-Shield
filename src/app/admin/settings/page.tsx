"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PricingPlanRecord } from "@/types";

export default function AdminSettings() {
  const [pricing, setPricing] = useState<PricingPlanRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/pricing")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setPricing(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  async function updatePrice(plan: string, interval: string, price: number) {
    const res = await fetch("/api/admin/pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, interval, price, isActive: true }),
    });
    const json = await res.json();
    if (json.success) {
      setPricing((prev) =>
        prev.map((p) =>
          p.plan === plan && p.interval === interval ? json.data : p
        )
      );
    }
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
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold">Admin Settings</h2>
        <p className="text-muted font-mono text-sm mt-1">Manage pricing and system configuration.</p>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">Pricing Plans</h3>
        <p className="text-xs text-muted font-mono mb-4">Prices are in USD cents. Restart Stripe sync after changes.</p>
        <div className="space-y-4">
          {pricing.map((plan) => (
            <PricingRow
              key={`${plan.plan}-${plan.interval}`}
              plan={plan}
              onSave={updatePrice}
            />
          ))}
          {pricing.length === 0 && (
            <p className="text-muted font-mono text-sm">No pricing plans configured. Run seed data.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

function PricingRow({
  plan,
  onSave,
}: {
  plan: PricingPlanRecord;
  onSave: (plan: string, interval: string, price: number) => void;
}) {
  const [price, setPrice] = useState(String(plan.price));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave(plan.plan, plan.interval, parseInt(price, 10) || 0);
    setSaving(false);
  }

  const displayName = `${plan.plan} ${plan.interval === "MONTHLY" ? "Monthly" : "Yearly"}`;

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-surface-light">
      <div className="flex-1">
        <p className="font-mono text-sm font-bold">{displayName}</p>
        <p className="text-[10px] text-muted font-mono">ID: {plan.id.slice(0, 8)}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted font-mono">$</span>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-24 rounded-lg bg-background border border-border px-3 py-2 text-sm font-mono text-center focus:outline-none focus:border-neon-blue/50"
        />
        <span className="text-xs text-muted font-mono">cents</span>
      </div>
      <Button variant="primary" onClick={handleSave} disabled={saving}>
        {saving ? "..." : "SAVE"}
      </Button>
    </div>
  );
}
