import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden grid-bg">
      <div className="absolute inset-0 hex-bg opacity-50" />
      <div className="absolute inset-0 scan-line" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-blue/5 rounded-full blur-3xl animate-pulse-neon" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl animate-pulse-neon" style={{ animationDelay: "1s" }} />

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neon-green/30 bg-neon-green/5 mb-8">
          <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse-neon" />
          <span className="font-mono text-xs text-neon-green tracking-widest uppercase">v2.0.0 — Now Available</span>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
          <span className="text-foreground">MTX</span>{" "}
          <span className="glitch-text text-neon-blue">SHIELD</span>
        </h1>

        <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-10 font-mono leading-relaxed">
          Enterprise-grade anti-cheat protection engineered for FiveM.
          <br />
          Real-time detection · Advanced analytics · Zero-compromise security.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button variant="primary" href="/auth/sign-up">
            <span className="text-lg">&#9654;</span> Deploy Now
          </Button>
          <Button variant="secondary" href="#features">
            Explore Features
          </Button>
        </div>

        <div className="mt-16 flex items-center justify-center gap-8 text-sm font-mono text-muted">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse-neon" />
            <span>10,000+ Protected Servers</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-neon-blue animate-pulse-neon" style={{ animationDelay: "0.5s" }} />
            <span>99.9% Detection Rate</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-neon-purple animate-pulse-neon" style={{ animationDelay: "1s" }} />
            <span>Millions of Players Scanned</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <span className="font-mono text-xs text-muted">SCROLL TO EXPLORE</span>
        <div className="w-5 h-8 rounded-full border border-border flex items-start justify-center p-1.5">
          <div className="w-1 h-2 rounded-full bg-neon-blue animate-bounce" />
        </div>
      </div>
    </section>
  );
}
