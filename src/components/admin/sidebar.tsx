import type { User } from "better-auth";
import { hasAccess } from "@/lib/auth-utils";
import type { UserRole } from "@/types";

const navItems = [
  { href: "/admin", label: "Overview", icon: "◉", minRole: "MODERATOR" },
  { href: "/admin/players", label: "Players", icon: "👤", minRole: "MODERATOR" },
  { href: "/admin/bans", label: "Bans", icon: "⊘", minRole: "MODERATOR" },
  { href: "/admin/settings", label: "Settings", icon: "⚙", minRole: "SUPER_ADMIN" },
] as const;

export function AdminSidebar({
  user,
  role,
}: {
  user: User;
  role: string;
}) {
  return (
    <aside className="w-64 border-r border-border bg-surface flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold">
          <span className="text-neon-blue">MTX</span>
          <span className="text-xs text-muted ml-2">ADMIN</span>
        </h1>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems
          .filter((item) => hasAccess(role, item.minRole as UserRole))
          .map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-mono text-muted hover:text-neon-blue hover:bg-neon-blue/5 transition-all"
            >
              <span className="text-neon-blue">{item.icon}</span>
              {item.label}
            </a>
          ))}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-neon-purple/20 flex items-center justify-center text-neon-purple font-mono text-sm">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-mono truncate">{user.name}</p>
            <p className="text-xs text-neon-purple font-mono">{role}</p>
          </div>
        </div>
        <a
          href="/dashboard"
          className="block mt-2 px-4 py-2 text-xs font-mono text-muted hover:text-neon-blue transition-colors"
        >
          &larr; Back to Dashboard
        </a>
      </div>
    </aside>
  );
}
