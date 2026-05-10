export function Footer() {
  return (
    <footer className="border-t border-border py-12 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-2">
          <span className="text-neon-blue font-bold text-lg font-mono">MTX</span>
          <span className="text-muted font-mono">SHIELD</span>
        </div>

        <div className="flex items-center gap-6 text-sm font-mono text-muted">
          <a href="#features" className="hover:text-neon-blue transition-colors">Features</a>
          <a href="#pricing" className="hover:text-neon-blue transition-colors">Pricing</a>
          <a href="#" className="hover:text-neon-blue transition-colors">Documentation</a>
          <a href="#" className="hover:text-neon-blue transition-colors">API</a>
        </div>

        <div className="text-xs font-mono text-muted">
          &copy; {new Date().getFullYear()} MTX SHIELD. All systems active.
        </div>
      </div>
    </footer>
  );
}
