import type { User } from "better-auth";
import { SignOutButton } from "./sign-out-button";

export function DashboardHeader({ user }: { user: User }) {
  return (
    <header className="h-16 border-b border-border bg-surface/50 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse-neon" />
        <span className="text-sm font-mono text-muted">System Online</span>
      </div>
      <SignOutButton />
    </header>
  );
}
