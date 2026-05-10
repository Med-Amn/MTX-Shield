import { Card } from "@/components/ui/card";

const features = [
  {
    icon: "🛡",
    title: "Real-Time Detection",
    desc: "Advanced heuristic analysis identifies cheats, exploits, and suspicious behavior as it happens, with millisecond response times.",
  },
  {
    icon: "📊",
    title: "Advanced Analytics",
    desc: "Comprehensive dashboard with live charts, detection trends, player behavior graphs, and exportable reports.",
  },
  {
    icon: "⚡",
    title: "Automated Enforcement",
    desc: "Configurable auto-ban rules, evidence capture, and instant kick/ban/warn actions based on severity thresholds.",
  },
  {
    icon: "🔐",
    title: "License Tracking",
    desc: "Cross-server ban sync via FiveM license hashes, Steam IDs, Discord IDs, and Rockstar identifiers.",
  },
  {
    icon: "🌐",
    title: "Multi-Server Support",
    desc: "Manage your entire server fleet from a single dashboard with unified ban lists and detection feeds.",
  },
  {
    icon: "🔌",
    title: "REST API",
    desc: "Full API access for custom integrations, webhooks, and automated moderation workflows. PRO & Elite tiers.",
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-32 px-4 border-t border-border">
      <div className="absolute inset-0 grid-bg opacity-30" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <span className="font-mono text-xs text-neon-blue tracking-[0.3em] uppercase">Core Capabilities</span>
          <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-4">
            Built for <span className="text-neon-blue">Battle</span>
          </h2>
          <p className="text-muted font-mono max-w-xl mx-auto">
            Every feature engineered to detect, deter, and destroy cheating.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <Card key={f.title} glow="blue">
              <span className="text-3xl mb-4 block">{f.icon}</span>
              <h3 className="text-lg font-bold mb-2 text-foreground">{f.title}</h3>
              <p className="text-sm text-muted font-mono leading-relaxed">{f.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
