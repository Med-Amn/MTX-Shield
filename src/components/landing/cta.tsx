import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="relative py-32 px-4 border-t border-border">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-blue/3 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-6">
          Ready to{" "}
          <span className="text-neon-blue glitch-text">Eliminate</span> Cheating?
        </h2>
        <p className="text-muted font-mono text-lg mb-10 max-w-xl mx-auto">
          Join thousands of server owners who trust MTX SHIELD to protect their communities.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button variant="primary" href="/auth/sign-up">
            Deploy Free — No Credit Card
          </Button>
          <Button variant="secondary">
            Join Discord
          </Button>
        </div>
      </div>
    </section>
  );
}
