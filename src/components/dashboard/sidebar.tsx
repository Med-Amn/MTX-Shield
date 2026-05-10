import type { User } from "better-auth";
import { canViewAdminPanel } from "@/lib/auth-utils";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: "◉" },
  { href: "/dashboard/servers", label: "Servers", icon: "⊞" },
  { href: "/dashboard/bans", label: "Bans", icon: "⊘" },
  { href: "/dashboard/detections", label: "Detections", icon: "⚡" },
  { href: "/dashboard/licenses", label: "Licenses", icon: "◆" },
  { href: "/dashboard/subscription", label: "Subscription", icon: "💰" },
];

export function DashboardSidebar({ user }: { user: User }) {
  return (
    <aside className="w-64 border-r border-border bg-surface flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold">
          <span className="text-neon-blue">MTX</span>
          <span className="text-muted"> SHIELD</span>
        </h1>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-mono text-muted hover:text-neon-blue hover:bg-neon-blue/5 transition-all"
          >
            <span className="text-neon-blue">{item.icon}</span>
            {item.label}
          </a>
        ))}
        {canViewAdminPanel(user as Record<string, unknown>) && (
          <a
            href="/admin"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-mono text-neon-purple hover:bg-neon-purple/5 transition-all mt-4 border-t border-border pt-4"
          >
            <span>🔒</span>
            Admin Panel
          </a>
        )}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-neon-blue/20 flex items-center justify-center text-neon-blue font-mono text-sm">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-mono truncate">{user.name}</p>
            <p className="text-xs text-muted font-mono truncate">{user.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
