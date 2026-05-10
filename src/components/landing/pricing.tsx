import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const plans = [
  {
    name: "Free",
    price: 0,
    id: "FREE",
    features: ["1 Server", "7-Day Log Retention", "Basic Dashboard", "Community Support"],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "PRO",
    price: 999,
    id: "PRO",
    features: [
      "3 Servers",
      "30-Day Log Retention",
      "Full Dashboard + Charts",
      "API Access",
      "Priority Support",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Elite",
    price: 2499,
    id: "ELITE",
    features: [
      "Unlimited Servers",
      "90-Day Log Retention",
      "Custom Detection Rules",
      "API Access + Webhooks",
      "Dedicated Support",
      "Early Access Features",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative py-32 px-4 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <span className="font-mono text-xs text-neon-purple tracking-[0.3em] uppercase">Pricing</span>
          <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-4">
            Choose Your <span className="text-neon-purple">Armor</span>
          </h2>
          <p className="text-muted font-mono max-w-xl mx-auto">
            Scale from indie server to network empire.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              glow={plan.highlighted ? "blue" : "none"}
              className={`flex flex-col ${plan.highlighted ? "border-neon-blue/50 scale-105" : ""}`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-neon-blue text-background text-xs font-mono font-bold tracking-wider">
                  MOST POPULAR
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold font-mono">
                    {plan.price === 0 ? "Free" : `$${(plan.price / 100).toFixed(0)}`}
                  </span>
                  {plan.price > 0 && <span className="text-muted font-mono text-sm">/month</span>}
                </div>
              </div>

              <ul className="flex-1 space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm font-mono text-muted">
                    <span className="text-neon-green mt-0.5">&#10003;</span>
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.highlighted ? "primary" : "secondary"}
                href={plan.id === "ELITE" ? "mailto:sales@mtxshield.dev" : "/auth/sign-up"}
                className="w-full justify-center"
              >
                {plan.cta}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
