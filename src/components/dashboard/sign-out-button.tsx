"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/");
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-sm font-mono text-muted hover:text-neon-red transition-colors"
    >
      SIGN OUT
    </button>
  );
}
